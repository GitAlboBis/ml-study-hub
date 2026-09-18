import mdx from '@mdx-js/rollup'
import tailwind from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // MDX va compilato prima del plugin React (fase 'pre'), come da guida MDX per Vite.
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkGfm, remarkMath],
        rehypePlugins: [rehypeSlug, [rehypeKatex, { strict: 'ignore' }]],
        providerImportSource: '@mdx-js/react',
      }),
    },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    tailwind(),
  ],
  build: { chunkSizeWarningLimit: 1500 },
})
