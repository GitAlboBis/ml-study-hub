// Vetrina privata della base comune dei motori (src/widgets/engines/shared): serve a guardare i pezzi comuni
// montati come li monterà un motore, nei due temi e a 390 px (node scripts/snap.mjs lab/vetrina-shared …).
// La cartella comincia con "_": il registry lo carica per id ma non lo elenca fra i widget dell'app.
import { useId, useMemo, useState } from 'react'
import { ActionButton } from '../kit/ActionButton'
import { fixed } from '../kit/format'
import { Axis } from '../kit/plot/Axis'
import { AreaPath } from '../kit/plot/AreaPath'
import { LinePath } from '../kit/plot/LinePath'
import { Plot } from '../kit/plot/Plot'
import { PlayControls } from '../kit/PlayControls'
import { StepCaption } from '../kit/StepCaption'
import { useStoryboard } from '../kit/useStoryboard'
import { WidgetFrame } from '../kit/WidgetFrame'
import type { WidgetMeta } from '../types'
import {
  ChallengeRunner,
  FormulaList,
  Gauge,
  InsightLamps,
  LinkedCursorMark,
  LinkedPanels,
  ParamChart,
  ParamSlider,
  SciCounter,
  TabStrip,
  Thermometer,
  captionOf,
  resolveEngineSteps,
  snapParam,
  summarize,
  tabElementId,
  useMonteCarlo,
} from '../engines/shared'
import type { CommonChallenge, EngineFormula, EngineStep, Insight, ParamSpec } from '../engines/shared'
import { NS, vetrinaReplica } from './vetrina-replica'

// oxlint-disable-next-line react/only-export-components -- `meta` è parte del contratto dei file *.widget.tsx (src/widgets/types.ts)
export const meta: WidgetMeta = {
  id: 'vetrina-shared',
  moduleId: '_vetrina',
  title: 'Vetrina della base comune dei motori',
  concepts: [],
  scenario: 'sensori',
  scenarioNote: 'Letture di un sensore con rumore gaussiano: la media di N letture come stimatore',
  size: 'L',
}

const SIGMA: ParamSpec = { id: 'sigma', label: 'Rumore del sensore $\\sigma$', en: 'noise standard deviation', min: 0.5, max: 3, initial: 2, step: 0.1, unit: '°C' }
const NPARAM: ParamSpec = { id: 'n', label: 'Letture per stima $N$', en: 'sample size', min: 2, max: 500, initial: 20, scale: 'log', step: 1 }

interface Ctx {
  n: number
  s2: number
}
interface State {
  n: number
  sigma: number
  ratio: number
  reps: number
}
type Phase = { kind: 'overview' } | { kind: 'build' } | { kind: 'explore' }

const STEPS: EngineStep<Phase, Ctx>[] = [
  { id: 'q', label: 'Il quadro', phase: { kind: 'overview' }, durationMs: 1200, caption: 'La varianza della media di $N$ letture contro $N$, in scala logaritmica: il pavimento $\\sigma^2/N$ tratteggiato e le stime Monte Carlo.' },
  { id: 'b', label: 'Il pavimento si costruisce', phase: { kind: 'build' }, durationMs: 2400, caption: (c) => `Da $N = 2$ a $N = 500$ la varianza scende come $1/N$: con $\\sigma^2 = ${c.s2.toFixed(2)}$ a $N = ${c.n}$ vale $${(c.s2 / c.n).toFixed(3)}$.` },
  { id: 'e', label: 'Esplora', phase: { kind: 'explore' }, durationMs: 0, caption: 'Aggiungi training set e cambia $\\sigma$: le barre d\'errore si stringono con le repliche.' },
]

const FORMULAS: EngineFormula<Ctx>[] = [
  { id: 'var', label: 'Varianza della media', tex: '\\operatorname{var}(\\hat\\mu_N)=\\frac{\\sigma^2}{N}=\\frac{\\val[2]{s2}}{\\val[0]{N}}=\\val[4]{bound}' },
  { id: 'mc', label: 'Stima Monte Carlo', tex: '\\widehat{\\operatorname{var}}=\\val[4]{mc}\\qquad \\frac{\\widehat{\\operatorname{var}}}{\\sigma^2/N}=\\val[3]{ratio}' },
]

