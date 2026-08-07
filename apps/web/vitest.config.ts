import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    reporters: ["verbose"],
    // next-auth imports "next/server", whose package.json in this Next version
    // resolves fine through Next's own bundler but not through Node's raw ESM
    // loader (which is what Vitest uses for anything not routed through Vite).
    // Force it through Vite's resolver instead.
    server: {
      deps: {
        inline: [/next-auth/, /^next$/],
      },
    },
  },
})
