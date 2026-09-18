// Widget m09-dilemma-della-regione ("Il dilemma della regione R: grande per contare, piccola per non mediare"),
// concetto c70. Slide p43-44: p̂(x*) = K/(N V) nasce da P_R ≈ p(x*)·V e da P̂_R = K/N; R deve essere abbastanza
// grande perché K/N sia una frequenza affidabile e abbastanza piccola perché p non vari al suo interno. In Parzen
// R = [x* − h/2, x* + h/2]: scegliere h è scegliere R. Due spie (legge dei grandi numeri, p quasi costante),
// 100 portafogli ricampionati con l'istogramma di K/(N h) accanto alla densità, strisce degli h "verdi".
//
// MOTO. Le estrazioni (50 ms l'una), gli h estremi e la corsa di N sono passi dello storyboard: Play, Pausa, Passo,
// Velocità e Reset li governano, con reduced motion ogni passo è subito il suo stato finale. Un passo che impone h
// o N si ferma se l'utente li tocca. Trascinamento di x*, slider e selettori: nessuna animazione.
import { useId, useMemo, useState } from 'react'
import { M } from '../../components/content/M'
import { linspace } from '../../lib/ml/stats'
import { ActionButton } from '../kit/ActionButton'
import { Challenge } from '../kit/Challenge'
import type { ChallengeStatus } from '../kit/Challenge'
import { fixed } from '../kit/format'
import { NumberField } from '../kit/NumberField'
import { PlayControls } from '../kit/PlayControls'
import { Axis } from '../kit/plot/Axis'
import { Dots } from '../kit/plot/Dots'
import { Grid } from '../kit/plot/Grid'
import { LinePath } from '../kit/plot/LinePath'
import { Plot, usePlot } from '../kit/plot/Plot'
import { Readout } from '../kit/Readout'
import { Slider } from '../kit/Slider'
import { StepCaption } from '../kit/StepCaption'
import { useStoryboard } from '../kit/useStoryboard'
import { WidgetFrame } from '../kit/WidgetFrame'
import { formatH } from '../engines/density1d'
import type { WidgetMeta } from '../types'
import {
  CHALLENGE_X,
  DOMAIN,
  DRAWS,
  DRAW_MS,
  H1_RANGE,
  H_STEPS,
  INITIAL,
  N_STEPS,
  SPEC_X,
  X_RANGE,
  bandRange,
  countIn,
  drawEstimates,
  flatLevel,
  greenBands,
  judge,
  lawH,
  llnLevel,
  regionStats,
  sweepN,
  trainingSet,
  truth,
} from './dilemma-della-regione'
import { useNarrow } from './proprieta/hooks'
import { RefLine } from './proprieta/marks'
import { FormulaBox, Icon, Legend, LogSlider, OverlayCard, Spia, StaticFormula } from './proprieta/ui'

export const meta: WidgetMeta = {
  id: 'm09-dilemma-della-regione',
  moduleId: 'm09-parzen-windows',
  title: 'Il dilemma della regione R: grande per contare, piccola per non mediare',
  concepts: ['c70'],
  scenario: 'banca',
  scenarioNote: 'Redditi mensili (k€) dei clienti solvibili: la densità in x* stimata contando le pratiche nella regione R',
  size: 'M',
}

const f0 = fixed(0)
const f1 = fixed(1)
const f2 = fixed(2)
const f3 = fixed(3)
const f4 = fixed(4)
const pct = (v: number) => `${Math.round(v * 100)}%`
const Y_MAX = 1
const BELT = 0.14
const HIST_BINS = 25
const RUG_MAX = 2000

const STEPS = [
  { id: 'quadro', label: 'Il quadro: la regione R attorno a x*', durationMs: 1500 },
  { id: 'estrazioni', label: 'Cento portafogli: bias e varianza', durationMs: DRAWS * DRAW_MS },
  { id: 'grande', label: 'R grande: si conta bene, ma si media', durationMs: 1800 },
  { id: 'piccola', label: 'R piccola: p costante, ma pochi campioni', durationMs: 1800 },
  { id: 'strisce', label: 'Dove sono verdi le due spie', durationMs: 1800 },
  { id: 'cresce', label: 'N cresce con h_N = h₁/√N', durationMs: 6000 },
  { id: 'ponte', label: 'Dalla slide p44 alla slide p61', durationMs: 2000 },
]
const IMPOSED_H: Record<number, number | undefined> = { 2: 1.5, 3: 0.05 }
const IMPOSED_N: Record<number, number | undefined> = { 4: 5000 }
const SWEEP = 5

