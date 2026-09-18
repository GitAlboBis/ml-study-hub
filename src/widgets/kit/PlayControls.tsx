// Trasporto dello storyboard: Passo indietro, Play/Pausa, Passo avanti, velocità e indicatore dei passi.
//
// TASTIERA. Dentro il gruppo: Spazio sul pulsante Play lo preme (è un pulsante vero); freccia destra
// e sinistra fanno un passo avanti e indietro da qualsiasi pulsante del gruppo. Le frecce NON sono
// intercettate sui radio della velocità, dove servono a scegliere. Le scorciatoie valgono solo con
// il fuoco nel gruppo: in tutto il widget si scontrerebbero con slider e punti trascinabili.
//
// RENDER. Non si legge mai `sb.progress`: leggerlo iscrive il widget a un render per fotogramma
// (vedi useStoryboard). L'indicatore mostra solo stati discreti: passi fatti, passo corrente, passi
// da fare. Il passo corrente è lo spillo ocra ed è anche più alto: mai il solo colore.
//
// MOTO. Nessuna animazione su Play, Pausa e Passo: sono azioni ripetute e da tastiera, devono
// rispondere subito. L'unico moto è la risposta alla pressione dei pulsanti (ActionButton).
//
// Connettori consultati (21st.dev "media player controls", ui-layouts, Magic UI): solo lettori
// audio/video con barra di avanzamento continua, icone tonde e ombre. Da lì viene lo schema
// "indietro · play · avanti · velocità"; il resto è scritto per questo mondo.
import { useId } from 'react'
import type { KeyboardEvent } from 'react'
import { ActionButton } from './ActionButton'
import { Segmented } from './Segmented'
import type { Storyboard } from './useStoryboard'

export interface PlayControlsProps {
  sb: Storyboard
  /** I passi dello storyboard (gli stessi dati a useStoryboard): con questi l'indicatore mostra una tacca per passo e il totale. */
  steps?: readonly { id: string; label: string }[]
  /** Velocità offerte. Predefinito: 0.5×, 1×, 2×. */
  speeds?: readonly number[]
}

const DEFAULT_SPEEDS = [0.5, 1, 2] as const
const two = (n: number) => String(n).padStart(2, '0')

const ICON = { viewBox: '0 0 24 24', width: 18, height: 18, fill: 'currentColor', 'aria-hidden': true } as const

export function PlayControls({ sb, steps, speeds = DEFAULT_SPEEDS }: PlayControlsProps) {
  const speedId = useId()

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
    // i radio della velocità usano le frecce per conto loro
    if (e.target instanceof HTMLInputElement) return
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      sb.next()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      sb.prev()
    }
  }

  // la velocità corrente può non essere fra quelle offerte (opts.speed dell'autore): la si aggiunge
  const offered = speeds.includes(sb.speed) ? speeds : [...speeds, sb.speed].sort((a, b) => a - b)

  return (
    <div role="group" aria-label="Riproduzione" onKeyDown={onKeyDown} className="grid gap-2">
      {/* la scala dei passi sta subito sotto il terreno, come la scala grafica di una carta */}
      {steps !== undefined && steps.length > 1 && (
        <ol aria-label="Passi" className="m-0 flex list-none gap-px p-0">
          {steps.map((s, i) => {
            const current = i === sb.index
            return (
              <li key={s.id} className="min-w-0 flex-1">
                {/* fuori dal giro del Tab: da tastiera ci sono i pulsanti di passo e le frecce. Il bersaglio è alto
                    40 px per il dito e il mouse; il segno resta sottile, appoggiato in basso (items-end) */}
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={`Vai al passo ${i + 1}: ${s.label}`}
                  aria-current={current ? 'step' : undefined}
                  title={s.label}
                  onClick={() => sb.goto(i)}
                  className="flex h-10 w-full cursor-pointer items-end border-0 bg-transparent p-0"
                >
                  <span
                    className={`block w-full ${
                      current ? 'h-3 border border-border-strong bg-pin' : i < sb.index ? 'h-1.5 bg-text' : 'h-1.5 bg-border'
                    }`}
                  />
                </button>
              </li>
            )
          })}
        </ol>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <ActionButton iconOnly aria-label="Passo indietro" aria-keyshortcuts="ArrowLeft" title="Passo indietro (freccia sinistra)" onClick={sb.prev}>
            <svg {...ICON}>
              <path d="M6 5h3v14H6zM19 5v14L10 12z" />
            </svg>
          </ActionButton>
          <ActionButton variant="primary" onClick={sb.toggle} className="min-w-[6.5rem]">
            <svg {...ICON}>{sb.playing ? <path d="M7 5h4v14H7zM13 5h4v14h-4z" /> : <path d="M7 4v16l13-8z" />}</svg>
            {sb.playing ? 'Pausa' : 'Play'}
          </ActionButton>
          <ActionButton iconOnly aria-label="Passo avanti" aria-keyshortcuts="ArrowRight" title="Passo avanti (freccia destra)" onClick={sb.next}>
            <svg {...ICON}>
              <path d="M15 5h3v14h-3zM5 5v14l9-7z" />
            </svg>
          </ActionButton>
        </div>
        <p className="m-0 flex items-baseline gap-2">
          <span className="label">Passo</span>
          <span className="num text-text">{steps !== undefined ? `${two(sb.index + 1)}/${two(steps.length)}` : two(sb.index + 1)}</span>
        </p>
        <div className="ml-auto">
          <Segmented
            id={speedId}
            label="Velocità"
            inline
            options={offered.map((s) => ({ value: String(s), label: `${s}×` }))}
            value={String(sb.speed)}
            onChange={(v) => sb.setSpeed(Number(v))}
          />
        </div>
      </div>
    </div>
  )
}
