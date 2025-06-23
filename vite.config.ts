// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      'grand-supreme-baboon.ngrok-free.app',
      '.ngrok-free.app'
    ],
  },
  base: '/information/', // 중요: 빌드 시 정적 파일 경로
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})