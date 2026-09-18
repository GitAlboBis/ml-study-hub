// Widget m09-pnn-rete-probabilistica ("Probabilistic Neural Network: Parzen disegnato come rete"), concetti c65, c66.
// Slide p65: il metodo di Specht si implementa con le PNN. A sinistra il piano delle feature (salmoni e spigole
// normalizzati, un pesce di test da trascinare, le regioni di decisione); a destra la rete a quattro strati: un
// neurone del pattern per ogni pesce del training set (il suo kernel gaussiano), un neurone di somma per classe
// (la stima di Parzen p̂(x|ω_i)), la decisione di Bayes. L'architettura è di Specht (1990): la fonte dice solo
// che il metodo "si può implementare" con le PNN, ed è segnalato come approfondimento.
//
// MOTO. La propagazione è un passo dello storyboard in quattro fasi da 600 ms (neuroni che si accendono, segnali
// che scorrono verso la somma, prodotto per i prior, decisione con le regioni in dissolvenza); con reduced motion
// il passo mostra subito la rete propagata. Slider, selettori, trascinamento: nessuna animazione.
import { useCallback, useDeferredValue, useId, useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { M } from '../../components/content/M'
import { Challenge } from '../kit/Challenge'
import type { ChallengeStatus } from '../kit/Challenge'
import { fixed } from '../kit/format'
import { PlayControls } from '../kit/PlayControls'
import { Axis } from '../kit/plot/Axis'
import { BoundaryCanvas } from '../kit/plot/BoundaryCanvas'
import { Dots } from '../kit/plot/Dots'
import { classSymbolPath, classVar } from '../kit/plot/marks'
import { Plot, usePlot } from '../kit/plot/Plot'
import { Readout } from '../kit/Readout'
import { Segmented } from '../kit/Segmented'
import { Slider } from '../kit/Slider'
import { StepCaption } from '../kit/StepCaption'
import { Toggle } from '../kit/Toggle'
import { useStoryboard } from '../kit/useStoryboard'
import { WidgetFrame } from '../kit/WidgetFrame'
import { formatH } from '../engines/density1d'
import type { WidgetMeta } from '../types'
import { useNarrow } from './proprieta/hooks'
import { FormulaBox, Legend, LogSlider, OverlayCard, StaticFormula } from './proprieta/ui'
import { DOMAIN, INITIAL, PER_CLASS, PHASE_MS, PRIOR, SHAPES, SIGMA_STEPS, accuracy, forward, neuronSigmas, targetSigma, training, validation } from './pnn'
import type { Pt, Shape } from './pnn'

export const meta: WidgetMeta = {
  id: 'm09-pnn-rete-probabilistica',
  moduleId: 'm09-parzen-windows',
  title: 'Probabilistic Neural Network: Parzen disegnato come rete',
  concepts: ['c65', 'c66'],
  scenario: 'pesce',
  scenarioNote: 'Salmone contro spigola: luminosità e larghezza normalizzate, 20 pesci per classe nel training set',
  size: 'L',
}

const f2 = fixed(2)
const f3 = fixed(3)
const f4 = fixed(4)
const CLASS_NAMES = ['salmone', 'spigola'] as const

const STEPS = [
  { id: 'quadro', label: 'Il quadro: il piano e la rete', durationMs: 1500 },
  { id: 'propaga', label: 'Propaga: strato per strato', durationMs: 4 * PHASE_MS },
  { id: 'sigma', label: 'σ: dal frastagliato al rettilineo', durationMs: 1800 },
  { id: 'forma', label: 'Cambia la forma della spigola', durationMs: 1800 },
  { id: 'adattiva', label: 'σ_k adattiva nei neuroni', durationMs: 1800 },
  { id: 'chiusura', label: 'Una PNN non impara pesi', durationMs: 1500 },
]
const PROPAGATE = 1
const ADAPTIVE = 4

function caption(index: number, sigma: number): string {
  switch (index) {
    case 0:
      return String.raw`Salmoni (cerchi) e spigole (quadrati) nelle due feature normalizzate, e un pesce di test da trascinare. A destra la PNN: lo strato di ingresso (2 feature), lo strato dei pattern (${2 * PER_CLASS} neuroni, uno per pesce del training set), lo strato di somma (un neurone per classe), la decisione. Le regioni colorate sono la decisione della rete in ogni punto.`
    case 1:
      return String.raw`Fase 1: il pesce di test entra; ogni neurone del pattern si accende quanto il suo kernel, $\exp(-\|\mathbf x - \mathbf x_k\|^2/(2\sigma^2))$, cioè in base alla distanza dal pesce di test (e nel piano gli stessi pesci si illuminano). Fase 2: i segnali confluiscono nelle due somme, $\hat p(\mathbf x|\omega_i)$. Fasi 3 e 4: si moltiplica per le probabilità a priori e vince il massimo; le regioni di decisione compaiono.`
    case 2:
      return String.raw`Con $\sigma = ${formatH(sigma)}$. Una $\sigma$ piccola rende il confine frastagliato attorno ai singoli pesci; una grande lo rende quasi rettilineo. È la stessa $\sigma$ di Specht: il parametro di smoothing della stima di ogni classe.`
    case 3:
      return String.raw`Cambia la forma della classe spigola (nuvola, due gruppi, banana): senza toccare la rete, tranne i campioni memorizzati, il neurone di somma riproduce ogni volta la densità della classe e il confine si adatta. È la capacità del kernel gaussiano di adattarsi a densità di molti tipi (*ability to fit various types of densities well*).`
    case 4:
      return String.raw`$\sigma_k$ adattiva: ogni neurone usa la distanza media dai suoi 3 vicini della stessa classe. Nei gruppi fitti i neuroni diventano selettivi, sui pesci isolati restano larghi, e il confine smette di frastagliarsi attorno ai pesci isolati (*adaptiveness*, note p45).`
    default:
      return String.raw`Una PNN non impara pesi: è la formula di Parzen con kernel gaussiano disegnata come rete, seguita dalla regola di Bayes. "Addestrarla" vuol dire memorizzare i campioni; resta da scegliere un solo numero, $\sigma$.`
  }
}

const PROMPT = String.raw`Con la spigola a **due gruppi** oppure a **banana** (σ fissa, prior 0.5), trova il valore di $\sigma$ che classifica correttamente il maggior numero dei 20 pesci di un validation set **nascosto**, con il confine più semplice possibile: a parità di accuratezza vince la $\sigma$ più grande. Premi Verifica.`
const HINT = String.raw`Con la nuvola gaussiana quasi ogni $\sigma$ funziona: scegli una forma curva. Parti da una $\sigma$ grande e scendi finché il confine separa anche i gruppi laterali; appena l'accuratezza è massima, fermati: quella è la $\sigma$ più grande.`

/** La rete: ingresso, pattern (un neurone per pesce), somma per classe, decisione. */
function Network({ act, phase, phaseT, dens, joint, decision, prior, hover, onHover, flow }: { act: readonly number[]; phase: number; phaseT: number; dens: readonly number[]; joint: readonly number[]; decision: 0 | 1; prior: number; hover: number | null; onHover: (k: number | null) => void; flow: number }) {
  const W = 360
  const H = 300
  const X = { in: 26, pat: 128, sum: 250, dec: 330 }
  const yIn = [120, 180]
  const yPat = (k: number) => (k < PER_CLASS ? 18 + k * 6.3 : 164 + (k - PER_CLASS) * 6.3)
  const ySum = [80, 222]
  const yDec = 151
  const lit = (k: number) => (phase < 0 ? 0 : phase === 0 ? act[k] * phaseT : act[k])
  const flowOn = phase >= 1
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    const cur = hover ?? 0
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') onHover(Math.min(act.length - 1, cur + 1))
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') onHover(Math.max(0, cur - 1))
    else if (e.key === 'Escape') onHover(null)
    else return
    e.preventDefault()
  }
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block h-full w-full"
      role="slider"
      tabIndex={0}
      aria-label="Rete PNN: frecce per scegliere il neurone del pattern da evidenziare"
      aria-valuemin={1}
      aria-valuemax={act.length}
      aria-valuenow={(hover ?? 0) + 1}
      aria-valuetext={hover === null ? 'nessun neurone evidenziato' : `neurone ${hover + 1}, ${CLASS_NAMES[hover < PER_CLASS ? 0 : 1]}, attivazione ${act[hover].toFixed(3)}`}
      onKeyDown={onKey}
      onBlur={() => onHover(null)}
    >
      {/* archi: ingresso → pattern (tenui), pattern → somma (pesati dall'attivazione), somma → decisione */}
      <g stroke="var(--viz-axis)" strokeOpacity={0.12}>
        {act.map((_, k) => yIn.map((y) => <line key={`${k}-${y}`} x1={X.in} y1={y} x2={X.pat} y2={yPat(k)} />))}
      </g>
      <g>
        {act.map((a, k) => (
          <line
            key={`ps${k}`}
            x1={X.pat}
            y1={yPat(k)}
            x2={X.sum}
            y2={ySum[k < PER_CLASS ? 0 : 1]}
            stroke={classVar(k < PER_CLASS ? 0 : 1)}
            strokeOpacity={flowOn ? 0.15 + 0.85 * a : 0.12}
            strokeWidth={flowOn ? 0.6 + 2.4 * a : 0.6}
            strokeDasharray={flowOn && phase === 1 ? '3 5' : undefined}
            strokeDashoffset={flowOn && phase === 1 ? -flow * 40 : undefined}
          />
        ))}
      </g>
      {ySum.map((y, c) => (
        <line key={`sd${c}`} x1={X.sum} y1={y} x2={X.dec} y2={yDec} stroke={phase >= 2 && decision === c ? 'var(--text)' : 'var(--viz-axis)'} strokeWidth={phase >= 3 && decision === c ? 3 : 1.2} />
      ))}
      {/* neuroni */}
      {yIn.map((y, i) => (
        <g key={`in${i}`}>
          <circle cx={X.in} cy={y} r={10} fill="var(--surface)" stroke="var(--text)" strokeWidth={1.5} />
          <text x={X.in} y={y + 3.5} textAnchor="middle" className="num" fontSize={10} fill="var(--text)">
            x{i === 0 ? '₁' : '₂'}
          </text>
        </g>
      ))}
      {act.map((_, k) => {
        const c = k < PER_CLASS ? 0 : 1
        return (
          <g key={`p${k}`} data-neuron={k} onPointerEnter={() => onHover(k)} onPointerLeave={() => onHover(null)}>
            <circle cx={X.pat} cy={yPat(k)} r={6} fill="transparent" />
            <path transform={`translate(${X.pat},${yPat(k)})`} d={classSymbolPath(c, 26)} fill={classVar(c)} fillOpacity={0.12 + 0.88 * lit(k)} stroke={hover === k ? 'var(--pin-contrast)' : 'none'} strokeWidth={1.5} />
          </g>
        )
      })}
      {ySum.map((y, c) => (
        <g key={`s${c}`}>
          <circle cx={X.sum} cy={y} r={14} fill="var(--surface)" stroke={classVar(c)} strokeWidth={2.5} />
          <text x={X.sum} y={y + 3.5} textAnchor="middle" className="num" fontSize={10} fill="var(--text)">
            Σ
          </text>
          {phase >= 1 ? (
            <text x={X.sum} y={y + (c === 0 ? -20 : 28)} textAnchor="middle" className="num" fontSize={10} fill="var(--text)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
              p̂ = {dens[c].toFixed(3)}
            </text>
          ) : null}
          {phase >= 2 ? (
            <text x={X.sum + 18} y={y + (c === 0 ? 30 : -18)} className="num" fontSize={9.5} fill="var(--text-muted)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
              ×{(c === 0 ? prior : 1 - prior).toFixed(2)} = {joint[c].toFixed(3)}
            </text>
          ) : null}
        </g>
      ))}
      <rect x={X.dec - 14} y={yDec - 14} width={28} height={28} fill={phase >= 3 ? classVar(decision) : 'var(--surface)'} fillOpacity={phase >= 3 ? 0.9 : 1} stroke="var(--text)" strokeWidth={1.5} />
      <text x={X.dec} y={yDec + 30} textAnchor="middle" className="label" fontSize={9.5} fill="var(--text)">
        {phase >= 3 ? CLASS_NAMES[decision] : 'decisione'}
      </text>
      {[
        ['ingresso', X.in],
        ['pattern', X.pat],
        ['somma', X.sum],
        ['decisione', X.dec],
      ].map(([t, x]) => (
        <text key={String(t)} x={Number(x)} y={H - 4} textAnchor="middle" className="label" fontSize={9} fill="var(--text-muted)">
          {t}
        </text>
      ))}
    </svg>
  )
}

