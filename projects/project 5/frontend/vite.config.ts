import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    hmr: {
      timeout: 0 // Disable timeout
    },
    watch: {
      usePolling: true,
      interval: 1000
    }
  }
});