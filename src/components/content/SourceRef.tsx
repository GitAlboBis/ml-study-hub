// Rimando alla pagina originale: un tassello "Cap. 2 · slide 53" o "Note 1 · p. 38" che apre /fonti/:doc/:page
// (le pagine sono in public/sources/<doc>/pNNN.webp). Sta in linea nel testo e nel margine delle cornici.
import { Link } from 'react-router'
import type { DocId } from '../../content/types'
import { Icon } from './shared'

interface SourceInfo {
  /** sigla nel tassello */
  short: string
  /** nome completo, nel suggerimento al passaggio */
  long: string
  /** le slide si citano per numero di slide, le note per pagina */
  slides: boolean
}

const SOURCES: Record<DocId, SourceInfo> = {
  part1: { short: 'Note 1', long: 'Machine Learning I, Part 1: note del corso (Melgani)', slides: false },
  part2: { short: 'Note 2', long: 'Machine Learning I, Part 2: note del corso (Passerini)', slides: false },
  ch1: { short: 'Cap. 1', long: 'Slide del Capitolo 1 (Melgani)', slides: true },
  ch2: { short: 'Cap. 2', long: 'Slide del Capitolo 2 (Melgani)', slides: true },
  ch3: { short: 'Cap. 3', long: 'Slide del Capitolo 3 (Melgani)', slides: true },
  ch4: { short: 'Cap. 4', long: 'Slide del Capitolo 4 (Melgani)', slides: true },
  dl: { short: 'Note DL', long: 'Deep Learning, Full Notes (Ricci)', slides: false },
  examq: { short: 'Banca', long: "Banca delle domande d'orale", slides: false },
}

interface SourceRefProps {
  doc: DocId
  page: number
  /**
   * Da solo, fuori dalla riga di testo (il margine "Fonte" delle cornici): bersaglio alto 40 px come ogni comando.
   * In linea nel testo resta un tassello alto una riga (24 px, l'eccezione dei bersagli dentro una frase).
   */
  block?: boolean
}

export function SourceRef({ doc, page, block = false }: SourceRefProps) {
  // l'MDX non è tipizzato: un doc fuori elenco si mostra com'è, senza rompere il foglio
  const info: SourceInfo = SOURCES[doc] ?? { short: String(doc), long: String(doc), slides: false }
  return (
    <Link
      to={`/fonti/${doc}/${page}`}
      title={`Apri la pagina originale: ${info.long}`}
      className={`inline-flex ${block ? 'min-h-10 px-2' : 'min-h-6 px-1.5'} items-center gap-1.5 border border-border bg-surface align-middle text-text no-underline transition-[border-color,background-color] duration-[var(--dur-fast)] ease-out hover:border-border-strong hover:bg-surface-2`}
    >
      <Icon name="page" size={14} className="text-faint" />
      <span className="visually-hidden">Fonte: </span>
      <span className="label text-text">{info.short}</span>{' '}
      <span className="num text-[length:var(--step--1)] text-muted">
        {info.slides ? 'slide' : 'p.'} {page}
      </span>
    </Link>
  )
}
