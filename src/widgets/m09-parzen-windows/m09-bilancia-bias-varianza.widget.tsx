// Widget m09-bilancia-bias-varianza ("La bilancia bias-varianza al variare di h"), concetti c51 e c52.
// Note p43: la varianza vuole N·h_Nⁿ grande, il bias vuole h piccolo; "the goal is to minimize variance without
// introducing excessive bias". Qui, sui redditi dei clienti solvibili, la U del MISE in funzione di h (bias²
// integrato + varianza integrata, in forma chiusa), una bilancia che pende dalla parte più pesante e l'anteprima
// della stima con un fascio di 20 stime ricampionate. La dimostrazione finale segue tre leggi h_N lungo N.
//
// MOTO. La corsa di N delle tre leggi è un passo dello storyboard (6 s); il fascio ricampionato entra in
// dissolvenza (200 ms, @starting-style). La bilancia segue h e N senza ritardo: è un comando trascinato, e una
// molla che insegue il valore sembrerebbe rotta (regola del kit, docs/WIDGET_GUIDE.md sezione 4).
import { useDeferredValue, useId, useMemo, useState } from 'react'
import { Rich } from '../../components/content/Rich'
import { linspace } from '../../lib/ml/stats'
import { ActionButton } from '../kit/ActionButton'
import { Challenge } from '../kit/Challenge'
import type { ChallengeStatus } from '../kit/Challenge'
import { fixed } from '../kit/format'
import { PlayControls } from '../kit/PlayControls'
import { Axis } from '../kit/plot/Axis'
import { Grid } from '../kit/plot/Grid'
import { LinePath } from '../kit/plot/LinePath'
import { classVar } from '../kit/plot/marks'
import { Plot, usePlot } from '../kit/plot/Plot'
import { Readout } from '../kit/Readout'
import { Segmented } from '../kit/Segmented'
import { StepCaption } from '../kit/StepCaption'
import { useStoryboard } from '../kit/useStoryboard'
import { WidgetFrame } from '../kit/WidgetFrame'
import { formatH } from '../engines/density1d'
import type { WidgetMeta } from '../types'
import {
  BANCA,
  DOMAIN,
  H_STEPS,
  INITIAL,
  LAWS,
  N_STEPS,
  bundle,
  equilibrium,
  errorsAt,
  judge,
  lawH,
  lawRatio,
  optimum,
  sideOf,
  sweepN,
  tiltDeg,
  uCurves,
} from './bilancia-bias-varianza'
import type { LawId, Side } from './bilancia-bias-varianza'
import { useNarrow } from './proprieta/hooks'
import { BandPath, PointMark, Polyline, RefLine } from './proprieta/marks'
import { mixPdf, pointGaussMoments } from './proprieta/teoria'
import { FormulaBox, Icon, Legend, LogSlider, OverlayCard, StaticFormula } from './proprieta/ui'
import { pow10Label } from './gara-di-consistenza'

export const meta: WidgetMeta = {
  id: 'm09-bilancia-bias-varianza',
  moduleId: 'm09-parzen-windows',
  title: 'La bilancia bias-varianza al variare di h',
  concepts: ['c51', 'c52'],
  scenario: 'banca',
  scenarioNote: 'Credit scoring: reddito mensile (k€) dei clienti solvibili, stimato da N pratiche',
  size: 'M',
}

const f0 = fixed(0)
const f2 = fixed(2)
const f3 = fixed(3)
const f5 = fixed(5)

const STEPS = [
  { id: 'quadro', label: 'Il quadro: la U, la bilancia, la stima', durationMs: 1500 },
  { id: 'cursore', label: 'Sposta h: da che parte pende?', durationMs: 1500 },
  { id: 'fascio', label: 'Il fascio: venti stime ricampionate', durationMs: 1500 },
  { id: 'n', label: 'Più pratiche: la U scende e scorre', durationMs: 1800 },
  { id: 'leggi', label: 'Troppo veloce, troppo lenta', durationMs: 6000 },
  { id: 'chiusura', label: 'Minimizzare la varianza senza troppo bias', durationMs: 2000 },
]
const LAW_STEP = 4
const SIDE_WORDS: Record<Side, string> = { bias: 'dalla parte del bias', varianza: 'dalla parte della varianza', equilibrio: 'in equilibrio' }
const LAW_IDS: LawId[] = ['veloce', 'lenta', 'radice']

