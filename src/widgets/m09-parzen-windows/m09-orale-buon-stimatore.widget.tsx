// Widget m09-orale-buon-stimatore ("«Is Parzen a good estimator?»: costruisci la catena della risposta"),
// concetti c67, c44, c45, c47, c49. La risposta d'orale come catena di cinque anelli (slide p60-61): si sceglie
// una tessera, si completa la sua formula dalla tavolozza, la si aggancia all'anello giusto. Ogni anello ha la
// sua mini-simulazione sulla riflettanza NIR dei pixel di vegetazione (sana e in stress idrico): la valle riempita
// dalla media, la media che la recupera con h_N → 0, i ricampionamenti sotto il bound, il bound che si accorcia con
// N·h_N, la stima che converge. Poi tre domande trabocchetto (quale anello si spezza) e il verdetto da ripetere a voce.
//
// MOTO. Gli anelli sono passi dello storyboard: in quelli su N la corsa di N (20 → 20 000) segue il tempo dei
// fotogrammi del kit, con reduced motion il passo è subito alla fine. La tessera fuori posto torna nel mucchio con
// 8 px di rimbalzo (300 ms), quella giusta scatta al suo posto (150 ms), entrambe con @starting-style e quindi
// azzerate da reduced motion. I cronometri contano il tempo dei fotogrammi (mai setInterval).
import { useId, useMemo, useReducer, useState } from 'react'
import type { DragEvent } from 'react'
import { M } from '../../components/content/M'
import { ActionButton } from '../kit/ActionButton'
import { Challenge } from '../kit/Challenge'
import type { ChallengeStatus } from '../kit/Challenge'
import { fixed } from '../kit/format'
import { PlayControls } from '../kit/PlayControls'
import { Axis } from '../kit/plot/Axis'
import { Histogram } from '../kit/plot/Histogram'
import { LinePath } from '../kit/plot/LinePath'
import { classVar } from '../kit/plot/marks'
import { Plot } from '../kit/plot/Plot'
import { Readout } from '../kit/Readout'
import { Segmented } from '../kit/Segmented'
import { StepCaption } from '../kit/StepCaption'
import { useAnimationFrame } from '../kit/useAnimationFrame'
import { useStoryboard } from '../kit/useStoryboard'
import { WidgetFrame } from '../kit/WidgetFrame'
import { linspace } from '../../lib/ml/stats'
import type { WidgetMeta } from '../types'
import {
  CHALLENGE_MS,
  DOMAIN,
  ORDER,
  PALETTE,
  PIECES,
  SPEAK_MS,
  TILES,
  TRICKS,
  VALLEY,
  breaks,
  chainDone,
  chainReducer,
  initialChain,
  labelled,
  lawH,
  meanEstimate,
  resampled,
  tileTex,
  truth,
  varianceAt,
} from './orale'
import type { Quantity, TileId } from './orale'
import { useNarrow } from './proprieta/hooks'
import { Polyline, RefLine } from './proprieta/marks'
import { binCounts, intLogSteps, kdeFromBins } from './proprieta/teoria'
import { FormulaBox, Icon, Legend, LogSlider } from './proprieta/ui'
import { pow10Label } from './gara-di-consistenza'

export const meta: WidgetMeta = {
  id: 'm09-orale-buon-stimatore',
  moduleId: 'm09-parzen-windows',
  title: '«Is Parzen a good estimator?»: costruisci la catena della risposta',
  concepts: ['c67', 'c44', 'c45', 'c47', 'c49'],
  scenario: 'telerilevamento',
  scenarioNote: 'Riflettanza nel vicino infrarosso dei pixel di vegetazione (sana e in stress idrico), da 20 a 20 000 pixel etichettati',
  size: 'L',
}