function caption(index: number, N: number, x: number, h: number): string {
  switch (index) {
    case 0:
      return String.raw`Redditi dei clienti solvibili (k€): la densità vera (tratteggiata), $N = ${N}$ pratiche come tacche sul nastro, il punto $x^* = ${f1(x)}$ e la regione $R = [x^* - h/2,\ x^* + h/2]$ di volume $V = h = ${formatH(h)}$ (banda ocra). La stima conta i campioni in $R$: $\hat p(x^*) = K/(NV)$. Le due spie sono le due osservazioni della slide p44 (*R enough large, enough small*).`
    case 1:
      return String.raw`${DRAWS} portafogli indipendenti, ${DRAW_MS} ms l'uno: ogni volta si conta $K$ e il valore $K/(N h)$ cade nell'istogramma a destra, sulla stessa scala della densità. Tre linee: $p(x^*)$ vera (tratteggiata), $P_R/V$ cioè la media di $p$ dentro $R$ (ocra), la media delle stime (rossa). La rossa si posa sull'ocra, non sulla tratteggiata: lo scarto fra ocra e tratteggiata è il **bias**, la larghezza dell'istogramma la **varianza**.`
    case 2:
      return String.raw`$R$ grande ($h = 1.5$): $K$ cresce e l'istogramma si stringe, la prima spia va verso il verde. Ma dentro $R$ la densità varia molto (il tratto ocra della curva): la seconda spia è rossa e $K/(NV)$ restituisce una media locale di $p$, la versione sfocata (*oversmoothing*).`
    case 3:
      return String.raw`$R$ piccola ($h = 0.05$): $p$ è quasi costante in $R$ e la linea ocra torna sulla tratteggiata, ma $K$ scende a poche unità: l'istogramma si allarga e compaiono estrazioni con $K = 0$, cioè $\hat p = 0$. La frequenza $K/N$ non è più affidabile: prima spia rossa.`
    case 4:
      return String.raw`Le strisce sotto lo slider di $h$ mostrano dove ciascuna spia è verde e la loro intersezione. Qui $N = 5000$: l'intersezione si apre, all'incirca fra $h = 0.02$ (K atteso 30) e $h = 0.06$ (escursione di $p$ al 10%). Con $N = 50$ è vuota: con pochi dati le due richieste non si conciliano.`
    case 5:
      return String.raw`$N$ cresce da 50 a 20 000 con $h_N = h_1/\sqrt N$: $R$ si restringe mentre il K atteso, circa $\sqrt N\,h_1\,p(x^*)$, cresce. Le due spie diventano verdi e ci restano: è ciò che chiedono le condizioni di consistenza.`
    default:
      return String.raw`Le due osservazioni della slide p44 sono la versione a campione finito delle due condizioni della slide p61: *enough large* ↔ $N h_N^n \to +\infty$, *enough small* ↔ $h_N \to 0$ (collegamento ricostruito: le slide non lo scrivono).`
  }
}

const PROMPT = String.raw`Prima parte: porta $x^*$ sul **picco** dei redditi ($x^* = 1.8$ k€) e, con $N = 50$, trova l'$h$ che rende minimo l'errore quadratico medio di $K/(N h)$ (lettura MSE): quale spia resta rossa? Seconda parte, nel punto della specifica $x^* = 2.4$ ($p = 0.313$): quante pratiche servono perché con $h = 0.2$ il K atteso sia almeno 30? Scrivi $N$ e premi Verifica.`
const HINT = String.raw`MSE = bias² + varianza, con varianza $P_R(1-P_R)/(N h^2)$: parti da $h$ piccolo e allarga finché l'MSE scende. Per la seconda parte: K atteso $\approx N\,p(x^*)\,h$, quindi $N \ge 30/(0.313 \cdot 0.2)$.`

