// Esercizi generativi del modulo m10 (stima con dati incompleti, algoritmo EM, mistura di gaussiane):
// uno per ogni esercizio dell'inventario (es01-es21). Ogni generatore usa solo rng: stesso seed, stessa istanza.
// I conti stanno in `calcoli`, così lo script di verifica li confronta con i numeri dell'inventario.
import { md } from '../../types'
import type { Exercise, ExerciseAnswer, Rng } from '../../types'

// ---------------------------------------------------------------------------------------------------
// Calcoli
// ---------------------------------------------------------------------------------------------------

/** Mistura 1-D: prior, medie e varianze dei modi. */
export interface Mistura {
  P: number[]
  m: number[]
  s2: number[]
}

const somma = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
/** Densità gaussiana 1-D N(x | m, s2). */
const gauss = (x: number, m: number, s2: number) => Math.exp(-((x - m) ** 2) / (2 * s2)) / Math.sqrt(2 * Math.PI * s2)
/** Logaritmo della densità gaussiana: non va mai in underflow. */
const lnGauss = (x: number, m: number, s2: number) => -((x - m) ** 2) / (2 * s2) - 0.5 * Math.log(2 * Math.PI * s2)
/** ln(P_i N(x | m_i, s2_i)) per ogni modo. */
const lnNumeratori = (x: number, th: Mistura) => th.P.map((p, i) => Math.log(p) + lnGauss(x, th.m[i], th.s2[i]))
/** ln p(x | θ) con log-sum-exp. */
const lnMistura = (x: number, th: Mistura) => {
  const l = lnNumeratori(x, th)
  const mx = Math.max(...l)
  return mx + Math.log(somma(l.map((v) => Math.exp(v - mx))))
}
/** Numeratori della posterior: P_i N(x | m_i, s2_i). */
const numeratori = (x: number, th: Mistura) => th.P.map((p, i) => p * gauss(x, th.m[i], th.s2[i]))
/** Posterior P(i | x, θ) di ogni modo (E-step per un campione). */
const posterior = (x: number, th: Mistura) => {
  const l = lnNumeratori(x, th)
  const lse = lnMistura(x, th)
  return l.map((v) => Math.exp(v - lse))
}
/** Tabella delle posterior: riga j = campione, colonna i = modo. */
const eStep = (xs: number[], th: Mistura) => xs.map((x) => posterior(x, th))
/** M-step: prior, medie e varianze pesate dalle posterior (varianze attorno alle medie nuove). */
const mStep = (xs: number[], W: number[][]): Mistura => {
  const M = W[0].length
  const N = xs.length
  const Ni = Array.from({ length: M }, (_, i) => somma(W.map((r) => r[i])))
  const m = Ni.map((n, i) => somma(xs.map((x, j) => W[j][i] * x)) / n)
  const s2 = Ni.map((n, i) => somma(xs.map((x, j) => W[j][i] * (x - m[i]) ** 2)) / n)
  return { P: Ni.map((n) => n / N), m, s2 }
}
/** Log-verosimiglianza dei dati osservati: Σ_j ln p(x_j | θ). */
const logVer = (xs: number[], th: Mistura) => somma(xs.map((x) => lnMistura(x, th)))
/** Q(θ, θ^(k)) della mistura con i pesi W calcolati da θ^(k). */
const funzioneQ = (xs: number[], th: Mistura, W: number[][]) =>
  somma(xs.map((x, j) => somma(th.P.map((p, i) => (W[j][i] > 0 ? W[j][i] * (Math.log(p) + lnGauss(x, th.m[i], th.s2[i])) : 0)))))
/** H(θ, θ^(k)) = Σ_j Σ_i W_ji ln P(i | x_j, θ). */
const funzioneH = (xs: number[], th: Mistura, W: number[][]) =>
  somma(
    xs.map((x, j) => {
      const l = lnNumeratori(x, th)
      const lse = lnMistura(x, th)
      return somma(l.map((v, i) => (W[j][i] > 0 ? W[j][i] * (v - lse) : 0)))
    }),
  )
/** Numero di parametri liberi di una mistura di M gaussiane in n dimensioni. */
const parametriMistura = (M: number, n: number) => ({ prior: M - 1, medie: M * n, covarianze: (M * n * (n + 1)) / 2, totale: M - 1 + M * n + (M * n * (n + 1)) / 2 })

/** Esempio dei quattro punti (x1 mancante nel quarto): iterazioni di EM con covarianza diagonale. */
const quattroPunti = (x1: number[], x2: number[], iter: number) => {
  // x1: i tre valori noti; x2: i quattro valori noti (il quarto è quello del punto incompleto)
  const S = somma(x1)
  const mu2 = somma(x2) / 4
  const s22 = somma(x2.map((v) => (v - mu2) ** 2)) / 4
  const passi: { mu1: number; s12: number; mu2: number; s22: number }[] = [{ mu1: 0, s12: 1, mu2: 0, s22: 1 }]
  for (let k = 0; k < iter; k++) {
    const { mu1, s12 } = passi[k]
    const nuovo = (S + mu1) / 4
    const ss = somma(x1.map((v) => (v - nuovo) ** 2))
    passi.push({ mu1: nuovo, s12: (ss + s12 + (mu1 - nuovo) ** 2) / 4, mu2, s22 })
  }
  const muLim = S / 3
  const s12Lim = somma(x1.map((v) => (v - muLim) ** 2)) / 3
  return { passi, muLim, s12Lim }
}

/** Derivata di ln l rispetto a m_i nel punto θ (1-D), e somma delle posterior N_i. */
const gradienteMedia = (xs: number[], th: Mistura, i: number) => {
  const W = eStep(xs, th)
  const Ni = somma(W.map((r) => r[i]))
  const grad = somma(xs.map((x, j) => (W[j][i] * (x - th.m[i])) / th.s2[i]))
  return { grad, Ni, nuova: th.m[i] + (th.s2[i] / Ni) * grad }
}

export const calcoli = { gauss, lnGauss, numeratori, posterior, eStep, mStep, logVer, funzioneQ, funzioneH, parametriMistura, quattroPunti, gradienteMedia }

// ---------------------------------------------------------------------------------------------------
// Formattazione
// ---------------------------------------------------------------------------------------------------

/** Numero con al più d decimali, senza zeri inutili e mai -0. */
const f = (x: number, d = 3) => {
  const r = Number(x.toFixed(d))
  return String(r === 0 ? 0 : r)
}
/** p cifre significative; sotto 10^-3 in notazione scientifica LaTeX. */
const g = (x: number, p = 4) => {
  if (x === 0) return '0'
  const a = Math.abs(x)
  if (a >= 1e-3) {
    const r = Number(x.toPrecision(p))
    return String(r === 0 ? 0 : r)
  }
  const e = Math.floor(Math.log10(a))
  const man = Number((x / 10 ** e).toPrecision(p))
  return md`${man} \cdot 10^{${e}}`
}
/** Numero tra parentesi se negativo, per le sottrazioni scritte per esteso. */
const par = (x: number, d = 3) => (x < 0 ? `(${f(x, d)})` : f(x, d))
/** Tolleranza relativa con un minimo assoluto. */
const tol = (v: number, rel = 0.01, abs = 0.001) => Math.max(abs, Math.abs(v) * rel)
const risposta = (label: string, value: number, tolerance = tol(value)): ExerciseAnswer => ({ label, value, tolerance })
const elenco = (xs: number[], d = 3) => xs.map((x) => f(x, d)).join(',\\ ')
/** Arrotonda a d decimali (per i dati generati). */
const r = (x: number, d = 1) => Number(x.toFixed(d))

/** Sei campioni 1-D: tre attorno a c1, tre attorno a c2, tutti distinti. */
const seiCampioni = (rng: Rng, c1: number, c2: number) => {
  const off = [-1.5, -1, -0.5, 0, 0.5, 1, 1.5]
  const a = rng.shuffle(off).slice(0, 3).map((o) => c1 + o)
  const b = rng.shuffle(off).slice(0, 3).map((o) => c2 + o)
  return [...a, ...b].sort((p, q) => p - q)
}

/** Riga di tabella per l'E-step di una mistura a due modi. */
const righeEStep = (xs: number[], th: Mistura) =>
  xs
    .map((x, j) => {
      const n = numeratori(x, th)
      const w = posterior(x, th)
      return md`| ${j + 1} | $${f(x, 2)}$ | $${g(n[0])}$ | $${g(n[1])}$ | $${g(n[0] + n[1])}$ | $${g(w[0])}$ | $${g(w[1])}$ |`
    })
    .join('\n')
const testataEStep = md`| $j$ | $x_j$ | $P_1 \mathcal{N}(x_j \mid m_1, \sigma_1^2)$ | $P_2 \mathcal{N}(x_j \mid m_2, \sigma_2^2)$ | $p(x_j \mid \boldsymbol{\theta})$ | $P(1 \mid x_j)$ | $P(2 \mid x_j)$ |
|---|---|---|---|---|---|---|`

// ---------------------------------------------------------------------------------------------------
// Esercizi
// ---------------------------------------------------------------------------------------------------

