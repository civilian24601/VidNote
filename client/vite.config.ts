import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import themePlugin from '@replit/vite-plugin-shadcn-theme-json'
import path from 'path'
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal'

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  // Load env file based on `mode` in the current working directory
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      runtimeErrorOverlay(),
      themePlugin(),
      ...(process.env.NODE_ENV !== 'production' && process.env.REPL_ID !== undefined
        ? [
            await import('@replit/vite-plugin-cartographer').then((m) =>
              m.cartographer()
            ),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@hooks': path.resolve(__dirname, 'src/hooks'),
        '@lib': path.resolve(__dirname, 'src/lib'),
        '@pages': path.resolve(__dirname, 'src/pages'),
        '@shared': path.resolve(__dirname, '../shared'),
        '@assets': path.resolve(__dirname, '../attached_assets'),
        '@schema': path.resolve(__dirname, '../shared/schema.ts'),
      }
    },
    server: {
      port: 3000,
      strictPort: true,
      hmr: {
        port: 3000
      }
    },
    // Expose env variables to the client
    define: {
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true
    }
  }
}) 