const LEVEL_WORD = { ok: 'verde', warn: 'gialla', ko: 'rossa' } as const

/** La regione R: velatura ocra su tutta l'altezza, bordi a inchiostro. */
function RegionBand({ x0, h }: { x0: number; h: number }) {
  const { x, innerHeight, clipPath } = usePlot()
  const a = x(x0 - h / 2)
  const b = x(x0 + h / 2)
  return (
    <g data-region="" clipPath={clipPath} pointerEvents="none">
      <rect x={a} y={0} width={Math.max(1, b - a)} height={innerHeight} fill="var(--viz-highlight)" fillOpacity={0.2} />
      <line x1={a} x2={a} y1={0} y2={innerHeight} stroke="var(--pin-contrast)" strokeOpacity={0.5} />
      <line x1={b} x2={b} y1={0} y2={innerHeight} stroke="var(--pin-contrast)" strokeOpacity={0.5} />
    </g>
  )
}

/** Il nastro con le tacche del training set (al più RUG_MAX, in un solo tracciato). */
function Rug({ samples, bottom }: { samples: readonly number[]; bottom: number }) {
  const { x, y } = usePlot()
  const y0 = y(0)
  const y1 = y(bottom)
  let d = ''
  for (let i = 0; i < Math.min(samples.length, RUG_MAX); i++) d += `M${x(samples[i]).toFixed(1)},${(y0 + 3).toFixed(1)}V${(y1 - 3).toFixed(1)}`
  return (
    <g data-rug="" pointerEvents="none">
      <rect x={0} y={y0} width={x.range()[1]} height={y1 - y0} fill="var(--surface-2)" />
      <path d={d} stroke="var(--viz-sample)" strokeWidth={1} strokeOpacity={samples.length > 300 ? 0.35 : 0.9} />
    </g>
  )
}

/** Istogramma orizzontale delle stime K/(N h), sulla stessa scala verticale della densità. */
function SideHistogram({ values, count }: { values: readonly number[]; count: number }) {
  const { x, y, clipPath } = usePlot()
  const w = Y_MAX / HIST_BINS
  const counts = new Array<number>(HIST_BINS).fill(0)
  let over = 0
  for (let i = 0; i < Math.min(count, values.length); i++) {
    const b = Math.floor(values[i] / w)
    if (b >= HIST_BINS) over++
    else counts[Math.max(0, b)]++
  }
  return (
    <g data-side-hist="" pointerEvents="none">
      <g clipPath={clipPath}>
        {counts.map((c, b) =>
          c > 0 ? <rect key={b} data-hbin={b} x={x(0)} y={y((b + 1) * w) + 1} width={Math.max(1, x(c) - x(0))} height={Math.max(1, y(b * w) - y((b + 1) * w) - 2)} fill="var(--viz-kernel)" fillOpacity={0.6} /> : null,
        )}
      </g>
      {over > 0 ? (
        <text x={4} y={-6} className="num" fontSize={10} fill="var(--text)">
          +{over} oltre {Y_MAX}
        </text>
      ) : null}
    </g>
  )
}