export const exercises: Exercise[] = [
  {
    id: 'es01',
    title: 'Calcola le posterior dei modi in un punto',
    difficulty: 1,
    kind: 'numerico',
    concepts: ['c46', 'c47'],
    generate: (rng) => {
      const P1 = rng.pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8])
      const P2 = r(1 - P1, 2)
      const m1 = rng.float(2, 5.5, 1)
      const m2 = r(m1 + rng.float(1.5, 3, 1))
      const s1 = rng.float(0.6, 2, 1)
      const s2 = rng.float(0.6, 2, 1)
      // x fra le medie e a non più di tre deviazioni standard da ciascuna
      const lo = Math.max(m1, m2 - 3 * s2) + 0.1
      const hi = Math.min(m2, m1 + 3 * s1) - 0.1
      const x = rng.float(lo, hi, 1)
      const th: Mistura = { P: [P1, P2], m: [m1, m2], s2: [s1 * s1, s2 * s2] }
      const N1 = gauss(x, m1, s1 * s1)
      const N2 = gauss(x, m2, s2 * s2)
      const [n1, n2] = numeratori(x, th)
      const den = n1 + n2
      const [w1, w2] = [n1 / den, n2 / den]
      const z1 = Math.abs(x - m1) / s1
      const z2 = Math.abs(x - m2) / s2
      const verVince = N1 >= N2 ? 1 : 2
      const postVince = w1 >= w2 ? 1 : 2
      const priorVince = P1 === P2 ? 0 : P1 > P2 ? 1 : 2
      // Il verdetto sulla verosimiglianza viene dalle densità N1 e N2, non dalle distanze standardizzate:
      // con sigma diverse la campana più stretta è più alta e può vincere pur essendo più lontana.
      const zVicino = z1 < z2 ? 1 : z2 < z1 ? 2 : 0
      const densita = md`In $x$ le densità dei modi valgono $\mathcal{N}(x \mid m_1, \sigma_1^2) = ${g(N1, 5)}$ e $\mathcal{N}(x \mid m_2, \sigma_2^2) = ${g(N2, 5)}$: la verosimiglianza favorisce il modo ${verVince}`
      const notaDistanze =
        zVicino !== 0 && zVicino !== verVince
          ? md` Attento alle distanze: in deviazioni standard $x$ è più vicino al modo ${zVicino} ($${f(z1, 2)}$ dal modo 1, $${f(z2, 2)}$ dal modo 2), ma la campana del modo ${verVince} è più stretta, quindi più alta, e compensa la distanza maggiore.`
          : ''
      const commento =
        (verVince === postVince
          ? md`${densita}${priorVince === 0 ? ' e i prior sono uguali' : priorVince === verVince ? ' e il prior va nella stessa direzione' : `: il prior favorisce l'altro modo ma non basta a ribaltare la posterior`}.`
          : md`${densita}, ma il prior $P_${postVince} = ${f(th.P[postVince - 1], 2)}$ ribalta la posterior a favore del modo ${postVince}.`) + notaDistanze
      return {
        prompt: md`Un sensore misura una grandezza 1-D che segue una mistura di due gaussiane: $P_1 = ${f(P1, 2)}$, $m_1 = ${f(m1, 1)}$, $\sigma_1 = ${f(s1, 1)}$ e $P_2 = ${f(P2, 2)}$, $m_2 = ${f(m2, 1)}$, $\sigma_2 = ${f(s2, 1)}$. Arriva il campione $x = ${f(x, 1)}$. Calcola i due numeratori $P_i\,\mathcal{N}(x \mid m_i, \sigma_i^2)$, il denominatore $p(x \mid \boldsymbol{\theta})$ e le due probabilità a posteriori dei modi.`,
        answers: [
          risposta(md`$P_1 \mathcal{N}(x \mid m_1, \sigma_1^2)$`, n1, tol(n1, 0.01, 1e-5)),
          risposta(md`$P_2 \mathcal{N}(x \mid m_2, \sigma_2^2)$`, n2, tol(n2, 0.01, 1e-5)),
          risposta(md`$p(x \mid \boldsymbol{\theta})$`, den, tol(den, 0.01, 1e-5)),
          risposta(md`$P(1 \mid x, \boldsymbol{\theta})$`, w1, 0.005),
          risposta(md`$P(2 \mid x, \boldsymbol{\theta})$`, w2, 0.005),
        ],
        solution: md`**1. Le densità dei modi.** $\mathcal{N}(x \mid m, \sigma^2) = \frac{1}{\sqrt{2\pi}\,\sigma} \exp\left(-\frac{(x - m)^2}{2\sigma^2}\right)$:

$$\mathcal{N}(${f(x, 1)} \mid ${f(m1, 1)}, ${f(s1, 1)}^2) = \frac{1}{\sqrt{2\pi} \cdot ${f(s1, 1)}} \exp\left(-\frac{(${f(x, 1)} - ${f(m1, 1)})^2}{2 \cdot ${f(s1 * s1, 2)}}\right) = ${g(N1, 5)}$$

$$\mathcal{N}(${f(x, 1)} \mid ${f(m2, 1)}, ${f(s2, 1)}^2) = \frac{1}{\sqrt{2\pi} \cdot ${f(s2, 1)}} \exp\left(-\frac{(${f(x, 1)} - ${f(m2, 1)})^2}{2 \cdot ${f(s2 * s2, 2)}}\right) = ${g(N2, 5)}$$

**2. I numeratori** (prior per verosimiglianza del modo): $${f(P1, 2)} \cdot ${g(N1, 5)} = ${g(n1, 5)}$ e $${f(P2, 2)} \cdot ${g(N2, 5)} = ${g(n2, 5)}$.

**3. Il denominatore** è la mistura valutata nel campione, la somma dei numeratori:

$$p(x \mid \boldsymbol{\theta}) = \sum_{l=1}^{2} P_l \, \mathcal{N}(x \mid m_l, \sigma_l^2) = ${g(n1, 5)} + ${g(n2, 5)} = ${g(den, 5)}$$

**4. Le posterior** (teorema di Bayes):

$$P(1 \mid x, \boldsymbol{\theta}) = \frac{${g(n1, 5)}}{${g(den, 5)}} = ${f(w1, 4)}, \qquad P(2 \mid x, \boldsymbol{\theta}) = \frac{${g(n2, 5)}}{${g(den, 5)}} = ${f(w2, 4)}$$

Sommano a 1, come devono: il denominatore normalizza i numeratori. ${commento} È il rapporto che compare in tutte e tre le equazioni EM della mistura.`,
      }
    },
  },
  {
    id: 'es02',
    title: 'Una iterazione completa di EM a mano (1-D, due modi)',
    difficulty: 3,
    kind: 'numerico',
    concepts: ['c33', 'c34', 'c40', 'c48', 'c49', 'c50'],
    generate: (rng) => {
      const c1 = rng.int(2, 4)
      const c2 = c1 + rng.int(4, 5)
      const xs = seiCampioni(rng, c1, c2)
      const th0: Mistura = { P: [0.5, 0.5], m: [c1 + rng.pick([-1, -0.5, 0.5, 1]), c2 + rng.pick([-1, -0.5, 0.5, 1])], s2: [1, 1] }
      const W = eStep(xs, th0)
      const th1 = mStep(xs, W)
      const N1 = somma(W.map((w) => w[0]))
      const N2 = somma(W.map((w) => w[1]))
      const l0 = logVer(xs, th0)
      const l1 = logVer(xs, th1)
      const pesati = (i: number) => xs.map((x, j) => md`${f(W[j][i], 4)} \cdot ${f(x, 1)}`).join(' + ')
      return {
        prompt: md`La telecamera dell'impianto misura la luminosità di sei pesci senza etichetta di specie: $X = \{${elenco(xs, 1)}\}$. Modello: mistura 1-D di due gaussiane (salmone e spigola). Stima iniziale $\boldsymbol{\theta}^{[0]}$: $P = (0.5, 0.5)$, $m = (${f(th0.m[0], 1)}, ${f(th0.m[1], 1)})$, $\sigma^2 = (1, 1)$.

Esegui un E-step (tabella delle posterior) e un M-step (nuovi $P_i$, $m_i$, $\sigma_i^2$). Poi calcola la log-verosimiglianza $\ln l = \sum_j \ln p(x_j \mid \boldsymbol{\theta})$ prima e dopo l'iterazione.`,
        answers: [
          risposta(md`$P_1^{[1]}$`, th1.P[0], 0.005),
          risposta(md`$m_1^{[1]}$`, th1.m[0], 0.02),
          risposta(md`$m_2^{[1]}$`, th1.m[1], 0.02),
          risposta(md`$\sigma_1^{2\,[1]}$`, th1.s2[0], tol(th1.s2[0], 0.02, 0.01)),
          risposta(md`$\sigma_2^{2\,[1]}$`, th1.s2[1], tol(th1.s2[1], 0.02, 0.01)),
          risposta(md`$\ln l(\boldsymbol{\theta}^{[0]})$`, l0, 0.02),
          risposta(md`$\ln l(\boldsymbol{\theta}^{[1]})$`, l1, 0.02),
        ],
        solution: md`**1. E-step.** Per ogni campione calcolo i numeratori $P_i^{[0]}\,\mathcal{N}(x_j \mid m_i^{[0]}, \sigma_i^{2\,[0]})$, la loro somma $p(x_j \mid \boldsymbol{\theta}^{[0]})$ e le posterior:

${testataEStep}
${righeEStep(xs, th0)}

Ogni riga delle posterior somma a 1. I campioni vicini a $m_1^{[0]} = ${f(th0.m[0], 1)}$ vanno quasi tutti al modo 1, quelli vicini a $m_2^{[0]} = ${f(th0.m[1], 1)}$ al modo 2.

**2. M-step, prior.** Le somme delle colonne sono $N_1 = ${f(N1, 4)}$ e $N_2 = ${f(N2, 4)}$ (sommano a $N = 6$):

$$P_1^{[1]} = \frac{1}{N}\sum_{j=1}^{N} P(1 \mid x_j, \boldsymbol{\theta}^{[0]}) = \frac{${f(N1, 4)}}{6} = ${f(th1.P[0], 4)}, \qquad P_2^{[1]} = \frac{${f(N2, 4)}}{6} = ${f(th1.P[1], 4)}$$

**3. M-step, medie** (media dei campioni pesata dalle posterior):

$$m_1^{[1]} = \frac{${pesati(0)}}{${f(N1, 4)}} = ${f(th1.m[0], 4)}$$

$$m_2^{[1]} = \frac{${pesati(1)}}{${f(N2, 4)}} = ${f(th1.m[1], 4)}$$

**4. M-step, varianze** (scarti rispetto alle medie nuove):

$$\sigma_1^{2\,[1]} = \frac{\sum_j P(1 \mid x_j, \boldsymbol{\theta}^{[0]})\,(x_j - ${f(th1.m[0], 4)})^2}{${f(N1, 4)}} = ${f(th1.s2[0], 4)}, \qquad \sigma_2^{2\,[1]} = \frac{\sum_j P(2 \mid x_j, \boldsymbol{\theta}^{[0]})\,(x_j - ${f(th1.m[1], 4)})^2}{${f(N2, 4)}} = ${f(th1.s2[1], 4)}$$

**5. Log-verosimiglianza.** Con $\boldsymbol{\theta}^{[0]}$ la somma dei $\ln p(x_j \mid \boldsymbol{\theta}^{[0]})$ (i logaritmi della quinta colonna) vale $${f(l0, 4)}$; con $\boldsymbol{\theta}^{[1]}$ vale $${f(l1, 4)}$. È salita di $${f(l1 - l0, 4)}$, come garantisce la slide 74: $l(\boldsymbol{\theta}^{(i+1)}) \ge l(\boldsymbol{\theta}^{(i)})$.

Nell'M-step ho usato le stesse posterior per tutte e tre le equazioni; la sola grandezza già aggiornata che entra in un'altra equazione è la media nuova, negli scarti della varianza.`,
      }
    },
  },
  {
    id: 'es03',
    title: 'Aggiorna i prior da una tabella di posterior',
    difficulty: 1,
    kind: 'numerico',
    concepts: ['c10', 'c39', 'c48'],
    generate: (rng) => {
      const N = rng.int(5, 8)
      const M = rng.int(2, 3)
      const W: number[][] = Array.from({ length: N }, () => {
        const raw = Array.from({ length: M }, () => rng.int(1, 20))
        const tot = somma(raw)
        const riga = raw.slice(0, M - 1).map((v) => r(v / tot, 2))
        riga.push(r(1 - somma(riga), 2))
        return riga
      })
      const P = Array.from({ length: M }, (_, i) => somma(W.map((w) => w[i])) / N)
      const testata = `| $j$ | ${Array.from({ length: M }, (_, i) => md`$P(${i + 1} \mid \mathbf{x}_j, \boldsymbol{\theta}^{[k]})$`).join(' | ')} |\n|---|${'---|'.repeat(M)}`
      const righe = W.map((w, j) => `| ${j + 1} | ${w.map((v) => `$${f(v, 2)}$`).join(' | ')} |`).join('\n')
      const colonne = Array.from({ length: M }, (_, i) => md`$$P_${i + 1}^{[k+1]} = \frac{${W.map((w) => f(w[i], 2)).join(' + ')}}{${N}} = \frac{${f(somma(W.map((w) => w[i])), 2)}}{${N}} = ${f(P[i], 4)}$$`).join('\n\n')
      return {
        prompt: md`L'E-step di una mistura con $M = ${M}$ modi su $N = ${N}$ campioni ha prodotto questa tabella di posterior (ogni riga somma a 1):

${testata}
${righe}

Calcola i nuovi prior $P_i^{[k+1]}$ e la loro somma.`,
        answers: [...P.map((p, i) => risposta(md`$P_${i + 1}^{[k+1]}$`, p, 0.005)), risposta('somma dei nuovi prior', somma(P), 0.005)],
        solution: md`**Equazione EM dei prior.** $P_i^{[k+1]} = \frac{1}{N}\sum_{j=1}^{N} P(i \mid \mathbf{x}_j, \boldsymbol{\theta}^{[k]})$: il nuovo prior è la media della colonna $i$, cioè la frazione «morbida» di campioni attribuiti al modo $i$.

${colonne}

**Somma.** $${P.map((p) => f(p, 4)).join(' + ')} = ${f(somma(P), 4)}$. Non è un caso: sommando sui modi,

$$\sum_{i=1}^{M} P_i^{[k+1]} = \frac{1}{N}\sum_{j=1}^{N}\underbrace{\sum_{i=1}^{M} P(i \mid \mathbf{x}_j, \boldsymbol{\theta}^{[k]})}_{=1} = \frac{N}{N} = 1$$

I prior sono parametri come le medie: non si fissano a mano a $1/M$, si stimano nell'M-step e rispettano da soli il vincolo $\sum_i P_i = 1$, $P_i \ge 0$.`,
      }
    },
  },
  {
    id: 'es04',
    title: 'EM con una feature mancante: i quattro punti della slide',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c54', 'c56', 'c57'],
    generate: (rng) => {
      const variante = rng.int(0, 2)
      let x1 = [0, 1, 2]
      let x2 = [2, 0, 2]
      let c = 4
      if (variante >= 1) c = rng.int(3, 6)
      if (variante === 2) {
        do {
          x1 = [rng.int(0, 4), rng.int(0, 4), rng.int(0, 4)]
        } while (x1[0] === x1[1] && x1[1] === x1[2])
        x2 = [rng.int(0, 3), rng.int(0, 3), rng.int(0, 3)]
      }
      const x2tutti = [...x2, c]
      const { passi, muLim, s12Lim } = quattroPunti(x1, x2tutti, 3)
      const t1 = passi[1]
      const nuovo = t1.mu1
      const scarti = x1.map((v) => (v - nuovo) ** 2)
      const extra = 1 + (0 - nuovo) ** 2
      const punti = x1.map((v, j) => `(${v}, ${x2[j]})`).join(',\\ ')
      const righe = passi.map((p, k) => md`| ${k} | $${f(p.mu1, 4)}$ | $${f(p.mu2, 4)}$ | $${f(p.s12, 4)}$ | $${f(p.s22, 4)}$ |`).join('\n')
      const slide = variante === 0 ? " Sono i dati della slide 77: i punti letti dal grafico e la retta rossa $x_2 = 4$." : ''
      return {
        prompt: md`Quattro punti in 2-D: $${punti}$ e $(*, ${c})$, dove l'asterisco indica il valore di $x_1$ mancante nel quarto punto.${slide} Modello: una gaussiana 2-D a covarianza diagonale, $\boldsymbol{\theta} = (\mu_1, \mu_2, \sigma_1^2, \sigma_2^2)$, con stima iniziale $\boldsymbol{\theta}^0 = (0, 0, 1, 1)$.

Calcola $\boldsymbol{\theta}^1$ con un'iterazione di EM e il limite a cui convergono $\mu_1$ e $\sigma_1^2$.`,
        answers: [
          risposta(md`$\mu_1^1$`, t1.mu1, 0.01),
          risposta(md`$\mu_2^1$`, t1.mu2, 0.01),
          risposta(md`$\sigma_1^{2,1}$`, t1.s12, tol(t1.s12, 0.01, 0.005)),
          risposta(md`$\sigma_2^{2,1}$`, t1.s22, tol(t1.s22, 0.01, 0.005)),
          risposta(md`$\mu_1$ al limite`, muLim, 0.01),
          risposta(md`$\sigma_1^2$ al limite`, s12Lim, tol(s12Lim, 0.01, 0.005)),
        ],
        solution: md`**1. E-step.** I tre punti completi entrano in $Q$ con il loro $\ln p(\mathbf{x}_k \mid \boldsymbol{\theta})$; per il quarto integro sul valore mancante $x_{41}$, pesato con la sua densità dati $x_{42} = ${c}$ e $\boldsymbol{\theta}^0$:

$$Q(\boldsymbol{\theta}; \boldsymbol{\theta}^{0}) = \sum_{k=1}^{3} \ln p(\mathbf{x}_k \mid \boldsymbol{\theta}) + \int_{-\infty}^{+\infty} \ln p\big((x_{41}, ${c})^{t} \mid \boldsymbol{\theta}\big)\, p(x_{41} \mid \boldsymbol{\theta}^{0}; x_{42} = ${c})\, dx_{41}$$

Con covarianza diagonale $x_1$ e $x_2$ sono indipendenti: sapere $x_{42}$ non dice nulla su $x_{41}$, che segue la marginale corrente $\mathcal{N}(\mu_1^0, \sigma_1^{2,0}) = \mathcal{N}(0, 1)$. Servono solo due momenti: $E[x_{41}] = \mu_1^0 = 0$ e $E[(x_{41} - \mu_1)^2] = \sigma_1^{2,0} + (\mu_1^0 - \mu_1)^2 = 1 + \mu_1^2$.

**2. M-step.** Massimizzare $Q$ dà le stime ML con il valore mancante sostituito dai suoi momenti:

$$\mu_1^1 = \frac{${x1.join(' + ')} + 0}{4} = ${f(t1.mu1, 4)}, \qquad \mu_2^1 = \frac{${x2tutti.join(' + ')}}{4} = ${f(t1.mu2, 4)}$$

$$\sigma_1^{2,1} = \frac{${scarti.map((v) => f(v, 4)).join(' + ')} + (1 + ${f(nuovo ** 2, 4)})}{4} = \frac{${f(somma(scarti) + extra, 4)}}{4} = ${f(t1.s12, 4)}$$

$$\sigma_2^{2,1} = \frac{${x2tutti.map((v) => f((v - t1.mu2) ** 2, 4)).join(' + ')}}{4} = ${f(t1.s22, 4)}$$

Nel numeratore di $\sigma_1^{2,1}$ l'ultimo termine è il contributo atteso del punto incompleto: $\sigma_1^{2,0} + (\mu_1^0 - \mu_1^1)^2 = 1 + ${f(nuovo, 4)}^2$.

**3. Le iterazioni successive.** $\mu_1^{k+1} = \frac{${somma(x1)} + \mu_1^{k}}{4}$ e $\sigma_1^{2,k+1} = \frac{1}{4}\left[\sum_{j=1}^{3}(x_{j1} - \mu_1^{k+1})^2 + \sigma_1^{2,k} + (\mu_1^k - \mu_1^{k+1})^2\right]$:

| $k$ | $\mu_1$ | $\mu_2$ | $\sigma_1^2$ | $\sigma_2^2$ |
|---|---|---|---|---|
${righe}

**4. Il limite.** Il punto fisso di $\mu_1 = (${somma(x1)} + \mu_1)/4$ è $\mu_1 = ${somma(x1)}/3 = ${f(muLim, 4)}$; per la varianza $4\sigma_1^2 = \sum_{j=1}^{3}(x_{j1} - \mu_1)^2 + \sigma_1^2$, quindi $\sigma_1^2 = ${f(somma(x1.map((v) => (v - muLim) ** 2)), 4)}/3 = ${f(s12Lim, 4)}$.

$\mu_2$ e $\sigma_2^2$ non cambiano più dopo la prima iterazione, perché $x_2$ è osservato in tutti i punti. Il limite di $x_1$ coincide con la stima ML sui tre valori noti: con covarianza diagonale il quarto punto non porta informazione su $x_1$. Scartando il punto incompleto, invece, $\mu_2$ e $\sigma_2^2$ sarebbero calcolati su tre soli valori ($\mu_2 = ${f(somma(x2) / 3, 3)}$) e l'informazione $x_2 = ${c}$ andrebbe persa.${variante === 0 ? ' Le ellissi 0, 1, 2, 3 della figura della slide sono i contorni a una deviazione standard di queste stime successive.' : ''}`,
      }
    },
  },
  {
    id: 'es05',
    title: 'Quanti parametri ha una mistura di gaussiane?',
    difficulty: 1,
    kind: 'numerico',
    concepts: ['c10', 'c11'],
    generate: (rng) => {
      const M = rng.int(2, 6)
      const n = rng.int(1, 10)
      const p = parametriMistura(M, n)
      return {
        prompt: md`Una mistura di $M = ${M}$ gaussiane in uno spazio delle feature a $n = ${n}$ dimensioni ha il vettore dei parametri $\boldsymbol{\theta} = [P_1, \ldots, P_M; \mathbf{m}_1, \ldots, \mathbf{m}_M; \Sigma_1, \ldots, \Sigma_M]$. Quanti parametri liberi contiene in tutto? Quanti di questi stanno nelle matrici di covarianza?`,
        answers: [risposta('parametri liberi in tutto', p.totale, 0.5), risposta('parametri delle covarianze', p.covarianze, 0.5)],
        solution: md`**Prior.** Sono $M = ${M}$, ma il vincolo $\sum_i P_i = 1$ ne lascia liberi $M - 1 = ${p.prior}$.

**Medie.** Ogni $\mathbf{m}_i$ ha $n$ componenti: $M \cdot n = ${M} \cdot ${n} = ${p.medie}$.

**Covarianze.** Ogni $\Sigma_i$ è $n \times n$ ma simmetrica: gli elementi distinti sono $n(n+1)/2 = ${(n * (n + 1)) / 2}$ (la diagonale più il triangolo superiore). In tutto $M \cdot n(n+1)/2 = ${p.covarianze}$.

$$(M - 1) + Mn + M\frac{n(n+1)}{2} = ${p.prior} + ${p.medie} + ${p.covarianze} = ${p.totale}$$

Le covarianze crescono con il quadrato della dimensione e dominano il conto appena $n$ supera poche unità: servono molti campioni per stimarle, ed è il problema dei pochi campioni in spazi a molte feature. ${n > 1 ? md`Con covarianze diagonali i parametri delle covarianze scenderebbero a $Mn = ${M * n}$.` : md`Qui $n = 1$: in una dimensione covarianza piena e diagonale coincidono, perché ogni $\Sigma_i$ è una sola varianza, e i parametri delle covarianze restano $M = ${M}$.`}`,
      }
    },
  },
  {
    id: 'es06',
    title: 'Perché la mistura è un problema con dati incompleti?',
    difficulty: 1,
    kind: 'concettuale',
    concepts: ['c13', 'c14', 'c15', 'c16', 'c22', 'c23', 'c24'],
    generate: (rng) => {
      const N = rng.int(4, 8)
      const M = rng.int(2, 3)
      const N1 = rng.int(1, N - 1)
      const conf = M ** N
      return {
        prompt: md`Hai la luminosità di $N = ${N}$ pesci pescati in un lago dove vivono $M = ${M}$ specie, e vuoi stimare la distribuzione gaussiana di ciascuna specie a partire da $p(x) = \sum_{i=1}^{M} P_i\,p(x \mid m_i, \sigma_i^2)$.

(a) Quante sono le possibili configurazioni di $\mathbf{Y}$, cioè i modi di attribuire ogni pesce a una specie? (b) Se $\mathbf{Y}$ fosse noto e ${N1} pesci su ${N} fossero della specie 1, quanto varrebbe la stima ML di $P_1$?

Poi, a voce: spiega i tre motivi per cui questo è un problema con dati incompleti, dì che cosa sono $\mathbf{X}$, $\mathbf{Y}$ e $\mathbf{Z}$, e che cosa cambierebbe con $\mathbf{Y}$ noto.`,
        answers: [risposta('(a) configurazioni di Y', conf, 0.5), risposta(md`(b) $\hat{P}_1$`, N1 / N, 0.005)],
        solution: md`**(a)** Ogni pesce può venire da una qualunque delle $M$ specie, indipendentemente dagli altri: $M^N = ${M}^{${N}} = ${conf}$ configurazioni. Già con pochi campioni sono troppe da enumerare; per questo EM lavora con le posterior di ogni campione.

**(b)** Con le etichette note la stima ML del prior è la frequenza relativa: $\hat{P}_1 = N_1/N = ${N1}/${N} = ${f(N1 / N, 4)}$.

**I tre motivi della slide.**
1. Ho solo le osservazioni dell'intera $p(x)$, non quelle delle singole specie: i pesci arrivano mescolati.
2. Non so a quale modo appartiene ogni campione, quindi non so quali campioni usare per stimare ciascun modo.
3. So solo che fra i modi nascosti c'è una relazione di tipo somma. È poca informazione, ma è quella che rende il problema parametrico.

**X, Y, Z.** $\mathbf{X}$ sono le luminosità osservate, il dataset incompleto. $\mathbf{Y}$ sono i dati mancanti: per ogni pesce un vettore binario lungo $M$ con un solo 1 nella posizione della specie. $\mathbf{Z} = (\mathbf{X}, \mathbf{Y})$ è il dataset completo: non lo ho, ma EM ragiona su di esso.

**Con Y noto.** La log-verosimiglianza completa si separa per modo, $\sum_j \sum_i y_{ji}[\ln P_i + \ln p(x_j \mid m_i, \sigma_i^2)]$, e la ML si risolve in forma chiusa specie per specie: frequenza relativa, media e varianza campionarie. Con $\mathbf{Y}$ ignoto la verosimiglianza dei dati osservati contiene il logaritmo di una somma e non si separa; EM sostituisce ogni $y_{ji}$ con la sua posterior.`,
      }
    },
  },
  {
    id: 'es07',
    title: 'E-step e M-step: chi sta fermo e chi si muove',
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c29', 'c30', 'c31', 'c32', 'c33', 'c34', 'c35'],
    generate: (rng) => {
      const m1 = rng.int(2, 4)
      const m2 = m1 + rng.int(3, 4)
      const x = r(m1 + rng.pick([0.5, 1, 1.5]), 1)
      const thk: Mistura = { P: [0.5, 0.5], m: [m1, m2], s2: [1, 1] }
      const w = posterior(x, thk)
      const tha: Mistura = thk
      const thb: Mistura = { P: [0.6, 0.4], m: [r(m1 + 0.5 * (x - m1), 2), m2], s2: [1, 1] }
      const q = (th: Mistura) => somma(th.P.map((p, i) => w[i] * (Math.log(p) + lnGauss(x, th.m[i], th.s2[i]))))
      const qa = q(tha)
      const qb = q(thb)
      const termine = (th: Mistura, i: number) => md`\left[\ln ${f(th.P[i], 2)} + \ln \mathcal{N}(${f(x, 1)} \mid ${f(th.m[i], 2)}, 1)\right]`
      return {
        prompt: md`Mistura 1-D di due gaussiane, stima corrente $\boldsymbol{\theta}^{(k)}$: $P = (0.5, 0.5)$, $m = (${m1}, ${m2})$, $\sigma^2 = (1, 1)$. Considera un solo campione, $x = ${f(x, 1)}$, e il suo contributo a $Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$:

$$q(\boldsymbol{\theta}) = \sum_{i=1}^{2} P(i \mid x, \boldsymbol{\theta}^{(k)}) \left[\ln P_i + \ln \mathcal{N}(x \mid m_i, \sigma_i^2)\right]$$

(a) Calcola il peso $P(1 \mid x, \boldsymbol{\theta}^{(k)})$. (b) Calcola $q$ per $\boldsymbol{\theta}_a = \boldsymbol{\theta}^{(k)}$ e (c) per il candidato $\boldsymbol{\theta}_b$ con $P = (0.6, 0.4)$, $m = (${f(thb.m[0], 2)}, ${m2})$, $\sigma^2 = (1, 1)$.

Poi, a voce: per ciascun passo di EM dì quale quantità si calcola, che cosa resta fisso, quale formula lo definisce e che ruolo hanno i due argomenti di $Q$. Perché dopo l'integrazione su $\mathbf{y}$ la funzione $Q$ non dipende più dalle latenti?`,
        answers: [risposta(md`(a) $P(1 \mid x, \boldsymbol{\theta}^{(k)})$`, w[0], 0.005), risposta(md`(b) $q(\boldsymbol{\theta}_a)$`, qa, 0.01), risposta(md`(c) $q(\boldsymbol{\theta}_b)$`, qb, 0.01)],
        solution: md`**(a) E-step.** Con i parametri fermi a $\boldsymbol{\theta}^{(k)}$ calcolo la distribuzione della latente: $P(1 \mid x, \boldsymbol{\theta}^{(k)}) = \frac{0.5\,\mathcal{N}(${f(x, 1)} \mid ${m1}, 1)}{0.5\,\mathcal{N}(${f(x, 1)} \mid ${m1}, 1) + 0.5\,\mathcal{N}(${f(x, 1)} \mid ${m2}, 1)} = ${f(w[0], 4)}$, e $P(2 \mid x, \boldsymbol{\theta}^{(k)}) = ${f(w[1], 4)}$.

**(b)** $q(\boldsymbol{\theta}_a) = ${f(w[0], 4)}\,${termine(tha, 0)} + ${f(w[1], 4)}\,${termine(tha, 1)} = ${f(qa, 4)}$.

**(c)** $q(\boldsymbol{\theta}_b) = ${f(w[0], 4)}\,${termine(thb, 0)} + ${f(w[1], 4)}\,${termine(thb, 1)} = ${f(qb, 4)}$.

I pesi $${f(w[0], 4)}$ e $${f(w[1], 4)}$ sono gli stessi in (b) e in (c): dipendono solo da $\boldsymbol{\theta}^{(k)}$. Cambiando il candidato cambiano solo i logaritmi. ${qb > qa ? md`Il candidato $\boldsymbol{\theta}_b$ dà un contributo più alto: sposta la media del modo 1 verso il campione e ne alza il prior, che è ciò che l'M-step farebbe su tutto il dataset.` : md`Qui il candidato $\boldsymbol{\theta}_b$ dà un contributo più basso: l'M-step sceglie il $\boldsymbol{\theta}$ che massimizza la somma dei contributi di tutti i campioni, non di uno solo.`}

**I due passi.**
- E-step: calcola $Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = E\{\log p(\mathbf{X}, \mathbf{Y} \mid \boldsymbol{\theta}) \mid \mathbf{X}, \boldsymbol{\theta}^{(k)}\}$. Fissi: i parametri $\boldsymbol{\theta}^{(k)}$. Calcolati: i pesi $p(\mathbf{y} \mid \mathbf{X}, \boldsymbol{\theta}^{(k)})$, nella mistura le posterior.
- M-step: $\boldsymbol{\theta}^{(k+1)} = \arg\max Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$. Fissi: i pesi. Si muove: $\boldsymbol{\theta}$ dentro i logaritmi.
- I parametri trovati dall'M-step fanno partire un nuovo E-step, e il processo si ripete.

**I due argomenti di Q.** $\boldsymbol{\theta}^{(k)}$ fissa la legge con cui medio sui dati mancanti; $\boldsymbol{\theta}$ è la variabile libera. Nella forma integrale

$$Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = \int \log p(\mathbf{X}, \mathbf{y} \mid \boldsymbol{\theta})\, p(\mathbf{y} \mid \mathbf{X}, \boldsymbol{\theta}^{(k)})\, d\mathbf{y}$$

il peso contiene solo la stima vecchia, il logaritmo solo l'incognita. Integrando su tutti i valori di $\mathbf{y}$ ottengo un numero per ogni $\boldsymbol{\theta}$: le latenti spariscono e con loro l'incertezza, come dicono le note.`,
      }
    },
  },
  {
    id: 'es08',
    title: 'Verosimiglianza dei dati completi e dei dati incompleti',
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c25', 'c26', 'c27'],
    generate: (rng) => {
      const m1 = rng.int(2, 4)
      const m2 = m1 + rng.int(3, 5)
      const th: Mistura = { P: [rng.pick([0.4, 0.5, 0.6]), 0], m: [m1, m2], s2: [1, rng.pick([1, 2])] }
      th.P[1] = r(1 - th.P[0], 2)
      const xs = [r(m1 + rng.pick([-0.5, 0, 0.5]), 1), r(m1 + rng.pick([1, 1.5]), 1), r(m2 + rng.pick([-0.5, 0, 0.5]), 1)]
      const y = [1, rng.pick([1, 2]), 2]
      const termComp = xs.map((x, j) => Math.log(th.P[y[j] - 1]) + lnGauss(x, th.m[y[j] - 1], th.s2[y[j] - 1]))
      const termInc = xs.map((x) => Math.log(somma(numeratori(x, th))))
      const lZ = somma(termComp)
      const lX = somma(termInc)
      const righe = xs
        .map((x, j) => md`| ${j + 1} | $${f(x, 1)}$ | ${y[j]} | $${f(termComp[j], 4)}$ | $${f(termInc[j], 4)}$ |`)
        .join('\n')
      return {
        prompt: md`Mistura 1-D con $\boldsymbol{\theta}$: $P = (${f(th.P[0], 2)}, ${f(th.P[1], 2)})$, $m = (${m1}, ${m2})$, $\sigma^2 = (${th.s2[0]}, ${th.s2[1]})$. Tre campioni $x = (${elenco(xs, 1)})$ e, supponendo di conoscerle, le etichette di modo $y = (${y.join(', ')})$.

(a) Calcola $\ln l(\boldsymbol{\theta} \mid \mathbf{Z})$, la log-verosimiglianza dei dati completi. (b) Calcola $\ln l(\boldsymbol{\theta} \mid \mathbf{X})$, quella dei soli dati osservati.

Poi, a voce: scrivi $p(\mathbf{Z} \mid \boldsymbol{\theta})$ e le due verosimiglianze, e spiega perché la prima è «more informative» e facile da massimizzare, mentre la seconda è l'unica calcolabile ma «more challenging to maximize».`,
        answers: [risposta(md`(a) $\ln l(\boldsymbol{\theta} \mid \mathbf{Z})$`, lZ, 0.01), risposta(md`(b) $\ln l(\boldsymbol{\theta} \mid \mathbf{X})$`, lX, 0.01)],
        solution: md`**Le formule della slide 71.**

$$p(\mathbf{Z} \mid \boldsymbol{\theta}) = p(\mathbf{X}, \mathbf{Y} \mid \boldsymbol{\theta}) = p(\mathbf{Y} \mid \mathbf{X}, \boldsymbol{\theta}) \cdot p(\mathbf{X} \mid \boldsymbol{\theta}), \qquad l(\boldsymbol{\theta} \mid \mathbf{Z}) = p(\mathbf{X}, \mathbf{Y} \mid \boldsymbol{\theta}), \qquad l(\boldsymbol{\theta} \mid \mathbf{X}) = p(\mathbf{X} \mid \boldsymbol{\theta})$$

**(a) Dati completi.** Con l'etichetta nota ogni campione contribuisce con il solo modo che lo ha generato: $\ln[P_{y_j}\,\mathcal{N}(x_j \mid m_{y_j}, \sigma_{y_j}^2)]$.

**(b) Dati incompleti.** Senza etichetta sommo sui modi (marginalizzo $\mathbf{Y}$): $\ln \sum_{i} P_i\,\mathcal{N}(x_j \mid m_i, \sigma_i^2)$.

| $j$ | $x_j$ | $y_j$ | termine completo | termine incompleto |
|---|---|---|---|---|
${righe}

$\ln l(\boldsymbol{\theta} \mid \mathbf{Z}) = ${f(lZ, 4)}$ e $\ln l(\boldsymbol{\theta} \mid \mathbf{X}) = ${f(lX, 4)}$. Ogni termine incompleto è almeno uguale a quello completo, perché la somma sui modi contiene il termine del modo vero più altri termini positivi.

**Perché la completa è facile.** Il suo logaritmo è $\sum_j \sum_i y_{ji}[\ln P_i + \ln p(x_j \mid m_i, \sigma_i^2)]$: niente logaritmi di somme, ogni modo ha i suoi campioni e la ML si risolve in forma chiusa (frequenza relativa, media e varianza di ogni gruppo). Contiene $\mathbf{X}$ e $\mathbf{Y}$, quindi è più informativa: «If we knew the values of Y, we could solve the ML estimation problem directly».

**Perché l'incompleta è difficile.** È l'unica che posso calcolare, perché $\mathbf{Y}$ non è osservato, ma $\ln p(\mathbf{X} \mid \boldsymbol{\theta}) = \sum_j \ln \sum_i P_i\,p(x_j \mid m_i, \sigma_i^2)$ ha il logaritmo di una somma: le derivate accoppiano tutti i parametri e non c'è soluzione in forma chiusa. EM massimizza questa, lavorando in media su quella completa.`,
      }
    },
  },
  {
    id: 'es09',
    title: "Ricava l'aggiornamento dei prior con il moltiplicatore di Lagrange",
    difficulty: 2,
    kind: 'dimostrazione',
    concepts: ['c10', 'c46', 'c48'],
    generate: (rng) => {
      const N = rng.int(10, 40)
      const M = rng.int(2, 4)
      const raw = Array.from({ length: M }, () => rng.int(1, 10))
      const tot = somma(raw)
      const S = raw.slice(0, M - 1).map((v) => r((N * v) / tot, 2))
      S.push(r(N - somma(S), 2))
      const P = S.map((s) => s / N)
      return {
        prompt: md`Parti da $Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{[k]}) = \sum_{j=1}^{N}\sum_{i=1}^{M} P(i \mid \mathbf{x}_j, \boldsymbol{\theta}^{[k]})\left[\ln P_i + \ln p(\mathbf{x}_j \mid \mathbf{m}_i, \Sigma_i)\right]$ e massimizzala rispetto ai $P_i$ con il vincolo $\sum_i P_i = 1$. Indica dove usi il fatto che le posterior sommano a 1 sui modi.

Verifica con i numeri: con $N = ${N}$ campioni e $M = ${M}$ modi, le somme delle posterior per modo sono $\sum_j P(i \mid \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) = (${S.map((s) => f(s, 2)).join(', ')})$. Quanto valgono il moltiplicatore $\lambda$ e $P_1^{[k+1]}$?`,
        answers: [risposta(md`$\lambda$`, N, 0.01), risposta(md`$P_1^{[k+1]}$`, P[0], 0.001)],
        solution: md`**1. Che cosa dipende dai prior.** Le posterior sono numeri fissi (calcolati con $\boldsymbol{\theta}^{[k]}$) e i prior compaiono solo in $\ln P_i$. Il resto di $Q$ non dipende dai $P_i$.

**2. La lagrangiana.** Aggiungo il vincolo con un moltiplicatore:

$$\mathcal{L} = \sum_{j=1}^{N}\sum_{i=1}^{M} P(i \mid \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) \ln P_i + \lambda\left(1 - \sum_{l=1}^{M} P_l\right)$$

**3. Derivata nulla.**

$$\frac{\partial \mathcal{L}}{\partial P_i} = \frac{1}{P_i}\sum_{j=1}^{N} P(i \mid \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) - \lambda = 0 \quad \Rightarrow \quad P_i = \frac{1}{\lambda}\sum_{j=1}^{N} P(i \mid \mathbf{x}_j, \boldsymbol{\theta}^{[k]})$$

**4. Il valore di λ.** Sommo su $i$ e impongo il vincolo:

$$1 = \sum_{i=1}^{M} P_i = \frac{1}{\lambda}\sum_{j=1}^{N}\underbrace{\sum_{i=1}^{M} P(i \mid \mathbf{x}_j, \boldsymbol{\theta}^{[k]})}_{=1} = \frac{N}{\lambda} \quad \Rightarrow \quad \lambda = N$$

Qui uso che le posterior di ogni campione sommano a 1 sui modi: la somma doppia vale $N$.

**5. Il risultato.**

$$P_i^{[k+1]} = \frac{1}{N}\sum_{j=1}^{N} P(i \mid \mathbf{x}_j, \boldsymbol{\theta}^{[k]})$$

È la prima equazione della slide 76 (dove il $P_j^{[k]}$ al numeratore è un refuso per $P_i^{[k]}$). La soluzione è un massimo: $\sum_j P(i \mid \mathbf{x}_j)\ln P_i$ è concava in $P_i$ e il vincolo è lineare. Il vincolo $P_i \ge 0$ è rispettato da solo, perché le posterior sono positive.

**Numeri.** Le somme $${S.map((s) => f(s, 2)).join(' + ')} = ${f(somma(S), 2)} = N$, quindi $\lambda = ${N}$ e $P_1^{[k+1]} = ${f(S[0], 2)}/${N} = ${f(P[0], 4)}$. Tutti i nuovi prior: ${P.map((p, i) => md`$P_${i + 1}^{[k+1]} = ${f(p, 4)}$`).join(', ')}.`,
      }
    },
  },
  {
    id: 'es10',
    title: 'Ricava gli aggiornamenti di media e covarianza',
    difficulty: 3,
    kind: 'dimostrazione',
    concepts: ['c49', 'c50', 'c51', 'c52'],
    generate: (rng) => {
      const c1 = rng.int(2, 4)
      const c2 = c1 + rng.int(3, 4)
      const off = rng.shuffle([-1, -0.5, 0, 0.5, 1])
      const xs = [c1 + off[0], c1 + off[1], c1 + off[2], c2 + off[3], c2 + off[4]].sort((a, b) => a - b)
      const th: Mistura = { P: [0.5, 0.5], m: [c1 + rng.pick([-0.5, 0.5]), c2 + rng.pick([-0.5, 0.5])], s2: [rng.pick([1, 1.5]), 1] }
      const W = eStep(xs, th)
      const w = W.map((row) => row[0])
      const N1 = somma(w)
      const mNuova = somma(xs.map((x, j) => w[j] * x)) / N1
      const s2Giusta = somma(xs.map((x, j) => w[j] * (x - mNuova) ** 2)) / N1
      // trascrizione letterale della slide: gaussiana del peso con la media nuova
      const den = xs.map((x) => somma(numeratori(x, th)))
      const wLett = xs.map((x, j) => (th.P[0] * gauss(x, mNuova, th.s2[0])) / den[j])
      const s2Lett = somma(xs.map((x, j) => wLett[j] * (x - mNuova) ** 2)) / somma(wLett)
      // somma sui modi dei pesi letterali per il primo campione (serve anche la media nuova del modo 2)
      const w2 = W.map((row) => row[1])
      const mNuova2 = somma(xs.map((x, j) => w2[j] * x)) / somma(w2)
      const somma1Lett = wLett[0] + (th.P[1] * gauss(xs[0], mNuova2, th.s2[1])) / den[0]
      const righe = xs
        .map((x, j) => md`| ${j + 1} | $${f(x, 1)}$ | $${f(w[j], 4)}$ | $${f(wLett[j], 4)}$ |`)
        .join('\n')
      return {
        prompt: md`Dalla funzione $Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{[k]}) = \sum_{j}\sum_{i} P(i \mid \mathbf{x}_j, \boldsymbol{\theta}^{[k]})\left[\ln P_i + \ln p(\mathbf{x}_j \mid \mathbf{m}_i, \Sigma_i)\right]$ ricava gli aggiornamenti di $\mathbf{m}_i$ e di $\Sigma_i$ annullando le derivate rispetto a $\mathbf{m}_i$ e a $\Sigma_i^{-1}$. Spiega perché nella covarianza compare $\mathbf{m}_i^{[k+1]}$ e commenta la slide 76, che scrive $\mathbf{m}_i^{[k+1]}$ anche dentro la gaussiana del peso.

Verifica in 1-D: campioni $X = \{${elenco(xs, 1)}\}$, stima corrente $P = (0.5, 0.5)$, $m = (${f(th.m[0], 1)}, ${f(th.m[1], 1)})$, $\sigma^2 = (${th.s2[0]}, ${th.s2[1]})$. Calcola $m_1^{[k+1]}$, $\sigma_1^{2\,[k+1]}$ con i pesi corretti e $\sigma_1^{2\,[k+1]}$ con la trascrizione letterale della slide.`,
        answers: [
          risposta(md`$m_1^{[k+1]}$`, mNuova, 0.01),
          risposta(md`$\sigma_1^{2\,[k+1]}$ (pesi corretti)`, s2Giusta, tol(s2Giusta, 0.02, 0.005)),
          risposta(md`$\sigma_1^{2\,[k+1]}$ (slide letterale)`, s2Lett, tol(s2Lett, 0.02, 0.005)),
        ],
        solution: md`**1. Il pezzo di Q che conta.** Scrivo $w_{ij} = P(i \mid \mathbf{x}_j, \boldsymbol{\theta}^{[k]})$ (numeri fissi) e il log della gaussiana:

$$\ln p(\mathbf{x}_j \mid \mathbf{m}_i, \Sigma_i) = -\frac{n}{2}\ln(2\pi) - \frac{1}{2}\ln|\Sigma_i| - \frac{1}{2}(\mathbf{x}_j - \mathbf{m}_i)^{t}\Sigma_i^{-1}(\mathbf{x}_j - \mathbf{m}_i)$$

Solo i termini del modo $i$ dipendono da $\mathbf{m}_i$ e $\Sigma_i$.

**2. Media.** Con $\frac{\partial}{\partial \mathbf{m}}\,(\mathbf{x} - \mathbf{m})^{t}\Sigma^{-1}(\mathbf{x} - \mathbf{m}) = -2\Sigma^{-1}(\mathbf{x} - \mathbf{m})$:

$$\frac{\partial Q}{\partial \mathbf{m}_i} = \sum_{j=1}^{N} w_{ij}\,\Sigma_i^{-1}(\mathbf{x}_j - \mathbf{m}_i) = \mathbf{0} \quad \Rightarrow \quad \mathbf{m}_i^{[k+1]} = \frac{\sum_{j} w_{ij}\,\mathbf{x}_j}{\sum_{j} w_{ij}}$$

$\Sigma_i^{-1}$ è invertibile e si semplifica: resta la media pesata.

**3. Covarianza.** Derivo rispetto a $\Sigma_i^{-1}$, con $\frac{\partial}{\partial A}\ln|A| = A^{-1}$ (per $A$ simmetrica) e $\frac{\partial}{\partial A}\,\mathbf{v}^{t}A\mathbf{v} = \mathbf{v}\mathbf{v}^{t}$, usando $-\ln|\Sigma_i| = \ln|\Sigma_i^{-1}|$:

$$\frac{\partial Q}{\partial \Sigma_i^{-1}} = \frac{1}{2}\sum_{j=1}^{N} w_{ij}\left[\Sigma_i - (\mathbf{x}_j - \mathbf{m}_i)(\mathbf{x}_j - \mathbf{m}_i)^{t}\right] = \mathbf{0} \quad \Rightarrow \quad \Sigma_i^{[k+1]} = \frac{\sum_{j} w_{ij}\,(\mathbf{x}_j - \mathbf{m}_i^{[k+1]})(\mathbf{x}_j - \mathbf{m}_i^{[k+1]})^{t}}{\sum_{j} w_{ij}}$$

**4. Perché $\mathbf{m}_i^{[k+1]}$ nella covarianza.** Le due equazioni vanno risolte insieme: il massimo di $Q$ rispetto a $(\mathbf{m}_i, \Sigma_i)$ ha la covarianza calcolata nella media ottima, cioè quella nuova. Per questo aggiorno le medie prima delle covarianze.

**5. La slide letterale.** La slide 76 scrive dentro il peso $P_i^{[k]}\,p(\mathbf{x}_j \mid \mathbf{m}_i^{[k+1]}, \Sigma_i^{[k]})/p(\mathbf{x}_j \mid \boldsymbol{\theta}^{[k]})$. Con la media nuova al numeratore e il denominatore vecchio questi pesi non sono più posterior: non sommano a 1 sui modi. Il peso corretto è la stessa posterior dell'E-step, con $\mathbf{m}_i^{[k]}$. È un refuso.

**6. Numeri.**

| $j$ | $x_j$ | peso corretto $w_{1j}$ | peso letterale |
|---|---|---|---|
${righe}

$\sum_j w_{1j} = ${f(N1, 4)}$ e $m_1^{[k+1]} = \frac{\sum_j w_{1j} x_j}{${f(N1, 4)}} = ${f(mNuova, 4)}$.

Con i pesi corretti $\sigma_1^{2\,[k+1]} = \frac{\sum_j w_{1j}(x_j - ${f(mNuova, 4)})^2}{${f(N1, 4)}} = ${f(s2Giusta, 4)}$; con i pesi letterali $\frac{${f(somma(wLett.map((v, j) => v * (xs[j] - mNuova) ** 2)), 4)}}{${f(somma(wLett), 4)}} = ${f(s2Lett, 4)}$. Per il primo campione i due pesi letterali (modo 1 e modo 2, ciascuno con la propria media nuova) sommano a $${f(somma1Lett, 4)}$ invece che a 1. I pesi letterali possono anche superare 1. La differenza fra le due varianze nasce dallo spostamento della media, qui $\vert m_1^{[k+1]} - m_1^{[k]} \vert = ${f(Math.abs(mNuova - th.m[0]), 3)}$: ${Math.abs(s2Giusta - s2Lett) > 0.05 * s2Giusta ? 'lontano dalla convergenza le due forme danno numeri diversi' : 'lo spostamento è piccolo e le due forme danno numeri vicini'}. Vicino alla convergenza, con $m_1^{[k+1]} \approx m_1^{[k]}$, coincidono quasi.`,
      }
    },
  },
  {
    id: 'es11',
    title: 'Dimostra che EM non fa scendere la log-verosimiglianza',
    difficulty: 3,
    kind: 'dimostrazione',
    concepts: ['c40', 'c42', 'c43'],
    generate: (rng) => {
      const c1 = rng.int(1, 3)
      const c2 = c1 + rng.int(3, 5)
      const xs = [c1 - 0.5, c1 + rng.pick([0, 0.5, 1]), c2 + rng.pick([-1, -0.5, 0]), c2 + 0.5].sort((a, b) => a - b)
      const v = rng.pick([1, 1.5, 2])
      const thk: Mistura = { P: [0.5, 0.5], m: [c1 + rng.pick([-1, 1]), c2 + rng.pick([-1, 1])], s2: [v, v] }
      const W = eStep(xs, thk)
      const Qk = funzioneQ(xs, thk, W)
      const Hk = funzioneH(xs, thk, W)
      const lk = logVer(xs, thk)
      const th1 = mStep(xs, W)
      const Q1 = funzioneQ(xs, th1, W)
      const H1 = funzioneH(xs, th1, W)
      const l1 = logVer(xs, th1)
      return {
        prompt: md`Usando $\ln p(\mathbf{X} \mid \boldsymbol{\theta}) = Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) - H(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$, la definizione dell'M-step e la disuguaglianza di Jensen, dimostra che $l(\boldsymbol{\theta}^{(k+1)}) \ge l(\boldsymbol{\theta}^{(k)})$. Dì quando vale l'uguaglianza e perché questo non garantisce il massimo globale.

Verifica con i numeri: mistura 1-D, campioni $X = \{${elenco(xs, 1)}\}$, stima corrente $P = (0.5, 0.5)$, $m = (${f(thk.m[0], 1)}, ${f(thk.m[1], 1)})$, $\sigma^2 = (${v}, ${v})$. Calcola $Q(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)})$, $H(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)})$ e l'aumento $l(\boldsymbol{\theta}^{(k+1)}) - l(\boldsymbol{\theta}^{(k)})$ dopo un'iterazione.`,
        answers: [
          risposta(md`$Q(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)})$`, Qk, 0.02),
          risposta(md`$H(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)})$`, Hk, tol(Hk, 0.02, 0.002)),
          risposta(md`$l(\boldsymbol{\theta}^{(k+1)}) - l(\boldsymbol{\theta}^{(k)})$`, l1 - lk, tol(l1 - lk, 0.02, 0.005)),
        ],
        solution: md`**1. Scomposizione.** Dalla regola del prodotto $p(\mathbf{X}, \mathbf{y} \mid \boldsymbol{\theta}) = p(\mathbf{y} \mid \mathbf{X}, \boldsymbol{\theta})\,p(\mathbf{X} \mid \boldsymbol{\theta})$, per ogni $\mathbf{y}$:

$$\ln p(\mathbf{X} \mid \boldsymbol{\theta}) = \ln p(\mathbf{X}, \mathbf{y} \mid \boldsymbol{\theta}) - \ln p(\mathbf{y} \mid \mathbf{X}, \boldsymbol{\theta})$$

Medio con $p(\mathbf{y} \mid \mathbf{X}, \boldsymbol{\theta}^{(k)})$: il membro sinistro non dipende da $\mathbf{y}$ e la densità integra a 1, quindi

$$l(\boldsymbol{\theta}) = Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) - H(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}), \qquad H(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = \int \ln p(\mathbf{y} \mid \mathbf{X}, \boldsymbol{\theta})\,p(\mathbf{y} \mid \mathbf{X}, \boldsymbol{\theta}^{(k)})\,d\mathbf{y}$$

**2. Differenza fra due iterazioni.**

$$l(\boldsymbol{\theta}^{(k+1)}) - l(\boldsymbol{\theta}^{(k)}) = \left[Q(\boldsymbol{\theta}^{(k+1)}, \boldsymbol{\theta}^{(k)}) - Q(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)})\right] - \left[H(\boldsymbol{\theta}^{(k+1)}, \boldsymbol{\theta}^{(k)}) - H(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)})\right]$$

**3. Primo termine ≥ 0.** L'M-step sceglie $\boldsymbol{\theta}^{(k+1)}$ come massimo di $Q(\cdot, \boldsymbol{\theta}^{(k)})$, quindi vale almeno quanto $Q$ in $\boldsymbol{\theta}^{(k)}$.

**4. Secondo termine ≤ 0 (Jensen).** Il logaritmo è concavo, quindi $E[\ln Z] \le \ln E[Z]$:

$$H(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) - H(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)}) = \int \ln\frac{p(\mathbf{y} \mid \mathbf{X}, \boldsymbol{\theta})}{p(\mathbf{y} \mid \mathbf{X}, \boldsymbol{\theta}^{(k)})}\,p(\mathbf{y} \mid \mathbf{X}, \boldsymbol{\theta}^{(k)})\,d\mathbf{y} \le \ln\int p(\mathbf{y} \mid \mathbf{X}, \boldsymbol{\theta})\,d\mathbf{y} = \ln 1 = 0$$

**5. Conclusione.** Un termine $\ge 0$ meno un termine $\le 0$: $l(\boldsymbol{\theta}^{(k+1)}) \ge l(\boldsymbol{\theta}^{(k)})$. Non ho usato né la forma gaussiana né l'ipotesi i.i.d.: vale per ogni modello con latenti, purché l'M-step non faccia scendere $Q$.

**Uguaglianza.** Vale quando l'M-step non trova niente di meglio di $\boldsymbol{\theta}^{(k)}$ e le due distribuzioni delle latenti coincidono: è un punto fisso di EM, dove il gradiente di $l$ è nullo. Può essere un massimo locale o un punto di sella (la slide 75 scrive «local minima», le note «local maximum»). La monotonia dice solo che non peggioro: da un punto di partenza nel bacino sbagliato salgo sulla collina sbagliata, e per la mistura con covarianze libere il massimo globale non esiste nemmeno.

**Numeri.** Nella mistura $H(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = \sum_j \sum_i w_{ij} \ln P(i \mid x_j, \boldsymbol{\theta})$, con $w_{ij}$ le posterior in $\boldsymbol{\theta}^{(k)}$.
- In $\boldsymbol{\theta}^{(k)}$: $Q = ${f(Qk, 4)}$, $H = ${f(Hk, 4)}$, e $Q - H = ${f(Qk - Hk, 4)} = l(\boldsymbol{\theta}^{(k)})$.
- Dopo l'M-step: $Q(\boldsymbol{\theta}^{(k+1)}, \boldsymbol{\theta}^{(k)}) = ${f(Q1, 4)}$ (salita di $${f(Q1 - Qk, 4)}$) e $H(\boldsymbol{\theta}^{(k+1)}, \boldsymbol{\theta}^{(k)}) = ${f(H1, 4)}$ (discesa di $${f(Hk - H1, 4)}$).
- $l(\boldsymbol{\theta}^{(k+1)}) = ${f(l1, 4)}$: l'aumento è $${f(Q1 - Qk, 4)} + ${f(Hk - H1, 4)} = ${f(l1 - lk, 4)}$.`,
      }
    },
  },
  {
    id: 'es12',
    title: 'Massimo globale, massimi locali, punti di sella',
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c36', 'c42', 'c43', 'c44', 'c45'],
    generate: (rng) => {
      const best = -r(rng.float(120, 180), 1)
      const locale = r(best - rng.float(3, 12), 1)
      const sella = r(best - rng.float(18, 35), 1)
      const valori = [best, locale, sella]
      const R = rng.int(5, 7)
      const esiti = Array.from({ length: R }, () => rng.pick([0, 0, 1, 1, 2]))
      const finali = esiti.map((e) => valori[e])
      const mx = Math.max(...finali)
      const quanti = finali.filter((v) => v === mx).length
      const distinti = new Set(finali).size
      const elencoRun = finali.map((v, i) => md`run ${i + 1}: $${f(v, 1)}$`).join(', ')
      return {
        prompt: md`Lanci EM ${R} volte sulla stessa mistura di gaussiane, ogni volta da un'inizializzazione casuale diversa, e annoti la log-verosimiglianza finale: ${elencoRun}.

(a) Quale valore tieni? (b) Quante esecuzioni lo hanno raggiunto? (c) Quanti punti stazionari diversi hai trovato?

Poi, a voce: perché EM non garantisce di raggiungere la stima ML? Che cosa sono qui un massimo locale e un punto di sella (con l'esempio di due componenti inizializzate identiche)? Perché l'inizializzazione conta e quali rimedi pratici adotti? Commenta la differenza fra la slide («local minima») e le note («local maximum»).`,
        answers: [risposta('(a) ln l da tenere', mx, 0.05), risposta('(b) esecuzioni che lo raggiungono', quanti, 0.1), risposta('(c) punti stazionari diversi', distinti, 0.1)],
        solution: md`**(a)** Tengo la soluzione con log-verosimiglianza più alta, $${f(mx, 1)}$: fra punti stazionari della stessa funzione il migliore è quello con $l$ maggiore. **(b)** ${quanti === 1 ? `L'ha raggiunta una sola esecuzione su ${R}` : `L'hanno raggiunta ${quanti} esecuzioni su ${R}`}. **(c)** I valori finali distinti sono ${distinti}: ogni valore è un punto stazionario diverso, perché EM si ferma quando i parametri non cambiano più.

Niente mi garantisce che $${f(mx, 1)}$ sia il massimo globale: è solo il migliore fra quelli che ho visto.

**Perché EM non garantisce la stima ML.** La slide 75: «It is not guaranteed that the EM converges to a global maximum of $L(\boldsymbol{\theta})$ (i.e., the ML estimate)». Il massimo globale della verosimiglianza è per definizione la stima ML. La monotonia della slide 74 garantisce solo che non si scende. Le note spiegano il motivo: la log-verosimiglianza può avere più picchi, ed EM fa aggiornamenti simili a una salita del gradiente, sensibili al punto di partenza. Da ogni $\boldsymbol{\theta}^{(0)}$ EM sale fino alla cima del proprio bacino di attrazione.

**Massimo locale.** Una configurazione migliore di tutte quelle vicine ma peggiore del massimo globale: per esempio due gaussiane che si dividono una gobba dei dati mentre una terza copre da sola due gobbe.

**Punto di sella.** Un punto stazionario che non è un massimo: in alcune direzioni $l$ scende, in altre sale. Esempio: due componenti inizializzate identiche ricevono posterior $1/2$ da ogni campione, l'M-step le lascia identiche (media e varianza globali) e EM resta fermo lì per sempre, anche se separarle farebbe salire $l$.

**Minima o maxima?** La slide dice «local minima», gergo dell'ottimizzazione dove si minimizza; le note dicono «local maximum». EM massimizza, quindi il rischio concreto è fermarsi su un massimo locale o su una sella.

**Rimedi.** Inizializzare con conoscenza a priori (per esempio centri da un k-means o dai picchi di un istogramma), oppure ripetere EM da più punti di partenza e tenere la soluzione a verosimiglianza più alta, come in questo esercizio. Evitare inizializzazioni simmetriche. Nonostante questi limiti la slide conclude che EM si è dimostrato particolarmente efficace nella stima dei parametri delle misture.`,
      }
    },
  },
  {
    id: 'es13',
    title: 'Dalle posterior morbide alle etichette note',
    difficulty: 1,
    kind: 'concettuale',
    concepts: ['c26', 'c51'],
    generate: (rng) => {
      const N = rng.int(6, 8)
      const N1 = rng.int(2, N - 2)
      const c1 = rng.int(3, 5)
      const c2 = c1 + rng.int(4, 6)
      const a = Array.from({ length: N1 }, () => r(c1 + rng.float(-1.5, 1.5, 1), 1))
      const b = Array.from({ length: N - N1 }, () => r(c2 + rng.float(-1.5, 1.5, 1), 1))
      const m1 = somma(a) / N1
      const s21 = somma(a.map((x) => (x - m1) ** 2)) / N1
      return {
        prompt: md`Supponi di conoscere la specie di ogni pesce: la specie 1 ha luminosità $\{${elenco(a, 1)}\}$, la specie 2 $\{${elenco(b, 1)}\}$. Le posterior valgono quindi 1 per la specie vera e 0 per l'altra. Applica le tre equazioni EM della mistura e calcola $P_1$, $m_1$ e $\sigma_1^2$.

Poi, a voce: mostra che con posterior 0 o 1 le equazioni EM diventano frequenza relativa, media campionaria e covarianza campionaria, e usa il risultato per spiegare la frase delle note «If we knew the values of Y, we could solve the ML estimation problem directly».`,
        answers: [risposta(md`$P_1$`, N1 / N, 0.005), risposta(md`$m_1$`, m1, 0.01), risposta(md`$\sigma_1^2$`, s21, tol(s21, 0.01, 0.005))],
        solution: md`**Le equazioni con posterior 0 o 1.** Scrivo $y_{j1} = P(1 \mid x_j) \in \{0, 1\}$ e $N_1 = \sum_j y_{j1}$, il numero di pesci della specie 1:

$$P_1 = \frac{1}{N}\sum_{j} y_{j1} = \frac{N_1}{N}, \qquad m_1 = \frac{\sum_j y_{j1}\,x_j}{\sum_j y_{j1}} = \frac{1}{N_1}\sum_{x_j \in \text{specie } 1} x_j, \qquad \sigma_1^2 = \frac{1}{N_1}\sum_{x_j \in \text{specie } 1}(x_j - m_1)^2$$

Nelle somme restano solo i campioni della specie 1: sono esattamente le stime ML per classe.

**Numeri.** $P_1 = ${N1}/${N} = ${f(N1 / N, 4)}$; $m_1 = \frac{${a.map((x) => f(x, 1)).join(' + ')}}{${N1}} = ${f(m1, 4)}$; $\sigma_1^2 = \frac{${a.map((x) => f((x - m1) ** 2, 4)).join(' + ')}}{${N1}} = ${f(s21, 4)}$ (varianza ML, con $1/N_1$).

**La frase delle note.** Con $\mathbf{Y}$ noto la log-verosimiglianza completa $\sum_j\sum_i y_{ji}[\ln P_i + \ln p(x_j \mid m_i, \sigma_i^2)]$ si separa: un termine per i prior e uno per ogni specie, ciascuno con i soli suoi campioni. Nessun logaritmo di una somma, quindi la ML si risolve direttamente in forma chiusa. EM fa la stessa cosa sostituendo gli $y_{ji}$ ignoti con il loro valore atteso, la posterior: le sue equazioni sono queste stime ML con i campioni contati «a frazioni». È il modo più rapido per ricordare le formule della slide 76.`,
      }
    },
  },
  {
    id: 'es14',
    title: 'Parametrico o non parametrico con dati incompleti?',
    difficulty: 1,
    kind: 'concettuale',
    concepts: ['c03', 'c04', 'c17'],
    generate: (rng) => {
      const N = rng.pick([200, 500, 1000, 5000])
      const n = rng.int(1, 6)
      const M = rng.int(2, 5)
      const parzen = N * n + 1
      const mist = parametriMistura(M, n).totale
      return {
        prompt: md`Hai $N = ${N}$ campioni in $n = ${n}$ dimensioni e sai che vengono da una mistura di $M = ${M}$ gaussiane, di cui ti interessano i singoli modi. (a) Quanti numeri deve conservare una stima di Parzen con kernel gaussiano a $\sigma$ unica (tutte le coordinate dei campioni più $\sigma$)? (b) Quanti parametri liberi ha il modello parametrico?

Poi, a voce: perché con dati incompleti si preferisce l'approccio parametrico? Perché un Parzen o un K-NN sarebbero sub-ottimi per la mistura? In quale caso il vantaggio del parametrico svanisce? Collega la risposta al principio di usare tutta l'informazione disponibile.`,
        answers: [risposta('(a) numeri conservati da Parzen', parzen, 0.5), risposta('(b) parametri della mistura', mist, 0.5)],
        solution: md`**(a)** Parzen usa direttamente i campioni: $N \cdot n + 1 = ${N} \cdot ${n} + 1 = ${parzen}$ numeri. **(b)** La mistura: $(M - 1) + Mn + Mn(n+1)/2 = ${mist}$ parametri.

**Il principio.** Con variabili latenti potrei ignorarle, ma la pratica statistica preferisce usare tutta l'informazione disponibile, anche parziale. Per compensare ciò che non osservo serve un modello con struttura nota: per questo con dati incompleti si usa tipicamente l'approccio parametrico.

**Perché Parzen e K-NN sono sub-ottimi.** Le note: il modello non parametrico non sfrutta l'informazione a priori sulla struttura (che è una mistura di gaussiane), e ignorandola la stima diventa meno efficiente e meno accurata. In concreto:
- stimano solo la $p(\mathbf{x})$ complessiva, mentre l'obiettivo è la distribuzione di ciascun modo;
- non danno posterior di appartenenza;
- devono ricostruire dai campioni una forma che il modello conosce già: servono più dati per la stessa precisione, e lo si vede nel conto (${parzen} numeri contro ${mist}).

Quando uso l'informazione a priori il problema diventa parametrico e lo risolvo con EM.

**Quando il vantaggio svanisce.** Se il modello è sbagliato (i dati non sono una somma di gaussiane, o $M$ è scelto male), la stima parametrica resta distorta anche con infiniti campioni, mentre Parzen e K-NN sono consistenti. Il parametrico vince solo se la struttura assunta è quella vera.`,
      }
    },
  },
  {
    id: 'es15',
    title: 'σ_k adattivo dagli L vicini',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c59', 'c62', 'c64'],
    generate: (rng) => {
      const K = rng.int(6, 8)
      const pts: [number, number][] = []
      while (pts.length < K) {
        const p: [number, number] = [rng.int(0, 10), rng.int(0, 10)]
        if (!pts.some(([a, b]) => a === p[0] && b === p[1])) pts.push(p)
      }
      const L = rng.int(2, 4)
      const k = rng.int(0, K - 1)
      const nomi = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
      const sigma = (idx: number) => {
        const d = pts
          .filter((_, j) => j !== idx)
          .map(([a, b]) => Math.hypot(a - pts[idx][0], b - pts[idx][1]))
          .sort((p, q) => p - q)
        return somma(d.slice(0, L)) / L
      }
      const sig = pts.map((_, i) => sigma(i))
      const smax = Math.max(...sig)
      const smin = Math.min(...sig)
      // campioni con la σ massima o minima: con coordinate intere capitano pari merito
      const chi = (val: number) => {
        const n = sig.flatMap((v, i) => (Math.abs(v - val) < 1e-9 ? [nomi[i]] : []))
        return n.length === 1 ? n[0] : `${n.slice(0, -1).join(', ')} e ${n[n.length - 1]}, a pari merito`
      }
      const dist = pts
        .map(([a, b], j) => ({ j, d: Math.hypot(a - pts[k][0], b - pts[k][1]) }))
        .filter((x) => x.j !== k)
        .sort((p, q) => p.d - q.d)
      const righe = dist.map((x, i) => md`| ${i + 1} | ${nomi[x.j]} | $\sqrt{${(pts[x.j][0] - pts[k][0]) ** 2 + (pts[x.j][1] - pts[k][1]) ** 2}} = ${f(x.d)}$ |`).join('\n')
      return {
        prompt: md`${K} campioni di training con due feature già normalizzate: ${pts.map(([a, b], i) => md`${nomi[i]}$(${a}, ${b})$`).join(', ')}. Con l'approccio adattivo del kernel gaussiano, $\sigma_k$ è la distanza euclidea media di $\mathbf{x}_k$ dai suoi $L$ campioni più vicini. Con $L = ${L}$: (a) quanto vale $\sigma$ per il campione ${nomi[k]}? (b) Qual è la $\sigma_k$ più grande fra tutti i campioni? (c) E la più piccola?

Domanda aggiuntiva: $\sigma_k$ è più grande in una zona densa o in una zona rada? Perché?`,
        answers: [risposta(md`(a) $\sigma_{${nomi[k]}}$`, sig[k], 0.01), risposta(md`(b) $\max_k \sigma_k$`, smax, 0.01), risposta(md`(c) $\min_k \sigma_k$`, smin, 0.01)],
        solution: md`**Formula.** $\sigma_k = \frac{1}{L}\sum_{l=1}^{L}\Vert\mathbf{x}_k - \mathbf{y}_l\Vert$, con $\mathbf{y}_1, \ldots, \mathbf{y}_L$ i campioni di training più vicini a $\mathbf{x}_k$ (escluso $\mathbf{x}_k$ stesso).

**(a)** Distanze da ${nomi[k]}, in ordine crescente:

| posto | campione | distanza |
|---|---|---|
${righe}

$\sigma_{${nomi[k]}} = \frac{1}{${L}}(${dist.slice(0, L).map((x) => f(x.d)).join(' + ')}) = ${f(sig[k])}$.

**(b), (c)** Con $L = ${L}$: ${sig.map((v, i) => md`$\sigma_{${nomi[i]}} = ${f(v)}$`).join(', ')}. La più grande è $${f(smax)}$ (${chi(smax)}), la più piccola $${f(smin)}$ (${chi(smin)}).

**Zona densa o rada.** $\sigma_k$ è piccola dove i campioni sono fitti: i vicini sono a breve distanza. Le note: quando i campioni sono densi ci sono meno vuoti da riempire, e una varianza grande non serve; nelle zone con pochi campioni una varianza più grande tiene conto della maggiore incertezza. La strategia adatta il parametro di smoothing alla densità locale, e il nuovo iperparametro è $L$. Le feature vanno normalizzate prima, perché la distanza euclidea pesa tutte le coordinate allo stesso modo.`,
      }
    },
  },
  {
    id: 'es16',
    title: "Simulazione d'orale: «What is an EM algorithm and how does it work?»",
    difficulty: 3,
    kind: 'concettuale',
    concepts: ['c02', 'c05', 'c23', 'c25', 'c30', 'c31', 'c33', 'c34', 'c40', 'c42', 'c48', 'c49', 'c50'],
    generate: (rng) => {
      const m1 = rng.int(2, 4)
      const m2 = m1 + rng.int(3, 5)
      const P1 = rng.pick([0.4, 0.5, 0.6])
      const th: Mistura = { P: [P1, r(1 - P1, 2)], m: [m1, m2], s2: [1, 1] }
      const x = r(m1 + rng.pick([0.5, 1, 1.5, 2]), 1)
      const w = posterior(x, th)
      const N = rng.int(8, 12)
      const S1 = r(rng.float(0.3, 0.7) * N, 2)
      return {
        prompt: md`Rispondi in cinque minuti a «What is an EM algorithm and how does it work?» seguendo la traccia: (1) contesto: variabili latenti, dati incompleti, approccio parametrico; (2) formulazione: $\mathbf{X}$, $\mathbf{Y}$, $\mathbf{Z}$, densità congiunta, le due verosimiglianze; (3) formula di $Q$ come aspettazione e come integrale; (4) E-step, M-step, alternanza, inizializzazione e arresto; (5) convergenza: monotonia, nessuna garanzia di massimo globale; (6) esempio della mistura di gaussiane con le tre equazioni di aggiornamento e il significato della posterior.

Per il punto (6) prepara due numeri da dire al docente: con $P = (${f(th.P[0], 2)}, ${f(th.P[1], 2)})$, $m = (${m1}, ${m2})$, $\sigma^2 = (1, 1)$, quanto vale la posterior del modo 1 per $x = ${f(x, 1)}$? E se su $N = ${N}$ campioni le posterior del modo 1 sommano a $${f(S1, 2)}$, quanto vale $P_1^{[k+1]}$?`,
        answers: [risposta(md`$P(1 \mid x, \boldsymbol{\theta})$`, w[0], 0.005), risposta(md`$P_1^{[k+1]}$`, S1 / N, 0.005)],
        solution: md`**Numeri.** $P(1 \mid ${f(x, 1)}) = \frac{${f(th.P[0], 2)}\,\mathcal{N}(${f(x, 1)} \mid ${m1}, 1)}{${f(th.P[0], 2)}\,\mathcal{N}(${f(x, 1)} \mid ${m1}, 1) + ${f(th.P[1], 2)}\,\mathcal{N}(${f(x, 1)} \mid ${m2}, 1)} = ${f(w[0], 4)}$ e $P_1^{[k+1]} = ${f(S1, 2)}/${N} = ${f(S1 / N, 4)}$.

**Risposta modello.**

(1) Finora i modelli dipendevano solo da variabili osservabili. In molti casi reali dipendono anche da variabili latenti non osservate: l'etichetta del modo che ha generato un campione, o una feature non misurata. Non voglio ignorarle: uso tutta l'informazione, anche parziale, con un modello parametrico. EM è un metodo iterativo di stima ML con variabili latenti.

(2) $\mathbf{X}$ è osservato (dataset incompleto), $\mathbf{Y}$ sono i dati mancanti, $\mathbf{Z} = (\mathbf{X}, \mathbf{Y})$ il dataset completo. $p(\mathbf{Z} \mid \boldsymbol{\theta}) = p(\mathbf{X}, \mathbf{Y} \mid \boldsymbol{\theta}) = p(\mathbf{Y} \mid \mathbf{X}, \boldsymbol{\theta})\,p(\mathbf{X} \mid \boldsymbol{\theta})$. La verosimiglianza completa $l(\boldsymbol{\theta} \mid \mathbf{Z})$ sarebbe facile da massimizzare ma non è calcolabile; quella incompleta $l(\boldsymbol{\theta} \mid \mathbf{X}) = p(\mathbf{X} \mid \boldsymbol{\theta})$ è calcolabile ma difficile.

(3) $$Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = E\left\{\log p(\mathbf{X}, \mathbf{Y} \mid \boldsymbol{\theta}) \;\middle|\; \mathbf{X}, \boldsymbol{\theta}^{(k)}\right\} = \int \log p(\mathbf{X}, \mathbf{y} \mid \boldsymbol{\theta})\,p(\mathbf{y} \mid \mathbf{X}, \boldsymbol{\theta}^{(k)})\,d\mathbf{y}$$

$\boldsymbol{\theta}^{(k)}$ fissa i pesi, $\boldsymbol{\theta}$ è libero; mediando su $\mathbf{Y}$ tolgo l'incertezza sulle latenti.

(4) Inizializzo $\boldsymbol{\theta}^{(0)}$ a caso o con conoscenza a priori. E-step: calcolo $Q$ trattando le latenti come se fossero osservate, pesate dalla loro distribuzione. M-step: $\boldsymbol{\theta}^{(k+1)} = \arg\max Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$. I nuovi parametri fanno partire un nuovo E-step; mi fermo quando $\boldsymbol{\theta}$ non cambia più in modo significativo.

(5) $l(\boldsymbol{\theta}^{(i+1)}) \ge l(\boldsymbol{\theta}^{(i)})$: la log-verosimiglianza non scende mai (si dimostra con $l = Q - H$ e Jensen). Non è garantito il massimo globale: EM può fermarsi su massimi locali o punti di sella, e dipende dall'inizializzazione. È comunque particolarmente efficace per le misture.

(6) $p(\mathbf{x}) = \sum_{i=1}^{M} P_i\,p(\mathbf{x} \mid \mathbf{m}_i, \Sigma_i)$, $\boldsymbol{\theta} = [P_1, \ldots, P_M; \mathbf{m}_1, \ldots, \mathbf{m}_M; \Sigma_1, \ldots, \Sigma_M]$. È incompleto perché non so quale modo ha generato ogni campione. E-step: la posterior $P(i \mid \mathbf{x}_j, \boldsymbol{\theta}^{[k]}) = \frac{P_i^{[k]}\,p(\mathbf{x}_j \mid \mathbf{m}_i^{[k]}, \Sigma_i^{[k]})}{p(\mathbf{x}_j \mid \boldsymbol{\theta}^{[k]})}$, probabilità che il campione venga dal modo $i$. M-step:

$$P_i^{[k+1]} = \frac{1}{N}\sum_j P(i \mid \mathbf{x}_j, \boldsymbol{\theta}^{[k]}), \qquad \mathbf{m}_i^{[k+1]} = \frac{\sum_j P(i \mid \mathbf{x}_j, \boldsymbol{\theta}^{[k]})\,\mathbf{x}_j}{\sum_j P(i \mid \mathbf{x}_j, \boldsymbol{\theta}^{[k]})}, \qquad \Sigma_i^{[k+1]} = \frac{\sum_j P(i \mid \mathbf{x}_j, \boldsymbol{\theta}^{[k]})\,(\mathbf{x}_j - \mathbf{m}_i^{[k+1]})(\mathbf{x}_j - \mathbf{m}_i^{[k+1]})^{t}}{\sum_j P(i \mid \mathbf{x}_j, \boldsymbol{\theta}^{[k]})}$$

Sono le stime ML della gaussiana pesate dalle posterior: con etichette note ritroverei frequenza relativa, media e covarianza di ogni gruppo. Qui la posterior del modo 1 in $x = ${f(x, 1)}$ vale $${f(w[0], 4)}$, e il nuovo prior $${f(S1 / N, 4)}$.`,
      }
    },
  },
  {
    id: 'es17',
    title: 'Inizializzazione simmetrica: dove si blocca EM?',
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c36', 'c42', 'c43', 'c44'],
    generate: (rng) => {
      const M = rng.int(2, 3)
      const N = rng.int(5, 7)
      const xs = rng
        .shuffle(Array.from({ length: 30 }, (_, i) => 1 + i * 0.3))
        .slice(0, N)
        .map((x) => r(x, 1))
        .sort((a, b) => a - b)
      const m0 = r(rng.float(3, 8), 1)
      const v0 = rng.pick([1, 2, 4])
      const th0: Mistura = { P: Array(M).fill(1 / M), m: Array(M).fill(m0), s2: Array(M).fill(v0) }
      const W = eStep(xs, th0)
      const th1 = mStep(xs, W)
      const media = somma(xs) / N
      const varianza = somma(xs.map((x) => (x - media) ** 2)) / N
      const W2 = eStep(xs, th1)
      const th2 = mStep(xs, W2)
      const lista = Array.from({ length: M }, (_, i) => i + 1).join(', ')
      return {
        prompt: md`Mistura 1-D con $M = ${M}$ componenti inizializzate tutte uguali: $m_i^{[0]} = ${f(m0, 1)}$, $\sigma_i^{2\,[0]} = ${v0}$, $P_i^{[0]} = 1/${M}$ per $i = ${lista}$. Dati: $X = \{${elenco(xs, 1)}\}$.

(a) Quanto vale la posterior $P(i \mid x_j, \boldsymbol{\theta}^{[0]})$ per un campione qualsiasi? (b) Quanto valgono dopo l'M-step la media comune $m_i^{[1]}$, (c) la varianza comune $\sigma_i^{2\,[1]}$ e (d) il prior $P_i^{[1]}$?

Poi, a voce: che cosa succede alle iterazioni successive? Che tipo di punto è questo e quali rimedi adotti?`,
        answers: [risposta('(a) posterior', 1 / M, 0.005), risposta(md`(b) $m_i^{[1]}$`, th1.m[0], 0.01), risposta(md`(c) $\sigma_i^{2\,[1]}$`, th1.s2[0], tol(th1.s2[0], 0.01, 0.005)), risposta(md`(d) $P_i^{[1]}$`, th1.P[0], 0.005)],
        solution: md`**(a) E-step.** Tutte le componenti hanno gli stessi parametri, quindi per ogni campione i numeratori $P_i\,\mathcal{N}(x_j \mid m_i, \sigma_i^2)$ sono uguali e ciascuno vale $1/M$ del denominatore: $P(i \mid x_j, \boldsymbol{\theta}^{[0]}) = 1/${M} = ${f(1 / M, 4)}$, qualunque sia $x_j$.

**(b), (c), (d) M-step.** Con pesi tutti uguali le medie pesate diventano medie semplici:

$$m_i^{[1]} = \frac{\sum_j \frac{1}{${M}} x_j}{\sum_j \frac{1}{${M}}} = \frac{1}{N}\sum_j x_j = \frac{${f(somma(xs), 1)}}{${N}} = ${f(media, 4)}$$

$$\sigma_i^{2\,[1]} = \frac{1}{N}\sum_j (x_j - ${f(media, 4)})^2 = ${f(varianza, 4)}, \qquad P_i^{[1]} = \frac{1}{N}\sum_j \frac{1}{${M}} = \frac{1}{${M}}$$

Tutte le componenti diventano la media e la varianza campionarie globali, e restano identiche fra loro.

**Le iterazioni successive.** Al passo 2 le componenti sono di nuovo identiche, quindi le posterior tornano $1/${M}$ e l'M-step restituisce gli stessi numeri: $m_i^{[2]} = ${f(th2.m[0], 4)}$, $\sigma_i^{2\,[2]} = ${f(th2.s2[0], 4)}$. EM resta fermo lì per sempre.

**Che punto è.** È un punto stazionario della verosimiglianza: il modello equivale a una sola gaussiana con i parametri ML globali. Di solito non è il massimo ma un punto di sella (slide 75): separando di poco due componenti la verosimiglianza salirebbe, ma EM, partendo simmetrico, non ha nessuna spinta a rompere la simmetria. È l'esempio più chiaro di come EM dipenda dal punto di partenza.

**Rimedi.** Inizializzazione casuale (componenti diverse fra loro) o guidata da conoscenza a priori, e più ripartenze tenendo la soluzione a verosimiglianza più alta.`,
      }
    },
  },
  {
    id: 'es18',
    title: 'Posterior di appartenenza di un paziente: il prior può ribaltare la verosimiglianza',
    difficulty: 1,
    kind: 'numerico',
    concepts: ['c46', 'c47'],
    generate: (rng) => {
      const base = rng.int(0, 3) === 0
      const Ps = base ? 0.8 : rng.pick([0.6, 0.7, 0.75, 0.8, 0.85, 0.9])
      const Pa = r(1 - Ps, 2)
      const ms = base ? 65 : rng.int(60, 70)
      const ss = base ? 8 : rng.int(6, 10)
      const ma = base ? 95 : rng.int(88, 100)
      const sa = base ? 12 : rng.int(10, 15)
      const x = base ? 80 : rng.int(ms + 5, ma - 5)
      const Ns = gauss(x, ms, ss * ss)
      const Na = gauss(x, ma, sa * sa)
      const ns = Ps * Ns
      const na = Pa * Na
      const den = ns + na
      const ws = ns / den
      const zs = Math.abs(x - ms) / ss
      const za = Math.abs(x - ma) / sa
      const verSani = Ns >= Na
      const postSani = ws >= 0.5
      const commento =
        verSani === postSani
          ? md`Qui verosimiglianza e posterior indicano lo stesso gruppo (${postSani ? 'sani' : 'aritmici'}): il prior ${postSani === Ps >= Pa ? 'rafforza' : 'attenua'} la scelta ma non la ribalta.`
          : md`La verosimiglianza favorisce ${verSani ? 'i sani' : 'gli aritmici'}, ma la posterior favorisce ${postSani ? 'i sani' : 'gli aritmici'}: è il prior $${f(postSani ? Ps : Pa, 2)}$ a ribaltare il risultato.`
      return {
        prompt: md`Frequenza cardiaca a riposo (dati sintetici): la popolazione è una mistura di sani, con $P = ${f(Ps, 2)}$, $m = ${ms}$ bpm, $\sigma = ${ss}$, e di aritmici, con $P = ${f(Pa, 2)}$, $m = ${ma}$ bpm, $\sigma = ${sa}$. Un paziente ha $x = ${x}$ bpm. Calcola le due densità di componente, la densità della mistura $p(x \mid \boldsymbol{\theta})$ e la posterior di appartenenza ai sani.`,
        answers: [
          risposta(md`$\mathcal{N}(x \mid m_{\text{sani}}, \sigma^2)$`, Ns, tol(Ns, 0.01, 1e-6)),
          risposta(md`$\mathcal{N}(x \mid m_{\text{aritmici}}, \sigma^2)$`, Na, tol(Na, 0.01, 1e-6)),
          risposta(md`$p(x \mid \boldsymbol{\theta})$`, den, tol(den, 0.01, 1e-6)),
          risposta(md`$P(\text{sani} \mid x)$`, ws, 0.005),
        ],
        solution: md`**1. Densità di componente.**

$$\mathcal{N}(${x} \mid ${ms}, ${ss}^2) = \frac{1}{\sqrt{2\pi} \cdot ${ss}}\exp\left(-\frac{(${x} - ${ms})^2}{2 \cdot ${ss * ss}}\right) = ${g(Ns, 4)}, \qquad \mathcal{N}(${x} \mid ${ma}, ${sa}^2) = \frac{1}{\sqrt{2\pi} \cdot ${sa}}\exp\left(-\frac{(${x} - ${ma})^2}{2 \cdot ${sa * sa}}\right) = ${g(Na, 4)}$$

**2. Numeratori.** $${f(Ps, 2)} \cdot ${g(Ns, 4)} = ${g(ns, 4)}$ per i sani e $${f(Pa, 2)} \cdot ${g(Na, 4)} = ${g(na, 4)}$ per gli aritmici.

**3. Mistura.** $p(x \mid \boldsymbol{\theta}) = ${g(ns, 4)} + ${g(na, 4)} = ${g(den, 4)}$.

**4. Posterior.** $P(\text{sani} \mid x) = ${g(ns, 4)}/${g(den, 4)} = ${f(ws, 4)}$ e $P(\text{aritmici} \mid x) = ${f(1 - ws, 4)}$.

**Lettura.** ${x} bpm dista $${f(zs, 3)}$ deviazioni standard dai sani e $${f(za, 3)}$ dagli aritmici. ${commento} La formula è $P(i \mid x) = \frac{P_i\,\mathcal{N}(x \mid m_i, \sigma_i^2)}{\sum_l P_l\,\mathcal{N}(x \mid m_l, \sigma_l^2)}$: la stessa che EM calcola nell'E-step per ogni campione e ogni modo.`,
      }
    },
  },
  {
    id: 'es19',
    title: 'Dimostra con il minorante che EM non fa scendere la verosimiglianza',
    difficulty: 3,
    kind: 'dimostrazione',
    concepts: ['c40', 'c66'],
    generate: (rng) => {
      const c1 = rng.int(1, 3)
      const c2 = c1 + rng.int(3, 5)
      const xs = [c1 + rng.pick([-0.5, 0]), c1 + rng.pick([0.5, 1]), c2 + rng.pick([-0.5, 0]), c2 + rng.pick([0.5, 1])]
      const thk: Mistura = { P: [0.5, 0.5], m: [c1 + rng.pick([-1, 1.5]), c2 + rng.pick([-1.5, 1])], s2: [1, 1] }
      const W = eStep(xs, thk)
      const lk = logVer(xs, thk)
      const Qk = funzioneQ(xs, thk, W)
      const th1 = mStep(xs, W)
      const Q1 = funzioneQ(xs, th1, W)
      const B = lk + Q1 - Qk
      const l1 = logVer(xs, th1)
      return {
        prompt: md`Partendo da $l(\boldsymbol{\theta}) = Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) - H(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$ e da $H(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) \le H(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)})$ (Jensen), ricava

$$l(\boldsymbol{\theta}) \ge l(\boldsymbol{\theta}^{(k)}) + Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) - Q(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)})$$

descrivi il disegno in 1-D e deduci $l(\boldsymbol{\theta}^{(k+1)}) \ge l(\boldsymbol{\theta}^{(k)})$. Spiega perché basterebbe un $\boldsymbol{\theta}^{(k+1)}$ che aumenta $Q$ senza massimizzarla.

Verifica: mistura 1-D, $X = \{${elenco(xs, 1)}\}$, $\boldsymbol{\theta}^{(k)}$: $P = (0.5, 0.5)$, $m = (${f(thk.m[0], 1)}, ${f(thk.m[1], 1)})$, $\sigma^2 = (1, 1)$. Calcola $l(\boldsymbol{\theta}^{(k)})$, il valore del minorante in $\boldsymbol{\theta}^{(k+1)}$ (il risultato dell'M-step) e $l(\boldsymbol{\theta}^{(k+1)})$.`,
        answers: [
          risposta(md`$l(\boldsymbol{\theta}^{(k)})$`, lk, 0.02),
          risposta(md`minorante in $\boldsymbol{\theta}^{(k+1)}$`, B, 0.02),
          risposta(md`$l(\boldsymbol{\theta}^{(k+1)})$`, l1, 0.02),
        ],
        solution: md`**1. Il minorante.** Scrivo la scomposizione in $\boldsymbol{\theta}$ e in $\boldsymbol{\theta}^{(k)}$ e sottraggo:

$$l(\boldsymbol{\theta}) - l(\boldsymbol{\theta}^{(k)}) = Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) - Q(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)}) + \underbrace{H(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)}) - H(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})}_{\ge 0 \text{ per Jensen}}$$

Togliendo il termine non negativo:

$$l(\boldsymbol{\theta}) \ge B(\boldsymbol{\theta}) = l(\boldsymbol{\theta}^{(k)}) + Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) - Q(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)})$$

con uguaglianza per $\boldsymbol{\theta} = \boldsymbol{\theta}^{(k)}$, dove il termine di Jensen si annulla.

**2. Il disegno.** In 1-D traccio la curva di $l(\theta)$. La curva $B(\theta)$ è $Q(\cdot, \theta^{(k)})$ spostata di una costante: sta sempre sotto $l$ e la tocca nel punto $\theta^{(k)}$, dove le due curve sono anche tangenti. L'M-step sale al massimo di $B$, in $\theta^{(k+1)}$; lì $l$ sta sopra $B$, e $B(\theta^{(k+1)}) \ge B(\theta^{(k)}) = l(\theta^{(k)})$.

**3. Conclusione.** $l(\boldsymbol{\theta}^{(k+1)}) \ge B(\boldsymbol{\theta}^{(k+1)}) \ge B(\boldsymbol{\theta}^{(k)}) = l(\boldsymbol{\theta}^{(k)})$. Il nuovo E-step costruisce un nuovo minorante attaccato a $\boldsymbol{\theta}^{(k+1)}$, e così via: è la salita a gradini della slide 74.

**4. Basta aumentare Q.** Nel passaggio $B(\boldsymbol{\theta}^{(k+1)}) \ge B(\boldsymbol{\theta}^{(k)})$ ho usato solo $Q(\boldsymbol{\theta}^{(k+1)}, \boldsymbol{\theta}^{(k)}) \ge Q(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)})$, non il fatto che sia il massimo. Un M-step parziale che aumenta $Q$ garantisce ancora la salita (è l'idea dell'EM generalizzato, non trattata nelle slide).

**Numeri.**
- $l(\boldsymbol{\theta}^{(k)}) = ${f(lk, 4)}$.
- $Q(\boldsymbol{\theta}^{(k)}, \boldsymbol{\theta}^{(k)}) = ${f(Qk, 4)}$, e dopo l'M-step $Q(\boldsymbol{\theta}^{(k+1)}, \boldsymbol{\theta}^{(k)}) = ${f(Q1, 4)}$, con $\boldsymbol{\theta}^{(k+1)}$: $P = (${f(th1.P[0], 3)}, ${f(th1.P[1], 3)})$, $m = (${f(th1.m[0], 3)}, ${f(th1.m[1], 3)})$, $\sigma^2 = (${f(th1.s2[0], 3)}, ${f(th1.s2[1], 3)})$.
- Minorante: $B(\boldsymbol{\theta}^{(k+1)}) = ${f(lk, 4)} + ${par(Q1, 4)} - ${par(Qk, 4)} = ${f(B, 4)}$.
- $l(\boldsymbol{\theta}^{(k+1)}) = ${f(l1, 4)}$, che supera il minorante di $${f(l1 - B, 4)}$ (il termine di Jensen) e $l(\boldsymbol{\theta}^{(k)})$ di $${f(l1 - lk, 4)}$.`,
      }
    },
  },
  {
    id: 'es20',
    title: "L'aggiornamento EM della media è un passo di salita del gradiente",
    difficulty: 3,
    kind: 'dimostrazione',
    concepts: ['c44', 'c49'],
    generate: (rng) => {
      const c1 = rng.int(2, 4)
      const c2 = c1 + rng.int(4, 5)
      const xs = seiCampioni(rng, c1, c2)
      const v = rng.pick([1, 1.5, 2])
      const th: Mistura = { P: [0.5, 0.5], m: [c1 + rng.pick([-1, -0.5, 0.5, 1]), c2 + rng.pick([-1, -0.5, 0.5, 1])], s2: [v, v] }
      const { grad, Ni, nuova } = gradienteMedia(xs, th, 0)
      const W = eStep(xs, th)
      const mEM = somma(xs.map((x, j) => W[j][0] * x)) / Ni
      return {
        prompt: md`Parti dalla derivata della log-verosimiglianza incompleta della mistura rispetto a $\mathbf{m}_i$, valutata in $\boldsymbol{\theta}^{[k]}$, e dall'equazione EM delle medie (slide 76). Dimostra che

$$\mathbf{m}_i^{[k+1]} = \mathbf{m}_i^{[k]} + \frac{\Sigma_i^{[k]}}{N_i^{[k]}}\,\frac{\partial \ln l}{\partial \mathbf{m}_i}\bigg|_{\boldsymbol{\theta}^{[k]}}, \qquad N_i^{[k]} = \sum_{j=1}^{N} P(i \mid \mathbf{x}_j, \boldsymbol{\theta}^{[k]})$$

e commenta la frase delle note «EM relies on gradient ascent-like updates»: che cosa ha in comune EM con la salita del gradiente e che cosa no.

Verifica in 1-D: $X = \{${elenco(xs, 1)}\}$, $P = (0.5, 0.5)$, $m = (${f(th.m[0], 1)}, ${f(th.m[1], 1)})$, $\sigma^2 = (${v}, ${v})$. Calcola $\partial \ln l/\partial m_1$, $N_1$ e $m_1^{[k+1]}$.`,
        answers: [
          risposta(md`$\partial \ln l / \partial m_1$`, grad, tol(grad, 0.01, 0.005)),
          risposta(md`$N_1$`, Ni, 0.01),
          risposta(md`$m_1^{[k+1]}$`, nuova, 0.01),
        ],
        solution: md`**1. La derivata.** $\ln l = \sum_j \ln \sum_l P_l\,p(\mathbf{x}_j \mid \mathbf{m}_l, \Sigma_l)$. Derivando il logaritmo di una somma compare il rapporto fra il termine del modo $i$ e la somma, cioè la posterior:

$$\frac{\partial \ln l}{\partial \mathbf{m}_i}\bigg|_{\boldsymbol{\theta}^{[k]}} = \sum_{j=1}^{N} P(i \mid \mathbf{x}_j, \boldsymbol{\theta}^{[k]})\,(\Sigma_i^{[k]})^{-1}(\mathbf{x}_j - \mathbf{m}_i^{[k]})$$

**2. Il legame con l'M-step.** Porto fuori $(\Sigma_i^{[k]})^{-1}$ e separo la somma:

$$\sum_j P(i \mid \mathbf{x}_j, \boldsymbol{\theta}^{[k]})(\mathbf{x}_j - \mathbf{m}_i^{[k]}) = \sum_j P(i \mid \mathbf{x}_j, \boldsymbol{\theta}^{[k]})\,\mathbf{x}_j - N_i^{[k]}\,\mathbf{m}_i^{[k]} = N_i^{[k]}\big(\mathbf{m}_i^{[k+1]} - \mathbf{m}_i^{[k]}\big)$$

perché la media EM è $\mathbf{m}_i^{[k+1]} = \sum_j P(i \mid \mathbf{x}_j, \boldsymbol{\theta}^{[k]})\,\mathbf{x}_j / N_i^{[k]}$. Quindi $\frac{\partial \ln l}{\partial \mathbf{m}_i} = (\Sigma_i^{[k]})^{-1} N_i^{[k]}(\mathbf{m}_i^{[k+1]} - \mathbf{m}_i^{[k]})$ e, moltiplicando per $\Sigma_i^{[k]}/N_i^{[k]}$, ottengo la tesi.

**3. Che cosa ha in comune con la salita del gradiente.** Il passo va nella direzione del gradiente (la matrice $\Sigma_i^{[k]}/N_i^{[k]}$ è definita positiva), quindi migliora localmente: da ogni punto di partenza EM sale nel proprio bacino e ne eredita la dipendenza dall'inizializzazione. È il motivo per cui le note parlano di massimi multipli e di sensibilità al punto di partenza.

**4. Che cosa non ha.** EM non calcola gradienti e non ha un passo (*learning rate*) da tarare: la «matrice di passo» è fissata dal modello, e l'M-step massimizza $Q$ esattamente, in forma chiusa. Non rischia di superare il massimo per un passo troppo lungo: la monotonia della slide 74 vale sempre.

**Numeri.** Posterior del modo 1: ${W.map((w) => md`$${f(w[0], 4)}$`).join(', ')}.
- $N_1 = ${f(Ni, 4)}$.
- $\frac{\partial \ln l}{\partial m_1} = \frac{1}{${v}}\sum_j P(1 \mid x_j)(x_j - ${f(th.m[0], 1)}) = ${f(grad, 4)}$.
- Passo di gradiente: $m_1^{[k+1]} = ${f(th.m[0], 1)} + \frac{${v}}{${f(Ni, 4)}} \cdot ${par(grad, 4)} = ${f(nuova, 4)}$.
- Media pesata dell'M-step: $\frac{\sum_j P(1 \mid x_j)\,x_j}{N_1} = ${f(mEM, 4)}$. I due numeri coincidono.`,
      }
    },
  },
  {
    id: 'es21',
    title: 'Perché la verosimiglianza di una mistura può non avere massimo',
    difficulty: 3,
    kind: 'concettuale',
    concepts: ['c42', 'c67'],
    generate: (rng) => {
      const N = rng.int(4, 6)
      const xs = rng
        .shuffle(Array.from({ length: 20 }, (_, i) => 2 + i * 0.4))
        .slice(0, N)
        .map((x) => r(x, 1))
        .sort((a, b) => a - b)
      const jj = rng.int(0, N - 1)
      const P1 = rng.pick([0.3, 0.5, 0.7])
      const P2 = r(1 - P1, 2)
      const media = somma(xs) / N
      const varianza = somma(xs.map((x) => (x - media) ** 2)) / N
      const sa = rng.pick([0.1, 0.05])
      const sb = sa / 10
      const lnl = (s: number) => logVer(xs, { P: [P1, P2], m: [xs[jj], media], s2: [s * s, varianza] })
      const T = Math.log(P1 / (Math.sqrt(2 * Math.PI) * sa))
      const la = lnl(sa)
      const lb = lnl(sb)
      // limite k-means: due medie, σ comune, prior uguali
      const mu1 = rng.int(2, 4)
      const mu2 = mu1 + 3
      const xk = r(mu1 + rng.pick([0.5, 1]), 1)
      const post = (s: number) => posterior(xk, { P: [0.5, 0.5], m: [mu1, mu2], s2: [s * s, s * s] })[0]
      const p1 = post(1)
      const p03 = post(0.3)
      return {
        prompt: md`**Prima parte.** Dati 1-D: $X = \{${elenco(xs, 1)}\}$. Mistura di due modi: il modo 1 è centrato sul campione $x_${jj + 1} = ${f(xs[jj], 1)}$ con deviazione standard $\sigma$ e prior $P_1 = ${f(P1, 2)}$; il modo 2 è fisso, con media e varianza globali dei dati ($m_2 = ${f(media, 3)}$, $\sigma_2^2 = ${f(varianza, 3)}$) e prior $P_2 = ${f(P2, 2)}$. Calcola (a) il termine $\ln\frac{P_1}{\sqrt{2\pi}\,\sigma}$ per $\sigma = ${f(sa, 3)}$, (b) la log-verosimiglianza della mistura per $\sigma = ${f(sa, 3)}$ e (c) per $\sigma = ${f(sb, 4)}$.

**Seconda parte.** Due modi con prior uguali, medie $${mu1}$ e $${mu2}$ e la stessa $\sigma$. Calcola la posterior del modo 1 per $x = ${f(xk, 1)}$ con (d) $\sigma = 1$ e (e) $\sigma = 0.3$.

Poi, a voce: che cosa dice questo sul «massimo globale di $L(\boldsymbol{\theta})$» della slide 75? Perché EM può esserne attratto nonostante la crescita monotona della slide 74, e con quali rimedi? Che cosa diventa EM per $\sigma \to 0$ con covarianze $\sigma^2 I$ comuni?`,
        answers: [
          risposta('(a) termine del campione agganciato', T, 0.01),
          risposta(md`(b) $\ln l$ con $\sigma = ${f(sa, 3)}$`, la, 0.02),
          risposta(md`(c) $\ln l$ con $\sigma = ${f(sb, 4)}$`, lb, 0.02),
          risposta('(d) posterior con σ = 1', p1, 0.005),
          risposta('(e) posterior con σ = 0.3', p03, 0.005),
        ],
        solution: md`**(a)** Il campione $x_${jj + 1}$ è proprio al centro del modo 1, dove la gaussiana vale $\frac{1}{\sqrt{2\pi}\,\sigma}$: il suo contributo è almeno $\ln\frac{P_1}{\sqrt{2\pi}\,\sigma} = \ln\frac{${f(P1, 2)}}{\sqrt{2\pi} \cdot ${f(sa, 3)}} = ${f(T, 4)}$. Con $\sigma = ${f(sb, 4)}$ sale a $${f(Math.log(P1 / (Math.sqrt(2 * Math.PI) * sb)), 4)}$: ogni divisione di $\sigma$ per 10 aggiunge $\ln 10 = 2.303$.

**(b), (c)** Gli altri campioni sono spiegati dal modo 2 (il modo 1, strettissimo, lì vale quasi zero), quindi i loro termini non cambiano: $\ln l = ${f(la, 4)}$ con $\sigma = ${f(sa, 3)}$ e $\ln l = ${f(lb, 4)}$ con $\sigma = ${f(sb, 4)}$. Per $\sigma \to 0$:

$$\ln l(\boldsymbol{\theta} \mid \mathbf{X}) \ge \ln\frac{P_1}{\sqrt{2\pi}\,\sigma} + \sum_{r \neq ${jj + 1}} \ln\left[P_2\,p(x_r \mid m_2, \sigma_2^2)\right] \xrightarrow[\sigma \to 0]{} +\infty$$

**Il massimo globale non esiste.** Con covarianze libere la verosimiglianza della mistura non è limitata superiormente: la frase della slide 75 sul massimo globale di $L(\boldsymbol{\theta})$ va letta come «un massimo locale non degenere». Queste soluzioni degeneri (una campana su un solo punto) non hanno significato: è overfitting estremo.

**Perché EM ci può cadere.** La monotonia della slide 74 garantisce solo che $l$ non scende. Se EM parte vicino a una soluzione degenere, ogni passo fa salire $l$ proprio verso la degenerazione, fino a una varianza nulla (covarianza singolare). Rimedi: imporre un minimo alle varianze (per esempio $\Sigma_i + \varepsilon I$) o ripartire da un'altra inizializzazione.

**(d), (e) Il limite k-means.** Con $\Sigma_i = \sigma^2 I$ comune e prior uguali i fattori di normalizzazione si semplificano:

$$P(1 \mid x) = \frac{\exp\left(-\frac{(x - ${mu1})^2}{2\sigma^2}\right)}{\exp\left(-\frac{(x - ${mu1})^2}{2\sigma^2}\right) + \exp\left(-\frac{(x - ${mu2})^2}{2\sigma^2}\right)}$$

Con $\sigma = 1$ vale $${f(p1, 4)}$, con $\sigma = 0.3$ vale $${1 - p03 < 5e-5 ? md`1 - ${g(1 - p03, 3)}` : f(p03, 4)}$: stringendo le campane la posterior va a 1 per il modo con la media più vicina e a 0 per l'altro (con prior positivi qualsiasi il risultato al limite è lo stesso). L'M-step delle medie diventa la media dei campioni assegnati: EM si riduce al k-means, con assegnazione dura. È il caso simmetrico delle etichette note: lì le posterior valevano 0 o 1 perché conoscevo $\mathbf{Y}$, qui perché le campane sono strettissime.`,
      }
    },
  },
]
