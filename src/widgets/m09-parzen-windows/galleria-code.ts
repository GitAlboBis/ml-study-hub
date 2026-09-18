// Logica del widget m09-galleria-kernel-code (concetti c36 esponenziale, c37 Cauchy, c38 sinc², c39 perché il gaussiano
// è il più usato). Importi delle transazioni con carta di un cliente, in log10 degli euro: 40 spese fra 10 e 200 € più
// un importo sospetto da 5000 € (3.7). Il punteggio di anomalia −log p̂(importo) dipende da come il kernel tratta i
// punti lontani: code pesanti "perdonano" gli outlier, code leggere li isolano.
import { kernelValue } from '../../lib/ml/nonparam'
import type { Kernel } from '../../lib/ml/nonparam'
import { linspace } from '../../lib/ml/stats'
import { maximaAt, mixtureSamples } from './parzen-lab'

export type TailKernel = 'esponenziale' | 'cauchy' | 'sinc2' | 'gaussiano'
export const TAIL_KERNELS: readonly TailKernel[] = ['esponenziale', 'cauchy', 'sinc2', 'gaussiano']
export const LABEL: Readonly<Record<TailKernel, string>> = { esponenziale: 'esponenziale', cauchy: 'Cauchy', sinc2: 'sinc²', gaussiano: 'gaussiano' }

export const DOMAIN: readonly [number, number] = [0.5, 4.5]
/** 39 spese a seed fra 1 e 2.3 (10-200 €) più la più alta, 2.30 (200 €): l'importo sospetto dista 4 larghezze da lei. */
export const SAMPLES: readonly number[] = [...mixtureSamples(21, 39, [{ weight: 1, mu: 1.6, sigma: 0.3 }], [1, 2.29], 2), 2.3]
export const SUSPECT0 = 3.7
export const SUSPECT_RANGE: readonly [number, number] = [2.5, 4.5]
export const H0 = 0.35
export const H_RANGE: readonly [number, number] = [0.05, 1]
export const H_STEP = 0.01
/** Dove si legge il confronto delle code (u = 4, i numeri dell'inventario). */
export const U_READ = 4

export const gamma = (u: number, k: TailKernel): number => kernelValue(u, k as Kernel)

/** p̂(x) = (1/(N h)) Σ γ((x − x_k)/h) sui 40 importi abituali (quello sospetto non fa parte del training). */
export const estimateAt = (x: number, h: number, k: TailKernel, samples: readonly number[] = SAMPLES): number =>
  samples.reduce((s, xk) => s + gamma((x - xk) / h, k), 0) / (samples.length * h)

export const GRID = linspace(DOMAIN[0], DOMAIN[1], 801)
export const estimateOn = (h: number, k: TailKernel): number[] => GRID.map((x) => estimateAt(x, h, k))

/** Punteggio di anomalia: −ln p̂(x). Più alto = più anomalo. */
export const anomalyScore = (x: number, h: number, k: TailKernel): number => -Math.log(Math.max(estimateAt(x, h, k), 1e-300))

/** I quattro kernel dal più severo (punteggio più alto) al più indulgente. */
export const severityOrder = (x: number, h: number): TailKernel[] => [...TAIL_KERNELS].sort((a, b) => anomalyScore(x, h, b) - anomalyScore(x, h, a))

/** Il campione più vicino all'importo e il suo u = (x − x_k)/h. */
export function nearest(x: number, h: number): { xk: number; u: number } {
  let xk = SAMPLES[0]
  for (const s of SAMPLES) if (Math.abs(s - x) < Math.abs(xk - x)) xk = s
  return { xk, u: (x - xk) / h }
}

/** Le increspature: massimi locali della stima oltre quelli "veri" (la stima gaussiana con la stessa h). */
export const ripples = (h: number, k: TailKernel): number => maximaAt(GRID, estimateOn(h, k)).length

