import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * 获取构建时间戳
 * 优先使用 CI 环境变量，保证可复现构建
 * 验证时间戳格式，避免无效值
 */
function getBuildTime(): string {
  const buildTime = process.env.BUILD_TIME
  if (buildTime && !isNaN(Number(buildTime))) {
    return buildTime
  }
  return Date.now().toString()
}

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  const buildTime = getBuildTime()

  return {
    define: {
      'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime)
    },
    plugins: [
      react()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    build: {
      // 开发环境生成 sourcemap，便于调试；生产环境不生成，减小包体积和提升安全性
      sourcemap: isDev,
      // CSS 代码分割，提升首屏加载
      cssCodeSplit: true,
      // 静态资源目录
      assetsDir: 'assets',
      // 构建输出目录（相对于项目根目录）
      outDir: '../dist',
      // Rollup 配置：分块策略优化缓存
      rollupOptions: {
        output: {
          // 依赖 Vite 自动分块，避免过度分割导致过多 HTTP 请求
          // 仅将大型第三方库单独打包
          manualChunks: (id) => {
            // React 核心库单独打包（最稳定的长期缓存）
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'vendor-react'
            }
            // 路由库单独打包
            if (id.includes('node_modules/react-router-dom/')) {
              return 'vendor-router'
            }
          }
        }
      }
    },
    server: {
      host: '0.0.0.0',
      allowedHosts: true,
      proxy: {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
          // 支持 WebSocket 代理（用于实时功能）
          ws: true,
        }
      }
    },
    // 优化依赖预构建，减少冷启动时间
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'lucide-react',
        '@radix-ui/react-avatar',
        '@radix-ui/react-dialog',
        '@radix-ui/react-slot',
        '@radix-ui/react-switch'
      ]
    }
  }
})
