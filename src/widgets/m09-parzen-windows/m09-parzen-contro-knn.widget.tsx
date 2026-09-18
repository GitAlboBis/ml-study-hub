// Widget m09-parzen-contro-knn ("Parzen contro K-NN: chi tiene fermo che cosa"), concetti c02 e c03.
// La domanda d'esame "what are the difference with parzen window": stessa formula p̂(x*) = K/(N V), scelta
// opposta. Due grafici impilati con l'asse in comune sugli stessi campioni: in alto Parzen, finestra ocra di
// larghezza fissa h (lucchetto su V) e K contato; in basso il K-NN, cella viola che si allarga fino al K-esimo
// vicino (lucchetto su K) e V_K misurato. Poi le due curve tracciate, l'area sotto ciascuna, il selettore
// N = 1, 16, 256, ∞ (le colonne delle slide p50 e p63) e la tabella comparativa.
//
// MOTO. Lo spostamento di x* da una zona densa a una rada, la curva tracciata (5 s) e la tabella (300 ms a riga)
// sono passi dello storyboard; con reduced motion ogni passo è subito il suo stato finale. Trascinamento di x*,
// slider e selettori: nessuna animazione (la cella del K-NN segue x* senza molla, regola del kit).
import { useId, useMemo, useState } from 'react'
import { M } from '../../components/content/M'
import { ActionButton } from '../kit/ActionButton'
import { Challenge } from '../kit/Challenge'
import type { ChallengeStatus } from '../kit/Challenge'
import { fixed } from '../kit/format'
import { PlayControls } from '../kit/PlayControls'
import { Axis } from '../kit/plot/Axis'
import { Dots } from '../kit/plot/Dots'
import { Grid } from '../kit/plot/Grid'
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
import type { WidgetMeta } from '../types'
import { useNarrow } from './proprieta/hooks'
import { FormulaBox, Legend, OverlayCard, StaticFormula } from './proprieta/ui'
import { DOMAIN, H_RANGE, INITIAL, K_RANGE, N_OPTIONS, REASONS, TABLE, Y_MAX, areaOn, dragX, grid, judge, knnAt, knnCurve, parzenAt, parzenCurve, pool, slideParams, sweepX, truth } from './parzen-knn'
import type { Reason, Win } from './parzen-knn'

export const meta: WidgetMeta = {
  id: 'm09-parzen-contro-knn',
  moduleId: 'm09-parzen-windows',
  title: 'Parzen contro K-NN: chi tiene fermo che cosa',
  concepts: ['c02', 'c03'],
  scenario: 'sensori',
  scenarioNote: 'Tempi di risposta (0-4 s) di un sensore IoT: a volte risponde subito, a volte dopo un ritardo fisso',
  size: 'L',
}

const f0 = fixed(0)
const f2 = fixed(2)
const f3 = fixed(3)
const nText = (N: number) => (Number.isFinite(N) ? String(N) : '∞')
const KNN_CLASS = 4
const BELT = 0.22

const STEPS = [
  { id: 'quadro', label: 'Il quadro: due finestre sullo stesso asse', durationMs: 1500 },
  { id: 'rada', label: 'Da una zona densa a una rada', durationMs: 2200 },
  { id: 'traccia', label: 'Traccia le due curve', durationMs: 5000 },
  { id: 'n', label: 'N = 256: le colonne delle slide', durationMs: 1800 },
  { id: 'tabella', label: 'La tabella del confronto', durationMs: TABLE.length * 300 },
]
const DRAG = 1
const SWEEP = 2
const NSTEP = 3
const TABLE_STEP = 4

