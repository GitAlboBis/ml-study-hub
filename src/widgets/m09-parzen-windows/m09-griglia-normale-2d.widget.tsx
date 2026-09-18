// Widget m09-griglia-normale-2d ("La griglia 2-D e il giallo della legge h_N"), concetto c56.
// La figura della slide p64 (normale standard 2-D, N = 1, 10, 100, ∞, h_1 = 1, 0.5, 0.1) come griglia di
// superfici vive. La slide scrive h_N = h_1/N; le figure 1-D e Duda-Hart usano la radice. Qui si provano le tre
// leggi e si controlla la seconda condizione di consistenza: N·h_N² → 0 (rossa), costante (gialla), → +∞ (verde).
// Con h più stretto della griglia la stima si disegna ad aghi (una campana alta 1/(N 2π h²) per campione).
//
// MOTO. Il riempimento (350 ms a cella) e le tre leggi sono passi dello storyboard; il cambio di legge trasforma
// le superfici in 600 ms (ease-in-out, tempo dei fotogrammi del kit), subito con reduced motion. La superficie del
// pannello ruota trascinando o con le frecce, senza inerzia.
import { useId, useMemo, useState } from 'react'
import { M } from '../../components/content/M'
import { linspace } from '../../lib/ml/stats'
import { ActionButton } from '../kit/ActionButton'
import { Challenge } from '../kit/Challenge'
import type { ChallengeStatus } from '../kit/Challenge'
import { fixed } from '../kit/format'
import { PlayControls } from '../kit/PlayControls'
import { Axis } from '../kit/plot/Axis'
import { LinePath } from '../kit/plot/LinePath'
import { Plot } from '../kit/plot/Plot'
import { Readout } from '../kit/Readout'
import { Segmented } from '../kit/Segmented'
import { StepCaption } from '../kit/StepCaption'
import { Toggle } from '../kit/Toggle'
import { useStoryboard } from '../kit/useStoryboard'
import { WidgetFrame } from '../kit/WidgetFrame'
import { normalPdf } from '../../lib/ml/stats'
import type { WidgetMeta } from '../types'
import {
  CELL_MS,
  COMPARE,
  DOMAIN,
  GRID_N,
  H1S,
  LAWS,
  LAW_IDS,
  ROWS,
  SIMILAR,
  Z_MAX,
  allCells,
  cellFor,
  consistentLaw,
  estimate1d,
  expectedInWindow,
  lawVerdict,
  nh2,
  samples2d,
} from './griglia-normale-2d'
import type { LawId } from './griglia-normale-2d'
import { useNarrow, useTween } from './proprieta/hooks'
import { DEFAULT_VIEW, blendGrid } from './proprieta/surface'
import type { View } from './proprieta/surface'
import { Surface3D } from './proprieta/Surface3D'
import type { Limit } from './proprieta/teoria'
import { FormulaBox, Icon, Spia, StaticFormula } from './proprieta/ui'
import type { SpiaState } from './proprieta/ui'

export const meta: WidgetMeta = {
  id: 'm09-griglia-normale-2d',
  moduleId: 'm09-parzen-windows',
  title: 'La griglia 2-D e il giallo della legge h_N',
  concepts: ['c56'],
  scenario: 'fonte',
  scenarioNote: 'La figura della slide p64 (da Duda-Hart): stima di una normale standard 2-D con N = 1, 10, 100, ∞',
  size: 'L',
}

const f2 = fixed(2)
const f3 = fixed(3)
const f4 = fixed(4)
const nText = (N: number) => (Number.isFinite(N) ? String(N) : '∞')
const hText = (h: number) => (h < 0.01 ? h.toFixed(4) : h.toFixed(3))

