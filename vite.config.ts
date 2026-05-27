import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'EcoWit',
        short_name: 'EcoWit',
        description: 'Plante, regue, colecione. Cuide do planeta de forma divertida.',
        theme_color: '#2ecc71',
        background_color: '#fff8f6',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        // Icons removidos por ora (vamos adicionar PNGs gerados depois).
        // Sem icons o manifest ainda funciona pra "Adicionar à tela inicial",
        // só usa o favicon SVG como fallback.
        icons: [],
      },
    }),
  ],
})
