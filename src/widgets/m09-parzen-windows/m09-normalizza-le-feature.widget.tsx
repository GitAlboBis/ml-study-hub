// Widget m09-normalizza-le-feature ("Normalizza prima di stimare"), concetto c60. Il kernel sferico usa la stessa σ
// lungo tutte le feature: con luminosità (deviazione standard 1.2) e lunghezza in millimetri (110) la distanza
// euclidea è tutta della lunghezza e la stima ignora la luminosità. Con gli assi alla stessa scala la nuvola è una
// striscia; "Normalizza" centra (i punti traslano) e divide per la scala (gli assi si riscalano), e un solo σ torna
// a funzionare su entrambi gli assi. La barra impilata scompone ‖x − x_k‖² fra le due feature.
//
// MOTO. La normalizzazione è un racconto (1.5 s: 600 ms di traslazione, 900 ms di riscala, ease-in-out) fatto con
// il tempo dei fotogrammi del kit; con reduced motion il foglio passa subito all'altro stato. Durante il moto
// mappa e cerchi si nascondono (valgono solo alle due estremità). Slider e selezioni: nessuna animazione.
import { useCallback, useDeferredValue, useId, useMemo, useState } from 'react'
import { M } from '../../components/content/M'
import { ActionButton } from '../kit/ActionButton'
import { Challenge } from '../kit/Challenge'
import type { ChallengeStatus } from '../kit/Challenge'
import { fixed } from '../kit/format'
import { NumberField } from '../kit/NumberField'
import { PlayControls } from '../kit/PlayControls'
import { Axis } from '../kit/plot/Axis'
import { FieldCanvas } from '../kit/plot/FieldCanvas'
import { classSymbolPath, classVar } from '../kit/plot/marks'
import { Plot, usePlot } from '../kit/plot/Plot'
import { Readout } from '../kit/Readout'
import { Segmented } from '../kit/Segmented'
import { StepCaption } from '../kit/StepCaption'
import { useStoryboard } from '../kit/useStoryboard'
import { WidgetFrame } from '../kit/WidgetFrame'
import { formatH } from '../engines/density1d'
import type { WidgetMeta } from '../types'
import { useTween } from './proprieta/hooks'
import { FormulaBox, Icon, LogSlider, StaticFormula } from './proprieta/ui'
import {
  INITIAL,
  N,
  NORMALIZE_MS,
  SIGMA_NORM,
  SIGMA_ORIG,
  averageShare,
  bestSigma,
  decompose,
  dominantInMeters,
  params,
  salmons,
  specht2,
  stats,
  transformAt,
} from './normalizza'
import type { Fish, Mode } from './normalizza'

export const meta: WidgetMeta = {
  id: 'm09-normalizza-le-feature',
  moduleId: 'm09-parzen-windows',
  title: 'Normalizza prima di stimare',
  concepts: ['c60'],
  scenario: 'pesce',
  scenarioNote: '30 salmoni descritti da luminosità (scala 0-10) e lunghezza in millimetri: scale numeriche lontanissime',
  size: 'M',
}

const f2 = fixed(2)
const f4 = fixed(4)
const pct = (v: number) => `${(v * 100).toFixed(v > 0.999 || v < 0.001 ? 2 : 0)}%`

// grafico a rapporto fisso: la stessa unità è lunga uguale sui due assi (inventario: "gli assi alla stessa scala")
const W = 560
const H = 330
const MARGIN = { top: 22, right: 12, bottom: 38, left: 56 }
const ASPECT = (W - MARGIN.left - MARGIN.right) / (H - MARGIN.top - MARGIN.bottom)
const HALF_ORIG = 350
const HALF_END: Record<Mode, number> = { zscore: 2.6, minmax: 0.68 }

const STEPS = [
  { id: 'quadro', label: 'Il quadro: due feature, due scale', durationMs: 1500 },
  { id: 'sigma', label: 'Nessun σ va bene su entrambi gli assi', durationMs: 1800 },
  { id: 'coppia', label: 'Due salmoni: chi decide la distanza?', durationMs: 1500 },
  { id: 'normalizza', label: 'Normalizza: centra, poi riscala', durationMs: NORMALIZE_MS },
  { id: 'un-sigma', label: 'Un solo σ per tutte le feature', durationMs: 1500 },
  { id: 'chiusura', label: 'Prima normalizzare, poi stimare', durationMs: 1500 },
]
const NORM_FROM = 3

