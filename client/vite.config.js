import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const r = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig(({ mode }) => {
  // "baseline" mode = the BEFORE version (everything in one bundle) built from the same code,
  // so you can measure before/after honestly. Normal mode = code-split (AFTER).
  const baseline = mode === 'baseline';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@entry': r(baseline ? './src/AppBaseline.jsx' : './src/App.jsx'),
        '@chart': r(
          baseline
            ? './src/components/chart/ChartEntry.eager.jsx'
            : './src/components/chart/ChartEntry.lazy.jsx'
        ),
      },
    },
    build: { outDir: baseline ? 'dist-baseline' : 'dist' },
    server: { port: 5173, proxy: { '/api': 'http://localhost:5000' } },
    preview: { proxy: { '/api': 'http://localhost:5000' } },
  };
});