/** Valori notevoli dei grafici della slide p59. */
export const PEAK: Readonly<Record<TailKernel, { value: number; tex: string }>> = {
  esponenziale: { value: 0.5, tex: String.raw`\tfrac12` },
  cauchy: { value: 1 / Math.PI, tex: String.raw`\tfrac{1}{\pi}=0.318` },
  sinc2: { value: 1 / (2 * Math.PI), tex: String.raw`\tfrac{1}{2\pi}=0.159` },
  gaussiano: { value: 1 / Math.sqrt(2 * Math.PI), tex: String.raw`\tfrac{1}{\sqrt{2\pi}}=0.399` },
}

/** Il quadro dei sei kernel delle slide: continuo, derivabile, tipo di coda. */
export const SUMMARY: readonly { k: string; continuous: string; derivable: string; tail: string }[] = [
  { k: 'rettangolare', continuous: 'no', derivable: 'no', tail: 'nessuna (supporto compatto)' },
  { k: 'triangolare', continuous: 'sì', derivable: 'no (spigoli)', tail: 'nessuna (supporto compatto)' },
  { k: 'gaussiano', continuous: 'sì', derivable: 'sì', tail: 'leggerissima, e^{−u²/2}' },
  { k: 'esponenziale', continuous: 'sì', derivable: 'no nell’origine (cuspide)', tail: 'esponenziale, e^{−|u|}' },
  { k: 'Cauchy', continuous: 'sì', derivable: 'sì', tail: 'pesante, 1/u²' },
  { k: 'sinc²', continuous: 'sì', derivable: 'sì', tail: 'oscillante, zeri in ±2π, ±4π, …' },
]

// --- racconto ---

export type Tab = TailKernel | 'verdetto'

export const STEP = { quadro: 0, code: 1, esp: 2, cauchy: 3, sinc: 4, gauss: 5, verdetto: 6 } as const

export const STEPS = [
  { id: 'quadro', label: 'Tre kernel dalle code diverse', durationMs: 1500 },
  { id: 'code', label: 'Confronta le code, in scala logaritmica', durationMs: 1800 },
  { id: 'esp', label: 'Esponenziale: una cuspide per campione', durationMs: 1500 },
  { id: 'cauchy', label: 'Cauchy: code pesanti, l\'outlier è perdonato', durationMs: 1500 },
  { id: 'sinc', label: 'sinc²: increspature spurie', durationMs: 1500 },
  { id: 'gauss', label: 'Gaussiano: l\'importo sospetto resta isolato', durationMs: 1500 },
  { id: 'verdetto', label: 'Il verdetto', durationMs: 1500 },
] as const

export const tabOfStep = (index: number): Tab | null =>
  index === STEP.esp ? 'esponenziale' : index === STEP.cauchy ? 'cauchy' : index === STEP.sinc ? 'sinc2' : index === STEP.gauss ? 'gaussiano' : index === STEP.verdetto ? 'verdetto' : null

export interface CaptionCtx {
  h: string
  score: string
  k: string
}

