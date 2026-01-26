import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3005,  // 与package.json中的端口保持一致
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3003',  // 使用 IPv4 地址避免 IPv6 连接问题
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },
      '/uploads': {
        target: 'http://127.0.0.1:3003',  // 使用 IPv4 地址避免 IPv6 连接问题
        changeOrigin: true,
        secure: false
      }
    }
  }
})