const INSIGHTS: Insight<State>[] = [
  { id: 'eff', label: 'La media tocca il pavimento: stimatore **efficiente**', en: 'efficient estimator', when: (s) => Number.isFinite(s.ratio) && Math.abs(s.ratio - 1) < 0.1, tone: 'ok' },
  { id: 'few', label: 'Pochi training set: la stima della varianza è incerta', en: 'few replicates', when: (s) => s.reps < 50, tone: 'warn' },
  { id: 'big', label: '$N \\ge 100$: la media è quasi deterministica', when: (s) => s.n >= 100 },
]

const COMPUTE: CommonChallenge<State> = {
  kind: 'compute',
  prompt: 'Con il rumore e il numero di letture scelti, quanto vale la varianza minima $\\sigma^2/N$?',
  hint: 'Eleva al quadrato $\\sigma$ e dividi per $N$.',
  answer: (s) => (s.sigma * s.sigma) / s.n,
  tolerance: 0.001,
  unit: '°C²',
}

function EstimatorFrame() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [sigma, setSigma] = useState(SIGMA.initial)
  const [n, setN] = useState(NPARAM.initial)
  const [tab, setTab] = useState('mc')
  const s2 = sigma * sigma
  // le repliche girano nel worker (modo 'always'): la prova nel browser del calcolo fuori dal thread principale
  const mc = useMonteCarlo({
    seed: 7,
    resetKey: String(sigma),
    replicate: (rng, i) => vetrinaReplica(rng, i, { sigma }),
    worker: { create: () => new Worker(new URL('./vetrina.worker.ts', import.meta.url), { type: 'module' }), params: { sigma }, mode: 'always' },
  })
  const points = useMemo(() => {
    if (mc.count < 2) return []
    return NS.map((k, j) => {
      const s = summarize(mc.results.map((r) => r[j]))
      const half = 1.96 * s.variance * Math.sqrt(2 / (s.n - 1))
      return { x: k, y: s.variance, lo: Math.max(1e-6, s.variance - half), hi: s.variance + half }
    })
  }, [mc.count, mc.results])
  const nearest = NS.reduce((a, b) => (Math.abs(Math.log(b / n)) < Math.abs(Math.log(a / n)) ? b : a))
  const at = points.find((p) => p.x === nearest)
  const ratio = at !== undefined ? at.y / (s2 / nearest) : Number.NaN
  const state: State = { n, sigma, ratio, reps: mc.count }

  const ctx: Ctx = { n, s2 }
  const steps = resolveEngineSteps(STEPS, ctx)
  const sb = useStoryboard(steps)
  const phase = STEPS[sb.index].phase
  const upTo = phase.kind === 'build' ? 2 * 250 ** sb.progress : Number.POSITIVE_INFINITY
  const values = { s2, N: n, bound: s2 / n, mc: at?.y, ratio }

  return (
    <WidgetFrame
      meta={meta}
      aspect={1.7}
      onReset={() => {
        sb.reset()
        setSigma(SIGMA.initial)
        setN(NPARAM.initial)
        mc.reset(7)
      }}
      transport={<PlayControls sb={sb} steps={steps} />}
      caption={
        <div className="grid gap-4">
          <StepCaption index={sb.index} total={steps.length} label={sb.step.label} text={captionOf(STEPS[sb.index], ctx)} />
          <div className="border-t border-border pt-3">
            <FormulaList formulas={FORMULAS} ctx={ctx} values={values} />
          </div>
        </div>
      }
      controls={
        <>
          <ParamSlider spec={SIGMA} value={sigma} onChange={setSigma} />
          <ParamSlider spec={NPARAM} value={n} onChange={setN} />
          <div className="flex flex-wrap gap-2">
            <ActionButton variant="primary" onClick={() => mc.run(100)}>
              +100 training set
            </ActionButton>
            <ActionButton onClick={() => mc.run(1000)}>+1000</ActionButton>
            <ActionButton onClick={mc.stop} disabled={!mc.running}>
              Ferma
            </ActionButton>
          </div>
          <div className="grid grid-cols-2 items-start gap-4">
            <Gauge label="Varianza / pavimento" latex="\tfrac{\widehat{\mathrm{var}}}{\sigma^2/N}" value={ratio} min={0.5} max={2} log target={[0.9, 1.1]} format={fixed(2)} pinned />
            <Thermometer label="Varianza stimata" latex="\widehat{\mathrm{var}}" value={at?.y ?? 0} min={0} max={Math.max(0.05, (s2 / nearest) * 2)} markers={[{ value: s2 / nearest, label: 'σ²/N' }]} format={fixed(3)} />
          </div>
          <SciCounter label={mc.inWorker ? 'Letture simulate (nel worker)' : 'Letture simulate'} latex="R\sum N" value={mc.count * NS.reduce((a, b) => a + b, 0)} />
          <InsightLamps insights={INSIGHTS} state={state} />
        </>
      }
      challenge={<ChallengeRunner challenge={COMPUTE} state={state} stateKey={`${sigma}|${n}`} />}
    >
      <div className="absolute inset-0 grid grid-rows-[auto_minmax(0,1fr)] bg-surface">
        <div className="px-3 pt-2">
          <TabStrip id={`${uid}-tabs`} label="Vista" value={tab} onChange={setTab} panelId={`${uid}-panel`} tabs={[{ id: 'mc', label: 'Monte Carlo' }, { id: 'teoria', label: 'Solo il pavimento', en: 'Cramér-Rao bound' }]} />
        </div>
        <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={tabElementId(`${uid}-tabs`, tab)} className="min-h-0 overflow-hidden px-2 pt-1">
          <ParamChart
            x={{ label: 'letture', symbol: 'N', domain: [2, 500], log: true }}
            y={{ label: 'varianza', symbol: 'var', domain: [1e-3, 10], log: true }}
            curves={[{ id: 'crb', label: 'Pavimento σ²/N', latex: '\\sigma^2/N', role: 'truth', f: (k) => s2 / k }]}
            points={tab === 'mc' ? [{ id: 'mc', label: 'Media campionaria', cls: 1, data: points }] : []}
            current={{ value: n }}
            upTo={upTo}
            // il cursore legge e sceglie solo valori dello slider di N
            snap={(v) => snapParam(NPARAM, v)}
            onPick={setN}
            ariaLabel="Varianza della media contro il numero di letture"
            width={720}
            height={330}
            fill
          />
        </div>
      </div>
    </WidgetFrame>
  )
}