const f0 = fixed(0)
const f3 = fixed(3)
const f4 = fixed(4)
const N_STEPS = intLogSteps(20, 20000)
const H_STEPS = [0.005, 0.006, 0.008, 0.01, 0.012, 0.015, 0.02, 0.025, 0.03, 0.04, 0.05, 0.06, 0.08, 0.1] as const
const X0 = 0.48
const RESAMPLES = 200
const RING_NAMES = ['media distorta', 'non distorta al limite', 'bound sulla varianza', 'varianza che si annulla', 'consistenza'] as const
const QTY: Record<Quantity, string> = { h: 'h_N non va a 0', nhn: 'N·h_Nⁿ non va a +∞' }

const STEPS = [
  { id: 'quadro', label: 'Il quadro: cinque tessere mescolate', durationMs: 1500 },
  { id: 'a1', label: 'Anello 1: la media è sfocata', durationMs: 2500 },
  { id: 'a2', label: 'Anello 2: h_N → 0 toglie il bias', durationMs: 4000 },
  { id: 'a3', label: 'Anello 3: la varianza sotto il bound', durationMs: 2500 },
  { id: 'a4', label: 'Anello 4: N·h_N → +∞ spegne la varianza', durationMs: 4000 },
  { id: 'a5', label: 'Anello 5: la stima converge', durationMs: 4000 },
  { id: 'verdetto', label: 'Il verdetto in due righe', durationMs: 2000 },
]
const RING_OF_STEP: Record<number, number | undefined> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 }
const SWEEP_RINGS = new Set([1, 3, 4])
const sweepN = (t: number) => Math.round(20 * 1000 ** Math.min(1, Math.max(0, t)))

function caption(index: number): string {
  switch (index) {
    case 0:
      return String.raw`La domanda di Melgani: la stima di Parzen di $p(x|\text{vegetazione})$ è una buona stima? La risposta è una **catena** di cinque anelli. Scegli una tessera dal mucchio, completa la sua formula con un pezzo della tavolozza, poi agganciala all'anello giusto. Ogni anello ha la sua mini-simulazione sul terreno.`
    case 1:
      return String.raw`Anello 1: la media della stima è la pdf vera **convoluta** con il kernel, $E\{\hat p(\mathbf x)\} = p(\mathbf x) * \frac{1}{h^n}\gamma(\mathbf x/h)$: una versione sfocata. La valle fra vegetazione sana e in stress è riempita, i picchi abbassati: a $h$ finito la stima è **distorta** (*biased*), e più dati con lo stesso $h$ non cambiano la media.`
    case 2:
      return String.raw`Anello 2: con $h_N \to 0$ il kernel riscalato tende alla delta di Dirac e la media recupera la valle: la stima è **asintoticamente non distorta** (*asymptotically unbiased*) nei punti in cui $p$ è continua. Qui $N$ corre da 20 a 20 000 con $h_N \propto 1/\sqrt N$.`
    case 3:
      return String.raw`Anello 3: ${RESAMPLES} campagne di etichettatura indipendenti, ${RESAMPLES} valori di $\hat p(x_0)$ in $x_0 = ${X0}$. La loro varianza sta sotto il bound $\sup(\gamma)\,\bar{\hat p}(x_0)/(N h_N^n)$, che vale per ogni $N$ finito.`
    case 4:
      return String.raw`Anello 4: lungo la legge $h_N \propto 1/\sqrt N$ il prodotto $N h_N = h_1\sqrt N$ cresce e il bound si accorcia fino a zero: con $N h_N^n \to +\infty$ la varianza si annulla.`
    case 5:
      return String.raw`Anello 5: le due condizioni insieme danno la **consistenza**: una sola stima, con sempre più pixel e $h_N$ che si restringe come nell'esempio $h_N = 1/\sqrt[2n]{N}$, si posa sulla densità vera.`
    default:
      return String.raw`Il verdetto: *asintoticamente sì*, non distorta e consistente se $h_N \to 0$ e $N h_N^n \to +\infty$; *a N finito dipende dalla scelta di h*. Il bias dipende solo da $h$, la varianza da $N h^n$: due rami che si ricongiungono. Ripetilo a voce guardando solo la catena: c'è un cronometro di due minuti.`
  }
}

