// Widget m09-gara-di-consistenza ("La gara delle leggi h_N: chi converge davvero?"), concetti c49, c50, c53, c67.
// Slide p61: la stima di Parzen è consistente se h_N → 0 e N·h_Nⁿ → +∞. Qui le leggi h_N = N^(−a) corrono da
// N = 10 a N = 100 000 salmoni: in alto la densità vera, la media della stima con la sua banda (±2 deviazioni
// standard) e, in 1-D, la stima di un impianto; in basso bias², varianza e MISE integrati in scala log-log,
// in forma chiusa. Due spie rispondono alle due condizioni; la banda sull'asse di a è la zona valida 0 < a < 1/n.
//
// MOTO. Le corse di N sono passi dello storyboard (8 s, N in scala logaritmica): Play, Pausa, Passo, Velocità e
// Reset le governano; con reduced motion ogni passo mostra subito N = 100 000. Un passo impone la legge: se
// l'utente tocca a o N, il racconto si ferma e i comandi tornano suoi. Slider e selettori non si animano.
import { useId, useMemo, useState } from 'react'
import { ActionButton } from '../kit/ActionButton'
import { Challenge } from '../kit/Challenge'
import type { ChallengeStatus } from '../kit/Challenge'
import { fixed } from '../kit/format'
import { PlayControls } from '../kit/PlayControls'
import { Axis } from '../kit/plot/Axis'
import { Grid } from '../kit/plot/Grid'
import { LinePath } from '../kit/plot/LinePath'
import { classVar } from '../kit/plot/marks'
import { Plot } from '../kit/plot/Plot'
import { Readout } from '../kit/Readout'
import { Segmented } from '../kit/Segmented'
import { Slider } from '../kit/Slider'
import { StepCaption } from '../kit/StepCaption'
import { Toggle } from '../kit/Toggle'
import { useStoryboard } from '../kit/useStoryboard'
import { WidgetFrame } from '../kit/WidgetFrame'
import { CurveLabel } from '../engines/density1d/terrain'
import { Rich } from '../../components/content/Rich'
import { linspace } from '../../lib/ml/stats'
import type { WidgetMeta } from '../types'
import { useNarrow } from './proprieta/hooks'
import { BandPath, Needles, PointMark, RefLine } from './proprieta/marks'
import { kdeFromBins, lawLimits } from './proprieta/teoria'
import type { Limit } from './proprieta/teoria'
import { FormulaBox, Legend, LogSlider, OverlayCard, Spia, StaticFormula } from './proprieta/ui'
import type { SpiaState } from './proprieta/ui'
import {
  A_RANGE,
  CHALLENGE_N,
  DIMS,
  DOMAIN,
  LAWS,
  N_STEPS,
  errorsAt,
  fishPool,
  hOf,
  judgeA,
  meanBand,
  pow10Label,
  prefixBins,
  sweepN,
  traces,
  truthSlice,
  yMaxFor,
} from './gara-di-consistenza'
import type { Dim, LawId } from './gara-di-consistenza'

export const meta: WidgetMeta = {
  id: 'm09-gara-di-consistenza',
  moduleId: 'm09-parzen-windows',
  title: 'La gara delle leggi h_N: chi converge davvero?',
  concepts: ['c49', 'c50', 'c53', 'c67'],
  scenario: 'pesce',
  scenarioNote: 'Luminosità dei salmoni sul nastro, da 10 a 100 000 pesci misurati: come deve restringersi la finestra?',
  size: 'L',
}

const f0 = fixed(0)
const f2 = fixed(2)
const f3 = fixed(3)
const f4 = fixed(4)
const exp2 = (v: number) => (v > 0 && Number.isFinite(v) ? v.toExponential(2).replace('e', '·10^').replace('+', '') : '0')

