#!/usr/bin/env node
/**
 * validate-plugin.mjs — integrity checker for the BFSI Claude toolkit.
 *
 * What it checks (each is independent — script keeps going on failures and
 * exits non-zero if ANY check failed, so CI sees the full report in one run):
 *
 *   1. plugin.json is parseable and has the required shape
 *   2. Each `components.<kind>` path exists
 *   3. Every skill directory has a SKILL.md with parseable YAML frontmatter
 *      (required: name, description)
 *   4. Every agent .md has parseable frontmatter (required: name, description)
 *   5. Every command .md has parseable frontmatter (required: name, description)
 *   6. hooks/hooks.json is valid JSON
 *   7. Every hook script referenced by hooks.json exists and is executable
 *   8. Every agent name dispatched by `bfsi-pr-reviewer.md` exists in agents/
 *      (catches the orchestrator-dispatch-to-missing-agent class of bug)
 *   9. Every skill name routed by `bfsi-scaffold.md` exists in skills/
 *  10. README skill/agent/hook counts in the count tables match disk reality
 *
 * Usage: node packages/claude-toolkit/scripts/validate-plugin.mjs
 * Exit: 0 if everything passes; 1 if any check failed.
 *
 * No npm deps — only node built-ins, so this runs in any environment.
 * Compatible with Node >= 12 (no `?.`, `??`, or `String.prototype.replaceAll`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOOLKIT_ROOT = path.resolve(__dirname, '..');

const results = [];

function record(label, ok, detail) {
  results.push({ label, ok, detail: detail || '' });
}

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function readFile(p) {
  return fs.readFileSync(p, 'utf8');
}

function readJson(p) {
  return JSON.parse(readFile(p));
}

function replaceAll(s, find, replace) {
  return s.split(find).join(replace);
}

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) {
    return null;
  }
  const out = {};
  for (const rawLine of m[1].split('\n')) {
    const line = rawLine.trimEnd();
    if (!line) {
      continue;
    }
    const idx = line.indexOf(':');
    if (idx === -1) {
      continue;
    }
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    }
    out[key] = value;
  }
  return out;
}

let plugin = null;
const pluginPath = path.join(TOOLKIT_ROOT, 'plugin.json');
try {
  plugin = readJson(pluginPath);
  const required = ['name', 'version', 'description', 'components'];
  const missing = required.filter((k) => !(k in plugin));
  if (missing.length) {
    record('plugin.json shape', false, `missing keys: ${missing.join(', ')}`);
  } else {
    record('plugin.json shape', true, `v${plugin.version}, name=${plugin.name}`);
  }
} catch (e) {
  record('plugin.json shape', false, `parse error: ${e.message}`);
}

if (plugin && plugin.components) {
  for (const [kind, relPath] of Object.entries(plugin.components)) {
    const abs = path.join(TOOLKIT_ROOT, relPath);
    record(`components.${kind} path`, exists(abs), abs);
  }
}

const skillsDir = path.join(TOOLKIT_ROOT, 'skills');
const skillNames = new Set();
if (exists(skillsDir)) {
  for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const skillMd = path.join(skillsDir, entry.name, 'SKILL.md');
    if (!exists(skillMd)) {
      record(`skill ${entry.name}`, false, 'SKILL.md missing');
      continue;
    }
    const fm = parseFrontmatter(readFile(skillMd));
    if (!fm) {
      record(`skill ${entry.name}`, false, 'no YAML frontmatter');
    } else if (!fm.name || !fm.description) {
      record(`skill ${entry.name}`, false, 'frontmatter missing name/description');
    } else if (fm.name !== entry.name) {
      record(`skill ${entry.name}`, false, `frontmatter name="${fm.name}" doesn't match directory`);
    } else {
      skillNames.add(entry.name);
      const desc = fm.description ? fm.description.slice(0, 60) : '';
      record(`skill ${entry.name}`, true, desc);
    }
  }
}

const agentsDir = path.join(TOOLKIT_ROOT, 'agents');
const agentNames = new Set();
if (exists(agentsDir)) {
  for (const f of fs.readdirSync(agentsDir)) {
    if (!f.endsWith('.md')) {
      continue;
    }
    const fm = parseFrontmatter(readFile(path.join(agentsDir, f)));
    const expected = f.replace(/\.md$/, '');
    if (!fm) {
      record(`agent ${expected}`, false, 'no frontmatter');
    } else if (!fm.name || !fm.description) {
      record(`agent ${expected}`, false, 'frontmatter missing name/description');
    } else if (fm.name !== expected) {
      record(`agent ${expected}`, false, `frontmatter name="${fm.name}" doesn't match filename`);
    } else {
      agentNames.add(expected);
      record(`agent ${expected}`, true, `model=${fm.model || 'inherited'}`);
    }
  }
}

const commandsDir = path.join(TOOLKIT_ROOT, 'commands');
const commandNames = new Set();
if (exists(commandsDir)) {
  for (const f of fs.readdirSync(commandsDir)) {
    if (!f.endsWith('.md')) {
      continue;
    }
    const fm = parseFrontmatter(readFile(path.join(commandsDir, f)));
    const expected = f.replace(/\.md$/, '');
    if (!fm || !fm.name || !fm.description) {
      record(`command ${expected}`, false, 'frontmatter missing');
    } else {
      commandNames.add(expected);
      record(`command ${expected}`, true, '');
    }
  }
}

const hooksJsonPath = path.join(TOOLKIT_ROOT, 'hooks', 'hooks.json');
let hooksJson = null;
try {
  hooksJson = readJson(hooksJsonPath);
  record('hooks.json parses', true, '');
} catch (e) {
  record('hooks.json parses', false, e.message);
}

if (hooksJson && hooksJson.hooks) {
  const scriptRefs = new Set();
  const walk = (node) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
    } else if (node && typeof node === 'object') {
      if (typeof node.command === 'string' && node.type === 'command') {
        scriptRefs.add(node.command);
      }
      Object.values(node).forEach(walk);
    }
  };
  walk(hooksJson.hooks);
  for (const ref of scriptRefs) {
    const resolved = replaceAll(ref, '${CLAUDE_PLUGIN_ROOT}', TOOLKIT_ROOT);
    if (!exists(resolved)) {
      record('hook script referenced', false, `${ref} (resolved to ${resolved})`);
      continue;
    }
    try {
      const st = fs.statSync(resolved);
      const isExec = (st.mode & 0o100) !== 0;
      if (!isExec && process.platform !== 'win32') {
        record('hook script exec bit', false, `${ref} is not executable`);
      } else {
        record('hook script', true, path.basename(resolved));
      }
    } catch (e) {
      record('hook script stat', false, `${ref}: ${e.message}`);
    }
  }
}

const prReviewerPath = path.join(agentsDir, 'bfsi-pr-reviewer.md');
if (exists(prReviewerPath)) {
  const body = readFile(prReviewerPath);
  const re = /bfsi-[a-z0-9-]+(?:-reviewer|-scanner|-auditor|-writer|-architect|-planner)/g;
  const matched = body.match(re) || [];
  const referenced = new Set(matched);
  referenced.delete('bfsi-pr-reviewer');
  for (const name of referenced) {
    if (agentNames.has(name)) {
      record(`bfsi-pr-reviewer references agent ${name}`, true, '');
    } else {
      record(`bfsi-pr-reviewer references agent ${name}`, false, 'agent file missing');
    }
  }
}

const scaffoldPath = path.join(commandsDir, 'bfsi-scaffold.md');
if (exists(scaffoldPath)) {
  const body = readFile(scaffoldPath);
  const re = /invoke skill `(bfsi-[a-z0-9-]+)`/g;
  const referenced = new Set();
  let m;
  while ((m = re.exec(body)) !== null) {
    referenced.add(m[1]);
  }
  for (const name of referenced) {
    if (skillNames.has(name)) {
      record(`bfsi-scaffold routes to skill ${name}`, true, '');
    } else {
      record(`bfsi-scaffold routes to skill ${name}`, false, 'skill directory missing');
    }
  }
}

const readmePath = path.join(TOOLKIT_ROOT, 'README.md');
if (exists(readmePath)) {
  const body = readFile(readmePath);
  const skillTableMatches = body.match(/^\| `bfsi-[a-z0-9-]+`\s+\|/gm) || [];
  const agentTableMatches = body.match(/^\| `bfsi-[a-z0-9-]+`\s+\| (opus|sonnet|haiku)/gm) || [];
  // The skill regex also matches agent rows (both start with `| \`bfsi-x\` |`),
  // so subtract the agent count to get the true skill count.
  const advertisedSkillCount = skillTableMatches.length - agentTableMatches.length;
  const advertisedAgentCount = agentTableMatches.length;
  if (advertisedSkillCount === skillNames.size) {
    record('README skill count', true, String(skillNames.size));
  } else {
    record(
      'README skill count',
      false,
      `README advertises ${advertisedSkillCount}, disk has ${skillNames.size}`,
    );
  }
  if (advertisedAgentCount === agentNames.size) {
    record('README agent count', true, String(agentNames.size));
  } else {
    record(
      'README agent count',
      false,
      `README advertises ${advertisedAgentCount}, disk has ${agentNames.size}`,
    );
  }
}

let pass = 0;
let fail = 0;
for (const r of results) {
  const mark = r.ok ? '✓' : '✗';
  const colour = r.ok ? '\x1b[32m' : '\x1b[31m';
  const reset = '\x1b[0m';
  const detail = r.detail ? ` — ${r.detail}` : '';
  process.stdout.write(`${colour}${mark}${reset} ${r.label}${detail}\n`);
  if (r.ok) {
    pass++;
  } else {
    fail++;
  }
}
process.stdout.write('\n');
process.stdout.write(`${pass} passed, ${fail} failed (out of ${results.length})\n`);
process.exit(fail === 0 ? 0 : 1);