function caption(index: number, N: number, h: number, hStar: number): string {
  switch (index) {
    case 0:
      return String.raw`Reddito mensile (k€) dei clienti solvibili, stimato da $N = ${N}$ pratiche. A sinistra, in funzione di $h$ in scala logaritmica, il bias² integrato cresce, la varianza integrata scende e la loro somma, l'errore quadratico medio integrato (MISE), fa una U con il minimo in $h^* = ${f3(hStar)}$. A destra la bilancia e l'anteprima della stima con $h = ${formatH(h)}$.`
    case 1:
      return String.raw`Sposta $h$: la bilancia pende dalla parte che pesa di più. Piatto sinistro, il bias: la stima sfocata (*oversmoothing*). Piatto destro, la varianza: la stima che cambia a ogni nuova pratica. È in equilibrio dove bias² = varianza, poco a destra del minimo della U.`
    case 2:
      return String.raw`Il fascio sottile: 20 portafogli di $N$ pratiche ricampionati, 20 stime con lo stesso $h$; la velatura è la media della stima $\pm 2$ deviazioni standard. Con $h$ piccolo il fascio è largo (varianza); con $h$ grande è stretto ma lontano dalla verità su picchi e valli (bias).`
    case 3:
      return String.raw`Aumenta $N$: la varianza scende (è proporzionale a $1/(N h)$), la U si abbassa e il suo minimo scorre verso $h$ più piccoli, mentre $N h^*$ cresce. A $N$ finito non esiste un $h$ che azzeri tutto: si può solo scegliere il punto più basso della U.`
    case 4:
      return String.raw`Tre leggi partono insieme dal minimo a $N = 20$ e seguono $N$ fino a 10 000. $h_1/N$ si restringe troppo in fretta (*too quickly*) e scivola sul ramo sinistro: alta varianza. $h_1 N^{-0.05}$ troppo lentamente (*too slowly*) e resta sul ramo destro: stima distorta, *over-smoothed*. $h_1/\sqrt N$ resta la più vicina al minimo. Serve un equilibrio accurato per una stima consistente.`
    default:
      return String.raw`«*The goal is to minimize variance without introducing excessive bias*» (note p43). Un $N$ grande con un $h_N$ che si restringe nel modo giusto rende la stima non distorta e a bassa varianza per $N \to +\infty$: sulla scheda il minimo per $N$ = 100, 1000, 10 000.`
  }
}

const PROMPT = String.raw`Con $N = 100$ porta la bilancia in **equilibrio** (bias² e varianza entro un fattore 1.25). Poi, senza guardare il grafico, prevedi da che parte pende se $N$ diventa 10 000 lasciando $h$ com'è. Premi Verifica: il widget controlla l'equilibrio a $N = 100$, qualunque sia lo slider di $N$, e la tua previsione.`
const HINT = String.raw`L'equilibrio sta poco a destra del minimo della U. Con $N$ cento volte più grande la varianza, proporzionale a $1/(N h)$, diventa cento volte più piccola; il bias dipende solo da $h$ e resta lo stesso.`

