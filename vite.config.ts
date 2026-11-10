import { defineConfig } from 'vitest/config'

const configuredPort = Number.parseInt(process.env.PORT ?? '5173', 10)

export default defineConfig({
  base: './',
  server: {
    port: Number.isNaN(configuredPort) ? 5173 : configuredPort,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
  },
})
