// Segni convenzionali dell'indice e della copertina: lo stato del rilievo di un foglio e lo spillo.
// Sono decorativi (aria-hidden): chi li usa scrive sempre anche il testo, in chiaro o per i lettori di schermo.
// Lo stato non è mai solo colore: la forma cambia (vuoto, mezzo campo, campo pieno con segno di spunta,
// campo pieno con freccia di ritorno) e il colore del campo è quello della regione.
import type { CourseId } from '../../content/types'
import type { ModuleStatus } from '../../store/progress'

// senza regione (la legenda) il campo è un grigio d'inchiostro, così conta solo la forma
const field = (course?: CourseId) => (course ? `var(--course-${course})` : 'var(--text-muted)')
const ink = (course?: CourseId) => (course ? `var(--course-${course}-ink)` : 'var(--surface)')

export function StatusMark({ status, course, size = 16, className = '' }: { status: ModuleStatus; course?: CourseId; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" className={`shrink-0 ${className}`}>
      {status === 'in-corso' && <rect x="2" y="12" width="20" height="10" fill={field(course)} />}
      {(status === 'completato' || status === 'da-ripassare') && <rect x="2" y="2" width="20" height="20" fill={field(course)} />}
      <rect x="2" y="2" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" />
      {status === 'completato' && <path d="M6.5 12.5l3.5 3.5 7.5-8" fill="none" stroke={ink(course)} strokeWidth="2.5" strokeLinecap="square" />}
      {status === 'da-ripassare' && <path d="M8 9a5.5 5.5 0 1 1-.8 4.2M8 5v4h4" fill="none" stroke={ink(course)} strokeWidth="2.5" strokeLinecap="square" />}
    </svg>
  )
}

/** Lo spillo ocra: "ti sei fermato qui". */
export function PinMark({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" className={`shrink-0 ${className}`}>
      <rect x="0" y="0" width="24" height="24" fill="var(--pin)" />
      <circle cx="12" cy="9" r="4" fill="none" stroke="var(--pin-contrast)" strokeWidth="2.5" />
      <path d="M12 13v8" stroke="var(--pin-contrast)" strokeWidth="2.5" />
    </svg>
  )
}

/** Glifo a un tratto della barra e dell'indice (griglia 24, tratto 2, estremità squadrate): `d` da destinations.ts o dalla barra. */
export function NavGlyph({ d, size = 20, className = '' }: { d: string; size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      <path d={d} />
    </svg>
  )
}

/** Il tassello di una regione: un quadrato del suo campo con il bordo a inchiostro, come nelle legende. */
export function RegionSwatch({ course, size = 14 }: { course: CourseId; size?: number }) {
  return (
    <svg viewBox="0 0 14 14" width={size} height={size} aria-hidden="true" focusable="false" className="shrink-0">
      <rect x="0.75" y="0.75" width="12.5" height="12.5" fill={field(course)} stroke="var(--border-strong)" strokeWidth="1.5" />
    </svg>
  )
}