const STEPS = [
  { id: 'quadro', label: 'Il quadro: la griglia 2-D della slide', durationMs: 1500 },
  { id: 'riempimento', label: 'Le superfici riga per riga', durationMs: 12 * CELL_MS },
  { id: 'slide', label: 'La legge stampata: h₁/N', durationMs: 1800 },
  { id: 'radice', label: 'La legge con la radice: h₁/√N', durationMs: 1800 },
  { id: 'quarta', label: 'La legge consistente: h₁/N^(1/(2n))', durationMs: 1800 },
  { id: 'confronto', label: 'A parità di N e h: 1-D contro 2-D', durationMs: 2000 },
]
const LAW_OF_STEP: Record<number, LawId | undefined> = { 2: 'slide', 3: 'radice', 4: 'quarta' }
const COMPARE_STEP = 5
const LIMIT_WORD: Record<Limit, string> = { zero: '→ 0', const: 'costante', inf: '→ +∞' }
const stateOf = (l: Limit): SpiaState => (l === 'inf' ? 'ok' : l === 'const' ? 'warn' : 'ko')

function caption(index: number): string {
  switch (index) {
    case 0:
      return String.raw`La stima di una normale standard 2-D sul quadrato $[-2, 2]^2$, come nella slide: righe $N = 1, 10, 100, \infty$, colonne $h_1 = 1, 0.5, 0.1$, kernel gaussiano a simmetria sferica, dati sintetici a seme. Il selettore sceglie la legge $h_N$; accanto a ogni riga, $N h_N^2$. Clicca una cella per aprirla nel pannello e ruotarla.`
    case 1:
      return String.raw`Le superfici si riempiono riga per riga. $N = 1$: una sola campana 2-D centrata sul campione, sempre più stretta da sinistra a destra. $N = 10$: rilievi separati. $N = \infty$: la cupola della normale vera, alta circa $1/(2\pi) = 0.159$, identica nelle tre colonne.`
    case 2:
      return String.raw`La legge **stampata** nella slide, $h_N = h_1/N$: con $N = 100$ la prima colonna ha $h_N = 0.01$, una foresta di aghi sottilissimi. In 2-D il volume della finestra è $h^2$ e $N h_N^2 = h_1^2/N$ (1, 0.1, 0.01 nella prima colonna) scende a zero: la seconda condizione di consistenza è violata, spia rossa.`
    case 3:
      return String.raw`La legge con la **radice**, $h_N = h_1/\sqrt N$, quella delle figure 1-D e di Duda-Hart: la riga $N = 100$ ($h_N = 0.1$ nella prima colonna) diventa una cupola irregolare, molto simile a quella stampata. Ma $N h_N^2 = h_1^2$ resta **costante**: la varianza non cresce e non si annulla. Spia gialla: è il caso di confine $a = 1/n$.`
    case 4:
      return String.raw`La legge dell'esempio di Melgani con $n = 2$, $h_N = h_1/\sqrt[4]{N} = h_1/N^{1/(2n)}$: $h_N$ scende piano (0.56 per $N = 10$, 0.32 per $N = 100$) e $N h_N^2 = h_1^2\sqrt N$ cresce (3.2, 10). Spia verde: le superfici sono lisce, ma ancora sfocate a $N = 100$.`
    default:
      return String.raw`A parità di $N = 100$ e $h = 0.3$: in 2-D la superficie è molto più rumorosa, perché nella finestra cadono in media $N h^2 p \approx 100 \cdot 0.09 \cdot 0.159 \approx 1.4$ campioni contro $N h p \approx 100 \cdot 0.3 \cdot 0.399 \approx 12$ in 1-D. La legge giusta per $h_N$ dipende dalla dimensione $n$.`
  }
}

const PROMPT = String.raw`Quale delle tre leggi riproduce meglio la riga $N = 100$ stampata nella slide (una cupola irregolare)? Argomenta con $N h_N^2$. E quale delle tre soddisfa **entrambe** le condizioni di consistenza? Scegli e premi Verifica.`
const HINT = String.raw`Guarda la riga $N = 100$ con le tre leggi e i valori di $N h_N^2$: $h_1/N$ dà aghi, la legge che lascia $N h_N^2$ costante dà una cupola ancora irregolare. Per la consistenza serve $h_N \to 0$ **e** $N h_N^2 \to +\infty$.`