function caption(index: number, N: number, h: number, K: number): string {
  switch (index) {
    case 0:
      return String.raw`Gli stessi $N = ${nText(N)}$ tempi di risposta in due pannelli con l'asse in comune. In alto **Parzen**: la finestra ocra ha larghezza fissa $h = ${f2(h)}$ (il lucchetto è sul volume $V = h$) e $K$ si conta. In basso il **K-NN**: la cella viola si allarga fino a catturare $K = ${K}$ campioni (il lucchetto è su $K$) e $V_K(x^*) = 2 r_K$ si misura. Trascina $x^*$.`
    case 1:
      return String.raw`$x^*$ passa da una zona densa a una rada. In Parzen la finestra non cambia e $K$ scende, fino a zero; nel K-NN $K$ resta fisso e la cella si dilata. In entrambi si aggiorna $K/(NV)$ con i numeri.`
    case 2:
      return String.raw`$x^*$ percorre tutto l'asse e disegna le due stime. Quella K-NN è appuntita, con code che scendono lentamente come $1/|x|$ e non toccano mai lo zero: la sua area supera 1 e cresce se si allarga il dominio. Quella di Parzen è a gradini con la finestra rettangolare (zero dove $K = 0$) o liscia con la gaussiana, sempre di area 1 (sul dominio visibile un po' meno, per le code).`
    case 3:
      return String.raw`$N = 256$ con $K = \sqrt N = 16$ e $h = 1/\sqrt N = 0.0625$: la colonna bimodale della figura K-NN della slide p50 (a pagina 36 delle note) e la prima colonna della griglia di Parzen della slide p63. Con $N = 16$ i due picchi iniziano ad apparire con rumore; con 256 la forma bimodale è chiara; con $N = \infty$ entrambe coincidono con la densità vera.`
    default:
      return String.raw`La tabella del confronto, riga per riga. Parzen blocca il volume e conta; il K-NN blocca il conteggio e misura il volume. Il primo dà una vera densità di area 1, il secondo si adatta da solo alla densità locale. Entrambi convergono per $N \to \infty$ (*both of these methods do in fact converge*), ma è difficile dire qualcosa di preciso a campione finito.`
  }
}

const PROMPT = String.raw`Con la finestra di Parzen **rettangolare** trova un punto $x^*$ in cui Parzen dà esattamente zero mentre il K-NN dà un valore positivo, poi scegli perché il K-NN non può mai dare zero. Premi Verifica.`
const HINT = String.raw`Cerca un tratto dell'asse senza campioni più largo di $h$: la finestra rettangolare non ne contiene nessuno ($K = 0$). Fra i due modi, verso 2.7 s, con $h$ piccolo ($N = 16$: $h = 0.25$).`

/** La finestra di un metodo: banda velata fra due ascisse, etichetta con il lucchetto sulla grandezza fissata. */
function WindowBand({ a, b, color, label }: { a: number; b: number; color: string; label: string }) {
  const { x, innerHeight, clipPath } = usePlot()
  const xa = x(Math.max(DOMAIN[0] - 1, a))
  const xb = x(Math.min(DOMAIN[1] + 1, b))
  const mid = Math.max(40, Math.min(x(DOMAIN[1]) - 40, (xa + xb) / 2))
  return (
    <g pointerEvents="none">
      <g clipPath={clipPath}>
        <rect x={xa} y={0} width={Math.max(1, xb - xa)} height={innerHeight} fill={color} fillOpacity={0.2} />
        <line x1={xa} x2={xa} y1={0} y2={innerHeight} stroke={color} strokeWidth={1.5} />
        <line x1={xb} x2={xb} y1={0} y2={innerHeight} stroke={color} strokeWidth={1.5} />
      </g>
      <g transform={`translate(${mid - 30},6)`}>
        <path d="M2.5 6V4.5a3.5 3.5 0 0 1 7 0V6" fill="none" stroke="var(--text)" strokeWidth={1.4} />
        <rect x={1} y={6} width={10} height={8} fill="var(--text)" />
        <text x={15} y={12} className="num" fontSize={11} fontWeight={600} fill="var(--text)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
          {label}
        </text>
      </g>
    </g>
  )
}

/** Le tacche dei campioni sotto lo zero. */
function Rug({ samples }: { samples: readonly number[] }) {
  const { x, y } = usePlot()
  const y0 = y(0)
  const y1 = y(-BELT)
  let d = ''
  for (const s of samples) d += `M${x(s).toFixed(1)},${(y0 + 2).toFixed(1)}V${(y1 - 2).toFixed(1)}`
  return (
    <g pointerEvents="none">
      <rect x={0} y={y0} width={x.range()[1]} height={y1 - y0} fill="var(--surface-2)" />
      <path d={d} stroke="var(--viz-sample)" strokeWidth={1.2} strokeOpacity={samples.length > 60 ? 0.45 : 0.9} />
    </g>
  )
}

