// Funzioni speciali e piccoli strumenti numerici comuni ai motori: erf ed erfc a precisione di macchina, densità e cdf
// normale con le code esatte, la sua inversa, gamma incompleta e chi-quadro, beta incompleta con cdf e quantili della
// Beta, binomiale (pmf in scala logaritmica, cdf e coda), logSumExp, massimo per sezione aurea, radice per bisezione,
// gradiente ed Hessiana numerici.
//
// Perché non basta `erf` di src/lib/ml/stats: quella è l'approssimazione di Abramowitz-Stegun (errore assoluto
// 1.5e−7), giusta per disegnare ma inutile per le code: l'errore di Bayes di due classi lontane (1e−9), la JM che
// satura o la probabilità di un box con α = 5 si leggerebbero a zero o con segno sbagliato. Qui erfc ha errore
// relativo dell'ordine di 1e−15 anche a erfc(10) ≈ 2e−45.
//
// Stesse regole di src/lib/ml: un argomento non valido (σ ≤ 0, probabilità fuori da [0, 1]) è un RangeError.
import { logGamma, normalPdf } from '../../../../lib/ml/stats'

const err = (fn: string, msg: string) => new RangeError(`${fn}: ${msg}`)
const SQRT_PI = Math.sqrt(Math.PI)
const EPS = 1e-16

// --- erf ed erfc ---

/** Sotto questa soglia erf si somma in serie; sopra, erfc si calcola con la frazione continua. */
const SPLIT = 2.5

/**
 * erf(x) per 0 ≤ x < SPLIT con la serie a termini tutti positivi (niente cancellazioni):
 * erf(x) = (2/√π) e^{−x²} Σ_n 2ⁿ x^{2n+1} / (1·3·5···(2n+1)).
 */
function erfSeries(x: number): number {
  const x2 = x * x
  let term = x
  let sum = x
  for (let n = 1; n < 200; n++) {
    term *= (2 * x2) / (2 * n + 1)
    sum += term
    if (term < EPS * sum) break
  }
  return (2 / SQRT_PI) * Math.exp(-x2) * sum
}

/**
 * erfc(x) per x ≥ SPLIT con la frazione continua di Laplace, valutata con il metodo di Lentz:
 * erfc(x) = e^{−x²}/√π · 1/(x + (1/2)/(x + 1/(x + (3/2)/(x + 2/(x + …))))).
 */
function erfcFraction(x: number): number {
  // oltre 27 e^{−x²} è sotto il più piccolo double: 0 (e +∞ non entra nella frazione come ∞/∞)
  if (x > 27) return 0
  const tiny = 1e-300
  let f = x
  let C = f
  let D = 0
  for (let k = 1; k < 5000; k++) {
    const a = k / 2
    D = x + a * D
    D = Math.abs(D) < tiny ? 1 / tiny : 1 / D
    C = x + a / C
    if (Math.abs(C) < tiny) C = tiny
    const delta = C * D
    f *= delta
    if (Math.abs(delta - 1) < EPS) break
  }
  return Math.exp(-x * x) / (SQRT_PI * f)
}

/** Funzione degli errori erf(x) = (2/√π) ∫₀ˣ e^{−t²} dt, a precisione di macchina. erf(±∞) = ±1, erf(NaN) = NaN. */
export function erf(x: number): number {
  if (Number.isNaN(x)) return Number.NaN
  const a = Math.abs(x)
  const v = a < SPLIT ? erfSeries(a) : 1 - erfcFraction(a)
  return x < 0 ? -v : v
}

/**
 * Funzione degli errori complementare erfc(x) = 1 − erf(x), con errore relativo piccolo anche nelle code
 * (erfc(5) ≈ 1.54e−12, erfc(10) ≈ 2.09e−45). Oltre x ≈ 26.5 vale 0 (sotto il double più piccolo).
 */
export function erfc(x: number): number {
  if (Number.isNaN(x)) return Number.NaN
  if (x >= SPLIT) return erfcFraction(x)
  if (x <= -SPLIT) return 2 - erfcFraction(-x)
  return 1 - erf(x)
}

// --- normale: cdf, coda, inversa ---

const checkSigma = (fn: string, sigma: number) => {
  if (!(Number.isFinite(sigma) && sigma > 0)) throw err(fn, `σ deve essere finita e > 0 (ricevuto ${sigma})`)
}

