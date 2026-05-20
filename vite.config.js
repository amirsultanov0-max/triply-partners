import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    target: ['es2020', 'chrome87', 'firefox78', 'safari14', 'edge88'],
  },
})