export function captionFor(index: number, c: CaptionCtx): string {
  switch (index) {
    case STEP.quadro:
      return String.raw`Gli importi delle spese con carta di un cliente, in $\log_{10}$ degli euro: 40 spese abituali fra 10 e 200 € e un importo sospetto da 5000 € (3.7), forse una frode. Il punteggio di anomalia è $-\ln \hat p(\text{importo})$: con il kernel ${c.k} e $h = ${c.h}$ vale ${c.score}. Sopra, la forma del kernel con i valori della slide p59.`
    case STEP.code:
      return String.raw`In scala logaritmica le code si separano: la gaussiana precipita come una parabola rovesciata, l'esponenziale scende in linea retta, Cauchy resta alta, sinc² rimbalza fra un lobo e l'altro. In $u = 4$: $0.00013$, $0.0092$, $0.019$ e $0.033$.`
    case STEP.esp:
      return String.raw`$\gamma(x) = \frac12\exp(-|x|)$, picco $\frac12$ (*exponential kernel*): decade in fretta ma ha una **cuspide** nell'origine (non è derivabile), e la stima ne lascia una su ogni campione.`
    case STEP.cauchy:
      return String.raw`$\gamma(x) = \frac1\pi\cdot\frac{1}{1 + x^2}$, picco $1/\pi = 0.318$ (*Cauchy kernel*): code pesanti (*heavy tails*), i punti lontani pesano ancora. L'importo estremo riceve una densità non trascurabile: l'outlier viene "perdonato".`
    case STEP.sinc:
      return String.raw`$\gamma(x) = \frac{1}{2\pi}\big(\frac{\sin(x/2)}{x/2}\big)^2$, picco $\frac{1}{2\pi} = 0.159$, lobi che toccano zero in $\pm 2\pi, \pm 4\pi$: utile per l'interpolazione dei segnali, ma nella stima crea **increspature spurie** fra i campioni. Il quadrato garantisce $\gamma \ge 0$.`
    case STEP.gauss:
      return String.raw`Il gaussiano isola nettamente l'importo sospetto: la sua coda leggera dice "qui non c'è nessuno". Il punteggio di anomalia è il più alto dei quattro.`
    default:
      return String.raw`Note p41: il gaussiano è il più usato per la regolarità (*smoothness*), le proprietà matematiche e l'efficacia su molte distribuzioni, e offre in genere il miglior equilibrio fra bias e varianza. Gli altri servono in casi specifici: code pesanti (Cauchy), decadimento rapido (esponenziale), elaborazione dei segnali (sinc²).`
  }
}

export const KERNEL_TEX: Readonly<Record<TailKernel, string>> = {
  esponenziale: String.raw`\gamma(x)=\frac{1}{2}\exp(-|x|)`,
  cauchy: String.raw`\gamma(x)=\frac{1}{\pi}\cdot\frac{1}{1+x^2}`,
  sinc2: String.raw`\gamma(x)=\frac{1}{2\pi}\left(\frac{\sin(x/2)}{x/2}\right)^2`,
  gaussiano: String.raw`\gamma(x)=\frac{1}{\sqrt{2\pi}}\exp\left(-\frac{x^2}{2}\right)`,
}
export const TEX_LIVE = String.raw`u=\frac{\val{x}-\val{xk}}{\val{h}}=\val{u},\qquad \gamma(u)=\val[5]{g},\qquad -\ln\hat p(\val{x})=\val{score}`

export type Effect = '' | 'zero' | 'max' | 'neg'

export const CHALLENGE_PROMPT = String.raw`Con $h = 0.35$ l'importo sospetto (3.7) dista 4 larghezze dal campione più vicino. **(1)** Ordina i quattro kernel dal più **severo** (punteggio di anomalia più alto) al più **indulgente**, prima di guardare le barre. **(2)** Poi sposta l'importo finché, per il campione più vicino, $u = 2\pi$: che cosa succede al sinc²?`
export const CHALLENGE_HINT = String.raw`Severo = coda leggera: il kernel dà pochissimo peso al punto lontano, la densità è bassa e il punteggio alto. Attenzione: nella densità conta la somma su **tutti** i 40 campioni, non solo sul più vicino, e una coda che decade come $1/u^2$ raccoglie peso da tutti. Per la (2): i lobi del sinc² toccano zero in $u = \pm 2\pi$, cioè a $2\pi \cdot 0.35 \approx 2.2$ dal campione.`

export interface ChallengeVerdict {
  order: TailKernel[]
  orderOk: boolean
  uNow: number
  atTwoPi: boolean
  effectOk: boolean
  ok: boolean
}

export function judge(ranking: readonly (TailKernel | '')[], x: number, h: number, effect: Effect): ChallengeVerdict {
  const order = severityOrder(SUSPECT0, H0)
  const orderOk = ranking.length === 4 && ranking.every((k, i) => k === order[i])
  const { u } = nearest(x, h)
  const atTwoPi = Math.abs(h - H0) < 1e-9 && Math.abs(Math.abs(u) - 2 * Math.PI) <= 0.1
  const effectOk = effect === 'zero'
  return { order, orderOk, uNow: u, atTwoPi, effectOk, ok: orderOk && atTwoPi && effectOk }
}
