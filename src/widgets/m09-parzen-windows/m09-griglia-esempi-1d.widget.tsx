// Widget m09-griglia-esempi-1d ("Le griglie di Melgani in 1-D: normale e bimodale"), concetti c54, c55, c57.
// Le due figure delle slide p62-63 (da Duda-Hart) diventano una griglia viva: colonne h_1 = 1, 0.5, 0.1 con
// h_N = h_1/√N, righe N = 1, 10, 100, ∞ (normale) e N = 1, 16, 256, ∞ (bimodale). In verticale si legge la
// convergenza, in orizzontale il prezzo di un h_1 sbagliato a campione finito; la riga N = 1 parla del kernel.
// Una cella si apre nel pannello laterale con la verità, i campioni, l'errore integrato e la formula viva.
//
// MOTO. Il riempimento riga per riga (300 ms a cella) è un passo dello storyboard; il ricampionamento entra in
// dissolvenza (200 ms). Con reduced motion la griglia è subito piena. Schede, interruttori, slider: nessun moto.
import { useId, useMemo, useState } from 'react'
import { M } from '../../components/content/M'
import { ActionButton } from '../kit/ActionButton'
import { Challenge } from '../kit/Challenge'
import type { ChallengeStatus } from '../kit/Challenge'
import { fixed } from '../kit/format'
import { PlayControls } from '../kit/PlayControls'
import { Axis } from '../kit/plot/Axis'
import { LinePath } from '../kit/plot/LinePath'
import { classVar } from '../kit/plot/marks'
import { Plot, usePlot } from '../kit/plot/Plot'
import { Readout } from '../kit/Readout'
import { Segmented } from '../kit/Segmented'
import { Slider } from '../kit/Slider'
import { StepCaption } from '../kit/StepCaption'
import { Toggle } from '../kit/Toggle'
import { useStoryboard } from '../kit/useStoryboard'
import { WidgetFrame } from '../kit/WidgetFrame'
import { normalPdf } from '../../lib/ml/stats'
import type { WidgetMeta } from '../types'
import { CELL_MS, H1S, TABS, TRIAL_H1, TRIAL_NS, estimate, expected, gridXs, hN, ise, measuredRise, minimalN, mlGaussian, pool } from './griglia-esempi-1d'
import type { Tab } from './griglia-esempi-1d'
import { useNarrow } from './proprieta/hooks'
import { FormulaBox, Icon, Legend, StaticFormula } from './proprieta/ui'

export const meta: WidgetMeta = {
  id: 'm09-griglia-esempi-1d',
  moduleId: 'm09-parzen-windows',
  title: 'Le griglie di Melgani in 1-D: normale e bimodale',
  concepts: ['c54', 'c55', 'c57'],
  scenario: 'fonte',
  scenarioNote: 'Le figure delle slide p62-63 (da Duda-Hart): stime di Parzen gaussiane con h_N = h₁/√N',
  size: 'L',
}

const f3 = fixed(3)
const f4 = fixed(4)
const nText = (N: number) => (Number.isFinite(N) ? String(N) : '∞')

const STEPS = [
  { id: 'quadro', label: 'Il quadro: la griglia della slide', durationMs: 1500 },
  { id: 'riempimento', label: 'La griglia si riempie riga per riga', durationMs: 12 * CELL_MS },
  { id: 'bimodale', label: 'La bimodale: triangolo e rettangolo', durationMs: 1800 },
  { id: 'cella', label: 'Una cella da vicino', durationMs: 1500 },
  { id: 'ricampiona', label: 'Ricampiona: che cosa cambia?', durationMs: 1500 },
  { id: 'dimostra', label: 'Che cosa dimostra la griglia', durationMs: 2500 },
]
const PROOF = 5

