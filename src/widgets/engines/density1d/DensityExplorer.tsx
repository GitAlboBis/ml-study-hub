// DensityExplorer: il motore density1d come componente. Riceve `meta` (il WidgetMeta del widget) e un
// `preset` (types.ts) e costruisce il widget intero nel WidgetFrame del kit: terreno, trasporto dello
// storyboard, didascalia con le formule vive e gli addendi, comandi, legenda viva, sfida.
//
//   campioni ──► griglia (evalGrid) ──► campane (kernelBands) ──► stima (weightedKernelSum)
//                     ▲                         ▲                         │
//   storyboard ── sceneAt(passo, progress): caduta, crescita, peso, pila, h imposto
//
// SCELTE
// - Un solo stato di verità per ciò che l'utente sceglie (campioni, indice di h, kernel, K, bin, strati,
//   punto sonda); lo storyboard non lo tocca mai: impone solo ciò che si DISEGNA (Scene). Quando un passo
//   impone h e l'utente muove lo slider, il racconto si mette in pausa e il comando torna all'utente.
// - Numeri esatti e numeri mostrati sono separati: letture, formule, massimi e ISE usano sempre la stima
//   vera p̂ con peso 1/N; le curve disegnate seguono i pesi animati (nascita, normalizzazione, riscala).
// - Lo slider di h scorre su valori tondi in scala logaritmica (niceLogSteps): la formula viva mostra
//   esattamente il numero usato nel calcolo.
//
// MOTO (skill emil-design-eng e svg-animations)
// - Storyboard: le geometrie seguono `sb.progress` (tempo dei fotogrammi del kit, mai timer), quindi Play,
//   Pausa, Passo, Velocità e Reset lo governano tutto. Con reduced motion ogni passo è il suo stato finale.
// - Campione aggiunto o tolto (fuori dallo storyboard): il kernel nuovo cresce in 250 ms (ease-out) e tutte
//   le altezze passano da 1/N a 1/(N ± 1) in 300 ms (ease-out). Il ciclo gira solo finché serve; con
//   reduced motion il cambio è immediato.
// - Slider, selettori, interruttori e legenda: nessuna animazione (azioni frequenti e da tastiera).
import { ticks as d3ticks } from 'd3'
import { useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { M } from '../../../components/content/M'
import { kernelValue, knnDensity1d, parzen1d } from '../../../lib/ml/nonparam'
import type { Kernel } from '../../../lib/ml/nonparam'
import { linspace } from '../../../lib/ml/stats'
import { ActionButton } from '../../kit/ActionButton'
import { Challenge } from '../../kit/Challenge'
import type { ChallengeStatus } from '../../kit/Challenge'
import { fixed, typographic } from '../../kit/format'
import { LiveFormula } from '../../kit/LiveFormula'
import { PlayControls } from '../../kit/PlayControls'
import { Arrow } from '../../kit/plot/Arrow'
import { Axis } from '../../kit/plot/Axis'
import { Grid } from '../../kit/plot/Grid'
import { Histogram } from '../../kit/plot/Histogram'
import { LinePath } from '../../kit/plot/LinePath'
import { Plot } from '../../kit/plot/Plot'
import { Readout } from '../../kit/Readout'
import { Segmented } from '../../kit/Segmented'
import { Slider } from '../../kit/Slider'
import { StepCaption } from '../../kit/StepCaption'
import { Toggle } from '../../kit/Toggle'
import { useAnimationFrame } from '../../kit/useAnimationFrame'
import { useReducedMotion } from '../../kit/useReducedMotion'
import { useStoryboard } from '../../kit/useStoryboard'
import { WidgetFrame } from '../../kit/WidgetFrame'
import type { WidgetMeta } from '../../types'
import {
  birthGrowth,
  captionFor,
  clippedPeaks,
  contributions,
  countLocalMaxima,
  defaultK,
  easeIn,
  evalGrid,
  flankPoint,
  formatH,
  formulaValues,
  iseAt,
  kernelBands,
  nearestIndex,
  nearestSampleIndex,
  niceLogSteps,
  optimalBandwidth,
  peakPoint,
  regimeOf,
  resolveSteps,
  sceneAt,
  snapSample,
  tweenValue,
  weightedKernelSum,
} from './density1d'
import { KERNEL_INFO } from './kernelInfo'
import { AddendsTable, RegimeStamp, TermLegend } from './panels'
import { ClippedMarks, CurveLabel, KernelBandsLayer, ProbeMarks, SampleBelt } from './terrain'
import type { Density1dLayer, Density1dPreset, Density1dTerm } from './types'

export interface DensityExplorerProps {
  meta: WidgetMeta
  preset: Density1dPreset
}

interface SampleItem {
  id: string
  x: number
}

type Target = Density1dTerm['target']

interface CheckResult {
  /** stato verificato: se cambia, l'esito non vale più */
  key: string
  ok: boolean
  h?: number
  hOpt?: number
  iseUser?: number
  iseMin?: number
  ratio?: number
}

/** Nascita di un kernel aggiunto a mano e riscala delle altezze (inventario m09, storyboard 5). */
const BIRTH_MS = 250
const RESCALE_MS = 300
/** Addendi mostrati prima di "Mostra tutti". */
const ADDENDS_SHOWN = 6

const f2 = fixed(2)
const f3 = fixed(3)
const f4 = fixed(4)
const count = fixed(0)

const REGIME_WORDS = { sensitive: 'sensibile', balanced: 'in equilibrio', smooth: 'liscia' } as const

const LAYER_TOGGLES: Record<Exclude<Density1dLayer, 'estimate'>, { label: string; hint: string }> = {
  kernels: { label: 'Campane dei singoli kernel', hint: 'δ(x − x_k)/N: una per campione, area 1/N' },
  truth: { label: 'Mostra la densità vera', hint: 'Tratteggiata: la densità che ha generato i dati sintetici' },
  histogram: { label: 'Istogramma', hint: 'Normalizzato a densità: K / (N · larghezza del bin)' },
  knn: { label: 'Stima K-NN', hint: 'K fissato, cella allargata fino al K-esimo vicino: K / (N · 2r_K)' },
}

export function DensityExplorer({ meta, preset }: DensityExplorerProps) {
  const { scenario } = preset
  const domain = scenario.domain
  const decimals = scenario.decimals ?? 1
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const reduced = useReducedMotion()
  const offered = (l: Density1dLayer) => preset.layers.includes(l)

  // --- stato scelto dall'utente ---
  const nextId = useRef(scenario.samples.length)
  const initialSamples = (): SampleItem[] => scenario.samples.map((x, i) => ({ id: `s${i}`, x }))
  const hSteps = useMemo(() => niceLogSteps(preset.h.min, preset.h.max), [preset.h.min, preset.h.max])
  const initialH = nearestIndex(hSteps, preset.initial.h)
  const initialLayers = () => preset.initialLayers.filter((l) => offered(l))
  const initialK = preset.initial.k ?? defaultK(scenario.samples.length)
  const initialProbe = preset.initial.probe ?? (domain[0] + domain[1]) / 2

  const [samples, setSamples] = useState<SampleItem[]>(initialSamples)
  const [hIndex, setHIndex] = useState(initialH)
  const [kernel, setKernel] = useState<Kernel>(preset.initial.kernel)
  const [k, setK] = useState(initialK)
  const [bins, setBins] = useState(preset.initial.bins ?? 10)
  const [layersOn, setLayersOn] = useState<Density1dLayer[]>(initialLayers)
  const [probe, setProbe] = useState(initialProbe)
  const [preview, setPreview] = useState<Target | null>(null)
  const [pinned, setPinned] = useState<Target | null>(null)
  const [allAddends, setAllAddends] = useState(false)
  const [checked, setChecked] = useState<CheckResult | null>(null)
  /** passo dello storyboard in cui l'utente ha preso in mano h: lì l'h imposto dal passo non vale più */
  const [takeoverAt, setTakeoverAt] = useState<number | null>(null)

  // --- moti brevi: nascita di un kernel e riscala 1/N ---
  // L'orologio è quello dei fotogrammi (tMs di useAnimationFrame). Un gesto dell'utente registra solo che un
  // moto deve partire (start = null); l'istante lo fissa il primo fotogramma, così nessun tempo si legge
  // durante il render o nei gestori degli eventi.
  const [births, setBirths] = useState<Record<string, number | null>>({})
  const [tween, setTween] = useState<{ from: number; start: number | null } | null>(null)
  const [now, setNow] = useState(0)
  const animating = tween !== null || Object.keys(births).length > 0
  useAnimationFrame((_dt, t) => {
    const stamped = Object.fromEntries(Object.entries(births).map(([id, b]) => [id, b ?? t]))
    const tweenStart = tween === null ? null : (tween.start ?? t)
    const doneBirths = Object.values(stamped).every((b) => t - b >= BIRTH_MS)
    const doneTween = tweenStart === null || t - tweenStart >= RESCALE_MS
    if (doneBirths && doneTween) {
      setBirths({})
      setTween(null)
    } else {
      if (Object.values(births).includes(null)) setBirths(stamped)
      if (tween !== null && tween.start === null) setTween({ from: tween.from, start: t })
    }
    setNow(t)
  }, animating)

  const xs0 = useMemo(() => samples.map((s) => s.x), [samples])
  const n = xs0.length
  const userH = hSteps[hIndex] ?? preset.initial.h
  const kEff = Math.max(1, Math.min(k, Math.max(n, 1)))
  const samplesKey = xs0.join(',')

  // --- storyboard ---
  const steps = resolveSteps(preset.storyboard, n)
  const sb = useStoryboard(steps)
  const progress = sb.progress
  const scene = sceneAt(preset.storyboard, sb.index, progress, { n, userH })
  const h = scene.hOverride && takeoverAt !== sb.index ? scene.h : userH
  const currentStep = preset.storyboard[sb.index]

  // --- ciò che si disegna ---
  const focus = preview ?? pinned
  const dim = (t: Target) => (focus === null || focus === t || (focus === 'h' && t === 'kernels') ? 1 : 0.22)
  const isOn = (l: Density1dLayer) => offered(l) && layersOn.includes(l)
  const truthFn = offered('truth') ? scenario.truth : undefined
  const truthUser = isOn('truth') || focus === 'truth'
  const truthAlpha = truthFn === undefined ? 0 : scene.truth === 'user' ? (truthUser ? 1 : 0) : Math.max(scene.truth, truthUser ? 1 : 0)
  const kernelsVisible = offered('kernels') && (scene.kernels === 'force' || (scene.kernels === 'user' && (isOn('kernels') || focus === 'kernels' || focus === 'h')))
  const estAlpha = offered('estimate') ? scene.estimate : 0
  const iseVisible = truthFn !== undefined && truthAlpha >= 0.5

  const w = 1 / Math.max(n, 1)
  const weight = scene.weight === w && tween !== null ? tweenValue(tween.from, w, tween.start === null ? 0 : now - tween.start, RESCALE_MS) : scene.weight
  const scales = samples.map((s, i) => {
    const born = births[s.id]
    // undefined: campione già lì; null: nato adesso, cresce dal prossimo fotogramma
    const growth = born === undefined ? 1 : born === null ? 0 : birthGrowth(now - born, BIRTH_MS)
    return (scene.growth[i] ?? 1) * growth * weight
  })

  // Tutto si ricalcola a ogni render: con circa 500 punti sono qualche decina di migliaia di valutazioni di γ
  // (misurati in Node: 0.6 ms con N = 12, 1.4 ms con N = 40), e in riproduzione h e i pesi cambiano comunque a
  // ogni fotogramma. Se servisse di più: canale onFrame di useStoryboard e solo il terreno a ogni fotogramma.
  const xs = evalGrid(domain, xs0, h, kernel)
  const exact = weightedKernelSum(xs, xs0, h, kernel, xs0.map(() => w))
  const atRest = scales.every((s) => s === w)
  const shown = atRest ? exact : weightedKernelSum(xs, xs0, h, kernel, scales)
  const bands = kernelsVisible ? kernelBands(xs, xs0, h, kernel, scales, scene.stack) : []
  const maxima = countLocalMaxima(exact)
  const regime = regimeOf(h, preset.regimes)

  const truthPts = useMemo(() => (truthFn === undefined ? [] : linspace(domain[0], domain[1], 401).map((x) => [x, truthFn(x)])), [truthFn, domain])
  const iseValue = iseVisible && truthFn !== undefined ? iseAt(xs0, h, kernel, truthFn, domain) : undefined
  const knnOn = isOn('knn') || focus === 'knn'
  const knnPts = useMemo(() => (knnOn && n > 0 ? linspace(domain[0], domain[1], 301).map((x) => [x, knnDensity1d(x, xs0, kEff)]) : []), [knnOn, n, domain, xs0, kEff])

  // La sfida vale per lo stato verificato: cambiare ciò che conta la riapre. Per 'min-ise' contano h dello
  // slider, kernel e campioni (non il punto sonda, che si muove appena il puntatore passa sul terreno).
  const checkKey = preset.challenge?.kind === 'custom' ? `${userH}|${kernel}|${samplesKey}|${kEff}|${bins}|${probe}` : `${userH}|${kernel}|${samplesKey}`
  const checkedValid = checked !== null && checked.key === checkKey ? checked : null
  const hOpt = checkedValid?.hOpt
  const ghost = useMemo(() => {
    if (hOpt === undefined) return []
    const g = evalGrid(domain, xs0, hOpt, kernel)
    const ys = weightedKernelSum(g, xs0, hOpt, kernel, xs0.map(() => 1 / Math.max(xs0.length, 1)))
    return g.map((x, i) => [x, ys[i]])
  }, [hOpt, domain, xs0, kernel])

  const values = formulaValues({ x: probe, samples: xs0, h, kernel, k: kEff, truth: truthFn, hOpt, ise: iseValue })
  const p = values.p ?? 0
  const terms = contributions(probe, xs0, h, kernel)

  // la freccia h sotto la campana del campione più vicino al punto sonda
  const nearest = nearestSampleIndex(xs0, probe)
  const arrowY = nearest >= 0 ? ((scales[nearest] ?? 0) * kernelValue(0.5, kernel)) / h : 0
  const showArrow = kernelsVisible && scene.stack === 0 && nearest >= 0 && arrowY > 0

  const clipped = [
    ...(estAlpha > 0 ? clippedPeaks(xs, shown, preset.yMax) : []),
    ...bands.flatMap((b) => clippedPeaks(xs.slice(b.from, b.to + 1), b.upper, preset.yMax)),
  ]

  const belt = preset.yMax * 0.16
  const yTicks = d3ticks(0, preset.yMax, 4).filter((t) => t <= preset.yMax)
  const estPts = xs.map((x, i) => [x, shown[i]])

  // --- azioni ---
  /** Le altezze passano da 1/N a 1/(N ± 1) partendo da quella mostrata adesso. Con reduced motion: subito. */
  const startRescale = () => {
    if (!reduced) setTween({ from: weight, start: null })
  }
  const addSample = (x: number) => {
    if (!preset.samples.editable || n >= preset.samples.max) return
    const id = `s${nextId.current++}`
    startRescale()
    if (!reduced) setBirths((b) => ({ ...b, [id]: null }))
    setSamples((s) => [...s, { id, x: snapSample(x, domain, decimals) }])
  }
  const removeSample = (id: string) => {
    if (!preset.samples.editable || n <= preset.samples.min) return
    startRescale()
    setSamples((s) => s.filter((item) => item.id !== id))
  }
  const removeNearest = (x: number) => {
    const i = nearestSampleIndex(xs0, x)
    if (i >= 0) removeSample(samples[i].id)
  }
  const onHIndex = (i: number) => {
    // un passo che impone h non deve nascondere lo slider: il racconto si ferma e h torna all'utente
    if (scene.hOverride && takeoverAt !== sb.index) {
      sb.pause()
      setTakeoverAt(sb.index)
    }
    setHIndex(i)
  }
  const toggleLayer = (l: Density1dLayer, on: boolean) => setLayersOn((ls) => (on ? [...ls.filter((x) => x !== l), l] : ls.filter((x) => x !== l)))
  const onTerrainKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!preset.samples.editable || e.altKey || e.ctrlKey || e.metaKey) return
    const el = e.target as Element
    // solo sul cursore di lettura del Plot: altrove Invio e Canc hanno il loro significato
    if (el.getAttribute('role') !== 'slider' || el.closest('[data-plot-area]') === null) return
    if (e.key === 'Enter' || e.key === '+' || e.key === 'Insert') {
      e.preventDefault()
      addSample(probe)
    } else if (e.key === 'Delete' || e.key === 'Backspace' || e.key === '-') {
      e.preventDefault()
      removeNearest(probe)
    }
  }
  const check = () => {
    const ch = preset.challenge
    if (ch === undefined) return
    // si verifica sempre l'h dello slider, anche se un passo dello storyboard ne sta mostrando un altro
    if (ch.kind === 'custom') {
      setChecked({ key: checkKey, ok: ch.check({ samples: xs0, h: userH, kernel, k: kEff, bins, probe }) })
      return
    }
    if (scenario.truth === undefined || n === 0) return
    const best = optimalBandwidth(xs0, kernel, scenario.truth, domain, [preset.h.min, preset.h.max])
    const iseUser = iseAt(xs0, userH, kernel, scenario.truth, domain)
    const ratio = iseUser / best.ise
    setChecked({ key: checkKey, ok: ratio <= ch.tolerance, h: userH, hOpt: best.h, iseUser, iseMin: best.ise, ratio })
    // la verifica rivela la densità vera (inventario: "poi rivela la densità vera e confronta")
    if (offered('truth')) toggleLayer('truth', true)
  }
  const reset = () => {
    sb.reset()
    setSamples(initialSamples())
    setHIndex(initialH)
    setKernel(preset.initial.kernel)
    setK(initialK)
    setBins(preset.initial.bins ?? 10)
    setLayersOn(initialLayers())
    setProbe(initialProbe)
    setPreview(null)
    setPinned(null)
    setAllAddends(false)
    setChecked(null)
    setTakeoverAt(null)
    setBirths({})
    setTween(null)
  }

  // --- testi ---
  const fmtX = (v: number) => fixed(decimals)(v)
  const info = KERNEL_INFO[kernel]
  const captionCtx = { n, h: userH, kernel, invN: f3(1 / Math.max(n, 1)) }
  const status: ChallengeStatus = checkedValid === null ? 'idle' : checkedValid.ok ? 'ok' : 'ko'
  const firstLive = preset.formulas.findIndex((f) => (typeof f.tex === 'function' ? f.tex({ n, kernel }) : f.tex).includes('\\val'))
  const summary = `${n} ${n === 1 ? scenario.sampleName.one : scenario.sampleName.many}; kernel ${info.it}, h = ${formatH(h)}; ${maxima} massimi locali; nel punto x = ${f2(probe)} la stima vale ${f4(p)}.`

  const terrain = (
    <div className="absolute inset-0" onKeyDown={onTerrainKey}>
      <Plot
        width={720}
        height={480}
        fill
        xDomain={domain}
        yDomain={[-belt, preset.yMax]}
        margin={{ top: 16, right: 14, bottom: 42, left: 48 }}
        ariaLabel={preset.ariaLabel}
        description={`${preset.description ?? ''} ${summary}`.trim()}
        cursor="x"
        cursorFormat={(cx) => `x = ${f2(cx)} · p̂ = ${f3(n > 0 ? parzen1d(cx, xs0, h, kernel) : 0)}`}
        onCursor={(pt) => {
          if (pt !== null) setProbe(Number(Math.min(Math.max(pt.x, domain[0]), domain[1]).toFixed(2)))
        }}
      >
        <Grid axis="y" yTicks={yTicks} />
        {isOn('histogram') || focus === 'histogram' ? (
          <g opacity={dim('histogram')}>
            <Histogram values={xs0} bins={bins} domain={domain} normalize cls={2} />
          </g>
        ) : null}
        <KernelBandsLayer xs={xs} bands={bands} stack={scene.stack} opacity={dim('kernels')} />
        {truthAlpha > 0 ? (
          <g opacity={truthAlpha * dim('truth')}>
            <LinePath data={truthPts} role="truth" />
          </g>
        ) : null}
        {ghost.length > 0 ? <LinePath data={ghost} role="accent" width={2} /> : null}
        {knnPts.length > 0 ? (
          <g opacity={dim('knn')}>
            <LinePath data={knnPts} cls={1} width={2} />
          </g>
        ) : null}
        {estAlpha > 0 && n > 0 ? (
          <g opacity={estAlpha * dim('estimate')}>
            <LinePath data={estPts} role="estimate" width={3} />
          </g>
        ) : null}
        {estAlpha > 0 && n > 0 ? <ProbeMarks x0={probe} p={p} terms={terms.map((t) => t.term)} column={kernelsVisible && scene.stack === 0} /> : null}
        {showArrow ? (
          <g opacity={focus === null || focus === 'h' ? 1 : 0.35}>
            <Arrow from={[xs0[nearest] - h / 2, arrowY]} to={[xs0[nearest] + h / 2, arrowY]} double label="h" width={focus === 'h' ? 2.5 : 1.5} />
          </g>
        ) : null}
        {knnOn && n > 0 && Number.isFinite(values.r ?? Number.NaN) ? (
          <g opacity={dim('knn')}>
            <Arrow from={[probe - (values.r ?? 0), values.pk ?? 0]} to={[probe + (values.r ?? 0), values.pk ?? 0]} double cls={1} label="2r_K" width={1.5} />
          </g>
        ) : null}
        <SampleBelt
          samples={samples.map((s, i) => ({ id: s.id, x: s.x, drop: easeIn(scene.fall[i] ?? 1) }))}
          bottom={-belt}
          from={preset.yMax}
          editable={preset.samples.editable}
          onAdd={addSample}
          onRemove={removeSample}
          name={scenario.sampleName.one}
          format={fmtX}
          opacity={dim('samples')}
        />
        <ClippedMarks at={clipped} />
        {/* etichette dirette su punti diversi: le tre curve hanno il picco quasi nello stesso x */}
        {estAlpha >= 1 && n > 0 && focus === null ? <CurveLabel at={peakPoint(estPts)} text="p̂(x)" anchor="end" /> : null}
        {truthAlpha >= 1 && focus === null ? <CurveLabel at={flankPoint(truthPts, 'right', 0.55)} text="p(x) vera" above={false} /> : null}
        {ghost.length > 0 && hOpt !== undefined ? <CurveLabel at={flankPoint(ghost, 'left', 0.5)} text={`h* = ${formatH(Number(hOpt.toFixed(2)))}`} anchor="end" above={false} /> : null}
        <Axis side="bottom" label={scenario.axis.it} symbol={scenario.axis.unit !== undefined ? `x [${scenario.axis.unit}]` : 'x'} />
        <Axis side="left" ticks={yTicks} symbol="p̂(x)" />
      </Plot>
      <RegimeStamp regime={regime} />
    </div>
  )

  const controls = (
    <>
      <Slider
        id={`${uid}-h`}
        label="Larghezza della finestra (bandwidth)"
        latex="h"
        min={0}
        max={hSteps.length - 1}
        step={1}
        value={hIndex}
        onChange={onHIndex}
        format={(i) => formatH(hSteps[Math.round(i)] ?? userH)}
      />
      {preset.kernels.length > 1 ? (
        <Segmented id={`${uid}-kernel`} label="Kernel γ (Parzen window)" options={preset.kernels.map((kv) => ({ value: kv, label: KERNEL_INFO[kv].it }))} value={kernel} onChange={setKernel} />
      ) : null}
      {offered('knn') ? (
        <Slider id={`${uid}-k`} label="Vicini (nearest neighbors)" latex="K" min={Math.max(1, preset.k?.min ?? 1)} max={Math.max(1, Math.min(preset.k?.max ?? n, n))} step={1} value={kEff} onChange={setK} format={count} />
      ) : null}
      {offered('histogram') ? (
        <Slider id={`${uid}-bins`} label="Bin dell'istogramma" min={preset.bins?.min ?? 2} max={preset.bins?.max ?? 30} step={1} value={bins} onChange={setBins} format={count} />
      ) : null}

      <div className="grid gap-1">
        {(['kernels', 'truth', 'histogram', 'knn'] as const)
          .filter((l) => offered(l) && (l !== 'truth' || scenario.truth !== undefined))
          .map((l) => (
            <Toggle key={l} id={`${uid}-layer-${l}`} label={LAYER_TOGGLES[l].label} hint={LAYER_TOGGLES[l].hint} checked={isOn(l)} onChange={(on) => toggleLayer(l, on)} />
          ))}
      </div>

      {preset.samples.editable ? (
        <div className="grid gap-2">
          <p className="label m-0">
            {scenario.sampleName.many} · <span className="num tracking-normal normal-case">N = {n}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={() => addSample(probe)} disabled={n >= preset.samples.max}>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="square" aria-hidden="true">
                <path d="M5 12h14M12 5v14" />
              </svg>
              Aggiungi in x = {typographic(fmtX(snapSample(probe, domain, decimals)))}
            </ActionButton>
            <ActionButton onClick={() => removeNearest(probe)} disabled={n <= preset.samples.min}>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="square" aria-hidden="true">
                <path d="M5 12h14" />
              </svg>
              Togli il più vicino{nearest >= 0 ? ` (${typographic(fmtX(xs0[nearest]))})` : ''}
            </ActionButton>
          </div>
          <p className="m-0 text-[length:var(--step--1)] text-muted">
            Sul terreno: clic sul nastro per aggiungere, clic su un {scenario.sampleName.one} per toglierlo. Da tastiera, sul cursore di lettura: frecce per spostare x, Invio aggiunge, Canc toglie il più vicino.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="Stima nel punto x" latex="\hat p(x)" value={p} format={f4} pinned />
        <Readout label="Campioni" latex="N" value={n} format={count} />
        <Readout label="Massimi locali" value={maxima} format={count} />
        <Readout label="Smoothing" value={REGIME_WORDS[regime]} />
        {iseVisible && iseValue !== undefined ? <Readout label="Errore integrato" latex="\mathrm{ISE}" value={iseValue} format={f4} /> : null}
        {truthFn !== undefined && truthAlpha > 0 ? <Readout label="Densità vera in x" latex="p(x)" value={values.ptrue ?? Number.NaN} format={f4} /> : null}
        {isOn('knn') && values.pk !== undefined ? <Readout label="Stima K-NN in x" latex="\hat p_K(x)" value={values.pk} format={f4} /> : null}
      </div>

      {preset.terms !== undefined && preset.terms.length > 0 ? (
        <TermLegend terms={preset.terms} pinned={pinned} onPreview={setPreview} onPin={(t) => setPinned((cur) => (cur === t ? null : t))} notes={preset.notes} />
      ) : null}
    </>
  )

  const caption = (
    <div className="grid gap-4">
      {currentStep !== undefined ? <StepCaption index={sb.index} total={steps.length} label={sb.step.label} text={captionFor(currentStep, captionCtx)} /> : null}
      <div className="grid gap-4 border-t border-border pt-3">
        {preset.formulas.map((f, i) => (
          <div key={f.id} className="grid min-w-0 gap-1">
            {f.label !== undefined ? <span className="label">{f.label}</span> : null}
            <LiveFormula tex={typeof f.tex === 'function' ? f.tex({ n, kernel }) : f.tex} values={values} announce={i === firstLive} />
          </div>
        ))}
        <div className="grid min-w-0 gap-1">
          <span className="label">
            Kernel scelto · {info.it}{' '}
            <em className="tracking-normal normal-case" lang="en">
              ({info.en} kernel)
            </em>
          </span>
          <M tex={info.tex} display />
        </div>
        {preset.addends === true && n > 0 ? (
          <div className="grid min-w-0 gap-2">
            <AddendsTable terms={terms} limit={allAddends ? terms.length : ADDENDS_SHOWN} x={probe} p={p} name={scenario.sampleName.one} />
            {terms.length > ADDENDS_SHOWN ? <Toggle id={`${uid}-addends`} label={`Mostra tutti gli ${terms.length} addendi`} checked={allAddends} onChange={setAllAddends} /> : null}
          </div>
        ) : null}
      </div>
    </div>
  )

  const ch = preset.challenge
  const challenge =
    ch === undefined ? undefined : (
      <div className="grid gap-4">
        <Challenge prompt={ch.prompt} hint={ch.hint} status={status} onCheck={check} />
        {checkedValid !== null && ch.kind === 'min-ise' && checkedValid.ratio !== undefined ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            <Readout label="Il tuo h" latex="h" value={checkedValid.h ?? h} format={formatH} />
            <Readout label="h ottimo" latex="h^*" value={checkedValid.hOpt ?? Number.NaN} format={f3} />
            <Readout label="ISE minimo" latex="\mathrm{ISE}(h^*)" value={checkedValid.iseMin ?? Number.NaN} format={f4} />
            <Readout label={`Rapporto (serve ≤ ${f2(ch.tolerance)})`} latex="\tfrac{\mathrm{ISE}(h)}{\mathrm{ISE}(h^*)}" value={checkedValid.ratio} format={f2} pinned />
          </div>
        ) : null}
      </div>
    )

  return (
    <WidgetFrame
      meta={meta}
      aspect={preset.aspect ?? 1.5}
      onReset={reset}
      transport={<PlayControls sb={sb} steps={steps} />}
      caption={caption}
      controls={controls}
      challenge={challenge}
    >
      {terrain}
    </WidgetFrame>
  )
}
