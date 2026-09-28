// Palette di ricerca (Ctrl+K o ⌘K, Esc per chiudere): cerca in fogli, sezioni della teoria, formule, glossario,
// flashcard, domande d'orale, widget e pagine dell'app con l'indice di src/lib/search.ts, che si costruisce alla
// prima apertura e resta per la sessione. I risultati arrivano raggruppati per tipo, ognuno con il tassello del suo
// foglio (numero e regione; tratteggiato se il foglio è in preparazione).
//
// Tastiera: il fuoco resta nel campo (combobox con aria-activedescendant). Frecce su e giù scorrono i risultati
// attraverso i gruppi e girano agli estremi, Pagina su e giù saltano da un gruppo all'altro, Invio apre, Esc chiude.
// A campo vuoto propone lo spillo (il punto in cui ti sei fermato) e le pagine principali; senza risultati dice
// come cercare meglio e offre il glossario.
// Nessuna animazione: la palette si apre da tastiera decine di volte al giorno e deve essere istantanea; anche la
// selezione cambia senza transizioni. Il rilievo è l'evidenziazione ocra (lo spillo) dei termini trovati.
// Dai connettori (magicuidesign, ui-layouts: "command palette", "search", "dialog") nessun componente adatto:
// restano <dialog> nativo e lo schema combobox + listbox delle ARIA Authoring Practices, scritti qui.
import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { getModuleMeta } from '../../content/manifest'
import { lastStop, REGIONS, sectionLabel, sheetNumber } from '../../lib/atlas'
import { renderRich, renderTex } from '../../lib/rich'
import { highlightRanges, isPlainText, loadSearchIndex, QUICK_PAGES, searchAtlas } from '../../lib/search'
import type { AtlasIndex, Hit, ResultType, SheetRef } from '../../lib/search'
import { useSettledValue } from '../../lib/useSettledValue'
import { useProgress } from '../../store/progress'
import { HATCH, Icon } from '../content/shared'
import type { IconName } from '../content/shared'
import { PinMark } from '../layout/marks'
import { closeDialog, useModalDialog } from './useModalDialog'

/** Risultati mostrati per gruppo prima di "Mostra altri". */
const PER_GROUP = 5
/** Risultati al massimo in un gruppo allargato. */
const MAX_GROUP = 50

type IndexState = { status: 'loading' } | { status: 'ready'; index: AtlasIndex } | { status: 'error' }

/** Una riga della lista: porta a una pagina oppure allarga un gruppo. */
interface Choice {
  key: string
  href?: string
  expand?: ResultType
  mark: ReactNode
  title: ReactNode
  detail?: ReactNode
  /** a destra, da 640 px: il foglio del risultato */
  aside?: ReactNode
  latex?: string
  /** per i lettori di schermo: foglio e stato, che a vista dicono il tassello e la colonna a destra */
  sr?: string
}

interface Section {
  key: string
  label: string
  count?: number
  choices: Choice[]
}

// ---------------------------------------------------------------------------------------------
// Testo delle righe
// ---------------------------------------------------------------------------------------------