const colTex = (law: LawId, h1: number) => {
  const num = h1 === 1 ? '1' : String(h1)
  return law === 'slide' ? `h_N=\\frac{${num}}{N}` : law === 'radice' ? `h_N=\\frac{${num}}{\\sqrt{N}}` : `h_N=\\frac{${num}}{\\sqrt[4]{N}}`
}

export default function M09GrigliaNormale2d() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [lawUser, setLawUser] = useState<LawId>('slide')
  const [seed, setSeed] = useState(1)
  const [selected, setSelected] = useState({ row: 2, col: 0 })
  const [view, setView] = useState<View>(DEFAULT_VIEW)
  const [compareOn, setCompareOn] = useState(false)
  const [similar, setSimilar] = useState<LawId>('slide')
  const [consistent, setConsistent] = useState<LawId>('slide')
  const [takeoverAt, setTakeoverAt] = useState<number | null>(null)
  const [checked, setChecked] = useState<{ key: string; ok: boolean } | null>(null)
  const [gridRef, narrow] = useNarrow(560)

  const sb = useStoryboard(STEPS)
  const progress = sb.progress
  const stepLaw = LAW_OF_STEP[sb.index]
  const law: LawId = stepLaw !== undefined && takeoverAt !== sb.index ? stepLaw : lawUser
  const onLaw = (l: LawId) => {
    if (stepLaw !== undefined && takeoverAt !== sb.index) {
      sb.pause()
      setTakeoverAt(sb.index)
    }
    setLawUser(l)
  }
  const showCompare = compareOn || sb.index === COMPARE_STEP

  const pts = useMemo(() => samples2d(seed), [seed])
  const cells = useMemo(() => allCells(pts), [pts])
  // la trasformazione fra leggi: l'indice della legge scorre in 600 ms e le quote si mescolano
  const t = useTween(LAW_IDS.indexOf(law), 600)
  const lo = Math.floor(t)
  const hi = Math.min(LAW_IDS.length - 1, Math.ceil(t))
  const frac = t - lo
  const verdict = lawVerdict(law)
  const revealed = sb.index === 1 ? Math.max(1, Math.min(12, Math.floor(progress * 12) + 1)) : 12

  const cellView = (r: number, c: number) => {
    const a = cells[LAW_IDS[lo]][r][c]
    const b = cells[LAW_IDS[hi]][r][c]
    return { z: frac === 0 ? a.z : blendGrid(a.z, b.z, frac), a, b }
  }

  const sel = cellFor(law, H1S[selected.col], ROWS[selected.row], pts)
  const selN = ROWS[selected.row]
  const values = { N: selN, h1: H1S[selected.col], h: sel.h, nh2: Number.isFinite(selN) ? selN * sel.h ** 2 : Number.POSITIVE_INFINITY }
  const texCell =
    law === 'slide'
      ? String.raw`N=\val[0]{N},\quad h_N=\frac{\val{h1}}{\val[0]{N}}=\val[4]{h},\quad N h_N^2=\frac{h_1^2}{N}=\val[4]{nh2}`
      : law === 'radice'
        ? String.raw`N=\val[0]{N},\quad h_N=\frac{\val{h1}}{\sqrt{\val[0]{N}}}=\val[4]{h},\quad N h_N^2=h_1^2=\val[4]{nh2}`
        : String.raw`N=\val[0]{N},\quad h_N=\frac{\val{h1}}{\sqrt[4]{\val[0]{N}}}=\val[4]{h},\quad N h_N^2=h_1^2\sqrt{N}=\val[4]{nh2}`

  const xs1 = useMemo(() => linspace(DOMAIN[0], DOMAIN[1], 161), [])
  const est1 = useMemo(() => estimate1d(xs1, pts, COMPARE.N, COMPARE.h), [xs1, pts])
  const cmp2 = useMemo(() => cellFor('radice', COMPARE.h * Math.sqrt(COMPARE.N), COMPARE.N, pts), [pts])

  const checkKey = `${similar}|${consistent}`
  const checkedValid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = checkedValid === null ? 'idle' : checkedValid.ok ? 'ok' : 'ko'

  const reset = () => {
    sb.reset()
    setLawUser('slide')
    setSeed(1)
    setSelected({ row: 2, col: 0 })
    setView(DEFAULT_VIEW)
    setCompareOn(false)
    setSimilar('slide')
    setConsistent('slide')
    setTakeoverAt(null)
    setChecked(null)
  }

  const box = { domain: DOMAIN, zMax: Z_MAX }
  const grid = (
    <div ref={gridRef} className="absolute inset-0 p-2">
      <div
        className="grid h-full w-full gap-1"
        style={{ gridTemplateColumns: `${narrow ? '3.4rem' : '5.6rem'} repeat(3, minmax(0, 1fr))`, gridTemplateRows: `auto repeat(4, minmax(0, 1fr))` }}
      >
        <div className="label flex items-end text-[length:var(--step--1)]">N · h²</div>
        {H1S.map((h1) => (
          <div key={h1} className="flex items-end justify-center text-[length:var(--step--1)]" aria-hidden="true">
            <M tex={colTex(law, h1)} />
          </div>
        ))}
        {ROWS.map((N, r) => (
          <RowOf
            key={r}
            N={N}
            r={r}
            law={law}
            state={stateOf(verdict.nhn)}
            revealed={revealed}
            selected={selected}
            cellView={cellView}
            pts={pts}
            frac={frac}
            view={DEFAULT_VIEW}
            onPick={(col) => setSelected({ row: r, col })}
          />
        ))}
      </div>
    </div>
  )

  const zoom = (
    <div className="grid gap-2 border border-border-strong p-2">
      <p className="label m-0">
        Pannello · <span className="num tracking-normal normal-case">N = {nText(selN)}, h₁ = {H1S[selected.col]}, h_N = {Number.isFinite(selN) ? hText(sel.h) : '→ 0'}</span>
      </p>
      <div className="aspect-[1.45]">
        <Surface3D
          z={sel.z}
          n={GRID_N}
          box={box}
          view={view}
          spikes={sel.spikes ? { samples: pts.slice(0, Number.isFinite(selN) ? selN : 0), peak: sel.peak } : undefined}
          width={290}
          height={200}
          rotatable
          onRotate={(az) => setView((v) => ({ ...v, az }))}
          ariaLabel={`Superficie ingrandita, N = ${nText(selN)}, h1 = ${H1S[selected.col]}. Frecce o trascinamento per ruotare`}
        />
      </div>
      <p className="m-0 text-[length:var(--step--1)] text-muted">Trascina in orizzontale o usa le frecce (a fuoco sulla superficie) per ruotarla; Inizio la riporta dritta.</p>
    </div>
  )

  const compare = showCompare ? (
    <div className="grid gap-2 border border-border-strong p-2">
      <p className="label m-0">
        Confronto a parità di <span className="num tracking-normal normal-case">N = {COMPARE.N}, h = {COMPARE.h}</span>
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="relative aspect-[1.3]">
          <Plot width={150} height={115} fill xDomain={DOMAIN} yDomain={[0, 0.6]} margin={{ top: 6, right: 4, bottom: 20, left: 4 }} ariaLabel="Stima 1-D con N = 100 e h = 0.3">
            <LinePath data={xs1.map((x) => [x, normalPdf(x)])} role="truth" width={1.25} />
            <LinePath data={xs1.map((x, i) => [x, est1[i]])} role="estimate" width={2} />
            <Axis side="bottom" ticks={[-2, 0, 2]} />
          </Plot>
        </div>
        <div className="aspect-[1.3]">
          <Surface3D z={cmp2.z} n={GRID_N} box={box} view={DEFAULT_VIEW} width={150} height={115} ariaLabel="Stima 2-D con N = 100 e h = 0.3" strokeWidth={0.6} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <Readout label="Nella finestra, 1-D" latex="N h p" value={expectedInWindow(1)} format={f2} />
        <Readout label="Nella finestra, 2-D" latex="N h^2 p" value={expectedInWindow(2)} format={f2} pinned />
      </div>
    </div>
  ) : null

  const controls = (
    <>
      <Segmented id={`${uid}-law`} label="Legge per la larghezza" options={LAW_IDS.map((l) => ({ value: l, label: LAWS[l].label }))} value={law} onChange={onLaw} />
      <div className="grid gap-2">
        <Spia tex="h_N \to 0 ?" spoken="h con N tende a zero?" state={verdict.h === 'zero' ? 'ok' : 'ko'} detail={<>h_N {LIMIT_WORD[verdict.h]}</>} />
        <Spia tex="N h_N^2 \to +\infty ?" spoken="N per h al quadrato tende a più infinito?" state={stateOf(verdict.nhn)} detail={<>N·h_N² {LIMIT_WORD[verdict.nhn]}</>} />
      </div>
      <div className="flex flex-wrap gap-2">
        <ActionButton onClick={() => setSeed((s) => s + 1)}>
          <Icon d="M5 12a7 7 0 1 0 2-4.9M5 4v4h4" />
          Ricampiona
        </ActionButton>
      </div>
      <Toggle id={`${uid}-cmp`} label="Confronto 1-D / 2-D" checked={showCompare} onChange={setCompareOn} />
      {zoom}
      {compare}
    </>
  )

  const captionBlock = (
    <div className="grid gap-4">
      <StepCaption index={sb.index} total={STEPS.length} label={sb.step.label} text={caption(sb.index)} />
      <div className="grid gap-4 border-t border-border pt-3">
        <FormulaBox label="La cella del pannello, con i numeri" tex={texCell} values={values} announce />
        <StaticFormula
          label="Le tre leggi in 2-D (n = 2)"
          tex={String.raw`\begin{aligned}h_N&=\frac{h_1}{N}&&\Rightarrow\ N h_N^2=\frac{h_1^2}{N}\to 0\\ h_N&=\frac{h_1}{\sqrt{N}}&&\Rightarrow\ N h_N^2=h_1^2\\ h_N&=\frac{1}{\sqrt[2n]{N}}&&\Rightarrow\ N h_N^n=\sqrt{N}\to+\infty\end{aligned}`}
        />
        <StaticFormula label="Intestazioni della slide p64 · h_N = 1/N, 0.5/N, 0.1/N" tex={String.raw`h_N=\frac{1}{N},\qquad h_N=\frac{0.5}{N},\qquad h_N=\frac{0.1}{N},\qquad N\in\{1,\ 10,\ 100,\ \infty\}`} />
        <p className="m-0 text-[length:var(--step--1)] text-muted">
          Nemmeno la lettura con la radice risolve del tutto: <M tex="N h_N^2 = h_1^2" /> costante lascia il bound sulla varianza fermo a <M tex="\sup(\gamma)\,\bar{\hat p}/h_1^2" />. Una legge 2-D nello
          spirito dell'esempio di slide p61 è <M tex="h_N = h_1/N^{1/4}" />, cioè <M tex="V_N = h_N^2 = h_1^2/\sqrt N" /> (ricostruita). La riga <span className="num">N = ∞</span> della figura va letta come
          il limite ideale, non come la verifica della legge stampata.
        </p>
      </div>
    </div>
  )

  const challenge = (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Segmented id={`${uid}-sim`} label="Somiglia alla riga N = 100 della slide" options={LAW_IDS.map((l) => ({ value: l, label: LAWS[l].label }))} value={similar} onChange={setSimilar} />
        <Segmented id={`${uid}-cons`} label="Soddisfa entrambe le condizioni" options={LAW_IDS.map((l) => ({ value: l, label: LAWS[l].label }))} value={consistent} onChange={setConsistent} />
      </div>
      <Challenge prompt={PROMPT} hint={HINT} status={status} onCheck={() => setChecked({ key: checkKey, ok: similar === SIMILAR && consistent === consistentLaw() })} />
      {checkedValid !== null ? (
        <div className="grid grid-cols-3 gap-x-4 gap-y-3">
          {LAW_IDS.map((l) => (
            <Readout key={l} label={`N·h² a N = 100, h₁ = 1 · ${LAWS[l].label}`} value={nh2(l, 1, 100)} format={f4} pinned={l === consistentLaw()} />
          ))}
        </div>
      ) : null}
    </div>
  )

  return (
    <WidgetFrame meta={meta} aspect={narrow ? 0.95 : 1.4} onReset={reset} transport={<PlayControls sb={sb} steps={STEPS} />} caption={captionBlock} controls={controls} challenge={challenge}>
      {grid}
    </WidgetFrame>
  )
}

