import type { Rng } from '../../content/types'

// Statistica di base per i widget: griglie, integrali, momenti, istogramma, densità note e campionamento a seed.
//
// Regole comuni a tutta la libreria numerica (src/lib/ml):
// - un parametro non valido (σ ≤ 0, numero di bin < 1, lunghezze diverse...) è un errore di chi chiama: RangeError
// - un campione vuoto non è un errore: ogni funzione dichiara che cosa restituisce (NaN per i momenti, 0 per le stime)
// - nessuna densità restituisce Infinity: fuori dal supporto APERTO vale 0, anche dove il limite della formula diverge
//   (Gamma con k < 1 in x = 0, Beta con a < 1 in x = 0), così i tracciati e gli integrali numerici restano finiti.
//   Ai limiti del double (σ sub-normale, x sul più piccolo double positivo) il valore si ferma a Number.MAX_VALUE:
//   enorme ma disegnabile, mai Infinity e mai NaN

/** Punto o vettore di feature: [x] in 1-D, [x₁, x₂] in 2-D, e così via. */
export type Vec = readonly number[]
/** Matrice per righe, es. la covarianza 2×2 [[σ₁², σ₁₂], [σ₁₂, σ₂²]]. */
export type Mat = readonly Vec[]

const err = (fn: string, msg: string) => new RangeError(`${fn}: ${msg}`)
const positive = (v: number) => Number.isFinite(v) && v > 0
const count = (fn: string, n: number) => {
  if (!Number.isInteger(n) || n < 0) throw err(fn, `n deve essere un intero ≥ 0 (ricevuto ${n})`)
}
/** Una densità non restituisce mai Infinity: oltre il double più grande si ferma lì. */
const cap = (v: number) => (v > Number.MAX_VALUE ? Number.MAX_VALUE : v)

// --- griglie e integrali ---

/** n punti equispaziati da a a b, estremi inclusi; l'ultimo è esattamente b. n = 1 dà [a], n = 0 dà []. */
export function linspace(a: number, b: number, n: number): number[] {
  count('linspace', n)
  if (n === 0) return []
  if (n === 1) return [a]
  const step = (b - a) / (n - 1)
  const out = Array.from({ length: n }, (_, i) => a + i * step)
  out[n - 1] = b
  return out
}

/**
 * Integrale con la regola dei trapezi su una griglia qualsiasi (anche non uniforme).
 * Con meno di due punti l'area è 0. Una griglia decrescente cambia il segno del risultato.
 */
export function trapz(xs: readonly number[], ys: readonly number[]): number {
  if (xs.length !== ys.length) throw err('trapz', `griglia (${xs.length}) e valori (${ys.length}) hanno lunghezze diverse`)
  let s = 0
  for (let i = 1; i < xs.length; i++) s += ((xs[i] - xs[i - 1]) * (ys[i] + ys[i - 1])) / 2
  return s
}

// --- momenti campionari ---

/** Media aritmetica m̂ = (1/N) Σ x_k. Campione vuoto: NaN. */
export function mean(xs: readonly number[]): number {
  if (xs.length === 0) return Number.NaN
  let s = 0
  for (const x of xs) s += x
  return s / xs.length
}

/**
 * Varianza. Per default divide per N: è la stima a massima verosimiglianza, distorta (E{σ̂²} = (N−1)/N · σ²).
 * Con `sample = true` divide per N − 1: è la versione non distorta (varianza campionaria).
 * Campione vuoto: NaN. Campione singolo: 0 con 1/N, NaN con 1/(N−1) perché 0/0 non è definito.
 */
export function variance(xs: readonly number[], sample = false): number {
  return covariance(xs, xs, sample)
}

/** Covarianza tra due serie appaiate, con la stessa scelta 1/N (default) oppure 1/(N−1) di `variance`. */
export function covariance(xs: readonly number[], ys: readonly number[], sample = false): number {
  if (xs.length !== ys.length) throw err('covariance', `le due serie hanno lunghezze diverse (${xs.length} e ${ys.length})`)
  const d = sample ? xs.length - 1 : xs.length
  if (d <= 0) return Number.NaN
  const mx = mean(xs), my = mean(ys)
  let s = 0
  for (let i = 0; i < xs.length; i++) s += (xs[i] - mx) * (ys[i] - my)
  return s / d
}

/**
 * Matrice di covarianza Σ̂ = (1/N) Σ (x_k − m̂)(x_k − m̂)ᵗ di N punti n-dimensionali; con `sample = true` divide per N − 1.
 * Nessun punto: []. Un punto solo con `sample = true`: matrice di NaN.
 */
