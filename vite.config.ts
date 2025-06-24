import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  css: {
    postcss: './postcss.config.cjs',
  },
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
    'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY)
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: mode !== 'production',
    minify: mode === 'production' ? 'esbuild' : false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          genai: ['@google/genai']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['@google/generative-ai', 'react', 'react-dom']
  },
  server: {
    port: 3000,
    host: true
  },
  preview: {
    port: 3000,
    host: true
  }
}));