/**
 * Densità normale 1-D φ(x; μ, σ²) = e^{−(x − μ)²/(2σ²)} / (σ√(2π)): è normalPdf di src/lib/ml/stats, qui accanto a
 * cdf, coda e inversa perché i motori le trovino insieme. `sigma` è σ, non σ²; σ ≤ 0: RangeError.
 */
export const normPdf = (x: number, mu = 0, sigma = 1): number => normalPdf(x, mu, sigma)

/** Φ((x − μ)/σ) = P{X ≤ x} per X ~ N(μ, σ²), con la coda sinistra esatta (Φ(−8) ≈ 6.2e−16). `sigma` è σ, non σ². */
export function normCdf(x: number, mu = 0, sigma = 1): number {
  checkSigma('normCdf', sigma)
  return 0.5 * erfc(-(x - mu) / (sigma * Math.SQRT2))
}

/** Coda destra Q = 1 − Φ((x − μ)/σ) = P{X > x}, esatta anche dove 1 − Φ darebbe 0. */
export function normSf(x: number, mu = 0, sigma = 1): number {
  checkSigma('normSf', sigma)
  return 0.5 * erfc((x - mu) / (sigma * Math.SQRT2))
}

// Coefficienti dell'approssimazione razionale di Acklam per Φ⁻¹ (errore relativo ~1e−9), poi raffinata con Halley
const A = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239]
const B = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1]
const C = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783]
const D = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416]
const P_LOW = 0.02425

function acklam(p: number): number {
  if (p < P_LOW) {
    const q = Math.sqrt(-2 * Math.log(p))
    return (((((C[0] * q + C[1]) * q + C[2]) * q + C[3]) * q + C[4]) * q + C[5]) / ((((D[0] * q + D[1]) * q + D[2]) * q + D[3]) * q + 1)
  }
  if (p > 1 - P_LOW) {
    const q = Math.sqrt(-2 * Math.log1p(-p))
    return -(((((C[0] * q + C[1]) * q + C[2]) * q + C[3]) * q + C[4]) * q + C[5]) / ((((D[0] * q + D[1]) * q + D[2]) * q + D[3]) * q + 1)
  }
  const q = p - 0.5
  const r = q * q
  return ((((((A[0] * r + A[1]) * r + A[2]) * r + A[3]) * r + A[4]) * r + A[5]) * q) / (((((B[0] * r + B[1]) * r + B[2]) * r + B[3]) * r + B[4]) * r + 1)
}

/**
 * Quantile della normale standard z = Φ⁻¹(p): Φ(1.96) = 0.975. Inverte con precisione di macchina (Acklam più
 * passi di Halley sulla cdf esatta, sulla coda giusta). Φ⁻¹(0) = −∞, Φ⁻¹(1) = +∞; p fuori da [0, 1]: RangeError.
 */
export function normInv(p: number): number {
  if (!(p >= 0 && p <= 1)) throw err('normInv', `p deve stare in [0, 1] (ricevuto ${p})`)
  if (p === 0) return Number.NEGATIVE_INFINITY
  if (p === 1) return Number.POSITIVE_INFINITY
  if (p === 0.5) return 0
  let x = acklam(p)
  for (let i = 0; i < 6; i++) {
    // scarto calcolato sulla coda in cui sta x, così resta preciso anche per p vicino a 0 o a 1
    const e = x < 0 ? normCdf(x) - p : (1 - p) - normSf(x)
    const u = e * Math.sqrt(2 * Math.PI) * Math.exp((x * x) / 2)
    const step = u / (1 + (x * u) / 2)
    x -= step
    if (Math.abs(step) <= 1e-15 * Math.max(1, Math.abs(x))) break
  }
  return x
}

// --- gamma incompleta e chi-quadro ---

/**
 * Gamma incompleta inferiore regolarizzata P(a, x) = γ(a, x)/Γ(a), a > 0. Serie per x < a + 1, frazione continua di
 * Legendre per la coda altrimenti. x ≤ 0 dà 0, x = +∞ dà 1.
 */
