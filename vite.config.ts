import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['@emotion/babel-plugin']
      }
    }),
    visualizer({
      filename: './dist/stats.html',
      open: false
    })
  ],
  
  // Basic dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@chakra-ui/react',
      '@emotion/react',
      '@emotion/styled',
      'framer-motion'
    ]
  },
  
  // Build configuration
  build: {
    // Basic minification
    minify: 'terser',
    
    // Enable source maps for debugging
    sourcemap: true
  },
  
  // Server configuration
  server: {
    hmr: {
      overlay: false
    }
  }
})
