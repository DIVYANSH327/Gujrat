import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        { find: /^@\/src\/(.*)/, replacement: path.resolve(__dirname, 'src/$1') },
        { find: /^@\/server\/(.*)/, replacement: path.resolve(__dirname, 'server/$1') },
        { find: /^@\/firebase-applet-config\.json$/, replacement: path.resolve(__dirname, 'firebase-applet-config.json') },
        { find: /^@\/(.*)/, replacement: path.resolve(__dirname, 'src/$1') },
        { find: '@', replacement: path.resolve(__dirname, 'src') },
      ],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'lucide-react',
        'motion/react',
        'leaflet',
        'd3',
        'firebase/app',
        'firebase/auth',
        'hls.js'
      ]
    }
  };
});
