import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// PERFORMANCE OPTIMIZATION: Advanced Vite configuration for bundle size reduction
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    // PERFORMANCE OPTIMIZATION: Advanced bundling and tree-shaking
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
          supabase: ['@supabase/supabase-js'],
          radix: ['@radix-ui/react-dialog', '@radix-ui/react-progress', '@radix-ui/react-slot', '@radix-ui/react-toast'],
          icons: ['lucide-react', 'react-icons'],
          utils: ['clsx', 'tailwind-merge', 'class-variance-authority']
        },
        // Optimize chunk loading
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
      // Tree-shaking optimization
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      }
    },
    // Bundle size optimization
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Asset optimization
    assetsInlineLimit: 4096
  },
  // Performance optimizations for development
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})