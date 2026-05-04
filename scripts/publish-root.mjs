import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distRoot = join(projectRoot, 'dist');

if (!existsSync(distRoot)) {
  throw new Error('Build output folder does not exist. Run vite build first.');
}

rmSync(join(projectRoot, 'assets'), { recursive: true, force: true });
cpSync(join(distRoot, 'assets'), join(projectRoot, 'assets'), { recursive: true });
copyFileSync(join(distRoot, 'index.html'), join(projectRoot, 'index.html'));

if (!existsSync(join(projectRoot, 'output.json'))) {
  copyFileSync(join(projectRoot, 'application', 'public', 'output.json'), join(projectRoot, 'output.json'));
}
