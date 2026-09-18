import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(viteConfig, defineConfig({
  // i test d'interazione dei widget (jsdom, user-event) superano i 5 s predefiniti quando la suite gira tutta in parallelo
  test: { environment: 'jsdom', include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'], globals: false, testTimeout: 30_000 },
}))
