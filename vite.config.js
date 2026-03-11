import { defineConfig } from 'vite'
import react from '@vitejs/react-web' // или просто react()

export default defineConfig({
  plugins: [react()],
  base: '/rust-vortex/', // Добавь эту строку!
})