const PROMPT = String.raw`Completa la catena **senza errori** (nessuna formula sbagliata, nessun anello sbagliato) in meno di tre minuti dalla prima mossa; poi rispondi alle tre domande trabocchetto indicando per ciascuna l'anello che si spezza e la quantità che non tende più dove dovrebbe. Premi Verifica.`
const HINT = String.raw`L'ordine segue la risposta d'orale: prima com'è la media (bias), poi che cosa succede con $h_N \to 0$, poi la varianza e il suo bound, poi quando si annulla, infine le due condizioni insieme. Nelle trabocchetto: $h$ fisso lascia il bias; $N h_N^n$ costante o che va a zero lascia la varianza.`

const mmss = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/** La striscia della catena sul terreno: cinque anelli, agganciati (pieni), vuoti (contorno), spezzati (crepa). */
function ChainStrip({ linked, broken, active, onOpen }: { linked: readonly boolean[]; broken: ReadonlySet<number>; active: number; onOpen: (i: number) => void }) {
  return (
    <ol aria-label="La catena della risposta: apri la mini-simulazione di un anello" className="m-0 flex list-none gap-1 p-0">
      {ORDER.map((id, i) => (
        <li key={id}>
          <button
            type="button"
            data-ring={i}
            aria-pressed={active === i}
            aria-label={`Anello ${i + 1}, ${RING_NAMES[i]}: ${linked[i] ? 'agganciato' : 'vuoto'}${broken.has(i) ? ', spezzato' : ''}`}
            onClick={() => onOpen(i)}
            className={`num relative grid size-10 cursor-pointer place-items-center border-2 text-[length:var(--step--1)] font-bold ${linked[i] ? 'border-border-strong bg-accent text-accent-contrast' : 'border-border-strong bg-surface text-text'} ${active === i ? 'outline-2 outline-offset-2 outline-pin' : ''} ${broken.has(i) ? 'rotate-6 transition-transform duration-500 ease-out' : ''}`}
          >
            {i + 1}
            {broken.has(i) ? (
              <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true" className="absolute -top-2 -right-2 text-warn">
                <path d="M4 3l7 8-4 3 8 8" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="square" />
              </svg>
            ) : null}
          </button>
        </li>
      ))}
    </ol>
  )
}