function caption(index: number, d0: [number, number], share: [number, number]): string {
  switch (index) {
    case 0:
      return String.raw`${N} salmoni: lunghezza in millimetri (in orizzontale) e luminosità (in verticale), con gli assi **alla stessa scala**: un'unità di luminosità è lunga quanto un millimetro. La nuvola è una striscia sottilissima. I cerchi sono i kernel sferici di raggio $\sigma$: coprono tutta la luminosità, che viene ignorata, e sono piccoli rispetto alla lunghezza.`
    case 1:
      return String.raw`Muovi $\sigma$ (unità originali, da 0.1 a 200): con $\sigma$ grande la stima si spalma su tutte le luminosità, con $\sigma$ piccola diventa a strisce isolate lungo la lunghezza. Qualunque valore è sbagliato lungo almeno un asse: la stessa $\sigma$ non può andare bene per due scale lontanissime.`
    case 2:
      return String.raw`I due salmoni evidenziati, (4.2, 520) e (5.1, 610): $\|\mathbf x - \mathbf x_k\|^2 = (5.1 - 4.2)^2 + (610 - 520)^2 = ${f2(d0[0])} + ${f2(d0[1])}$, cioè il ${pct(share[1])} dalla lunghezza. La barra impilata lo mostra; clicca altri due salmoni per un'altra coppia.`
    case 3:
      return String.raw`Normalizza: ogni feature viene centrata (i punti traslano, 600 ms) e divisa per la propria scala (gli assi si riscalano, 900 ms), $x_j' = (x_j - \mu_j)/s_j$. La nuvola diventa tondeggiante e i cerchi tornano cerchi sensati.`
    case 4:
      return String.raw`Con le feature normalizzate un solo $\sigma$ (ora da 0.05 a 2) funziona su entrambi gli assi e la stima segue la nuvola. La coppia di prima vale 0.56 contro 0.67: 46% e 54%. Il pulsante "Torna alle unità originali" rifà il percorso all'indietro.`
    default:
      return String.raw`Slide p65: *since σ is the same along all features, it is important to normalize them before undertaking the pdf estimation process*. Normalizzare fa pesare ugualmente ogni feature nella distanza e permette al kernel di formare ipersfere sensate attorno ai dati.`
  }
}

const PROMPT = String.raw`Nelle unità originali prova a trovare un $\sigma$ che dia una stima ragionevole su **entrambi** gli assi. Quando ti arrendi, normalizza e scegli un $\sigma$ vicino a quello che massimizza la log-verosimiglianza leave-one-out (entro un fattore 1.5). Infine prevedi: se la lunghezza fosse in **metri**, quale feature dominerebbe la distanza?`
const HINT = String.raw`In metri la lunghezza varia di circa 0.11 (la deviazione standard di 110 mm): conta la deviazione standard di ciascuna feature, non l'unità in sé. Per $\sigma$: con le feature normalizzate prova valori fra 0.3 e 0.6.`

const FEATURE_COLOR = [classVar(2), classVar(1)] as const

/** Barra impilata della distanza al quadrato fra due salmoni: una parte per feature, con le percentuali. */
function StackedBar({ share, label }: { share: [number, number]; label: string }) {
  return (
    <div className="grid gap-1">
      <span className="label">{label}</span>
      <div className="flex h-6 border border-border-strong" role="img" aria-label={`Luminosità ${pct(share[0])}, lunghezza ${pct(share[1])}`}>
        <span className="flex items-center justify-start overflow-hidden px-1" style={{ width: `${share[0] * 100}%`, background: FEATURE_COLOR[0] }} />
        <span className="flex items-center justify-start overflow-hidden px-1" style={{ width: `${share[1] * 100}%`, background: FEATURE_COLOR[1] }} />
      </div>
      <div className="num flex justify-between text-[length:var(--step--1)]">
        <span className="flex items-center gap-1">
          <span aria-hidden="true" className="inline-block size-2.5" style={{ background: FEATURE_COLOR[0] }} />
          luminosità {pct(share[0])}
        </span>
        <span className="flex items-center gap-1">
          lunghezza {pct(share[1])}
          <span aria-hidden="true" className="inline-block size-2.5" style={{ background: FEATURE_COLOR[1] }} />
        </span>
      </div>
    </div>
  )
}