export function covarianceMatrix(points: Mat, sample = false): number[][] {
  if (points.length === 0) return []
  const n = points[0].length
  if (points.some((p) => p.length !== n)) throw err('covarianceMatrix', 'i punti non hanno tutti la stessa dimensione')
  const cols = Array.from({ length: n }, (_, j) => points.map((p) => p[j]))
  const out = Array.from({ length: n }, () => new Array<number>(n).fill(0))
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) out[i][j] = out[j][i] = covariance(cols[i], cols[j], sample)
  return out
}

// --- istogramma ---

export interface HistogramBin {
  /** estremo sinistro, incluso */
  x0: number
  /** estremo destro, escluso tranne che nell'ultimo bin */
  x1: number
  /** K: quanti valori cadono nel bin */
  count: number
  /** stima della densità nel bin: K / (N · larghezza) */
  density: number
}

/**
 * Istogramma a `bins` intervalli di pari larghezza, con la normalizzazione a densità p̂ = K / (N·V):
 * è la stessa formula della stima non parametrica, con V = larghezza del bin.
 *
 * - `domain` assente: va dal minimo al massimo dei dati (se coincidono si allarga di 0.5 per lato).
 * - Ogni bin è [x0, x1); l'ultimo è chiuso, così il massimo non resta fuori.
 * - N è il numero dei valori FINITI: NaN e ±Infinity non sono campioni, non contano in nessun bin né in N.
 *   I valori finiti fuori dal dominio non si contano in nessun bin ma restano in N: l'area dell'istogramma è la
 *   frazione dei campioni finiti caduta nel dominio (esattamente 1 con il dominio automatico) e il confronto con la
 *   pdf vera resta corretto anche quando il grafico ne mostra solo una parte.
 * - Campione vuoto: [] senza dominio, bin con conteggio e densità 0 con il dominio.
 */
export function histogram(xs: readonly number[], bins: number, domain?: readonly [number, number]): HistogramBin[] {
  if (!Number.isInteger(bins) || bins < 1) throw err('histogram', `il numero di bin deve essere un intero ≥ 1 (ricevuto ${bins})`)
  let lo: number, hi: number
  if (domain) {
    ;[lo, hi] = domain
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo) throw err('histogram', `dominio non valido [${lo}, ${hi}]`)
  } else {
    const finite = xs.filter((x) => Number.isFinite(x))
    if (finite.length === 0) return []
    lo = finite.reduce((m, x) => Math.min(m, x), Number.POSITIVE_INFINITY)
    hi = finite.reduce((m, x) => Math.max(m, x), Number.NEGATIVE_INFINITY)
    if (lo === hi) { lo -= 0.5; hi += 0.5 }
  }
  const width = (hi - lo) / bins
  const counts = new Array<number>(bins).fill(0)
  let n = 0
  for (const x of xs) {
    if (!Number.isFinite(x)) continue
    n++
    if (!(x >= lo && x <= hi)) continue
    counts[Math.min(bins - 1, Math.floor((x - lo) / width))]++
  }
  return counts.map((c, i) => ({
    x0: lo + i * width,
    x1: i === bins - 1 ? hi : lo + (i + 1) * width,
    count: c,
    density: n === 0 ? 0 : c / (n * width),
  }))
}

// --- densità normale ---

/** Pdf normale 1-D. Attenzione: `sigma` è la deviazione standard σ (come in `Rng.normal`), non la varianza σ². */
export function normalPdf(x: number, mu = 0, sigma = 1): number {
  if (!positive(sigma)) throw err('normalPdf', `σ deve essere > 0 (ricevuto ${sigma})`)
  const z = (x - mu) / sigma
  return cap(Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI)))
}

/** Funzione degli errori erf(x), approssimazione di Abramowitz-Stegun 7.1.26: errore assoluto < 1.5e-7. */
export function erf(x: number): number {
  const a = Math.abs(x)
  const t = 1 / (1 + 0.3275911 * a)
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))))
  const y = 1 - poly * Math.exp(-a * a)
  return x < 0 ? -y : y
}

/** Cdf normale P{X ≤ x} (precisione di `erf`, circa 1e-7): P(a ≤ X ≤ b) = normalCdf(b) − normalCdf(a). */
export function normalCdf(x: number, mu = 0, sigma = 1): number {
  if (!positive(sigma)) throw err('normalCdf', `σ deve essere > 0 (ricevuto ${sigma})`)
  return 0.5 * (1 + erf((x - mu) / (sigma * Math.SQRT2)))
}