// --- seconda cornice: pannelli collegati e sfide a previsione e a smistamento ---

const meta2: WidgetMeta = { ...meta, id: 'vetrina-shared-2', title: 'Pannelli collegati, schede e sfide', scenarioNote: 'Luminosità di salmoni e spigole: due densità di classe e il loro log-rapporto' }
const gauss = (x: number, m: number, s: number) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI))
const laplace = (x: number, m: number, b: number) => Math.exp(-Math.abs(x - m) / b) / (2 * b)
const XS = Array.from({ length: 241 }, (_, i) => i / 24)

const PREDICT: CommonChallenge<{ cross: number }> = { kind: 'predict', prompt: 'Prima di guardare il log-rapporto: dove si annulla, cioè dove $p(x|\\omega_1)=p(x|\\omega_2)$?', input: 'number', truth: (s) => s.cross, tolerance: 0.25, points: 'distance' }
const SORT: CommonChallenge<{ cross: number }> = {
  kind: 'sort',
  prompt: 'Smista gli stimatori fra parametrici e non parametrici.',
  items: [
    { id: 'gauss', label: 'Fit gaussiano ML' },
    { id: 'knn', label: 'K-NN' },
    { id: 'parzen', label: 'Finestra di Parzen $h$' },
  ],
  bins: [
    { id: 'p', label: 'Parametrico' },
    { id: 'np', label: 'Non parametrico' },
  ],
  answer: { gauss: 'p', knn: 'np', parzen: 'np' },
}

