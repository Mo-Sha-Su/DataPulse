import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          // Stable vendor chunks cache well across deploys.
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('plotly')) return 'vendor-plotly';
            if (id.includes('chart.js')) return 'vendor-chartjs';
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'vendor-react';
            return undefined;
          },
        },
      },
    },
    server: {
      port: 5173,
      // Dev: forward API calls to the backend (run `npm run dev` in ../backend).
      proxy: {
        '/api': { target: process.env.VITE_API_PROXY || 'http://localhost:3000', changeOrigin: true },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
