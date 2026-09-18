// La formula viva: la legenda numerica del terreno. `tex` è LaTeX con dei segnaposto:
//   \val{nome}      → values[nome] con `format` (predefinito: due decimali, 0.5 → 0.50)
//   \val[d]{nome}   → values[nome] con d decimali (\val[0]{k} per un conteggio)
// Una stringa in `values` entra com'è (come testo se non è un numero); un nome senza valore o un
// valore non finito diventa un trattino o ∞, mai un errore rosso di KaTeX.
//
// COSTO. Un widget in riproduzione ridisegna a ogni fotogramma, ma KaTeX lavora solo quando cambia
// un valore FORMATTATO: la sostituzione produce una stringa LaTeX, e l'HTML è memoizzato su quella
// stringa (più una piccola cache condivisa, così uno storyboard in loop o uno slider che torna
// indietro ritrovano il già fatto). Se la stringa è la stessa React non tocca nemmeno il DOM.
//
// MOTO. Quando un numero cambia lampeggia: sola opacity, 240 ms, ease-out (Web Animations API: gira
// fuori dal thread di React e si può riprendere a metà). Durante un trascinamento il numero cambia
// a ogni fotogramma e il lampo riparte ogni volta: a schermo resta attenuato e fermo, non
// sfarfalla, e torna a inchiostro pieno 240 ms dopo l'ultimo cambio. Poiché ogni cambio rigenera
// l'HTML della formula, i lampi ancora in corso sugli altri numeri vengono ripresi dal punto in
// cui erano. Niente lampo al montaggio e niente con prefers-reduced-motion.
//
// ACCESSIBILITÀ. KaTeX produce anche MathML. I valori sono inoltre ripetuti in una regione
// aria-live="polite" nascosta alla vista, aggiornata solo quando si fermano (useSettled).
import katex from 'katex'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { fixed, formatValue, typographic } from './format'
import type { NumberFormat } from './format'
import { useReducedMotion } from './useReducedMotion'
import { useSettled } from './useSettled'

export interface LiveFormulaProps {
  /** LaTeX con segnaposto \val{nome} o \val[decimali]{nome}. */
  tex: string
  values: Readonly<Record<string, number | string | undefined>>
  /** Formato dei numeri per \val{nome} senza decimali espliciti. Predefinito: due decimali. */
  format?: (value: number, name: string) => string
  /** Formula in display (predefinito) oppure in linea. */
  display?: boolean
  /** false toglie la regione aria-live, se gli stessi valori sono già annunciati da un Readout. */
  announce?: boolean
  className?: string
}

const VAL = /\\val(?:\[(\d+)\])?\{([^{}]+)\}/g

const FLASH_MS = 240
const FLASH_FROM = 0.45
const FLASH_EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)'

const PLAIN_NUMBER = /^-?\d+(?:\.\d+)?$/
const TEX_SPECIAL = /[\\{}%$#&_^~]/g
const escapeTex = (text: string) =>
  text.replace(TEX_SPECIAL, (c) => (c === '\\' ? '\\textbackslash{}' : c === '^' ? '\\^{}' : c === '~' ? '\\~{}' : `\\${c}`))

/** Il testo di un valore, scritto in LaTeX: i numeri restano matematica, tutto il resto è \text{}. */
function toTex(text: string): string {
  if (PLAIN_NUMBER.test(text)) return text
  if (text === '∞') return '\\infty'
  if (text === '-∞') return '-\\infty'
  return `\\text{${escapeTex(text)}}`
}

interface Substitution {
  /** LaTeX con i valori al posto dei segnaposto, ciascuno marcato con data-val = indice del segnaposto */
  src: string
  /** i valori in parole per chi ascolta, un nome una volta sola: "h = 0.50, N = 40"; vuoto senza segnaposto */
  spoken: string
}

function substitute(tex: string, values: LiveFormulaProps['values'], format: LiveFormulaProps['format']): Substitution {
  const said = new Map<string, string>()
  let slot = 0
  const src = tex.replace(VAL, (_whole, digits: string | undefined, rawName: string) => {
    const name = rawName.trim()
    const value = values[name]
    let numberFormat: NumberFormat | undefined
    if (digits !== undefined) numberFormat = fixed(Number(digits))
    else if (format !== undefined) numberFormat = (v) => format(v, name)
    const text = value === undefined ? '—' : formatValue(value, numberFormat)
    if (!said.has(name)) said.set(name, typographic(text))
    // le graffe fanno del valore un solo atomo: il meno di "-1.50" resta un segno, non un operatore
    return `\\htmlData{val=${slot++}}{${toTex(text)}}`
  })
  return { src, spoken: [...said].map(([name, text]) => `${name} = ${text}`).join(', ') }
}

// Cache condivisa fra le formule, per stringa LaTeX già sostituita. Piccola e a perdere: oltre il
// tetto esce la voce più vecchia (Map conserva l'ordine di inserimento).
const CACHE_MAX = 256
const cache = new Map<string, string>()

function renderLive(src: string, display: boolean): string {
  const key = `${display ? 'D' : 'I'}${src}`
  const hit = cache.get(key)
  if (hit !== undefined) return hit
  const html = katex.renderToString(src, {
    displayMode: display,
    throwOnError: false,
    strict: 'ignore',
    output: 'htmlAndMathml',
    // \htmlData è l'unico comando HTML ammesso: serve a ritrovare i numeri vivi nel DOM
    trust: (context) => context.command === '\\htmlData',
  })
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next()
    if (!oldest.done) cache.delete(oldest.value)
  }
  cache.set(key, html)
  return html
}