const STEPS = [
  { id: 'quadro', label: 'Il quadro: una legge per h, tre tracce', durationMs: 1500 },
  { id: 'melgani', label: 'Legge di Melgani: h_N = 1/N^(1/(2n))', durationMs: 8000 },
  { id: 'costante', label: 'h costante: il bias resta', durationMs: 8000 },
  { id: 'veloce', label: 'Troppo veloce: la varianza esplode', durationMs: 8000 },
  { id: 'libero', label: 'La zona valida 0 < a < 1/n', durationMs: 1800 },
  { id: 'verdetto', label: 'Verdetto: Parzen è un buon stimatore?', durationMs: 2500 },
]
/** Aghi disegnati al più nel pettine (h più stretto dei bin). */
const NEEDLES_MAX = 400
const LAW_OF_STEP: Record<number, LawId | undefined> = { 1: 'melgani', 2: 'costante', 3: 'veloce' }
const STEP_OF_LAW: Record<LawId, number> = { melgani: 1, costante: 2, veloce: 3 }

const VERDICT = [
  String.raw`A $h$ finito la stima è **distorta**: $E\{\hat p(\mathbf x)\} = p(\mathbf x) * \frac{1}{h^n}\gamma\left(\frac{\mathbf x}{h}\right)$, una versione sfocata della verità.`,
  String.raw`È **asintoticamente non distorta** se $h_N \to 0$: il kernel riscalato tende alla delta di Dirac.`,
  String.raw`La varianza è limitata da $\sup(\gamma(\cdot))\,\bar{\hat p}(\mathbf x)/(N h_N^n)$: si annulla se $N h_N^n \to +\infty$.`,
  String.raw`Con **entrambe** le condizioni la stima è **consistente**, per esempio con $h_N = 1/\sqrt[2n]{N}$.`,
  String.raw`A campione finito decide $h$: compromesso fra stima liscia (distorta) e stima rumorosa (variabile); in alta dimensione servono moltissimi campioni.`,
]

function caption(index: number, n: number, N: number, a: number): string {
  switch (index) {
    case 0:
      return String.raw`In alto la luminosità dei salmoni in unità normalizzate: la densità vera (tratteggiata), la media della stima $E\{\hat p\}$ con la banda di $\pm 2$ deviazioni standard${n === 1 ? ' e la stima di un solo impianto' : ` (fetta lungo la prima feature, n = ${n})`}, con $N = ${N}$ e $h_N = N^{-a}$, $a = ${f2(a)}$. In basso, in scala log-log, come scendono con $N$ il bias² integrato, la varianza integrata e il loro totale, l'errore quadratico medio integrato (MISE). Premi Play: tre leggi in gara.`
    case 1:
      return String.raw`La legge dell'esempio di Melgani (slide p61), $h_N = 1/\sqrt[2n]{N}$, cioè $a = 1/(2n) = ${f3(1 / (2 * n))}$: $h_N \to 0$ e $N h_N^n = N \cdot N^{-1/2} = \sqrt N$ sale da 3.2 a 316. Entrambe le spie sono verdi, le tre tracce scendono insieme e la stima si posa sulla densità vera: la stima è **consistente** (*consistent*).`
    case 2:
      return String.raw`$h$ costante ($a = 0$): la varianza scende come $1/N$, ma il bias² resta su un **pavimento** (la linea orizzontale). Con $h$ fisso più dati danno una stima sempre più stabile della versione sfocata $p * \frac{1}{h^n}\gamma(\cdot/h)$, non di $p$: la prima spia è rossa, $h_N \not\to 0$.`
    case 3:
      return String.raw`Troppo veloce ($a = 1.2/n$): la finestra si restringe più in fretta di $N^{-1/n}$ e $N h_N^n = N^{-0.2} \to 0$. Il bias crolla, ma la varianza **cresce** e la stima${n === 1 ? ' in alto' : ''} diventa un pettine di aghi (*h_N shrinks too quickly*: stima molto variabile). La seconda spia è rossa.`
    case 4:
      return String.raw`Tocca a te: la banda verde sull'asse di $a$ è la zona valida $0 < a < 1/n$ (1, 0.5, 0.33 per $n = 1, 2, 3$), che si restringe con la dimensione; il segno a metà è l'esempio di Melgani. Troppo lenta, la stima resta distorta (*over-smoothed*); troppo veloce, è molto variabile. Le due condizioni tirano $h$ in direzioni opposte: verso zero, ma più lentamente di $N^{-1/n}$.`
    default:
      return String.raw`«*Is Parzen a good estimator?*» La risposta per l'orale in cinque punti, sulla scheda: il bias dipende da $h$, la varianza da $N h^n$, e solo insieme le due condizioni danno la consistenza.`
  }
}

