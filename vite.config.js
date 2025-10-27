import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: mode === 'development' ? {
    host: '0.0.0.0',
    allowedHosts: ['.ngrok-free.app', '.ngrok.io', 'localhost']
  } : {}
}))