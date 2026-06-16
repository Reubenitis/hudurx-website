import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  // Relative base for production so it works under the GitHub Pages
  // subpath (https://<user>.github.io/hudurx-website/); root for dev.
  base: command === 'build' ? './' : '/',
  server: {
    host: true,
    port: 5180,
  },
  build: {
    target: 'es2019',
    assetsInlineLimit: 0,
  },
}));