/** La bilancia: il giogo ruota attorno al fulcro, i piatti restano orizzontali. Piatto più basso = parte più pesante. */
function Balance({ bias2, variance }: { bias2: number; variance: number }) {
  const deg = tiltDeg({ bias2, variance, mise: bias2 + variance })
  const r = (deg * Math.PI) / 180
  const cx = 120
  const cy = 40
  const L = 88
  const ends = [
    [cx - L * Math.cos(r), cy - L * Math.sin(r)],
    [cx + L * Math.cos(r), cy + L * Math.sin(r)],
  ] as const
  const share = [bias2 / (bias2 + variance), variance / (bias2 + variance)]
  const plates = [
    { name: 'bias²', sub: 'oversmoothing', value: bias2, color: classVar(0) },
    { name: 'varianza', sub: 'stima variabile', value: variance, color: classVar(1) },
  ]
  const side = sideOf({ bias2, variance, mise: bias2 + variance })
  return (
    <svg viewBox="0 0 240 158" className="block h-full w-full" role="img" aria-label={`Bilancia: pende ${SIDE_WORDS[side]}. Bias² ${bias2.toExponential(2)}, varianza ${variance.toExponential(2)}.`}>
      <path d="M120 40L104 148h32z" fill="var(--surface-2)" stroke="var(--border-strong)" strokeWidth={1.5} />
      <line x1={ends[0][0]} y1={ends[0][1]} x2={ends[1][0]} y2={ends[1][1]} stroke="var(--text)" strokeWidth={4} strokeLinecap="square" />
      <circle cx={cx} cy={cy} r={5} fill="var(--pin)" stroke="var(--pin-contrast)" strokeWidth={1.5} />
      {ends.map(([ex, ey], i) => {
        const trayY = ey + 44
        const blockH = 6 + 30 * share[i]
        const p = plates[i]
        return (
          <g key={p.name}>
            <line x1={ex} y1={ey} x2={ex - 22} y2={trayY} stroke="var(--viz-axis)" />
            <line x1={ex} y1={ey} x2={ex + 22} y2={trayY} stroke="var(--viz-axis)" />
            <rect x={ex - 14} y={trayY - blockH} width={28} height={blockH} fill={p.color} fillOpacity={0.85} />
            <line x1={ex - 30} x2={ex + 30} y1={trayY} y2={trayY} stroke="var(--text)" strokeWidth={3} />
            <text x={ex} y={trayY + 14} textAnchor="middle" className="label" fontSize={10} fill="var(--text)">
              {p.name}
            </text>
            <text x={ex} y={trayY + 26} textAnchor="middle" className="num" fontSize={10} fill="var(--text-muted)">
              {f5(p.value)}
            </text>
          </g>
        )
      })}
      <text x={120} y={14} textAnchor="middle" className="label" fontSize={10} fill="var(--text)">
        {side === 'equilibrio' ? 'in equilibrio' : side === 'bias' ? 'pende sul bias' : 'pende sulla varianza'}
      </text>
    </svg>
  )
}

/** Cursore fantasma di una legge sulla U: tacca in alto con il nome, punto sul MISE; oltre il bordo una punta. */
function Ghost({ logH, logMise, label, row }: { logH: number; logMise: number; label: string; row: number }) {
  const { x, y, innerWidth } = usePlot()
  const [a, b] = x.domain()
  const inside = logH >= a && logH <= b
  const px = inside ? x(logH) : logH < a ? 0 : innerWidth
  return (
    <g pointerEvents="none">
      {inside ? <line x1={px} x2={px} y1={10} y2={y(logMise)} stroke="var(--text)" strokeWidth={1} strokeDasharray="2 3" /> : null}
      {inside ? <circle cx={px} cy={y(logMise)} r={4.5} fill="var(--surface)" stroke="var(--text)" strokeWidth={2} /> : <path d={logH < a ? `M0,${14 + row * 14}l7,-5v10z` : `M${innerWidth},${14 + row * 14}l-7,-5v10z`} fill="var(--text)" />}
      <text
        x={Math.min(Math.max(px + (inside ? 4 : logH < a ? 10 : -10), 4), innerWidth - 4)}
        y={14 + row * 14}
        dy="0.32em"
        textAnchor={!inside && logH > b ? 'end' : px > innerWidth * 0.7 ? 'end' : 'start'}
        className="num"
        fontSize={10.5}
        fontWeight={600}
        fill="var(--text)"
        stroke="var(--surface)"
        strokeWidth={3}
        paintOrder="stroke"
      >
        {label}
      </text>
    </g>
  )
}

const H_TICKS = [0.02, 0.05, 0.1, 0.2, 0.5, 1, 2]

