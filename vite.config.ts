// vite.config.ts - 원래 설정으로 복원
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: '0.0.0.0', // 명시적 IP
    strictPort: true,
    // 모든 호스트 허용
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      'grand-supreme-baboon.ngrok-free.app',
      '.ngrok-free.app'
    ],
  },
  base: '/information/', // 다시 추가
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})