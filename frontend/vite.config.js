import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

/** Alias a paquete en node_modules raiz (evita fallos Rollup en Docker con deps hoisted). */
function nm(subpath) {
  return path.resolve(rootDir, 'node_modules', subpath)
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      'motion-utils': nm('motion-utils'),
      'motion-dom': nm('motion-dom'),
      '@dnd-kit/utilities': nm('@dnd-kit/utilities'),
      '@dnd-kit/core': nm('@dnd-kit/core'),
      '@dnd-kit/sortable': nm('@dnd-kit/sortable'),
      recharts: nm('recharts'),
      classcat: nm('classcat'),
      zustand: nm('zustand'),
    },
    dedupe: [
      'react',
      'react-dom',
      'framer-motion',
      'motion-utils',
      'motion-dom',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
      '@xyflow/react',
      'recharts',
      'classcat',
      'zustand',
    ],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'framer-motion',
      'motion-utils',
      'motion-dom',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
      '@xyflow/react',
      'recharts',
      'classcat',
      'zustand',
    ],
  },
})
