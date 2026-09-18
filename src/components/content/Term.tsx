// Termine tecnico con il suo inglese: un pulsante in linea che apre un cartiglio con il termine inglese (in corsivo)
// e, se c'è, la definizione del glossario del modulo. Segue il modello "tooltip" di WAI-ARIA e il criterio 1.4.13:
// si apre al passaggio e al fuoco, resta aperto passando sul cartiglio, si chiude con Esc; al tocco si apre e si
// richiude con un tocco, e un tocco fuori lo chiude. Dai connettori non è arrivato nulla di utilizzabile senza
// Radix (dipendenza nuova): la logica è scritta qui, sui token del foglio.
// Il termine è uno span con role="button" e non un <button>: un pulsante è una scatola indivisibile, e un termine
// di quattro parole non andrebbe più a capo dentro il paragrafo.
import { useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react'
import { ModuleContext } from './ModuleContext'
import { Rich } from './Rich'

const norm = (s: string) => s.trim().toLowerCase()
const GUTTER = 12

export function Term({ en, children }: { en: string; children?: ReactNode }) {
  const glossary = useContext(ModuleContext)?.glossary ?? []
  const it = typeof children === 'string' ? children : ''
  const entry = glossary.find((g) => norm(g.en) === norm(en)) ?? (it ? glossary.find((g) => norm(g.term) === norm(it)) : undefined)

  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  const [pinned, setPinned] = useState(false)
  // Esc chiude anche se il fuoco o il puntatore sono ancora sul termine: si riapre quando tornano
  const [dismissed, setDismissed] = useState(false)
  const open = !dismissed && (hover || focus || pinned)

  const root = useRef<HTMLSpanElement>(null)
  const bubble = useRef<HTMLSpanElement>(null)
  // il fuoco che arriva da un tocco o da un clic non apre: decide il clic, altrimenti si aprirebbe e richiuderebbe subito
  const byPointer = useRef(false)
  const [shift, setShift] = useState(0)
  const tipId = useId()

  // il cartiglio nasce allineato al termine; se esce dalla finestra, a destra o a sinistra, rientra
  useLayoutEffect(() => {
    if (!open || !bubble.current) return
    const rect = bubble.current.getBoundingClientRect()
    const over = rect.right - (document.documentElement.clientWidth - GUTTER)
    setShift(Math.round(Math.max(Math.min(0, -over), GUTTER - rect.left)))
    return () => setShift(0)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setDismissed(true)
      setPinned(false)
    }
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setPinned(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  function toggle(fromPointer: boolean) {
    if (pinned || (!fromPointer && open)) {
      setPinned(false)
      setDismissed(true)
    } else {
      setPinned(true)
      setDismissed(false)
    }
  }

  function onKeyDown(e: ReactKeyboardEvent) {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault() // lo spazio non deve far scorrere la pagina
    toggle(false)
  }

  return (
    <span
      ref={root}
      className="relative"
      onPointerEnter={(e) => {
        // al tocco non c'è "passaggio": lì decide il clic
        if (e.pointerType === 'mouse') setHover(true)
        setDismissed(false)
      }}
      onPointerLeave={() => setHover(false)}
    >
      <span
        role="button"
        tabIndex={0}
        aria-describedby={open ? tipId : undefined}
        onPointerDown={() => {
          byPointer.current = true
        }}
        onFocus={() => {
          if (!byPointer.current) setFocus(true)
          setDismissed(false)
        }}
        onBlur={() => {
          byPointer.current = false
          setFocus(false)
          setPinned(false)
        }}
        onClick={() => {
          byPointer.current = false
          toggle(true)
        }}
        onKeyDown={onKeyDown}
        className="cursor-help underline decoration-border-strong decoration-dotted decoration-1 underline-offset-[0.22em]"
      >
        {children}
      </span>
      {open && (
        <span
          ref={bubble}
          id={tipId}
          role="tooltip"
          style={{ left: shift }}
          className="absolute top-full z-20 mt-1 block w-max max-w-[min(22rem,calc(100vw-1.5rem))] border border-border-strong bg-surface p-3 text-left text-[length:var(--step--1)] leading-normal font-normal text-text not-italic shadow-2 transition-[opacity,translate] duration-[var(--dur-fast)] ease-out starting:-translate-y-1 starting:opacity-0"
        >
          <span className="label mr-2">EN</span>
          <em lang="en">{en}</em>
          {entry && <Rich text={entry.def} inline className="mt-1 block text-muted" />}
        </span>
      )}
    </span>
  )
}