const PROMPT = String.raw`Con $n = 2$ trova l'esponente $a$ per cui il MISE scende **più in fretta** (la pendenza fra $N = 10^4$ e $10^5$ nel grafico log-log), poi controlla se sta nella zona valida. Premi Verifica: la sfida è superata con una pendenza almeno al 90% della migliore che lo slider permette.`
const HINT = String.raw`Il bias² integrato scende come $h^4 = N^{-4a}$, la varianza come $1/(N h^n) = N^{-(1 - n a)}$: il MISE scende con la più lenta delle due. Cerca l'$a$ dove le due pendenze si uguagliano, $4a = 1 - n a$ (risultato di letteratura, non nella fonte).`

/** Spia di un limite: verde se va dove deve. h costante non toglie il bias (rossa); N·hⁿ costante non fa
 * crescere la varianza ma non la annulla (in bilico). */
const limitState = (l: Limit, want: Limit): SpiaState => (l === want ? 'ok' : l === 'const' && want === 'inf' ? 'warn' : 'ko')
const LIMIT_WORD: Record<Limit, string> = { zero: '→ 0', const: 'costante', inf: '→ +∞' }

/** L'asse dell'esponente a con la zona valida 0 < a < 1/n, l'esempio di Melgani e lo spillo sull'a corrente. */
function ExponentStrip({ a, n }: { a: number; n: number }) {
  const W = 300
  const X = (v: number) => 12 + (v / A_RANGE.max) * (W - 24)
  const edge = 1 / n
  const mel = 1 / (2 * n)
  return (
    <figure className="m-0 grid gap-1">
      <svg viewBox={`0 0 ${W} 46`} className="block h-auto w-full" role="img" aria-label={`Asse di a da 0 a 1.5: zona valida da 0 a ${f2(edge)}, esempio di Melgani in ${f3(mel)}, a corrente ${f2(a)}`}>
        <rect x={X(0)} y={10} width={X(edge) - X(0)} height={12} fill="var(--ok-bg)" stroke="var(--ok)" strokeWidth={1.5} />
        <line x1={X(0)} x2={X(A_RANGE.max)} y1={22} y2={22} stroke="var(--viz-axis)" />
        {[0, 0.5, 1, 1.5].map((t) => (
          <g key={t}>
            <line x1={X(t)} x2={X(t)} y1={22} y2={27} stroke="var(--viz-axis)" />
            <text x={X(t)} y={39} textAnchor="middle" className="num" fontSize={11} fill="var(--text-muted)">
              {t}
            </text>
          </g>
        ))}
        <path d={`M${X(mel)},10l-4,-7h8z`} fill="var(--text)" />
        <text x={X(mel) + 6} y={8} className="num" fontSize={10} fill="var(--text)">
          Melgani
        </text>
        <rect x={X(Math.min(a, A_RANGE.max)) - 4.5} y={11.5} width={9} height={9} fill="var(--pin)" stroke="var(--pin-contrast)" strokeWidth={1.5} transform={`rotate(45 ${X(Math.min(a, A_RANGE.max))} 16)`} />
      </svg>
      <figcaption className="text-[length:var(--step--1)] text-muted">
        Zona valida <span className="num">0 &lt; a &lt; 1/n = {f2(edge)}</span>: bordo verde e contorno pieno.
      </figcaption>
    </figure>
  )
}

