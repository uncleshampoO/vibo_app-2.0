import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: './', // Явно говорим, что файлы лежат здесь
  build: {
    outDir: 'dist',
  }
})