export default function M09ParzenControKnn() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [NUser, setNUser] = useState<number>(INITIAL.N)
  const [h, setH] = useState(INITIAL.h)
  const [KUser, setKUser] = useState(INITIAL.K)
  const [xUser, setXUser] = useState(INITIAL.x)
  const [win, setWin] = useState<Win>('rettangolare')
  const [showTruth, setShowTruth] = useState(true)
  const [reason, setReason] = useState<Reason>('kernel')
  const [takeoverAt, setTakeoverAt] = useState<number | null>(null)
  const [checked, setChecked] = useState<{ key: string; ok: boolean } | null>(null)
  const [terrainRef, narrow] = useNarrow(560)

  const sb = useStoryboard(STEPS)
  const progress = sb.progress
  const own = takeoverAt === sb.index
  const N = sb.index === NSTEP && !own ? 256 : NUser
  const params = sb.index === NSTEP && !own ? slideParams(256) : { h, K: KUser }
  const hShown = params.h
  const x0 = !own && sb.index === DRAG ? dragX(progress) : !own && sb.index === SWEEP ? sweepX(progress) : xUser
  const takeOver = () => {
    if ((sb.index === DRAG || sb.index === SWEEP || sb.index === NSTEP) && !own) {
      sb.pause()
      setTakeoverAt(sb.index)
      setXUser(Number(x0.toFixed(2)))
      if (sb.index === NSTEP) {
        setNUser(256)
        setH(Number(slideParams(256).h.toFixed(2)) || H_RANGE.min)
        setKUser(slideParams(256).K)
      }
    }
  }

  const all = useMemo(() => pool(), [])
  const finite = Number.isFinite(N)
  const samples = useMemo(() => (finite ? all.slice(0, N) : []), [all, N, finite])
  const K = finite ? Math.max(1, Math.min(params.K, N)) : 0
  const xs = useMemo(() => grid(401), [])
  const pCurve = useMemo(() => (finite ? parzenCurve(xs, samples, hShown, win) : xs.map(truth)), [xs, samples, hShown, win, finite])
  const kCurve = useMemo(() => (finite ? knnCurve(xs, samples, K) : xs.map(truth)), [xs, samples, K, finite])
  const upTo = sb.index === SWEEP ? sweepX(progress) : DOMAIN[1]
  const cut = (ys: readonly number[]) => xs.map((x, i) => [x, x <= upTo + 1e-9 ? ys[i] : Number.NaN])

  const pz = finite ? parzenAt(x0, samples, hShown, win) : { K: 0, S: 0, p: truth(x0) }
  const kn = finite ? knnAt(x0, samples, K) : { r: 0, V: 0, p: truth(x0) }
  const areas = useMemo(() => {
    if (!finite) return { p: 1, k4: 1, k8: 1 }
    return {
      p: areaOn((v) => parzenAt(v, samples, hShown, win).p, DOMAIN, 2001),
      k4: areaOn((v) => knnAt(v, samples, K).p, DOMAIN, 2001),
      k8: areaOn((v) => knnAt(v, samples, K).p, [-4, 8], 4001),
    }
  }, [finite, samples, hShown, win, K])

  const values = { N, K, h: hShown, Kp: pz.K, S: pz.S, pp: pz.p, VK: kn.V, r: kn.r, pk: kn.p, x: x0 }
  const texParzen =
    win === 'rettangolare'
      ? String.raw`\hat{p}(x^*)=\frac{1}{N h}\sum_{k=1}^{N}\gamma\left(\frac{x_k-x^*}{h}\right)=\frac{K}{N\,V}=\frac{\val[0]{Kp}}{\val[0]{N}\cdot\val[3]{h}}=\val[3]{pp}`
      : String.raw`\hat{p}(x^*)=\frac{1}{N h}\sum_{k=1}^{N}\gamma\left(\frac{x_k-x^*}{h}\right)=\frac{\val[3]{S}}{\val[0]{N}\cdot\val[3]{h}}=\val[3]{pp}`
  const texKnn = String.raw`\hat{p}(x^*)=\frac{K}{N\,V_K(x^*)}=\frac{\val[0]{K}}{\val[0]{N}\cdot 2\cdot\val[3]{r}}=\frac{\val[0]{K}}{\val[0]{N}\cdot\val[3]{VK}}=\val[3]{pk}`

  const checkKey = `${xUser}|${h}|${KUser}|${NUser}|${win}|${reason}`
  const checkedValid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = checkedValid === null ? 'idle' : checkedValid.ok ? 'ok' : 'ko'
  const check = () => {
    const s = Number.isFinite(NUser) ? all.slice(0, NUser) : []
    setChecked({ key: checkKey, ok: Number.isFinite(NUser) && judge(xUser, s, h, Math.min(KUser, NUser), win, reason).ok })
  }

  const chooseN = (n: number) => {
    takeOver()
    setNUser(n)
    if (Number.isFinite(n)) {
      const sp = slideParams(n)
      setH(Math.max(H_RANGE.min, Number(sp.h.toFixed(2))))
      setKUser(sp.K)
    }
  }
  const reset = () => {
    sb.reset()
    setNUser(INITIAL.N)
    setH(INITIAL.h)
    setKUser(INITIAL.K)
    setXUser(INITIAL.x)
    setWin('rettangolare')
    setShowTruth(true)
    setReason('kernel')
    setTakeoverAt(null)
    setChecked(null)
  }

  const truthPts = useMemo(() => xs.map((x) => [x, truth(x)]), [xs])
  const panel = (which: 'parzen' | 'knn') => {
    const isP = which === 'parzen'
    return (
      <Plot
        width={720}
        height={220}
        fill
        xDomain={DOMAIN}
        yDomain={[-BELT, Y_MAX]}
        margin={{ top: 24, right: 12, bottom: isP ? 12 : 34, left: 48 }}
        ariaLabel={isP ? 'Stima di Parzen con la finestra di larghezza fissa' : 'Stima K-NN con la cella che si allarga fino al K-esimo vicino'}
        description={isP ? `x* = ${f2(x0)}, h = ${f2(hShown)}, K contati ${pz.K}, stima ${f3(pz.p)}.` : `x* = ${f2(x0)}, K = ${K}, r_K = ${f3(kn.r)}, V_K = ${f3(kn.V)}, stima ${f3(kn.p)}.`}
      >
        <Grid axis="y" yTicks={[0, 0.5, 1, 1.5]} />
        {finite ? (
          isP ? (
            <WindowBand a={x0 - hShown / 2} b={x0 + hShown / 2} color="var(--viz-highlight)" label={`V = h = ${f2(hShown)} fisso · K = ${pz.K}`} />
          ) : (
            <WindowBand a={x0 - kn.r} b={x0 + kn.r} color={classVar(KNN_CLASS)} label={`K = ${K} fisso · V_K = ${f2(kn.V)}`} />
          )
        ) : null}
        {showTruth ? <LinePath data={truthPts} role="truth" /> : null}
        <LinePath data={cut(isP ? pCurve : kCurve)} role="estimate" cls={isP ? undefined : KNN_CLASS} width={2.5} />
        <Rug samples={samples} />
        {isP ? (
          <Dots data={[{ x: x0, y: -BELT / 2, id: 'xs', label: 'Punto x*' }]} draggable pin axis="x" step={0.05} format={(v) => `${f2(v)} s`} onDrag={(_id, nx) => {
            takeOver()
            setXUser(Math.min(DOMAIN[1], Math.max(DOMAIN[0], Math.round(nx * 20) / 20)))
          }} />
        ) : (
          <XLine x0={x0} />
        )}
        {isP ? <Axis side="bottom" ticks={[0, 1, 2, 3, 4]} values={false} /> : <Axis side="bottom" ticks={[0, 1, 2, 3, 4]} label="tempo di risposta" symbol="x [s]" />}
        <Axis side="left" ticks={[0, 0.5, 1, 1.5]} symbol={isP ? 'p̂ Parzen' : 'p̂ K-NN'} />
      </Plot>
    )
  }

  const shownRows = sb.index === TABLE_STEP ? Math.max(1, Math.ceil(progress * TABLE.length)) : 0
  const terrain = (
    <div ref={terrainRef} className="absolute inset-0 grid grid-rows-[1fr_1.12fr]">
      <div className="relative min-h-0">{panel('parzen')}</div>
      <div className="relative min-h-0">{panel('knn')}</div>
      {shownRows > 0 ? (
        <OverlayCard title="Parzen e K-NN a confronto" className={narrow ? 'inset-x-2 top-2' : 'top-3 left-16 w-[min(40rem,85%)]'}>
          <ComparisonTable rows={shownRows} />
        </OverlayCard>
      ) : null}
    </div>
  )

  const controls = (
    <>
      <Segmented id={`${uid}-N`} label="Campioni (K = √N, h = 1/√N)" options={N_OPTIONS.map((n) => ({ value: String(n), label: `N = ${nText(n)}` }))} value={String(N)} onChange={(v) => chooseN(Number(v))} />
      <Slider id={`${uid}-x`} label="Punto della stima" latex="x^*" min={DOMAIN[0]} max={DOMAIN[1]} step={0.05} value={Number(x0.toFixed(2))} onChange={(v) => {
        takeOver()
        setXUser(v)
      }} unit="s" />
      <Slider id={`${uid}-h`} label="Larghezza di Parzen" latex="h" min={H_RANGE.min} max={H_RANGE.max} step={H_RANGE.step} value={Math.max(H_RANGE.min, Number(hShown.toFixed(2)))} onChange={(v) => {
        takeOver()
        setH(v)
      }} unit="s" disabled={!finite} />
      <Slider id={`${uid}-K`} label="Vicini del K-NN" latex="K" min={K_RANGE.min} max={Math.max(1, Math.min(K_RANGE.max, finite ? N : K_RANGE.max))} step={1} value={Math.max(1, K)} onChange={(v) => {
        takeOver()
        setKUser(v)
      }} format={f0} disabled={!finite} />
      <Segmented id={`${uid}-win`} label="Finestra di Parzen" options={[{ value: 'rettangolare', label: 'rettangolare' }, { value: 'gaussiano', label: 'gaussiana' }]} value={win} onChange={setWin} />
      <Toggle id={`${uid}-truth`} label="Densità vera" checked={showTruth} onChange={setShowTruth} />
      <div className="flex flex-wrap gap-2">
        <ActionButton onClick={() => {
          setTakeoverAt(null)
          sb.goto(SWEEP)
          sb.play()
        }}>
          Traccia la curva
        </ActionButton>
        <ActionButton onClick={() => {
          setTakeoverAt(null)
          sb.goto(TABLE_STEP)
          sb.play()
        }}>
          Tabella
        </ActionButton>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="Parzen in x*" latex="\hat p" value={pz.p} format={f3} />
        <Readout label="K-NN in x*" latex="\hat p_K" value={kn.p} format={f3} />
        <Readout label="K contati (Parzen)" value={pz.K} format={f0} />
        <Readout label="Volume misurato (K-NN)" latex="V_K" value={kn.V} format={f3} />
        <Readout label="Area Parzen su [0, 4]" value={areas.p} format={f3} />
        <Readout label="Area K-NN su [0, 4]" value={areas.k4} format={f3} pinned />
        <Readout label="Area K-NN su [−4, 8]" value={areas.k8} format={f3} />
      </div>
    </>
  )

  const captionBlock = (
    <div className="grid gap-4">
      <StepCaption index={sb.index} total={STEPS.length} label={sb.step.label} text={caption(sb.index, N, hShown, K)} />
      <div className="grid gap-4 border-t border-border pt-3">
        <Legend
          items={[
            { kind: 'band', color: 'var(--viz-highlight)', label: 'finestra di Parzen (V fisso)' },
            { kind: 'band', color: classVar(KNN_CLASS), label: 'cella del K-NN (K fisso)' },
            { kind: 'thick', color: 'var(--viz-estimate)', label: 'stima di Parzen' },
            { kind: 'thick', color: classVar(KNN_CLASS), label: 'stima K-NN' },
            { kind: 'dash', color: 'var(--viz-truth)', label: 'densità vera' },
          ]}
        />
        <StaticFormula label="La stessa stima di partenza (modulo m08)" tex={String.raw`\hat{p}(\mathbf{x}^*)=\frac{K}{NV}`} />
        <FormulaBox label="Parzen: V = hⁿ fissato, K contato" tex={texParzen} values={values} announce />
        <FormulaBox label="K-NN: K fissato, V_K(x*) misurato" tex={texKnn} values={values} />
        <StaticFormula label="Le leggi dell'illustrazione della slide p46" tex={String.raw`V=\frac{1}{\sqrt{N}}\ \text{(Parzen)},\qquad K=\sqrt{N}\ \text{(K-NN)}`} />
        <p className="m-0 text-[length:var(--step--1)] text-muted">
          Note p32: Parzen dà stime lisce ed è meno sensibile al rumore, ma la scelta di <M tex="h" /> è critica (piccolo: overfitting, grande: oversmoothing); il K-NN si adatta alla densità locale
          ma dipende criticamente da <M tex="K" />. Dove non cade alcun campione, una finestra a supporto limitato dà <M tex="K = 0" />: i vuoti della rappresentazione (<em lang="en">gaps in the density representation</em>, note p39).
        </p>
      </div>
    </div>
  )

  const challenge = (
    <div className="grid gap-4">
      <Segmented id={`${uid}-reason`} label="Il K-NN non dà mai zero perché" options={(Object.keys(REASONS) as Reason[]).map((r) => ({ value: r, label: REASONS[r] }))} value={reason} onChange={setReason} />
      <Challenge prompt={PROMPT} hint={HINT} status={status} onCheck={check} />
      {checkedValid !== null ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          <Readout label="Parzen in x*" value={pz.p} format={f3} pinned />
          <Readout label="K-NN in x*" value={kn.p} format={f3} />
          <Readout label="Finestra" value={win} />
        </div>
      ) : null}
    </div>
  )

  return (
    <WidgetFrame meta={meta} aspect={narrow ? 0.85 : 1.55} onReset={reset} transport={<PlayControls sb={sb} steps={STEPS} />} caption={captionBlock} controls={controls} challenge={challenge}>
      {terrain}
    </WidgetFrame>
  )
}

