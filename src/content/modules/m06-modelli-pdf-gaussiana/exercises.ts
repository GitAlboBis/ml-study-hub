// Esercizi generativi del modulo m06 (modelli di pdf e modello gaussiano): uno per ogni esercizio dell'inventario (es01-es21).
// Ogni generatore usa solo rng: stesso seed, stessa istanza. I conti stanno in `calcoli`, così la verifica li confronta
// con i numeri dell'inventario (slide 22-31 del Cap. 2, note part1 p21-26).
import { md } from '../../types'
import type { Exercise, ExerciseAnswer } from '../../types'

// ---------------------------------------------------------------------------------------------------
// Calcoli
// ---------------------------------------------------------------------------------------------------

type V2 = [number, number]
/** Matrice 2×2 simmetrica scritta come [σ1², σ12, σ2²]. */
type S2 = [number, number, number]
type M3 = number[][]

const SQRT2PI = Math.sqrt(2 * Math.PI)

const LANCZOS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
]
/** Funzione Gamma di Eulero (approssimazione di Lanczos, errore relativo sotto 1e-13 per z > 0). */
const gammaFn = (z: number): number => {
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gammaFn(1 - z))
  const w = z - 1
  let s = LANCZOS[0]
  for (let i = 1; i < LANCZOS.length; i++) s += LANCZOS[i] / (w + i)
  const t = w + 7.5
  return SQRT2PI * t ** (w + 0.5) * Math.exp(-t) * s
}
/** erf con la formula 7.1.26 di Abramowitz-Stegun (errore assoluto sotto 1.5e-7). */
const erf = (x: number) => {
  const sgn = x < 0 ? -1 : 1
  const u = Math.abs(x)
  const t = 1 / (1 + 0.3275911 * u)
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-u * u)
  return sgn * y
}
/** Funzione di ripartizione della normale standard. */
const Phi = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2))

const det2 = ([a, c, b]: S2) => a * b - c * c
/** Autovalori di una 2×2 simmetrica, λ1 ≥ λ2 (formula risolutiva dell'equazione caratteristica). */
const eig2 = ([a, c, b]: S2): V2 => {
  const mid = (a + b) / 2
  const rad = Math.sqrt(((a - b) / 2) ** 2 + c * c)
  return [mid + rad, mid - rad]
}
/** Forma quadratica dᵗ Σ⁻¹ d per Σ 2×2. */
const quad2 = (S: S2, d: V2) => (S[2] * d[0] ** 2 - 2 * S[1] * d[0] * d[1] + S[0] * d[1] ** 2) / det2(S)
/** Angolo in gradi dell'asse principale (autovettore di λ1) rispetto all'asse x1, in (-90°, 90°]. */
const angolo = (S: S2) => {
  const [a, c, b] = S
  if (Math.abs(c) < 1e-12) return a >= b ? 0 : 90
  return (Math.atan((eig2(S)[0] - a) / c) * 180) / Math.PI
}
const gauss1 = (x: number, mu: number, s2: number) => Math.exp(-((x - mu) ** 2) / (2 * s2)) / Math.sqrt(2 * Math.PI * s2)
const gauss2 = (x: V2, m: V2, S: S2) => Math.exp(-quad2(S, [x[0] - m[0], x[1] - m[1]]) / 2) / (2 * Math.PI * Math.sqrt(det2(S)))
const media = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / xs.length
/** Media e covarianza con fattore 1/N (stima ML, o momenti di una distribuzione uniforme sui punti). */
const momenti = (pts: V2[]) => {
  const m: V2 = [media(pts.map((p) => p[0])), media(pts.map((p) => p[1]))]
  const S: S2 = [
    media(pts.map((p) => (p[0] - m[0]) ** 2)),
    media(pts.map((p) => (p[0] - m[0]) * (p[1] - m[1]))),
    media(pts.map((p) => (p[1] - m[1]) ** 2)),
  ]
  return { m, S }
}
const det3 = (A: M3) =>
  A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
  A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
  A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0])
/** Elemento (i, j) dell'inversa di una 3×3: cofattore (j, i) diviso il determinante. */
const inv3 = (A: M3, i: number, j: number) => {
  const r = [0, 1, 2].filter((x) => x !== j)
  const c = [0, 1, 2].filter((x) => x !== i)
  const minore = A[r[0]][c[0]] * A[r[1]][c[1]] - A[r[0]][c[1]] * A[r[1]][c[0]]
  return ((i + j) % 2 === 0 ? 1 : -1) * (minore / det3(A))
}

export const calcoli = {
  gammaFn,
  Phi,
  det2,
  eig2,
  quad2,
  angolo,
  gauss1,
  gauss2,
  momenti,
  det3,
  inv3,
  /** Picco della gaussiana generalizzata con m = 0 e varianza 1 (b scelto di conseguenza). */
  piccoGG: (beta: number) => {
    const b = Math.sqrt(gammaFn(3 / beta) / gammaFn(1 / beta))
    return (b * beta) / (2 * gammaFn(1 / beta))
  },
  /** Valore della Gamma nella moda (k − 1)θ, per k ≥ 1. */
  piccoGamma: (k: number, th: number) => {
    const x = (k - 1) * th
    return (x > 0 ? x ** (k - 1) : 1) * Math.exp(-x / th) / (th ** k * gammaFn(k))
  },
  /** Valore della log-normale nella moda e^(μ − σ²). */
  piccoLogNormale: (mu: number, s: number) => Math.exp((s * s) / 2 - mu) / (s * SQRT2PI),
}

// ---------------------------------------------------------------------------------------------------
// Formattazione
// ---------------------------------------------------------------------------------------------------

/** Numero per il testo: al più d decimali, senza zeri inutili e mai -0. */
const f = (x: number, d = 3) => {
  const r = Number(x.toFixed(d))
  return String(r === 0 ? 0 : r)
}
/** Tre cifre significative, per i numeri piccoli (densità lontane dal picco). */
const s3 = (x: number) => {
  const r = Number(x.toPrecision(3))
  return String(r === 0 ? 0 : r)
}
/** Numero fra parentesi se negativo, per scriverlo dentro un'espressione. */
const par = (x: number, d = 3) => (x < 0 ? `(${f(x, d)})` : f(x, d))
/** Tolleranza: relativa, con un minimo assoluto. */
const tol = (v: number, rel = 0.01, abs = 0.001) => Math.max(abs, Math.abs(v) * rel)
const risposta = (label: string, value: number, tolerance = tol(value)): ExerciseAnswer => ({ label, value, tolerance })
/** A capo di riga dentro una matrice LaTeX. */
const BR = md`\\`
const mat = (rows: number[][], d = 3) => md`\begin{bmatrix} ${rows.map((r) => r.map((x) => f(x, d)).join(' & ')).join(` ${BR} `)} \end{bmatrix}`
const col = (v: number[], d = 3) => mat(v.map((x) => [x]), d)
/** Vettore in riga trasposto, per il testo: (a, b)ᵗ. */
const vt = (v: number[], d = 3) => md`(${v.map((x) => f(x, d)).join(', ')})^t`
const norm = (v: V2): V2 => {
  const l = Math.hypot(v[0], v[1])
  return [v[0] / l, v[1] / l]
}
/** Autovettori unitari di una 2×2 simmetrica con σ12 ≠ 0: e1 con prima componente positiva, e2 = e1 ruotato di +90°. */
const autovettori = (S: S2): [V2, V2] => {
  const [a, c] = S
  let e1 = norm([c, eig2(S)[0] - a])
  if (e1[0] < 0) e1 = [-e1[0], -e1[1]]
  return [e1, [-e1[1], e1[0]]]
}

// ---------------------------------------------------------------------------------------------------
// Esercizi
// ---------------------------------------------------------------------------------------------------

