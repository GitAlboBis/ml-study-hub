// Widget m09-convergenza-parzen-knn ("V = 1/√N contro K = √N: convergono entrambi?"), concetto c69.
// L'illustrazione della slide p46 in due file di cinque riquadri (N = 1, 4, 9, 16, 100) sugli stessi pixel di suolo
// nudo: in alto Parzen, cerchio di area V = 1/√N centrato in x* (si restringe qualunque siano i dati); in basso il
// K-NN, cerchio fino al K-esimo vicino con K = √N (si adatta ai dati). Sotto ogni riquadro K, V e K/(N·V). A lato
// quattro spie per le due coppie di condizioni e la traccia di p̂(x*) contro N con il valore vero 2.65.
//
// MOTO. La corsa di N sui quadrati perfetti (600 ms a passo) e le leggi sbagliate sono passi dello storyboard: i
// riquadri compaiono man mano e la traccia si allunga. Con reduced motion ogni passo è il suo stato finale.
// Selettori, x*, ricampionamento: nessuna animazione.
import { useId, useMemo, useState } from 'react'
import { M } from '../../components/content/M'
import { ActionButton } from '../kit/ActionButton'
import { Challenge } from '../kit/Challenge'
import type { ChallengeStatus } from '../kit/Challenge'
import { fixed } from '../kit/format'
import { PlayControls } from '../kit/PlayControls'
import { Axis } from '../kit/plot/Axis'
import { Dots } from '../kit/plot/Dots'
import { LinePath } from '../kit/plot/LinePath'
import { classVar } from '../kit/plot/marks'
import { Plot } from '../kit/plot/Plot'
import { Readout } from '../kit/Readout'
import { Segmented } from '../kit/Segmented'
import { Slider } from '../kit/Slider'
import { StepCaption } from '../kit/StepCaption'
import { useStoryboard } from '../kit/useStoryboard'
import { WidgetFrame } from '../kit/WidgetFrame'
import type { WidgetMeta } from '../types'
import {
  BOXES,
  KNN_LAWS,
  PARZEN_LAWS,
  SEED,
  WALK,
  WALK_MS,
  X_STAR,
  expected,
  kOf,
  knnCell,
  knnLimits,
  parzenCell,
  parzenLimits,
  pool,
  trace,
  truth,
  volumeOf,
} from './convergenza'
import type { ErrKind, KnnCond, KnnLaw, ParzenCond, ParzenLaw, Pt } from './convergenza'
import { useNarrow } from './proprieta/hooks'
import { RefLine } from './proprieta/marks'
import type { Limit } from './proprieta/teoria'
import { FormulaBox, Icon, Legend, OverlayCard, Spia, StaticFormula } from './proprieta/ui'
import type { SpiaState } from './proprieta/ui'

export const meta: WidgetMeta = {
  id: 'm09-convergenza-parzen-knn',
  moduleId: 'm09-parzen-windows',
  title: 'V = 1/√N contro K = √N: convergono entrambi?',
  concepts: ['c69'],
  scenario: 'telerilevamento',
  scenarioNote: 'Etichettatura a terra del «suolo nudo»: pixel in due bande normalizzate, densità stimata nella firma x*',
  size: 'L',
}

const f0 = fixed(0)
const f2 = fixed(2)
const KNN_CLASS = 4

const STEPS = [
  { id: 'quadro', label: 'Il quadro: le due file della slide p46', durationMs: 1500 },
  { id: 'corsa', label: 'N cresce: 1, 4, 9, …, 100', durationMs: WALK.length * WALK_MS },
  { id: 'spie', label: 'Quattro spie, due coppie di condizioni', durationMs: 1800 },
  { id: 'costanti', label: 'Leggi sbagliate: V costante, K costante', durationMs: 1800 },
  { id: 'estreme', label: 'Leggi sbagliate: V = 1/N, K = N/2', durationMs: 1800 },
  { id: 'ponte', label: 'Il ponte con Parzen', durationMs: 2000 },
]
const WALK_STEP = 1
const IMPOSED: Record<number, { p: ParzenLaw; k: KnnLaw } | undefined> = { 3: { p: 'costante', k: 'tre' }, 4: { p: 'inverso', k: 'meta' } }
const BRIDGE = 5