/** Controlla che la covarianza 2×2 sia simmetrica e definita positiva; restituisce [σ₁², σ₁₂, σ₂², det]. */
function cov2(fn: string, cov: Mat): [number, number, number, number] {
  if (cov.length !== 2 || cov[0].length !== 2 || cov[1].length !== 2) throw err(fn, 'la covarianza deve essere 2×2')
  const [[a, b], [c, d]] = cov
  if (!(Math.abs(b - c) <= 1e-12 * Math.max(1, Math.abs(b), Math.abs(c)))) throw err(fn, 'la covarianza non è simmetrica')
  const det = a * d - b * b
  if (!positive(a) || !positive(det)) throw err(fn, 'la covarianza non è definita positiva')
  return [a, b, d, det]
}

/**
 * Pdf normale bivariata p(x) = exp{−½ (x−m)ᵗ Σ⁻¹ (x−m)} / (2π |Σ|^{1/2}).
 * `cov` deve essere simmetrica e definita positiva: una covarianza singolare non ha densità, quindi RangeError.
 */
export function normalPdf2d(x: Vec, mean: Vec, cov: Mat): number {
  if (x.length !== 2 || mean.length !== 2) throw err('normalPdf2d', 'x e la media devono avere 2 componenti')
  const [a, b, d, det] = cov2('normalPdf2d', cov)
  const dx = x[0] - mean[0], dy = x[1] - mean[1]
  const q = (d * dx * dx - 2 * b * dx * dy + a * dy * dy) / det
  return Math.exp(-0.5 * q) / (2 * Math.PI * Math.sqrt(det))
}

// --- campionamento (sempre attraverso l'Rng a seed: stesso seed, stessi dati) ---

/** n campioni da N(μ, σ²). σ = 0 è ammesso e dà un campione degenere di valori tutti uguali a μ. */
export function sampleNormal(rng: Rng, n: number, mu = 0, sigma = 1): number[] {
  count('sampleNormal', n)
  if (!(Number.isFinite(sigma) && sigma >= 0)) throw err('sampleNormal', `σ deve essere ≥ 0 (ricevuto ${sigma})`)
  return Array.from({ length: n }, () => rng.normal(mu, sigma))
}

/** Un modo gaussiano 1-D di una mistura. I pesi non devono sommare a 1: vengono normalizzati. */
export interface MixtureComponent { weight: number; mu: number; sigma: number }

function totalWeight(fn: string, components: readonly MixtureComponent[]): number {
  if (components.length === 0) throw err(fn, 'la mistura non ha componenti')
  if (components.some((c) => !(Number.isFinite(c.weight) && c.weight >= 0))) throw err(fn, 'i pesi devono essere ≥ 0')
  const total = components.reduce((s, c) => s + c.weight, 0)
  if (!(total > 0)) throw err(fn, 'almeno un peso deve essere > 0')
  return total
}

/** Come `sampleMixture`, ma ricorda per ogni campione l'indice del modo che l'ha generato (la variabile nascosta di EM). */
export function sampleMixtureLabeled(rng: Rng, n: number, components: readonly MixtureComponent[]): { x: number; component: number }[] {
  count('sampleMixture', n)
  const total = totalWeight('sampleMixture', components)
  return Array.from({ length: n }, () => {
    // prima si estrae il modo in proporzione ai pesi, poi il valore dalla sua gaussiana
    // (un modo di peso 0 non esce mai: servirebbe acc ≤ u < acc + 0)
    const u = rng.next() * total
    let component = 0
    let acc = components[0].weight
    while (u >= acc && component < components.length - 1) acc += components[++component].weight
    const c = components[component]
    return { x: rng.normal(c.mu, c.sigma), component }
  })
}

/** n campioni dalla mistura di gaussiane p(x) = Σ P_i N(x; μ_i, σ_i²). */
export function sampleMixture(rng: Rng, n: number, components: readonly MixtureComponent[]): number[] {
  return sampleMixtureLabeled(rng, n, components).map((s) => s.x)
}

/** Pdf della mistura p(x) = Σ P_i N(x; μ_i, σ_i²), con P_i = peso_i / somma dei pesi: è la "densità vera" dei dati sintetici. */
export function mixturePdf(x: number, components: readonly MixtureComponent[]): number {
  const total = totalWeight('mixturePdf', components)
  return cap(components.reduce((s, c) => s + (c.weight / total) * normalPdf(x, c.mu, c.sigma), 0))
}

/** n punti [x₁, x₂] da una normale bivariata, con la fattorizzazione di Cholesky Σ = L Lᵗ. */
export function sampleNormal2d(rng: Rng, n: number, mean: Vec, cov: Mat): number[][] {
  count('sampleNormal2d', n)
  if (mean.length !== 2) throw err('sampleNormal2d', 'la media deve avere 2 componenti')
  const [a, b, d] = cov2('sampleNormal2d', cov)
  const l11 = Math.sqrt(a), l21 = b / l11, l22 = Math.sqrt(d - l21 * l21)
  return Array.from({ length: n }, () => {
    const z1 = rng.normal(), z2 = rng.normal()
    return [mean[0] + l11 * z1, mean[1] + l21 * z1 + l22 * z2]
  })
}

