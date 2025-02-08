import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin']
      },
      // Ensure React refresh works properly
      fastRefresh: true,
    }),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],
  build: {
    // Reduce chunk size warning limit
    chunkSizeWarningLimit: 500,
    
    // Enable code splitting and dynamic imports
    rollupOptions: {
      output: {
        // Ensure proper bundling order
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || 
                id.includes('react-dom') || 
                id.includes('@emotion') || 
                id.includes('framer-motion')) {
              return 'react-vendor'
            }
            if (id.includes('@chakra-ui')) return 'chakra-ui'
            if (id.includes('firebase')) return 'firebase'
            if (id.includes('react-router')) return 'react-router'
            return 'vendor'
          }
        }
      }
    },
    
    // Minification and compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        // More aggressive dead code elimination
        dead_code: true,
        pure_funcs: ['console.log']
      },
      // Preserve important comments
      format: {
        comments: false
      }
    },
    
    // Enable source map for production debugging
    sourcemap: true
  },
  
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@chakra-ui/react',
      'firebase/firestore',
      'date-fns'
    ],
    exclude: [
      'js-big-decimal',
      // Exclude heavy or unnecessary dependencies
      '@faker-js/faker'
    ]
  },
  
  // Server optimization
  server: {
    // Disable HMR overlay to reduce visual noise
    hmr: {
      overlay: false
    },
    
    // Warm up critical client files
    warmup: {
      clientFiles: [
        './src/main.tsx', 
        './src/App.tsx',
        './src/routes.tsx'  // Add more entry points if needed
      ]
    },
    
    // Improve performance
    strictPort: true,
    port: 3000
  },
  
  // Performance hints
  performance: {
    // Warn about large assets
    maxEntrypointSize: 500000,
    maxAssetSize: 500000
  }
})
