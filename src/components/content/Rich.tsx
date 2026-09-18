import { useMemo } from 'react'
import { useInRouterContext, useNavigate } from 'react-router'
import { followInternalLink } from '../../lib/internalLinks'
import { renderRich } from '../../lib/rich'
import type { Rich as RichText } from '../../content/types'

function RouterRich({ html, Tag, className }: { html: string; Tag: 'span' | 'div'; className?: string }) {
  const navigate = useNavigate()
  return <Tag className={className} onClick={(e) => followInternalLink(e, navigate)} dangerouslySetInnerHTML={{ __html: html }} />
}

// Il CSS di KaTeX non si importa qui: lo carica l'app una volta sola (src/main.tsx), prima dei propri override
export function Rich({ text, inline = false, className }: { text: RichText; inline?: boolean; className?: string }) {
  const html = useMemo(() => renderRich(text, { inline }), [text, inline])
  const Tag = inline ? 'span' : 'div'
  // fuori da un router (test, anteprime) i collegamenti restano normali
  if (useInRouterContext()) return <RouterRich html={html} Tag={Tag} className={className} />
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
