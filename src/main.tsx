import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import 'katex/dist/katex.min.css'
// caratteri ospitati in locale: l'app si studia anche senza rete
import '@fontsource-variable/sofia-sans/wght.css'
import '@fontsource-variable/sofia-sans/wght-italic.css'
import '@fontsource-variable/sofia-sans-condensed/wght.css'
import '@fontsource-variable/sofia-sans-extra-condensed/wght.css'
import '@fontsource-variable/overpass-mono/wght.css'
import './styles/index.css'
import { createAppRouter } from './router'

const router = createAppRouter()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