interface RowOfProps {
  N: number
  r: number
  law: LawId
  state: SpiaState
  revealed: number
  selected: { row: number; col: number }
  cellView: (r: number, c: number) => { z: Float64Array; a: { spikes: boolean; peak: number; h: number }; b: { spikes: boolean; peak: number; h: number } }
  pts: readonly (readonly number[])[]
  frac: number
  view: View
  onPick: (col: number) => void
}

const STATE_MARK: Record<SpiaState, { cls: string; word: string }> = {
  ok: { cls: 'bg-ok', word: 'verde' },
  warn: { cls: 'bg-warn', word: 'gialla' },
  ko: { cls: 'bg-error', word: 'rossa' },
}

/** Una riga: N, i valori di N·h_N² delle tre colonne con la spia, le tre superfici. */
function RowOf({ N, r, law, state, revealed, selected, cellView, pts, frac, view, onPick }: RowOfProps) {
  const inf = !Number.isFinite(N)
  const mark = STATE_MARK[state]
  return (
    <>
      <div className="num grid content-center gap-0.5 text-[10px] leading-tight text-muted">
        <span className="text-[length:var(--step--1)] text-text">N = {nText(N)}</span>
        {inf ? null : (
          <span className="flex items-center gap-1">
            <span aria-hidden="true" className={`inline-block size-2 shrink-0 border border-border-strong ${mark.cls}`} />
            <span className="visually-hidden">spia {mark.word}: </span>
            {H1S.map((h1) => f3(nh2(law, h1, N))).join(' · ')}
          </span>
        )}
      </div>
      {H1S.map((h1, c) => {
        const idx = r * 3 + c
        const cv = cellView(r, c)
        const isSel = selected.row === r && selected.col === c
        const spikeSet = [
          ...(cv.a.spikes ? [{ peak: cv.a.peak, opacity: 1 - frac }] : []),
          ...(cv.b.spikes && frac > 0 ? [{ peak: cv.b.peak, opacity: frac }] : []),
        ]
        return (
          <button
            key={c}
            type="button"
            data-cell={`${r}-${c}`}
            aria-pressed={isSel}
            aria-label={`Superficie N = ${nText(N)}, h1 = ${h1}${inf ? '' : `, h_N = ${hText(cv.b.h)}`}. Apri nel pannello`}
            onClick={() => onPick(c)}
            className={`relative min-h-0 min-w-0 cursor-pointer border bg-surface p-0 ${isSel ? 'border-2 border-border-strong' : 'border-border'}`}
          >
            {idx < revealed ? (
              <Surface3D
                z={cv.z}
                n={GRID_N}
                box={{ domain: DOMAIN, zMax: Z_MAX }}
                view={view}
                spikes={spikeSet.length > 0 && Number.isFinite(N) ? { samples: pts.slice(0, N), peak: spikeSet[0].peak, opacity: spikeSet[0].opacity } : undefined}
                width={160}
                height={105}
                strokeWidth={0.5}
                ariaLabel={`Stima con N = ${nText(N)} e h1 = ${h1}, legge ${LAWS[law].label}`}
              />
            ) : null}
            <span className="num pointer-events-none absolute top-0.5 right-1 text-[10px] leading-none text-muted">{inf ? 'h_N → 0' : `h_N = ${hText(cv.b.h)}`}</span>
            {isSel ? <span aria-hidden="true" className="absolute top-0.5 left-0.5 size-2.5 border border-border-strong bg-pin" /> : null}
          </button>
        )
      })}
    </>
  )
}
