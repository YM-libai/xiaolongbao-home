import { defineConfig } from 'vite';

// GitHub Pages 部署在 https://ym-libai.github.io/xiaolongbao-home/
// 所以 base 必须是完整的子路径，否则构建产物资源路径会 404
export default defineConfig({
  base: '/xiaolongbao-home/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // 让产物尽可能小且无 sourcemap 泄露
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1200,
  },
  server: {
    port: 5175,
    host: '127.0.0.1',
  },
});