/** Aloni dei pesci del training set, accesi quanto il loro neurone; il pesce evidenziato dalla rete ha lo spillo. */
function Halos({ pts, act, strength, hover }: { pts: readonly Pt[]; act: readonly number[]; strength: number; hover: number | null }) {
  const { x, y, clipPath } = usePlot()
  return (
    <g clipPath={clipPath} pointerEvents="none">
      {pts.map((p, k) => (act[k] * strength > 0.02 ? <circle key={k} cx={x(p[0])} cy={y(p[1])} r={10} fill="var(--viz-highlight)" fillOpacity={0.7 * act[k] * strength} /> : null))}
      {hover !== null && pts[hover] !== undefined ? <circle cx={x(pts[hover][0])} cy={y(pts[hover][1])} r={11} fill="none" stroke="var(--pin-contrast)" strokeWidth={2.5} /> : null}
    </g>
  )
}

export default function M09PnnReteProbabilistica() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [shape, setShape] = useState<Shape>('gauss')
  const [sigma, setSigma] = useState(INITIAL.sigma)
  const [prior, setPrior] = useState(INITIAL.prior)
  const [test, setTest] = useState<Pt>(INITIAL.test)
  const [adaptiveUser, setAdaptiveUser] = useState(false)
  const [hover, setHover] = useState<number | null>(null)
  const [checked, setChecked] = useState<{ key: string; ok: boolean } | null>(null)
  const [terrainRef, narrow] = useNarrow(620)

  const sb = useStoryboard(STEPS)
  const progress = sb.progress
  const adaptive = adaptiveUser || sb.index === ADAPTIVE
  const t = useMemo(() => training(shape), [shape])
  const sigmas = useMemo(() => neuronSigmas(t, sigma, adaptive), [t, sigma, adaptive])
  const fw = forward(test, t, sigmas, prior)
  const propagating = sb.index === PROPAGATE
  const ph = propagating ? Math.min(3.999, progress * 4) : 3.999
  const phase = propagating && progress >= 1 ? 3 : Math.floor(ph)
  const phaseT = propagating && progress < 1 ? ph - Math.floor(ph) : 1
  const regionOpacity = !propagating || progress >= 1 ? 0.55 : phase < 3 ? 0 : 0.55 * phaseT

  const deferred = useDeferredValue(useMemo(() => ({ t, sigmas, prior }), [t, sigmas, prior]))
  const classify = useCallback((x: number, y: number) => forward([x, y], deferred.t, deferred.sigmas, deferred.prior).decision, [deferred])

  const valAcc = useMemo(() => accuracy(validation(shape), t, sigma, 0.5, false), [shape, t, sigma])

  const values = { p1: fw.dens[0], p2: fw.dens[1], P1: prior, P2: 1 - prior, g1: fw.joint[0], g2: fw.joint[1], dec: CLASS_NAMES[fw.decision] }

  const checkKey = `${shape}|${sigma}|${adaptive}|${prior}`
  const checkedValid = checked !== null && checked.key === checkKey ? checked : null
  const status: ChallengeStatus = checkedValid === null ? 'idle' : checkedValid.ok ? 'ok' : 'ko'
  const target = shape === 'gauss' ? null : targetSigma(shape)
  const check = () => setChecked({ key: checkKey, ok: target !== null && !adaptive && prior === 0.5 && sigma === target.sigma })

  const reset = () => {
    sb.reset()
    setShape('gauss')
    setSigma(INITIAL.sigma)
    setPrior(INITIAL.prior)
    setTest(INITIAL.test)
    setAdaptiveUser(false)
    setHover(null)
    setChecked(null)
  }

  const plane = (
    <Plot
      width={400}
      height={400}
      fill
      xDomain={DOMAIN}
      yDomain={DOMAIN}
      margin={{ top: 22, right: 10, bottom: 36, left: 40 }}
      ariaLabel="Piano delle feature con salmoni, spigole, pesce di test e regioni di decisione della PNN"
      description={`Pesce di test in (${f2(test[0])}, ${f2(test[1])}): decisione ${CLASS_NAMES[fw.decision]}.`}
    >
      <BoundaryCanvas classify={classify} resolution={90} opacity={regionOpacity} />
      <Halos pts={t.pts} act={fw.act} strength={phase >= 0 ? (phase === 0 ? phaseT : 1) : 0} hover={hover} />
      <Dots data={t.pts.map((p, i) => ({ x: p[0], y: p[1], cls: t.cls[i], id: `t${i}`, label: CLASS_NAMES[t.cls[i]] }))} r={4.5} />
      <Dots data={[{ x: test[0], y: test[1], id: 'test', label: 'Pesce di test' }]} draggable pin step={0.1} onDrag={(_id, nx, ny) => setTest([Number(nx.toFixed(2)), Number(ny.toFixed(2))])} />
      <Axis side="bottom" ticks={[-2, -1, 0, 1, 2]} symbol="luminosità (z)" />
      <Axis side="left" ticks={[-2, -1, 0, 1, 2]} symbol="larghezza (z)" />
    </Plot>
  )

  const terrain = (
    <div ref={terrainRef} className={`absolute inset-0 grid ${narrow ? 'grid-rows-[1.1fr_1fr]' : 'grid-cols-[1fr_1fr]'}`}>
      <div className="relative min-h-0 min-w-0">{plane}</div>
      <div className={`relative min-h-0 min-w-0 p-1 ${narrow ? 'border-t' : 'border-l'} border-border`}>
        <Network act={fw.act} phase={phase} phaseT={phaseT} dens={fw.dens} joint={fw.joint} decision={fw.decision} prior={prior} hover={hover} onHover={setHover} flow={propagating ? progress * 4 : 0} />
      </div>
      {sb.index === 5 ? (
        <OverlayCard title="Nessun peso da imparare" className={narrow ? 'inset-x-2 top-2' : 'top-3 left-3 w-[min(24rem,48%)]'}>
          <p className="m-0 text-[length:var(--step--1)]">
            Strato dei pattern = i campioni memorizzati; strato di somma = <M tex="\hat p(\mathbf x|\omega_i)" /> di Parzen con kernel gaussiano; decisione = regola di Bayes. Unico parametro: <M tex="\sigma" />.
          </p>
        </OverlayCard>
      ) : null}
    </div>
  )

  const controls = (
    <>
      <LogSlider id={`${uid}-s`} label="σ dei neuroni del pattern" latex="\sigma" values={SIGMA_STEPS} value={sigma} onChange={setSigma} format={formatH} />
      <Slider id={`${uid}-prior`} label="Probabilità a priori del salmone" latex="P(\omega_1)" min={PRIOR.min} max={PRIOR.max} step={PRIOR.step} value={prior} onChange={setPrior} />
      <Segmented id={`${uid}-shape`} label="Forma della classe spigola" options={(Object.keys(SHAPES) as Shape[]).map((s) => ({ value: s, label: SHAPES[s] }))} value={shape} onChange={setShape} />
      <Toggle id={`${uid}-ad`} label="σ_k adattiva (3 vicini della stessa classe)" checked={adaptive} onChange={setAdaptiveUser} />
      <p className="m-0 text-[length:var(--step--1)] text-muted">
        Il pesce di test si trascina o si sposta con le frecce. Sulla rete: passa su un neurone del pattern (o frecce con la rete a fuoco) per vedere il pesce che rappresenta.
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout label="Somma salmone" latex="\hat p(\mathbf x|\omega_1)" value={fw.dens[0]} format={f4} />
        <Readout label="Somma spigola" latex="\hat p(\mathbf x|\omega_2)" value={fw.dens[1]} format={f4} />
        <Readout label="Decisione" latex="\hat\omega" value={CLASS_NAMES[fw.decision]} pinned />
        <Readout label="Neurone evidenziato" value={hover === null ? '—' : `${hover + 1} · ${CLASS_NAMES[t.cls[hover]]} · ${fw.act[hover].toFixed(3)}`} />
      </div>
    </>
  )

  const captionBlock = (
    <div className="grid gap-4">
      <StepCaption index={sb.index} total={STEPS.length} label={sb.step.label} text={caption(sb.index, sigma)} />
      <div className="grid gap-4 border-t border-border pt-3">
        <Legend
          items={[
            { kind: 'dot', color: classVar(0), label: 'salmone ω₁ (cerchio)' },
            { kind: 'bar', color: classVar(1), label: 'spigola ω₂ (quadrato)' },
            { kind: 'band', color: 'var(--viz-highlight)', label: 'attivazione del neurone' },
          ]}
        />
        <StaticFormula
          label="Lo strato di somma: Parzen con kernel gaussiano per ogni classe"
          tex={String.raw`\hat{p}(\mathbf{x}\mid\omega_i)=\frac{1}{N_i}\sum_{k=1}^{N_i}\frac{1}{(2\pi\sigma^2)^{n/2}}\exp\left(-\frac{\|\mathbf{x}-\mathbf{x}_k^{(i)}\|^2}{2\sigma^2}\right)`}
        />
        <FormulaBox
          label="Lo strato di decisione, con i numeri"
          tex={String.raw`\begin{aligned}\hat{\omega}&=\arg\max_{i}\ P(\omega_i)\,\hat{p}(\mathbf{x}\mid\omega_i)\\ P(\omega_1)\,\hat p(\mathbf x|\omega_1)&=\val{P1}\cdot\val[4]{p1}=\val[4]{g1}\\ P(\omega_2)\,\hat p(\mathbf x|\omega_2)&=\val{P2}\cdot\val[4]{p2}=\val[4]{g2}\end{aligned}`}
          values={values}
          announce
        />
        <p className="m-0 text-[length:var(--step--1)] text-muted">
          Approfondimento: la fonte dice solo che il metodo di Specht si implementa con le PNN (slide p65); l'architettura a quattro strati è quella classica di Specht. Note p44-45: il kernel gaussiano è
          regolare, tratta dati ad alta dimensionalità con simmetria sferica e si adatta a densità di molti tipi.
        </p>
      </div>
    </div>
  )

  const challenge = (
    <div className="grid gap-4">
      <Challenge prompt={PROMPT} hint={HINT} status={status} onCheck={check} />
      {checkedValid !== null ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          <Readout label="Accuratezza sul validation set" value={`${Math.round(valAcc * 20)}/20`} pinned />
          <Readout label="Accuratezza migliore" value={target === null ? 'scegli una forma curva' : `${Math.round(target.acc * 20)}/20`} />
          <Readout label="σ vincente" value={target === null ? '—' : formatH(target.sigma)} />
          <Readout label="Condizioni" value={adaptive || prior !== 0.5 ? 'σ fissa e prior 0.5' : 'ok'} />
        </div>
      ) : null}
      <p className="m-0 text-[length:var(--step--1)] text-muted">
        Il validation set è nascosto: la lettura dell'accuratezza compare solo dopo la verifica. Qui, con σ = <span className="num">{formatH(sigma)}</span>, la rete classifica il pesce di test come{' '}
        {CLASS_NAMES[fw.decision]} (<span className="num">{f3(fw.joint[0])}</span> contro <span className="num">{f3(fw.joint[1])}</span>).
      </p>
    </div>
  )

  return (
    <WidgetFrame meta={meta} aspect={narrow ? 0.62 : 1.9} onReset={reset} transport={<PlayControls sb={sb} steps={STEPS} />} caption={captionBlock} controls={controls} challenge={challenge}>
      {terrain}
    </WidgetFrame>
  )
}
