import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Vercel serves the app from the domain root, while GitHub Pages serves this
  // repository from /library-app/. Vercel sets VERCEL=1 for every build.
  base: process.env.VERCEL || command !== 'build' ? '/' : '/library-app/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
}))
