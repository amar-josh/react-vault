/**
 * `create-app` entry point.
 *
 * Scaffolds a new BFSI React project from `templates/_shared/` + a variant overlay
 * (RTK Query or TanStack Query), inlines the Claude toolkit into the project's
 * `.claude/` directory, and optionally rewrites `@your-real-scope/*` deps to local `link:`
 * paths so the project installs without the packages being published yet.
 */
import {
  intro,
  outro,
  text,
  select,
  confirm,
  isCancel,
  cancel,
  spinner,
  note,
} from '@clack/prompts';
import pc from 'picocolors';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolved at runtime: assume CLI is at <starter>/packages/cli/dist/index.js,
// so going up three levels lands at the starter monorepo root.
const STARTER_ROOT = path.resolve(__dirname, '..', '..', '..');
const TEMPLATES_ROOT = path.join(STARTER_ROOT, 'templates');
const TOOLKIT_ROOT = path.join(STARTER_ROOT, 'packages', 'claude-toolkit');

// Placeholder scope baked into the template source files. Gets replaced with
// @<projectName> at scaffold time so every project has its own scope.
const PLACEHOLDER_SCOPE = '@your-real-scope';

// Where rsense-* skills live on this machine. Bundled into the scaffolded
// project's .claude/skills/ when RTK Query is picked.
const RSENSE_SKILLS_DIR = path.join(process.env.HOME ?? '/root', '.claude', 'skills');

interface ScaffoldOptions {
  projectName: string;
  variant: 'rtk' | 'tanstack';
  installDeps: boolean;
  initGit: boolean;
  inlineToolkit: boolean;
  localLink: boolean;
}

export async function main(): Promise<void> {
  console.log();
  intro(pc.bold(pc.bgCyan(pc.black(' @your-real-scope/create-app '))));

  const projectName = await text({
    message: 'Project name?',
    placeholder: 'my-bank-app',
    validate(value): string | undefined {
      if (!value) {
        return 'Project name is required';
      }
      if (!/^[a-z0-9][a-z0-9-]*$/.test(value)) {
        return 'Lowercase letters, digits, and hyphens only';
      }
      const target = path.resolve(process.cwd(), value);
      if (fs.existsSync(target)) {
        return `Directory ${value} already exists`;
      }
      return undefined;
    },
  });
  if (isCancel(projectName)) {
    return cancelled();
  }

  const variant = (await select({
    message: 'State management?',
    options: [
      {
        value: 'rtk',
        label: 'RTK Query (Redux Toolkit)',
        hint: 'Recommended for complex client state',
      },
      {
        value: 'tanstack',
        label: 'TanStack Query + Zustand',
        hint: 'Lighter; great for server-state-heavy apps',
      },
    ],
  })) as 'rtk' | 'tanstack';
  if (isCancel(variant)) {
    return cancelled();
  }

  const inlineToolkit = (await confirm({
    message: 'Inline the Claude toolkit (skills/agents/hooks/commands) into .claude/?',
    initialValue: true,
  })) as boolean;
  if (isCancel(inlineToolkit)) {
    return cancelled();
  }

  const localLink = (await confirm({
    message: `Use link: refs for @${projectName as string}/core and @${projectName as string}/ui? (needed until packages are published)`,
    initialValue: true,
  })) as boolean;
  if (isCancel(localLink)) {
    return cancelled();
  }

  const installDeps = (await confirm({
    message: 'Install dependencies after scaffolding (pnpm install)?',
    initialValue: true,
  })) as boolean;
  if (isCancel(installDeps)) {
    return cancelled();
  }

  const initGit = (await confirm({
    message: 'Initialise git repository?',
    initialValue: true,
  })) as boolean;
  if (isCancel(initGit)) {
    return cancelled();
  }

  const opts: ScaffoldOptions = {
    projectName: projectName as string,
    variant,
    inlineToolkit,
    localLink,
    installDeps,
    initGit,
  };

  await scaffold(opts);

  const lines = [
    `${pc.bold('cd ' + opts.projectName)}`,
    '',
    `  ${pc.cyan('pnpm dev')}        — start dev server`,
    `  ${pc.cyan('claude')}          — Claude Code (BFSI toolkit auto-available)`,
    `  ${pc.cyan('/bfsi-doctor')}    — verify wiring inside Claude`,
    `  ${pc.cyan('/bfsi-onboarding')} — orient yourself to the project`,
  ];
  note(lines.join('\n'), 'Next steps');
  outro(pc.green('Done.'));
}

