// scripts/copy-libsodium.js
// Copies the libsodium-wrappers-sumo UMD browser build into public/
// so it can be served same-origin (required by COEP: require-corp on /claim).

import { copyFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const candidates = [
  'node_modules/libsodium-wrappers-sumo/dist/modules-sumo/libsodium-wrappers-sumo.js',
  'node_modules/libsodium-wrappers-sumo/dist/browsers-sumo/sodium.js',
  'node_modules/libsodium-wrappers-sumo/dist/libsodium-wrappers-sumo.js',
  'node_modules/libsodium-wrappers-sumo/dist/modules-sumo-esm/libsodium-wrappers.mjs',
];

let copied = false;
for (const rel of candidates) {
  const src = resolve(root, rel);
  if (existsSync(src)) {
    copyFileSync(src, resolve(root, 'public/libsodium.js'));
    console.log(`✓ Copied ${rel} → public/libsodium.js`);
    copied = true;
    break;
  }
}

if (!copied) {
  console.warn('⚠ libsodium UMD build not found in node_modules. Searched:');
  candidates.forEach(c => console.warn('  ', c));
  process.exit(1);
}
