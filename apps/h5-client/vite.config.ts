import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from 'unplugin-vue-components/resolvers'
import { fileURLToPath, URL } from 'node:url'
import { createHtmlPlugin } from 'vite-plugin-html'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      resolvers: [VantResolver()],
    }),
    Components({
      resolvers: [VantResolver()],
    }),
    createHtmlPlugin({
      minify: {
        collapseWhitespace: true,
        removeComments: true
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: ''
      }
    },
    devSourcemap: false,
    postcss: {
      plugins: [
        {
          postcssPlugin: 'internal:charset-removal',
          AtRule: {
            charset: (atRule) => {
              if (atRule.name === 'charset') {
                atRule.remove();
              }
            }
          }
        }
      ]
    }
  },

  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn', 'console.error'],
        passes: 2,
        unsafe: true,
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_symbols: true,
        unsafe_undefined: true
      },
      mangle: {
        toplevel: true,
        eval: true,
        keep_classnames: false,
        keep_fnames: false
      },
      output: {
        beautify: false,
        comments: false,
        ascii_only: true
      }
    },
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 150,
    assetsInlineLimit: 8192, // 小于8kb的资源内联到JS中
    emptyOutDir: true,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          vant: ['vant'],
          i18n: ['vue-i18n'],
          axios: ['axios'],
          socket: ['socket.io-client'],
          html2canvas: ['html2canvas'],
          qrcode: ['qrcode']
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        compact: true,
        hoistTransitiveImports: true,
        manualChunksWhenAbsoluteSizeGreaterThan: 80000,
        experimentalMinChunkSize: 10000
      },
      plugins: [
        // 进一步优化代码分割
        {
          name: 'optimize-chunks',
          generateBundle(outputOptions, bundle) {
            // 移除空的chunk
            Object.keys(bundle).forEach((key) => {
              const chunk = bundle[key];
              if (chunk.type === 'chunk' && chunk.code && chunk.code.trim() === '') {
                delete bundle[key];
              }
            });
          }
        }
      ]
    }
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'vant', 'vue-i18n', 'axios', 'dayjs'],
    exclude: ['socket.io-client', 'html2canvas', 'qrcode'],
    force: true,
    esbuildOptions: {
      target: 'es2015',
      minify: true,
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true
    }
  },
  // 开发服务器优化
  server: {
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3003',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },
      '/uploads': {
        target: 'http://127.0.0.1:3003',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    },
    // 启用gzip压缩
    compress: true,
    // 优化冷启动
    hmr: {
      overlay: false
    }
  }
})