function caption(index: number, p: number): string {
  switch (index) {
    case 0:
      return String.raw`Pixel etichettati «suolo nudo» nel piano di due bande normalizzate, $N = 1, 4, 9, 16, 100$ (gli stessi campioni in colonna). Fila alta, **Parzen**: cerchio centrato in $\mathbf x^* = (0.5, 0.5)$ di area $V = 1/\sqrt N$, raggio $\sqrt{V/\pi}$ = 0.56, 0.40, 0.33, 0.28, 0.18 (con $N = 1$ deborda, come nella slide). Fila bassa, **K-NN**: cerchio fino al $K$-esimo vicino con $K = \sqrt N$ = 1, 2, 3, 4, 10. Il valore vero è $p(\mathbf x^*) = ${f2(p)}$.`
    case 1:
      return String.raw`$N$ percorre i quadrati perfetti da 1 a 100, ${WALK_MS} ms a passo, con nuovi campioni a ogni passo. In alto il cerchio si restringe in modo **deterministico**, qualunque siano i campioni, e il $K$ catturato oscilla (a volte 0); in basso il cerchio "respira" finché tocca il $K$-esimo vicino. Nella traccia a lato entrambe le stime oscillano sempre meno attorno al valore vero.`
    case 2:
      return String.raw`Le quattro spie: per Parzen $V_N \to 0$ e $N V_N \to +\infty$, per il K-NN $K_N/N \to 0$ e $K_N \to +\infty$. Con le leggi del docente sono tutte verdi: $N V_N = \sqrt N$ e $K_N/N = 1/\sqrt N$. Il numero medio di campioni nel cerchio di Parzen, circa $\sqrt N\,p(\mathbf x^*)$, è dello stesso ordine di $K = \sqrt N$.`
    case 3:
      return String.raw`$V$ costante = 0.3: la prima spia di Parzen è rossa e la traccia si stabilizza su un valore diverso da ${f2(p)}$ (bias: la media locale di $p$ sul cerchio). $K = 3$ costante: la spia $K_N \to +\infty$ è rossa, la traccia del K-NN non smette di oscillare (varianza).`
    case 4:
      return String.raw`$V = 1/N$: $N V_N = 1$, seconda spia di Parzen rossa, nel cerchio cadono sempre pochi campioni e la traccia oscilla (varianza). $K = N/2$: la spia $K_N/N \to 0$ è rossa, il cerchio copre sempre metà dei campioni (bias).`
    default:
      return String.raw`Il ponte fra gli esempi del docente: $h_N = 1/\sqrt[2n]{N}$ in $n = 2$ dà $V_N = h_N^n = 1/\sqrt N$, esattamente l'etichetta della fila alta della slide p46, accanto a $K(N) = \sqrt N$ della slide p47. Le due coppie di condizioni chiedono la stessa cosa vista dai due lati di $K \approx N V p(\mathbf x^*)$: una regione che si restringe (via il bias) ma contiene sempre più campioni (via la varianza).`
  }
}

const PROMPT = String.raw`Prima di premere Play, prevedi: con la legge $V = 1/N$ quale spia di Parzen diventa rossa, e l'errore che resta è bias o varianza? E con $K = N/2$ per il K-NN? Scegli e premi Verifica; poi controlla con il passo "Leggi sbagliate".`
const HINT = String.raw`Restringere la regione toglie il **bias**; riempirla di campioni toglie la **varianza**. Con $V = 1/N$ il prodotto $N V_N$ resta 1; con $K = N/2$ il rapporto $K_N/N$ resta 0.5.`

const limState = (l: Limit, want: Limit): SpiaState => (l === want ? 'ok' : 'ko')
const LIM_WORD: Record<Limit, string> = { zero: '→ 0', const: 'costante', inf: '→ +∞' }