export function LiveFormula({ tex, values, format, display = true, announce = true, className = '' }: LiveFormulaProps) {
  const reduced = useReducedMotion()
  const root = useRef<HTMLSpanElement>(null)
  /** testo mostrato l'ultima volta per ogni nome, e istante in cui è partito il lampo di ogni nome */
  const shown = useRef(new Map<string, string>())
  const flashStart = useRef(new Map<string, number>())

  // Sostituire costa una regex e qualche toFixed: si rifà a ogni render. KaTeX no: solo se `src` cambia.
  const { src, spoken } = substitute(tex, values, format)
  const settled = useSettled(spoken)
  const html = useMemo(() => renderLive(src, display), [src, display])
  const names = useMemo(() => [...tex.matchAll(VAL)].map((m) => m[2].trim()), [tex])

  useLayoutEffect(() => {
    const el = root.current
    if (el === null) return
    const now = performance.now()
    const live = [...el.querySelectorAll<HTMLElement>('.katex-html [data-val]')]

    // che cosa è cambiato rispetto all'ultima volta (al montaggio `shown` è vuoto: niente lampo)
    const current = new Map<string, string>()
    for (const node of live) current.set(names[Number(node.dataset.val)] ?? '', node.textContent ?? '')
    for (const [name, text] of current) {
      const before = shown.current.get(name)
      if (before !== undefined && before !== text) flashStart.current.set(name, now)
    }
    shown.current = current
    if (reduced) {
      flashStart.current.clear()
      return
    }

    for (const node of live) {
      const name = names[Number(node.dataset.val)] ?? ''
      const start = flashStart.current.get(name)
      if (start === undefined) continue
      const elapsed = now - start
      if (elapsed >= FLASH_MS) {
        flashStart.current.delete(name)
        continue
      }
      if (typeof node.animate !== 'function') continue
      const flash = node.animate([{ opacity: FLASH_FROM }, { opacity: 1 }], { duration: FLASH_MS, easing: FLASH_EASING })
      // un lampo partito prima che l'HTML venisse rigenerato riprende da dov'era
      if (elapsed > 0) flash.currentTime = elapsed
    }
  }, [html, names, reduced])

  const Tag = display ? 'div' : 'span'
  return (
    // min-w-0 e lo scorrimento orizzontale: una formula lunga non deve allargare il widget su un telefono (390 px)
    <Tag className={`relative ${display ? 'block min-w-0 max-w-full' : ''} ${className}`}>
      <span
        ref={root}
        // I numeri vivi hanno un velo dell'ocra dell'evidenza, come passati con l'evidenziatore: si capisce
        // quali cifre rispondono ai comandi. Un velo e non un filetto: sotto un numeratore il filetto
        // raddoppierebbe la linea di frazione. Il colore resta un token (color-mix sul token).
        className={`${display ? 'math-display max-w-full overflow-x-auto overflow-y-hidden' : 'math-inline'} [&_[data-val]]:bg-viz-highlight/25`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {announce && spoken !== '' && (
        <span className="visually-hidden" aria-live="polite" aria-atomic="true">
          {settled}
        </span>
      )}
    </Tag>
  )
}