export const exercises: Exercise[] = [
  {
    id: 'es01',
    title: 'Altezza del picco di una gaussiana 1-D',
    difficulty: 1,
    kind: 'numerico',
    concepts: ['c08', 'c09'],
    generate: (rng) => {
      const mu = rng.float(-3, 3, 1)
      const s2 = rng.pick([0.1, 0.15, 0.2, 0.3, 0.5, 0.8, 1, 1.5, 2, 3, 4, 5])
      const s = Math.sqrt(s2)
      const picco = 1 / (s * SQRT2PI)
      const aSigma = picco * Math.exp(-0.5)
      const soglia = 1 / (2 * Math.PI)
      return {
        prompt: md`La luminosità dei salmoni sul nastro dell'impianto, espressa come scarto dalla media di stagione, segue una gaussiana univariata (*univariate Gaussian*) con $\mu = ${f(mu, 1)}$ e $\sigma^2 = ${f(s2)}$:

$$f(x;\mu,\sigma)=\frac{1}{\sigma\sqrt{2\pi}}\,e^{-\frac{(x-\mu)^2}{2\sigma^2}}$$

(a) In quale $x$ la pdf raggiunge il massimo? (b) Quanto vale il picco? (c) Quanto vale la pdf una deviazione standard più a destra, in $x = \mu + \sigma$? (d) Sotto quale valore di $\sigma^2$ il picco di una gaussiana supera 1?`,
        answers: [
          risposta(md`(a) $x_{max}$`, mu, 0.01),
          risposta(md`(b) picco $f(\mu)$`, picco),
          risposta(md`(c) $f(\mu + \sigma)$`, aSigma),
          risposta(md`(d) soglia su $\sigma^2$`, soglia, 0.002),
        ],
        solution: md`**(a) Il massimo.** L'esponente $-\frac{(x-\mu)^2}{2\sigma^2}$ non è mai positivo e vale 0 solo in $x = \mu$, dove l'esponenziale vale 1. Il massimo sta quindi in $x_{max} = \mu = ${f(mu, 1)}$: la media è anche la moda, e la curva è simmetrica attorno a lei.

**(b) Il picco.** In $x = \mu$ resta la sola costante di normalizzazione. Con $\sigma = \sqrt{${f(s2)}} = ${f(s, 4)}$:

$$f(\mu;\mu,\sigma)=\frac{1}{\sigma\sqrt{2\pi}}=\frac{1}{${f(s, 4)}\cdot 2.5066}=${f(picco)}$$

**(c) A una deviazione standard.** Con $x - \mu = \sigma$ l'esponente vale $-\frac{1}{2}$:

$$f(\mu+\sigma)=\frac{1}{\sigma\sqrt{2\pi}}\,e^{-1/2}=${f(picco)}\cdot 0.6065=${f(aSigma)}$$

Il fattore $e^{-1/2} \approx 0.607$ non dipende dai parametri: a $\pm\sigma$ ogni gaussiana vale il 60.7% del suo picco.

**(d) Quando il picco supera 1.** $\frac{1}{\sigma\sqrt{2\pi}} > 1 \iff \sigma < \frac{1}{\sqrt{2\pi}} \iff \sigma^2 < \frac{1}{2\pi} \approx 0.159$. Qui $\sigma^2 = ${f(s2)}$, quindi il picco ${s2 < soglia ? 'supera' : 'non supera'} 1. Una densità può superare 1: il vincolo riguarda l'area, non l'altezza.

**Controllo con il grafico della slide.** La stessa formula dà i picchi delle quattro curve: $\sigma^2 = 0.2$, picco $0.892$; $\sigma^2 = 1.0$, picco $0.399$; $\sigma^2 = 5.0$, picco $0.178$; $\mu = -2$ e $\sigma^2 = 0.5$, picco $0.564$ in $x = -2$. $\mu$ trasla la campana senza deformarla; $\sigma^2$ la allarga e, poiché l'area resta 1, la abbassa.`,
      }
    },
  },
  {
    id: 'es02',
    title: 'Valore della pdf gaussiana bivariata in un punto',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c26', 'c27', 'c29', 'c32'],
    generate: (rng) => {
      const m: V2 = [rng.int(-3, 6), rng.int(-3, 6)]
      const a = rng.pick([1, 2, 3, 4])
      const b = rng.pick([1, 2, 3, 4])
      const c = rng.pick([-3, -2, -1, 0, 1, 2, 3].filter((v) => v * v < a * b))
      const d: V2 = [rng.int(-2, 2), rng.int(-2, 2)]
      if (d[0] === 0 && d[1] === 0) d[0] = 1
      const x: V2 = [m[0] + d[0], m[1] + d[1]]
      const S: S2 = [a, c, b]
      const D = det2(S)
      const t1 = b * d[0] ** 2
      const t2 = 2 * c * d[0] * d[1]
      const t3 = a * d[1] ** 2
      const q = (t1 - t2 + t3) / D
      const k = 1 / (2 * Math.PI * Math.sqrt(D))
      const p = k * Math.exp(-q / 2)
      const misto =
        c === 0
          ? md`Con $\sigma_{12} = 0$ il termine misto sparisce: le due feature sono indipendenti e la pdf è il prodotto di due gaussiane 1-D.`
          : d[0] * d[1] === 0
            ? md`Uno dei due scarti è nullo, quindi il termine misto $-2\sigma_{12}d_1d_2$ vale zero anche se $\sigma_{12} = ${c}$.`
            : c * d[0] * d[1] > 0
              ? md`Il termine misto $-2\sigma_{12}d_1d_2$ è negativo: lo scarto va nella direzione della correlazione ($\sigma_{12} = ${c}$), e il punto risulta più vicino alla media di quanto direbbero le sole varianze.`
              : md`Il termine misto $-2\sigma_{12}d_1d_2$ è positivo: lo scarto va contro la correlazione ($\sigma_{12} = ${c}$), e il punto risulta più lontano dalla media di quanto direbbero le sole varianze.`
      return {
        prompt: md`Nel modello della classe salmone le due feature, luminosità $x_1$ e larghezza $x_2$ (unità normalizzate), seguono una gaussiana bivariata $N(\mathbf{m}, \Sigma)$ con

$$\mathbf{m} = ${col(m)},\qquad \Sigma = ${mat([[a, c], [c, b]])}$$

Un nuovo pesce ha $\mathbf{x} = ${col(x)}$. Calcola (a) il determinante $|\Sigma|$, (b) la forma quadratica $(\mathbf{x}-\mathbf{m})^t\Sigma^{-1}(\mathbf{x}-\mathbf{m})$, (c) la costante di normalizzazione $\frac{1}{(2\pi)^{n/2}|\Sigma|^{1/2}}$, (d) il valore $p(\mathbf{x}|\mathbf{m},\Sigma)$.`,
        answers: [
          risposta(md`(a) $|\Sigma|$`, D, 0.01),
          risposta('(b) forma quadratica', q, tol(q, 0.01, 0.005)),
          risposta('(c) costante', k, tol(k, 0.01, 0.0005)),
          risposta(md`(d) $p(\mathbf{x})$`, p, tol(p, 0.02, 1e-5)),
        ],
        solution: md`**Formula** (slide 26), con $n = 2$:

$$p(\mathbf{x}|\mathbf{m},\Sigma)=\frac{1}{(2\pi)^{n/2}|\Sigma|^{1/2}}\exp\left[-\frac{1}{2}(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})\right]$$

**1. Lo scarto.** $\mathbf{d} = \mathbf{x} - \mathbf{m} = ${vt(d)}$.

**2. Il determinante.** Per una $2 \times 2$: $|\Sigma| = \sigma_1^2\sigma_2^2 - \sigma_{12}^2 = ${a}\cdot ${b} - ${par(c)}^2 = ${D}$.

**3. L'inversa.** Scambio gli elementi della diagonale, cambio segno a quelli fuori e divido per il determinante:

$$\Sigma^{-1} = \frac{1}{${D}}${mat([[b, -c], [-c, a]])}$$

**4. La forma quadratica.**

$$\mathbf{d}^t\Sigma^{-1}\mathbf{d} = \frac{\sigma_2^2 d_1^2 - 2\sigma_{12}d_1d_2 + \sigma_1^2 d_2^2}{|\Sigma|} = \frac{${t1} - ${par(t2)} + ${t3}}{${D}} = ${f(q, 4)}$$

${misto} La radice, $${f(Math.sqrt(q))}$, è la distanza di Mahalanobis (*Mahalanobis distance*) di $\mathbf{x}$ dalla media: le note chiamano così la forma quadratica, che ne è il quadrato.

**5. La costante.** $(2\pi)^{n/2}|\Sigma|^{1/2} = 2\pi\sqrt{${D}} = ${f(1 / k, 4)}$, quindi la costante vale $${f(k, 5)}$: è il valore della pdf nel picco, in $\mathbf{x} = \mathbf{m}$.

**6. Il valore.**

$$p(\mathbf{x}|\mathbf{m},\Sigma) = ${f(k, 5)}\cdot e^{-${f(q / 2, 4)}} = ${f(k, 5)}\cdot ${f(Math.exp(-q / 2), 4)} = ${s3(p)}$$

La densità è il ${f((100 * p) / k, 1)}% del picco: dipende da $\mathbf{x}$ solo attraverso la forma quadratica, quindi tutti i punti con la stessa distanza di Mahalanobis stanno sulla stessa ellisse di isolivello.`,
      }
    },
  },
  {
    id: 'es03',
    title: 'Stima ML e stima corretta da campioni 2-D',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c57', 'c58', 'c59', 'c63'],
    generate: (rng) => {
      let pts: V2[] = []
      for (let t = 0; t < 40 && pts.length === 0; t++) {
        const N = rng.int(4, 6)
        const cand: V2[] = []
        while (cand.length < N) {
          const p: V2 = [rng.int(0, 8), rng.int(0, 8)]
          if (!cand.some((q) => q[0] === p[0] && q[1] === p[1])) cand.push(p)
        }
        if (det2(momenti(cand).S) > 0.5) pts = cand
      }
      if (pts.length === 0) pts = [[1, 2], [3, 4], [5, 4], [3, 6]]
      const N = pts.length
      const { m, S } = momenti(pts)
      const dev = pts.map((p): V2 => [p[0] - m[0], p[1] - m[1]])
      const Ssum: S2 = [S[0] * N, S[1] * N, S[2] * N]
      const A: S2 = [media(pts.map((p) => p[0] ** 2)), media(pts.map((p) => p[0] * p[1])), media(pts.map((p) => p[1] ** 2))]
      const B: S2 = [m[0] ** 2, m[0] * m[1], m[1] ** 2]
      const U: S2 = [Ssum[0] / (N - 1), Ssum[1] / (N - 1), Ssum[2] / (N - 1)]
      const righe = pts
        .map((p, k) => md`| ${k + 1} | $(${p[0]},\ ${p[1]})$ | $(${f(dev[k][0], 4)},\ ${f(dev[k][1], 4)})$ | $${f(dev[k][0] ** 2, 4)}$ | $${f(dev[k][0] * dev[k][1], 4)}$ | $${f(dev[k][1] ** 2, 4)}$ |`)
        .join('\n')
      const elenco = pts.map((p) => md`$(${p[0]},\ ${p[1]})$`).join(', ')
      return {
        prompt: md`Un drone fotografa un campo di mais; per $N = ${N}$ pixel della classe «mais sano» misuri due feature, la riflettanza nel rosso $x_1$ e nell'infrarosso vicino $x_2$ (in unità intere del sensore): ${elenco}. Con il modello gaussiano calcola (a) la stima ML del vettore media $\hat{\mathbf{m}}$, (b) la stima ML della matrice di covarianza $\hat{\Sigma}$ con entrambe le forme della slide 31, (c) l'elemento $(1,1)$ dello stimatore non distorto con $\frac{1}{N-1}$.`,
        answers: [
          risposta(md`(a) $\hat{m}_1$`, m[0], 0.01),
          risposta(md`(a) $\hat{m}_2$`, m[1], 0.01),
          risposta(md`(b) $[\hat{\Sigma}]_{11}$`, S[0], tol(S[0], 0.01, 0.01)),
          risposta(md`(b) $[\hat{\Sigma}]_{12}$`, S[1], tol(S[1], 0.01, 0.01)),
          risposta(md`(b) $[\hat{\Sigma}]_{22}$`, S[2], tol(S[2], 0.01, 0.01)),
          risposta(md`(c) $[\hat{\Sigma}_{unbiased}]_{11}$`, U[0], tol(U[0], 0.01, 0.01)),
        ],
        solution: md`**(a) Media campionaria** (*sample mean*):

$$\hat{\mathbf{m}} = \frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k = \frac{1}{${N}}${col([m[0] * N, m[1] * N])} = ${col(m, 4)}$$

**(b) Prima forma.** Tolgo la media a ogni campione, $\mathbf{d}_k = \mathbf{x}_k - \hat{\mathbf{m}}$, e accumulo gli elementi dei prodotti esterni $\mathbf{d}_k\mathbf{d}_k^t$ (la matrice è simmetrica, bastano tre elementi):

| $k$ | $\mathbf{x}_k$ | $\mathbf{d}_k$ | $d_{k1}^2$ | $d_{k1}d_{k2}$ | $d_{k2}^2$ |
|---|---|---|---|---|---|
${righe}
| somma | | | $${f(Ssum[0], 4)}$ | $${f(Ssum[1], 4)}$ | $${f(Ssum[2], 4)}$ |

Le due componenti degli scarti $\mathbf{d}_k$ sommano a zero, come devono. Divido per $N = ${N}$:

$$\hat{\Sigma} = \frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t} = \frac{1}{${N}}${mat([[Ssum[0], Ssum[1]], [Ssum[1], Ssum[2]]], 4)} = ${mat([[S[0], S[1]], [S[1], S[2]]], 4)}$$

**Seconda forma.** Media dei prodotti esterni dei campioni, meno il prodotto esterno della media:

$$\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\mathbf{x}_k^{t} = ${mat([[A[0], A[1]], [A[1], A[2]]], 4)},\qquad \hat{\mathbf{m}}\hat{\mathbf{m}}^{t} = ${mat([[B[0], B[1]], [B[1], B[2]]], 4)}$$

La differenza è di nuovo $${mat([[S[0], S[1]], [S[1], S[2]]], 4)}$. La seconda forma si calcola in una sola passata sui dati: basta accumulare $\sum_k \mathbf{x}_k$ e $\sum_k \mathbf{x}_k\mathbf{x}_k^t$.

**(c) Stimatore corretto.** La stima ML ha valore atteso $\frac{N-1}{N}\Sigma$: sottostima la variabilità perché misura gli scarti da $\hat{\mathbf{m}}$, che sta più vicina ai dati della media vera. Divido la stessa somma per $N - 1 = ${N - 1}$:

$$\hat{\Sigma}_{unbiased} = \frac{1}{N-1}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t} = \frac{N}{N-1}\hat{\Sigma}_{ML} = ${mat([[U[0], U[1]], [U[1], U[2]]], 4)}$$

Con $N = ${N}$ il fattore $\frac{N}{N-1} = ${f(N / (N - 1), 4)}$ alza la stima del ${f((100 * 1) / (N - 1), 1)}%: con pochi campioni la correzione conta.`,
      }
    },
  },
  {
    id: 'es04',
    title: 'Autovalori, autovettori ed ellisse di una covarianza 2×2',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c44', 'c45', 'c46', 'c48', 'c49'],
    generate: (rng) => {
      const a = rng.int(1, 6)
      const b = rng.int(1, 6)
      const lim = Math.sqrt(a * b)
      const c = rng.pick([-3, -2.5, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5, 3].filter((v) => Math.abs(v) < lim - 1e-9))
      const S: S2 = [a, c, b]
      const [l1, l2] = eig2(S)
      const tr = a + b
      const D = det2(S)
      const phi = angolo(S)
      const r = rng.pick([1, 2, 3])
      const [e1, e2] = autovettori(S)
      const verifica2phi =
        a === b
          ? md`Qui $\sigma_1^2 = \sigma_2^2$: il denominatore di $\tan(2\varphi) = \frac{2\sigma_{12}}{\sigma_1^2 - \sigma_2^2}$ si annulla, $2\varphi = ${c > 0 ? '90' : '-90'}^\circ$ e $\varphi = ${c > 0 ? '45' : '-45'}^\circ$, con il segno di $\sigma_{12}$.`
          : md`Controllo: $\tan(2\varphi) = \frac{2\sigma_{12}}{\sigma_1^2 - \sigma_2^2} = \frac{${f(2 * c)}}{${a - b}} = ${f((2 * c) / (a - b), 4)}$ è soddisfatta da $\varphi = ${f(phi, 2)}^\circ$. Da sola però fissa $\varphi$ solo a meno di $90^\circ$ (non dice quale dei due assi è il principale): il ramo giusto lo dà l'autovettore.`
      return {
        prompt: md`Le feature «larghezza» e «lunghezza» delle spigole, normalizzate, hanno matrice di covarianza

$$\Sigma = ${mat([[a, c], [c, b]])}$$

(a) Scrivi l'equazione caratteristica (*characteristic equation*) e trova gli autovalori $\lambda_1 \ge \lambda_2$. (b) Trova gli autovettori unitari e l'angolo $\varphi$ (in gradi, fra $-90^\circ$ e $90^\circ$) dell'asse principale rispetto all'asse $x_1$. (c) Quanto sono lunghi i due semiassi dell'isolivello a distanza di Mahalanobis $r = ${r}$?`,
        answers: [
          risposta(md`(a) $\lambda_1$`, l1, tol(l1, 0.01, 0.01)),
          risposta(md`(a) $\lambda_2$`, l2, tol(l2, 0.01, 0.01)),
          risposta(md`(b) $\varphi$ (gradi)`, phi, 0.5),
          risposta('(c) semiasse maggiore', r * Math.sqrt(l1), tol(r * Math.sqrt(l1), 0.01, 0.01)),
          risposta('(c) semiasse minore', r * Math.sqrt(l2), tol(r * Math.sqrt(l2), 0.01, 0.01)),
        ],
        solution: md`**(a) Equazione caratteristica.** Gli autovalori annullano $\det(\Sigma - \lambda I)$:

$$\det(\Sigma-\lambda I)=(${a}-\lambda)(${b}-\lambda)-${par(c)}^2=\lambda^{2}-${tr}\lambda+${f(D, 4)}=0$$

In generale $\lambda^{2}-(\sigma_1^{2}+\sigma_2^{2})\lambda+(\sigma_1^{2}\sigma_2^{2}-\sigma_{12}^{2})=0$, con la formula risolutiva

$$\lambda_{1,2}=\frac{\sigma_1^{2}+\sigma_2^{2}}{2}\pm\sqrt{\left(\frac{\sigma_1^{2}-\sigma_2^{2}}{2}\right)^{2}+\sigma_{12}^{2}}=${f(tr / 2, 4)}\pm${f(Math.sqrt(((a - b) / 2) ** 2 + c * c), 4)}$$

quindi $\lambda_1 = ${f(l1, 4)}$ e $\lambda_2 = ${f(l2, 4)}$. Sotto radice c'è una somma di quadrati: gli autovalori sono reali, come garantisce la simmetria. Controlli: $\lambda_1 + \lambda_2 = ${tr}$ (la traccia) e $\lambda_1\lambda_2 = ${f(D, 4)}$ (il determinante).

**(b) Autovettori.** Per ogni autovalore risolvo $(\Sigma-\lambda_i I)\mathbf{e}_i=\mathbf{0}$. Basta la prima riga, perché la seconda è proporzionale: $(${a}-\lambda_i)\,e_{i1}+${par(c)}\,e_{i2}=0$, da cui $\mathbf{e}_i \propto (\sigma_{12},\ \lambda_i-\sigma_1^2)^t$. Normalizzo a lunghezza 1; il verso è arbitrario, scelgo $\mathbf{e}_1$ con prima componente positiva:

$$\mathbf{e}_1 = ${col(e1)},\qquad \mathbf{e}_2 = ${col(e2)}$$

$\mathbf{e}_1^t\mathbf{e}_2 = 0$: sono perpendicolari, come ogni coppia di autovettori di una matrice simmetrica con autovalori distinti. L'asse principale ha pendenza $\tan\varphi = \frac{\lambda_1 - \sigma_1^2}{\sigma_{12}} = \frac{${f(l1 - a, 4)}}{${f(c)}}$, cioè $\varphi = ${f(phi, 2)}^\circ$. ${verifica2phi}

**(c) L'ellisse.** Nelle coordinate $y_i = \mathbf{e}_i^t(\mathbf{x}-\mathbf{m})$ l'isolivello diventa $\frac{y_1^2}{\lambda_1}+\frac{y_2^2}{\lambda_2}=r^2$: semiassi $r\sqrt{\lambda_1} = ${r}\cdot ${f(Math.sqrt(l1), 4)} = ${f(r * Math.sqrt(l1))}$ lungo $\mathbf{e}_1$ e $r\sqrt{\lambda_2} = ${r}\cdot ${f(Math.sqrt(l2), 4)} = ${f(r * Math.sqrt(l2))}$ lungo $\mathbf{e}_2$. Le lunghezze vanno con la radice dell'autovalore, cioè con la deviazione standard lungo quella direzione; il rapporto fra gli assi, $\sqrt{\lambda_1/\lambda_2} = ${f(Math.sqrt(l1 / l2))}$, è lo stesso per tutti gli isolivelli.`,
      }
    },
  },
  {
    id: 'es05',
    title: 'Dimostra che la covarianza ML è distorta',
    difficulty: 3,
    kind: 'dimostrazione',
    concepts: ['c62', 'c63', 'c64'],
    generate: (rng) => {
      const a = rng.int(1, 6)
      const b = rng.int(1, 6)
      const c = rng.pick([-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2].filter((v) => v * v < a * b))
      const m: V2 = [rng.int(-3, 3), rng.int(-3, 3)]
      const N = rng.int(3, 12)
      const fb = (N - 1) / N
      const e11 = fb * a
      const e12 = fb * c
      const corr = N / (N - 1)
      const mm11 = a / N + m[0] ** 2
      return {
        prompt: md`**Parte 1.** Parti dalla seconda forma della stima ML, $\hat{\Sigma}=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\mathbf{x}_k^{t}-\hat{\mathbf{m}}\hat{\mathbf{m}}^{t}$, e dimostra che con $N$ campioni iid $E\{\hat{\Sigma}\}=\frac{N-1}{N}\Sigma$. Ricava lo stimatore non distorto e spiega a parole perché la stima ML sottostima la variabilità.

**Parte 2.** Un sensore multispettrale misura due bande sui pixel di un lago, con $\mathbf{m} = ${vt(m)}$ e $\Sigma = ${mat([[a, c], [c, b]])}$. Stimi $\hat{\Sigma}$ con la ML da $N = ${N}$ pixel. Quanto valgono (a) $E\{[\hat{\Sigma}]_{11}\}$, (b) $E\{[\hat{\Sigma}]_{12}\}$, (c) il fattore che rende la stima non distorta, (d) l'elemento $(1,1)$ di $E\{\hat{\mathbf{m}}\hat{\mathbf{m}}^t\}$?`,
        answers: [
          risposta(md`(a) $E\{[\hat{\Sigma}]_{11}\}$`, e11),
          risposta(md`(b) $E\{[\hat{\Sigma}]_{12}\}$`, e12),
          risposta('(c) fattore di correzione', corr, 0.005),
          risposta(md`(d) $[E\{\hat{\mathbf{m}}\hat{\mathbf{m}}^t\}]_{11}$`, mm11),
        ],
        solution: md`**1. Linearità.**

$$E\{\hat{\Sigma}\}=\frac{1}{N}\sum_{k=1}^{N}E\{\mathbf{x}_k\mathbf{x}_k^{t}\}-E\{\hat{\mathbf{m}}\hat{\mathbf{m}}^{t}\}$$

**2. Momento del secondo ordine di un campione.** Leggo al contrario $\Sigma=E\{\mathbf{x}\mathbf{x}^{t}\}-\mathbf{m}\mathbf{m}^{t}$: $E\{\mathbf{x}_k\mathbf{x}_k^{t}\}=\Sigma+\mathbf{m}\mathbf{m}^{t}$ per ogni $k$.

**3. Covarianza della media campionaria.** $\hat{\mathbf{m}}-\mathbf{m}$ è la media degli scarti $\mathbf{x}_k-\mathbf{m}$:

$$Cov\{\hat{\mathbf{m}}\}=\frac{1}{N^{2}}\sum_{k=1}^{N}\sum_{l=1}^{N}E\{(\mathbf{x}_k-\mathbf{m})(\mathbf{x}_l-\mathbf{m})^{t}\}$$

**4. Qui serve l'indipendenza.** Per $k \ne l$, $E\{(\mathbf{x}_k-\mathbf{m})(\mathbf{x}_l-\mathbf{m})^{t}\}=E\{\mathbf{x}_k-\mathbf{m}\}E\{\mathbf{x}_l-\mathbf{m}\}^t=0$. Restano gli $N$ termini con $k = l$, ognuno pari a $\Sigma$:

$$Cov\{\hat{\mathbf{m}}\}=\frac{1}{N^{2}}\,N\,\Sigma=\frac{1}{N}\Sigma$$

**5. Momento del secondo ordine della media.** Stessa identità del passo 2, applicata a $\hat{\mathbf{m}}$, che ha media $\mathbf{m}$:

$$E\{\hat{\mathbf{m}}\hat{\mathbf{m}}^{t}\}=Cov\{\hat{\mathbf{m}}\}+E\{\hat{\mathbf{m}}\}E\{\hat{\mathbf{m}}\}^{t}=\frac{1}{N}\Sigma+\mathbf{m}\mathbf{m}^{t}$$

**6. Sostituisco.**

$$E\{\hat{\Sigma}\}=\Sigma+\mathbf{m}\mathbf{m}^{t}-\frac{1}{N}\Sigma-\mathbf{m}\mathbf{m}^{t}=\frac{N-1}{N}\Sigma$$

**7. Stimatore corretto.** Moltiplico per $\frac{N}{N-1}$: $\hat{\Sigma}_{unbiased}=\frac{1}{N-1}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^{t}$ ha valore atteso esattamente $\Sigma$. Poiché $\frac{N-1}{N} \to 1$, la stima ML è asintoticamente non distorta (*asymptotically unbiased*).

**A parole.** Gli scarti si misurano da $\hat{\mathbf{m}}$, che è calcolata sugli stessi dati: è il punto che rende minima la somma dei quadrati degli scarti, quindi i campioni le stanno più vicini che alla media vera. La media stimata assorbe una parte della variabilità, pari a $\frac{1}{N}\Sigma$. Con $N = 1$ la stima vale $\mathbf{0}$: un solo campione non dice nulla sulla dispersione.

**Parte 2.** Fattore di bias $\frac{N-1}{N} = \frac{${N - 1}}{${N}} = ${f(fb, 4)}$.

- (a) $E\{[\hat{\Sigma}]_{11}\} = ${f(fb, 4)}\cdot ${a} = ${f(e11)}$ contro il vero $${a}$.
- (b) $E\{[\hat{\Sigma}]_{12}\} = ${f(fb, 4)}\cdot ${par(c)} = ${f(e12)}$: anche le covarianze si restringono dello stesso fattore.
- (c) $\frac{N}{N-1} = \frac{${N}}{${N - 1}} = ${f(corr, 4)}$.
- (d) $[E\{\hat{\mathbf{m}}\hat{\mathbf{m}}^t\}]_{11} = \frac{\sigma_1^2}{N} + m_1^2 = \frac{${a}}{${N}} + ${par(m[0], 0)}^2 = ${f(mm11)}$: il termine $\frac{\sigma_1^2}{N}$ è la varianza della media campionaria, che si sottrae nel passo 6.`,
      }
    },
  },
  {
    id: 'es06',
    title: "Dimostra l'equivalenza delle due forme della covarianza e le sue proprietà",
    difficulty: 3,
    kind: 'dimostrazione',
    concepts: ['c36', 'c38', 'c39', 'c50'],
    generate: (rng) => {
      const K = rng.pick([3, 4])
      const pts: V2[] = []
      while (pts.length < K) {
        const p: V2 = [rng.int(-2, 4), rng.int(-2, 4)]
        if (!pts.some((q) => q[0] === p[0] && q[1] === p[1])) pts.push(p)
      }
      const dir = rng.pick([[1, 1], [1, -1], [2, 1], [1, 2], [1, 0], [0, 1], [2, -1]])
      const av: V2 = [dir[0], dir[1]]
      const { m, S } = momenti(pts)
      const Exx: S2 = [media(pts.map((p) => p[0] ** 2)), media(pts.map((p) => p[0] * p[1])), media(pts.map((p) => p[1] ** 2))]
      const y = pts.map((p) => av[0] * p[0] + av[1] * p[1])
      const Ey = media(y)
      const Ey2 = media(y.map((v) => v * v))
      const vproj = av[0] ** 2 * S[0] + 2 * av[0] * av[1] * S[1] + av[1] ** 2 * S[2]
      const [l1, l2raw] = eig2(S)
      const l2 = Math.abs(l2raw) < 1e-9 ? 0 : l2raw
      const elenco = pts.map((p) => md`$(${p[0]},\ ${p[1]})$`).join(', ')
      const nota =
        l2 === 0
          ? md`Qui $\lambda_2 = 0$: i punti stanno su una retta, lungo $\mathbf{e}_2$ non c'è variabilità. $\Sigma$ è semidefinita ma non definita positiva, $|\Sigma| = 0$ e la gaussiana $N(\mathbf{m}, \Sigma)$ non esiste.`
          : md`Qui $\lambda_2 = ${f(l2, 4)} > 0$: i punti non stanno su una retta, $\Sigma$ è definita positiva e invertibile.`
      return {
        prompt: md`**Parte 1.** Dimostra che $E\{(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^t\}=E\{\mathbf{x}\mathbf{x}^t\}-\mathbf{m}\mathbf{m}^t$, che $\Sigma$ è simmetrica e che $\mathbf{a}^t\Sigma\mathbf{a}\ge 0$ per ogni $\mathbf{a}$, interpretando $\mathbf{a}^t\Sigma\mathbf{a}$ come varianza della proiezione $\mathbf{a}^t\mathbf{x}$. Perché la slide 29 può dire che gli autovalori sono positivi?

**Parte 2.** Un vettore aleatorio $\mathbf{x}$ assume con la stessa probabilità $\frac{1}{${K}}$ i valori ${elenco}. Calcola (a) gli elementi di $\Sigma$ con la seconda forma, (b) la varianza della proiezione su $\mathbf{a} = ${vt(av, 0)}$, (c) l'autovalore più piccolo $\lambda_2$.`,
        answers: [
          risposta(md`(a) $\sigma_1^2$`, S[0], tol(S[0], 0.01, 0.01)),
          risposta(md`(a) $\sigma_{12}$`, S[1], tol(S[1], 0.01, 0.01)),
          risposta(md`(a) $\sigma_2^2$`, S[2], tol(S[2], 0.01, 0.01)),
          risposta(md`(b) $\mathbf{a}^t\Sigma\mathbf{a}$`, vproj, tol(vproj, 0.01, 0.01)),
          risposta(md`(c) $\lambda_2$`, l2, tol(l2, 0.01, 0.01)),
        ],
        solution: md`**1. Le due forme.** Sviluppo il prodotto esterno; la trasposta di una differenza è la differenza delle trasposte:

$$E\{(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^{t}\}=E\{\mathbf{x}\mathbf{x}^{t}-\mathbf{x}\mathbf{m}^{t}-\mathbf{m}\mathbf{x}^{t}+\mathbf{m}\mathbf{m}^{t}\}$$

$\mathbf{m}$ è costante ed esce dal valore atteso, e $E\{\mathbf{x}\} = \mathbf{m}$:

$$=E\{\mathbf{x}\mathbf{x}^{t}\}-\mathbf{m}\mathbf{m}^{t}-\mathbf{m}\mathbf{m}^{t}+\mathbf{m}\mathbf{m}^{t}=E\{\mathbf{x}\mathbf{x}^{t}\}-\mathbf{m}\mathbf{m}^{t}$$

È la versione matriciale di $var\{x\}=E\{x^2\}-(E\{x\})^2$.

**2. Simmetria.** La trasposta di $(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^t$ è la matrice stessa e la trasposizione commuta con il valore atteso: $\Sigma^t=\Sigma$. Elemento per elemento, $E\{(x_i-m_i)(x_j-m_j)\}=E\{(x_j-m_j)(x_i-m_i)\}$.

**3. Semidefinitezza.** Per ogni $\mathbf{a}$:

$$\mathbf{a}^{t}\Sigma\,\mathbf{a}=E\{\mathbf{a}^{t}(\mathbf{x}-\mathbf{m})(\mathbf{x}-\mathbf{m})^{t}\mathbf{a}\}=E\left\{\left(\mathbf{a}^{t}(\mathbf{x}-\mathbf{m})\right)^{2}\right\}\ge 0$$

$\mathbf{a}^t(\mathbf{x}-\mathbf{m})$ è lo scarto dalla media della proiezione $y = \mathbf{a}^t\mathbf{x}$, quindi $\mathbf{a}^t\Sigma\mathbf{a} = var\{\mathbf{a}^t\mathbf{x}\}$: una varianza non è mai negativa.

**4. Gli autovalori.** Con $\mathbf{a} = \mathbf{e}_i$ unitario, $\lambda_i=\mathbf{e}_i^{t}\Sigma\,\mathbf{e}_i=var\{\mathbf{e}_i^{t}\mathbf{x}\}\ge 0$: ogni autovalore è la varianza dei dati lungo il suo autovettore. La slide dice «positivi» perché la gaussiana esiste solo con $\Sigma$ invertibile: un autovalore nullo darebbe $|\Sigma| = 0$. Le note, più precise, dicono «non negativi».

**Parte 2.** (a) $\mathbf{m} = E\{\mathbf{x}\} = ${vt(m, 4)}$. Media dei prodotti esterni:

$$E\{\mathbf{x}\mathbf{x}^t\} = ${mat([[Exx[0], Exx[1]], [Exx[1], Exx[2]]], 4)},\qquad \mathbf{m}\mathbf{m}^t = ${mat([[m[0] ** 2, m[0] * m[1]], [m[0] * m[1], m[1] ** 2]], 4)}$$

$$\Sigma = E\{\mathbf{x}\mathbf{x}^t\} - \mathbf{m}\mathbf{m}^t = ${mat([[S[0], S[1]], [S[1], S[2]]], 4)}$$

Con la prima forma, per esempio, $\sigma_1^2 = E\{(x_1 - m_1)^2\} = ${f(S[0], 4)}$: stesso risultato.

(b) Le proiezioni $y = \mathbf{a}^t\mathbf{x}$ valgono $${y.join(',\\ ')}$, con $E\{y\} = ${f(Ey, 4)}$ ed $E\{y^2\} = ${f(Ey2, 4)}$, quindi $var\{y\} = ${f(Ey2, 4)} - ${par(Ey, 4)}^2 = ${f(Ey2 - Ey * Ey, 4)}$. Con la forma quadratica: $\mathbf{a}^t\Sigma\mathbf{a} = a_1^2\sigma_1^2 + 2a_1a_2\sigma_{12} + a_2^2\sigma_2^2 = ${f(vproj, 4)}$. Stesso numero: la forma quadratica è la varianza della proiezione. ${av[0] ** 2 + av[1] ** 2 === 1 ? '' : md`Il vettore non è unitario: $\Vert\mathbf{a}\Vert^2 = ${av[0] ** 2 + av[1] ** 2}$, e la varianza cresce con il quadrato della lunghezza. Per confrontare direzioni si usa $\Vert\mathbf{a}\Vert = 1$.`}

(c) $\lambda_{1,2} = \frac{\sigma_1^2 + \sigma_2^2}{2} \pm \sqrt{\left(\frac{\sigma_1^2 - \sigma_2^2}{2}\right)^2 + \sigma_{12}^2}$: $\lambda_1 = ${f(l1, 4)}$, $\lambda_2 = ${f(l2, 4)}$. ${nota}`,
      }
    },
  },
  {
    id: 'es07',
    title: 'Fattorizzazione con feature indipendenti',
    difficulty: 2,
    kind: 'dimostrazione',
    concepts: ['c40', 'c41'],
    generate: (rng) => {
      const m: V2 = [rng.int(-2, 2), rng.int(-2, 2)]
      const s1 = rng.pick([1, 2, 4, 9])
      const s2 = rng.pick([1, 2, 4, 9])
      const d: V2 = [rng.int(-2, 2), rng.int(-2, 2)]
      if (d[0] === 0 && d[1] === 0) d[0] = 2
      const x: V2 = [m[0] + d[0], m[1] + d[1]]
      const q1 = d[0] ** 2 / s1
      const q2 = d[1] ** 2 / s2
      const q = q1 + q2
      const p1 = gauss1(x[0], m[0], s1)
      const p2 = gauss1(x[1], m[1], s2)
      const pMulti = Math.exp(-q / 2) / (2 * Math.PI * Math.sqrt(s1 * s2))
      return {
        prompt: md`**Parte 1.** Dimostra che con $\Sigma = diag(\sigma_1^2, \dots, \sigma_n^2)$ la pdf gaussiana multivariata è il prodotto di $n$ gaussiane univariate: $p(\mathbf{x}) = p(x_1)\,p(x_2)\dots p(x_n)$.

**Parte 2.** Due sensori IoT in due magazzini diversi misurano lo scarto di temperatura; le letture sono indipendenti, con $\mathbf{m} = ${vt(m, 0)}$, $\sigma_1^2 = ${s1}$ e $\sigma_2^2 = ${s2}$. Per $\mathbf{x} = ${vt(x, 0)}$ calcola (a) la forma quadratica, (b) $p(x_1)$, (c) $p(x_2)$, (d) $p(\mathbf{x})$ con la formula multivariata.`,
        answers: [
          risposta('(a) forma quadratica', q, tol(q, 0.01, 0.005)),
          risposta(md`(b) $p(x_1)$`, p1, tol(p1, 0.01, 1e-4)),
          risposta(md`(c) $p(x_2)$`, p2, tol(p2, 0.01, 1e-4)),
          risposta(md`(d) $p(\mathbf{x})$`, pMulti, tol(pMulti, 0.02, 1e-5)),
        ],
        solution: md`**1. Determinante e inversa.** Per una matrice diagonale il determinante è il prodotto della diagonale e l'inversa è la diagonale dei reciproci:

$$|\Sigma|=\prod_{i=1}^{n}\sigma_i^{2},\qquad \Sigma^{-1}=diag\left(\frac{1}{\sigma_1^{2}},\dots,\frac{1}{\sigma_n^{2}}\right)$$

**2. Forma quadratica.** Spariscono i termini misti:

$$(\mathbf{x}-\mathbf{m})^{t}\Sigma^{-1}(\mathbf{x}-\mathbf{m})=\sum_{i=1}^{n}\frac{(x_i-m_i)^{2}}{\sigma_i^{2}}$$

**3. Costante.** $(2\pi)^{n/2}|\Sigma|^{1/2}=\prod_{i=1}^{n}\sqrt{2\pi}\,\sigma_i$.

**4. Sostituisco** e uso che l'esponenziale di una somma è il prodotto degli esponenziali:

$$p(\mathbf{x})=\frac{1}{\prod_{i}\sqrt{2\pi}\,\sigma_i}\exp\left[-\frac{1}{2}\sum_{i=1}^{n}\frac{(x_i-m_i)^{2}}{\sigma_i^{2}}\right]=\prod_{i=1}^{n}\frac{1}{\sigma_i\sqrt{2\pi}}\exp\left[-\frac{(x_i-m_i)^{2}}{2\sigma_i^{2}}\right]$$

Ogni fattore è una gaussiana univariata nella sola $x_i$: la congiunta si fattorizza nelle marginali, che è la definizione di indipendenza. Nel modello gaussiano vale anche il contrario della freccia della slide 27: covarianze nulle bastano per l'indipendenza (per altre distribuzioni no).

**Parte 2.** Scarti $\mathbf{x} - \mathbf{m} = ${vt(d, 0)}$.

(a) $\frac{${par(d[0], 0)}^2}{${s1}} + \frac{${par(d[1], 0)}^2}{${s2}} = ${f(q1, 4)} + ${f(q2, 4)} = ${f(q, 4)}$.

(b) $p(x_1) = \frac{1}{\sqrt{2\pi\cdot ${s1}}}e^{-${f(q1 / 2, 4)}} = ${f(p1, 5)}$.

(c) $p(x_2) = \frac{1}{\sqrt{2\pi\cdot ${s2}}}e^{-${f(q2 / 2, 4)}} = ${f(p2, 5)}$.

(d) Con la formula multivariata: $\frac{1}{2\pi\sqrt{${s1}\cdot ${s2}}}e^{-${f(q / 2, 4)}} = ${s3(pMulti)}$, e il prodotto dà $${f(p1, 5)}\cdot ${f(p2, 5)} = ${s3(p1 * p2)}$. Coincidono, come prevede la dimostrazione. È l'ipotesi alla base del classificatore naive Bayes gaussiano: stimare $n$ varianze invece di una matrice intera.`,
      }
    },
  },
  {
    id: 'es08',
    title: 'Mahalanobis contro euclidea',
    difficulty: 1,
    kind: 'numerico',
    concepts: ['c29', 'c30', 'c43'],
    generate: (rng) => {
      const s1 = rng.pick([1, 2, 4, 9])
      const s2 = rng.pick([1, 2, 4, 9].filter((v) => v !== s1))
      const m: V2 = [rng.int(-2, 2), rng.int(-2, 2)]
      const R = rng.pick([1, 2, 3])
      const sA = rng.pick([1, -1])
      const sB = rng.pick([1, -1])
      const A: V2 = [m[0] + sA * R, m[1]]
      const B: V2 = [m[0], m[1] + sB * R]
      const dA2 = (R * R) / s1
      const dB2 = (R * R) / s2
      const ratio = Math.exp((dB2 - dA2) / 2)
      const piuProbabile = dA2 < dB2 ? 'A' : 'B'
      return {
        prompt: md`Nel piano luminosità-larghezza la classe spigola ha $\mathbf{m} = ${vt(m, 0)}$ e $\Sigma = ${mat([[s1, 0], [0, s2]], 0)}$. Due pesci stanno in $A = ${vt(A, 0)}$ e $B = ${vt(B, 0)}$. Calcola (a) la distanza euclidea di $A$ e di $B$ dalla media, (b) la distanza di Mahalanobis di $A$, (c) quella di $B$, (d) il rapporto delle densità $p(A)/p(B)$.`,
        answers: [
          risposta('(a) distanza euclidea', R, 0.01),
          risposta(md`(b) $d_M(A)$`, Math.sqrt(dA2), 0.01),
          risposta(md`(c) $d_M(B)$`, Math.sqrt(dB2), 0.01),
          risposta(md`(d) $p(A)/p(B)$`, ratio, tol(ratio, 0.01, 0.001)),
        ],
        solution: md`**(a) Euclidea.** $A$ dista $${R}$ lungo $x_1$, $B$ dista $${R}$ lungo $x_2$: $\Vert A - \mathbf{m}\Vert = \Vert B - \mathbf{m}\Vert = ${R}$. Per la distanza euclidea (quella del classificatore a distanza minima dalla media) i due pesci sono equivalenti.

**(b), (c) Mahalanobis.** Con $\Sigma$ diagonale $d_M^2(\mathbf{x},\mathbf{m}) = \frac{(x_1-m_1)^2}{\sigma_1^2} + \frac{(x_2-m_2)^2}{\sigma_2^2}$: ogni scarto si misura in deviazioni standard della sua feature.

$$d_M^2(A) = \frac{${R * R}}{${s1}} = ${f(dA2, 4)},\qquad d_M^2(B) = \frac{${R * R}}{${s2}} = ${f(dB2, 4)}$$

quindi $d_M(A) = ${f(Math.sqrt(dA2))}$ e $d_M(B) = ${f(Math.sqrt(dB2))}$. Lungo $x_${s1 > s2 ? 1 : 2}$ la nuvola è più larga ($\sigma^2 = ${Math.max(s1, s2)}$), quindi uno scarto di $${R}$ in quella direzione è meno sorprendente.

**(d) Rapporto delle densità.** La costante di normalizzazione è la stessa e si semplifica:

$$\frac{p(A)}{p(B)} = \frac{e^{-d_M^2(A)/2}}{e^{-d_M^2(B)/2}} = e^{(${f(dB2, 4)} - ${f(dA2, 4)})/2} = ${f(ratio)}$$

Il pesce ${piuProbabile} sta su un isolivello più alto: le ellissi di isolivello sono allungate lungo l'asse di varianza maggiore, e la stessa distanza euclidea taglia ellissi diverse. $\mathbf{m}$ dice dove sta il centro della nuvola, $\Sigma$ quanto è larga in ogni direzione.`,
      }
    },
  },
  {
    id: 'es09',
    title: 'Quale modello per quali dati?',
    difficulty: 1,
    kind: 'concettuale',
    concepts: ['c02', 'c03', 'c04', 'c05', 'c06', 'c07', 'c21'],
    generate: (rng) => {
      const casi = [
        {
          txt: "il rumore termico all'uscita di un sensore di temperatura IoT",
          fam: 1,
          why: md`nasce dalla somma di moltissimi contributi microscopici indipendenti (natura del fenomeno): per il limite centrale è gaussiano, simmetrico attorno a zero e definito su tutto l'asse.`,
        },
        {
          txt: "l'ampiezza dell'eco di un radar che illumina una superficie con molti diffusori",
          fam: 4,
          why: md`l'eco somma molti contributi con fasi casuali: le componenti in fase e in quadratura sono gaussiane e il loro modulo è Rayleigh, positivo e asimmetrico. Se il pre-processing ne prendesse il quadrato (l'intensità), la distribuzione diventerebbe esponenziale: anche il terzo aspetto decide il modello.`,
        },
        {
          txt: 'il tempo di attesa fino al k-esimo guasto di un server, con guasti indipendenti a tasso costante',
          fam: 3,
          why: md`è la somma di $k$ attese esponenziali indipendenti: una Gamma con forma $k$, positiva e con la coda a destra. È l'uso nella teoria delle code (*queuing theory*) citato dalle note.`,
        },
        {
          txt: 'i prezzi delle case di una città',
          fam: 6,
          why: md`il prezzo nasce dal prodotto di molti fattori (superficie, zona, stato, mercato): il logaritmo trasforma il prodotto in una somma, circa gaussiana, quindi il prezzo è log-normale, positivo e con asimmetria positiva (*positively skewed*), come i dati finanziari delle note.`,
        },
        {
          txt: "la somma dei quadrati di k residui gaussiani standard indipendenti, in un test di bontà dell'adattamento",
          fam: 5,
          why: md`è la definizione del chi-quadro con $k$ gradi di libertà, usato nei test d'ipotesi e di bontà dell'adattamento (*goodness-of-fit*).`,
        },
        {
          txt: "i coefficienti wavelet di un'immagine: moltissimi valori vicini a zero e qualche valore grande",
          fam: 2,
          why: md`sono simmetrici attorno a zero ma più piccati della gaussiana e con code più pesanti: serve la gaussiana generalizzata con $\beta < 2$, vicino a 1 (quasi laplaciana).`,
        },
      ]
      const nomi = ['', 'gaussiana', 'gaussiana generalizzata', 'Gamma', 'Rayleigh', 'chi-quadro', 'log-normale']
      const scelti = rng.shuffle(casi).slice(0, 4)
      const lettere = ['a', 'b', 'c', 'd']
      const mu = rng.pick([1, 1.5, 2, 2.5, 3, 4])
      const sd = rng.pick([0.8, 1, 1.2, 1.5, 2, 2.5])
      const z = -mu / sd
      const pNeg = Phi(z)
      const domande = scelti.map((c, i) => md`(${lettere[i]}) ${c.txt}`).join('; ')
      const risposte = scelti.map((c, i) => md`- (${lettere[i]}) **${nomi[c.fam]}** (codice ${c.fam}): ${c.why}`).join('\n')
      return {
        prompt: md`Per ciascun caso scegli la famiglia più adatta fra le sei della slide 21 e rispondi con il codice: 1 gaussiana, 2 gaussiana generalizzata, 3 Gamma, 4 Rayleigh, 5 chi-quadro, 6 log-normale. Motiva la scelta con i tre aspetti della slide 20 (natura del fenomeno, rumore di trasmissione e acquisizione, pre-processing). Casi: ${domande}.

(e) La durata delle telefonate a un call center è solo positiva, con media $${f(mu)}$ minuti e deviazione standard $${f(sd)}$ minuti. Se la modelli con una gaussiana di questi parametri, quanta probabilità assegna il modello a durate negative, cioè impossibili?`,
        answers: [
          ...scelti.map((c, i) => risposta(`(${lettere[i]}) codice`, c.fam, 0.1)),
          risposta('(e) probabilità sotto zero', pNeg, tol(pNeg, 0.02, 0.002)),
        ],
        solution: md`${risposte}

**(e) Supporto sbagliato.** La gaussiana vive su tutto l'asse reale. La probabilità sotto zero è

$$P\{x < 0\} = \Phi\left(\frac{0 - \mu}{\sigma}\right) = \Phi(${f(z, 3)}) = ${f(pNeg, 4)}$$

cioè il ${f(100 * pNeg, 1)}% della massa su durate impossibili. Una Gamma o una log-normale vivono solo su $x > 0$ e hanno la coda a destra tipica delle durate.

**Perché la scelta non è banale.** Le note avvertono che la selezione del modello non è un compito banale (*Model selection is not a trivial task*). Famiglie diverse si adattano quasi ugualmente bene agli stessi dati: Gamma e log-normale, per esempio, su dati positivi asimmetrici. E un modello sbagliato produce parametri privi di senso, per quanto buono sia lo stimatore: la stima ML trova i migliori parametri della famiglia scelta, non la famiglia giusta.`,
      }
    },
  },
  {
    id: 'es10',
    title: 'Casi particolari della gaussiana generalizzata',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c10', 'c11', 'c12'],
    generate: (rng) => {
      const s = rng.pick([0.5, 0.8, 1, 1.5, 2, 2.5, 3])
      const b2 = 1 / (s * Math.SQRT2)
      const p2 = b2 / Math.sqrt(Math.PI)
      const b1 = Math.SQRT2 / s
      const p1 = b1 / 2
      const beta = rng.pick([0.8, 1.5, 4, 10])
      const g1 = gammaFn(1 / beta)
      const g3 = gammaFn(3 / beta)
      const bb = Math.sqrt(g3 / g1)
      const pb = (bb * beta) / (2 * g1)
      return {
        prompt: md`La gaussiana generalizzata (*generalized Gaussian*) della slide 22 è $f(x;m,b,\beta)=\frac{b\beta}{2\Gamma(1/\beta)}\,e^{-\left[b|x-m|\right]^{\beta}}$, con varianza $var\{x\}=\frac{\Gamma(3/\beta)}{b^{2}\,\Gamma(1/\beta)}$.

Vuoi modellare il residuo di un sensore con deviazione standard $\sigma = ${f(s)}$. (a) Con $\beta = 2$ quale $b$ riproduce la gaussiana di deviazione standard $\sigma$? (b) Quanto vale il picco in quel caso? (c) Con $\beta = 1$ e la stessa varianza $\sigma^2$, quanto vale $b$? (d) E il picco? (e) Con $\beta = ${f(beta)}$ e varianza 1, come nel grafico della slide, quanto vale il picco?`,
        answers: [
          risposta(md`(a) $b$ con $\beta = 2$`, b2),
          risposta(md`(b) picco con $\beta = 2$`, p2),
          risposta(md`(c) $b$ con $\beta = 1$`, b1),
          risposta(md`(d) picco con $\beta = 1$`, p1),
          risposta(md`(e) picco con $\beta = ${f(beta)}$`, pb),
        ],
        solution: md`**(a) β = 2.** $\Gamma(1/2) = \sqrt{\pi}$ e il modulo al quadrato è un quadrato ordinario:

$$f=\frac{2b}{2\sqrt{\pi}}\,e^{-b^{2}(x-m)^{2}}=\frac{b}{\sqrt{\pi}}\,e^{-b^{2}(x-m)^{2}}$$

Confronto l'esponente con quello della gaussiana, $-\frac{(x-m)^2}{2\sigma^2}$: $b^2 = \frac{1}{2\sigma^2}$, cioè $b = \frac{1}{\sigma\sqrt{2}} = \frac{1}{${f(s)}\cdot 1.4142} = ${f(b2, 4)}$. Controllo con la formula della varianza: $\frac{\Gamma(3/2)}{b^2\Gamma(1/2)} = \frac{\sqrt{\pi}/2}{b^2\sqrt{\pi}} = \frac{1}{2b^2} = \sigma^2$.

**(b)** Il picco è in $x = m$: $\frac{b}{\sqrt{\pi}} = \frac{1}{\sigma\sqrt{2\pi}} = ${f(p2, 4)}$, la stessa costante della gaussiana della slide. La gaussiana è un membro della famiglia: da qui il nome «generalizzata».

**(c) β = 1.** $\Gamma(1) = 1$ e resta la laplaciana (doppia esponenziale) $f = \frac{b}{2}e^{-b|x-m|}$, con la cuspide in $x = m$. Varianza: $\frac{\Gamma(3)}{b^2\Gamma(1)} = \frac{2}{b^2} = \sigma^2$, quindi $b = \frac{\sqrt{2}}{\sigma} = ${f(b1, 4)}$.

**(d)** Picco $\frac{b}{2} = \frac{1}{\sigma\sqrt{2}} = ${f(p1, 4)}$, più alto della gaussiana di pari varianza ($${f(p2, 4)}$): a parità di varianza la laplaciana concentra più massa vicino al centro e nelle code.

**(e) β = ${f(beta)}, varianza 1.** $b = \sqrt{\frac{\Gamma(3/\beta)}{\Gamma(1/\beta)}} = \sqrt{\frac{${f(g3, 4)}}{${f(g1, 4)}}} = ${f(bb, 4)}$ e il picco vale $\frac{b\beta}{2\Gamma(1/\beta)} = \frac{${f(bb, 4)}\cdot ${f(beta)}}{2\cdot ${f(g1, 4)}} = ${f(pb, 4)}$. Le quattro curve della slide (tutte con $m = 0$ e varianza 1) hanno picco $0.975$ ($\beta = 0.8$), $0.707$ ($\beta = 1$), $0.399$ ($\beta = 2$) e $0.295$ ($\beta = 10$): al crescere di $\beta$ la punta si appiattisce e le code si accorciano, fino al profilo quasi rettangolare su $[m - 1/b,\ m + 1/b]$.`,
      }
    },
  },
  {
    id: 'es11',
    title: 'Moda e picco di Rayleigh, Gamma e chi-quadro',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c13', 'c14', 'c15', 'c16', 'c17', 'c18'],
    generate: (rng) => {
      const sR = rng.pick([0.5, 1, 1.5, 2, 2.5, 3, 4])
      const pR = 1 / (sR * Math.sqrt(Math.E))
      const k = rng.int(2, 9)
      const th = rng.pick([0.5, 1, 1.5, 2, 3])
      const modaG = (k - 1) * th
      const varG = k * th * th
      const pG = calcoli.piccoGamma(k, th)
      const kc = rng.int(3, 8)
      return {
        prompt: md`(a) Il modulo dell'eco di un radar segue una Rayleigh con $\sigma = ${f(sR)}$, $f(x|\sigma)=\frac{x}{\sigma^{2}}\exp\left(-\frac{x^{2}}{2\sigma^{2}}\right)$: trova la moda e il picco. (b) Il tempo d'attesa di un server segue una Gamma con $k = ${k}$ e $\theta = ${f(th)}$, $f(x;k,\theta)=x^{k-1}\frac{e^{-x/\theta}}{\theta^{k}\,\Gamma(k)}$ per $x > 0$: trova la moda e la varianza. (c) Un chi-quadro con $k = ${kc}$ gradi di libertà è una Gamma: con quale forma? Qual è la sua moda?`,
        answers: [
          risposta('(a) moda Rayleigh', sR, 0.01),
          risposta('(a) picco Rayleigh', pR),
          risposta('(b) moda Gamma', modaG, 0.01),
          risposta('(b) varianza Gamma', varG, tol(varG, 0.01, 0.01)),
          risposta('(c) forma della Gamma equivalente', kc / 2, 0.01),
          risposta('(c) moda chi-quadro', kc - 2, 0.01),
        ],
        solution: md`**(a) Rayleigh.** Derivo il prodotto fra il fattore lineare, che cresce, e quello gaussiano, che decresce:

$$\frac{df}{dx}=\frac{1}{\sigma^{2}}\exp\left(-\frac{x^{2}}{2\sigma^{2}}\right)\left(1-\frac{x^{2}}{\sigma^{2}}\right)=0\ \Rightarrow\ x=\sigma$$

L'esponenziale non si annulla mai, quindi si annulla la parentesi; tengo la radice positiva perché $x$ è un'ampiezza. Moda $= ${f(sR)}$, picco $f(\sigma|\sigma) = \frac{1}{\sigma}e^{-1/2} = \frac{1}{\sigma\sqrt{e}} = ${f(pR, 4)}$. Raddoppiare $\sigma$ sposta la moda al doppio e dimezza l'altezza: nel grafico della slide $\sigma = 0.5, 1, 2, 3, 4$ danno $1.21$, $0.61$, $0.30$, $0.20$, $0.15$.

**(b) Gamma.** Annullo la derivata del logaritmo: $\frac{d}{dx}\left[(k-1)\ln x - \frac{x}{\theta}\right] = \frac{k-1}{x} - \frac{1}{\theta} = 0$, quindi $x_{moda} = (k-1)\theta = ${k - 1}\cdot ${f(th)} = ${f(modaG)}$. Media $k\theta = ${f(k * th)}$, varianza $k\theta^2 = ${k}\cdot ${f(th)}^2 = ${f(varG)}$. Nella moda la pdf vale $${f(pG, 4)}$. $k$ decide la forma (monotona per $k = 1$, campana asimmetrica per $k > 1$, sempre più simmetrica al crescere di $k$); $\theta$ stira l'asse. Nel grafico della slide $(k, \theta) = (3, 2)$, $(5, 1)$ e $(9, 0.5)$ hanno la stessa moda 4 ma varianze $12$, $5$ e $2.25$.

**(c) Chi-quadro.** Nella Gamma con forma $k' = k/2$ e scala $\theta = 2$:

$$f_{\Gamma}=x^{k/2-1}\frac{e^{-x/2}}{2^{k/2}\,\Gamma(k/2)}=\frac{(1/2)^{k/2}}{\Gamma(k/2)}\,x^{k/2-1}e^{-x/2}=f_{\chi^{2}}(x;k)$$

Lettera per lettera la formula della slide 24. Con $k = ${kc}$: forma $${f(kc / 2)}$, scala 2, moda $(k/2 - 1)\cdot 2 = k - 2 = ${kc - 2}$, media $k = ${kc}$, varianza $2k = ${2 * kc}$. Controllo sui grafici: il chi-quadro con $k = 2$ e la Gamma con $k = 1$, $\theta = 2$ sono la stessa esponenziale che parte da 0.5.`,
      }
    },
  },
  {
    id: 'es12',
    title: 'Log-normale: parametri del logaritmo',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c19', 'c20'],
    generate: (rng) => {
      const mu = rng.float(-1, 1, 1)
      const opz = [
        { s: 1 / 8, tex: md`1/8` },
        { s: 1 / 4, tex: md`1/4` },
        { s: 1 / 2, tex: md`1/2` },
        { s: 1, tex: md`1` },
        { s: 3 / 2, tex: md`3/2` },
      ]
      const { s, tex } = rng.pick(opz)
      const moda = Math.exp(mu - s * s)
      const mediana = Math.exp(mu)
      const med = Math.exp(mu + (s * s) / 2)
      const picco = calcoli.piccoLogNormale(mu, s)
      return {
        prompt: md`Il prezzo delle case di un quartiere (in centinaia di migliaia di euro) segue una log-normale

$$f(x;\mu,\sigma)=\frac{e^{-(\ln x-\mu)^{2}/(2\sigma^{2})}}{x\sigma\sqrt{2\pi}},\qquad x>0$$

con $\mu = ${f(mu, 1)}$ e $\sigma = ${tex}$. Calcola (a) la moda, (b) la mediana, (c) la media, (d) il valore della pdf nella moda. Spiega da dove viene il fattore $1/x$ e perché nella slide la curva con $\sigma = 1/8$ esce dal grafico.`,
        answers: [
          risposta('(a) moda', moda),
          risposta('(b) mediana', mediana),
          risposta('(c) media', med),
          risposta('(d) picco', picco),
        ],
        solution: md`**Il fattore 1/x.** $x$ è log-normale quando $y = \ln x \sim N(\mu, \sigma^2)$: $\mu$ e $\sigma$ sono media e deviazione standard del logaritmo, non di $x$. Per il cambio di variabile moltiplico per la derivata della trasformazione:

$$p_x(x)=p_y(\ln x)\left|\frac{dy}{dx}\right|=\frac{1}{\sigma\sqrt{2\pi}}\exp\left[-\frac{(\ln x-\mu)^{2}}{2\sigma^{2}}\right]\frac{1}{x}$$

$1/x$ è lo jacobiano del logaritmo.

**(a) Moda.** Annullo la derivata di $\ln f = -\ln x - \frac{(\ln x-\mu)^{2}}{2\sigma^{2}} + cost$: $-\frac{1}{x}-\frac{\ln x-\mu}{\sigma^{2}x}=0$, cioè $\ln x = \mu - \sigma^2$ e $x_{moda} = e^{\mu-\sigma^2} = e^{${f(mu - s * s, 4)}} = ${f(moda, 4)}$.

**(b) Mediana.** $\ln x$ è monotono e la mediana della gaussiana di $\ln x$ è $\mu$: $x_{mediana} = e^{\mu} = ${f(mediana, 4)}$.

**(c) Media.** $E\{e^y\}$ con $y$ gaussiana; completando il quadrato nell'integrale si ottiene $E\{x\} = e^{\mu+\sigma^2/2} = ${f(med, 4)}$. Moda $<$ mediana $<$ media: la coda destra tira la media verso l'alto (asimmetria positiva).

**(d) Picco.** Nella moda $\ln x - \mu = -\sigma^2$:

$$f(x_{moda}) = \frac{e^{-\sigma^2/2}}{e^{\mu-\sigma^2}\,\sigma\sqrt{2\pi}} = \frac{e^{\sigma^2/2-\mu}}{\sigma\sqrt{2\pi}} = ${f(picco, 4)}$$

**Il grafico della slide** ($\mu = 0$). La mediana vale sempre $e^0 = 1$, mentre la moda $e^{-\sigma^2}$ scivola verso 0 al crescere di $\sigma$: $0.985$ per $\sigma = 1/8$, $0.939$ per $1/4$, $0.779$ per $1/2$, $0.368$ per $1$, $0.105$ per $3/2$. Con $\sigma = 1/8$ il picco è $\frac{e^{1/128}}{(1/8)\sqrt{2\pi}} \approx 3.2$, oltre il massimo dell'asse (2.0): la curva esce dal grafico. Con $\sigma$ piccola la log-normale è una campana stretta quasi simmetrica attorno a $e^{\mu}$.`,
      }
    },
  },
  {
    id: 'es13',
    title: 'Limite centrale: enunciato, ipotesi, conseguenze',
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c22', 'c23', 'c24', 'c25'],
    generate: (rng) => {
      const scen = rng.pick(['uniforme', 'esponenziale'])
      const a = rng.pick([1, 2, 4])
      const th = rng.pick([1, 2, 5])
      const mu = scen === 'uniforme' ? a / 2 : th
      const s2 = scen === 'uniforme' ? (a * a) / 12 : th * th
      const n = rng.pick([12, 16, 25, 30, 48, 50, 100])
      const z0 = rng.pick([-1.5, -1, -0.5, 0.5, 1, 1.5, 2])
      const s = Number((n * mu + z0 * Math.sqrt(n * s2)).toFixed(1))
      const ES = n * mu
      const VS = n * s2
      const z = (s - ES) / Math.sqrt(VS)
      const P = Phi(z)
      const viol = rng.pick([
        { txt: md`la somma di $n$ variabili di Cauchy indipendenti`, code: 3, why: md`La Cauchy non ha varianza finita (neppure la media): la media di $n$ Cauchy indipendenti è ancora una Cauchy, per quanto grande sia $n$.` },
        { txt: md`la somma di $n$ copie della stessa variabile, $S_n = n\,x_1$`, code: 2, why: md`Le variabili sono totalmente dipendenti: la somma conserva la forma di $x_1$, soltanto riscalata.` },
        { txt: md`una sola intensità esponenziale ($n = 1$)`, code: 1, why: md`Con $n = 1$ non si somma nulla: la «somma» ha la forma della singola variabile, asimmetrica.` },
      ])
      const descr =
        scen === 'uniforme'
          ? md`L'errore di quantizzazione di un convertitore analogico-digitale è uniforme su $[0,\ ${a}]$ (media $a/2$, varianza $a^2/12$). Sommi gli errori di $n = ${n}$ conversioni indipendenti.`
          : md`In un'immagine radar a un solo *look* l'intensità di un pixel è esponenziale con media $\theta = ${th}$ (varianza $\theta^2$). Un'immagine *multi-look* somma $n = ${n}$ look indipendenti.`
      return {
        prompt: md`${descr}

(a) Quanto valgono $E\{S_n\}$ e (b) $var\{S_n\}$? (c) Qual è il valore standardizzato di $s = ${f(s, 1)}$? (d) Con il teorema del limite centrale, quanto vale circa $P\{S_n \le ${f(s, 1)}\}$? (e) Quale ipotesi del teorema viola ${viol.txt}? Codice: 1 molte variabili, 2 iid, 3 varianza finita.`,
        answers: [
          risposta(md`(a) $E\{S_n\}$`, ES, tol(ES, 0.01, 0.01)),
          risposta(md`(b) $var\{S_n\}$`, VS, tol(VS, 0.01, 0.01)),
          risposta('(c) valore standardizzato', z, 0.02),
          risposta(md`(d) $P\{S_n \le s\}$`, P, 0.01),
          risposta('(e) codice', viol.code, 0.1),
        ],
        solution: md`**Enunciato della slide 25.** Se la somma di molte variabili iid ha varianza finita, allora è distribuita approssimativamente in modo normale (*if the sum of many iid variables has a finite variance, then it will be approximately normally distributed*). Tre ipotesi: molte variabili, indipendenti e identicamente distribuite, varianza finita. Sulla forma delle singole variabili il teorema non chiede nulla.

**(a), (b) Media e varianza della somma.** Le medie si sommano sempre; le varianze si sommano perché le variabili sono indipendenti:

$$E\{S_n\}=n\mu=${n}\cdot ${f(mu, 4)}=${f(ES, 4)},\qquad var\{S_n\}=n\sigma^2=${n}\cdot ${f(s2, 4)}=${f(VS, 4)}$$

Entrambe crescono con $n$: per questo il teorema si enuncia sulla somma standardizzata $\frac{S_n-n\mu}{\sigma\sqrt{n}}$, che converge alla $N(0,1)$. La varianza della somma è finita se e solo se lo è quella della singola variabile.

**(c)** $z = \frac{${f(s, 1)} - ${f(ES, 4)}}{\sqrt{${f(VS, 4)}}} = ${f(z, 3)}$.

**(d)** $P\{S_n \le ${f(s, 1)}\} \approx \Phi(${f(z, 3)}) = ${f(P, 4)}$. ${scen === 'esponenziale' ? md`Qui la somma esatta è una Gamma con $k = ${n}$ e $\theta = ${th}$: al crescere di $k$ la Gamma diventa sempre più simmetrica, come prevede il teorema. È il motivo per cui il *multi-look* rende più gaussiana la statistica del pixel radar.` : md`La somma di uniformi è già molto vicina alla gaussiana con una dozzina di termini: l'approssimazione migliora con $n$.`}

**(e) Codice ${viol.code}.** ${viol.why}

**Ubiquità della gaussiana.** Molti processi reali nascono da tante cause indipendenti, ognuna con un piccolo effetto, e hanno varianza finita: per il teorema la loro somma è circa gaussiana. Per questo il modello gaussiano è parametrico e usatissimo (*widely used*) in signal processing, machine learning, economia e ingegneria.`,
      }
    },
  },
  {
    id: 'es14',
    title: 'Sviluppa la derivata prima per una gaussiana',
    difficulty: 3,
    kind: 'dimostrazione',
    concepts: ['c56', 'c57', 'c58', 'c70'],
    generate: (rng) => {
      const N = rng.int(4, 7)
      const base = rng.pick([3, 5, 8])
      const xs = Array.from({ length: N }, () => Number((base + rng.float(-2, 2, 1)).toFixed(1)))
      if (xs.every((v) => v === xs[0])) xs[0] = Number((xs[0] + 0.5).toFixed(1))
      const mh = media(xs)
      const sc = xs.map((v) => v - mh)
      const Ssq = sc.reduce((s, v) => s + v * v, 0)
      const vML = Ssq / N
      const s2 = rng.pick([0.5, 1, 2, 4])
      const off = rng.pick([-1, -0.5, 0.5, 1])
      const m0 = Number((mh + off).toFixed(1))
      const der = (N * (mh - m0)) / s2
      const der2 = -N / s2
      return {
        prompt: md`Dati $N$ campioni iid da una gaussiana 1-D, scrivi la verosimiglianza (*likelihood*), passa al logaritmo, deriva rispetto a $m$ e a $\sigma^2$, annulla le derivate e interpreta il risultato. Spiega perché si può scrivere la verosimiglianza come prodotto e perché il massimo non cambia passando al logaritmo; estendi il risultato su $m$ al caso multivariato.

Poi i numeri: le lunghezze (in dm) di $N = ${N}$ salmoni sono $${xs.map((v) => f(v, 1)).join(',\\ ')}$. Calcola (a) $\hat{m}$, (b) $\hat{\sigma}^2$ ML, (c) la derivata $\frac{\partial}{\partial m}\ln p(X|m,\sigma^2)$ in $m = ${f(m0, 1)}$ supponendo $\sigma^2 = ${f(s2)}$, (d) la derivata seconda rispetto a $m$ con lo stesso $\sigma^2$.`,
        answers: [
          risposta(md`(a) $\hat{m}$`, mh, 0.01),
          risposta(md`(b) $\hat{\sigma}^2$`, vML, tol(vML, 0.01, 0.005)),
          risposta('(c) derivata prima', der, tol(der, 0.01, 0.01)),
          risposta('(d) derivata seconda', der2, tol(der2, 0.01, 0.01)),
        ],
        solution: md`**1. Verosimiglianza.** I campioni sono iid: la densità congiunta è il prodotto delle densità dei singoli campioni.

$$p(X|m,\sigma^{2})=\prod_{k=1}^{N}p(x_k|m,\sigma^{2})=\prod_{k=1}^{N}\frac{1}{\sigma\sqrt{2\pi}}\exp\left[-\frac{(x_k-m)^{2}}{2\sigma^{2}}\right]$$

**2. Logaritmo.** $\ln$ è monotono crescente: ha lo stesso punto di massimo e trasforma il prodotto in somma.

$$\ln p(X|m,\sigma^{2})=-\frac{N}{2}\ln(2\pi\sigma^{2})-\frac{1}{2\sigma^{2}}\sum_{k=1}^{N}(x_k-m)^{2}$$

**3. Derivata rispetto a m.** Sul singolo addendo la derivata del quadrato è due volte la base per la derivata interna, $-1$:

$$\frac{\partial}{\partial m}\ln p(X|m,\sigma^{2})=\frac{1}{\sigma^{2}}\sum_{k=1}^{N}(x_k-m)$$

**4. La annullo.** $\sum_{k}(x_k-\hat{m})=0\ \Rightarrow\ \hat{m}=\frac{1}{N}\sum_{k=1}^{N}x_k$. **Significato:** la derivata è la somma degli scarti; si annulla quando scarti positivi e negativi si bilanciano, cioè nel baricentro dei dati. La stima ML della media è la media campionaria, e non dipende da $\sigma^2$.

**5. Secondo ordine.** $\frac{\partial^{2}}{\partial m^{2}}\ln p=-\frac{N}{\sigma^{2}}<0$: la log-verosimiglianza è una parabola concava in $m$, il punto trovato è un massimo.

**6. Derivata rispetto a σ².** Tratto $v = \sigma^2$ come una sola variabile:

$$\frac{\partial}{\partial\sigma^{2}}\ln p=-\frac{N}{2\sigma^{2}}+\frac{1}{2\sigma^{4}}\sum_{k=1}^{N}(x_k-m)^{2}=0\ \Rightarrow\ \hat{\sigma}^{2}=\frac{1}{N}\sum_{k=1}^{N}(x_k-\hat{m})^{2}$$

Metto $\hat{m}$ al posto di $m$: la condizione su $m$ non contiene $\sigma^2$, quindi risolvo prima in $m$ e poi in $\sigma^2$. Nel punto trovato la derivata mista si annulla e la derivata seconda in $\sigma^2$ vale $-\frac{N}{2\hat{\sigma}^4} < 0$: è un massimo congiunto. Il fattore è $\frac{1}{N}$, non $\frac{1}{N-1}$.

**7. Caso multivariato.** Con $\nabla_{\mathbf{u}}(\mathbf{u}^t A\mathbf{u}) = 2A\mathbf{u}$ per $A$ simmetrica:

$$\nabla_{\mathbf{m}}\ln p(X|\mathbf{m},\Sigma)=\Sigma^{-1}\sum_{k=1}^{N}(\mathbf{x}_k-\mathbf{m})=\mathbf{0}\ \Rightarrow\ \hat{\mathbf{m}}=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k$$

$\Sigma^{-1}$ è invertibile, quindi si annulla la somma degli scarti. Derivando rispetto a $\Sigma^{-1}$ si trova $\hat{\Sigma}=\frac{1}{N}\sum_k(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t$ (dimostrazione [«Stima ML di m e Σ nel caso multivariato»](#derivation:der09)).

**Numeri.** (a) $\hat{m} = \frac{${f(mh * N, 1)}}{${N}} = ${f(mh, 4)}$. (b) Scarti $${sc.map((v) => f(v, 4)).join(',\\ ')}$, somma dei quadrati $${f(Ssq, 4)}$, quindi $\hat{\sigma}^2 = \frac{${f(Ssq, 4)}}{${N}} = ${f(vML, 4)}$ (lo stimatore corretto darebbe $\frac{${f(Ssq, 4)}}{${N - 1}} = ${f(Ssq / (N - 1), 4)}$). (c) $\frac{1}{\sigma^2}\sum_k(x_k - m) = \frac{N(\hat{m} - m)}{\sigma^2} = \frac{${N}\cdot(${f(mh, 4)} - ${par(m0, 1)})}{${f(s2)}} = ${f(der, 4)}$: il segno ${der > 0 ? 'positivo dice che la log-verosimiglianza cresce aumentando $m$, verso $\\hat{m}$' : 'negativo dice che la log-verosimiglianza cresce diminuendo $m$, verso $\\hat{m}$'}. (d) $-\frac{N}{\sigma^2} = -\frac{${N}}{${f(s2)}} = ${f(der2, 4)}$, negativa per ogni $m$.`,
      }
    },
  },
  {
    id: 'es15',
    title: 'Leggere la figura 3-D e gli isolivelli',
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c47', 'c52', 'c53', 'c54', 'c55'],
    generate: (rng) => {
      const coppie: [number, number, number][] = [
        [0, 1, 2],
        [0, 2, 1],
        [1, 2, 0],
      ]
      const zi = rng.int(0, 2)
      const [i0, j0, k0] = coppie[zi]
      let A: M3 = []
      for (let t = 0; t < 30 && A.length === 0; t++) {
        const v = [rng.int(1, 4), rng.int(1, 4), rng.int(1, 4)]
        const B: M3 = [
          [v[0], 0, 0],
          [0, v[1], 0],
          [0, 0, v[2]],
        ]
        for (const [p, q] of [
          [i0, k0],
          [j0, k0],
        ]) {
          const c = rng.pick([-1.5, -1, -0.5, 0.5, 1, 1.5])
          B[p][q] = c
          B[q][p] = c
        }
        const minore2 = B[0][0] * B[1][1] - B[0][1] ** 2
        if (minore2 > 0.1 && det3(B) > 0.1) A = B
      }
      if (A.length === 0) {
        A = [
          [1, 0.6, 0],
          [0.6, 1, 0.5],
          [0, 0.5, 1],
        ]
      }
      // se è scattato il ripiego, la coppia nulla è (1, 3)
      const zero = A[0][2] === 0 ? 1 : A[0][1] === 0 ? 0 : 2
      const [i, j, k] = coppie[zero]
      // coppia correlata di cui chiedere ρ, con gli indici in ordine crescente
      const [u, w] = i < k ? [i, k] : [k, i]
      const rho = A[u][w] / Math.sqrt(A[u][u] * A[w][w])
      const invij = inv3(A, i, j)
      const D = det3(A)
      const nome = (p: number, q: number) => md`$(x_${p + 1},\ x_${q + 1})$`
      return {
        prompt: md`Tre feature di un pixel multispettrale (riflettanza nel verde $x_1$, nel rosso $x_2$, nell'infrarosso $x_3$) seguono una gaussiana 3-D con

$$\Sigma = ${mat(A)}$$

(a) Quale coppia di feature è indipendente? Codice: 1 per ${nome(0, 1)}, 2 per ${nome(0, 2)}, 3 per ${nome(1, 2)}. (b) Quanto vale il coefficiente di correlazione della coppia ${nome(u, w)}? (c) Quanto vale l'elemento $(${i + 1},${j + 1})$ di $\Sigma^{-1}$? (d) Quanto vale $|\Sigma|$? Poi collega il risultato alla figura della slide 30 e spiega, guardando la slide 28, perché l'ellisse $z = 0.01$ è la più esterna.`,
        answers: [
          risposta('(a) codice della coppia', zero + 1, 0.1),
          risposta(md`(b) $\rho_{${u + 1}${w + 1}}$`, rho, 0.01),
          risposta(md`(c) $[\Sigma^{-1}]_{${i + 1}${j + 1}}$`, invij, tol(invij, 0.02, 0.002)),
          risposta(md`(d) $|\Sigma|$`, D, tol(D, 0.01, 0.01)),
        ],
        solution: md`**(a) Codice ${zero + 1}.** $\sigma_{${i + 1}${j + 1}} = \sigma_{${j + 1}${i + 1}} = 0$. Per un vettore congiuntamente gaussiano covarianza nulla significa indipendenza: la marginale di ${nome(i, j)} è una gaussiana 2-D con matrice diagonale e si fattorizza, $p(x_${i + 1}, x_${j + 1}) = p(x_${i + 1})\,p(x_${j + 1})$. Nella figura della slide 30 si riconosce così: l'ellisse proiettata sulla parete ${nome(i, j)} ha gli assi paralleli agli assi coordinati, mentre le proiezioni delle coppie correlate sono inclinate. È lo stesso ragionamento della nota della slide 30, «the features x1 and x3 are independent».

**(b)** $\rho_{${u + 1}${w + 1}} = \frac{\sigma_{${u + 1}${w + 1}}}{\sigma_${u + 1}\sigma_${w + 1}} = \frac{${f(A[u][w])}}{\sqrt{${A[u][u]}\cdot ${A[w][w]}}} = ${f(rho, 4)}$: numero puro fra $-1$ e $1$.

**(c)** Per una $3 \times 3$ simmetrica $[\Sigma^{-1}]_{ij} = \frac{\sigma_{ik}\sigma_{jk} - \sigma_{ij}\sigma_{kk}}{|\Sigma|}$ con $k$ il terzo indice. Qui $\sigma_{${i + 1}${j + 1}} = 0$, quindi $[\Sigma^{-1}]_{${i + 1}${j + 1}} = \frac{${par(A[i][k])}\cdot ${par(A[j][k])}}{${f(D, 4)}} = ${f(invij, 4)}$. Non è zero: $x_${i + 1}$ e $x_${j + 1}$ sono indipendenti a coppie (marginalmente), ma diventano dipendenti se si conosce $x_${k + 1}$, a cui sono entrambe legate. L'indipendenza condizionata richiederebbe lo zero in $\Sigma^{-1}$.

**(d)** $|\Sigma| = \sigma_1^2\sigma_2^2\sigma_3^2 + 2\sigma_{12}\sigma_{13}\sigma_{23} - \sigma_1^2\sigma_{23}^2 - \sigma_2^2\sigma_{13}^2 - \sigma_3^2\sigma_{12}^2 = ${f(D, 4)}$. È positivo: $\Sigma$ è definita positiva e la gaussiana esiste. $|\Sigma|$ è il prodotto dei tre autovalori e misura il volume della nuvola.

**Isolivelli (slide 28).** $p(\mathbf{x}) = z$ equivale a una distanza di Mahalanobis fissa, $r = \sqrt{2\ln(z_{max}/z)}$: più bassa è la quota, più grande è l'ellisse. $z = 3$ è il picco, l'isolivello degenere nel punto $\mathbf{m}$; $z = 2$, $0.5$ e $0.01$ danno ellissi concentriche sempre più larghe, e $z = 0.01$ è la più esterna. Tutte hanno gli assi lungo $\mathbf{e}_1$ (asse maggiore, direzione di massima varianza) ed $\mathbf{e}_2$ (perpendicolare).

**In n dimensioni.** Gli isolivelli sono iperellissi in $\Re^n$ (ellissoidi per $n = 3$), $\sum_i y_i^2/\lambda_i = r^2$ con $y_i = \mathbf{e}_i^t(\mathbf{x}-\mathbf{m})$. Con $\lambda_1 \ge \dots \ge \lambda_n$ il primo autovettore dà l'asse principale, l'ultimo l'asse più piccolo; le ombre di un ellissoide sulle pareti del cubo sono ellissi.`,
      }
    },
  },
  {
    id: 'es16',
    title: 'Quanto vale il bias con pochi campioni?',
    difficulty: 1,
    kind: 'numerico',
    concepts: ['c61', 'c62', 'c63', 'c64', 'c60', 'c70'],
    generate: (rng) => {
      const s2 = rng.pick([0.5, 1, 2, 4, 9, 16])
      const N = rng.int(2, 12)
      const EML = ((N - 1) / N) * s2
      const bias = 100 / N
      const p = rng.pick([0.5, 1, 2, 5])
      const Nmin = Math.ceil(100 / p - 1e-9)
      return {
        prompt: md`Un laboratorio stima la varianza del rumore di un sensore, che in realtà vale $\sigma^2 = ${f(s2)}$, da $N = ${N}$ misure iid. Quanto valgono in media (a) la stima ML $\hat{\sigma}^2 = \frac{1}{N}\sum_k(x_k - \hat{m})^2$ e (b) lo stimatore corretto $s^2 = \frac{1}{N-1}\sum_k(x_k - \hat{m})^2$? (c) Qual è il bias relativo della stima ML, in percentuale? (d) Qual è il minimo $N$ per cui il bias relativo non supera il $${f(p, 1)}\%$?`,
        answers: [
          risposta(md`(a) $E\{\hat{\sigma}^2\}$`, EML),
          risposta(md`(b) $E\{s^2\}$`, s2),
          risposta('(c) bias relativo (%)', bias, tol(bias, 0.01, 0.05)),
          risposta('(d) N minimo', Nmin, 0.5),
        ],
        solution: md`**(a)** Per la slide 31, nel caso $n = 1$: $E\{\hat{\sigma}^2\} = \frac{N-1}{N}\sigma^2 = \frac{${N - 1}}{${N}}\cdot ${f(s2)} = ${f(EML, 4)}$. La stima ML sottostima: gli scarti sono misurati da $\hat{m}$, che sta più vicina ai dati della media vera.

**(b)** $s^2 = \frac{N}{N-1}\hat{\sigma}^2$, quindi $E\{s^2\} = \frac{N}{N-1}\cdot\frac{N-1}{N}\sigma^2 = \sigma^2 = ${f(s2)}$: non distorto per ogni $N \ge 2$. La media campionaria invece è non distorta già così, $E\{\hat{m}\} = m$.

**(c)** $\frac{\sigma^2 - E\{\hat{\sigma}^2\}}{\sigma^2} = 1 - \frac{N-1}{N} = \frac{1}{N} = \frac{1}{${N}}$, cioè il $${f(bias, 2)}\%$. Non dipende da $\sigma^2$.

**(d)** $\frac{1}{N} \le ${f(p / 100, 4)} \iff N \ge \frac{100}{${f(p, 1)}} = ${f(100 / p, 2)}$, quindi $N_{min} = ${Nmin}$ (strettamente sotto soglia da $N = ${Nmin + 1}$). Con $N = 2$ la ML vale in media metà del vero, con $N = 10$ il 90%, con $N = 100$ il 99%: la correzione $\frac{N}{N-1}$ conta con pochi dati ed è irrilevante con molti. Per questo la slide dice che le stime sono asintoticamente non distorte.`,
      }
    },
  },
  {
    id: 'es17',
    title: "ML contro Bayes: che cos'è θ?",
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c65', 'c66', 'c67', 'c68', 'c01'],
    generate: (rng) => {
      const s2 = rng.pick([1, 4, 9])
      const s02 = rng.pick([0.25, 1, 4, 16])
      const mu0 = rng.int(-2, 2)
      const N = rng.int(3, 20)
      const xbar = rng.float(-3, 5, 2)
      const den = N * s02 + s2
      const muN = (N * s02 * xbar + s2 * mu0) / den
      const sN2 = (s02 * s2) / den
      const n0 = s2 / s02
      const w = (N * s02) / den
      return {
        prompt: md`Stimi la media $\mu$ della temperatura di un magazzino da $N = ${N}$ letture iid di un sensore IoT con varianza nota $\sigma^2 = ${s2}$; la media campionaria è $\bar{X} = ${f(xbar, 2)}$. Un tecnico ti dà una conoscenza a priori: $\mu \sim N(${mu0}, ${f(s02)})$.

Spiega la differenza concettuale fra stima ML e stima bayesiana (che cosa è $\theta$ in ciascuna) e l'ipotesi che le accomuna. Poi calcola (a) la stima ML, (b) la media a posteriori $\mu_N$, (c) la varianza a posteriori $\sigma_N^2$, (d) quanti campioni «virtuali» vale il prior, $n_0 = \sigma^2/\sigma_0^2$. (e) Qual è l'ipotesi comune ai due approcci? Codice: 1 forma di $p(\mathbf{x}|\boldsymbol{\theta})$ nota, 2 $\boldsymbol{\theta}$ variabile aleatoria, 3 prior $p(\boldsymbol{\theta})$ nota.`,
        answers: [
          risposta(md`(a) $\hat{\mu}_{ML}$`, xbar, 0.01),
          risposta(md`(b) $\mu_N$`, muN, tol(muN, 0.01, 0.01)),
          risposta(md`(c) $\sigma_N^2$`, sN2, tol(sN2, 0.01, 0.001)),
          risposta(md`(d) $n_0$`, n0, tol(n0, 0.01, 0.01)),
          risposta('(e) codice', 1, 0.1),
        ],
        solution: md`**Visione ML.** Il vettore dei parametri $\boldsymbol{\theta}$ è una quantità fissa ma incognita (*fixed but unknown*). Cerco il singolo valore che rende più probabili i dati osservati, $\hat{\boldsymbol{\theta}}=\arg\max_{\boldsymbol{\theta}}\,p(X|\boldsymbol{\theta})$: il risultato è un punto.

**Visione bayesiana** (*Bayesian learning*). $\boldsymbol{\theta}$ è una variabile aleatoria con una sua distribuzione. Il prior $p(\boldsymbol{\theta})$ riassume ciò che so prima dei dati; dopo averli visti lo aggiorno con il teorema di Bayes nella densità a posteriori, $p(\boldsymbol{\theta}) \longrightarrow p(\boldsymbol{\theta}|X)$. Il risultato è una distribuzione.

**(e) Codice 1.** Entrambi gli approcci assumono nota la forma funzionale di $p(\mathbf{x}|\boldsymbol{\theta})$ (*known density form*), qui gaussiana, e ignoti i valori dei parametri. Il prior e la natura aleatoria di $\boldsymbol{\theta}$ sono solo bayesiani. La stima bayesiana si applica ovunque la densità incognita si possa parametrizzare.

**(a)** ML: $\hat{\mu} = \bar{X} = ${f(xbar, 2)}$.

**(b), (c)** Con prior e verosimiglianza gaussiani la posterior è ancora gaussiana, con

$$\mu_N=\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}\bar{X}+\frac{\sigma^2}{N\sigma_0^2+\sigma^2}\mu_0=${f(w, 4)}\cdot ${par(xbar, 2)}+${f(1 - w, 4)}\cdot ${par(mu0, 0)}=${f(muN, 4)}$$

$$\sigma_N^2=\frac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2}=\frac{${f(s02)}\cdot ${s2}}{${f(den, 4)}}=${f(sN2, 4)}$$

**(d)** $n_0 = \frac{${s2}}{${f(s02)}} = ${f(n0, 4)}$: $\mu_N = \frac{N\bar{X} + n_0\mu_0}{N + n_0}$, come se il prior valesse $${f(n0, 2)}$ campioni con media $\mu_0$ accanto ai tuoi $${N}$.

**Quando coincidono.** Per $N \to \infty$ il peso del prior $\frac{\sigma^2}{N\sigma_0^2+\sigma^2}$ tende a zero, $\mu_N \to \bar{X}$ e $\sigma_N^2 \to 0$: la posterior diventa un picco sulla stima ML. Con un prior piatto ($\sigma_0^2 \to \infty$, prior uniforme) succede solo in parte: la posterior ha media e moda in $\bar{X}$ e varianza $\sigma_N^2 \to \sigma^2/N$, che non va a zero. La stima bayesiana puntuale coincide quindi con la ML anche per $N$ finito, ma la posterior resta una campana di varianza $\sigma^2/N$, non un picco. La ML gode delle proprietà asintotiche (non distorsione, efficienza e consistenza): con molti dati le due stime danno lo stesso numero.`,
      }
    },
  },
  {
    id: 'es18',
    title: 'Leggere le quote z della slide 28',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c43', 'c47', 'c29', 'c32'],
    generate: (rng) => {
      const zmax = rng.pick([1, 2, 3, 5])
      const fr = rng
        .shuffle([0.8, 0.6, 0.4, 0.25, 0.15, 0.1, 0.05, 0.02, 0.005, 0.002])
        .slice(0, 3)
        .sort((p, q) => q - p)
      const zs = fr.map((v) => Number((zmax * v).toPrecision(2)))
      const rs = zs.map((z) => Math.sqrt(2 * Math.log(zmax / z)))
      const frac = 1 - zs[1] / zmax
      const radDet = 1 / (2 * Math.PI * zmax)
      const righe = zs.map((z, i) => md`| $${f(z, 4)}$ | $\sqrt{2\ln(${zmax}/${f(z, 4)})}$ | $${f(rs[i], 3)}$ | $${f(100 * (1 - z / zmax), 1)}\%$ |`).join('\n')
      return {
        prompt: md`In una figura come quella della slide 28 il picco di una gaussiana 2-D vale $z_{max} = ${zmax}$ (quota del punto centrale $\mathbf{m}$) e tre ellissi di isolivello hanno quote $z = ${zs.map((z) => f(z, 4)).join(',\\ ')}$. (a) Scrivi $p(\mathbf{x})$ in funzione di $z_{max}$ e della forma quadratica $r^2$. (b) Calcola il raggio di Mahalanobis delle tre ellissi. (c) Che frazione dei campioni cade dentro l'ellisse di quota $${f(zs[1], 4)}$? (d) Quanto vale $|\Sigma|^{1/2}$?`,
        answers: [
          risposta(md`(b) $r$ per $z = ${f(zs[0], 4)}$`, rs[0], 0.01),
          risposta(md`(b) $r$ per $z = ${f(zs[1], 4)}$`, rs[1], 0.01),
          risposta(md`(b) $r$ per $z = ${f(zs[2], 4)}$`, rs[2], 0.01),
          risposta('(c) frazione dentro (0-1)', frac, 0.005),
          risposta(md`(d) $|\Sigma|^{1/2}$`, radDet, tol(radDet, 0.01, 0.0005)),
        ],
        solution: md`**(a)** La costante di normalizzazione è il valore nel picco, $z_{max} = p(\mathbf{m}) = \frac{1}{2\pi|\Sigma|^{1/2}}$, quindi

$$p(\mathbf{x}) = z_{max}\,e^{-r^2/2},\qquad r^2 = (\mathbf{x}-\mathbf{m})^t\Sigma^{-1}(\mathbf{x}-\mathbf{m})$$

**(b)** Pongo $p(\mathbf{x}) = z$ e risolvo: $r = \sqrt{2\ln\frac{z_{max}}{z}}$. L'isolivello esiste solo per $0 < z \le z_{max}$; a $z = z_{max}$ degenera nel punto $\mathbf{m}$.

| quota $z$ | calcolo | $r$ | frazione dentro |
|---|---|---|---|
${righe}

Quota più bassa, ellisse più grande: tutte hanno lo stesso centro, la stessa orientazione e lo stesso rapporto fra gli assi, perché cambia solo $r$.

**(c)** In 2-D la forma quadratica $r^2$ di un campione è un chi-quadro con 2 gradi di libertà, cioè un'esponenziale di media 2: $P\{r^2 \le R^2\} = 1 - e^{-R^2/2} = 1 - \frac{z}{z_{max}}$. Per $z = ${f(zs[1], 4)}$: $1 - \frac{${f(zs[1], 4)}}{${zmax}} = ${f(frac, 4)}$.

**(d)** $\frac{1}{2\pi|\Sigma|^{1/2}} = ${zmax}$, quindi $|\Sigma|^{1/2} = \frac{1}{2\pi\cdot ${zmax}} = ${f(radDet, 5)}$. Picco alto vuol dire nuvola stretta: l'area dell'ellisse di raggio $r$ vale $\pi r^2|\Sigma|^{1/2}$. Con i valori della slide ($z_{max} = 3$ e quote $2$, $0.5$, $0.01$) i raggi sono $0.90$, $1.89$ e $3.38$ e le frazioni $33.3\%$, $83.3\%$ e $99.7\%$; il disegno della slide è qualitativo.`,
      }
    },
  },
  {
    id: 'es19',
    title: 'Costruire Σ 2×2 da varianze e correlazione',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c69', 'c32', 'c37', 'c44'],
    generate: (rng) => {
      const s1 = rng.float(0.5, 3, 1)
      const s2 = rng.float(0.5, 3, 1)
      let rho = rng.float(-0.95, 0.95, 2)
      if (Math.abs(rho) < 0.05) rho = 0.5
      const c = rho * s1 * s2
      const S: S2 = [s1 * s1, c, s2 * s2]
      const D = det2(S)
      const [l1, l2] = eig2(S)
      const picco = 1 / (2 * Math.PI * Math.sqrt(D))
      const i11 = S[2] / D
      const i12 = -c / D
      const i22 = S[0] / D
      return {
        prompt: md`Nella classe salmone la luminosità ha deviazione standard $\sigma_1 = ${f(s1, 1)}$, la larghezza $\sigma_2 = ${f(s2, 1)}$ e il coefficiente di correlazione fra le due vale $\rho = ${f(rho, 2)}$. (a) Quanto vale la covarianza $\sigma_{12}$? (b) Quanto vale $|\Sigma|$? (c) Calcola l'inversa $\Sigma^{-1}$ (i suoi tre elementi distinti). (d) Quali sono gli autovalori $\lambda_1 \ge \lambda_2$? (e) Quanto vale il picco della gaussiana 2-D? (f) Per quale valore di $|\rho|$ la matrice diventa singolare?`,
        answers: [
          risposta(md`(a) $\sigma_{12}$`, c, tol(c, 0.01, 0.005)),
          risposta(md`(b) $|\Sigma|$`, D, tol(D, 0.01, 0.005)),
          risposta(md`(c) $[\Sigma^{-1}]_{11}$`, i11, tol(i11, 0.01, 0.005)),
          risposta(md`(c) $[\Sigma^{-1}]_{12}$`, i12, tol(i12, 0.01, 0.005)),
          risposta(md`(c) $[\Sigma^{-1}]_{22}$`, i22, tol(i22, 0.01, 0.005)),
          risposta(md`(d) $\lambda_1$`, l1, tol(l1, 0.01, 0.005)),
          risposta(md`(d) $\lambda_2$`, l2, tol(l2, 0.01, 0.005)),
          risposta('(e) picco', picco, tol(picco, 0.01, 0.0005)),
          risposta(md`(f) $|\rho|$`, 1, 0.01),
        ],
        solution: md`**(a)** $\rho=\frac{\sigma_{12}}{\sigma_1\sigma_2}$, quindi $\sigma_{12} = \rho\,\sigma_1\sigma_2 = ${f(rho, 2)}\cdot ${f(s1, 1)}\cdot ${f(s2, 1)} = ${f(c, 4)}$ e

$$\Sigma=\begin{bmatrix}\sigma_1^{2}&\rho\,\sigma_1\sigma_2\\\rho\,\sigma_1\sigma_2&\sigma_2^{2}\end{bmatrix}=${mat([[S[0], c], [c, S[2]]], 4)}$$

Varianze sulla diagonale, covarianza fuori. ${rho > 0 ? 'Con $\\rho > 0$ le due feature crescono insieme: l\'ellisse sale verso destra.' : 'Con $\\rho < 0$ una feature cresce quando l\'altra cala: l\'ellisse scende verso destra.'}

**(b)** $|\Sigma| = \sigma_1^2\sigma_2^2 - \sigma_{12}^2 = \sigma_1^2\sigma_2^2(1 - \rho^2) = ${f(S[0], 4)}\cdot ${f(S[2], 4)}\cdot ${f(1 - rho * rho, 4)} = ${f(D, 4)}$.

**(c)** Per una $2\times 2$ l'inversa scambia gli elementi della diagonale, cambia segno a quelli fuori e divide per il determinante (è la matrice aggiunta divisa per $|\Sigma|$):

$$\Sigma^{-1}=\frac{1}{|\Sigma|}\begin{bmatrix}\sigma_2^{2}&-\sigma_{12}\\-\sigma_{12}&\sigma_1^{2}\end{bmatrix}=\frac{1}{${f(D, 4)}}${mat([[S[2], -c], [-c, S[0]]], 4)}=${mat([[i11, i12], [i12, i22]], 4)}$$

Controllo: $\Sigma\,\Sigma^{-1} = I$, per esempio $\sigma_1^2[\Sigma^{-1}]_{11} + \sigma_{12}[\Sigma^{-1}]_{12} = \frac{\sigma_1^2\sigma_2^2 - \sigma_{12}^2}{|\Sigma|} = 1$. È la matrice che entra nella forma quadratica all'esponente; esiste solo se $|\Sigma| \ne 0$.

**(d)** $\lambda_{1,2} = \frac{\sigma_1^2 + \sigma_2^2}{2} \pm \sqrt{\left(\frac{\sigma_1^2 - \sigma_2^2}{2}\right)^2 + \sigma_{12}^2} = ${f((S[0] + S[2]) / 2, 4)} \pm ${f(Math.sqrt(((S[0] - S[2]) / 2) ** 2 + c * c), 4)}$: $\lambda_1 = ${f(l1, 4)}$, $\lambda_2 = ${f(l2, 4)}$. Controllo: $\lambda_1\lambda_2 = ${f(l1 * l2, 4)} = |\Sigma|$.

**(e)** $p(\mathbf{m}) = \frac{1}{2\pi|\Sigma|^{1/2}} = \frac{1}{2\pi\sqrt{${f(D, 4)}}} = ${f(picco, 4)}$. Più $|\rho|$ cresce, più $|\Sigma|$ cala e il picco sale: la nuvola si schiaccia su una retta e il volume 1 si concentra.

**(f)** $|\Sigma| = \sigma_1^2\sigma_2^2(1 - \rho^2) = 0 \iff |\rho| = 1$. Le feature sono linearmente dipendenti, i punti stanno su una retta, $\lambda_2 = 0$, $\Sigma^{-1}$ non esiste e la pdf non è definita. Il vincolo $|\rho| \le 1$, cioè $\sigma_{12}^2 \le \sigma_1^2\sigma_2^2$, è la semidefinitezza positiva in 2-D.`,
      }
    },
  },
  {
    id: 'es20',
    title: 'Autovettori ortogonali e direzione di massima varianza',
    difficulty: 3,
    kind: 'dimostrazione',
    concepts: ['c45', 'c51', 'c53', 'c39'],
    generate: (rng) => {
      const a = rng.pick([1, 1.5, 2, 3, 4, 5])
      const b = rng.pick([1, 1.5, 2, 3, 4, 5])
      const lim = Math.sqrt(a * b)
      let c = Number((rng.float(-0.9, 0.9, 2) * lim).toFixed(1))
      if (Math.abs(c) < 0.1) c = Number((0.5 * lim).toFixed(1))
      const S: S2 = [a, c, b]
      const [l1, l2] = eig2(S)
      const phi = angolo(S)
      const psi = rng.pick([0, 30, 45, 60, 90, 120, 135, 150])
      const rad = (psi * Math.PI) / 180
      const av: V2 = [Math.cos(rad), Math.sin(rad)]
      const v = av[0] ** 2 * a + 2 * av[0] * av[1] * c + av[1] ** 2 * b
      const [e1, e2] = autovettori(S)
      const c1 = av[0] * e1[0] + av[1] * e1[1]
      const c2 = av[0] * e2[0] + av[1] * e2[1]
      return {
        prompt: md`(a) Dimostra che due autovettori di una matrice simmetrica associati ad autovalori distinti sono ortogonali, e spiega perché con autovalori coincidenti si può comunque scegliere una base ortogonale. (b) Dimostra con i moltiplicatori di Lagrange che la direzione unitaria $\mathbf{a}$ che massimizza la varianza proiettata $\mathbf{a}^t\Sigma\mathbf{a}$ è l'autovettore del massimo autovalore, e che il massimo vale $\lambda_1$.

(c) Verifica con $\Sigma = ${mat([[a, c], [c, b]], 1)}$: calcola $\lambda_1$, $\lambda_2$, l'angolo $\varphi$ di $\mathbf{e}_1$ rispetto a $x_1$ (in gradi, fra $-90^\circ$ e $90^\circ$) e la varianza proiettata lungo la direzione a $${psi}^\circ$ da $x_1$.`,
        answers: [
          risposta(md`$\lambda_1$`, l1, tol(l1, 0.01, 0.005)),
          risposta(md`$\lambda_2$`, l2, tol(l2, 0.01, 0.005)),
          risposta(md`$\varphi$ (gradi)`, phi, 0.5),
          risposta(md`varianza a $${psi}^\circ$`, v, tol(v, 0.01, 0.005)),
        ],
        solution: md`**(a) Ortogonalità.** Siano $\Sigma\mathbf{e}_i=\lambda_i\mathbf{e}_i$ e $\Sigma\mathbf{e}_j=\lambda_j\mathbf{e}_j$ con $\lambda_i\ne\lambda_j$. Calcolo lo scalare $\mathbf{e}_j^{t}\Sigma\mathbf{e}_i$ in due modi:

$$\mathbf{e}_j^{t}\Sigma\mathbf{e}_i=\lambda_i\,\mathbf{e}_j^{t}\mathbf{e}_i,\qquad \mathbf{e}_j^{t}\Sigma\mathbf{e}_i=(\Sigma^{t}\mathbf{e}_j)^{t}\mathbf{e}_i=(\Sigma\mathbf{e}_j)^{t}\mathbf{e}_i=\lambda_j\,\mathbf{e}_j^{t}\mathbf{e}_i$$

Nel secondo uso la simmetria $\Sigma = \Sigma^t$. Sottraendo, $(\lambda_i-\lambda_j)\,\mathbf{e}_j^{t}\mathbf{e}_i=0$, e poiché gli autovalori sono diversi $\mathbf{e}_j^{t}\mathbf{e}_i=0$. Con autovalori ripetuti (isolivelli circolari se $\lambda_1 = \lambda_2$) ogni vettore del loro sottospazio è autovettore e se ne sceglie una base ortogonale. Normalizzati e messi come colonne di $U$: $U^tU = I$ e $\Sigma=U\Lambda U^{t}$.

**(b) Massima varianza.** Massimizzo $\mathbf{a}^{t}\Sigma\,\mathbf{a}$ con il vincolo $\mathbf{a}^t\mathbf{a} = 1$ (senza vincolo basterebbe allungare $\mathbf{a}$):

$$L(\mathbf{a},\lambda)=\mathbf{a}^{t}\Sigma\,\mathbf{a}-\lambda\left(\mathbf{a}^{t}\mathbf{a}-1\right),\qquad \nabla_{\mathbf{a}}L=2\Sigma\mathbf{a}-2\lambda\mathbf{a}=\mathbf{0}\ \Rightarrow\ \Sigma\mathbf{a}=\lambda\mathbf{a}$$

I punti stazionari sono gli autovettori, e in $\mathbf{a} = \mathbf{e}_i$ la varianza vale $\mathbf{e}_i^{t}\Sigma\,\mathbf{e}_i=\lambda_i$. Il massimo è $\lambda_1$ in $\mathbf{e}_1$ (asse principale), il minimo $\lambda_n$ in $\mathbf{e}_n$ (asse più piccolo). Verifica senza Lagrange: con $\mathbf{a}=\sum_i c_i\mathbf{e}_i$ e $\sum_i c_i^2 = 1$, $\mathbf{a}^{t}\Sigma\,\mathbf{a}=\sum_i\lambda_i c_i^{2}$ è una media pesata degli autovalori, quindi sta fra $\lambda_n$ e $\lambda_1$. È il primo passo della PCA.

**(c) Numeri.** $\lambda_{1,2} = ${f((a + b) / 2, 4)} \pm \sqrt{${f(((a - b) / 2) ** 2, 4)} + ${f(c * c, 4)}}$: $\lambda_1 = ${f(l1, 4)}$, $\lambda_2 = ${f(l2, 4)}$. Autovettore $\mathbf{e}_1 \propto (\sigma_{12},\ \lambda_1 - \sigma_1^2)^t = (${f(c, 1)},\ ${f(l1 - a, 4)})^t$, unitario e con prima componente positiva $${vt(e1, 4)}$; $\mathbf{e}_2 = ${vt(e2, 4)}$ e $\mathbf{e}_1^t\mathbf{e}_2 = 0$. Angolo $\varphi = \arctan\frac{${f(l1 - a, 4)}}{${f(c, 1)}} = ${f(phi, 2)}^\circ$${Math.abs(a - b) > 1e-9 ? md`, coerente con $\tan(2\varphi) = \frac{2\sigma_{12}}{\sigma_1^2 - \sigma_2^2} = ${f((2 * c) / (a - b), 4)}$` : md`: con $\sigma_1^2 = \sigma_2^2$ l'asse è a $\pm 45^\circ$, con il segno di $\sigma_{12}$`}.

Direzione a $${psi}^\circ$: $\mathbf{a} = ${vt(av, 4)}$, e

$$\mathbf{a}^t\Sigma\mathbf{a} = \sigma_1^2\cos^2\psi + 2\sigma_{12}\cos\psi\sin\psi + \sigma_2^2\sin^2\psi = ${f(v, 4)}$$

Con i pesi $c_1 = \mathbf{a}^t\mathbf{e}_1 = ${f(c1, 4)}$ e $c_2 = \mathbf{a}^t\mathbf{e}_2 = ${f(c2, 4)}$: $\lambda_1c_1^2 + \lambda_2c_2^2 = ${f(l1 * c1 * c1 + l2 * c2 * c2, 4)}$, compreso fra $\lambda_2 = ${f(l2, 4)}$ e $\lambda_1 = ${f(l1, 4)}$.`,
      }
    },
  },
  {
    id: 'es21',
    title: 'La media campionaria è efficiente, la varianza ML solo asintoticamente',
    difficulty: 3,
    kind: 'dimostrazione',
    concepts: ['c60', 'c61', 'c62', 'c70', 'c01'],
    generate: (rng) => {
      const s2 = rng.float(0.5, 10, 1)
      const N = rng.int(2, 50)
      const delta = rng.pick([0.5, 1, 2])
      const I = N / s2
      const vm = s2 / N
      const vML = (2 * (N - 1) * s2 * s2) / (N * N)
      const cr = (2 * s2 * s2) / N
      const vs2 = (2 * s2 * s2) / (N - 1)
      const cheb = s2 / (N * delta * delta)
      return {
        prompt: md`$N = ${N}$ campioni iid da una gaussiana 1-D $N(m, \sigma^2)$ con $\sigma^2 = ${f(s2, 1)}$. (a) Calcola l'informazione di Fisher per $m$ e (b) la varianza di $\hat{m}$, e verifica che raggiunge il bound di Cramér-Rao. (c) Usa la disuguaglianza di Chebyshev per limitare $P\{|\hat{m} - m| \ge ${f(delta)}\}$. (d) Sapendo che $\sum_k(x_k-\hat{m})^2/\sigma^2$ è un chi-quadro con $N-1$ gradi di libertà, calcola $var\{\hat{\sigma}^2\}$, (e) il bound di Cramér-Rao per $\sigma^2$ e (f) $var\{s^2\}$. Perché la varianza della stima ML può stare sotto il bound?`,
        answers: [
          risposta('(a) informazione di Fisher', I, tol(I, 0.01, 0.001)),
          risposta(md`(b) $var\{\hat{m}\}$`, vm, tol(vm, 0.01, 0.0005)),
          risposta('(c) bound di Chebyshev', cheb, tol(cheb, 0.01, 0.0005)),
          risposta(md`(d) $var\{\hat{\sigma}^2\}$`, vML, tol(vML, 0.01, 0.001)),
          risposta('(e) bound di Cramér-Rao', cr, tol(cr, 0.01, 0.001)),
          risposta(md`(f) $var\{s^2\}$`, vs2, tol(vs2, 0.01, 0.001)),
        ],
        solution: md`**(a) Informazione di Fisher.** La derivata della log-verosimiglianza è $\frac{\partial}{\partial m}\ln p = \frac{1}{\sigma^2}\sum_k(x_k - m)$; derivando ancora ogni addendo dà $-\frac{1}{\sigma^2}$:

$$I(m) = -E\left\{\frac{\partial^2}{\partial m^2}\ln p(X|m,\sigma^2)\right\} = \frac{N}{\sigma^2} = \frac{${N}}{${f(s2, 1)}} = ${f(I, 4)}$$

**(b) Efficienza.** $var\{\hat{m}\} = \frac{\sigma^2}{N} = ${f(vm, 4)} = I^{-1}(m)$. La media campionaria è non distorta e raggiunge il bound di Cramér-Rao per ogni $N$, non solo asintoticamente. In $n$ dimensioni: $I(\mathbf{m}) = N\Sigma^{-1}$ e $Cov\{\hat{\mathbf{m}}\} = \frac{1}{N}\Sigma$.

**(c) Consistenza.** Chebyshev: $P\{|\hat{m}-m|\ge\delta\}\le\frac{var\{\hat{m}\}}{\delta^{2}}=\frac{\sigma^{2}}{N\delta^{2}} = \frac{${f(s2, 1)}}{${N}\cdot ${f(delta * delta)}} = ${f(cheb, 4)}$${cheb >= 1 ? md` (sopra 1, quindi ancora non informativo con così pochi campioni)` : ''}. Per $N \to \infty$ il bound va a zero per ogni $\delta > 0$: uno stimatore non distorto con varianza che tende a zero è consistente.

**(d) Varianza della stima ML.** $\frac{N\hat{\sigma}^2}{\sigma^2} \sim \chi^2_{N-1}$, che ha media $N - 1$ e varianza $2(N-1)$. Quindi $E\{\hat{\sigma}^2\} = \frac{N-1}{N}\sigma^2$ e

$$var\{\hat{\sigma}^2\} = \frac{\sigma^4}{N^2}\,2(N-1) = \frac{2\cdot ${N - 1}\cdot ${f(s2 * s2, 4)}}{${N * N}} = ${f(vML, 4)}$$

**(e) Bound.** Per $\sigma^2$ il bound di Cramér-Rao vale $\frac{2\sigma^4}{N} = ${f(cr, 4)}$. Il rapporto $\frac{var\{\hat{\sigma}^2\}}{2\sigma^4/N} = \frac{N-1}{N} = ${f((N - 1) / N, 4)} \to 1$: asintoticamente efficiente, come dice la slide 31.

**(f) Stimatore corretto.** $s^2 = \frac{N}{N-1}\hat{\sigma}^2$ ha $var\{s^2\} = \frac{2\sigma^4}{N-1} = ${f(vs2, 4)}$, sopra il bound.

**Perché la ML sta sotto il bound.** Il bound di Cramér-Rao vale per gli stimatori non distorti; $\hat{\sigma}^2$ è distorta per $N$ finito, quindi il bound non la riguarda. Paga la varianza più bassa con il bias $-\frac{\sigma^2}{N}$. Per $N \to \infty$ bias e varianza vanno a zero: la stima è asintoticamente non distorta, efficiente e consistente.`,
      }
    },
  },
]