/** I salmoni nello spazio mostrato, i cerchi (ellissi durante il moto nascoste), la coppia evidenziata. */
function FishLayer({ pts, pair, sigma, showKernels, onPick }: { pts: readonly Fish[]; pair: readonly [number, number]; sigma: number; showKernels: boolean; onPick: (i: number) => void }) {
  const { x, y, clipPath } = usePlot()
  // il raggio del kernel letto dalle scale vere: se gli assi non sono esattamente alla stessa scala si vede un'ellisse
  const rx = Math.abs(x(sigma) - x(0))
  const ry = Math.abs(y(sigma) - y(0))
  const a = pts[pair[0]]
  const b = pts[pair[1]]
  return (
    <g data-fish="">
      <g clipPath={clipPath} pointerEvents="none">
        {showKernels ? pts.map((p, i) => <ellipse key={`k${i}`} cx={x(p[0])} cy={y(p[1])} rx={rx} ry={ry} fill="none" stroke="var(--text)" strokeOpacity={0.35} />) : null}
        {a !== undefined && b !== undefined ? <line x1={x(a[0])} y1={y(a[1])} x2={x(b[0])} y2={y(b[1])} stroke="var(--pin-contrast)" strokeWidth={2} /> : null}
      </g>
      {pts.map((p, i) => {
        const sel = i === pair[0] || i === pair[1]
        return (
          <g key={i} data-salmon={i} transform={`translate(${x(p[0])},${y(p[1])})`} style={{ cursor: 'pointer' }} onClick={() => onPick(i)}>
            <circle r={10} fill="transparent" />
            {sel ? <circle r={8} fill="var(--viz-highlight)" stroke="var(--pin-contrast)" /> : null}
            <path d={classSymbolPath(0, 42)} fill="var(--viz-sample)" stroke="var(--surface)" strokeWidth={2} paintOrder="stroke" />
          </g>
        )
      })}
    </g>
  )
}

