#!/usr/bin/env node
/**
 * Prepublish bundler. Copies the monorepo's templates/ and packages/claude-toolkit/
 * into packages/cli/ so the npm tarball is self-contained.
 *
 * At runtime, the CLI detects "published mode" by checking whether
 * `packages/cli/templates/` exists. In dev (after `pnpm install` but no bundle
 * step), it doesn't — the CLI looks 2 levels up at the monorepo. After this
 * script runs (before `npm publish`), the directory exists and the CLI uses it.
 *
 * The bundled directories are gitignored — they are publish artefacts, not
 * source. Do not commit them.
 */
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_ROOT = path.resolve(__dirname, '..');
const STARTER_ROOT = path.resolve(CLI_ROOT, '..', '..');

const targets = [
  {
    src: path.join(STARTER_ROOT, 'templates'),
    dst: path.join(CLI_ROOT, 'templates'),
    label: 'templates',
  },
  {
    src: path.join(STARTER_ROOT, 'packages', 'claude-toolkit'),
    dst: path.join(CLI_ROOT, 'claude-toolkit'),
    label: 'claude-toolkit',
  },
];

const SKIP = /(\bnode_modules\b|\.turbo\b|\bdist\b|\.tsbuildinfo$|pnpm-lock\.yaml$)/;

for (const { src, dst, label } of targets) {
  if (!(await fs.pathExists(src))) {
    console.error(`[bundle] source missing: ${src}`);
    process.exit(1);
  }
  await fs.remove(dst);
  await fs.copy(src, dst, {
    filter: (p) => !SKIP.test(p),
  });
  const files = await countFiles(dst);
  console.log(`[bundle] ${label} → ${path.relative(CLI_ROOT, dst)} (${files} files)`);
}

console.log('[bundle] done. The package is ready for `npm publish`.');

async function countFiles(dir) {
  let n = 0;
  async function walk(d) {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) await walk(path.join(d, e.name));
      else n++;
    }
  }
  await walk(dir);
  return n;
}