/** Strisce degli h in cui ciascuna spia è verde, e la loro intersezione; lo spillo è l'h corrente. */
function GreenStrips({ bands, h }: { bands: readonly { h: number; lln: boolean; flat: boolean }[]; h: number }) {
  const W = 300
  const L = Math.log10(H_STEPS[0])
  const R = Math.log10(H_STEPS[H_STEPS.length - 1])
  const X = (v: number) => 70 + ((Math.log10(v) - L) / (R - L)) * (W - 78)
  const cell = (i: number) => {
    const a = i === 0 ? X(bands[0].h) : (X(bands[i - 1].h) + X(bands[i].h)) / 2
    const b = i === bands.length - 1 ? X(bands[i].h) : (X(bands[i].h) + X(bands[i + 1].h)) / 2
    return [a, Math.max(1, b - a)] as const
  }
  const rows: { label: string; pick: (b: { lln: boolean; flat: boolean }) => boolean; fill: string }[] = [
    { label: 'grandi numeri', pick: (b) => b.lln, fill: 'var(--ok)' },
    { label: 'p costante', pick: (b) => b.flat, fill: 'var(--ok)' },
    { label: 'entrambe', pick: (b) => b.lln && b.flat, fill: 'var(--pin)' },
  ]
  const both = bandRange(bands, (b) => b.lln && b.flat)
  return (
    <figure className="m-0 grid gap-1">
      <svg
        viewBox={`0 0 ${W} 78`}
        className="block h-auto w-full"
        role="img"
        aria-label={both === null ? 'Nessun h rende verdi entrambe le spie' : `Entrambe le spie verdi per h fra ${formatH(both[0])} e ${formatH(both[1])}`}
      >
        {rows.map((r, j) => (
          <g key={r.label}>
            <text x={66} y={12 + j * 16} textAnchor="end" className="label" fontSize={9} fill="var(--text-muted)">
              {r.label}
            </text>
            <rect x={X(bands[0].h)} y={4 + j * 16} width={X(bands[bands.length - 1].h) - X(bands[0].h)} height={11} fill="var(--surface-2)" />
            {bands.map((b, i) => {
              if (!r.pick(b)) return null
              const [a, w] = cell(i)
              return <rect key={i} x={a} y={4 + j * 16} width={w} height={11} fill={r.fill} fillOpacity={j === 2 ? 1 : 0.75} />
            })}
          </g>
        ))}
        {[0.02, 0.1, 0.5, 3].map((t) => (
          <text key={t} x={X(t)} y={70} textAnchor="middle" className="num" fontSize={10} fill="var(--text-muted)">
            {t}
          </text>
        ))}
        <path d={`M${X(h)},52l-5,7h10z`} fill="var(--pin)" stroke="var(--pin-contrast)" strokeWidth={1.2} />
      </svg>
      <figcaption className="text-[length:var(--step--1)] text-muted">
        {both === null ? 'Intersezione vuota: nessun h soddisfa le due richieste.' : `Intersezione: h da ${formatH(both[0])} a ${formatH(both[1])}.`}
      </figcaption>
    </figure>
  )
}

