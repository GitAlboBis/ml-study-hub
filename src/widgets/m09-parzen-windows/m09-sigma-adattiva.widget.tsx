// Widget m09-sigma-adattiva ("σ adattiva: una larghezza per ogni campione"), concetti c62, c63, c64.
// Slide p65: una σ_k per ogni campione, la distanza euclidea media dai suoi L vicini più prossimi. Due mappe
// affiancate sulle stesse 60 letture della serra: a sinistra la stima con una σ fissa, a destra con le σ_k
// adattive. Un clic su un campione mostra i suoi L vicini, le distanze e la media che diventa il raggio del cerchio;
// L piccolo trasforma la terna quasi coincidente in aghi spuri, L grande rende le σ_k quasi uniformi.
//
// MOTO. Il calcolo su tutti i campioni (80 ms l'uno) è un passo dello storyboard; la selezione di un campione
// accende i segmenti verso i vicini uno alla volta (200 ms) e poi fa crescere il cerchio (400 ms, ease-out),
// con il tempo dei fotogrammi del kit. Con reduced motion tutto è subito al suo stato finale. Slider e
// trascinamento: nessuna animazione, le mappe seguono con un render di ritardo.
import { useCallback, useDeferredValue, useId, useMemo, useState } from 'react'
import { M } from '../../components/content/M'
import { Challenge } from '../kit/Challenge'
import type { ChallengeStatus } from '../kit/Challenge'
import { fixed } from '../kit/format'
import { NumberField } from '../kit/NumberField'
import { PlayControls } from '../kit/PlayControls'
import { Axis } from '../kit/plot/Axis'
import { Dots } from '../kit/plot/Dots'
import { FieldCanvas } from '../kit/plot/FieldCanvas'
import { classSymbolPath } from '../kit/plot/marks'
import { Plot, usePlot } from '../kit/plot/Plot'
import { Readout } from '../kit/Readout'
import { Slider } from '../kit/Slider'
import { StepCaption } from '../kit/StepCaption'
import { useStoryboard } from '../kit/useStoryboard'
import { WidgetFrame } from '../kit/WidgetFrame'
import { formatH } from '../engines/density1d'
import type { WidgetMeta } from '../types'
import { easeOut } from './proprieta/teoria'
import { useNarrow, useTween } from './proprieta/hooks'
import { FormulaBox, LogSlider, OverlayCard, StaticFormula } from './proprieta/ui'
import {
  CALC_MS,
  CHALLENGE_K,
  CHALLENGE_L,
  DOMAIN,
  INITIAL_FIXED,
  L_RANGE,
  NEEDLE_SIGMA,
  SIGMA_FIXED,
  densityAdaptive,
  densityFixed,
  judge,
  neighborsOf,
  peakOf,
  readings,
  sigmasFor,
  spurious,
} from './sigma-adattiva'
import type { Pt } from './sigma-adattiva'

export const meta: WidgetMeta = {
  id: 'm09-sigma-adattiva',
  moduleId: 'm09-parzen-windows',
  title: 'σ adattiva: una larghezza per ogni campione',
  concepts: ['c62', 'c63', 'c64'],
  scenario: 'sensori',
  scenarioNote: 'Serra: 60 letture di temperatura e umidità normalizzate, 50 in condizioni normali e 10 durante i guasti',
  size: 'L',
}

const f0 = fixed(0)
const f2 = fixed(2)
const f3 = fixed(3)
const VALUE_DOMAIN: readonly [number, number] = [0, 2.5]

const STEPS = [
  { id: 'quadro', label: 'Il quadro: σ fissa contro σ_k adattiva', durationMs: 1500 },
  { id: 'calcolo', label: 'Una σ_k per ogni campione', durationMs: 60 * CALC_MS },
  { id: 'confronto', label: 'Le due mappe a confronto', durationMs: 1800 },
  { id: 'l1', label: 'L = 1: gli aghi spuri', durationMs: 1800 },
  { id: 'trascina', label: 'Sposta un campione dall’ammasso', durationMs: 1500 },
  { id: 'chiusura', label: 'Stretta dove i dati sono fitti, larga dove sono pochi', durationMs: 1800 },
]
const CALC = 1
const L1 = 3
const CLOSE = 5

