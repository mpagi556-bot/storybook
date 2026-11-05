'use strict';
const fs = require('fs');
const path = require('path');

const DEFAULT_API_URL = 'https://storybook-op5e.onrender.com';
const root = path.join(__dirname, '..');
const src = path.join(root, 'public');
const out = path.join(root, 'dist');

const raw = process.env.VITE_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? DEFAULT_API_URL;
const apiUrl = raw.trim().replace(/\/+$/, '');
if (apiUrl && !/^https?:\/\/[^\s/]+$/.test(apiUrl)) {
  console.error(`Invalid API URL "${raw}". Use an origin like ${DEFAULT_API_URL} or an empty string for same-origin.`);
  process.exit(1);
}

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(src, out, { recursive: true });
fs.writeFileSync(
  path.join(out, 'config.js'),
  `window.STORYBOOK_API_URL = window.STORYBOOK_API_URL || ${JSON.stringify(apiUrl)};\n`
);

console.log(`Built static frontend in dist/ (API: ${apiUrl || 'same origin'})`);
