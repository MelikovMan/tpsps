import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
plugins: [react(),
    /*VitePWA({ // Раскомментировать плагин
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Wiki App',
        short_name: 'Wiki',
        description: 'Collaborative Wiki Application',
        theme_color: '#1976d2',
        icons: [
          {
            src: 'public/web-app-manifest-192x192x.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'public/web-app-manifest-192x192x.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'public/web-app-manifest-192x192x.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff'
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 дней
              }
            }
          }
        ]
      }
    })
      */
  ],
})