function caption(index: number, L: number, sigmaFixed: number, k: number, sk: number): string {
  switch (index) {
    case 0:
      return String.raw`60 letture della serra (temperatura, umidità, normalizzate): un ammasso fittissimo di condizioni normali e 10 letture sparse durante i guasti. A sinistra la stima con una sola $\sigma = ${formatH(sigmaFixed)}$; a destra con una $\sigma_k$ per campione (*adaptive*), la distanza media dai suoi $L = ${L}$ vicini. Clicca un campione: il campione ${k + 1} ha $\sigma_k = ${f3(sk)}$.`
    case 1:
      return String.raw`Il calcolo si ripete per tutti i campioni, ${CALC_MS} ms l'uno: nell'ammasso nascono cerchi minuscoli, sui punti radi cerchi grandi. Sotto, le $\sigma_k$ ordinate.`
    case 2:
      return String.raw`Con la $\sigma$ fissa non c'è un valore buono per tutti: piccola, i punti radi diventano aghi isolati; grande, l'ammasso perde la sua struttura interna. L'adattiva conserva entrambi: stretta dove i dati parlano chiaro, larga dove sono pochi.`
    case 3:
      return String.raw`$L = 1$: $\sigma_k$ è la distanza dal vicino più prossimo. La terna di letture quasi coincidenti dà $\sigma_k \approx 0$: aghi altissimi e spuri (cerchiati). Con $L$ grande (15) si torna verso una $\sigma$ quasi uniforme e l'adattività sparisce ($L = N - 1$ dà a tutti quasi la stessa $\sigma$).`
    case 4:
      return String.raw`Trascina il campione selezionato fuori dall'ammasso, verso una zona vuota: la sua $\sigma_k$ cresce con continuità e il suo cerchio si allarga; le $\sigma_k$ dei vecchi vicini cambiano di poco.`
    default:
      return String.raw`Note p45: una $\sigma$ piccola dove i campioni sono fitti (ci sono meno vuoti da riempire), grande dove sono radi (più incertezza). La $\sigma$ adattiva prende in prestito l'idea del K-NN, guardare i vicini, per decidere localmente quanto lisciare.`
  }
}

const PROMPT = String.raw`Seleziona il campione ${CHALLENGE_K + 1} (è evidenziato), metti $L = ${CHALLENGE_L}$, leggi le due distanze sui segmenti e calcola a mano $\sigma_k$; scrivilo (due decimali). Poi trova l'$L$ **più piccolo** che elimina tutti gli aghi spuri cerchiati. Premi Verifica.`
const HINT = String.raw`$\sigma_k = \frac{1}{L}\sum_{l=1}^{L}\|\mathbf x_k - \mathbf y_l\|$: con $L = 2$ è la media delle due distanze. Gli aghi spuri nascono dalla terna di letture quasi coincidenti: finché fra gli $L$ vicini ci sono solo le altre due della terna, la media resta quasi zero.`

interface MapProps {
  pts: readonly Pt[]
  radii: readonly (number | null)[]
  field: (x: number, y: number) => number
  selected: number
  highlight: number
  needles: readonly number[]
  segs: readonly { index: number; distance: number }[]
  segShown: number
  selRadius: number | null
  onSelect: (k: number) => void
  draggable: boolean
  onDrag: (x: number, y: number) => void
  ariaLabel: string
  description: string
  title: string
}

