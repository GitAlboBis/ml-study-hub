// Collegamento interno: `to` è "moduleId" oppure "moduleId#slug" (la sezione di teoria di quel modulo); con il solo
// "#slug" resta nel foglio corrente. Come in un atlante, il rimando dice a quale foglio porta.
import { useContext } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { manifest } from '../../content/manifest'
import { ModuleContext } from './ModuleContext'

/** Numero del foglio: il posto del modulo nel manifest, da 01. */
function sheetOf(moduleId: string): { number: string; title: string } | null {
  const index = manifest.findIndex((m) => m.id === moduleId)
  return index < 0 ? null : { number: String(index + 1).padStart(2, '0'), title: manifest[index].title }
}

export function ModLink({ to, children }: { to: string; children?: ReactNode }) {
  const current = useContext(ModuleContext)?.id
  const hash = to.indexOf('#')
  const moduleId = (hash < 0 ? to : to.slice(0, hash)) || current || ''
  const slug = hash < 0 ? '' : to.slice(hash + 1)
  // le sezioni con slug stanno nella scheda "teoria" della pagina modulo (/m/:moduleId/:tab?)
  const href = slug ? `${moduleId ? `/m/${moduleId}/teoria` : ''}#${slug}` : `/m/${moduleId}`
  const sheet = moduleId === current ? null : sheetOf(moduleId)
  return (
    <Link to={href} title={sheet ? `Foglio ${sheet.number} · ${sheet.title}` : undefined}>
      {children}
      {sheet && (
        <>
          {' '}
          <span className="num inline-block border border-border px-1 align-baseline text-[0.72em] leading-[1.35] text-muted no-underline">
            <span className="visually-hidden">foglio</span> {sheet.number}
          </span>
        </>
      )}
    </Link>
  )
}
