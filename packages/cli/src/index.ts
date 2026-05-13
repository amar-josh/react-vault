/**
 * `create-app` entry point.
 *
 * Scaffolds a new BFSI React project from `templates/_shared/` + a variant overlay
 * (RTK Query or TanStack Query), inlines the Claude toolkit into the project's
 * `.claude/` directory, and optionally rewrites `@react-vault/*` deps to local `link:`
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

// The CLI runs in two modes:
//   - Dev: inside the monorepo at <starter>/packages/cli/dist/index.js.
//     Templates are at <starter>/templates/ and the toolkit lives at
//     <starter>/packages/claude-toolkit/.
//   - Published: installed at <somewhere>/node_modules/@react-vault/create-app/.
//     The prepublishOnly script bundles templates/ and claude-toolkit/ INTO
//     the package itself, so they sit alongside dist/.
const PACKAGE_ROOT = path.resolve(__dirname, '..');
const BUNDLED_TEMPLATES = path.join(PACKAGE_ROOT, 'templates');
const IS_PUBLISHED_MODE = fs.existsSync(BUNDLED_TEMPLATES);

const TEMPLATES_ROOT = IS_PUBLISHED_MODE
  ? BUNDLED_TEMPLATES
  : path.resolve(PACKAGE_ROOT, '..', '..', 'templates');
const TOOLKIT_ROOT = IS_PUBLISHED_MODE
  ? path.join(PACKAGE_ROOT, 'claude-toolkit')
  : path.resolve(PACKAGE_ROOT, '..', 'claude-toolkit');

// The npm scope used in templates' package.json references. The CLI's `link:`
// rewrite swaps these to absolute paths for local-dev mode.
const PACKAGE_SCOPE = '@react-vault';

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
  intro(pc.bold(pc.bgCyan(pc.black(' @react-vault/create-app '))));

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

  // In published mode (npx-installed CLI), `link:` paths to a local workspace
  // don't exist on the user's machine — skip the prompt. In dev mode (running
  // from the monorepo), offer to point at the local workspace.
  let localLink = false;
  if (!IS_PUBLISHED_MODE) {
    const answer = (await confirm({
      message:
        'Use link: refs for @react-vault/core and @react-vault/ui? (points the project at this local workspace instead of fetching from npm)',
      initialValue: true,
    })) as boolean;
    if (isCancel(answer)) {
      return cancelled();
    }
    localLink = answer;
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

  // 5. In dev mode, optionally swap @react-vault/{core,ui} dep versions to
  //    `link:` paths pointing at the workspace. No-op in published mode.
  await maybeRewriteToLinkDeps(target, opts.localLink);

  // 6. Inline the toolkit (skills, agents, commands, hooks) into .claude/.
  //    Variant-specific RTK skills are shipped in templates/rtk-query/.claude/
  //    so they're already in place from step 2 — nothing extra to copy here.
  if (opts.inlineToolkit) {
    s.start('Inlining Claude toolkit into .claude/');
    await inlineToolkitInto(target);
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
    path.join(target, 'CLAUDE.md'),
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
 * In local-dev (running from the monorepo) the user can opt-in to rewriting
 * @react-vault/core and @react-vault/ui dependency versions to `link:` paths
 * that point at the workspace packages. Lets you `pnpm install` before the
 * packages are published to npm.
 *
 * In published mode (npx-installed CLI), `link:` paths would dangle, so this
 * step is a no-op — the templates' versions stay as published npm versions.
 */
async function maybeRewriteToLinkDeps(target: string, localLink: boolean): Promise<void> {
  if (!localLink || IS_PUBLISHED_MODE) {
    return;
  }
  const pkgPath = path.join(target, 'package.json');
  if (!(await fs.pathExists(pkgPath))) {
    return;
  }
  const pkg = (await fs.readJSON(pkgPath)) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  // Resolve workspace paths relative to the monorepo root (only valid in dev mode)
  const starterRoot = path.resolve(PACKAGE_ROOT, '..', '..');
  const linkTargets: Record<string, string> = {
    [`${PACKAGE_SCOPE}/core`]: `link:${path.join(starterRoot, 'packages', 'core')}`,
    [`${PACKAGE_SCOPE}/ui`]: `link:${path.join(starterRoot, 'packages', 'ui')}`,
  };
  for (const key of ['dependencies', 'devDependencies'] as const) {
    const block = pkg[key];
    if (!block) {
      continue;
    }
    for (const depName of Object.keys(block)) {
      const target = linkTargets[depName];
      if (target) {
        block[depName] = target;
      }
    }
  }
  await fs.writeJSON(pkgPath, pkg, { spaces: 2 });
}

/**
 * Inline the Claude toolkit into <project>/.claude/.
 *
 * - Copies the toolkit's skills/, agents/, commands/ into the project (these
 *   are the shared bfsi-* skills that ship in every project)
 * - Copies hooks/scripts/ and rewrites paths in hooks.json from `${CLAUDE_PLUGIN_ROOT}/...`
 *   to `${CLAUDE_PROJECT_DIR}/.claude/...` since we're now project-local, not a plugin
 * - Merges hooks into existing `.claude/settings.json` (which already has permissions)
 * - Removes `enabledPlugins` from settings since the plugin is now inlined
 *
 * Variant-specific skills (e.g. RTK pattern skills under templates/rtk-query/
 * .claude/skills/) are NOT handled here — they ship inside their variant
 * overlay and land in the project as part of the standard overlay copy.
 */
async function inlineToolkitInto(target: string): Promise<void> {
  const claudeDir = path.join(target, '.claude');
  await fs.ensureDir(claudeDir);

  // Copy the toolkit's skills, agents, commands. Existing files at the same
  // path (e.g. variant-shipped RTK skills already placed by the overlay) are
  // preserved because we don't write over names we don't have.
  for (const sub of ['skills', 'agents', 'commands']) {
    const src = path.join(TOOLKIT_ROOT, sub);
    const dst = path.join(claudeDir, sub);
    if (await fs.pathExists(src)) {
      await fs.copy(src, dst, { overwrite: true });
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