export function gammaP(a: number, x: number): number {
  if (!(Number.isFinite(a) && a > 0)) throw err('gammaP', `a deve essere finito e > 0 (ricevuto ${a})`)
  if (Number.isNaN(x)) return Number.NaN
  if (x <= 0) return 0
  if (x === Number.POSITIVE_INFINITY) return 1
  const front = Math.exp(-x + a * Math.log(x) - logGamma(a))
  if (x < a + 1) {
    let ap = a
    let del = 1 / a
    let sum = del
    for (let n = 0; n < 10000; n++) {
      ap += 1
      del *= x / ap
      sum += del
      if (Math.abs(del) < Math.abs(sum) * EPS) break
    }
    return Math.min(1, sum * front)
  }
  const tiny = 1e-300
  let b = x + 1 - a
  let c = 1 / tiny
  let d = 1 / b
  let h = d
  for (let i = 1; i < 10000; i++) {
    const an = -i * (i - a)
    b += 2
    d = an * d + b
    if (Math.abs(d) < tiny) d = tiny
    c = b + an / c
    if (Math.abs(c) < tiny) c = tiny
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < EPS) break
  }
  return Math.max(0, 1 - front * h)
}

/**
 * Cdf della chi-quadro a k gradi di libertà: P{χ²_k ≤ x} = P(k/2, x/2). In n dimensioni è la massa di una gaussiana
 * dentro l'ellissoide di Mahalanobis r² = x (in 2-D: 1 − e^{−r²/2}). x ≤ 0 dà 0.
 */
export function chi2Cdf(x: number, k: number): number {
  if (!(Number.isFinite(k) && k > 0)) throw err('chi2Cdf', `i gradi di libertà devono essere > 0 (ricevuto ${k})`)
  return x <= 0 ? 0 : gammaP(k / 2, x / 2)
}

// --- beta incompleta, Beta e binomiale ---

const checkShape = (fn: string, a: number, b: number) => {
  if (!(Number.isFinite(a) && a > 0 && Number.isFinite(b) && b > 0)) throw err(fn, `a e b devono essere finiti e > 0 (ricevuti ${a}, ${b})`)
}

/** ln B(a, b) = ln Γ(a) + ln Γ(b) − ln Γ(a + b). */
const logBeta = (a: number, b: number) => logGamma(a) + logGamma(b) - logGamma(a + b)

/** Frazione continua della beta incompleta (Numerical Recipes, betacf), valutata con il metodo di Lentz. */
function betaFraction(a: number, b: number, x: number): number {
  const tiny = 1e-300
  const qab = a + b
  const qap = a + 1
  const qam = a - 1
  let c = 1
  let d = 1 - (qab * x) / qap
  if (Math.abs(d) < tiny) d = tiny
  d = 1 / d
  let h = d
  for (let m = 1; m < 10000; m++) {
    const m2 = 2 * m
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2))
    d = 1 + aa * d
    if (Math.abs(d) < tiny) d = tiny
    c = 1 + aa / c
    if (Math.abs(c) < tiny) c = tiny
    d = 1 / d
    h *= d * c
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2))
    d = 1 + aa * d
    if (Math.abs(d) < tiny) d = tiny
    c = 1 + aa / c
    if (Math.abs(c) < tiny) c = tiny
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < EPS) break
  }
  return h
}

/**
 * Beta incompleta regolarizzata I_x(a, b), con y = 1 − x passato a parte: chi ha p piccolo (la binomiale) dà x = 1 − p
 * e y = p senza perdere le cifre di p. La frazione continua si usa dal lato in cui converge in fretta; dall'altro lato
 * vale I_x(a, b) = 1 − I_y(b, a).
 */
function ibeta(a: number, b: number, x: number, y: number): number {
  if (!(x > 0)) return 0
  if (!(y > 0)) return 1
  const front = Math.exp(a * Math.log(x) + b * Math.log(y) - logBeta(a, b))
  if (x < (a + 1) / (a + b + 2)) return Math.min(1, (front * betaFraction(a, b, x)) / a)
  return Math.max(0, 1 - (front * betaFraction(b, a, y)) / b)
}

/**
 * Cdf della Beta(a, b): I_x(a, b) = ∫₀ˣ t^{a−1}(1 − t)^{b−1} dt / B(a, b). È il contenuto di probabilità della cella
 * K-NN (Beta(K, N − K + 1)) e la posteriori di una frequenza con prior Beta. x ≤ 0 dà 0, x ≥ 1 dà 1.
 */
export function betaCdf(x: number, a: number, b: number): number {
  checkShape('betaCdf', a, b)
  if (Number.isNaN(x)) return Number.NaN
  if (x <= 0) return 0
  if (x >= 1) return 1
  return ibeta(a, b, x, 1 - x)
}