// --- funzione Gamma e densità su supporto limitato ---

// Coefficienti di Lanczos (g = 7, 9 termini): errore relativo su ln Γ dell'ordine di 1e-15
const LANCZOS = [
  0.9999999999998099, 676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.6150291621406,
  12.507343278686905, -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7,
]

/** ln Γ(z) per z > 0. Si lavora con il logaritmo perché Γ(z) trabocca già a z ≈ 171. */
export function logGamma(z: number): number {
  if (!positive(z)) throw err('logGamma', `definita qui solo per z > 0 (ricevuto ${z})`)
  // formula di riflessione per z piccolo, dove Lanczos perde precisione
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z)
  const w = z - 1
  const t = w + 7.5
  let a = LANCZOS[0]
  for (let i = 1; i < LANCZOS.length; i++) a += LANCZOS[i] / (w + i)
  return 0.5 * Math.log(2 * Math.PI) + (w + 0.5) * Math.log(t) - t + Math.log(a)
}

/**
 * Pdf Gamma nella parametrizzazione del corso: f(x; k, θ) = x^{k−1} e^{−x/θ} / (θ^k Γ(k)) per x > 0,
 * con k forma e θ scala (media kθ, varianza kθ², moda (k−1)θ; la chi-quadro a k gradi è Gamma(k/2, θ = 2)).
 * Per x ≤ 0 vale 0, anche in x = 0 con k ≤ 1 dove il limite destro è 1/θ o diverge.
 */
export function gammaPdf(x: number, k: number, theta: number): number {
  if (!positive(k) || !positive(theta)) throw err('gammaPdf', `k e θ devono essere > 0 (ricevuti ${k}, ${theta})`)
  if (!(x > 0)) return 0
  return cap(Math.exp((k - 1) * Math.log(x) - x / theta - k * Math.log(theta) - logGamma(k)))
}

/** Pdf di Rayleigh f(x | σ) = x exp(−x²/(2σ²)) / σ² per x ≥ 0: moda in σ, dove vale 1/(σ√e). Per x ≤ 0 vale 0. */
export function rayleighPdf(x: number, sigma: number): number {
  if (!positive(sigma)) throw err('rayleighPdf', `σ deve essere > 0 (ricevuto ${sigma})`)
  if (!(x > 0)) return 0
  const direct = (x * Math.exp((-x * x) / (2 * sigma * sigma))) / (sigma * sigma)
  if (Number.isFinite(direct)) return direct
  // σ sub-normale: σ² diventa 0 e la formula dà 0/0 o ∞/∞. Con z = x/σ è z·exp(−z²/2)/σ, e oltre z ≈ 40 è 0
  const z = x / sigma
  return z > 40 ? 0 : cap((z * Math.exp(-0.5 * z * z)) / sigma)
}

/**
 * Pdf Beta f(x; a, b) = x^{a−1} (1−x)^{b−1} Γ(a+b) / (Γ(a) Γ(b)) per 0 < x < 1 (media a/(a+b)).
 * Fuori dall'intervallo aperto vale 0, estremi compresi: con a < 1 o b < 1 lì la formula divergerebbe.
 */
export function betaPdf(x: number, a: number, b: number): number {
  if (!positive(a) || !positive(b)) throw err('betaPdf', `a e b devono essere > 0 (ricevuti ${a}, ${b})`)
  if (!(x > 0 && x < 1)) return 0
  return cap(Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) + logGamma(a + b) - logGamma(a) - logGamma(b)))
}

/**
 * Pdf di Dirichlet f(x; α) = Γ(Σα_i) / Π Γ(α_i) · Π x_i^{α_i − 1} sul simplesso (x_i > 0, Σ x_i = 1); con due
 * componenti è la Beta. Un punto fuori dal simplesso aperto (somma diversa da 1 oltre 1e-9, o una componente ≤ 0) dà 0.
 */
export function dirichletPdf(x: Vec, alpha: Vec): number {
  if (x.length !== alpha.length || x.length < 2) throw err('dirichletPdf', 'x e α devono avere la stessa lunghezza, almeno 2')
  if (alpha.some((a) => !positive(a))) throw err('dirichletPdf', 'ogni α_i deve essere > 0')
  if (x.some((v) => !(v > 0)) || Math.abs(x.reduce((s, v) => s + v, 0) - 1) > 1e-9) return 0
  let logp = logGamma(alpha.reduce((s, a) => s + a, 0))
  for (let i = 0; i < x.length; i++) logp += (alpha[i] - 1) * Math.log(x[i]) - logGamma(alpha[i])
  return cap(Math.exp(logp))
}