export default function M09OraleBuonStimatore() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [chain, dispatch] = useReducer(chainReducer, undefined, initialChain)
  const [ringUser, setRingUser] = useState(0)
  const [NUser, setNUser] = useState(200)
  const [h, setH] = useState(0.03)
  const [seed, setSeed] = useState(1)
  const [tricks, setTricks] = useState<{ ring: number; q: Quantity }[]>(() => TRICKS.map(() => ({ ring: 0, q: 'h' as Quantity })))
  const [answered, setAnswered] = useState<boolean[]>(() => TRICKS.map(() => false))
  const [takeoverAt, setTakeoverAt] = useState<number | null>(null)
  const [checked, setChecked] = useState<{ key: string; ok: boolean } | null>(null)
  const [terrainRef, narrow] = useNarrow(560)

  // cronometri: il tempo dei fotogrammi del kit
  const [chainClock, setChainClock] = useState({ start: null as number | null, end: null as number | null, shown: 0 })
  const [speak, setSpeak] = useState({ running: false, left: SPEAK_MS })
  const started = chain.last !== null
  const done = chainDone(chain)
  const chainRunning = started && !done && chainClock.end === null
  const needStamp = (started && chainClock.start === null) || (done && chainClock.start !== null && chainClock.end === null)
  useAnimationFrame(
    (dt, t) => {
      if (started && chainClock.start === null) setChainClock((c) => ({ ...c, start: t }))
      else if (done && chainClock.start !== null && chainClock.end === null) setChainClock((c) => ({ ...c, end: t, shown: t - (c.start ?? t) }))
      else if (chainRunning && chainClock.start !== null && Math.floor((t - chainClock.start) / 1000) !== Math.floor(chainClock.shown / 1000)) setChainClock((c) => ({ ...c, shown: t - (c.start ?? t) }))
      if (speak.running) setSpeak((s) => (s.left - dt <= 0 ? { running: false, left: 0 } : { ...s, left: s.left - dt }))
    },
    chainRunning || needStamp || speak.running,
  )

  const sb = useStoryboard(STEPS)
  const progress = sb.progress
  const stepRing = RING_OF_STEP[sb.index]
  const ring = stepRing !== undefined && takeoverAt !== sb.index ? stepRing : ringUser
  const sweeping = stepRing !== undefined && SWEEP_RINGS.has(stepRing) && takeoverAt !== sb.index
  const N = sweeping ? sweepN(progress) : NUser
  const openRing = (i: number) => {
    if (stepRing !== undefined && takeoverAt !== sb.index) {
      sb.pause()
      setTakeoverAt(sb.index)
    }
    setRingUser(i)
  }
  const onN = (v: number) => {
    if (sweeping) {
      sb.pause()
      setTakeoverAt(sb.index)
      setRingUser(ring)
    }
    setNUser(v)
  }
  const lawRing = ring === 1 || ring === 3 || ring === 4
  const hEff = lawRing ? lawH(h, N) : h

  // --- mini-simulazioni ---
  const xs = useMemo(() => linspace(DOMAIN[0], DOMAIN[1], 241), [])
  const truthPts = useMemo(() => xs.map((x) => [x, truth(x)]), [xs])
  const meanPts = xs.map((x) => [x, meanEstimate(x, hEff)])
  const pixels = labelled()
  const bundle = useMemo(() => {
    if (ring !== 0) return []
    return Array.from({ length: 8 }, (_, b) => {
      const s = pixels.slice(b * 200, b * 200 + Math.min(N, 2000))
      return kdeFromBins(binCounts(s, DOMAIN, 1200), s.length, DOMAIN, xs, hEff)
    })
  }, [ring, pixels, N, xs, hEff])
  const single = useMemo(() => (ring === 4 ? kdeFromBins(binCounts(pixels.slice(0, N), DOMAIN, 3000), N, DOMAIN, xs, hEff) : []), [ring, pixels, N, xs, hEff])
  const nRes = Math.min(N, 2000)
  const res = useMemo(() => (ring === 2 ? resampled(X0, hEff, nRes, RESAMPLES, seed) : []), [ring, hEff, nRes, seed])
  const st = varianceAt(X0, hEff, ring === 2 ? nRes : N)
  const empVar = res.length > 0 ? res.reduce((a, v) => a + (v - st.mean) ** 2, 0) / res.length : Number.NaN
  const boundCurve = useMemo(
    () =>
      ring === 3
        ? N_STEPS.map((n) => {
            const s = varianceAt(X0, lawH(h, n), n)
            return { n, bound: s.bound, variance: s.variance }
          })
        : [],
    [ring, h],
  )

  const linked = chain.slots.map((s, i) => s === ORDER[i])
  const broken = new Set(tricks.map((t, i) => (answered[i] ? t.ring : -1)).filter((i) => i >= 0))
  const lastMsg: Record<string, string> = {
    placed: 'Scatto: la tessera è agganciata al suo anello.',
    wrongSlot: 'Anello sbagliato: la tessera torna nel mucchio (un errore).',
    incomplete: 'Prima completa la formula della tessera con un pezzo della tavolozza.',
    pieceOk: 'Formula completa: ora scegli l’anello.',
    pieceWrong: 'Quel pezzo non completa la formula (un errore).',
    select: 'Tessera scelta: completa la formula, poi scegli l’anello.',
  }

  const values = { N, h: hEff, Nh: N * hEff, mean: st.mean, bound: st.bound, varTrue: st.variance, varEmp: empVar, sup: st.sup, pv: truth(VALLEY), mv: meanEstimate(VALLEY, hEff) }

  const trickOk = TRICKS.every((t, i) => {
    const b = breaks(t)
    return tricks[i].ring === b.ring && tricks[i].q === b.quantity
  })
  const elapsed = chainClock.end !== null && chainClock.start !== null ? chainClock.end - chainClock.start : chainClock.shown
  const checkKey = `${JSON.stringify(tricks)}|${chain.errors}|${done}|${chainClock.end}`
  const checkedValid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = checkedValid === null ? 'idle' : checkedValid.ok ? 'ok' : 'ko'
  const check = () => setChecked({ key: checkKey, ok: done && chain.errors === 0 && elapsed < CHALLENGE_MS && trickOk })

  const reset = () => {
    sb.reset()
    dispatch({ type: 'reset' })
    setRingUser(0)
    setNUser(200)
    setH(0.03)
    setSeed(1)
    setTricks(TRICKS.map(() => ({ ring: 0, q: 'h' as Quantity })))
    setAnswered(TRICKS.map(() => false))
    setTakeoverAt(null)
    setChecked(null)
    setChainClock({ start: null, end: null, shown: 0 })
    setSpeak({ running: false, left: SPEAK_MS })
  }

  // --- il terreno ---
  const yMax = 6
  const logs = boundCurve.flatMap((b) => [Math.log10(b.bound), Math.log10(b.variance)])
  const yLog: [number, number] = logs.length > 0 ? [Math.floor(Math.min(...logs) - 0.2), Math.ceil(Math.max(...logs) + 0.2)] : [-4, 1]
  const sim =
    ring === 2 ? (
      <Plot
        width={640}
        height={300}
        fill
        xDomain={[Math.max(0, st.mean - 4 * Math.sqrt(st.bound)), st.mean + 4 * Math.sqrt(st.bound)]}
        yDomain={[0, 60]}
        margin={{ top: 56, right: 12, bottom: 38, left: 44 }}
        ariaLabel={`Istogramma di ${RESAMPLES} valori della stima in x0 = ${X0}`}
        description={`Varianza misurata ${empVar.toExponential(2)}, bound ${st.bound.toExponential(2)}.`}
      >
        <Histogram values={res} bins={20} cls={3} />
        <RefLine x={st.mean} label="media della stima" color="var(--viz-boundary)" labelY={12} />
        <Axis side="bottom" ticks={4} format={(v) => v.toFixed(2)} label="valori" symbol="p̂(x₀)" />
        <Axis side="left" ticks={[0, 20, 40, 60]} symbol="campagne" />
      </Plot>
    ) : ring === 3 ? (
      <Plot
        width={640}
        height={300}
        fill
        xDomain={[Math.log10(20), Math.log10(20000)]}
        yDomain={yLog}
        margin={{ top: 56, right: 12, bottom: 38, left: 44 }}
        ariaLabel="Bound e varianza vera in funzione di N lungo la legge h_N proporzionale a 1 su radice di N"
        description={`N = ${N}, N h_N = ${(N * hEff).toFixed(2)}, bound ${st.bound.toExponential(2)}.`}
      >
        <LinePath data={boundCurve.map((b) => [Math.log10(b.n), Math.log10(b.bound)])} role="boundary" width={2.5} />
        <LinePath data={boundCurve.map((b) => [Math.log10(b.n), Math.log10(b.variance)])} role="kernel" width={2} />
        <RefLine x={Math.log10(N)} label={`N = ${N}`} color="var(--viz-boundary)" width={1} labelY={12} anchor={N > 3000 ? 'end' : 'start'} />
        <Axis side="bottom" ticks={[2, 3, 4]} format={pow10Label} symbol="N" />
        <Axis side="left" ticks={Array.from({ length: yLog[1] - yLog[0] + 1 }, (_, i) => yLog[0] + i)} format={pow10Label} symbol="bound, varianza" />
      </Plot>
    ) : (
      <Plot
        width={640}
        height={300}
        fill
        xDomain={DOMAIN}
        yDomain={[0, yMax]}
        margin={{ top: 56, right: 12, bottom: 38, left: 44 }}
        ariaLabel="Densità vera della riflettanza NIR e stime di Parzen"
        description={`h = ${hEff.toFixed(4)}, N = ${N}. Nella valle p = ${truth(VALLEY).toFixed(2)}, media della stima ${meanEstimate(VALLEY, hEff).toFixed(2)}.`}
      >
        {ring === 0 ? bundle.map((b, i) => <Polyline key={i} pts={xs.map((x, j) => [x, b[j]] as const)} color="var(--text-faint)" width={1} opacity={0.5} />) : null}
        <LinePath data={truthPts} role="truth" width={2} />
        {ring === 4 ? <LinePath data={xs.map((x, i) => [x, single[i]])} role="estimate" width={2.5} /> : <LinePath data={meanPts} cls={1} width={2.5} />}
        <RefLine x={VALLEY} label="valle" color="var(--viz-boundary)" width={1} labelY={12} />
        <Axis side="bottom" ticks={[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]} label="riflettanza NIR" symbol="x" />
        <Axis side="left" ticks={[0, 2, 4, 6]} symbol="p(x)" />
      </Plot>
    )

  const terrain = (
    <div ref={terrainRef} className="absolute inset-0">
      {sim}
      <div className="absolute top-2 left-2 flex flex-wrap items-center gap-3">
        <ChainStrip linked={linked} broken={broken} active={ring} onOpen={openRing} />
        {!narrow ? <span className="label bg-surface px-1">Anello {ring + 1} · {RING_NAMES[ring]}</span> : null}
      </div>
      {ring === 2 ? (
        <div className="absolute right-3 bottom-12 grid w-[min(15rem,45%)] gap-1 border border-border-strong bg-surface p-2 text-[length:var(--step--1)] shadow-1">
          {[
            ['varianza misurata', empVar, 'var(--viz-kernel)'],
            ['bound', st.bound, 'var(--viz-boundary)'],
          ].map(([label, v, color]) => (
            <div key={String(label)} className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-2">
              <span className="label">{label}</span>
              <span className="relative block h-3 border border-border bg-surface-2">
                <span className="absolute inset-y-0 left-0 origin-left" style={{ width: '100%', transform: `scaleX(${Math.min(1, Number(v) / (st.bound * 1.05))})`, background: String(color) }} />
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )

  // --- la catena, sotto il terreno ---
  const onDragStart = (id: TileId) => (e: DragEvent<HTMLButtonElement>) => {
    e.dataTransfer.setData('text/plain', id)
    dispatch({ type: 'select', tile: id })
  }
  const chainBuilder = (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <span className="label">Mucchio · tessere mescolate</span>
        <div className="flex flex-wrap gap-2">
          {chain.pool.map((id) => (
            <button
              key={`${id}-${chain.last?.kind === 'wrongSlot' && chain.last.tile === id ? chain.last.seq : 0}`}
              type="button"
              draggable
              onDragStart={onDragStart(id)}
              aria-pressed={chain.selected === id}
              onClick={() => dispatch({ type: 'select', tile: id })}
              className={`max-w-[22rem] min-h-10 cursor-grab border-2 px-2 py-1.5 text-left text-[length:var(--step--1)] transition-[translate] duration-300 ease-out starting:-translate-y-2 ${chain.selected === id ? 'border-border-strong bg-pin text-pin-contrast' : 'border-border bg-surface text-text hover:bg-surface-2'}`}
            >
              {TILES[id].text}
              {chain.complete[id] ? <span className="label ml-2">· formula completa</span> : null}
            </button>
          ))}
          {chain.pool.length === 0 ? <span className="text-muted">Mucchio vuoto.</span> : null}
        </div>
      </div>
      {chain.selected !== null ? (
        <div className="grid gap-2 border border-border-strong p-2">
          <span className="label">Banco · completa la formula della tessera scelta</span>
          <M tex={tileTex(chain.selected, chain.complete[chain.selected] === true)} display />
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Tavolozza dei pezzi mancanti">
            {PALETTE.map((p) => (
              <button key={p} type="button" onClick={() => dispatch({ type: 'piece', piece: p })} className="min-h-10 min-w-10 cursor-pointer border border-border-strong bg-surface px-2 hover:bg-surface-2" aria-label={`Pezzo: ${PIECES[p].label}`}>
                <span aria-hidden="true">
                  <M tex={PIECES[p].tex} />
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <ol className="m-0 grid list-none gap-1.5 p-0" aria-label="Gli anelli della catena">
        {ORDER.map((id, i) => {
          const placed = chain.slots[i]
          return (
            <li key={id}>
              <button
                type="button"
                data-slot={i}
                onClick={() => dispatch({ type: 'place', slot: i })}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  dispatch({ type: 'place', slot: i })
                }}
                disabled={placed !== null}
                aria-label={placed !== null ? `Anello ${i + 1}: ${TILES[placed].text}` : `Anello ${i + 1}, vuoto: metti qui la tessera scelta`}
                className="grid min-h-10 w-full cursor-pointer grid-cols-[2rem_minmax(0,1fr)] items-center gap-2 border-2 border-dashed border-border-strong bg-surface px-2 py-1 text-left disabled:cursor-default disabled:border-solid"
              >
                <span className="num font-bold">{i + 1}</span>
                {placed !== null ? (
                  <span className="grid gap-0.5 transition-[scale,opacity] duration-150 ease-out starting:scale-95 starting:opacity-0">
                    <span className="text-[length:var(--step--1)]">{TILES[placed].text}</span>
                    <M tex={tileTex(placed, true)} />
                  </span>
                ) : (
                  <span className="text-muted text-[length:var(--step--1)]">vuoto</span>
                )}
              </button>
            </li>
          )
        })}
      </ol>
      <p className="m-0 min-h-6 text-[length:var(--step--1)]" role="status">
        {chain.last !== null ? lastMsg[chain.last.kind] : 'Scegli una tessera (clic o trascinamento), completa la formula, poi scegli l’anello.'}{' '}
        <span className="num text-muted">
          · errori {chain.errors} · tempo {mmss(elapsed)}
        </span>
      </p>
      {done ? (
        <div className="grid gap-2 border-2 border-border-strong p-3">
          <p className="label m-0 flex items-center gap-2">
            <span aria-hidden="true" className="size-3 border border-border-strong bg-pin" />
            Il verdetto
          </p>
          <p className="m-0">
            <strong>Asintoticamente sì:</strong> non distorta e consistente se <M tex="h_N\to 0" /> e <M tex="N h_N^n\to+\infty" />. <strong>A N finito</strong> dipende dalla scelta di <M tex="h" />.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <ActionButton variant="primary" onClick={() => setSpeak((s) => ({ running: !s.running, left: s.left <= 0 ? SPEAK_MS : s.left }))}>
              <Icon d={speak.running ? 'M7 5h4v14H7zM13 5h4v14h-4z' : 'M7 4v16l13-8z'} />
              {speak.running ? 'Pausa' : 'Ripeti a voce: 2 minuti'}
            </ActionButton>
            <ActionButton onClick={() => setSpeak({ running: false, left: SPEAK_MS })}>Azzera</ActionButton>
            <span data-speak="" className="num text-[length:var(--step-1)]" aria-live="off">
              {mmss(speak.left)}
            </span>
          </div>
        </div>
      ) : null}
      <div className="grid gap-3 border-t border-border pt-3">
        <span className="label">Domande trabocchetto</span>
        {TRICKS.map((t, i) => (
          <div key={t.id} className="grid gap-1.5">
            <p className="m-0 font-semibold">{t.question}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Segmented
                id={`${uid}-tr${i}`}
                label="Si spezza l'anello"
                options={ORDER.map((_, r) => ({ value: String(r), label: String(r + 1) }))}
                value={String(tricks[i].ring)}
                onChange={(v) => {
                  setTricks((ts) => ts.map((x, j) => (j === i ? { ...x, ring: Number(v) } : x)))
                  setAnswered((as) => as.map((x, j) => (j === i ? true : x)))
                }}
              />
              <Segmented
                id={`${uid}-tq${i}`}
                label="Perché"
                options={(Object.keys(QTY) as Quantity[]).map((q) => ({ value: q, label: QTY[q] }))}
                value={tricks[i].q}
                onChange={(v) => setTricks((ts) => ts.map((x, j) => (j === i ? { ...x, q: v } : x)))}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const controls = (
    <>
      <Segmented id={`${uid}-ring`} label="Mini-simulazione dell'anello" options={ORDER.map((_, i) => ({ value: String(i), label: String(i + 1) }))} value={String(ring)} onChange={(v) => openRing(Number(v))} />
      <LogSlider id={`${uid}-N`} label="Pixel etichettati" latex="N" values={N_STEPS} value={N} onChange={onN} format={(v) => f0(v)} />
      <LogSlider id={`${uid}-h`} label={lawRing ? 'Larghezza a N = 20 (poi ∝ 1/√N)' : 'Larghezza della finestra'} latex={lawRing ? 'h_{20}' : 'h'} values={H_STEPS} value={h} onChange={setH} format={f3} />
      {ring === 2 ? (
        <ActionButton onClick={() => setSeed((s) => s + 1)}>
          <Icon d="M5 12a7 7 0 1 0 2-4.9M5 4v4h4" />
          Altre {RESAMPLES} campagne
        </ActionButton>
      ) : null}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="Larghezza usata" latex="h_N" value={hEff} format={f4} />
        <Readout label="Campioni efficaci" latex="N h_N" value={N * hEff} format={(v) => v.toFixed(2)} />
        <Readout label="Verità nella valle" latex="p(0.39)" value={truth(VALLEY)} format={(v) => v.toFixed(2)} />
        <Readout label="Media nella valle" latex="E\{\hat p(0.39)\}" value={meanEstimate(VALLEY, hEff)} format={(v) => v.toFixed(2)} pinned={ring <= 1} />
        <Readout label="Bound in x₀" value={st.bound.toExponential(2)} pinned={ring >= 2} />
        <Readout label="Varianza vera in x₀" value={st.variance.toExponential(2)} />
      </div>
      <Legend
        items={[
          { kind: 'dash', color: 'var(--viz-truth)', label: 'densità vera' },
          { kind: 'thick', color: classVar(1), label: 'media della stima' },
          { kind: 'line', color: 'var(--text-faint)', label: 'stime singole (anello 1)' },
          { kind: 'thick', color: 'var(--viz-estimate)', label: 'una stima (anello 5)' },
          { kind: 'line', color: 'var(--viz-boundary)', label: 'bound (anelli 3-4)' },
        ]}
      />
    </>
  )

  const captionBlock = (
    <div className="grid gap-4">
      <StepCaption index={sb.index} total={STEPS.length} label={sb.step.label} text={caption(sb.index)} />
      <div className="grid gap-4 border-t border-border pt-3">
        <FormulaBox
          label="Nella simulazione, con i numeri"
          tex={String.raw`\begin{aligned}E\{\hat p(0.39)\}&=\val{mv}\quad\text{contro}\quad p(0.39)=\val{pv}\\ E\{(\hat p(x_0)-\bar{\hat p}(x_0))^2\}=\val[6]{varTrue}&\le\frac{\val[3]{sup}\cdot\val[3]{mean}}{\val[0]{N}\cdot\val[4]{h}}=\val[6]{bound}\end{aligned}`}
          values={values}
          announce
        />
        {chainBuilder}
      </div>
    </div>
  )

  const challenge = (
    <div className="grid gap-4">
      <Challenge prompt={PROMPT} hint={HINT} status={status} onCheck={check} />
      {checkedValid !== null ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          <Readout label="Catena completa" value={done ? 'sì' : 'no'} />
          <Readout label="Errori" value={chain.errors} format={f0} pinned />
          <Readout label="Tempo" value={mmss(elapsed)} />
          <Readout label="Trabocchetto" value={trickOk ? 'tutte giuste' : 'da rivedere'} />
        </div>
      ) : null}
    </div>
  )

  return (
    <WidgetFrame meta={meta} aspect={narrow ? 1.05 : 2.1} onReset={reset} transport={<PlayControls sb={sb} steps={STEPS} />} caption={captionBlock} controls={controls} challenge={challenge}>
      {terrain}
    </WidgetFrame>
  )
}