/**
 * Quantile della Beta(a, b): l'x con I_x(a, b) = p, per bisezione (la cdf è crescente) fino a un errore relativo di
 * 1e−15 su x. Sopra p = ½ risolve la coda speculare 1 − x di Beta(b, a), così resta preciso anche vicino a 1.
 * Estremi di un intervallo di credibilità al 95%: betaInv(0.025, a, b) e betaInv(0.975, a, b). Da chiamare al clic o
 * al cambio di parametro, non a ogni fotogramma (circa 60 valutazioni della cdf).
 */
export function betaInv(p: number, a: number, b: number): number {
  checkShape('betaInv', a, b)
  if (!(p >= 0 && p <= 1)) throw err('betaInv', `p deve stare in [0, 1] (ricevuto ${p})`)
  if (p === 0) return 0
  if (p === 1) return 1
  if (p > 0.5) return 1 - betaInv(1 - p, b, a)
  let lo = 0
  let hi = 1
  for (let i = 0; i < 400; i++) {
    const mid = (lo + hi) / 2
    if (ibeta(a, b, mid, 1 - mid) < p) lo = mid
    else hi = mid
    if (hi - lo <= 1e-15 * hi) break
  }
  return (lo + hi) / 2
}

const checkBinomial = (fn: string, n: number, p: number) => {
  if (!(Number.isInteger(n) && n >= 0)) throw err(fn, `n deve essere un intero ≥ 0 (ricevuto ${n})`)
  if (!(p >= 0 && p <= 1)) throw err(fn, `p deve stare in [0, 1] (ricevuto ${p})`)
}

/** ln C(n, k) = ln Γ(n + 1) − ln Γ(k + 1) − ln Γ(n − k + 1), per 0 ≤ k ≤ n (anche n = 1000 senza traboccare). */
export function logChoose(n: number, k: number): number {
  if (!(Number.isInteger(n) && n >= 0 && Number.isInteger(k) && k >= 0 && k <= n)) throw err('logChoose', `servono interi 0 ≤ k ≤ n (ricevuti n = ${n}, k = ${k})`)
  if (k === 0 || k === n) return 0
  return logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1)
}

/**
 * ln P{K = k} per K ~ Binomiale(n, p): ln C(n, k) + k ln p + (n − k) ln(1 − p). Un k fuori da {0, …, n} dà −∞; con
 * p = 0 o p = 1 la massa è tutta in k = 0 o k = n.
 */
export function binomialLogPmf(k: number, n: number, p: number): number {
  checkBinomial('binomialLogPmf', n, p)
  if (!(Number.isInteger(k) && k >= 0 && k <= n)) return Number.NEGATIVE_INFINITY
  if (p === 0) return k === 0 ? 0 : Number.NEGATIVE_INFINITY
  if (p === 1) return k === n ? 0 : Number.NEGATIVE_INFINITY
  return logChoose(n, k) + k * Math.log(p) + (n - k) * Math.log1p(-p)
}

/** P{K = k} = C(n, k) pᵏ (1 − p)^{n−k}: quanti degli N campioni cadono nella regione R di probabilità p (m08). */
export const binomialPmf = (k: number, n: number, p: number): number => Math.exp(binomialLogPmf(k, n, p))

/**
 * P{K ≤ k} per K ~ Binomiale(n, p), dalla beta incompleta: I_{1−p}(n − k, k + 1). Precisa anche nella coda sinistra
 * (P{K ≤ 5} con n = 1000, p = ½ vale 7.7e−289). Un k non intero vale ⌊k⌋.
 */
export function binomialCdf(k: number, n: number, p: number): number {
  checkBinomial('binomialCdf', n, p)
  const kk = Math.floor(k)
  if (kk < 0) return 0
  if (kk >= n) return 1
  return ibeta(n - kk, kk + 1, 1 - p, p)
}

/** Coda destra P{K > k} = I_p(k + 1, n − k), precisa dove 1 − binomialCdf darebbe 0. */
export function binomialSf(k: number, n: number, p: number): number {
  checkBinomial('binomialSf', n, p)
  const kk = Math.floor(k)
  if (kk < 0) return 1
  if (kk >= n) return 0
  return ibeta(kk + 1, n - kk, p, 1 - p)
}

// --- piccoli strumenti ---