function caption(index: number, tab: Tab): string {
  const rows = TABS[tab].rows.slice(0, 3).join(', ')
  switch (index) {
    case 0:
      return String.raw`La figura della slide, viva: colonne $h_N = 1/\sqrt N$, $0.5/\sqrt N$, $0.1/\sqrt N$, righe $N = ${rows}, \infty$ (dati sintetici a seme, kernel gaussiano). In ogni cella il valore di $h_N$. Clicca una cella (o Invio) per aprirla nel pannello: la densità vera, i campioni, l'errore integrato.`
    case 1:
      return String.raw`Le celle si riempiono riga per riga. Con $N = 1$ si vede **solo il kernel** centrato sull'unico campione: la riga parla della finestra, non dei dati. Con $N = 10$ la terza colonna è un pettine di picchi; con $N = 100$ le prime due sono già una campana e la terza è ancora frastagliata; la riga $N = \infty$ è la densità vera in tutte le colonne.`
    case 2:
      return String.raw`La bimodale di Duda-Hart: un triangolo fra 0.5 e 2.5 con vertice in 1.5 e un rettangolo fra 3 e 3.5, alti 2/3. Con $N = 16$ e $h_1 = 1$ due gobbe lisce, con 0.5 sotto-picchi spuri, con 0.1 aghi isolati; con $N = 256$ e $h_1 = 1$ si riconoscono triangolo e rettangolo. Accendi il modello gaussiano a massima verosimiglianza: una campana sola, senza due modi né spigoli.`
    case 3:
      return String.raw`Nel pannello la cella scelta, grande: la densità vera tratteggiata, le tacche dei campioni, l'errore quadratico integrato $\mathrm{ISE} = \int(\hat p - p)^2$ e la formula con $N$ e $h_N$ sostituiti. Scegli anche un $N$ di prova (16, 64, 256, 1024).`
    case 4:
      return String.raw`Ricampiona: le celle con $h_1 = 0.1$ cambiano moltissimo (varianza alta), quelle con $h_1 = 1$ poco; la riga $N = \infty$ non cambia mai.`
    default:
      return String.raw`In verticale si legge la **convergenza**: con $h_N = h_1/\sqrt N$ si ha $h_N \to 0$ e $N h_N = h_1\sqrt N \to +\infty$, quindi la stima converge a $p$ qualunque sia $h_1$ e qualunque sia la forma della densità. In orizzontale si legge il **prezzo di un $h_1$ sbagliato** a campione finito: piccolo, stime rumorose; grande, stime lisce. È la risposta grafica a *do they tend to the optimal solution?*`
  }
}

const PROMPT = String.raw`Nella scheda **Bimodale**, qual è il più piccolo $N$ fra 16, 64, 256 e 1024 con cui $h_1 = 0.5$ mostra **chiaramente** il bordo verticale del rettangolo? Criterio: la stima sale dal 10% al 90% dell'altezza in meno di 0.1 unità (la lettura "salita del bordo" nel pannello).`
const HINT = String.raw`Con il kernel gaussiano un gradino si smussa in una salita larga circa $2.56\,h_N$. Serve quindi $h_N = 0.5/\sqrt N \le 0.039$: prova i quattro $N$ nel pannello e guarda la lettura.`

/** Un mini-grafico della griglia: verità (se accesa), stima, modello gaussiano ML. */
function CellPlot({ tab, xs, est, truth, ml, ariaLabel }: { tab: Tab; xs: readonly number[]; est: readonly number[] | null; truth: boolean; ml: { mu: number; sigma: number } | null; ariaLabel: string }) {
  const spec = TABS[tab]
  return (
    <Plot width={160} height={96} fill xDomain={spec.domain} yDomain={[0, spec.yMax]} margin={{ top: 3, right: 3, bottom: 3, left: 3 }} ariaLabel={ariaLabel}>
      {truth ? <LinePath data={xs.map((x) => [x, spec.truth(x)])} role="truth" width={1.25} /> : null}
      {ml !== null ? <LinePath data={xs.map((x) => [x, normalPdf(x, ml.mu, ml.sigma)])} cls={1} width={1.5} /> : null}
      {est !== null ? <LinePath data={xs.map((x, i) => [x, est[i]])} role="estimate" width={1.75} /> : null}
    </Plot>
  )
}

