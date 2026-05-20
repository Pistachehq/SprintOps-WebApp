import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    // framer-motion 12 importa motion-utils/motion-dom como paquetes hermanos; en Docker+Rollup
    // a veces no los resuelve sin alias/dedupe explicitos.
    alias: {
      'motion-utils': path.resolve(rootDir, 'node_modules/motion-utils'),
      'motion-dom': path.resolve(rootDir, 'node_modules/motion-dom'),
    },
    dedupe: ['framer-motion', 'motion-utils', 'motion-dom'],
  },
  optimizeDeps: {
    include: ['framer-motion', 'motion-utils', 'motion-dom'],
  },
})
