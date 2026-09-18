// Widget di riferimento n. 2 (piano, Task 4.7): il K-NN. È la "Methodology" della slide 47 di Melgani
// (Cap. 2) eseguita passo per passo sul nastro dei pesci: fissare K e la forma della cella, centrarla in x*,
// farla crescere fino al K-esimo campione, misurare V_K(x*) e applicare p̂(x*) = K / (N·V_K(x*)).
// Poi lo stesso gesto diventa un classificatore (voto dei K vicini, P̂(ω_i|x) = K_i/K), con il confronto
// K = 1 contro K grande (overfitting e oversmoothing) e la sfida dei pesci misteriosi.
//
// STRUTTURA
// - cella-knn.ts: logica pura con i suoi test (dati, cella, tempi, mappe veloci, sfide, piano isotropo);
// - cella-knn-layers.tsx: il terreno (strati SVG animati, mappe su canvas, confronto, legenda);
// - qui: stato, comandi, formula viva, didascalie, sfide.
//
// MOTO E RENDER. Lo storyboard consegna il tempo al canale dei fotogrammi (onFrame), che solo gli strati
// della cella leggono: il widget si ridisegna ai cambi di passo, non a ogni fotogramma. Controlli, slider,
// trascinamento: nessuna animazione, il terreno segue subito la mano. Le mappe si ricalcolano con
// useDeferredValue, così uno slider trascinato resta fluido anche con N = 200.
import { useDeferredValue, useId, useMemo, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { M } from '../../components/content/M'
import { ActionButton } from '../kit/ActionButton'
import { Challenge } from '../kit/Challenge'
import type { ChallengeStatus } from '../kit/Challenge'
import { fixed } from '../kit/format'
import { LiveFormula } from '../kit/LiveFormula'
import { PlayControls } from '../kit/PlayControls'
import { classSymbolPath, classVar } from '../kit/plot/marks'
import { Readout } from '../kit/Readout'
import { Segmented } from '../kit/Segmented'
import { Slider } from '../kit/Slider'
import { StepCaption } from '../kit/StepCaption'
import { Toggle } from '../kit/Toggle'
import { useReducedMotion } from '../kit/useReducedMotion'
import { useStoryboard } from '../kit/useStoryboard'
import { WidgetFrame } from '../kit/WidgetFrame'
import type { WidgetMeta } from '../types'
import {
  CLASS_NAMES,
  K_DEFAULT,
  K_MAX,
  LUM_RANGE,
  MYSTERY,
  MYSTERY_N,
  N_DEFAULT,
  N_RANGE,
  PREDICTION_TOLERANCE,
  STEP,
  STREAK_MIN_MOVE,
  STREAK_TARGET,
  WIDTH_WINDOW,
  X_START,
  addToTrail,
  bigK,
  buildPool,
  cellState,
  classifierSteps,
  createFrameChannel,
  densitySteps,
  densityValues,
  expansionMs,
  expansionRadius,
  judgeMystery,
  judgePrediction,
  litCount,
  makeClassifier,
  makeDensityField,
  ofClass,
  robustPeak,
  trainingSet,
  voteState,
  voteValues,
} from './cella-knn'
import type { ClassId, Fish, MysteryVerdict, PredictionVerdict, TrailPoint, Vec2 } from './cella-knn'
import { Legend, MiniMap, Terrain } from './cella-knn-layers'
import type { Mode } from './cella-knn-layers'

export const meta: WidgetMeta = {
  id: 'm08-cella-che-si-espande',
  moduleId: 'm08-non-parametrica-knn',
  title: 'La cella che si espande fino a K pesci',
  concepts: ['c37', 'c38', 'c39', 'c44', 'c45', 'c64'],
  scenario: 'pesce',
  scenarioNote: 'Salmoni e spigole sul nastro: la telecamera misura larghezza e luminosità di ogni pesce',
  size: 'L',
}

// --- testi ---

// una derivazione incolonnata e non due righe lunghe: così sta nei 390 px di un telefono senza scorrere
const TEX_DENSITY = String.raw`\begin{aligned} \hat{p}(\mathbf{x}^*) &= \frac{K}{N\,V_K(\mathbf{x}^*)} = \frac{\val[0]{K}}{\val[0]{N}\cdot\val{V}} \\ &= \val[4]{p} \\[6pt] V_K(\mathbf{x}^*) &= \pi\,r_K^2(\mathbf{x}^*) = \pi\cdot\val{r}^{2} = \val{V} \end{aligned}`
const TEX_BAYES = String.raw`\hat{P}(\omega_i|\mathbf{x}^*) = \frac{\dfrac{K_i}{N_i V}\cdot\dfrac{N_i}{N}}{\dfrac{K}{N V}} = \frac{K_i}{K}`
const TEX_POST_1 = String.raw`\hat{P}(\omega_1|\mathbf{x}^*) = \frac{K_1}{K} = \frac{\val[0]{K1}}{\val[0]{K}} = \val{P1}`
const TEX_POST_2 = String.raw`\hat{P}(\omega_2|\mathbf{x}^*) = \frac{K_2}{K} = \frac{\val[0]{K2}}{\val[0]{K}} = \val{P2}`

const CLASS_PLURAL = ['salmoni', 'spigole'] as const

function densityCaption(index: number, k: number, n: number, cls: ClassId): string {
  const plural = CLASS_PLURAL[cls]
  switch (index) {
    case 0:
      return String.raw`Due scelte si fanno **a priori**, prima di guardare $\mathbf{x}^*$: il numero di vicini $K = ${k}$ e la forma della cella (*cell*), qui un cerchio, l'ipersfera del piano. $\mathbf{x}^*$ è il punto in cui stimare la densità dei ${plural} ($N = ${n}$): trascinalo, usa le frecce o tocca il piano.`
    case 1:
      return String.raw`La cella centrata in $\mathbf{x}^*$ cresce a velocità costante (*expand the cell up to spanning K training samples*). Ogni pesce toccato si accende e riceve il suo numero: i vicini (*nearest neighbors*) arrivano **in ordine di distanza**. Al $K$-esimo la crescita si ferma.`
    case 2:
      return String.raw`Il righello misura $r_K(\mathbf{x}^*)$, la distanza del $K$-esimo vicino. Il volume raggiunto (*resulting volume*) è $V_K(\mathbf{x}^*) = \pi\,r_K^2$: in due dimensioni l'ipervolume è un'area. La distanza è euclidea sui valori grezzi: un centimetro di larghezza pesa quanto un punto di luminosità.`
    case 3:
      return String.raw`$\hat p(\mathbf{x}^*) = K/(N\,V_K)$: $K/N$ è la frazione di campioni nella cella, divisa per il suo volume. Il numeratore è fisso: tutta l'informazione sta in **quanto è dovuta crescere la cella**. Dove i pesci sono fitti la cella resta piccola e la stima è alta; dove sono radi si allarga e la stima scende. Lo spillo rosso è alto come la stima: sposta $\mathbf{x}^*$ e lascia una scia.`
    default:
      return String.raw`La stima è puntuale: per la mappa si ripete tutto in ogni punto di una griglia, e ogni punto costa $N$ distanze. Creste spigolose e **nessuna zona a zero**: anche lontano da tutti i pesci la cella prima o poi raccoglie $K$ campioni. La cella si adatta alla densità locale (*adaptive to local density variations*).`
  }
}

function classifierCaption(index: number, k: number, n: number, tie: boolean): string {
  switch (index) {
    case 0:
      return String.raw`Un pesce sconosciuto $\mathbf{x}^*$ arriva sul nastro. Il training set ha $N_1 = ${n}$ salmoni ($\omega_1$) e $N_2 = ${n}$ spigole ($\omega_2$). Si fissano $K = ${k}$ e la cella circolare.`
    case 1:
      return String.raw`La cella cresce finché contiene $K$ pesci **di qualunque classe**; a ogni pesce toccato scatta il contatore della sua classe, $K_1$ o $K_2$. La stessa cella, con lo stesso volume $V$, vale per tutte le classi.`
    case 2:
      return (
        String.raw`Con le stime K-NN $\hat p(\mathbf{x}|\omega_i) = K_i/(N_i V)$ e i prior $\hat P(\omega_i) = N_i/N$, la regola di Bayes dà $\hat P(\omega_i|\mathbf{x}) = K_i/K$: $V$, $N$ e $N_i$ si semplificano. Vince la classe più rappresentata fra i $K$ vicini: il voto di maggioranza (*majority vote*) è la regola MAP.` +
        (tie ? ' **Parità**: decide la classe del vicino più vicino. Con due classi conviene $K$ dispari.' : '')
      )
    default:
      return String.raw`Ripetendo il voto in ogni punto si ottengono le regioni di decisione (*decision regions*). Con $K = 1$ il confine è frastagliato e circonda i singoli pesci (*overfitting*); con $K$ grande è liscio e perde i dettagli (*oversmoothing*).`
  }
}

// --- piccoli pezzi ---

const ICON = { viewBox: '0 0 24 24', width: 20, height: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'square', 'aria-hidden': true } as const
const CheckIcon = () => (
  <svg {...ICON} className="shrink-0 text-ok">
    <path d="M4 12.5l5 5L20 6.5" />
  </svg>
)
const WarnIcon = () => (
  <svg {...ICON} className="shrink-0 text-warn">
    <path d="M12 4v10M12 18.5v.5" />
  </svg>
)

function Verdict({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <p className={`m-0 flex items-start gap-2 border border-border p-2.5 ${ok ? 'bg-ok-bg' : 'bg-warn-bg'}`}>
      {ok ? <CheckIcon /> : <WarnIcon />}
      <span className="min-w-0">{children}</span>
    </p>
  )
}

/** Barre dei voti: la frazione K_i/K di ogni classe, con marcatore e colore della classe. Le cifre sono nei Readout. */
function VoteBars({ K1, K2, shown }: { K1: number; K2: number; shown: boolean }) {
  const K = K1 + K2
  return (
    <div aria-hidden="true" className="grid gap-1.5">
      {([0, 1] as const).map((c) => {
        const count = c === 0 ? K1 : K2
        const frac = shown && K > 0 ? count / K : 0
        return (
          <div key={c} className="grid grid-cols-[6.5rem_minmax(0,1fr)_2rem] items-center gap-2">
            <span className="label flex items-center gap-1.5">
              <svg viewBox="-8 -8 16 16" width={14} height={14}>
                <path d={classSymbolPath(c, 60)} fill={classVar(c)} />
              </svg>
              {CLASS_NAMES[c]}
            </span>
            <span className="relative h-3 border border-border bg-surface-2">
              <span className="absolute inset-y-0 left-0" style={{ width: `${frac * 100}%`, background: classVar(c) }} />
            </span>
            <span className="num text-right">{shown ? count : '—'}</span>
          </div>
        )
      })}
    </div>
  )
}

// --- stato ---

interface Prediction {
  verdict: PredictionVerdict
  at: Vec2
  k: number
  n: number
  cls: ClassId
  /** la riuscita conta per la serie? 'stessa' = giusta ma nello stesso punto della precedente */
  counted: 'nuova' | 'stessa' | 'no'
}

interface MysteryCheck {
  status: ChallengeStatus
  verdicts: MysteryVerdict[] | null
  reason: 'modo' | 'n' | null
}

const IDLE_CHECK: MysteryCheck = { status: 'idle', verdicts: null, reason: null }
const NO_FISH: readonly Fish[] = []
const TRANSPORT_KEYS = new Set([' ', 'Enter', 'ArrowLeft', 'ArrowRight'])
const f0 = fixed(0)
const f2 = fixed(2)
const f4 = fixed(4)
const show = (v: number | string | undefined): number | string => (v === undefined ? '—' : v)

export default function CellaCheSiEspande() {
  const uid = useId()
  const reduced = useReducedMotion()
  const pool = useMemo(() => buildPool(), [])

  const [mode, setMode] = useState<Mode>('densita')
  const [cls, setCls] = useState<ClassId>(0)
  const [K, setK] = useState(K_DEFAULT)
  const [N, setN] = useState(N_DEFAULT)
  const [x, setX] = useState<Vec2>(X_START)
  const [mapOn, setMapOn] = useState(false)
  const [compare, setCompare] = useState(false)
  const [trailOn, setTrailOn] = useState(true)
  const [trail, setTrail] = useState<TrailPoint[]>([])
  const [predict, setPredict] = useState(false)
  const [rGuess, setRGuess] = useState(1)
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [streak, setStreak] = useState<{ count: number; last: Vec2 | null }>({ count: 0, last: null })
  const [manual, setManual] = useState<number | null>(null)
  const [check, setCheck] = useState<MysteryCheck>(IDLE_CHECK)

  // --- dati e stima nel punto ---
  const train = useMemo(() => trainingSet(pool, N), [pool, N])
  const samples = useMemo(() => (mode === 'densita' ? ofClass(train, cls) : train), [mode, train, cls])
  const others = useMemo(() => (mode === 'densita' ? ofClass(train, cls === 0 ? 1 : 0) : NO_FISH), [mode, train, cls])
  const kMax = Math.min(K_MAX, samples.length)
  const k = Math.min(K, kMax)
  const cell = useMemo(() => cellState(x, samples, k), [x, samples, k])
  const vote = useMemo(() => (mode === 'classificatore' ? voteState(x, train, k) : null), [mode, x, train, k])

  // --- storyboard ---
  const steps = mode === 'densita' ? densitySteps(k) : classifierSteps(k)
  const lastStep = steps.length - 1
  const [channel] = useState(() => createFrameChannel())
  const sb = useStoryboard(steps, { onFrame: channel.set })

  // --- mappe (in differita: lo slider resta fluido) ---
  const mapSamples = useDeferredValue(samples)
  const mapTrain = useDeferredValue(train)
  const mapK = useDeferredValue(k)
  const showMap = mapOn || sb.index === lastStep
  const densityField = useMemo(() => (mode === 'densita' ? makeDensityField(mapSamples, Math.min(mapK, mapSamples.length)) : null), [mode, mapSamples, mapK])
  const peak = useMemo(() => (densityField !== null ? robustPeak(densityField, WIDTH_WINDOW, LUM_RANGE) : 1), [densityField])
  const classify = useMemo(() => (mode === 'classificatore' && showMap ? makeClassifier(mapTrain, mapK) : null), [mode, showMap, mapTrain, mapK])

  const kBig = Math.min(bigK(mode, N), mode === 'densita' ? mapSamples.length : mapTrain.length)
  const comparison = useMemo(() => {
    if (!compare) return null
    if (mode === 'densita') {
      const small = makeDensityField(mapSamples, 1)
      const big = makeDensityField(mapSamples, kBig)
      return {
        // con K = 1 la stima ha code pesantissime (aghi sui pesci): il tetto al 90° percentile invece del 97°
        // lascia vedere l'arcipelago di picchi invece di una pianura con qualche punto acceso
        small: { field: small, peak: robustPeak(small, WIDTH_WINDOW, LUM_RANGE, 48, 32, 0.9), classify: null },
        big: { field: big, peak: robustPeak(big, WIDTH_WINDOW, LUM_RANGE), classify: null },
      }
    }
    return { small: { field: null, peak: 1, classify: makeClassifier(mapTrain, 1) }, big: { field: null, peak: 1, classify: makeClassifier(mapTrain, kBig) } }
  }, [compare, mode, mapSamples, mapTrain, kBig])

  // --- previsione ---
  const predicting = predict && mode === 'densita'
  const revealed = prediction !== null && prediction.at === x && prediction.k === k && prediction.n === N && prediction.cls === cls
  const hidden = predicting && !revealed
  const guessP = k / (samples.length * Math.PI * rGuess ** 2)

  // --- azioni ---
  const clearManual = () => setManual(null)

  /** Sposta x*. Dopo la stima, la posizione che si lascia resta nella scia. */
  const move = (p: Vec2) => {
    if (trailOn && mode === 'densita' && sb.index >= STEP.stima && !hidden) setTrail((t) => addToTrail(t, { x: x[0], y: x[1], p: cell.p }))
    setX(p)
  }
  /** Un gesto discreto (clic sul piano, pesce misterioso): se la storia è già partita, la cella rinasce in x*. */
  const place = (p: Vec2) => {
    move(p)
    if (sb.index > STEP.punto && !sb.playing) {
      clearManual()
      sb.goto(STEP.espansione)
      sb.play()
    }
  }

  const changeMode = (m: Mode) => {
    if (m === mode) return
    setMode(m)
    setTrail([])
    setPrediction(null)
    setCheck(IDLE_CHECK)
    clearManual()
    sb.reset()
  }
  const changeK = (v: number) => {
    setK(v)
    setTrail([])
    setCheck((c) => (c.status === 'ko' ? IDLE_CHECK : c))
  }
  const changeN = (v: number) => {
    setN(v)
    setTrail([])
    setCheck((c) => (c.status === 'ko' ? IDLE_CHECK : c))
  }
  const changeCls = (c: ClassId) => {
    setCls(c)
    setTrail([])
  }

  /** "+1 vicino": l'espansione un campione alla volta, a storyboard fermo. */
  const stepNeighbor = () => {
    const f = channel.get()
    if (f.index !== STEP.espansione) {
      sb.pause()
      sb.goto(STEP.espansione)
      setManual(1)
      return
    }
    // quanti vicini si vedono adesso: a storyboard fermo, all'inizio del passo, se ne vede lo stato finale (tutti)
    const shown = !sb.playing && f.progress === 0 ? 1 : f.progress
    const lit = manual ?? litCount(cell.neighbors, expansionRadius(shown, cell.rK), k)
    sb.pause()
    if (lit >= k) {
      clearManual()
      sb.next()
      return
    }
    setManual(lit + 1)
  }

  const checkPrediction = () => {
    const verdict = judgePrediction(x, samples, k, rGuess)
    let counted: Prediction['counted'] = 'no'
    if (verdict.ok) {
      const fresh = streak.last === null || Math.hypot(x[0] - streak.last[0], x[1] - streak.last[1]) >= STREAK_MIN_MOVE
      counted = fresh ? 'nuova' : 'stessa'
      if (fresh) setStreak((s) => ({ count: Math.min(STREAK_TARGET, s.count + 1), last: x }))
    } else {
      setStreak({ count: 0, last: null })
    }
    setPrediction({ verdict, at: x, k, n: N, cls, counted })
    clearManual()
    sb.goto(STEP.espansione)
    sb.play()
  }

  const checkMystery = () => {
    if (mode !== 'classificatore') return setCheck({ status: 'ko', verdicts: null, reason: 'modo' })
    if (N !== MYSTERY_N) return setCheck({ status: 'ko', verdicts: null, reason: 'n' })
    const j = judgeMystery(train, k)
    setCheck({ status: j.ok ? 'ok' : 'ko', verdicts: j.verdicts, reason: null })
  }
  const goToMystery = (p: Vec2) => {
    if (mode === 'classificatore') return place(p)
    changeMode('classificatore')
    setX(p)
  }
  const goodKs = useMemo(() => (check.status === 'ok' ? Array.from({ length: K_MAX }, (_, i) => i + 1).filter((kk) => judgeMystery(train, kk).ok) : []), [check.status, train])

  const reset = () => {
    setMode('densita')
    setCls(0)
    setK(K_DEFAULT)
    setN(N_DEFAULT)
    setX(X_START)
    setMapOn(false)
    setCompare(false)
    setTrailOn(true)
    setTrail([])
    setPredict(false)
    setRGuess(1)
    setPrediction(null)
    setStreak({ count: 0, last: null })
    setManual(null)
    setCheck(IDLE_CHECK)
    sb.reset()
  }

  // --- valori mostrati ---
  const dv = densityValues(cell, sb.index, hidden)
  const vv = vote !== null ? voteValues(vote, sb.index) : null
  const voted = vote !== null && sb.index >= STEP.voto
  const sqrtK = Math.max(1, Math.min(kMax, Math.round(Math.sqrt(samples.length))))
  const plural = CLASS_PLURAL[cls]
  const where = `(${x[0].toFixed(1)}, ${x[1].toFixed(2)})`

  const ariaLabel =
    mode === 'densita'
      ? `Piano larghezza-luminosità: stima K-NN della densità dei ${plural} nel punto x*`
      : 'Piano larghezza-luminosità: classificatore K-NN, voto dei K vicini di x*'
  const description =
    mode === 'densita'
      ? `${samples.length} ${plural} (le ${cls === 0 ? 'spigole' : 'salmoni'} sono attenuati). x* in larghezza ${x[0].toFixed(1)} cm, luminosità ${x[1].toFixed(2)}.` +
        (hidden ? ' Modalità previsione: le misure sono nascoste.' : ` Con K = ${k} la cella ha raggio ${f2(cell.rK)} e la stima vale ${f4(cell.p)}.`)
      : `${N} salmoni e ${N} spigole. x* in larghezza ${x[0].toFixed(1)} cm, luminosità ${x[1].toFixed(2)}.` +
        (vote !== null ? ` Fra i ${k} vicini ${vote.K1} salmoni e ${vote.K2} spigole: classe decisa ${CLASS_NAMES[vote.label]}${vote.tie ? ' per spareggio' : ''}.` : '')

  const onTransportKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (TRANSPORT_KEYS.has(e.key)) clearManual()
  }

  // --- comandi ---
  const controls = (
    <>
      <Segmented
        id={`${uid}-modo`}
        label="Che cosa fa il K-NN"
        options={[
          { value: 'densita', label: 'Stima la densità' },
          { value: 'classificatore', label: 'Classifica' },
        ]}
        value={mode}
        onChange={changeMode}
      />
      {mode === 'densita' ? (
        <Segmented
          id={`${uid}-classe`}
          label="Densità della classe"
          options={[
            { value: '0', label: 'Salmone' },
            { value: '1', label: 'Spigola' },
          ]}
          value={String(cls) as '0' | '1'}
          onChange={(v) => changeCls(v === '0' ? 0 : 1)}
        />
      ) : null}

      <div className="grid gap-2">
        <Slider id={`${uid}-k`} label="Vicini" latex="K" min={1} max={kMax} step={1} value={k} onChange={changeK} format={f0} />
        <div className="flex flex-wrap gap-2">
          <ActionButton onClick={() => changeK(sqrtK)} title="Legge di consistenza della slide 47: K cresce con N, ma più lentamente">
            K = √N ≈ {sqrtK}
          </ActionButton>
          <ActionButton onClick={() => changeK(1)}>K = 1</ActionButton>
        </div>
      </div>
      <Slider id={`${uid}-n`} label="Pesci per classe" latex="N" min={N_RANGE[0]} max={N_RANGE[1]} step={1} value={N} onChange={changeN} format={f0} />

      <div className="grid gap-1">
        <Toggle
          id={`${uid}-mappa`}
          label={mode === 'densita' ? 'Mappa della stima' : 'Regioni di decisione'}
          checked={mapOn}
          onChange={setMapOn}
          hint={mode === 'densita' ? 'La stima calcolata in ogni punto: bande di quota e isolinee.' : 'Il voto dei K vicini in ogni punto: il colore è la classe decisa.'}
        />
        <Toggle id={`${uid}-confronto`} label="Confronto K = 1 e K grande" checked={compare} onChange={setCompare} hint="Due piccole carte sotto il terreno: overfitting contro oversmoothing." />
        {mode === 'densita' ? (
          <>
            <Toggle id={`${uid}-scia`} label="Scia della stima" checked={trailOn} onChange={setTrailOn} hint="Dopo la stima, gli spilli delle posizioni lasciate disegnano il profilo di p̂." />
            <Toggle id={`${uid}-prevedi`} label="Prevedi prima di guardare" checked={predict} onChange={setPredict} hint="Allarga la tua cella fino a K pesci, poi controlla." />
          </>
        ) : null}
      </div>

      {predicting ? (
        <div className="grid gap-3 border border-border-strong bg-surface-2 p-3">
          <p className="m-0 text-[length:var(--step--1)]">
            Senza premere Play, allarga il cerchio color acqua finché contiene <strong>esattamente K = {k}</strong> {plural}. Giusto se il conteggio torna e la tua stima dista meno del{' '}
            {Math.round(PREDICTION_TOLERANCE * 100)}% da quella vera; servono {STREAK_TARGET} previsioni di fila in punti diversi.
          </p>
          <Slider id={`${uid}-rguess`} label="Il tuo raggio" latex="\hat r" min={0.05} max={4} step={0.01} value={rGuess} onChange={setRGuess} format={f2} />
          <Readout label="La tua stima" latex="K/(N\pi\hat r^2)" value={guessP} format={f4} />
          <ActionButton variant="primary" onClick={checkPrediction}>
            Controlla la previsione
          </ActionButton>
          <div role="status" className="grid gap-2">
            {prediction !== null && revealed ? <PredictionResult p={prediction} k={k} plural={plural} /> : null}
            <p className="m-0 label">
              Previsioni giuste di fila <span className="num tracking-normal">{streak.count}</span> di <span className="num tracking-normal">{STREAK_TARGET}</span>
            </p>
            {streak.count >= STREAK_TARGET ? <Verdict ok>Tre di fila: sai prevedere fin dove cresce la cella K-NN.</Verdict> : null}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {mode === 'densita' ? (
          <>
            <Readout label="Vicini" latex="K" value={k} format={f0} />
            <Readout label={plural} latex="N" value={samples.length} format={f0} />
            <Readout label="Raggio" latex="r_K" value={show(dv.r)} format={f2} />
            <Readout label="Volume" latex="V_K" value={show(dv.V)} format={f2} />
            <Readout label="Stima" latex="\hat p(\mathbf{x}^*)" value={show(dv.p)} format={f4} pinned />
          </>
        ) : vv !== null && vote !== null ? (
          <>
            <Readout label="Voti salmone" latex="K_1" value={show(vv.K1)} format={f0} />
            <Readout label="Voti spigola" latex="K_2" value={show(vv.K2)} format={f0} />
            <Readout label="Salmone" latex="\hat P(\omega_1|\mathbf{x}^*)" value={show(vv.P1)} format={f2} />
            <Readout label="Spigola" latex="\hat P(\omega_2|\mathbf{x}^*)" value={show(vv.P2)} format={f2} />
            <Readout label="Classe decisa" value={voted ? `${CLASS_NAMES[vote.label]}${vote.tie ? ' (spareggio)' : ''}` : '—'} pinned />
          </>
        ) : null}
        <div className="col-span-2">
          <Readout label="Posizione di x* (larghezza, luminosità)" value={where} />
        </div>
      </div>

      {vote !== null ? (
        <div className="grid gap-2">
          <VoteBars K1={vote.K1} K2={vote.K2} shown={voted} />
          {voted && vote.tie ? (
            <p className="m-0 flex items-start gap-2 border border-border bg-info-bg p-2.5 text-[length:var(--step--1)]">
              <svg {...ICON} className="shrink-0 text-info">
                <path d="M12 10v8M12 6v.5" />
              </svg>
              <span>
                Parità: <span className="num">K₁ = K₂</span>. Decide la classe del vicino più vicino; con due classi conviene K dispari.
              </span>
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  )

  // --- trasporto e legenda ---
  const transport = (
    <div className="grid gap-3">
      <div onClickCapture={clearManual} onKeyDownCapture={onTransportKey}>
        <PlayControls sb={sb} steps={steps} />
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <ActionButton onClick={stepNeighbor} title="Ferma la storia e accende il prossimo vicino">
          +1 vicino
        </ActionButton>
        <span className="text-[length:var(--step--1)] text-muted">l'espansione un campione alla volta</span>
      </div>
      <Legend mode={mode} cls={cls} predict={predicting} />
    </div>
  )

  // --- didascalia, formula viva, confronto ---
  const caption = (
    // grid-cols-1 = minmax(0, 1fr): una formula larga scorre nel suo riquadro invece di allargare la colonna
    <div className="grid grid-cols-1 gap-4">
      <StepCaption
        index={sb.index}
        total={steps.length}
        label={sb.step.label}
        text={mode === 'densita' ? densityCaption(sb.index, k, samples.length, cls) : classifierCaption(sb.index, k, N, voted && vote.tie)}
      />
      {/* katex.css sta fuori dai layer: per stringere lo spazio fra le formule serve l'importante */}
      <div className="grid grid-cols-1 gap-1 border-t border-border pt-3 [&_.katex-display]:my-2!">
        <span className="label">{mode === 'densita' ? 'Formula della stima K-NN · K-NN pdf estimate · slide 47' : 'Dal K-NN che stima al K-NN che classifica'}</span>
        {mode === 'densita' ? (
          <>
            <LiveFormula tex={TEX_DENSITY} values={dv} announce={false} />
          </>
        ) : vv !== null ? (
          <>
            <M tex={TEX_BAYES} display />
            <LiveFormula tex={TEX_POST_1} values={vv} announce={false} />
            <LiveFormula tex={TEX_POST_2} values={vv} announce={false} />
            <p className="m-0 text-[length:var(--step--1)] text-muted">
              <M tex="\omega_1" /> salmone (<em>salmon</em>), <M tex="\omega_2" /> spigola (<em>sea bass</em>), <M tex="N_1 = N_2" /> pesci per classe.
            </p>
          </>
        ) : null}
      </div>
      {comparison !== null ? (
        <div className="grid grid-cols-1 gap-3 border-t border-border pt-3">
          <span className="label">Confronto · stessa x*, stessi pesci, due K</span>
          <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2">
            <MiniMap
              title="K = 1"
              note={
                mode === 'densita' ? (
                  <>
                    Stima frastagliata (<em>jagged</em>): aghi sui singoli pesci, alta varianza, <em>overfitting</em>. Picco della scala ≈ {f4(comparison.small.peak)}.
                  </>
                ) : (
                  <>
                    Confine frastagliato con isole attorno ai singoli pesci: <em>overfitting</em>.
                  </>
                )
              }
              samples={mode === 'densita' ? mapSamples : mapTrain}
              x={x}
              field={comparison.small.field}
              peak={comparison.small.peak}
              classify={comparison.small.classify}
              ariaLabel="Carta del confronto con K uguale a 1"
            />
            <MiniMap
              title={`K = ${kBig}`}
              note={
                mode === 'densita' ? (
                  <>
                    Stima piatta (<em>flat</em>): la cella media su metà dei pesci, alto bias, <em>oversmoothing</em>. Picco della scala ≈ {f4(comparison.big.peak)}.
                  </>
                ) : (
                  <>
                    Confine liscio che perde i dettagli locali: <em>oversmoothing</em>.
                  </>
                )
              }
              samples={mode === 'densita' ? mapSamples : mapTrain}
              x={x}
              field={comparison.big.field}
              peak={comparison.big.peak}
              classify={comparison.big.classify}
              ariaLabel={`Carta del confronto con K uguale a ${kBig}`}
            />
          </div>
          {mode === 'densita' ? <p className="m-0 text-[length:var(--step--1)] text-muted">Ogni carta ha la sua scala di colore: conta la forma, non la tinta.</p> : null}
        </div>
      ) : null}
    </div>
  )

  // --- sfida ---
  const challenge = (
    <div className="grid gap-3">
      <Challenge
        prompt={String.raw`Due pesci misteriosi, **A** e **B**, aspettano sul nastro (modalità *Classifica*, $N = ${MYSTERY_N}$ pesci per classe). Trova un $K$ che li classifica bene **entrambi**, cioè come la regola di Bayes con le densità vere. Con $K$ troppo piccolo uno dei due cade nell'*overfitting*, con $K$ troppo grande l'altro nell'*oversmoothing*.`}
        hint={String.raw`Porta $\mathbf{x}^*$ su A e sali con $K$ da 1: guarda quando il voto smette di cambiare. Poi fai lo stesso su B. Il $K$ giusto sta fra le due soglie.`}
        status={check.status}
        onCheck={checkMystery}
      />
      <div className="flex flex-wrap gap-2">
        {MYSTERY.map((m) => (
          <ActionButton key={m.id} onClick={() => goToMystery(m.p)}>
            Porta x* sul pesce {m.id}
          </ActionButton>
        ))}
      </div>
      <div className="grid gap-2" aria-live="polite">
        {check.reason === 'modo' ? <Verdict ok={false}>I pesci misteriosi si classificano: passa alla modalità «Classifica».</Verdict> : null}
        {check.reason === 'n' ? (
          <Verdict ok={false}>
            La sfida vale con <span className="num">N = {MYSTERY_N}</span> pesci per classe: riporta N a {MYSTERY_N}.
          </Verdict>
        ) : null}
        {check.verdicts?.map((v) => (
          <Verdict key={v.id} ok={v.correct}>
            <strong>Pesce {v.id}</strong>: fra i <span className="num">{k}</span> vicini <span className="num">{v.K1}</span> salmoni e <span className="num">{v.K2}</span> spigole, quindi{' '}
            {CLASS_NAMES[v.label]}
            {v.tie ? ' (per spareggio)' : ''}. La regola di Bayes con le densità vere dice {CLASS_NAMES[v.truth]}.
          </Verdict>
        ))}
        {check.status === 'ok' && goodKs.length > 0 ? (
          <p className="m-0 text-[length:var(--step--1)] text-muted">
            Funziona ogni K da <span className="num">{goodKs[0]}</span> a <span className="num">{goodKs.at(-1)}</span>: sotto, A finisce fra i salmoni vicini (overfitting); sopra, la cella di B pesca nella nuvola delle spigole (oversmoothing).
          </p>
        ) : null}
      </div>
    </div>
  )

  return (
    <WidgetFrame meta={meta} controls={controls} transport={transport} caption={caption} challenge={challenge} onReset={reset} aspect={1.35}>
      <Terrain
        mode={mode}
        channel={channel}
        samples={samples}
        others={others}
        x={x}
        onMove={move}
        onPlace={place}
        cell={cell}
        vote={vote}
        expandMs={expansionMs(k)}
        manual={manual}
        reduced={reduced}
        playing={sb.playing}
        field={mode === 'densita' && showMap ? densityField : null}
        peak={peak}
        classify={classify}
        reveal={!mapOn}
        lastStep={lastStep}
        trail={mode === 'densita' && trailOn ? trail : null}
        guess={predicting ? rGuess : null}
        mystery={mode === 'classificatore'}
        ariaLabel={ariaLabel}
        description={description}
      />
    </WidgetFrame>
  )
}

function PredictionResult({ p, k, plural }: { p: Prediction; k: number; plural: string }) {
  const { verdict } = p
  const err = `${Math.round(verdict.relErr * 100)}%`
  if (verdict.ok) {
    return (
      <Verdict ok>
        La tua cella contiene esattamente <span className="num">{k}</span> {plural} e la tua stima (<span className="num">{f4(verdict.pGuess)}</span>) dista il <span className="num">{err}</span> da quella vera (
        <span className="num">{f4(verdict.p)}</span>).
        {p.counted === 'stessa' ? ` Giusta, ma nello stesso punto della precedente: sposta x* di almeno ${STREAK_MIN_MOVE} per farla contare.` : ''}
      </Verdict>
    )
  }
  return (
    <Verdict ok={false}>
      La tua cella contiene <span className="num">{verdict.inside}</span> {plural} (ne servono <span className="num">{k}</span>); la tua stima <span className="num">{f4(verdict.pGuess)}</span> contro{' '}
      <span className="num">{f4(verdict.p)}</span>, scarto <span className="num">{err}</span> (tolleranza {Math.round(PREDICTION_TOLERANCE * 100)}%). La serie riparte da zero.
    </Verdict>
  )
}