/** Una mappa: tinte della stima, cerchi di raggio σ (o σ_k), campioni cliccabili, vicini del selezionato. */
function MapPanel(props: MapProps) {
  const { pts, field, ariaLabel, description, title, draggable, onDrag, selected } = props
  return (
    <div className="relative grid h-full grid-rows-[auto_minmax(0,1fr)]">
      <p className="label m-0 px-2 pt-1 text-[length:var(--step--1)]">{title}</p>
      <div className="relative min-h-0">
        <Plot width={360} height={360} fill xDomain={DOMAIN} yDomain={DOMAIN} margin={{ top: 8, right: 8, bottom: 30, left: 34 }} ariaLabel={ariaLabel} description={description}>
          <FieldCanvas fn={field} resolution={64} valueDomain={VALUE_DOMAIN} opacity={0.8} />
          <MapMarks {...props} />
          {draggable ? (
            <Dots data={[{ x: pts[selected][0], y: pts[selected][1], id: 'sel', label: `Campione ${selected + 1} selezionato` }]} draggable step={0.05} r={6} role="highlight" onDrag={(_id, nx, ny) => onDrag(Number(nx.toFixed(3)), Number(ny.toFixed(3)))} />
          ) : null}
          <Axis side="bottom" ticks={[-2, 0, 2]} symbol="temperatura (z)" />
          <Axis side="left" ticks={[-2, 0, 2]} />
        </Plot>
      </div>
    </div>
  )
}

function MapMarks({ pts, radii, selected, highlight, needles, segs, segShown, selRadius, onSelect }: MapProps) {
  const { x, y, clipPath } = usePlot()
  const px = (v: number) => Math.abs(x(v) - x(0))
  const sel = pts[selected]
  return (
    <g data-map="">
      <g clipPath={clipPath} pointerEvents="none">
        {pts.map((p, i) => (radii[i] !== null && i !== selected ? <circle key={`c${i}`} data-radius={i} cx={x(p[0])} cy={y(p[1])} r={px(radii[i] ?? 0)} fill="none" stroke="var(--text)" strokeOpacity={0.4} /> : null))}
        {segs.slice(0, segShown).map((s) => {
          const q = pts[s.index]
          const mx = (x(sel[0]) + x(q[0])) / 2
          const my = (y(sel[1]) + y(q[1])) / 2
          return (
            <g key={`s${s.index}`} data-neighbor={s.index}>
              <line x1={x(sel[0])} y1={y(sel[1])} x2={x(q[0])} y2={y(q[1])} stroke="var(--viz-boundary)" strokeWidth={2} />
              <text x={mx} y={my - 4} textAnchor="middle" className="num" fontSize={10.5} fontWeight={600} fill="var(--text)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
                {f2(s.distance)}
              </text>
            </g>
          )
        })}
        {selRadius !== null ? <circle cx={x(sel[0])} cy={y(sel[1])} r={px(selRadius)} fill="none" stroke="var(--pin-contrast)" strokeWidth={2} /> : null}
        {needles.map((i) => (
          <g key={`n${i}`} data-needle={i}>
            <circle cx={x(pts[i][0])} cy={y(pts[i][1])} r={11} fill="none" stroke="var(--error)" strokeWidth={2} />
            <text x={x(pts[i][0]) + 13} y={y(pts[i][1]) - 8} className="label" fontSize={9} fill="var(--text)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
              ago spurio
            </text>
          </g>
        ))}
      </g>
      {pts.map((p, i) => (
        <g key={i} data-reading={i} transform={`translate(${x(p[0])},${y(p[1])})`} style={{ cursor: 'pointer' }} onClick={() => onSelect(i)}>
          <circle r={8} fill="transparent" />
          {i === highlight ? <circle r={7} fill="var(--viz-highlight)" stroke="var(--pin-contrast)" /> : null}
          <path d={classSymbolPath(0, 28)} fill={i === selected ? 'var(--pin)' : 'var(--viz-sample)'} stroke="var(--surface)" strokeWidth={1.5} paintOrder="stroke" />
        </g>
      ))}
    </g>
  )
}

