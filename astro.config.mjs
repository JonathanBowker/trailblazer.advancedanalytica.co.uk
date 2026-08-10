// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  security: {
    checkOrigin: false,
  },
  vite: {
    server: {
      allowedHosts: ['127.0.0.1.nip.io'],
    },
  },
  site: 'https://trailblazer.advancedanalytica.co.uk',
});