export default function M09BilanciaBiasVarianza() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [h, setH] = useState(INITIAL.h)
  const [NUser, setNUser] = useState(INITIAL.N)
  const [seed, setSeed] = useState(1)
  const [prediction, setPrediction] = useState<Side>('equilibrio')
  const [takeoverAt, setTakeoverAt] = useState<number | null>(null)
  const [checked, setChecked] = useState<{ key: string; ok: boolean } | null>(null)
  const [terrainRef, narrow] = useNarrow(560)

  const sb = useStoryboard(STEPS)
  const progress = sb.progress
  const sweeping = sb.index === LAW_STEP && takeoverAt !== sb.index
  const N = sweeping ? sweepN(progress) : NUser
  const onN = (v: number) => {
    if (sweeping) {
      sb.pause()
      setTakeoverAt(sb.index)
    }
    setNUser(v)
  }

  const e = errorsAt(h, N)
  const opt = useMemo(() => optimum(N), [N])
  const eqH = useMemo(() => equilibrium(N), [N])
  const u = useMemo(() => uCurves(N), [N])
  const lg = Math.log10

  // anteprima: verità, media ± 2 sd (forma chiusa) e il fascio ricampionato
  const xs = useMemo(() => linspace(DOMAIN[0], DOMAIN[1], 121), [])
  const truth = useMemo(() => xs.map((x) => [x, mixPdf(x, BANCA)]), [xs])
  const band = xs.map((x) => {
    const m = pointGaussMoments(x, BANCA, h)
    return { mean: m.mean, sd: Math.sqrt(Math.max(0, (m.second - m.mean * m.mean) / N)) }
  })
  const args = useMemo(() => ({ N, h, seed }), [N, h, seed])
  const bundleArgs = useDeferredValue(args)
  const lines = useMemo(() => (sweeping ? [] : bundle(bundleArgs.N, bundleArgs.h, bundleArgs.seed, xs)), [sweeping, bundleArgs, xs])

  const values = { h, N, Nh: N * h, b2: e.bias2, v: e.variance, mise: e.mise, hStar: opt.h, NhStar: N * opt.h }

  const checkKey = `${h}|${prediction}`
  const checkedValid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = checkedValid === null ? 'idle' : checkedValid.ok ? 'ok' : 'ko'
  const verdict = checkedValid !== null ? judge(h, prediction) : null

  const reset = () => {
    sb.reset()
    setH(INITIAL.h)
    setNUser(INITIAL.N)
    setSeed(1)
    setPrediction('equilibrio')
    setTakeoverAt(null)
    setChecked(null)
  }

  const uPlot = (
    <Plot
      width={460}
      height={320}
      fill
      xDomain={[lg(0.02), lg(2)]}
      yDomain={[-4.6, 0]}
      margin={{ top: 12, right: 12, bottom: 38, left: 46 }}
      ariaLabel="La U: bias², varianza e MISE integrati in funzione di h"
      description={`N = ${N}. Minimo del MISE in h* = ${f3(opt.h)}. Con h = ${formatH(h)}: bias² ${e.bias2.toExponential(2)}, varianza ${e.variance.toExponential(2)}.`}
    >
      <Grid xTicks={H_TICKS.map(lg)} yTicks={[-4, -3, -2, -1]} />
      <LinePath data={u.logH.map((l, i) => [l, u.bias2[i]])} cls={0} width={2} />
      <LinePath data={u.logH.map((l, i) => [l, u.variance[i]])} cls={1} width={2} />
      <LinePath data={u.logH.map((l, i) => [l, u.mise[i]])} role="boundary" width={3} />
      <PointMark x={lg(opt.h)} y={lg(opt.errors.mise)} color="var(--pin)" r={6} />
      <RefLine x={lg(h)} color="var(--viz-boundary)" width={1.5} label={`h = ${formatH(h)}`} anchor={lg(h) > -0.3 ? 'end' : 'start'} labelY={innerLabelY(sb.index)} />
      <PointMark x={lg(h)} y={lg(e.bias2)} color={classVar(0)} />
      <PointMark x={lg(h)} y={lg(e.variance)} color={classVar(1)} />
      <PointMark x={lg(h)} y={lg(e.mise)} color="var(--viz-boundary)" r={5} />
      {sb.index === LAW_STEP
        ? LAW_IDS.map((id, row) => {
            const lh = lawH(id, N)
            return <Ghost key={id} logH={lg(lh)} logMise={lg(errorsAt(lh, N).mise)} label={`${LAWS[id].label} ×${f2(lawRatio(id, N))}`} row={row} />
          })
        : null}
      <Axis side="bottom" ticks={H_TICKS.map(lg)} format={(v) => String(Number((10 ** v).toPrecision(2)))} label="larghezza" symbol="h [k€]" />
      <Axis side="left" ticks={[-4, -3, -2, -1, 0]} format={pow10Label} />
    </Plot>
  )

  const preview = (
    <Plot
      width={360}
      height={200}
      fill
      xDomain={DOMAIN}
      yDomain={[0, 0.9]}
      margin={{ top: 10, right: 10, bottom: 32, left: 38 }}
      ariaLabel="Anteprima della stima con l'h corrente, il fascio di 20 stime ricampionate e la densità vera"
      description={`h = ${formatH(h)}, N = ${N}. Venti stime ricampionate, media della stima con banda di due deviazioni standard, densità vera tratteggiata.`}
    >
      <BandPath xs={xs} lo={band.map((b) => Math.max(0, b.mean - 2 * b.sd))} hi={band.map((b) => b.mean + 2 * b.sd)} />
      <g key={`${bundleArgs.seed}`} className="transition-opacity duration-200 ease-out starting:opacity-0">
        {lines.slice(1).map((ys, i) => (
          <Polyline key={i} pts={xs.map((x, j) => [x, ys[j]] as const)} color="var(--text-faint)" width={1} opacity={0.55} />
        ))}
      </g>
      <LinePath data={truth} role="truth" />
      {lines.length > 0 ? <LinePath data={xs.map((x, j) => [x, lines[0][j]])} role="estimate" width={2.5} /> : <LinePath data={xs.map((x, j) => [x, band[j].mean])} role="kernel" width={2} />}
      <Axis side="bottom" ticks={[0, 2, 4, 6]} symbol="reddito [k€]" />
      <Axis side="left" ticks={[0, 0.4, 0.8]} />
    </Plot>
  )

  const terrain = (
    <div ref={terrainRef} className={`absolute inset-0 grid ${narrow ? 'grid-rows-[1.2fr_0.75fr_0.85fr]' : 'grid-cols-[1.35fr_1fr]'}`}>
      <div className="relative min-h-0 min-w-0">{uPlot}</div>
      {narrow ? (
        <>
          <div className="relative min-h-0 border-t border-border p-1">
            <Balance bias2={e.bias2} variance={e.variance} />
          </div>
          <div className="relative min-h-0 border-t border-border">{preview}</div>
        </>
      ) : (
        <div className="grid min-h-0 grid-rows-[1fr_1fr] border-l border-border">
          <div className="relative min-h-0 p-1">
            <Balance bias2={e.bias2} variance={e.variance} />
          </div>
          <div className="relative min-h-0 border-t border-border">{preview}</div>
        </div>
      )}
      {sb.index === 5 ? (
        <OverlayCard title="Il punto più basso della U" className={narrow ? 'inset-x-2 top-2' : 'top-3 left-14 w-[min(22rem,55%)]'}>
          <p className="m-0 text-[length:var(--step--1)]">
            <em lang="en">the goal is to minimize variance without introducing excessive bias</em>
          </p>
          <table className="num w-full border-collapse text-right text-[length:var(--step--1)]">
            <thead>
              <tr className="border-b border-border-strong text-muted">
                <th scope="col" className="py-1 text-left font-normal">
                  N
                </th>
                <th scope="col" className="py-1 font-normal">
                  h*
                </th>
                <th scope="col" className="py-1 font-normal">
                  N·h*
                </th>
                <th scope="col" className="py-1 font-normal">
                  MISE
                </th>
              </tr>
            </thead>
            <tbody>
              {[100, 1000, 10000].map((n) => {
                const o = optimum(n)
                return (
                  <tr key={n} className="border-b border-border">
                    <td className="py-0.5 text-left">{n}</td>
                    <td className="py-0.5">{f3(o.h)}</td>
                    <td className="py-0.5">{f2(n * o.h)}</td>
                    <td className="py-0.5">{f5(o.errors.mise)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </OverlayCard>
      ) : null}
    </div>
  )

  const controls = (
    <>
      <LogSlider id={`${uid}-h`} label="Larghezza della finestra" latex="h" values={H_STEPS} value={h} onChange={setH} format={formatH} unit="k€" />
      <LogSlider id={`${uid}-N`} label="Pratiche" latex="N" values={N_STEPS} value={N} onChange={onN} format={(v) => f0(v)} />
      <div className="flex flex-wrap gap-2">
        <ActionButton onClick={() => setSeed((s) => s + 1)}>
          <Icon d="M5 12a7 7 0 1 0 2-4.9M5 4v4h4" />
          Ricampiona il fascio
        </ActionButton>
        <ActionButton
          onClick={() => {
            setTakeoverAt(null)
            sb.goto(LAW_STEP)
            sb.play()
          }}
        >
          Mostra le due leggi sbagliate
        </ActionButton>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="Bias² integrato" value={e.bias2} format={f5} />
        <Readout label="Varianza integrata" value={e.variance} format={f5} />
        <Readout label="Bias² / varianza" value={e.bias2 / e.variance} format={f2} pinned />
        <Readout label="MISE" value={e.mise} format={f5} />
        <Readout label="h al minimo" latex="h^*" value={opt.h} format={f3} />
        <Readout label="N·h al minimo" latex="N h^*" value={N * opt.h} format={f2} />
        <Readout label="h in equilibrio" value={eqH} format={f3} />
        <Readout label="La bilancia pende" value={SIDE_WORDS[sideOf(e)]} />
      </div>
    </>
  )

  const captionBlock = (
    <div className="grid gap-4">
      <StepCaption index={sb.index} total={STEPS.length} label={sb.step.label} text={caption(sb.index, N, h, opt.h)} />
      <div className="grid gap-4 border-t border-border pt-3">
        <Legend
          items={[
            { kind: 'line', color: classVar(0), label: 'bias² integrato' },
            { kind: 'line', color: classVar(1), label: 'varianza integrata' },
            { kind: 'thick', color: 'var(--viz-boundary)', label: 'MISE (la U)' },
            { kind: 'dot', color: 'var(--pin)', label: 'minimo h*' },
            { kind: 'dash', color: 'var(--viz-truth)', label: 'densità vera' },
            { kind: 'band', color: 'var(--viz-kernel)', label: 'media ± 2 dev. st.' },
          ]}
        />
        <StaticFormula
          label="Errore quadratico nel punto = bias² + varianza"
          tex={String.raw`E\{(\hat{p}(x)-p(x))^2\}=\left(E\{\hat{p}(x)\}-p(x)\right)^2+E\{(\hat{p}(x)-\bar{\hat{p}}(x))^2\}`}
        />
        <FormulaBox
          label="Integrato su x, con i numeri"
          tex={String.raw`\mathrm{MISE}(h)=\int\text{bias}^2+\int\text{var}=\val[5]{b2}+\val[5]{v}=\val[5]{mise}`}
          values={values}
          announce
        />
        <FormulaBox
          label="La varianza vuole N·h grande · estimate variance is bounded by"
          tex={String.raw`E\{(\hat{p}(x)-\bar{\hat{p}}(x))^2\}\le\frac{\sup(\gamma(\cdot))\,\bar{\hat{p}}(x)}{N h_N^n},\qquad N h=\val[0]{N}\cdot\val[3]{h}=\val{Nh}`}
          values={values}
        />
        <Rich
          text={String.raw`Leggi delle note p43: se $h_N$ si restringe troppo in fretta rispetto a $N$ la stima è molto variabile; troppo lentamente resta distorta (*over-smoothed*). Con $h_N$ grande più smoothing e meno varianza ma più bias; con $h_N$ piccolo stima variabile (*overfitting*), a meno di un $N$ abbastanza grande. Le note chiudono con «*we need h → 0 as N → +∞*», formula incompleta: serve anche $N h_N^n \to +\infty$.`}
          className="block max-w-[var(--measure)] text-[length:var(--step--1)] text-muted"
        />
      </div>
    </div>
  )

  const challenge = (
    <div className="grid gap-4">
      <Segmented
        id={`${uid}-pred`}
        label="Con N = 10 000 e lo stesso h, la bilancia pende"
        options={[
          { value: 'bias', label: 'sul bias' },
          { value: 'varianza', label: 'sulla varianza' },
          { value: 'equilibrio', label: 'resta in equilibrio' },
        ]}
        value={prediction}
        onChange={setPrediction}
      />
      <Challenge prompt={PROMPT} hint={HINT} status={status} onCheck={() => setChecked({ key: checkKey, ok: judge(h, prediction).ok })} />
      {verdict !== null ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          <Readout label="Bias²/varianza a N = 100" value={verdict.ratio} format={f2} pinned />
          <Readout label="In equilibrio?" value={verdict.balanced ? 'sì' : 'no'} />
          <Readout label="A N = 10 000 pende" value={SIDE_WORDS[verdict.after]} />
        </div>
      ) : null}
    </div>
  )

  return (
    <WidgetFrame
      meta={meta}
      aspect={narrow ? 0.62 : 1.45}
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

/** Durante la dimostrazione delle leggi l'etichetta del cursore scende sotto quelle dei fantasmi. */
const innerLabelY = (index: number) => (index === LAW_STEP ? 60 : 14)