/** ln Σ e^{v_i} senza traboccare. Vuoto: −∞. Con un +∞ fra i valori: +∞. */
export function logSumExp(values: readonly number[]): number {
  let m = Number.NEGATIVE_INFINITY
  for (const v of values) if (v > m) m = v
  if (m === Number.NEGATIVE_INFINITY || m === Number.POSITIVE_INFINITY) return m
  let s = 0
  for (const v of values) s += Math.exp(v - m)
  return m + Math.log(s)
}

const INV_PHI = (Math.sqrt(5) - 1) / 2

/**
 * Massimo di una funzione unimodale su [a, b] per sezione aurea (s* di Chernoff, un criterio contro θ).
 * Confronta alla fine anche gli estremi, così un massimo sul bordo non si perde.
 */
export function goldenMax(f: (x: number) => number, a: number, b: number, tol = 1e-10): { x: number; fx: number } {
  if (!(b >= a)) throw err('goldenMax', `serve a ≤ b (ricevuti ${a}, ${b})`)
  let lo = a
  let hi = b
  let x1 = hi - INV_PHI * (hi - lo)
  let x2 = lo + INV_PHI * (hi - lo)
  let f1 = f(x1)
  let f2 = f(x2)
  for (let i = 0; i < 300 && hi - lo > tol * Math.max(1, Math.abs(lo) + Math.abs(hi)); i++) {
    if (f1 < f2) {
      lo = x1
      x1 = x2
      f1 = f2
      x2 = lo + INV_PHI * (hi - lo)
      f2 = f(x2)
    } else {
      hi = x2
      x2 = x1
      f2 = f1
      x1 = hi - INV_PHI * (hi - lo)
      f1 = f(x1)
    }
  }
  let best = { x: (lo + hi) / 2, fx: f((lo + hi) / 2) }
  for (const x of [a, b]) {
    const fx = f(x)
    if (fx > best.fx) best = { x, fx }
  }
  return best
}

/** Radice di f in [a, b] per bisezione: f(a) e f(b) devono avere segni opposti (o uno dei due essere 0). */
export function bisectRoot(f: (x: number) => number, a: number, b: number, tol = 1e-14): number {
  let lo = a
  let hi = b
  let flo = f(lo)
  const fhi = f(hi)
  if (flo === 0) return lo
  if (fhi === 0) return hi
  if (!(flo * fhi < 0)) throw err('bisectRoot', `f(a) e f(b) devono avere segni opposti (${flo}, ${fhi})`)
  for (let i = 0; i < 400; i++) {
    const mid = (lo + hi) / 2
    const fm = f(mid)
    if (fm === 0) return mid
    if (fm * flo < 0) hi = mid
    else {
      lo = mid
      flo = fm
    }
    if (hi - lo <= tol * Math.max(1, Math.abs(mid))) break
  }
  return (lo + hi) / 2
}

/** Gradiente con differenze centrali (passo relativo 1e−5): per il paesaggio di una funzione senza gradiente esplicito. */
export function numericGradient(f: (theta: readonly number[]) => number, theta: readonly number[]): number[] {
  return theta.map((t, i) => {
    const h = 1e-5 * Math.max(1, Math.abs(t))
    const up = [...theta]
    const dn = [...theta]
    up[i] = t + h
    dn[i] = t - h
    return (f(up) - f(dn)) / (2 * h)
  })
}

/** Hessiana con differenze centrali (passo relativo 1e−4), simmetrica: curvatura dei punti stazionari (massimo o sella). */
export function numericHessian(f: (theta: readonly number[]) => number, theta: readonly number[]): number[][] {
  const n = theta.length
  const h = theta.map((t) => 1e-4 * Math.max(1, Math.abs(t)))
  const at = (di: number, i: number, dj: number, j: number) => {
    const p = [...theta]
    p[i] += di * h[i]
    p[j] += dj * h[j]
    return f(p)
  }
  const f0 = f(theta)
  const H = Array.from({ length: n }, () => new Array<number>(n).fill(0))
  for (let i = 0; i < n; i++) {
    const p = [...theta]
    const m = [...theta]
    p[i] += h[i]
    m[i] -= h[i]
    H[i][i] = (f(p) - 2 * f0 + f(m)) / (h[i] * h[i])
    for (let j = i + 1; j < n; j++) {
      H[i][j] = H[j][i] = (at(1, i, 1, j) - at(1, i, -1, j) - at(-1, i, 1, j) + at(-1, i, -1, j)) / (4 * h[i] * h[j])
    }
  }
  return H
}