export default function M09DilemmaDellaRegione() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [x0, setX0] = useState(INITIAL.x)
  const [hUser, setHUser] = useState(INITIAL.h)
  const [NUser, setNUser] = useState(INITIAL.N)
  const [h1, setH1] = useState(INITIAL.h1)
  const [seed, setSeed] = useState(1)
  const [nAnswer, setNAnswer] = useState(100)
  const [takeoverAt, setTakeoverAt] = useState<number | null>(null)
  const [checked, setChecked] = useState<{ key: string; ok: boolean } | null>(null)
  const [terrainRef, narrow] = useNarrow(520)

  const sb = useStoryboard(STEPS)
  const progress = sb.progress
  const own = takeoverAt === sb.index
  const N = own ? NUser : sb.index === SWEEP ? sweepN(progress) : (IMPOSED_N[sb.index] ?? NUser)
  const h = own ? hUser : sb.index === SWEEP ? lawH(h1, N) : (IMPOSED_H[sb.index] ?? hUser)
  const imposing = !own && (sb.index === SWEEP || IMPOSED_H[sb.index] !== undefined || IMPOSED_N[sb.index] !== undefined)
  const takeOver = () => {
    if (imposing) {
      sb.pause()
      setTakeoverAt(sb.index)
      setHUser(h)
      setNUser(N)
    }
  }

  const st = regionStats(x0, h, N)
  const samples = useMemo(() => trainingSet(N, seed), [N, seed])
  const kLive = countIn(samples, x0, h)
  const draws = useMemo(() => drawEstimates(x0, h, N, seed), [x0, h, N, seed])
  const shownDraws = sb.index === 1 ? Math.max(1, Math.min(DRAWS, Math.floor(progress * DRAWS) + 1)) : DRAWS
  const drawVals = draws.map((d) => d.phat)
  const drawMean = drawVals.slice(0, shownDraws).reduce((s, v) => s + v, 0) / shownDraws
  const zeros = draws.slice(0, shownDraws).filter((d) => d.k === 0).length
  const bands = useMemo(() => greenBands(x0, N), [x0, N])
  const lln = llnLevel(st.kExpected)
  const flat = flatLevel(st.exc)

  const xs = useMemo(() => linspace(DOMAIN[0], DOMAIN[1], 301), [])
  const truthPts = useMemo(() => xs.map((x) => [x, truth(x)]), [xs])
  const inR = linspace(x0 - h / 2, x0 + h / 2, 41).map((x) => [x, truth(x)])
  const histMax = Math.max(12, Math.ceil(Math.max(...Array.from({ length: HIST_BINS }, (_, b) => drawVals.filter((v) => Math.floor(v / (Y_MAX / HIST_BINS)) === b).length)) * 1.15))

  const values = {
    pR: st.pR,
    p: st.p,
    V: h,
    pV: st.p * h,
    K: kLive,
    N,
    PRhat: kLive / N,
    phat: kLive / (N * h),
  }

  const checkKey = `${x0}|${hUser}|${nAnswer}`
  const checkedValid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = checkedValid === null ? 'idle' : checkedValid.ok ? 'ok' : 'ko'
  const verdict = checkedValid !== null ? judge(x0, hUser, nAnswer) : null

  const reset = () => {
    sb.reset()
    setX0(INITIAL.x)
    setHUser(INITIAL.h)
    setNUser(INITIAL.N)
    setH1(INITIAL.h1)
    setSeed(1)
    setNAnswer(100)
    setTakeoverAt(null)
    setChecked(null)
  }

  const mainPlot = (
    <Plot
      width={480}
      height={340}
      fill
      xDomain={DOMAIN}
      yDomain={[-BELT, Y_MAX]}
      margin={{ top: 22, right: 8, bottom: 38, left: 44 }}
      ariaLabel="Densità dei redditi con la regione R attorno a x*"
      description={`x* = ${f2(x0)}, h = ${formatH(h)}, N = ${N}. K contati nella regione: ${kLive}, K atteso ${f1(st.kExpected)}. p(x*) = ${f3(st.p)}, media di p in R ${f3(st.avg)}.`}
    >
      <Grid axis="y" yTicks={[0, 0.25, 0.5, 0.75, 1]} />
      <RegionBand x0={x0} h={h} />
      <LinePath data={truthPts} role="truth" />
      <LinePath data={inR} role="accent" width={3} />
      <Rug samples={samples} bottom={-BELT} />
      <Dots
        data={[{ x: x0, y: -BELT / 2, id: 'xstar', label: 'Punto x*' }]}
        draggable
        pin
        axis="x"
        step={0.05}
        format={(v) => `${f2(v)} k€`}
        onDrag={(_id, nx) => setX0(Math.min(X_RANGE[1], Math.max(X_RANGE[0], Math.round(nx * 20) / 20)))}
      />
      <Axis side="bottom" ticks={[0, 1, 2, 3, 4, 5, 6]} symbol="reddito [k€]" />
      <Axis side="left" ticks={[0, 0.5, 1]} symbol="p(x)" />
    </Plot>
  )

  const sidePlot = (
    <Plot
      width={200}
      height={340}
      fill
      xDomain={[0, histMax]}
      yDomain={[-BELT, Y_MAX]}
      margin={{ top: 22, right: 8, bottom: 38, left: 8 }}
      ariaLabel="Istogramma delle stime K/(N h) dei portafogli ricampionati"
      description={`${shownDraws} estrazioni. Media ${f3(drawMean)}, P_R/V ${f3(st.avg)}, p(x*) vera ${f3(st.p)}. Estrazioni con K = 0: ${zeros}.`}
    >
      <SideHistogram values={drawVals} count={shownDraws} />
      <RefLine y={st.p} dashed color="var(--viz-truth)" width={1.75} label="p(x*)" anchor="end" />
      <RefLine y={st.avg} color="var(--viz-highlight)" width={3} label="P_R/V" anchor="start" />
      <RefLine y={drawMean} color="var(--viz-estimate)" width={2} />
      <Axis side="bottom" ticks={2} format={(v) => f0(v)} symbol="estrazioni" />
    </Plot>
  )

  const terrain = (
    <div ref={terrainRef} className="absolute inset-0 grid grid-cols-[minmax(0,1fr)_minmax(0,0.42fr)]">
      <div className="relative min-h-0 min-w-0">{mainPlot}</div>
      <div className="relative min-h-0 min-w-0 border-l border-border">{sidePlot}</div>
      {sb.index === 6 ? (
        <OverlayCard title="Slide p44 ↔ slide p61" className={narrow ? 'inset-x-2 top-2' : 'top-3 left-14 w-[min(24rem,62%)]'}>
          <table className="w-full border-collapse text-[length:var(--step--1)]">
            <tbody>
              <tr className="border-b border-border">
                <td className="py-1 pr-2">
                  <em lang="en">R enough large</em>: K/N affidabile (grandi numeri)
                </td>
                <td className="py-1">
                  <M tex="N h_N^n\to+\infty" />
                </td>
              </tr>
              <tr>
                <td className="py-1 pr-2">
                  <em lang="en">R enough small</em>: p quasi costante in R
                </td>
                <td className="py-1">
                  <M tex="h_N\to 0" />
                </td>
              </tr>
            </tbody>
          </table>
        </OverlayCard>
      ) : null}
    </div>
  )

  const controls = (
    <>
      <div className="grid gap-2">
        <Spia
          tex="K \gg 1 ?"
          spoken="La legge dei grandi numeri vale? K atteso abbastanza grande?"
          state={lln}
          word={`legge dei grandi numeri: ${LEVEL_WORD[lln]}`}
          detail={
            <>
              K atteso = N·P_R = {f1(st.kExpected)} · incertezza 1/√K = {st.kExpected > 0 ? pct(1 / Math.sqrt(st.kExpected)) : '∞'}
            </>
          }
        />
        <Spia
          tex="p \approx \text{cost. in } R ?"
          spoken="p è quasi costante dentro R?"
          state={flat}
          word={`p quasi costante in R: ${LEVEL_WORD[flat]}`}
          detail={<>escursione (max − min)/p(x*) = {pct(st.exc)}</>}
        />
      </div>
      <LogSlider
        id={`${uid}-h`}
        label="Larghezza della regione R"
        latex="h"
        values={H_STEPS}
        value={h}
        onChange={(v) => {
          takeOver()
          setHUser(v)
        }}
        format={formatH}
        unit="k€"
      />
      <GreenStrips bands={bands} h={h} />
      <LogSlider
        id={`${uid}-N`}
        label="Pratiche"
        latex="N"
        values={N_STEPS}
        value={N}
        onChange={(v) => {
          takeOver()
          setNUser(v)
        }}
        format={(v) => f0(v)}
      />
      <Slider id={`${uid}-x`} label="Punto della stima" latex="x^*" min={X_RANGE[0]} max={X_RANGE[1]} step={0.05} value={x0} onChange={setX0} unit="k€" />
      <Slider id={`${uid}-h1`} label="Costante della legge h_N = h₁/√N" latex="h_1" min={H1_RANGE.min} max={H1_RANGE.max} step={H1_RANGE.step} value={h1} onChange={setH1} />
      <div className="flex flex-wrap gap-2">
        <ActionButton
          onClick={() => {
            setSeed((s) => s + 1)
            setTakeoverAt(null)
            sb.goto(1)
            sb.play()
          }}
        >
          <Icon d="M5 12a7 7 0 1 0 2-4.9M5 4v4h4" />
          Ricampiona ×{DRAWS}
        </ActionButton>
        <ActionButton
          onClick={() => {
            setTakeoverAt(null)
            sb.goto(SWEEP)
            sb.play()
          }}
        >
          Play: N cresce
        </ActionButton>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="K nella regione" latex="K" value={kLive} format={f0} />
        <Readout label="K atteso" latex="N P_R" value={st.kExpected} format={f1} />
        <Readout label="Stima" latex="K/(Nh)" value={kLive / (N * h)} format={f3} />
        <Readout label="Densità vera" latex="p(x^*)" value={st.p} format={f3} />
        <Readout label="Media di p in R" latex="P_R/V" value={st.avg} format={f3} />
        <Readout label="Bias" value={st.bias} format={f3} />
        <Readout label="Errore quadratico medio" latex="\mathrm{MSE}" value={st.mse} format={f4} pinned />
        <Readout label="Estrazioni con K = 0" value={zeros} format={f0} />
      </div>
    </>
  )

  const captionBlock = (
    <div className="grid gap-4">
      <StepCaption index={sb.index} total={STEPS.length} label={sb.step.label} text={caption(sb.index, N, x0, h)} />
      <div className="grid gap-4 border-t border-border pt-3">
        <Legend
          items={[
            { kind: 'dash', color: 'var(--viz-truth)', label: 'p(x) vera' },
            { kind: 'band', color: 'var(--viz-highlight)', label: 'regione R, V = h' },
            { kind: 'thick', color: 'var(--viz-highlight)', label: 'p dentro R · P_R/V' },
            { kind: 'bar', color: 'var(--viz-kernel)', label: 'stime K/(N h)' },
            { kind: 'line', color: 'var(--viz-estimate)', label: 'media delle stime' },
          ]}
        />
        <StaticFormula label="Slide p43 · probability that a vector falls in R" tex={String.raw`P_R=P\{\mathbf{x}\in R\}=\int_R p(\mathbf{x})\,d\mathbf{x}=p(\mathbf{x}^*)\,V`} />
        <FormulaBox label="Con i numeri (l'uguale della slide è un'approssimazione)" tex={String.raw`P_R=\val[4]{pR}\ \approx\ p(x^*)\,V=\val[3]{p}\cdot\val{V}=\val[4]{pV}`} values={values} announce />
        <FormulaBox
          label="La frequenza relativa e la stima"
          tex={String.raw`\hat{P}_R=\frac{K}{N}=\frac{\val[0]{K}}{\val[0]{N}}=\val[4]{PRhat},\qquad \hat{p}(\mathbf{x}^*)=\frac{\hat{P}_R}{V}=\frac{K}{NV}=\frac{\val[0]{K}}{\val[0]{N}\cdot\val{V}}=\val[3]{phat}`}
          values={values}
        />
        <StaticFormula
          label="Il dilemma come scelta di h"
          tex={String.raw`h\uparrow:\ N h^n\uparrow\ (\text{varianza}\downarrow),\ \text{bias}\uparrow\qquad\qquad h\downarrow:\ \text{bias}\downarrow,\ N h^n\downarrow\ (\text{varianza}\uparrow)`}
        />
        <StaticFormula label="Condizioni di consistenza (slide p61)" tex={String.raw`\lim_{N\to+\infty}h_N=0,\qquad \lim_{N\to+\infty}N h_N^n=+\infty`} />
      </div>
    </div>
  )

  const challenge = (
    <div className="grid gap-4">
      <NumberField id={`${uid}-nans`} label="Pratiche per K atteso ≥ 30 con h = 0.2 (in x* = 2.4)" latex="N" min={10} max={100000} step={1} value={nAnswer} onChange={setNAnswer} />
      <Challenge prompt={PROMPT} hint={HINT} status={status} onCheck={() => setChecked({ key: checkKey, ok: judge(x0, hUser, nAnswer).ok })} />
      {verdict !== null ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          <Readout label={`x* sul picco (${CHALLENGE_X})?`} value={verdict.atPeak ? 'sì' : 'no'} />
          <Readout label="Il tuo MSE / il migliore" value={verdict.ratio} format={f2} pinned />
          <Readout label="h migliore dello slider" value={verdict.best.h} format={formatH} />
          <Readout label={`N necessario in x* = ${SPEC_X}`} value={verdict.need} format={f0} />
        </div>
      ) : null}
    </div>
  )

  return (
    <WidgetFrame meta={meta} aspect={narrow ? 1.05 : 1.55} onReset={reset} transport={<PlayControls sb={sb} steps={STEPS} />} caption={captionBlock} controls={controls} challenge={challenge}>
      {terrain}
    </WidgetFrame>
  )
}
