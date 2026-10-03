import react from '@vitejs/plugin-react'
import { defineConfig, type ProxyOptions } from 'vite'

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const espnProxy: ProxyOptions = {
  target: 'https://site.api.espn.com',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/espn/, ''),
  headers: {
    'User-Agent': BROWSER_UA,
    Accept: 'application/json',
  },
  configure(proxy) {
    proxy.on('proxyReq', (proxyReq) => {
      proxyReq.setHeader('user-agent', BROWSER_UA)
      proxyReq.removeHeader('origin')
      proxyReq.removeHeader('referer')
    })
  },
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/mlb': {
        target: 'https://statsapi.mlb.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mlb/, ''),
      },
      '/espn': espnProxy,
    },
  },
  preview: {
    host: true,
    port: 4173,
    proxy: {
      '/espn': espnProxy,
    },
  },
})