export default function M09GaraDiConsistenza() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [aUser, setAUser] = useState(LAWS.melgani.a(1))
  const [n, setN] = useState<Dim>(1)
  const [NUser, setNUser] = useState(10)
  const [show, setShow] = useState({ bias2: true, variance: true, mise: true })
  const [takeoverAt, setTakeoverAt] = useState<number | null>(null)
  const [checked, setChecked] = useState<{ key: string; ok: boolean } | null>(null)
  const [terrainRef, narrow] = useNarrow(560)

  const sb = useStoryboard(STEPS)
  const progress = sb.progress
  const law = LAW_OF_STEP[sb.index]
  const imposing = law !== undefined && takeoverAt !== sb.index
  const a = imposing ? LAWS[law].a(n) : aUser
  const N = imposing ? sweepN(progress) : NUser
  const h = hOf(a, N)
  const lim = lawLimits(a, n)
  const err = errorsAt(a, n, N)
  const nhn = N * h ** n

  const takeOver = () => {
    if (imposing) {
      sb.pause()
      setTakeoverAt(sb.index)
      setAUser(a)
      setNUser(N)
    }
  }
  const onA = (v: number) => {
    takeOver()
    setAUser(v)
  }
  const onN = (v: number) => {
    takeOver()
    setNUser(v)
  }
  const runLaw = (id: LawId) => {
    setAUser(LAWS[id].a(n))
    setTakeoverAt(null)
    sb.goto(STEP_OF_LAW[id])
    sb.play()
  }

  // --- in alto: verità, media ± 2 sd, stima di un impianto (solo 1-D) ---
  const xs = useMemo(() => linspace(DOMAIN[0], DOMAIN[1], 281), [])
  const yMax = yMaxFor(n)
  const truth = useMemo(() => xs.map((x) => [x, truthSlice(x, n)]), [xs, n])
  const band = xs.map((x) => meanBand(x, n, h, N))
  const pool = fishPool()
  const binned = n === 1 ? prefixBins(pool, N, h) : null
  const binW = (DOMAIN[1] - DOMAIN[0]) / (binned?.bins ?? 1)
  const comb = binned !== null && h < 3 * binW
  const realization = binned !== null && !comb ? kdeFromBins(binned.counts, N, DOMAIN, xs, h) : null
  // con h più stretto dei bin la stima è un ago alto 1/(N h √(2π)) su ogni salmone: se ne disegnano al più
  // NEEDLES_MAX (i primi misurati), perché migliaia di aghi da un pixel farebbero un muro pieno che non esiste
  const needles = binned !== null && comb ? pool.slice(0, Math.min(N, NEEDLES_MAX)).map((x) => ({ x, h: 1 / (N * h * Math.sqrt(2 * Math.PI)) })) : []

  // --- in basso: le tracce log-log ---
  const tr = useMemo(() => traces(a, n), [a, n])
  const logN = Math.log10(N)
  const lg = (v: number) => (v > 0 ? Math.log10(v) : -20)
  const pts = (ys: readonly number[]) => tr.logN.map((l, i) => [l, Number.isFinite(ys[i]) ? ys[i] : -20])

  const values = {
    N,
    a,
    h,
    n,
    nhn,
    sqrtN: Math.sqrt(N),
    lb: lg(err.bias2),
    lv: lg(err.variance),
    lm: lg(err.mise),
  }

  // --- sfida ---
  const checkKey = `${aUser}|${n}`
  const checkedValid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = checkedValid === null ? 'idle' : checkedValid.ok ? 'ok' : 'ko'
  const verdict = checkedValid !== null ? judgeA(aUser, n) : null
  const check = () => setChecked({ key: checkKey, ok: judgeA(aUser, n).ok })

  const reset = () => {
    sb.reset()
    setAUser(LAWS.melgani.a(1))
    setN(1)
    setNUser(10)
    setShow({ bias2: true, variance: true, mise: true })
    setTakeoverAt(null)
    setChecked(null)
  }

  const verdictCount = sb.index === 5 ? Math.max(1, Math.ceil(progress * VERDICT.length)) : 0
  const floor = Math.abs(a) < 1e-12

  const topPlot = (
    <Plot
      width={720}
      height={260}
      fill
      xDomain={DOMAIN}
      yDomain={[0, yMax]}
      margin={{ top: 22, right: 12, bottom: 34, left: 50 }}
      ariaLabel="Densità vera e stima di Parzen della luminosità dei salmoni"
      description={`N = ${N}, h_N = ${h.toPrecision(3)}, n = ${n}. Tratteggiata la verità; velatura: media della stima ± 2 deviazioni standard.`}
    >
      <Grid axis="y" yTicks={[0, yMax / 2, yMax]} />
      <BandPath xs={xs} lo={band.map((b) => Math.max(0, b.mean - 2 * b.sd))} hi={band.map((b) => Math.min(yMax * 1.5, b.mean + 2 * b.sd))} />
      <LinePath data={truth} role="truth" />
      <LinePath data={xs.map((x, i) => [x, band[i].mean])} role="kernel" width={1.5} />
      {realization !== null ? <LinePath data={xs.map((x, i) => [x, realization[i]])} role="estimate" width={2.5} /> : null}
      {comb ? <Needles at={needles} width={1} /> : null}
      {comb ? (
        <text x={8} y={14} className="num" fontSize={11} fill="var(--text)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
          pettine di aghi: {Math.min(N, NEEDLES_MAX)} di {N} disegnati
        </text>
      ) : null}
      <CurveLabel at={[DOMAIN[1] - 2.6, truthSlice(DOMAIN[1] - 2.6, n) * 0.9]} text="p(x) vera" above={false} />
      <Axis side="bottom" ticks={[-3, -2, -1, 0, 1, 2, 3]} label="luminosità normalizzata" symbol={n === 1 ? 'x' : 'x₁'} />
      <Axis side="left" ticks={[0, yMax]} format={(v) => v.toFixed(2)} symbol="p̂(x)" />
    </Plot>
  )

  const logPlot = (
    <Plot
      width={720}
      height={280}
      fill
      xDomain={[1, 5]}
      yDomain={[-8, 1]}
      margin={{ top: 22, right: 12, bottom: 34, left: 50 }}
      ariaLabel="Bias², varianza e MISE integrati in funzione di N, in scala log-log"
      description={`Legge h_N = N^(−${f2(a)}), n = ${n}. A N = ${N}: bias² ${exp2(err.bias2)}, varianza ${exp2(err.variance)}, MISE ${exp2(err.mise)}.`}
    >
      <Grid xTicks={[1, 2, 3, 4, 5]} yTicks={[-8, -6, -4, -2, 0]} />
      {floor && show.bias2 ? <RefLine y={lg(err.bias2)} label="pavimento: il bias² con h fisso" anchor="end" color="var(--viz-boundary)" width={1} /> : null}
      {/* il MISE sotto: dove una delle due domina gli coincide, e la traccia sottile deve restare visibile sopra */}
      {show.mise ? <LinePath data={pts(tr.mise)} role="boundary" width={4} /> : null}
      {show.bias2 ? <LinePath data={pts(tr.bias2)} cls={0} width={2} /> : null}
      {show.variance ? <LinePath data={pts(tr.variance)} cls={1} width={2} /> : null}
      <RefLine x={logN} color="var(--viz-boundary)" width={1} label={`N = ${f0(N)}`} anchor={logN > 4 ? 'end' : 'start'} labelY={12} />
      {show.bias2 ? <PointMark x={logN} y={lg(err.bias2)} color={classVar(0)} /> : null}
      {show.variance ? <PointMark x={logN} y={lg(err.variance)} color={classVar(1)} /> : null}
      {show.mise ? <PointMark x={logN} y={lg(err.mise)} color="var(--viz-boundary)" r={5} /> : null}
      <Axis side="bottom" ticks={[1, 2, 3, 4, 5]} format={pow10Label} label="campioni" symbol="N" />
      <Axis side="left" ticks={[-8, -6, -4, -2, 0]} format={pow10Label} />
    </Plot>
  )

  const terrain = (
    <div ref={terrainRef} className="absolute inset-0 grid grid-rows-[0.9fr_1fr]">
      <div className="relative min-h-0">{topPlot}</div>
      <div className="relative min-h-0 border-t border-border">{logPlot}</div>
      {verdictCount > 0 ? (
        <OverlayCard title={<em lang="en">Is Parzen a good estimator?</em>} className={narrow ? 'inset-x-2 top-2' : 'top-3 right-3 w-[min(26rem,60%)]'}>
          <ol className="m-0 grid gap-1.5 pl-5 text-[length:var(--step--1)]">
            {VERDICT.slice(0, verdictCount).map((v, i) => (
              <li key={i} className="transition-opacity duration-200 ease-out starting:opacity-0">
                <Rich text={v} inline />
              </li>
            ))}
          </ol>
        </OverlayCard>
      ) : null}
    </div>
  )

  const controls = (
    <>
      <div className="grid gap-2">
        <Spia
          tex="h_N \to 0 ?"
          spoken="h con N tende a zero?"
          state={limitState(lim.h, 'zero')}
          detail={<>h_N = {f0(N)}^(−{f2(a)}) = {h < 0.001 ? h.toExponential(2) : f4(h)} · {LIMIT_WORD[lim.h]}</>}
        />
        <Spia
          tex="N h_N^n \to +\infty ?"
          spoken="N per h alla n tende a più infinito?"
          state={limitState(lim.nhn, 'inf')}
          detail={<>N·h_Nⁿ = {nhn < 0.01 ? nhn.toExponential(2) : f2(nhn)} · {LIMIT_WORD[lim.nhn]}</>}
        />
      </div>
      <div className="grid gap-2">
        <span className="label">Le tre leggi (Play)</span>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(LAWS) as LawId[]).map((id) => (
            <ActionButton key={id} onClick={() => runLaw(id)} aria-pressed={law === id && imposing}>
              {LAWS[id].label}
            </ActionButton>
          ))}
        </div>
      </div>
      <Slider id={`${uid}-a`} label="Esponente della legge" latex="a" min={A_RANGE.min} max={A_RANGE.max} step={A_RANGE.step} value={a} onChange={onA} />
      <ExponentStrip a={a} n={n} />
      <LogSlider id={`${uid}-N`} label="Salmoni misurati" latex="N" values={N_STEPS} value={N} onChange={onN} format={(v) => f0(v)} />
      <Segmented
        id={`${uid}-n`}
        label="Dimensione dello spazio (feature)"
        options={DIMS.map((d) => ({ value: String(d), label: `n = ${d}` }))}
        value={String(n)}
        onChange={(v) => setN(Number(v) as Dim)}
      />
      <div className="grid gap-1">
        <Toggle id={`${uid}-b`} label="Traccia del bias²" checked={show.bias2} onChange={(v) => setShow((s) => ({ ...s, bias2: v }))} />
        <Toggle id={`${uid}-v`} label="Traccia della varianza" checked={show.variance} onChange={(v) => setShow((s) => ({ ...s, variance: v }))} />
        <Toggle id={`${uid}-m`} label="Traccia del MISE" checked={show.mise} onChange={(v) => setShow((s) => ({ ...s, mise: v }))} />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="Campioni" latex="N" value={N} format={f0} />
        <Readout label="Larghezza" latex="h_N" value={h < 0.001 ? h.toExponential(2) : f4(h)} />
        <Readout label="Bias² integrato" value={exp2(err.bias2)} />
        <Readout label="Varianza integrata" value={exp2(err.variance)} />
        <Readout label="MISE" value={exp2(err.mise)} pinned />
        <Readout label="Campioni efficaci" latex="N h_N^n" value={nhn < 0.01 ? nhn.toExponential(2) : f2(nhn)} />
      </div>
    </>
  )

  const captionBlock = (
    <div className="grid gap-4">
      <StepCaption index={sb.index} total={STEPS.length} label={sb.step.label} text={caption(sb.index, n, N, a)} />
      <div className="grid gap-4 border-t border-border pt-3">
        <Legend
          items={[
            { kind: 'dash', color: 'var(--viz-truth)', label: 'densità vera p(x)' },
            { kind: 'band', color: 'var(--viz-kernel)', label: 'media della stima ± 2 dev. st.' },
            ...(n === 1 ? [{ kind: 'thick' as const, color: 'var(--viz-estimate)', label: 'stima di un impianto' }] : []),
            { kind: 'line', color: classVar(0), label: 'bias² integrato' },
            { kind: 'line', color: classVar(1), label: 'varianza integrata' },
            { kind: 'thick', color: 'var(--viz-boundary)', label: 'MISE' },
          ]}
        />
        <StaticFormula
          label="Condizioni di consistenza · the Parzen estimate is consistent if"
          tex={String.raw`\lim_{N\to+\infty}h_N=0,\qquad \lim_{N\to+\infty}N h_N^n=+\infty`}
        />
        <FormulaBox
          label="La legge in gara, con i numeri"
          tex={String.raw`h_N=N^{-a}=\val[0]{N}^{-\val{a}}=\val[4]{h},\qquad N h_N^n=\val[0]{N}\cdot\val[4]{h}^{\val[0]{n}}=\val{nhn}`}
          values={values}
          announce
        />
        <StaticFormula
          label="Esempio della slide · Example"
          tex={String.raw`h_N=\frac{1}{\sqrt[2n]{N}}\quad\Longrightarrow\quad N h_N^n=N\cdot N^{-1/2}=\sqrt{N}\to+\infty`}
        />
        <FormulaBox label="Il MISE si scompone" tex={String.raw`\mathrm{MISE}=\int\!\big(E\{\hat p\}-p\big)^2+\int\!\operatorname{var}\{\hat p\}=10^{\val{lb}}+10^{\val{lv}}=10^{\val{lm}}`} values={values} />
        <StaticFormula
          label="Che cosa toglie ciascuna condizione (note p43)"
          tex={String.raw`\begin{gathered}h_N\to 0\ \Rightarrow\ \text{bias}\to 0,\qquad N h_N^n\to+\infty\ \Rightarrow\ \text{varianza}\to 0\\ \left(\lim_{N\to+\infty}h_N=0\right)\wedge\left(\lim_{N\to+\infty}N h_N^n=+\infty\right)\Longrightarrow\lim_{N\to+\infty}E\left\{\left(\hat{p}(\mathbf{x})-p(\mathbf{x})\right)^2\right\}=0\end{gathered}`}
        />
        <p className="m-0 text-[length:var(--step--1)] text-muted">
          La slide dice «<em lang="en">consistent if</em>»: una condizione sufficiente, con le due richieste insieme. La convergenza è in media quadratica (bias e varianza tendono a zero), che implica
          quella in probabilità per la disuguaglianza di Chebyshev. Il teorema (Parzen 1962, Duda-Hart) chiede anche <span className="num">p</span> continua in x e un kernel limitato che decada
          all'infinito.
        </p>
      </div>
    </div>
  )

  const challenge = (
    <div className="grid gap-4">
      <Challenge prompt={PROMPT} hint={HINT} status={status} onCheck={check} />
      {verdict !== null ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          <Readout label={n === CHALLENGE_N ? 'La tua pendenza' : 'Serve n = 2'} value={verdict.slope} format={f3} pinned />
          <Readout label="La migliore dello slider" value={`${f3(verdict.best.slope)} (a = ${f2(verdict.best.a)})`} />
          <Readout label="Teoria 1/(n + 4)" value={1 / (n + 4)} format={f3} />
          <Readout label="Dentro la zona valida?" value={verdict.valid ? 'sì' : 'no'} />
        </div>
      ) : null}
    </div>
  )

  return (
    <WidgetFrame
      meta={meta}
      aspect={narrow ? 0.8 : 1.35}
      onReset={reset}
      transport={<PlayControls sb={sb} steps={STEPS} />}
      caption={captionBlock}
      controls={controls}
      challenge={challenge}
    >
      {terrain}
    </WidgetFrame>
  )
}