/** Tacche dei campioni sulla base del pannello. */
function SampleTicks({ samples }: { samples: readonly number[] }) {
  const { x, y } = usePlot()
  const y0 = y(0)
  let d = ''
  for (const s of samples) d += `M${x(s).toFixed(1)},${y0.toFixed(1)}v-9`
  return <path data-ticks="" d={d} stroke="var(--viz-sample)" strokeWidth={1} strokeOpacity={samples.length > 200 ? 0.4 : 0.9} pointerEvents="none" />
}

interface Selected {
  row: number
  col: number
}

export default function M09GrigliaEsempi1d() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [tabUser, setTabUser] = useState<Tab>('normale')
  const [seed, setSeed] = useState(1)
  const [showTruth, setShowTruth] = useState(true)
  const [showML, setShowML] = useState(false)
  const [trialOn, setTrialOn] = useState(false)
  const [trialH1, setTrialH1] = useState<number>(TRIAL_H1.initial)
  const [selected, setSelected] = useState<Selected>({ row: 1, col: 1 })
  const [zoomN, setZoomN] = useState<number | null>(null)
  const [answer, setAnswer] = useState<string>('16')
  const [takeoverAt, setTakeoverAt] = useState<number | null>(null)
  const [checked, setChecked] = useState<{ key: string; ok: boolean } | null>(null)
  const [gridRef, narrow] = useNarrow(560)

  const sb = useStoryboard(STEPS)
  const progress = sb.progress
  const tab: Tab = sb.index === 2 && takeoverAt !== 2 ? 'bimodale' : tabUser
  const spec = TABS[tab]
  const onTab = (t: Tab) => {
    if (sb.index === 2 && takeoverAt !== 2) {
      sb.pause()
      setTakeoverAt(2)
    }
    setTabUser(t)
  }

  const cols = useMemo(() => (trialOn ? [...H1S, trialH1] : [...H1S]), [trialOn, trialH1])
  const xs = useMemo(() => gridXs(tab), [tab])
  const samples = useMemo(() => pool(tab, seed), [tab, seed])
  const cells = useMemo(
    () =>
      spec.rows.map((N) =>
        cols.map((h1) => {
          if (!Number.isFinite(N)) return { est: xs.map(spec.truth), h: 0 }
          const h = hN(h1, N)
          return { est: estimate(xs, samples, N, h), h }
        }),
      ),
    [spec, xs, samples, cols],
  )
  const total = spec.rows.length * cols.length
  const revealed = sb.index === 1 ? Math.max(1, Math.min(total, Math.floor(progress * total) + 1)) : total

  // --- pannello ---
  const sel = { row: Math.min(selected.row, spec.rows.length - 1), col: Math.min(selected.col, cols.length - 1) }
  const zN = zoomN ?? spec.rows[sel.row]
  const zH1 = cols[sel.col]
  const zh = hN(zH1, zN)
  const zoomXs = useMemo(() => gridXs(tab, 401), [tab])
  const zEst = Number.isFinite(zN) ? estimate(zoomXs, samples, zN, zh) : zoomXs.map(spec.truth)
  const zIse = ise(tab, zoomXs, zEst)
  const zMl = showML && tab === 'bimodale' && Number.isFinite(zN) ? mlGaussian(samples, zN) : null
  const rise = tab === 'bimodale' && Number.isFinite(zN) ? measuredRise(zh) : Number.NaN
  const zoomNs = [...new Set([...spec.rows.filter((n) => Number.isFinite(n)), ...TRIAL_NS])].sort((a, b) => a - b)
  const values = { N: zN, h1: zH1, hN: zh, ise: zIse, Nh: Number.isFinite(zN) ? zN * zh : Number.POSITIVE_INFINITY }

  const checkKey = answer
  const checkedValid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = checkedValid === null ? 'idle' : checkedValid.ok ? 'ok' : 'ko'

  const reset = () => {
    sb.reset()
    setTabUser('normale')
    setSeed(1)
    setShowTruth(true)
    setShowML(false)
    setTrialOn(false)
    setTrialH1(TRIAL_H1.initial)
    setSelected({ row: 1, col: 1 })
    setZoomN(null)
    setAnswer('16')
    setTakeoverAt(null)
    setChecked(null)
  }

  const proof = sb.index === PROOF
  const grid = (
    <div ref={gridRef} className="absolute inset-0 p-2">
      <div
        key={`${tab}-${seed}`}
        className="grid h-full w-full gap-1 transition-opacity duration-200 ease-out starting:opacity-0"
        style={{ gridTemplateColumns: `${narrow ? '2.6rem' : '4.2rem'} repeat(${cols.length}, minmax(0, 1fr))`, gridTemplateRows: `auto repeat(${spec.rows.length}, minmax(0, 1fr))` }}
      >
        <div className="label flex items-end text-[length:var(--step--1)]">{proof ? <span className="text-text">↓ conv.</span> : null}</div>
        {cols.map((h1, c) => (
          <div key={c} className="flex min-w-0 flex-col items-center justify-end text-[length:var(--step--1)]">
            <span aria-hidden="true">
              <M tex={c < 3 ? `h_N=${h1 === 1 ? '1' : String(h1)}/\\sqrt{N}` : `h_N=${h1}/\\sqrt{N}`} />
            </span>
            <span className="visually-hidden">h con N uguale a {h1} diviso radice di N</span>
            {c === 3 ? <span className="label">prova</span> : null}
            {proof && c === 0 ? <span className="label text-text">→ prezzo di h₁</span> : null}
          </div>
        ))}
        {spec.rows.map((N, r) => (
          <RowCells
            key={r}
            N={N}
            r={r}
            cols={cols}
            cells={cells[r]}
            tab={tab}
            xs={xs}
            revealed={revealed}
            showTruth={showTruth}
            ml={showML && tab === 'bimodale' ? mlGaussian(samples, Number.isFinite(N) ? N : 0) : null}
            selected={sel}
            proof={proof}
            onPick={(col) => {
              setSelected({ row: r, col })
              setZoomN(null)
            }}
          />
        ))}
      </div>
    </div>
  )

  const zoomPanel = (
    <div className="grid gap-2 border border-border-strong p-2">
      <p className="label m-0">
        Pannello · {spec.label} · <span className="num tracking-normal normal-case">h₁ = {zH1}, N = {nText(zN)}</span>
      </p>
      <div className="relative aspect-[1.5]">
        <Plot
          width={300}
          height={200}
          fill
          xDomain={spec.domain}
          yDomain={[0, spec.yMax]}
          margin={{ top: 10, right: 8, bottom: 30, left: 34 }}
          ariaLabel={`Cella ingrandita: ${spec.label}, h1 = ${zH1}, N = ${nText(zN)}`}
          description={`h_N = ${zh.toFixed(4)}, errore integrato ${zIse.toFixed(4)}.`}
        >
          <LinePath data={zoomXs.map((x) => [x, spec.truth(x)])} role="truth" />
          {Number.isFinite(zN) ? <LinePath data={zoomXs.map((x) => [x, expected(tab, x, zh)])} role="kernel" width={1.5} /> : null}
          {zMl !== null ? <LinePath data={zoomXs.map((x) => [x, normalPdf(x, zMl.mu, zMl.sigma)])} cls={1} width={2} /> : null}
          <LinePath data={zoomXs.map((x, i) => [x, zEst[i]])} role="estimate" width={2.5} />
          {Number.isFinite(zN) ? <SampleTicks samples={samples.slice(0, zN)} /> : null}
          <Axis side="bottom" ticks={4} />
          <Axis side="left" ticks={[0, spec.yMax / 2, spec.yMax]} format={(v) => v.toFixed(1)} />
        </Plot>
      </div>
      <Segmented id={`${uid}-zn`} label="N nel pannello" options={zoomNs.map((n) => ({ value: String(n), label: String(n) }))} value={String(Number.isFinite(zN) ? zN : zoomNs[0])} onChange={(v) => setZoomN(Number(v))} />
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <Readout label="Larghezza" latex="h_N" value={zh} format={f4} />
        <Readout label="Errore integrato" latex="\mathrm{ISE}" value={zIse} format={f4} pinned />
        {tab === 'bimodale' ? <Readout label="Salita del bordo 10-90%" value={rise} format={f3} /> : null}
        <Readout label="Campioni nella finestra" latex="N h_N" value={Number.isFinite(zN) ? zN * zh : Number.POSITIVE_INFINITY} format={f3} />
      </div>
    </div>
  )

  const controls = (
    <>
      <Segmented id={`${uid}-tab`} label="Densità della figura" options={[{ value: 'normale', label: 'Normale' }, { value: 'bimodale', label: 'Bimodale' }]} value={tab} onChange={onTab} />
      <div className="grid gap-1">
        <Toggle id={`${uid}-truth`} label="Densità vera" checked={showTruth} onChange={setShowTruth} />
        <Toggle id={`${uid}-ml`} label="Modello gaussiano (massima verosimiglianza)" hint="Solo nella scheda Bimodale: una campana sola dagli stessi campioni" checked={showML} onChange={setShowML} disabled={tab !== 'bimodale'} />
        <Toggle id={`${uid}-trial`} label="Colonna di prova" checked={trialOn} onChange={setTrialOn} />
      </div>
      {trialOn ? <Slider id={`${uid}-h1`} label="Larghezza iniziale della colonna di prova" latex="h_1" min={TRIAL_H1.min} max={TRIAL_H1.max} step={TRIAL_H1.step} value={trialH1} onChange={setTrialH1} /> : null}
      <div className="flex flex-wrap gap-2">
        <ActionButton onClick={() => setSeed((s) => s + 1)}>
          <Icon d="M5 12a7 7 0 1 0 2-4.9M5 4v4h4" />
          Ricampiona
        </ActionButton>
        <ActionButton onClick={() => sb.goto(PROOF)}>Che cosa dimostra?</ActionButton>
      </div>
      {zoomPanel}
    </>
  )

  const captionBlock = (
    <div className="grid gap-4">
      <StepCaption index={sb.index} total={STEPS.length} label={sb.step.label} text={caption(sb.index, tab)} />
      <div className="grid gap-4 border-t border-border pt-3">
        <Legend
          items={[
            { kind: 'thick', color: 'var(--viz-estimate)', label: 'stima di Parzen' },
            { kind: 'dash', color: 'var(--viz-truth)', label: 'densità vera' },
            { kind: 'line', color: 'var(--viz-kernel)', label: 'media della stima E{p̂} (pannello)' },
            ...(tab === 'bimodale' ? [{ kind: 'line' as const, color: classVar(1), label: 'modello gaussiano ML' }] : []),
          ]}
        />
        <StaticFormula
          label={tab === 'normale' ? 'Slide p62 · normal density, different window widths and numbers of samples' : 'Slide p63 · bimodal distribution'}
          tex={String.raw`h_N=\frac{h_1}{\sqrt{N}},\qquad h_1\in\{1,\ 0.5,\ 0.1\},\qquad N\in\{${spec.rows.slice(0, 3).join(',\\ ')},\ \infty\}`}
        />
        <FormulaBox
          label="La cella del pannello, con i numeri"
          tex={String.raw`\hat{p}(x)=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{h_N}\gamma\left(\frac{x-x_k}{h_N}\right),\quad h_N=\frac{\val{h1}}{\sqrt{\val[0]{N}}}=\val[4]{hN},\quad \mathrm{ISE}=\val[4]{ise}`}
          values={values}
          announce
        />
        <StaticFormula label="Perché converge qualunque sia h₁" tex={String.raw`h_N=\frac{h_1}{\sqrt N}\to 0,\qquad N h_N=h_1\sqrt{N}\to+\infty`} />
        <p className="m-0 text-[length:var(--step--1)] text-muted">
          La slide non dice quale kernel usa: dalla riga <span className="num">N = 1</span>, una campana, si riconosce il gaussiano, come nella figura originale di Duda-Hart. Lo stesso metodo, senza cambiare
          nulla, stima anche una densità bimodale e discontinua che nessun modello gaussiano unimodale può rappresentare; il prezzo è un numero di campioni elevato. Sui bordi del rettangolo la
          media della stima vale circa metà dell'altezza.
        </p>
      </div>
    </div>
  )

  const challenge = (
    <div className="grid gap-4">
      <Segmented id={`${uid}-ans`} label="Il più piccolo N che mostra il bordo" options={TRIAL_NS.map((n) => ({ value: String(n), label: `N = ${n}` }))} value={answer} onChange={setAnswer} />
      <Challenge prompt={PROMPT} hint={HINT} status={status} onCheck={() => setChecked({ key: checkKey, ok: Number(answer) === minimalN() })} />
      {checkedValid !== null ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          {TRIAL_NS.map((n) => (
            <Readout key={n} label={`Salita con N = ${n}`} value={measuredRise(hN(0.5, n))} format={f3} pinned={n === minimalN()} />
          ))}
        </div>
      ) : null}
    </div>
  )

  return (
    <WidgetFrame meta={meta} aspect={narrow ? 0.95 : 1.45} onReset={reset} transport={<PlayControls sb={sb} steps={STEPS} />} caption={captionBlock} controls={controls} challenge={challenge}>
      {grid}
    </WidgetFrame>
  )
}