/** Un riquadro [0, 1]² con i campioni, x*, il cerchio del metodo e le sue letture sotto. */
function Box({ N, samples, x, mode, V, K, r, p, neighbors, shown }: { N: number; samples: readonly Pt[]; x: Pt; mode: 'parzen' | 'knn'; V: number; K: number; r: number; p: number; neighbors: readonly number[]; shown: boolean }) {
  const S = (v: number) => 4 + v * 92
  const Y = (v: number) => 96 - v * 92
  const lit = new Set(neighbors)
  return (
    <figure className="m-0 grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto] gap-0.5">
      <svg viewBox="0 0 100 100" className="block h-full w-full overflow-visible" role="img" aria-label={`${mode === 'parzen' ? 'Parzen' : 'K-NN'}, N = ${N}: K = ${K}, V = ${V.toFixed(3)}, stima ${p.toFixed(2)}`}>
        <rect x={4} y={4} width={92} height={92} fill="var(--surface)" stroke="var(--viz-axis)" />
        {shown ? (
          <>
            {samples.map((s, i) =>
              s[0] >= 0 && s[0] <= 1 && s[1] >= 0 && s[1] <= 1 ? <circle key={i} cx={S(s[0])} cy={Y(s[1])} r={mode === 'knn' && lit.has(i) ? 2.6 : 1.8} fill={mode === 'knn' && lit.has(i) ? classVar(KNN_CLASS) : 'var(--viz-sample)'} /> : null,
            )}
            <circle data-cell-circle={mode} cx={S(x[0])} cy={Y(x[1])} r={r * 92} fill="none" stroke={mode === 'parzen' ? 'var(--viz-estimate)' : classVar(KNN_CLASS)} strokeWidth={1.6} />
            <path d={`M${S(x[0]) - 3},${Y(x[1])}h6M${S(x[0])},${Y(x[1]) - 3}v6`} stroke="var(--pin-contrast)" strokeWidth={1.5} />
          </>
        ) : null}
      </svg>
      <figcaption className="num text-center text-[10px] leading-tight text-muted">
        {shown ? (
          <>
            N = {N} · K = {K}
            <br />V = {V < 0.01 ? V.toExponential(1) : V.toFixed(3)} · p̂ = {p.toFixed(2)}
          </>
        ) : (
          <>N = {N}</>
        )}
      </figcaption>
    </figure>
  )
}