function LinkedFrame() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [family, setFamily] = useState('gauss')
  const f = family === 'gauss' ? gauss : laplace
  const p1 = XS.map((x) => [x, f(x, 3.5, 1)])
  const p2 = XS.map((x) => [x, f(x, 6, 1.2)])
  const lr = XS.map((x) => [x, Math.log(f(x, 3.5, 1) / f(x, 6, 1.2))])
  const cross = XS.find((_x, i) => i > 0 && Math.sign(lr[i][1]) !== Math.sign(lr[i - 1][1])) ?? 4.7
  return (
    <WidgetFrame meta={meta2} aspect={0.9} challenge={<div className="grid gap-8"><ChallengeRunner challenge={PREDICT} state={{ cross }} stateKey={family} /><ChallengeRunner challenge={SORT} state={{ cross }} stateKey="" /></div>}>
      <div className="absolute inset-0 grid grid-rows-[auto_minmax(0,1fr)] bg-surface">
        <div className="px-3 pt-2">
          <TabStrip id={`${uid}-fam`} label="Famiglia" value={family} onChange={setFamily} tabs={[{ id: 'gauss', label: 'Gaussiana', en: 'Gaussian' }, { id: 'lap', label: 'Laplace $e^{-|x|/b}$', en: 'Laplacian' }]} />
        </div>
        <div className="min-h-0 px-3 py-2">
          <LinkedPanels
            label="Densità e log-rapporto"
            defaultCursor={{ x: 4 }}
            fill
            panels={[
              {
                id: 'dens',
                title: 'Densità di classe $p(x|\\omega_i)$',
                en: 'class-conditional densities',
                content: ({ onCursor, last, fill }) => (
                  <Plot fill={fill} width={640} height={150} xDomain={[0, 10]} yDomain={[0, 0.45]} ariaLabel="Densità di classe" cursor="x" onCursor={onCursor} margin={{ top: 8, right: 12, bottom: last ? 34 : 12, left: 44 }}>
                    <AreaPath data={p1} cls={0} marker={false} />
                    <AreaPath data={p2} cls={1} marker={false} />
                    <LinePath data={p1} cls={0} />
                    <LinePath data={p2} cls={1} />
                    <Axis side="left" ticks={3} />
                    <Axis side="bottom" values={last} />
                    <LinkedCursorMark />
                  </Plot>
                ),
              },
              {
                id: 'lr',
                title: 'Log-rapporto $\\ln L(x)$',
                en: 'log-likelihood ratio',
                content: ({ onCursor, last, fill }) => (
                  <Plot fill={fill} width={640} height={150} xDomain={[0, 10]} yDomain={[-8, 8]} ariaLabel="Log-rapporto di verosimiglianza" cursor="x" onCursor={onCursor} margin={{ top: 8, right: 12, bottom: last ? 34 : 12, left: 44 }}>
                    <LinePath data={lr} role="estimate" />
                    <Axis side="left" ticks={3} />
                    <Axis side="bottom" values={last} />
                    <LinkedCursorMark />
                  </Plot>
                ),
              },
              {
                // un pannello su un altro asse: lo scarto dalla media di ω₁ in deviazioni standard, z = (x − 3.5)/1
                id: 'z',
                title: 'Scarto standardizzato $z = (x-\\mu_1)/\\sigma_1$',
                en: 'z-score',
                map: { toPanel: (p) => ({ x: p.x - 3.5 }), toShared: (p) => ({ x: p.x + 3.5 }) },
                content: ({ onCursor, last, fill }) => (
                  <Plot fill={fill} width={640} height={150} xDomain={[-3.5, 6.5]} yDomain={[0, 0.45]} ariaLabel="Densità di ω₁ contro z" cursor="x" onCursor={onCursor} margin={{ top: 8, right: 12, bottom: last ? 34 : 12, left: 44 }}>
                    <LinePath data={XS.map((x) => [x - 3.5, gauss(x - 3.5, 0, 1)])} cls={0} />
                    <Axis side="left" ticks={2} />
                    <Axis side="bottom" values={last} label="scarto" symbol="z" />
                    <LinkedCursorMark />
                  </Plot>
                ),
              },
            ]}
          />
        </div>
      </div>
    </WidgetFrame>
  )
}

export default function VetrinaShared() {
  return (
    <div className="grid gap-10">
      <EstimatorFrame />
      <LinkedFrame />
    </div>
  )
}