interface RowCellsProps {
  N: number
  r: number
  cols: readonly number[]
  cells: readonly { est: number[]; h: number }[]
  tab: Tab
  xs: readonly number[]
  revealed: number
  showTruth: boolean
  ml: { mu: number; sigma: number } | null
  selected: Selected
  proof: boolean
  onPick: (col: number) => void
}

/** Una riga della griglia: l'intestazione N e le celle, ciascuna un pulsante che apre il pannello. */
function RowCells({ N, r, cols, cells, tab, xs, revealed, showTruth, ml, selected, proof, onPick }: RowCellsProps) {
  const inf = !Number.isFinite(N)
  return (
    <>
      <div className={`num flex items-center text-[length:var(--step--1)] ${inf && proof ? 'font-bold text-text' : 'text-muted'}`}>N = {nText(N)}</div>
      {cols.map((h1, c) => {
        const idx = r * cols.length + c
        const shown = idx < revealed
        const isSel = selected.row === r && selected.col === c
        const h = cells[c]?.h ?? 0
        return (
          <button
            key={c}
            type="button"
            data-cell={`${r}-${c}`}
            aria-pressed={isSel}
            aria-label={`Cella N = ${nText(N)}, h1 = ${h1}: h_N = ${inf ? 'tende a 0' : h.toFixed(3)}. Apri nel pannello`}
            onClick={() => onPick(c)}
            className={`relative min-h-0 min-w-0 cursor-pointer border bg-surface p-0 text-left ${isSel ? 'border-2 border-border-strong' : 'border-border'} ${inf && proof ? 'outline-2 outline-offset-1 outline-pin' : ''}`}
          >
            {shown ? <CellPlot tab={tab} xs={xs} est={cells[c]?.est ?? null} truth={showTruth && !inf} ml={inf ? null : ml} ariaLabel={`Stima con N = ${nText(N)} e h1 = ${h1}`} /> : null}
            <span className="num pointer-events-none absolute top-0.5 right-1 text-[10px] leading-none text-muted">{inf ? 'h_N → 0' : `h_N = ${h < 0.01 ? h.toFixed(4) : h.toFixed(3)}`}</span>
            {isSel ? <span aria-hidden="true" className="absolute top-0.5 left-0.5 size-2.5 border border-border-strong bg-pin" /> : null}
          </button>
        )
      })}
    </>
  )
}