export default function M09ConvergenzaParzenKnn() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [pLawUser, setPLawUser] = useState<ParzenLaw>('radice')
  const [kLawUser, setKLawUser] = useState<KnnLaw>('radice')
  const [x, setX] = useState<Pt>(X_STAR)
  const [seed, setSeed] = useState(SEED)
  const [ans, setAns] = useState<{ p: ParzenCond; pe: ErrKind; k: KnnCond; ke: ErrKind }>({ p: 'V', pe: 'bias', k: 'K', ke: 'varianza' })
  const [takeoverAt, setTakeoverAt] = useState<number | null>(null)
  const [checked, setChecked] = useState<{ key: string; ok: boolean } | null>(null)
  const [terrainRef, narrow] = useNarrow(560)

  const sb = useStoryboard(STEPS)
  const progress = sb.progress
  const imposed = IMPOSED[sb.index] !== undefined && takeoverAt !== sb.index ? IMPOSED[sb.index] : undefined
  const pLaw = imposed?.p ?? pLawUser
  const kLaw = imposed?.k ?? kLawUser
  const takeOver = () => {
    if (imposed !== undefined) {
      sb.pause()
      setTakeoverAt(sb.index)
      setPLawUser(imposed.p)
      setKLawUser(imposed.k)
    }
  }
  const walkN = sb.index === WALK_STEP ? WALK[Math.min(WALK.length - 1, Math.floor(progress * WALK.length))] : WALK[WALK.length - 1]

  const all = useMemo(() => pool(seed), [seed])
  const pTrue = truth(x)
  const cells = BOXES.map((N) => {
    const s = all.slice(0, N)
    return { N, s, pz: parzenCell(x, s, volumeOf(pLaw, N)), kn: knnCell(x, s, kOf(kLaw, N)) }
  })
  const tr = useMemo(() => trace(x, all, pLaw, kLaw), [x, all, pLaw, kLaw])
  const trShown = tr.filter((t) => t.N <= walkN)
  const pl = parzenLimits(pLaw)
  const kl = knnLimits(kLaw)
  const last = cells[cells.length - 1]
  const values = { N: last.N, V: last.pz.V, Kp: last.pz.K, pp: last.pz.p, K: last.kn.K, VK: last.kn.V, pk: last.kn.p, NV: last.N * last.pz.V, KN: last.kn.K / last.N }

  const exp = expected()
  const checkKey = `${ans.p}|${ans.pe}|${ans.k}|${ans.ke}`
  const checkedValid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = checkedValid === null ? 'idle' : checkedValid.ok ? 'ok' : 'ko'

  const reset = () => {
    sb.reset()
    setPLawUser('radice')
    setKLawUser('radice')
    setX(X_STAR)
    setSeed(SEED)
    setAns({ p: 'V', pe: 'bias', k: 'K', ke: 'varianza' })
    setTakeoverAt(null)
    setChecked(null)
  }

  const terrain = (
    <div ref={terrainRef} className="absolute inset-0 p-2">
      <div className="grid h-full w-full gap-x-1.5 gap-y-1" style={{ gridTemplateColumns: `${narrow ? '2.8rem' : '5.5rem'} repeat(5, minmax(0, 1fr))`, gridTemplateRows: 'minmax(0,1fr) minmax(0,1fr)' }}>
        <div className="grid content-center gap-1 text-[length:var(--step--1)]">
          <span className="label">Parzen</span>
          <span aria-hidden="true">
            <M tex={PARZEN_LAWS[pLaw].tex} />
          </span>
        </div>
        {cells.map((c) => (
          <Box key={`p${c.N}`} N={c.N} samples={c.s} x={x} mode="parzen" V={c.pz.V} K={c.pz.K} r={c.pz.r} p={c.pz.p} neighbors={[]} shown={c.N <= walkN} />
        ))}
        <div className="grid content-center gap-1 text-[length:var(--step--1)]">
          <span className="label">K-NN</span>
          <span aria-hidden="true">
            <M tex={KNN_LAWS[kLaw].tex} />
          </span>
        </div>
        {cells.map((c) => (
          <Box key={`k${c.N}`} N={c.N} samples={c.s} x={x} mode="knn" V={c.kn.V} K={c.kn.K} r={c.kn.r} p={c.kn.p} neighbors={c.kn.neighbors} shown={c.N <= walkN} />
        ))}
      </div>
      {sb.index === BRIDGE ? (
        <OverlayCard title="Il ponte fra Parzen e K-NN" className={narrow ? 'inset-x-2 top-2' : 'top-3 left-1/4 w-[min(30rem,60%)]'}>
          <M tex={String.raw`h_N=\frac{1}{\sqrt[2n]{N}}\ \Rightarrow\ V_N=h_N^n=\frac{1}{\sqrt{N}},\qquad K(N)=\sqrt{N}`} display />
          <table className="w-full border-collapse text-[length:var(--step--1)]">
            <tbody>
              <tr className="border-b border-border">
                <td className="py-1 pr-2">restringere la regione (via il bias)</td>
                <td className="py-1 pr-2">
                  <M tex="V_N\to 0" />
                </td>
                <td className="py-1">
                  <M tex="K_N/N\to 0" />
                </td>
              </tr>
              <tr>
                <td className="py-1 pr-2">riempirla di campioni (via la varianza)</td>
                <td className="py-1 pr-2">
                  <M tex="N V_N\to+\infty" />
                </td>
                <td className="py-1">
                  <M tex="K_N\to+\infty" />
                </td>
              </tr>
            </tbody>
          </table>
        </OverlayCard>
      ) : null}
    </div>
  )

  const tracePlot = (
    <div className="relative aspect-[1.5]">
      <Plot width={300} height={200} fill xDomain={[0, 10]} yDomain={[0, 7]} margin={{ top: 20, right: 8, bottom: 32, left: 34 }} ariaLabel="Stima nel punto x* contro N per Parzen e K-NN, con il valore vero" description={`Valore vero ${f2(pTrue)}.`}>
        <RefLine y={pTrue} dashed color="var(--viz-truth)" label={`p(x*) = ${f2(pTrue)}`} anchor="end" width={1.75} />
        <LinePath data={trShown.map((t) => [Math.sqrt(t.N), t.parzen])} role="estimate" width={2} />
        <LinePath data={trShown.map((t) => [Math.sqrt(t.N), t.knn])} cls={KNN_CLASS} width={2} />
        <Dots data={trShown.map((t) => ({ x: Math.sqrt(t.N), y: Math.min(7, t.parzen), id: `p${t.N}`, label: `Parzen, N = ${t.N}` }))} role="estimate" r={4} />
        <Dots data={trShown.map((t) => ({ x: Math.sqrt(t.N), y: Math.min(7, t.knn), cls: KNN_CLASS, id: `k${t.N}`, label: `K-NN, N = ${t.N}` }))} r={4} />
        <Axis side="bottom" ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} format={(v) => (v % 3 === 1 || v === 10 ? String(v * v) : '')} symbol="N" />
        <Axis side="left" ticks={[0, 2, 4, 6]} symbol="p̂(x*)" />
      </Plot>
    </div>
  )

  const controls = (
    <>
      <Segmented
        id={`${uid}-pl`}
        label="Legge per Parzen"
        options={(Object.keys(PARZEN_LAWS) as ParzenLaw[]).map((l) => ({ value: l, label: PARZEN_LAWS[l].label }))}
        value={pLaw}
        onChange={(v) => {
          takeOver()
          setPLawUser(v)
        }}
      />
      <Segmented
        id={`${uid}-kl`}
        label="Legge per il K-NN"
        options={(Object.keys(KNN_LAWS) as KnnLaw[]).map((l) => ({ value: l, label: KNN_LAWS[l].label }))}
        value={kLaw}
        onChange={(v) => {
          takeOver()
          setKLawUser(v)
        }}
      />
      <div className="grid grid-cols-2 gap-2">
        <Spia tex="V_N\to 0?" spoken="V con N tende a zero?" state={limState(pl.V, 'zero')} detail={<>V {LIM_WORD[pl.V]}</>} />
        <Spia tex="N V_N\to+\infty?" spoken="N per V tende a più infinito?" state={limState(pl.NV, 'inf')} detail={<>N·V {LIM_WORD[pl.NV]}</>} />
        <Spia tex="K_N/N\to 0?" spoken="K su N tende a zero?" state={limState(kl.KN, 'zero')} detail={<>K/N {LIM_WORD[kl.KN]}</>} />
        <Spia tex="K_N\to+\infty?" spoken="K tende a più infinito?" state={limState(kl.K, 'inf')} detail={<>K {LIM_WORD[kl.K]}</>} />
      </div>
      {tracePlot}
      <Legend
        items={[
          { kind: 'thick', color: 'var(--viz-estimate)', label: 'Parzen (V fissato dalla legge)' },
          { kind: 'thick', color: classVar(KNN_CLASS), label: 'K-NN (K fissato dalla legge)' },
          { kind: 'dash', color: 'var(--viz-truth)', label: 'valore vero p(x*)' },
        ]}
      />
      <Slider id={`${uid}-x1`} label="x* banda 1" latex="x^*_1" min={0.1} max={0.9} step={0.05} value={x[0]} onChange={(v) => setX([v, x[1]])} />
      <Slider id={`${uid}-x2`} label="x* banda 2" latex="x^*_2" min={0.1} max={0.9} step={0.05} value={x[1]} onChange={(v) => setX([x[0], v])} />
      <div className="flex flex-wrap gap-2">
        <ActionButton onClick={() => setSeed((s) => s + 1)}>
          <Icon d="M5 12a7 7 0 1 0 2-4.9M5 4v4h4" />
          Ricampiona
        </ActionButton>
        <ActionButton onClick={() => sb.goto(BRIDGE)}>Ponte con Parzen</ActionButton>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="Valore vero" latex="p(\mathbf x^*)" value={pTrue} format={f2} pinned />
        <Readout label="N percorso" value={walkN} format={f0} />
      </div>
    </>
  )

  const captionBlock = (
    <div className="grid gap-4">
      <StepCaption index={sb.index} total={STEPS.length} label={sb.step.label} text={caption(sb.index, pTrue)} />
      <div className="grid gap-4 border-t border-border pt-3">
        <StaticFormula label="Le leggi dell'illustrazione (slide p46)" tex={String.raw`V=\frac{1}{\sqrt{N}}\ \text{(Parzen)},\qquad K=\sqrt{N}\ \text{(K-NN)}`} />
        <FormulaBox
          label="Il riquadro N = 100, con i numeri"
          tex={String.raw`\begin{aligned}\text{Parzen:}\ \hat{p}(\mathbf{x}^*)&=\frac{K}{N V}=\frac{\val[0]{Kp}}{\val[0]{N}\cdot\val[4]{V}}=\val{pp}\\ \text{K-NN:}\ \hat{p}(\mathbf{x}^*)&=\frac{K}{N V_K}=\frac{\val[0]{K}}{\val[0]{N}\cdot\val[4]{VK}}=\val{pk}\\ N V_N&=\val{NV},\qquad K_N/N=\val[3]{KN}\end{aligned}`}
          values={values}
          announce
        />
        <StaticFormula
          label="Le due coppie di condizioni (slide p61 e p47)"
          tex={String.raw`\begin{gathered}\lim_{N\to+\infty}h_N=0,\qquad \lim_{N\to+\infty}N h_N^n=+\infty\qquad\text{(Parzen)}\\ \lim_{N\to+\infty}K_N=+\infty,\qquad \lim_{N\to+\infty}\frac{K_N}{N}=0\qquad\text{(K-NN)}\\ V_N=h_N^n:\qquad V_N\to 0,\qquad N V_N\to+\infty\end{gathered}`}
        />
        <StaticFormula label="Il ponte" tex={String.raw`h_N=\frac{1}{\sqrt[2n]{N}}\ \Rightarrow\ V_N=h_N^n=\frac{1}{\sqrt{N}},\qquad K(N)=\sqrt{N}`} />
        <p className="m-0 text-[length:var(--step--1)] text-muted">
          Slide p45: <em lang="en">both of these methods do in fact converge</em>. Per il K-NN la condizione della slide p47 è necessaria e sufficiente nei punti in cui <M tex="p" /> è continua; per Parzen la
          slide dice «<em lang="en">consistent if</em>», una condizione sufficiente. Differenza che resta: in Parzen la cella si restringe comunque, nel K-NN si adatta ai dati.
        </p>
      </div>
    </div>
  )

  const challenge = (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Segmented id={`${uid}-ap`} label="Con V = 1/N diventa rossa" options={[{ value: 'V', label: 'V → 0' }, { value: 'NV', label: 'N·V → +∞' }]} value={ans.p} onChange={(v: ParzenCond) => setAns((a) => ({ ...a, p: v }))} />
        <Segmented id={`${uid}-ape`} label="Con V = 1/N l'errore che resta è" options={[{ value: 'bias', label: 'bias' }, { value: 'varianza', label: 'varianza' }]} value={ans.pe} onChange={(v: ErrKind) => setAns((a) => ({ ...a, pe: v }))} />
        <Segmented id={`${uid}-ak`} label="Con K = N/2 diventa rossa" options={[{ value: 'KN', label: 'K/N → 0' }, { value: 'K', label: 'K → +∞' }]} value={ans.k} onChange={(v: KnnCond) => setAns((a) => ({ ...a, k: v }))} />
        <Segmented id={`${uid}-ake`} label="Con K = N/2 l'errore che resta è" options={[{ value: 'bias', label: 'bias' }, { value: 'varianza', label: 'varianza' }]} value={ans.ke} onChange={(v: ErrKind) => setAns((a) => ({ ...a, ke: v }))} />
      </div>
      <Challenge prompt={PROMPT} hint={HINT} status={status} onCheck={() => setChecked({ key: checkKey, ok: ans.p === exp.parzen && ans.pe === exp.parzenErr && ans.k === exp.knn && ans.ke === exp.knnErr })} />
      {checkedValid !== null ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Readout label="V = 1/N" value={`${exp.parzen === 'NV' ? 'N·V → +∞' : 'V → 0'} rossa, ${exp.parzenErr}`} pinned />
          <Readout label="K = N/2" value={`${exp.knn === 'KN' ? 'K/N → 0' : 'K → +∞'} rossa, ${exp.knnErr}`} pinned />
        </div>
      ) : null}
    </div>
  )

  return (
    <WidgetFrame meta={meta} aspect={narrow ? 1.05 : 2.3} onReset={reset} transport={<PlayControls sb={sb} steps={STEPS} />} caption={captionBlock} controls={controls} challenge={challenge}>
      {terrain}
    </WidgetFrame>
  )
}
