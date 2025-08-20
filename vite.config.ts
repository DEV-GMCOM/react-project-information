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
      // --- 💡 프록시 설정 (추가) ---
      proxy: {
          // '/api'로 시작하는 요청을 target으로 전달
          '/api': {
              target: 'http://localhost:8001', // 백엔드 API 서버 주소
              changeOrigin: true, // CORS 문제 방지를 위해 호스트 헤더 변경
          }
      }
  },
  base: '/information/', // 중요: 빌드 시 정적 파일 경로
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})