// Markdown e KaTeX si rendono una volta per testo: la lista si ridisegna a ogni tasto
const richCache = new Map<string, string>()
function richHtml(text: string): string {
  let html = richCache.get(text)
  if (html === undefined) {
    // dentro un'opzione niente collegamenti: resta il loro testo
    html = renderRich(text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'), { inline: true })
    richCache.set(text, html)
  }
  return html
}
const texCache = new Map<string, string>()
function texHtml(tex: string): string {
  let html = texCache.get(tex)
  if (html === undefined) {
    html = renderTex(tex, false)
    texCache.set(tex, html)
  }
  return html
}

/** Separatore per i lettori di schermo fra titolo e riga secondaria, che a vista stanno su due righe. */
const Sep = () => <span className="visually-hidden">, </span>

/** Testo semplice con i termini trovati evidenziati dallo spillo ocra. */
function Highlighted({ text, terms }: { text: string; terms: readonly string[] }) {
  const ranges = terms.length ? highlightRanges(text, terms) : []
  if (!ranges.length) return <>{text}</>
  const parts: ReactNode[] = []
  let at = 0
  ranges.forEach(([from, to], i) => {
    if (from > at) parts.push(text.slice(at, from))
    parts.push(
      <mark key={i} className="bg-pin text-pin-contrast">
        {text.slice(from, to)}
      </mark>,
    )
    at = to
  })
  if (at < text.length) parts.push(text.slice(at))
  return <>{parts}</>
}

/** Un testo che può essere semplice (si evidenzia) o Markdown con matematica (si rende). */
function Text({ text, plain, terms = [] }: { text: string; plain: boolean; terms?: readonly string[] }) {
  if (plain) return <Highlighted text={text} terms={terms} />
  return <span dangerouslySetInnerHTML={{ __html: richHtml(text) }} />
}

// ---------------------------------------------------------------------------------------------
// Tasselli a sinistra delle righe
// ---------------------------------------------------------------------------------------------

/** Il tassello del foglio, come nel quadro della copertina: numero, campo della regione, tratteggio se non è pronto. */
function SheetTile({ sheet, here = false }: { sheet: SheetRef; here?: boolean }) {
  return (
    <span aria-hidden="true" className={`relative mt-0.5 block size-10 shrink-0 overflow-hidden border border-border-strong ${sheet.ready ? 'bg-surface' : 'bg-bg'}`}>
      {!sheet.ready && <span className={`absolute inset-0 ${HATCH}`} />}
      <span className={`absolute inset-x-0 bottom-0 h-1.5 ${REGIONS[sheet.course]?.fill ?? 'bg-border-strong'}`} />
      <span className={`num absolute top-0.5 left-1 text-[length:var(--step--1)] leading-none ${sheet.ready ? 'text-text' : 'bg-bg px-0.5 text-muted'}`}>{sheet.number}</span>
      {here && (
        <span className="absolute top-0.5 right-0.5">
          <PinMark size={14} />
        </span>
      )}
    </span>
  )
}

function GlyphTile({ icon }: { icon: IconName }) {
  return (
    <span aria-hidden="true" className="mt-0.5 grid size-10 shrink-0 place-items-center border border-border-strong bg-surface text-text">
      <Icon name={icon} size={18} />
    </span>
  )
}

/** Il foglio di un risultato nella colonna a destra; le voci di glossario dicono anche in quanti altri fogli compaiono. */
function SheetAside({ sheet, others = 0 }: { sheet: SheetRef; others?: number }) {
  return (
    <span aria-hidden="true" className="hidden max-w-44 shrink-0 truncate pt-0.5 text-right text-[length:var(--step--1)] text-faint sm:block">
      {sheet.title}
      {others === 1 ? ' e 1 altro' : others > 1 ? ` e altri ${others}` : ''}
    </span>
  )
}

/** "e in 1 altro foglio", "e in altri 3 fogli": il plurale accordato. */
const otherSheets = (n: number) => (n === 1 ? ' e in 1 altro foglio' : n > 1 ? ` e in altri ${n} fogli` : '')

const sheetSr = (sheet: SheetRef, others = 0) => `, foglio ${sheet.number}, ${sheet.title}${otherSheets(others)}${sheet.ready ? '' : ', in preparazione'}`

// ---------------------------------------------------------------------------------------------
// Righe dai risultati
// ---------------------------------------------------------------------------------------------

function hitChoice({ entry, terms }: Hit): Choice {
  const { sheet } = entry
  const detailText = entry.detail && (
    <>
      <Sep />
      <span lang={entry.detailEn ? 'en' : undefined} className={entry.detailEn ? 'italic' : undefined}>
        <Text text={entry.detail} plain={isPlainText(entry.detail)} />
      </span>
    </>
  )
  const base = { key: entry.id, href: entry.href, title: <Text text={entry.title} plain={entry.plain} terms={terms} />, latex: entry.latex }

  if (entry.type === 'pagina') return { ...base, mark: <GlyphTile icon="arrow" />, detail: detailText }
  if (!sheet) return { ...base, mark: <GlyphTile icon="page" />, detail: detailText }
  if (entry.type === 'foglio') {
    return {
      ...base,
      mark: <SheetTile sheet={sheet} />,
      detail: (
        <>
          {!sheet.ready && (
            <>
              <Sep />
              <span className="label mr-2 border border-border px-1 not-italic">In preparazione</span>
            </>
          )}
          {detailText}
        </>
      ),
      sr: `, foglio ${sheet.number}`,
    }
  }
  const others = entry.alsoIn?.length ?? 0
  return { ...base, mark: <SheetTile sheet={sheet} />, detail: detailText, aside: <SheetAside sheet={sheet} others={others} />, sr: sheetSr(sheet, others) }
}

const glossaryChoice = (q: string): Choice => ({
  key: 'glossario-fallback',
  href: `/glossario?q=${encodeURIComponent(q)}`,
  mark: <GlyphTile icon="zoom" />,
  title: `Cerca «${q}» nel glossario`,
  detail: (
    <>
      <Sep />
      Termini in italiano e in inglese, anche dei fogli che l'indice non contiene ancora
    </>
  ),
})

// ---------------------------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------------------------

const HINT = "Cerca fra fogli, sezioni della teoria, formule (anche per simbolo: sigma, h), glossario in italiano e in inglese, flashcard e domande d'orale."

interface CommandPaletteProps {
  onClose: () => void
  /** l'indice di ricerca: nell'app quello del registro, nei test uno finto */
  loadIndex?: () => Promise<AtlasIndex>
}

export function CommandPalette({ onClose, loadIndex = loadSearchIndex }: CommandPaletteProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const navigate = useNavigate()
  const baseId = useId()
  const listId = `${baseId}-lista`
  const [query, setQuery] = useState('')
  const deferred = useDeferredValue(query)
  const q = deferred.trim()
  const [state, setState] = useState<IndexState>({ status: 'loading' })
  const [expanded, setExpanded] = useState<{ q: string; types: ResultType[] }>({ q: '', types: [] })
  const modules = useProgress((s) => s.modules)
  const stop = lastStop(modules)
  useModalDialog(dialog)
  const requestClose = () => closeDialog(dialog.current, onClose)

  // l'indice si prepara appena la palette si apre, mentre si scrive la prima parola
  const loader = useRef(loadIndex)
  useEffect(() => {
    let alive = true
    loader.current().then(
      (index) => alive && setState({ status: 'ready', index }),
      () => alive && setState({ status: 'error' }),
    )
    return () => {
      alive = false
    }
  }, [])

  const index = state.status === 'ready' ? state.index : null
  const results = useMemo(() => (index && q ? searchAtlas(index, q, { perGroup: MAX_GROUP }) : null), [index, q])
  const open = expanded.q === q ? expanded.types : []

  // ---- le sezioni della lista ----
  const sections: Section[] = []
  if (!q) {
    if (stop) {
      const meta = getModuleMeta(stop.moduleId)
      const sheet: SheetRef = index?.entries.get(`foglio:${stop.moduleId}`)?.sheet ?? {
        id: stop.moduleId,
        number: sheetNumber(stop.moduleId) ?? '',
        title: meta?.title ?? stop.moduleId,
        course: meta?.course ?? 'melgani',
        ready: true,
      }
      const section = stop.section ? index?.entries.get(`sezione:${stop.moduleId}#${stop.section}`) : undefined
      sections.push({
        key: 'riprendi',
        label: 'Riprendi',
        choices: [
          {
            key: 'riprendi',
            href: stop.section ? `/m/${stop.moduleId}/teoria#${stop.section}` : `/m/${stop.moduleId}`,
            mark: <SheetTile sheet={sheet} here />,
            title: sheet.title,
            detail: stop.section ? (
              <>
                <Sep />
                {section ? <Text text={section.title} plain={section.plain} /> : sectionLabel(stop.section)}
              </>
            ) : undefined,
            sr: `, foglio ${sheet.number}, ti sei fermato qui`,
          },
        ],
      })
    }
    sections.push({
      key: 'vai',
      label: 'Vai a',
      choices: QUICK_PAGES.map((p) => ({
        key: p.path,
        href: p.path,
        mark: <GlyphTile icon="arrow" />,
        title: p.title,
        detail: (
          <>
            <Sep />
            {p.what}
          </>
        ),
      })),
    })
  } else if (state.status === 'error' || (results && results.total === 0)) {
    sections.push({ key: 'altrove', label: 'Prova altrove', choices: [glossaryChoice(q)] })
  } else if (results) {
    for (const g of results.groups) {
      const all = open.includes(g.type) ? g.items : g.items.slice(0, PER_GROUP)
      const choices = all.map(hitChoice)
      const rest = g.items.length - all.length
      if (rest > 0) {
        choices.push({
          key: `altri-${g.type}`,
          expand: g.type,
          mark: (
            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center text-muted">
              <Icon name="chevron" size={18} />
            </span>
          ),
          title: <span className="text-muted">{rest === 1 ? 'Mostra 1 altro risultato' : `Mostra altri ${rest} risultati`}</span>,
        })
      }
      sections.push({ key: g.type, label: g.label, count: g.total, choices })
    }
  }

  const flat = sections.flatMap((s) => s.choices)
  // indice della prima riga di ogni sezione
  const starts: number[] = []
  for (let i = 0; i < sections.length; i++) starts.push(i === 0 ? 0 : starts[i - 1] + sections[i - 1].choices.length)

  // ---- la riga attiva: torna alla prima quando cambia l'elenco (non quando si allarga un gruppo) ----
  const listKey = `${q}|${state.status}|${stop?.moduleId ?? ''}`
  const [activeRaw, setActiveRaw] = useState({ list: listKey, index: 0 })
  const active = activeRaw.list === listKey ? Math.min(activeRaw.index, Math.max(flat.length - 1, 0)) : 0
  const setActive = (i: number) => setActiveRaw({ list: listKey, index: i })
  const optionId = (i: number) => `${baseId}-o${i}`
  const activeId = flat.length ? optionId(active) : undefined

  // da tastiera la riga attiva resta in vista; con il puntatore no, altrimenti la lista scapperebbe sotto il mouse
  const byKeyboard = useRef(false)
  useEffect(() => {
    if (!byKeyboard.current || !activeId) return
    byKeyboard.current = false
    document.getElementById(activeId)?.scrollIntoView?.({ block: 'nearest' })
  }, [activeId])

  const choose = (c: Choice) => {
    if (c.expand) {
      setExpanded({ q, types: [...open, c.expand] })
      return
    }
    if (!c.href) return
    navigate(c.href)
    requestClose()
  }

  const move = (i: number) => {
    byKeyboard.current = true
    setActive(i)
  }

  // ---- stato a parole: a vista subito, annunciato solo a scrittura ferma (un annuncio, non uno per lettera) ----
  let status: string = HINT
  if (q && state.status === 'loading') status = `Cerco «${q}»: preparo l'indice dell'atlante…`
  else if (q && state.status === 'error') status = "Non riesco a preparare l'indice della ricerca. Chiudi la ricerca e riaprila per riprovare."
  else if (q && results) status = results.total === 0 ? `Nessun risultato per «${q}».` : `${results.total} ${results.total === 1 ? 'risultato' : 'risultati'} per «${q}»`
  const announced = useSettledValue(status)

  const stats = index?.stats

  return (
    <dialog
      ref={dialog}
      aria-labelledby={`${baseId}-titolo`}
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return
        e.preventDefault()
        requestClose()
      }}
      // clic sul fondale: il bersaglio è il dialogo stesso, non il suo contenuto
      onClick={(e) => e.target === e.currentTarget && requestClose()}
      className="mx-auto mt-[8dvh] mb-auto max-h-[min(40rem,84dvh)] w-[min(44rem,calc(100vw-2rem))] max-w-none border border-border-strong bg-surface p-0 text-text shadow-2 backdrop:bg-bg/75 open:flex open:flex-col"
    >
      <h2 id={`${baseId}-titolo`} className="visually-hidden">
        Cerca nell'atlante
      </h2>
      <form
        role="search"
        onSubmit={(e) => e.preventDefault()}
        className="flex shrink-0 items-center gap-3 border-b border-border-strong pr-2 pl-4 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:-outline-offset-2 has-[input:focus-visible]:outline-focus"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true" className="shrink-0 text-muted">
          <path d="M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM15.5 15.5L21 21" />
        </svg>
        <input
          type="text"
          role="combobox"
          // il fuoco va nel campo appena la palette si apre (showModal rispetta autofocus)
          autoFocus
          aria-label="Cerca nell'atlante"
          aria-autocomplete="list"
          aria-expanded={flat.length > 0}
          aria-controls={flat.length > 0 ? listId : undefined}
          aria-activedescendant={activeId}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="go"
          placeholder="Formule, termini, fogli…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return
            const n = flat.length
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault()
              if (n) move((active + (e.key === 'ArrowDown' ? 1 : -1) + n) % n)
            } else if (e.key === 'PageDown' || e.key === 'PageUp') {
              e.preventDefault()
              if (!n) return
              const next = e.key === 'PageDown' ? (starts.find((s) => s > active) ?? starts[0]) : (starts.filter((s) => s < active).at(-1) ?? starts.at(-1)!)
              move(next)
            } else if (e.key === 'Enter') {
              e.preventDefault()
              const c = flat[active]
              if (c) choose(c)
            }
          }}
          className="min-h-14 min-w-0 flex-1 bg-transparent text-[length:var(--step-1)] text-text outline-none placeholder:text-faint focus-visible:outline-none"
        />
        <button
          type="button"
          aria-label="Chiudi la ricerca"
          onClick={requestClose}
          className="grid size-10 shrink-0 cursor-pointer place-items-center border border-transparent text-muted hover:border-border-strong hover:text-text"
        >
          <kbd aria-hidden="true" className="num hidden border border-border px-1.5 text-[length:var(--step--1)] sm:inline">
            Esc
          </kbd>
          <Icon name="cross" size={20} className="sm:hidden" />
        </button>
      </form>

      {/* il testo a vista non è una regione live: lo annuncia la riga nascosta sotto, quando la scrittura si ferma */}
      <p aria-hidden="true" className="m-0 shrink-0 border-b border-border px-4 py-2 text-[length:var(--step--1)] text-muted">
        {status}
      </p>
      <p role="status" className="visually-hidden">
        {announced}
      </p>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {q && results?.total === 0 && (
          <p className="m-0 max-w-[60ch] px-4 py-3 text-muted">
            Prova con l'inizio della parola, con il termine inglese o con il nome del simbolo (sigma, mu, h).
            {stats && stats.readySheets < stats.totalSheets && ` Nell'indice ci sono i contenuti di ${stats.readySheets} ${stats.readySheets === 1 ? 'foglio' : 'fogli'} su ${stats.totalSheets}: degli altri, per ora, trovi solo il titolo.`}
          </p>
        )}
        {flat.length > 0 && (
          <div role="listbox" id={listId} aria-label={q ? 'Risultati' : 'Suggerimenti'}>
            {sections.map((section, si) => (
              <div key={section.key} role="group" aria-labelledby={`${baseId}-g-${section.key}`}>
                <div
                  id={`${baseId}-g-${section.key}`}
                  className="label sticky top-0 z-10 flex items-baseline justify-between gap-3 border-b border-border bg-surface px-4 py-1.5"
                >
                  <span>{section.label}</span>
                  {section.count !== undefined && <span className="num tracking-normal">{section.count}</span>}
                </div>
                {section.choices.map((choice, ci) => {
                  const i = starts[si] + ci
                  const selected = i === active
                  return (
                    <div
                      key={choice.key}
                      id={optionId(i)}
                      role="option"
                      aria-selected={selected}
                      // il fuoco resta nel campo anche cliccando
                      onMouseDown={(e) => e.preventDefault()}
                      onPointerMove={() => i !== active && setActive(i)}
                      onClick={() => choose(choice)}
                      className="flex min-h-14 cursor-pointer scroll-mt-9 items-start gap-3 px-4 py-2 aria-selected:bg-surface-2 aria-selected:outline-2 aria-selected:-outline-offset-2 aria-selected:outline-focus"
                    >
                      {choice.mark}
                      <span className="min-w-0 flex-1 pt-0.5">
                        <span className="line-clamp-2 leading-snug text-text">{choice.title}</span>
                        {choice.detail && <span className="block truncate text-[length:var(--step--1)] leading-snug text-muted">{choice.detail}</span>}
                        {choice.latex && (
                          <span
                            aria-hidden="true"
                            className="mt-1 block overflow-hidden text-[length:var(--step--1)] whitespace-nowrap text-muted"
                            dangerouslySetInnerHTML={{ __html: texHtml(choice.latex) }}
                          />
                        )}
                        {choice.sr && <span className="visually-hidden">{choice.sr}</span>}
                      </span>
                      {choice.aside}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-border-strong px-4 py-2 text-[length:var(--step--1)] text-muted">
        <span aria-hidden="true" className="hidden items-center gap-1.5 sm:flex">
          <kbd className="num border border-border px-1">↑</kbd>
          <kbd className="num border border-border px-1">↓</kbd>
          scegli
        </span>
        <span aria-hidden="true" className="hidden items-center gap-1.5 sm:flex">
          <kbd className="num border border-border px-1">Invio</kbd>
          apri
        </span>
        {stats && (
          <span className="ml-auto">
            Indice: <span className="num">{stats.readySheets}</span> {stats.readySheets === 1 ? 'foglio pronto' : 'fogli pronti'} su <span className="num">{stats.totalSheets}</span>
            {stats.failedSheets > 0 && (
              <>
                {' · '}
                <span className="num">{stats.failedSheets}</span> {stats.failedSheets === 1 ? 'non si è caricato: riapri la ricerca per riprovare' : 'non si sono caricati: riapri la ricerca per riprovare'}
              </>
            )}
          </span>
        )}
      </footer>
    </dialog>
  )
}
