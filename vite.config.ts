import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api-proxy': {
          target: env.VITE_XTREAM_HOST,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-proxy/, ''),
        },
        '/image-proxy': {
          target: env.VITE_IMAGE_PROXY_TARGET,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/image-proxy/, ''),
          secure: false,
        },
      },
    },
  };
});
