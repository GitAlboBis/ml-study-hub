import { useMemo } from 'react'
import { renderTex } from '../../lib/rich'

// Il CSS di KaTeX non si importa qui: lo carica l'app una volta sola (src/main.tsx), prima dei propri override
export function M({ tex, display = false }: { tex: string; display?: boolean }) {
  const html = useMemo(() => renderTex(tex, display), [tex, display])
  return <span className={display ? 'math-display' : 'math-inline'} dangerouslySetInnerHTML={{ __html: html }} />
}
