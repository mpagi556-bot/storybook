'use strict';
const fs = require('fs');
const path = require('path');

// Static build for Vercel: copies public/ to dist/. API calls use relative /api/* paths,
// which vercel.json rewrites to the Render backend.
const root = path.join(__dirname, '..');
const src = path.join(root, 'public');
const out = path.join(root, 'dist');

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(src, out, { recursive: true });

console.log('Built static frontend in dist/ (API: relative /api, proxied by vercel.json)');