async function scaffold(opts: ScaffoldOptions): Promise<void> {
  const s = spinner();
  const target = path.resolve(process.cwd(), opts.projectName);
  const sharedDir = path.join(TEMPLATES_ROOT, '_shared');
  const variantDir = path.join(
    TEMPLATES_ROOT,
    opts.variant === 'rtk' ? 'rtk-query' : 'tanstack-query',
  );

  // 1. Copy shared template
  s.start('Copying template files');
  await fs.copy(sharedDir, target, {
    filter: (src) => !/(\bnode_modules\b|\.turbo\b|\bdist\b)/.test(src),
  });

  // 2. Apply variant overlay
  if (await fs.pathExists(variantDir)) {
    await fs.copy(variantDir, target, { overwrite: true });
  }
  s.stop('Template files copied');

  // 3. Merge package.partial.json from variant into package.json, then delete it
  await mergeVariantPackage(target);

  // 4. Substitute {{projectName}} in package.json, README.md, index.html, i18n
  await substituteVars(target, opts.projectName);

  // 5. Rewrite scope from @your-real-scope to @<projectName>, and link: refs
  //    for core/ui packages if local-link is on. Replaces the placeholder in
  //    package.json AND every source file (imports, tailwind config, etc.).
  await rewriteScope(target, opts.projectName, opts.localLink);

  // 6. Inline the toolkit into .claude/, plus rsense-* skills if RTK
  if (opts.inlineToolkit) {
    s.start('Inlining Claude toolkit into .claude/');
    await inlineToolkitInto(target, opts.variant);
    s.stop('Claude toolkit inlined into .claude/');
  }

  // 7. pnpm install
  if (opts.installDeps) {
    s.start('Installing dependencies (pnpm install)');
    try {
      await execa('pnpm', ['install'], { cwd: target, stdio: 'pipe' });
      s.stop('Dependencies installed');
    } catch (err) {
      s.stop(
        pc.yellow('pnpm install failed — see error above. Re-run manually with: pnpm install'),
      );
      console.warn(pc.dim((err as Error).message));
    }
  }

  // 8. git init + rename to main + first commit
  if (opts.initGit) {
    s.start('Initialising git');
    try {
      await execa('git', ['init', '-q'], { cwd: target });
      await execa('git', ['branch', '-m', 'main'], { cwd: target }).catch(() => {
        // Older git versions: master is created by init; rename may fail if no commits yet
      });
      await execa('git', ['add', '.'], { cwd: target });
      await execa(
        'git',
        ['commit', '-q', '-m', `chore: scaffold ${opts.projectName} from create-app`],
        {
          cwd: target,
        },
      );
      // Ensure final branch is main even if rename pre-commit failed
      await execa('git', ['branch', '-M', 'main'], { cwd: target }).catch(() => {
        /* ignore */
      });
      s.stop('Git repo initialised (branch: main)');
    } catch (err) {
      s.stop(pc.yellow('git init failed (continuing anyway)'));
      console.warn(pc.dim((err as Error).message));
    }
  }
}

