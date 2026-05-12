/**
 * `create-bfsi-app` entry point.
 *
 * v0.1: minimal scaffolding. Interactive prompt → copy _shared + selected variant
 * → write package.json with substitutions → install deps → git init.
 *
 * v0.2 will add: feature pre-selection (KYC, Transactions sample features),
 * backend adapter selection (Rails / Node / generic), CI vendor (GHA / GitLab),
 * MFA backend integration prompts.
 */
import { intro, outro, text, select, confirm, isCancel, cancel, spinner } from '@clack/prompts';
import pc from 'picocolors';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ScaffoldOptions {
  projectName: string;
  variant: 'rtk' | 'tanstack';
  installDeps: boolean;
  initGit: boolean;
}

export async function main(): Promise<void> {
  console.log();
  intro(pc.bold(pc.bgCyan(pc.black(' @rsense/create-bfsi-app '))));

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

  const installDeps = (await confirm({
    message: 'Install dependencies after scaffolding?',
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
    installDeps,
    initGit,
  };

  await scaffold(opts);

  outro(
    pc.green(
      `Done. ${pc.bold('cd ' + opts.projectName)} to get started.\n` +
        `  - ${pc.cyan('pnpm dev')}    — start dev server\n` +
        `  - ${pc.cyan('claude')}      — Claude Code with BFSI toolkit enabled\n` +
        `  - ${pc.cyan('/bfsi-doctor')} — verify everything is wired up`,
    ),
  );
}

async function scaffold(opts: ScaffoldOptions): Promise<void> {
  const s = spinner();
  const target = path.resolve(process.cwd(), opts.projectName);

  // Locate templates (one level up from packages/cli during dev, or sibling in dist)
  const templatesRoot = path.resolve(__dirname, '..', '..', '..', 'templates');
  const sharedDir = path.join(templatesRoot, '_shared');
  const variantDir = path.join(
    templatesRoot,
    opts.variant === 'rtk' ? 'rtk-query' : 'tanstack-query',
  );

  s.start('Copying template files');
  await fs.copy(sharedDir, target, {
    filter: (src) => {
      // Skip node_modules, .turbo, dist if present in templates dir
      return !/(\bnode_modules\b|\.turbo\b|\bdist\b)/.test(src);
    },
  });
  if (await fs.pathExists(variantDir)) {
    await fs.copy(variantDir, target, { overwrite: true });
  }

  // Substitute variables in package.json
  const pkgPath = path.join(target, 'package.json');
  if (await fs.pathExists(pkgPath)) {
    let pkg = await fs.readFile(pkgPath, 'utf8');
    pkg = pkg.replaceAll('{{projectName}}', opts.projectName);
    await fs.writeFile(pkgPath, pkg, 'utf8');
  }

  // Substitute in README.md
  const readmePath = path.join(target, 'README.md');
  if (await fs.pathExists(readmePath)) {
    let r = await fs.readFile(readmePath, 'utf8');
    r = r.replaceAll('{{projectName}}', opts.projectName);
    await fs.writeFile(readmePath, r, 'utf8');
  }

  s.stop('Files copied');

  if (opts.installDeps) {
    s.start('Installing dependencies (pnpm install)');
    try {
      await execa('pnpm', ['install'], { cwd: target, stdio: 'pipe' });
      s.stop('Dependencies installed');
    } catch (err) {
      s.stop('pnpm install failed — you can run it manually later');
      console.warn(pc.yellow((err as Error).message));
    }
  }

  if (opts.initGit) {
    s.start('Initialising git');
    try {
      await execa('git', ['init', '-q'], { cwd: target });
      await execa('git', ['add', '.'], { cwd: target });
      await execa('git', ['commit', '-q', '-m', 'chore: scaffolded from @rsense/create-bfsi-app'], {
        cwd: target,
      });
      s.stop('Git repo initialised');
    } catch (err) {
      s.stop('git init failed (continuing anyway)');
      console.warn(pc.yellow((err as Error).message));
    }
  }
}

function cancelled(): void {
  cancel('Cancelled. No files written.');
  process.exit(0);
}
