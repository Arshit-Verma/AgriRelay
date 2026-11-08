import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { API_CACHE_NAME } from './src/api/cacheNames.js';

const DAY_IN_SECONDS = 24 * 60 * 60;

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'AgriRelay',
        short_name: 'AgriRelay',
        description: 'Field intelligence for agricultural extension officers',
        theme_color: '#2D6A4F',
        background_color: '#F8F9F2',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            // Fresh data when the server answers, the last saved copy when it doesn't
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            method: 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: API_CACHE_NAME,
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 50, maxAgeSeconds: 7 * DAY_IN_SECONDS },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            urlPattern: ({ url }) => url.hostname.endsWith('tile.openstreetmap.org'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'agrirelay-map-tiles',
              expiration: { maxEntries: 150, maxAgeSeconds: 14 * DAY_IN_SECONDS },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'agrirelay-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 365 * DAY_IN_SECONDS },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
