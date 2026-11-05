// Empty means "same origin": used when server.js serves the frontend itself (local or Render).
// The Vercel build (scripts/build.js) overwrites this file in dist/ with the Render API URL.
window.STORYBOOK_API_URL = window.STORYBOOK_API_URL || '';
