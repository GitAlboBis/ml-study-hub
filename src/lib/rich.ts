import katex from 'katex'
import { Marked } from 'marked'
import type { Latex, Rich } from '../content/types'

// Tre alternative, in ordine: codice Markdown (gruppo 1, resta com'è), $$display$$ (gruppo 2), $inline$ (gruppo 3).
// Un "$" preceduto da "\" è un dollaro letterale e non apre matematica. Dentro la formula "\x" conta come
// un'unità sola, così "\$" non la chiude e "\\" a fine formula non viene preso per un escape del "$".
const MATH = /(```[\s\S]*?```|`[^`\n]+`)|(?<!\\)\$\$((?:\\[\s\S]|[^\\])+?)\$\$|(?<!\\)\$((?:\\[^\n]|[^$\\\n])+?)\$/g

// Segnaposto in caratteri a uso privato: non sono né punteggiatura né spazio, quindi l'enfasi Markdown
// attorno alla formula si comporta come attorno a una parola, e non possono comparire nei testi.
const OPEN = ''
const CLOSE = ''
const PLACEHOLDER = new RegExp(`${OPEN}(\\d+)${CLOSE}`, 'g')

const marked = new Marked({ gfm: true, breaks: false })

export function extractMath(src: Rich): { tex: Latex; display: boolean }[] {
  const out: { tex: Latex; display: boolean }[] = []
  for (const m of src.matchAll(MATH)) {
    if (m[1] !== undefined) continue
    out.push({ tex: (m[2] ?? m[3]).trim(), display: m[2] !== undefined })
  }
  // sort è stabile: dentro ogni gruppo resta l'ordine di comparsa
  return out.sort((p, q) => Number(q.display) - Number(p.display))
}

export function renderTex(tex: Latex, display: boolean, throwOnError = false): string {
  return katex.renderToString(tex, { displayMode: display, throwOnError, strict: 'ignore', output: 'htmlAndMathml' })
}

export function renderRich(src: Rich, opts: { inline?: boolean; throwOnError?: boolean } = {}): string {
  // La matematica esce dal testo prima di Markdown (underscore, pipe, "<" non lo riguardano) e rientra dopo
  const chunks: string[] = []
  const protectedSrc = src.replace(
    MATH,
    (whole: string, code: string | undefined, display: string | undefined, inline: string | undefined) => {
      if (code !== undefined) return whole
      chunks.push(renderTex((display ?? inline ?? '').trim(), display !== undefined, opts.throwOnError))
      return `${OPEN}${chunks.length - 1}${CLOSE}`
    },
  )
  const html = opts.inline
    ? marked.parseInline(protectedSrc, { async: false })
    : marked.parse(protectedSrc, { async: false })
  return html.replace(PLACEHOLDER, (_m, i: string) => chunks[Number(i)])
}
