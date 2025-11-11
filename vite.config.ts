// vite.config.ts

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// defineConfig를 함수 형태로 변경하여 'mode'를 인자로 받습니다.
export default defineConfig(({ mode }) => {
    // 현재 실행 모드('development' 또는 'production')에 맞는 .env 파일을 찾아 로드합니다.
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [react()],

        // 1. base 경로를 .env 파일에서 읽어온 VITE_BASE_PATH 값으로 동적 설정합니다.
        base: env.VITE_BASE_PATH,

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
            // 2. 개발 프록시 설정을 .env.development 경로에 맞게 수정합니다.
            proxy: {
                // 개발 시 프론트엔드가 요청하는 '/api' 경로를 잡아서
                '/api': {
                    target: 'http://127.0.0.1:8002', // 로컬 FastAPI 서버
                    changeOrigin: true,
                    rewrite: (path) => path, // 경로 그대로 전달
                }
            }
        },

        // build 설정 등 나머지는 그대로 유지합니다.
        build: {
            outDir: 'dist',
            sourcemap: false,
            rollupOptions: {
                output: {
                    manualChunks: {
                        vendor: ['react', 'react-dom'],
                        router: ['react-router-dom'],
                        charts: ['recharts']
                    }
                }
            }
        },
        // define 설정은 더 이상 필요 없으므로 삭제하거나 그대로 두어도 됩니다.
        // define: {
        //     'process.env.NODE_ENV': JSON.stringify(mode)
        // }
    };
});