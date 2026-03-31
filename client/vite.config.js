import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Trigger restart for Tailwind configuration
export default defineConfig({
  plugins: [react()],
})