export default function M09SigmaAdattiva() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [pts, setPts] = useState<Pt[]>(() => readings())
  const [LUser, setLUser] = useState<number>(L_RANGE.initial)
  const [sigmaFixed, setSigmaFixed] = useState(INITIAL_FIXED)
  const [selected, setSelected] = useState(CHALLENGE_K)
  const [selVersion, setSelVersion] = useState(0)
  const [sigmaAnswer, setSigmaAnswer] = useState(0)
  const [lAnswer, setLAnswer] = useState(1)
  const [takeoverAt, setTakeoverAt] = useState<number | null>(null)
  const [checked, setChecked] = useState<{ key: string; ok: boolean } | null>(null)
  const [terrainRef, narrow] = useNarrow(600)

  const sb = useStoryboard(STEPS)
  const progress = sb.progress
  const L = sb.index === L1 && takeoverAt !== L1 ? 1 : LUser
  const onL = (v: number) => {
    if (sb.index === L1 && takeoverAt !== L1) {
      sb.pause()
      setTakeoverAt(L1)
    }
    setLUser(v)
  }
  const n = pts.length
  const sigmas = useMemo(() => sigmasFor(pts, L), [pts, L])
  const needles = spurious(sigmas)
  const revealed = sb.index === CALC ? Math.max(1, Math.min(n, Math.floor(progress * n) + 1)) : n
  const order = useMemo(() => sigmas.map((s, i) => ({ s, i })), [sigmas])
  const radii = sigmas.map((s, i) => (i < revealed ? s : null))

  // selezione: i segmenti uno alla volta (200 ms), poi il cerchio cresce (400 ms)
  const segs = neighborsOf(pts, selected, L)
  const seqMs = segs.length * 200 + 400
  const tw = useTween(selVersion, seqMs)
  const selT = 1 - Math.min(1, Math.max(0, selVersion - tw))
  const segShown = Math.min(segs.length, Math.floor((selT * seqMs) / 200 + 1e-9) + (selT >= 1 ? segs.length : 0))
  const growT = Math.max(0, (selT * seqMs - segs.length * 200) / 400)
  const selRadius = selT >= 1 ? sigmas[selected] : growT > 0 ? sigmas[selected] * easeOut(growT) : null
  const select = (k: number) => {
    setSelected(k)
    setSelVersion((v) => v + 1)
  }

  const deferred = useDeferredValue(useMemo(() => ({ pts, sigmas, sigmaFixed }), [pts, sigmas, sigmaFixed]))
  const fieldFixed = useCallback((x: number, y: number) => densityFixed([x, y], deferred.pts, deferred.sigmaFixed), [deferred])
  const fieldAdaptive = useCallback((x: number, y: number) => densityAdaptive([x, y], deferred.pts, deferred.sigmas), [deferred])

  const sk = sigmas[selected]
  const shownDists = segs.slice(0, 5)
  const texSk = `\\sigma_{${selected + 1}}=\\frac{1}{L}\\sum_{l=1}^{L}\\|\\mathbf{x}_k-\\mathbf{y}_l\\|=\\frac{${shownDists.map((_, i) => `\\val{d${i + 1}}`).join('+')}${segs.length > 5 ? '+\\cdots' : ''}}{\\val[0]{L}}=\\val[3]{sk}`
  const values: Record<string, number> = { L, sk, peak: peakOf(Math.max(sk, 1e-6), n) }
  shownDists.forEach((s, i) => (values[`d${i + 1}`] = s.distance))

  const checkKey = `${sigmaAnswer}|${lAnswer}|${pts.map((p) => p.join(',')).join(';')}`
  const checkedValid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = checkedValid === null ? 'idle' : checkedValid.ok ? 'ok' : 'ko'
  const verdict = checkedValid !== null ? judge(pts, sigmaAnswer, lAnswer) : null

  const reset = () => {
    sb.reset()
    setPts(readings())
    setLUser(L_RANGE.initial)
    setSigmaFixed(INITIAL_FIXED)
    setSelected(CHALLENGE_K)
    setSelVersion(0)
    setSigmaAnswer(0)
    setLAnswer(1)
    setTakeoverAt(null)
    setChecked(null)
  }

  const common = { pts, selected, highlight: CHALLENGE_K, onSelect: select, segs, segShown, onDrag: (x: number, y: number) => setPts((ps) => ps.map((p, i) => (i === selected ? ([x, y] as const) : p))) }
  const terrain = (
    <div ref={terrainRef} className={`absolute inset-0 grid ${narrow ? 'grid-rows-2' : 'grid-cols-2'}`}>
      <div className="relative min-h-0 min-w-0">
        <MapPanel
          {...common}
          radii={pts.map(() => sigmaFixed)}
          field={fieldFixed}
          needles={[]}
          selRadius={sigmaFixed}
          draggable={false}
          title={`σ fissa = ${formatH(sigmaFixed)}`}
          ariaLabel="Mappa della stima con una sigma fissa"
          description={`Tutti i ${n} campioni con la stessa sigma ${formatH(sigmaFixed)}.`}
        />
      </div>
      <div className={`relative min-h-0 min-w-0 ${narrow ? 'border-t' : 'border-l'} border-border`}>
        <MapPanel
          {...common}
          radii={radii}
          field={fieldAdaptive}
          needles={needles}
          selRadius={selRadius}
          draggable
          title={`σ_k adattiva, L = ${L}`}
          ariaLabel="Mappa della stima con le sigma adattive"
          description={`sigma_k dalla distanza media dagli ${L} vicini. Aghi spuri: ${needles.length}. Campione selezionato ${selected + 1}: sigma_k = ${f3(sk)}.`}
        />
      </div>
      {sb.index === CLOSE ? (
        <OverlayCard title="Note p45 · adaptiveness" className={narrow ? 'inset-x-2 top-2' : 'top-10 left-1/4 w-[min(26rem,50%)]'}>
          <p className="m-0 text-[length:var(--step--1)]">
            <M tex="\sigma" /> piccola dove i campioni sono fitti: ci sono meno vuoti da riempire e l'interpolazione deve essere accurata. <M tex="\sigma" /> grande dove sono radi: la
            varianza locale riflette l'incertezza maggiore.
          </p>
        </OverlayCard>
      ) : null}
    </div>
  )

  const sortedShown = order
    .filter((o) => o.i < revealed)
    .sort((a, b) => a.s - b.s)
  const controls = (
    <>
      <Slider id={`${uid}-L`} label="Vicini per σ_k" latex="L" min={L_RANGE.min} max={L_RANGE.max} step={1} value={L} onChange={onL} format={f0} />
      <LogSlider id={`${uid}-sf`} label="σ fissa per il confronto" latex="\sigma" values={SIGMA_FIXED} value={sigmaFixed} onChange={setSigmaFixed} format={formatH} />
      <NumberField id={`${uid}-k`} label="Campione selezionato" latex="k" min={1} max={n} step={1} value={selected + 1} onChange={(v) => select(v - 1)} />
      <p className="m-0 text-[length:var(--step--1)] text-muted">
        Clic su un campione per selezionarlo; il selezionato si trascina nella mappa di destra (o con le frecce, a fuoco sul punto). Il campione {CHALLENGE_K + 1}, con l'alone ocra, è quello della sfida.
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="σ del selezionato" latex="\sigma_k" value={sk} format={f3} pinned />
        <Readout label="Aghi spuri" value={needles.length} format={f0} />
        <Readout label="σ_k minima" value={Math.min(...sigmas)} format={f3} />
        <Readout label="σ_k massima" value={Math.max(...sigmas)} format={f3} />
      </div>
      <div className="grid gap-1">
        <span className="label">σ_k ordinate ({sortedShown.length} di {n})</span>
        <div className="num flex max-h-24 flex-wrap gap-x-2 gap-y-0.5 overflow-y-auto text-[length:var(--step--1)]" tabIndex={0} role="region" aria-label="Le sigma_k ordinate">
          {sortedShown.map((o) => (
            <span key={o.i} className={o.s < NEEDLE_SIGMA ? 'font-bold text-error' : o.i === selected ? 'bg-pin px-0.5 text-pin-contrast' : 'text-muted'}>
              {f3(o.s)}
            </span>
          ))}
        </div>
      </div>
    </>
  )

  const captionBlock = (
    <div className="grid gap-4">
      <StepCaption index={sb.index} total={STEPS.length} label={sb.step.label} text={caption(sb.index, L, sigmaFixed, selected, sk)} />
      <div className="grid gap-4 border-t border-border pt-3">
        <StaticFormula label="Slide p65 · a σ_k for each training sample" tex={String.raw`\mathbf{x}_k\ \longmapsto\ \sigma_k\qquad (k=1,2,\dots,N)`} />
        <FormulaBox label="σ_k del campione selezionato, con le distanze dei vicini" tex={texSk} values={values} announce />
        <StaticFormula
          label="La stima con le σ_k (ricostruita per sostituzione: ogni campana ha la sua normalizzazione)"
          tex={String.raw`\hat{p}(\mathbf{x})=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{(2\pi\sigma_k^2)^{n/2}}\exp\left(-\frac{\|\mathbf{x}-\mathbf{x}_k\|^2}{2\sigma_k^2}\right)`}
        />
        <FormulaBox label="Picco della campana del selezionato" tex={String.raw`\frac{1}{N}\cdot\frac{1}{2\pi\sigma_k^2}=\val[2]{peak}`} values={values} />
        <p className="m-0 text-[length:var(--step--1)] text-muted">
          I vicini <M tex="\mathbf y_1, \dots, \mathbf y_L" /> si cercano fra gli altri campioni, escluso <M tex="\mathbf x_k" />. Casi limite: <M tex="L = 1" /> è la distanza dal vicino più prossimo;{' '}
          <M tex="L = N - 1" /> dà a tutti quasi la stessa σ; copie identiche danno <M tex="\sigma_k = 0" />, un impulso, e in pratica servono un <M tex="L" /> sufficiente o una soglia minima.
        </p>
      </div>
    </div>
  )

  const challenge = (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField id={`${uid}-sa`} label={`σ_k del campione ${CHALLENGE_K + 1} con L = ${CHALLENGE_L}`} latex="\sigma_k" min={0} max={3} step={0.01} value={sigmaAnswer} onChange={setSigmaAnswer} />
        <NumberField id={`${uid}-la`} label="L minimo senza aghi spuri" latex="L" min={1} max={15} step={1} value={lAnswer} onChange={setLAnswer} />
      </div>
      <Challenge prompt={PROMPT} hint={HINT} status={status} onCheck={() => setChecked({ key: checkKey, ok: judge(pts, sigmaAnswer, lAnswer).ok })} />
      {verdict !== null ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          <Readout label="σ_k esatta" value={verdict.sigmaTrue} format={f3} pinned />
          <Readout label="Il tuo σ_k" value={verdict.sigmaOk ? 'giusto' : 'da rivedere'} />
          <Readout label="L minimo" value={verdict.lTrue} format={f0} />
          <Readout label="Il tuo L" value={verdict.lOk ? 'giusto' : 'da rivedere'} />
        </div>
      ) : null}
    </div>
  )

  return (
    <WidgetFrame meta={meta} aspect={narrow ? 0.55 : 2} onReset={reset} transport={<PlayControls sb={sb} steps={STEPS} />} caption={captionBlock} controls={controls} challenge={challenge}>
      {terrain}
    </WidgetFrame>
  )
}