async function mergeVariantPackage(target: string): Promise<void> {
  const partialPath = path.join(target, 'package.partial.json');
  const pkgPath = path.join(target, 'package.json');
  if (!(await fs.pathExists(partialPath)) || !(await fs.pathExists(pkgPath))) {
    return;
  }
  const partial = (await fs.readJSON(partialPath)) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const pkg = (await fs.readJSON(pkgPath)) as Record<string, unknown> & {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  if (partial.dependencies) {
    pkg.dependencies = { ...(pkg.dependencies ?? {}), ...partial.dependencies };
  }
  if (partial.devDependencies) {
    pkg.devDependencies = { ...(pkg.devDependencies ?? {}), ...partial.devDependencies };
  }
  await fs.writeJSON(pkgPath, pkg, { spaces: 2 });
  await fs.remove(partialPath);
}

async function substituteVars(target: string, projectName: string): Promise<void> {
  const filesToTouch = [
    path.join(target, 'package.json'),
    path.join(target, 'README.md'),
    path.join(target, 'index.html'),
    path.join(target, 'src', 'i18n', 'translations', 'en.json'),
    path.join(target, 'src', 'i18n', 'translations', 'hi.json'),
  ];
  for (const f of filesToTouch) {
    if (!(await fs.pathExists(f))) {
      continue;
    }
    const content = await fs.readFile(f, 'utf8');
    const replaced = content.replaceAll('{{projectName}}', projectName);
    if (replaced !== content) {
      await fs.writeFile(f, replaced, 'utf8');
    }
  }
}

/**
 * Renames every @your-real-scope reference to @<projectName>:
 *   - package.json dependency keys (preserves version, then rewrites version
 *     to a `link:` path if localLink is true)
 *   - tailwind.config.ts `content` glob (./node_modules/@scope/ui/...)
 *   - All source files (.ts, .tsx, .js, .jsx, .json, .md) — imports + comments
 *
 * After this runs, the scaffolded project consistently uses @<projectName>/core
 * and @<projectName>/ui everywhere. With localLink on, pnpm install will
 * resolve those names to the local workspace via symlink.
 */
async function rewriteScope(
  target: string,
  projectName: string,
  localLink: boolean,
): Promise<void> {
  const newScope = `@${projectName}`;
  const corePath = path.join(STARTER_ROOT, 'packages', 'core');
  const uiPath = path.join(STARTER_ROOT, 'packages', 'ui');

  // 1. Rewrite package.json deps: rename key + optionally swap to link:
  const pkgPath = path.join(target, 'package.json');
  if (await fs.pathExists(pkgPath)) {
    const pkg = (await fs.readJSON(pkgPath)) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    for (const key of ['dependencies', 'devDependencies'] as const) {
      const block = pkg[key];
      if (!block) {
        continue;
      }
      const next: Record<string, string> = {};
      for (const [depName, depVersion] of Object.entries(block)) {
        if (depName.startsWith(`${PLACEHOLDER_SCOPE}/`)) {
          const subname = depName.slice(PLACEHOLDER_SCOPE.length); // e.g. /core
          const newName = `${newScope}${subname}`;
          if (localLink && subname === '/core') {
            next[newName] = `link:${corePath}`;
          } else if (localLink && subname === '/ui') {
            next[newName] = `link:${uiPath}`;
          } else {
            next[newName] = depVersion;
          }
        } else {
          next[depName] = depVersion;
        }
      }
      pkg[key] = next;
    }
    await fs.writeJSON(pkgPath, pkg, { spaces: 2 });
  }

  // 2. Rewrite the placeholder scope in every source file
  const sourceFiles = await collectSourceFiles(target);
  for (const file of sourceFiles) {
    const content = await fs.readFile(file, 'utf8');
    if (!content.includes(PLACEHOLDER_SCOPE)) {
      continue;
    }
    const replaced = content.replaceAll(PLACEHOLDER_SCOPE, newScope);
    await fs.writeFile(file, replaced, 'utf8');
  }
}

async function collectSourceFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  const skip = new Set(['node_modules', '.git', 'dist', '.turbo', 'build']);
  async function walk(d: string): Promise<void> {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const ent of entries) {
      if (skip.has(ent.name)) {
        continue;
      }
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) {
        await walk(p);
        continue;
      }
      if (/\.(ts|tsx|js|jsx|json|md|html|css|cjs|mjs|yaml|yml)$/.test(ent.name)) {
        out.push(p);
      }
    }
  }
  await walk(dir);
  return out;
}

/**
 * Inline the Claude toolkit into <project>/.claude/.
 *
 * - Copies skills/, agents/, commands/ as-is (Claude Code recognises these at project scope)
 * - When variant is `rtk`, ALSO copies ~/.claude/skills/rsense-* into .claude/skills/
 *   so the project has the canonical rsense RTK-Query + axios + redux skills available.
 *   (No rsense skills are copied for TanStack — they're RTK-specific.)
 * - Copies hooks/scripts/ and rewrites paths in hooks.json from `${CLAUDE_PLUGIN_ROOT}/...`
 *   to `${CLAUDE_PROJECT_DIR}/.claude/...` since we're now project-local, not a plugin
 * - Merges hooks into existing `.claude/settings.json` (which already has permissions)
 * - Removes `enabledPlugins` from settings since the plugin is now inlined
 */