/** La verticale di x* nel pannello del K-NN (lo spillo trascinabile sta nel pannello di Parzen). */
function XLine({ x0 }: { x0: number }) {
  const { x, y } = usePlot()
  return <rect x={x(x0) - 4.5} y={y(-BELT / 2) - 4.5} width={9} height={9} fill="var(--pin)" stroke="var(--pin-contrast)" strokeWidth={1.5} transform={`rotate(45 ${x(x0)} ${y(-BELT / 2)})`} pointerEvents="none" />
}

function ComparisonTable({ rows }: { rows: number }) {
  return (
    <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tabella di confronto fra Parzen e K-NN">
      <table className="w-full border-collapse text-left text-[length:var(--step--1)]">
        <thead>
          <tr className="border-b border-border-strong text-muted">
            <th scope="col" className="py-1 pr-2 font-normal" />
            <th scope="col" className="label py-1 pr-2 font-normal">
              Parzen
            </th>
            <th scope="col" className="label py-1 font-normal">
              K-NN
            </th>
          </tr>
        </thead>
        <tbody>
          {TABLE.slice(0, rows).map((r) => (
            <tr key={r.what} className="border-b border-border transition-opacity duration-200 ease-out starting:opacity-0">
              <th scope="row" className="py-1 pr-2 font-semibold">
                {r.what}
              </th>
              <td className="py-1 pr-2">{r.parzen}</td>
              <td className="py-1">{r.knn}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