export default function M09NormalizzaLeFeature() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const fish = useMemo(() => salmons(), [])
  const st = useMemo(() => stats(fish), [fish])
  const [normUser, setNormUser] = useState(false)
  const [mode, setMode] = useState<Mode>('zscore')
  const [sigmaOrig, setSigmaOrig] = useState(INITIAL.sigmaOrig)
  const [sigmaNorm, setSigmaNorm] = useState(INITIAL.sigmaNorm)
  const [pair, setPair] = useState<[number, number]>([0, 1])
  const [meters, setMeters] = useState<'luminosita' | 'lunghezza' | 'nessuna'>('nessuna')
  const [takeoverAt, setTakeoverAt] = useState<number | null>(null)
  const [checked, setChecked] = useState<{ key: string; ok: boolean } | null>(null)

  const sb = useStoryboard(STEPS)
  const imposed = sb.index >= NORM_FROM && takeoverAt !== sb.index
  const normalized = imposed ? true : normUser
  const t = useTween(normalized ? 1 : 0, NORMALIZE_MS)
  const p = params(st, mode)
  const tr = transformAt(t, p)
  // [lunghezza, luminosità] nello spazio mostrato: la lunghezza in orizzontale
  const shown = fish.map((f) => [(f[1] - tr.c[1]) / tr.s[1], (f[0] - tr.c[0]) / tr.s[0]] as const)
  const atRest = t === 0 || t === 1
  const sigma = normalized ? sigmaNorm : sigmaOrig

  // dominio: centro = il centro originale trasformato; semi-ampiezza da 350 (stessa scala) a quella finale
  const cx = (600 - tr.c[1]) / tr.s[1]
  const cy = (4.6 - tr.c[0]) / tr.s[0]
  const halfX = HALF_ORIG ** (1 - tr.scale) * (HALF_END[mode] * ASPECT) ** tr.scale
  const halfY = halfX / ASPECT
  const xDomain: [number, number] = [cx - halfX, cx + halfX]
  const yDomain: [number, number] = [cy - halfY, cy + halfY]

  const restPts = useMemo(() => {
    if (!atRest) return []
    const q = transformAt(t, params(st, mode))
    return fish.map((f) => [(f[1] - q.c[1]) / q.s[1], (f[0] - q.c[0]) / q.s[0]] as const)
  }, [atRest, t, mode, fish, st])
  const mapPts = useDeferredValue(restPts)
  const mapSigma = useDeferredValue(sigma)
  const field = useCallback((x: number, y: number) => (mapPts.length === 0 ? 0 : specht2(x, y, mapPts, mapSigma)), [mapPts, mapSigma])

  const dOrig = decompose(fish[pair[0]], fish[pair[1]])
  const pairShown = decompose([shown[pair[0]][1], shown[pair[0]][0]], [shown[pair[1]][1], shown[pair[1]][0]])
  const avg = averageShare(shown.map((s) => [s[1], s[0]] as const))
  const normPts = useMemo(() => fish.map((f) => [(f[1] - p.c[1]) / p.s[1], (f[0] - p.c[0]) / p.s[0]] as const), [fish, p.c, p.s])
  const best = useMemo(() => bestSigma(normPts, SIGMA_NORM), [normPts])

  const onNormalize = () => {
    if (imposed) {
      sb.pause()
      setTakeoverAt(sb.index)
      setNormUser(false)
      return
    }
    setNormUser((v) => !v)
  }
  const onPick = (i: number) => setPair((pr) => (i === pr[0] ? pr : [i, pr[0]]))

  const values = {
    a0: fish[pair[0]][0],
    b0: fish[pair[1]][0],
    a1: fish[pair[0]][1],
    b1: fish[pair[1]][1],
    d0: dOrig.parts[0],
    d1: dOrig.parts[1],
    z0: pairShown.parts[0],
    z1: pairShown.parts[1],
    mu0: p.c[0],
    s0: p.s[0],
    mu1: p.c[1],
    s1: p.s[1],
  }

  const checkKey = `${normalized}|${mode}|${sigmaNorm}|${meters}`
  const checkedValid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = checkedValid === null ? 'idle' : checkedValid.ok ? 'ok' : 'ko'
  const judge = () => normalized && sigmaNorm / best <= 1.5 && best / sigmaNorm <= 1.5 && meters === dominantInMeters(st)

  const reset = () => {
    sb.reset()
    setNormUser(false)
    setMode('zscore')
    setSigmaOrig(INITIAL.sigmaOrig)
    setSigmaNorm(INITIAL.sigmaNorm)
    setPair([0, 1])
    setMeters('nessuna')
    setTakeoverAt(null)
    setChecked(null)
  }

  const unitsLabel = t === 0 ? ['lunghezza', 'x₂ [mm]', 'luminosità x₁'] : t === 1 ? ['lunghezza', mode === 'zscore' ? "x₂' (z)" : "x₂' (min-max)", mode === 'zscore' ? "luminosità x₁' (z)" : "luminosità x₁'"] : ['lunghezza', '…', 'luminosità …']

  const terrain = (
    <div className="absolute inset-0">
      <Plot
        width={W}
        height={H}
        fill
        xDomain={xDomain}
        yDomain={yDomain}
        margin={MARGIN}
        ariaLabel={normalized ? 'Salmoni nelle feature normalizzate, stessa scala sui due assi' : 'Salmoni nelle unità originali, stessa scala sui due assi: la nuvola è una striscia'}
        description={`Coppia evidenziata: quota della distanza al quadrato dovuta alla luminosità ${pct(pairShown.share[0])}, alla lunghezza ${pct(pairShown.share[1])}.`}
      >
        {atRest && mapPts.length > 0 ? <FieldCanvas fn={field} resolution={90} opacity={0.8} /> : null}
        <FishLayer pts={shown} pair={pair} sigma={sigma} showKernels={atRest} onPick={onPick} />
        <Axis side="bottom" label={unitsLabel[0]} symbol={unitsLabel[1]} />
        <Axis side="left" symbol={unitsLabel[2]} />
      </Plot>
    </div>
  )

  const controls = (
    <>
      <div className="flex flex-wrap gap-2">
        <ActionButton variant="primary" onClick={onNormalize}>
          <Icon d={normalized ? 'M5 12a7 7 0 1 0 2-4.9M5 4v4h4' : 'M4 12h16M14 6l6 6-6 6'} />
          {normalized ? 'Torna alle unità originali' : 'Normalizza'}
        </ActionButton>
      </div>
      <Segmented id={`${uid}-mode`} label="Tipo di normalizzazione" options={[{ value: 'zscore', label: 'z-score' }, { value: 'minmax', label: 'min-max' }]} value={mode} onChange={setMode} />
      {normalized ? (
        <LogSlider id={`${uid}-sn`} label="σ del kernel (feature normalizzate)" latex="\sigma" values={SIGMA_NORM} value={sigmaNorm} onChange={setSigmaNorm} format={formatH} />
      ) : (
        <LogSlider id={`${uid}-so`} label="σ del kernel (unità originali)" latex="\sigma" values={SIGMA_ORIG} value={sigmaOrig} onChange={setSigmaOrig} format={(v) => (v < 1 ? v.toFixed(2) : v.toFixed(1))} />
      )}
      <StackedBar share={pairShown.share} label={`‖x − x_k‖² fra i salmoni ${pair[0] + 1} e ${pair[1] + 1}`} />
      <div className="grid grid-cols-2 gap-2">
        <NumberField id={`${uid}-a`} label="Salmone A" min={1} max={N} step={1} value={pair[0] + 1} onChange={(v) => setPair((pr) => [v - 1, pr[1]])} />
        <NumberField id={`${uid}-b`} label="Salmone B" min={1} max={N} step={1} value={pair[1] + 1} onChange={(v) => setPair((pr) => [pr[0], v - 1])} />
      </div>
      <p className="m-0 text-[length:var(--step--1)] text-muted">Sul grafico: clic su due salmoni per scegliere la coppia.</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="Quota media: luminosità" value={pct(avg[0])} />
        <Readout label="Quota media: lunghezza" value={pct(avg[1])} pinned />
        <Readout label="Luminosità: media, dev. st." value={`${f2(st.mean[0])}, ${f2(st.sd[0])}`} />
        <Readout label="Lunghezza: media, dev. st." value={`${st.mean[1].toFixed(1)}, ${st.sd[1].toFixed(1)}`} />
      </div>
    </>
  )

  const captionBlock = (
    <div className="grid gap-4">
      <StepCaption index={sb.index} total={STEPS.length} label={sb.step.label} text={caption(sb.index, dOrig.parts, dOrig.share)} />
      <div className="grid gap-4 border-t border-border pt-3">
        <StaticFormula label="La distanza del kernel sferico somma le feature" tex={String.raw`\|\mathbf{x}-\mathbf{x}_k\|^2=\sum_{j=1}^{n}(x_j-x_{kj})^2`} />
        <FormulaBox
          label="La coppia nelle unità originali"
          tex={String.raw`\|\mathbf{x}-\mathbf{x}_k\|^2=(\val[1]{b0}-\val[1]{a0})^2+(\val[0]{b1}-\val[0]{a1})^2=\val{d0}+\val[0]{d1}`}
          values={values}
          announce
        />
        <FormulaBox
          label={mode === 'zscore' ? 'Normalizzazione z-score' : 'Normalizzazione min-max'}
          tex={
            mode === 'zscore'
              ? String.raw`x_j'=\frac{x_j-\mu_j}{s_j}:\quad \mu=(\val{mu0},\ \val[1]{mu1}),\ s=(\val{s0},\ \val[1]{s1})\quad\Rightarrow\quad \val{z0}+\val{z1}`
              : String.raw`x_j'=\frac{x_j-\min_j}{\max_j-\min_j}:\quad \min=(\val{mu0},\ \val[1]{mu1}),\ \text{ampiezza}=(\val{s0},\ \val[1]{s1})`
          }
          values={values}
        />
        <p className="m-0 text-[length:var(--step--1)] text-muted">
          Note p45: nella formulazione a kernel gaussiano sferico si assume che tutte le feature abbiano la stessa varianza; normalizzarle mantiene l'ipotesi e fa sì che ogni feature contribuisca
          allo stesso modo alla distanza. Un kernel sferico presuppone che un passo lungo una feature valga quanto un passo lungo l'altra (<M tex="\sigma" /> è la stessa lungo tutte).
        </p>
      </div>
    </div>
  )

  const challenge = (
    <div className="grid gap-4">
      <Segmented
        id={`${uid}-m`}
        label="Con la lunghezza in metri dominerebbe"
        options={[
          { value: 'luminosita', label: 'la luminosità' },
          { value: 'lunghezza', label: 'la lunghezza' },
          { value: 'nessuna', label: 'nessuna delle due' },
        ]}
        value={meters}
        onChange={setMeters}
      />
      <Challenge prompt={PROMPT} hint={HINT} status={status} onCheck={() => setChecked({ key: checkKey, ok: judge() })} />
      {checkedValid !== null ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          <Readout label="Feature normalizzate?" value={normalized ? 'sì' : 'no'} />
          <Readout label="Il tuo σ" value={normalized ? sigmaNorm : sigmaOrig} format={formatH} />
          <Readout label="σ* leave-one-out" value={best} format={formatH} pinned />
          <Readout label="In metri domina" value={dominantInMeters(st) === 'luminosita' ? 'la luminosità' : 'la lunghezza'} />
        </div>
      ) : null}
      <p className="m-0 text-[length:var(--step--1)] text-muted">
        In metri: deviazione standard della lunghezza <span className="num">{f4(st.sd[1] / 1000)}</span> contro <span className="num">{f2(st.sd[0])}</span> della luminosità.
      </p>
    </div>
  )

  return (
    <WidgetFrame meta={meta} aspect={W / H} onReset={reset} transport={<PlayControls sb={sb} steps={STEPS} />} caption={captionBlock} controls={controls} challenge={challenge}>
      {terrain}
    </WidgetFrame>
  )
}