async function inlineToolkitInto(target: string, variant: 'rtk' | 'tanstack'): Promise<void> {
  const claudeDir = path.join(target, '.claude');
  await fs.ensureDir(claudeDir);

  // Copy skills, agents, commands directly
  for (const sub of ['skills', 'agents', 'commands']) {
    const src = path.join(TOOLKIT_ROOT, sub);
    const dst = path.join(claudeDir, sub);
    if (await fs.pathExists(src)) {
      await fs.copy(src, dst, { overwrite: true });
    }
  }

  // When RTK is picked, also bundle the canonical RTK + axios + redux skills.
  // Source skills are named rsense-<x> on disk; we strip the prefix on copy
  // so scaffolded projects see clean names (rtk-query-api, axios-auth, …).
  // SKILL.md `name:` frontmatter is rewritten to match.
  // For TanStack, skip — these describe the RTK/dispatch pattern.
  if (variant === 'rtk' && (await fs.pathExists(RSENSE_SKILLS_DIR))) {
    const skillsDst = path.join(claudeDir, 'skills');
    await fs.ensureDir(skillsDst);
    const skillDirs = await fs.readdir(RSENSE_SKILLS_DIR, { withFileTypes: true });
    let copied = 0;
    for (const entry of skillDirs) {
      if (!entry.isDirectory()) {
        continue;
      }
      if (!entry.name.startsWith('rsense-')) {
        continue;
      }
      const cleanName = entry.name.replace(/^rsense-/, '');
      const src = path.join(RSENSE_SKILLS_DIR, entry.name);
      const dst = path.join(skillsDst, cleanName);
      await fs.copy(src, dst, { overwrite: true });

      // Rewrite `name: rsense-<x>` → `name: <x>` in the SKILL.md frontmatter
      const skillMd = path.join(dst, 'SKILL.md');
      if (await fs.pathExists(skillMd)) {
        const content = await fs.readFile(skillMd, 'utf8');
        const replaced = content.replace(/^name:\s*rsense-/m, 'name: ');
        if (replaced !== content) {
          await fs.writeFile(skillMd, replaced, 'utf8');
        }
      }
      copied++;
    }
    if (copied > 0) {
      // eslint-disable-next-line no-console
      console.error(pc.dim(`  + ${copied} RTK-pattern skills bundled`));
    }
  }

  // Copy hook scripts + chmod +x
  const scriptsSrc = path.join(TOOLKIT_ROOT, 'hooks', 'scripts');
  const scriptsDst = path.join(claudeDir, 'hooks', 'scripts');
  if (await fs.pathExists(scriptsSrc)) {
    await fs.copy(scriptsSrc, scriptsDst, { overwrite: true });
    const entries = await fs.readdir(scriptsDst);
    for (const e of entries) {
      const p = path.join(scriptsDst, e);
      if ((await fs.stat(p)).isFile()) {
        await fs.chmod(p, 0o755);
      }
    }
  }

  // Read toolkit hooks.json, rewrite ${CLAUDE_PLUGIN_ROOT} → ${CLAUDE_PROJECT_DIR}/.claude
  const toolkitHooksPath = path.join(TOOLKIT_ROOT, 'hooks', 'hooks.json');
  let toolkitHooks: unknown = {};
  if (await fs.pathExists(toolkitHooksPath)) {
    const raw = await fs.readFile(toolkitHooksPath, 'utf8');
    const rewritten = raw.replaceAll('${CLAUDE_PLUGIN_ROOT}', '${CLAUDE_PROJECT_DIR}/.claude');
    toolkitHooks = JSON.parse(rewritten);
  }

  // Merge into existing settings.json
  const settingsPath = path.join(claudeDir, 'settings.json');
  const existing = (await fs.pathExists(settingsPath))
    ? ((await fs.readJSON(settingsPath)) as Record<string, unknown>)
    : ({} as Record<string, unknown>);
  // Remove plugin reference — the toolkit is now project-local
  delete existing.enabledPlugins;
  // Set hooks from the rewritten toolkit
  const hookSection = (toolkitHooks as { hooks?: unknown }).hooks;
  if (hookSection !== undefined) {
    existing.hooks = hookSection;
  }
  await fs.writeJSON(settingsPath, existing, { spaces: 2 });
}

function cancelled(): void {
  cancel('Cancelled. No files written.');
  process.exit(0);
}
