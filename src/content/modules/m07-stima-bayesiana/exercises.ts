// Esercizi generativi del modulo m07 (stima bayesiana, confronto ML contro Bayes): uno per ogni esercizio
// dell'inventario (es01-es18). Ogni generatore usa solo rng: stesso seed, stessa istanza. I conti stanno in
// `calcoli`, così uno script di verifica può confrontarli con gli esempi di riferimento dell'inventario.
import { md } from '../../types'
import type { Exercise, ExerciseAnswer, Rng } from '../../types'

// ---------------------------------------------------------------------------------------------------
// Calcoli
// ---------------------------------------------------------------------------------------------------

/** Posterior della media gaussiana con σ² nota e prior N(μ0, σ0²) (ch2 p37). */
const posterior = (N: number, xbar: number, s2: number, mu0: number, s02: number) => {
  const den = N * s02 + s2
  const w = (N * s02) / den
  const wp = s2 / den
  return { den, w, wp, muN: w * xbar + wp * mu0, s2N: (s02 * s2) / den }
}

/** Funzione errore (Abramowitz-Stegun 7.1.26, errore assoluto < 1.5e-7). */
const erf = (x: number) => {
  const s = x < 0 ? -1 : 1
  const a = Math.abs(x)
  const t = 1 / (1 + 0.3275911 * a)
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a)
  return s * y
}
/** Funzione di ripartizione della normale standard. */
const Phi = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2))
/** Densità N(m, v) in x (v è la varianza). */
const gauss = (x: number, m: number, v: number) => Math.exp(-((x - m) ** 2) / (2 * v)) / Math.sqrt(2 * Math.PI * v)
const somma = (xs: number[]) => xs.reduce((s, v) => s + v, 0)
const media = (xs: number[]) => somma(xs) / xs.length

/** Minimo N intero con peso dei dati ≥ w: N ≥ (w/(1−w))·σ²/σ0² (r = w/(1−w) esatto). */
const nPerPeso = (r: number, s2: number, s02: number) => Math.max(1, Math.ceil((r * s2) / s02 - 1e-9))
/** Minimo N con σN² ≤ ε: N ≥ σ²/ε − σ²/σ0², mai negativo. */
const nPerVarianza = (s2: number, s02: number, eps: number) => Math.max(0, Math.ceil(s2 / eps - s2 / s02 - 1e-9))

/** Errore quadratico medio di μN come stimatore della media vera (der12). */
const mseBayes = (sigma: number, s0: number, N: number, delta: number) => {
  const w = (N * s0 * s0) / (N * s0 * s0 + sigma * sigma)
  const bias = (1 - w) * delta
  const varianza = (w * w * sigma * sigma) / N
  return { w, bias, varianza, mse: varianza + bias * bias, mseML: (sigma * sigma) / N, soglia2: 2 * s0 * s0 + (sigma * sigma) / N }
}

export const calcoli = { posterior, Phi, gauss, nPerPeso, nPerVarianza, mseBayes }

// ---------------------------------------------------------------------------------------------------
// Formattazione
// ---------------------------------------------------------------------------------------------------

/** Numero per il testo: al più d decimali, senza zeri inutili e mai -0. */
const f = (x: number, d = 3) => {
  const r = Number(x.toFixed(d))
  return String(r === 0 ? 0 : r)
}
/** Numero tra parentesi se negativo, per i prodotti e le somme scritte per esteso. */
const p = (x: number, d = 3) => (Number(x.toFixed(d)) < 0 ? `(${f(x, d)})` : f(x, d))
/** Tre cifre significative; i numeri molto piccoli o molto grandi in forma m · 10^e (LaTeX). */
const sci = (x: number, sig = 3) => {
  if (x === 0) return '0'
  let e = Math.floor(Math.log10(Math.abs(x)))
  if (e >= -3 && e <= 5) return String(Number(x.toPrecision(sig)))
  let m = Number((x / 10 ** e).toPrecision(sig))
  if (Math.abs(m) >= 10) {
    m /= 10
    e += 1
  }
  return md`${m} \cdot 10^{${e}}`
}
/** Tolleranza: relativa, con un minimo assoluto. */
const tol = (v: number, rel = 0.01, abs = 0.001) => Math.max(abs, Math.abs(v) * rel)
const risposta = (label: string, value: number, tolerance = tol(value)): ExerciseAnswer => ({ label, value, tolerance })
const elenco = (xs: number[], d = 1) => xs.map((x) => f(x, d)).join(',\\ ')
/** Tre pesi distinti in centesimi che sommano a 1, ciascuno almeno 0.15. */
const trePesi = (rng: Rng, distinti: boolean): number[] => {
  for (let t = 0; t < 20; t++) {
    const a = rng.int(15, 60)
    const b = rng.int(15, 85 - a)
    const c = 100 - a - b
    if (!distinti || (a !== b && a !== c && b !== c)) return [a / 100, b / 100, c / 100]
  }
  return [0.2, 0.5, 0.3]
}

// ---------------------------------------------------------------------------------------------------
// Dati degli esercizi concettuali
// ---------------------------------------------------------------------------------------------------

interface Affermazione {
  testo: string
  perche: string
}

const AFF_VERE: Affermazione[] = [
  {
    testo: md`In ML il vettore dei parametri $\boldsymbol{\theta}$ è fisso ma ignoto; nella stima bayesiana è una variabile aleatoria con una densità a priori $p(\boldsymbol{\theta})$.`,
    perche: md`È la differenza concettuale da cui parte la stima bayesiana: l'incertezza su $\boldsymbol{\theta}$ si descrive con una densità invece di essere ignorata.`,
  },
  {
    testo: md`ML stima un punto nello spazio dei parametri; la stima bayesiana stima una distribuzione $p(\mathbf{x}\,|\,\boldsymbol{X})$ da cui si inferisce $\boldsymbol{\theta}$.`,
    perche: md`È la prima riga della slide del confronto. Nel caso gaussiano da $p(\mathbf{x}\,|\,\boldsymbol{X}) \sim N(\mu_N, \sigma^2 + \sigma_N^2)$ si legge $\mu = \mu_N$.`,
  },
  {
    testo: md`Con infiniti campioni di training ML e Bayes danno la stessa soluzione, se il prior non esclude il valore vero.`,
    perche: md`Equivalenza asintotica: $\mu_N \to \bar{X}$ e $\sigma_N^2 \to 0$, purché $\sigma_0^2 > 0$.`,
  },
  {
    testo: md`Se il prior $p(\boldsymbol{\theta})$ è uniforme, il massimo della posterior coincide con la stima ML.`,
    perche: md`La costante del prior si semplifica nella formula di Bayes: la posterior è la verosimiglianza normalizzata e ha lo stesso massimo.`,
  },
  {
    testo: md`In pratica ML è spesso preferita perché costa meno: cerca un massimo invece di integrare sull'intero spazio dei parametri.`,
    perche: md`È il primo motivo della slide: minore complessità computazionale.`,
  },
  {
    testo: md`ML è più facile da interpretare perché produce un solo valore dei parametri.`,
    perche: md`È il secondo motivo della slide: interpretabilità più facile, utile per una predizione diretta.`,
  },
  {
    testo: md`La stima bayesiana permette di usare il parere di un esperto, e questo aiuta soprattutto quando i dati sono scarsi.`,
    perche: md`Primo vantaggio della stima bayesiana nelle note: incorporare conoscenza a priori.`,
  },
  {
    testo: md`La stima bayesiana fornisce tutta la posterior, quindi permette di dare intervalli di credibilità sul parametro.`,
    perche: md`Secondo vantaggio nelle note: quantificare l'incertezza, per esempio con $\mu_N \pm 1.96\,\sigma_N$ al 95%.`,
  },
]

const AFF_FALSE: Affermazione[] = [
  {
    testo: md`La stima bayesiana è sempre migliore di ML, perché usa più informazione.`,
    perche: md`Un prior sbagliato e troppo sicuro peggiora la stima: nel caso gaussiano Bayes batte ML solo se $(\mu_0 - \mu_{\text{vera}})^2 < 2\sigma_0^2 + \sigma^2/N$.`,
  },
  {
    testo: md`Con prior uniforme anche la densità predittiva coincide, per ogni $N$, con il modello in cui si inserisce la stima ML.`,
    perche: md`Coincide la stima del parametro, $\mu_N = \bar{X}$, ma la predittiva ha varianza $\sigma^2 + \sigma^2/N$ invece di $\sigma^2$.`,
  },
  {
    testo: md`ML e Bayes coincidono quando il prior è molto stretto ($\sigma_0^2 \to 0$).`,
    perche: md`È il caso opposto: con un prior dogmatico $\mu_N \to \mu_0$ e i dati non contano. Le due stime coincidono con un prior molto largo.`,
  },
  {
    testo: md`Nella stima bayesiana i campioni entrano in $p(\mathbf{x}\,|\,\boldsymbol{X})$ sia attraverso $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ sia attraverso la posterior.`,
    perche: md`Entrano solo attraverso la posterior $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$: $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ ha forma nota e non dipende dai dati.`,
  },
  {
    testo: md`ML è preferita in pratica perché è non distorta per qualunque $N$.`,
    perche: md`A $N$ finito può essere distorta, per esempio $E\{\hat{\Sigma}\} = \frac{N-1}{N}\Sigma$. I motivi della slide sono costo e interpretabilità.`,
  },
  {
    testo: md`La stima bayesiana non richiede di conoscere la forma della densità $p(\mathbf{x}\,|\,\boldsymbol{\theta})$.`,
    perche: md`La prima ipotesi dice il contrario: la forma è nota, solo il valore di $\boldsymbol{\theta}$ è ignoto. Senza forma nota si passa alla stima non parametrica.`,
  },
  {
    testo: md`La stima bayesiana costa meno di ML perché non deve massimizzare nulla.`,
    perche: md`Deve calcolare e integrare distribuzioni intere, compresa la normalizzazione $\int p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})\,\mathrm{d}\boldsymbol{\theta}$.`,
  },
]

interface Variante {
  testo: string
  codice: 0 | 1 | 2 | 3
  perche: string
}

const VARIANTI_ES11: Variante[] = [
  {
    testo: md`I 6 pixel sono stati presi tutti adiacenti, nella stessa piccola macchia d'acqua: le loro riflettanze sono fortemente correlate.`,
    codice: 3,
    perche: md`Viola la terza ipotesi: i campioni non sono estratti indipendentemente. Il prodotto $\prod_k p(\mathbf{x}_k\,|\,\mu)$ conterebbe più volte la stessa informazione e la posterior risulterebbe troppo stretta.`,
  },
  {
    testo: md`La libreria spettrale non si usa: il prior sulla riflettanza media viene costruito con la media e la varianza degli stessi 6 pixel che poi entrano nella posterior.`,
    codice: 2,
    perche: md`Viola la seconda ipotesi: la conoscenza iniziale su $\boldsymbol{\theta}$ deve stare in una densità a priori nota, cioè fissata prima di considerare le osservazioni, non stimata dai campioni. Un prior costruito con gli stessi pixel usa i dati due volte: la posterior risulta troppo stretta e troppo sicura. Diverso è il caso in cui nessuno sappia nulla prima dei dati: quella mancanza di conoscenza si esprime con un prior uniforme, che è noto, e allora la stima bayesiana si riduce a quella ML (slide del confronto).`,
  },
  {
    testo: md`L'istogramma dei pixel d'acqua ha tre mode (acqua limpida, torbida, con alghe) e nessuna famiglia parametrica nota lo descrive.`,
    codice: 1,
    perche: md`Viola la prima ipotesi: la forma di $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ non è nota, la densità non si può parametrizzare e la stima bayesiana non è applicabile. Serve la stima non parametrica.`,
  },
  {
    testo: md`Anche la varianza del rumore è ignota, ma è la stessa per tutti i pixel; la libreria spettrale fornisce anche un prior noto su di essa, oltre a quello sulla riflettanza media.`,
    codice: 0,
    perche: md`Le tre ipotesi reggono con $\boldsymbol{\theta} = [\mu, \sigma^2]$: la forma resta gaussiana, la libreria dà un prior noto su entrambi i parametri e i pixel restano indipendenti. Senza il prior sulla varianza la risposta sarebbe 2, perché la seconda ipotesi chiede che tutta la conoscenza iniziale su $\boldsymbol{\theta}$ stia in una densità a priori nota. Non valgono più le formule chiuse della slide, che presuppongono $\sigma^2$ nota, e la posterior congiunta non è gaussiana.`,
  },
  {
    testo: md`I 6 pixel non sono adiacenti: sono sparsi in punti lontani tra loro dello stesso lago, nella stessa immagine, tutti in acqua aperta e omogenea.`,
    codice: 0,
    perche: md`Nessuna ipotesi violata: pixel lontani nella stessa scena omogenea si possono considerare estratti indipendentemente dalla stessa densità $p(\mathbf{x})$; la forma gaussiana e il prior restano quelli dello scenario. Se invece i pixel venissero da immagini di giorni diversi e da laghi diversi, la riflettanza media cambierebbe da un lago all'altro: i campioni non verrebbero più tutti dalla stessa densità $p(\mathbf{x})$ e la risposta sarebbe 3.`,
  },
]

interface CasoScelta {
  testo: string
  scelta: 1 | 2
  perche: string
}

// ---------------------------------------------------------------------------------------------------
// Esercizi
// ---------------------------------------------------------------------------------------------------

const SCENARI_ES01 = [
  { intro: md`La telecamera dell'impianto del pesce misura la luminosità (*lightness*) dei salmoni di un nuovo lotto`, prior: 'Dai lotti precedenti ricavi il prior' },
  { intro: md`Un sensore IoT misura la temperatura notturna di una serra, in °C`, prior: 'Dallo storico delle notti di questo mese ricavi il prior' },
  { intro: md`Un drone misura la riflettanza (in %) di un campo di mais in una banda del visibile`, prior: 'Da una libreria spettrale ricavi il prior' },
]

export const exercises: Exercise[] = [
  {
    id: 'es01',
    title: 'Calcolo della posterior della media gaussiana',
    difficulty: 1,
    kind: 'numerico',
    concepts: ['c28', 'c29', 'c30', 'c31'],
    generate: (rng) => {
      const sc = rng.pick(SCENARI_ES01)
      const sigma = rng.pick([1, 2, 3])
      const s0 = rng.float(0.5, 5, 1)
      const mu0 = rng.int(5, 15)
      const muVera = mu0 + rng.normal(0, s0)
      const N = rng.int(3, 8)
      const xs = Array.from({ length: N }, () => Number(rng.normal(muVera, sigma).toFixed(1)))
      const S = somma(xs)
      const xbar = S / N
      const s2 = sigma * sigma
      const s02 = s0 * s0
      const q = posterior(N, xbar, s2, mu0, s02)
      const sN = Math.sqrt(q.s2N)
      const prec = N / s2 + 1 / s02
      const lo = Math.min(xbar, mu0)
      const hi = Math.max(xbar, mu0)
      return {
        prompt: md`${sc.intro}. Il rumore di misura è gaussiano con deviazione standard nota $\sigma = ${sigma}$: $p(x\,|\,\mu) \sim N(\mu, \sigma^2)$ e l'unica incognita è la media $\mu$. ${sc.prior}: $p(\mu) \sim N(\mu_0, \sigma_0^2)$ con $\mu_0 = ${mu0}$ e $\sigma_0 = ${f(s0, 1)}$. Osservi $N = ${N}$ campioni indipendenti:

$$\{${elenco(xs)}\}$$

Calcola la media campionaria $\bar{X}$, il peso dei dati nella media a posteriori, $\mu_N$ e la varianza a posteriori $\sigma_N^2$.`,
        answers: [
          risposta(md`$\bar{X}$`, xbar, tol(xbar, 0.002, 0.01)),
          risposta('peso dei dati', q.w, 0.005),
          risposta(md`$\mu_N$`, q.muN, tol(q.muN, 0.003, 0.01)),
          risposta(md`$\sigma_N^2$`, q.s2N, tol(q.s2N, 0.01, 0.002)),
        ],
        solution: md`**1. Media campionaria.** $\bar{X} = \frac{1}{N}\sum_{k=1}^{N} x_k = \frac{${f(S, 2)}}{${N}} = ${f(xbar)}$.

**2. I pesi.** Il denominatore comune è $N\sigma_0^2 + \sigma^2 = ${N} \cdot ${f(s02)} + ${s2} = ${f(q.den)}$.

$$w_{\text{dati}} = \frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2} = \frac{${f(N * s02)}}{${f(q.den)}} = ${f(q.w, 4)},\qquad w_{\text{prior}} = \frac{\sigma^2}{N\sigma_0^2+\sigma^2} = \frac{${s2}}{${f(q.den)}} = ${f(q.wp, 4)}$$

I due pesi sommano a 1. ${q.w > 0.5 ? md`I dati pesano più del prior perché $N\sigma_0^2 = ${f(N * s02)}$ supera $\sigma^2 = ${s2}$.` : md`Il prior pesa ancora più dei dati: $\sigma^2 = ${s2}$ supera $N\sigma_0^2 = ${f(N * s02)}$, cioè il prior è sicuro rispetto al rumore di pochi campioni.`}

**3. Media a posteriori.**

$$\mu_N = w_{\text{dati}}\,\bar{X} + w_{\text{prior}}\,\mu_0 = ${f(q.w, 4)} \cdot ${f(xbar)} + ${f(q.wp, 4)} \cdot ${mu0} = ${f(q.muN)}$$

**4. Varianza a posteriori.**

$$\sigma_N^2 = \frac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2} = \frac{${f(s02)} \cdot ${s2}}{${f(q.den)}} = ${f(q.s2N, 4)}$$

**Controlli.** Le precisioni si sommano: $\frac{N}{\sigma^2} + \frac{1}{\sigma_0^2} = ${f(N / s2, 4)} + ${f(1 / s02, 4)} = ${f(prec, 4)}$, e $1/${f(prec, 4)} = ${f(1 / prec, 4)} = \sigma_N^2$. La media a posteriori cade tra $${f(lo)}$ e $${f(hi)}$, cioè tra la media campionaria e la media a priori, come deve.

**Lettura.** La posterior è $N(${f(q.muN)},\ ${f(q.s2N, 4)})$ e $\sigma_N = ${f(sN)}$ è più piccola sia di $\sigma_0 = ${f(s0, 1)}$ sia di $\sigma/\sqrt{N} = ${f(sigma / Math.sqrt(N))}$: combinare prior e dati riduce l'incertezza più di ciascuna fonte da sola. Un intervallo di credibilità al 95% per $\mu$ è $\mu_N \pm 1.96\,\sigma_N = ${f(q.muN)} \pm ${f(1.96 * sN)}$. La densità stimata per una nuova misura è $p(x\,|\,\boldsymbol{X}) \sim N(${f(q.muN)},\ ${f(s2 + q.s2N, 4)})$, con varianza $\sigma^2 + \sigma_N^2$.`,
      }
    },
  },
  {
    id: 'es02',
    title: 'Densità predittiva e probabilità di superare una soglia',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c38', 'c42', 'c44', 'c46', 'c47'],
    generate: (rng) => {
      const sigma = rng.pick([1, 2, 3])
      const s0 = rng.float(0.5, 5, 1)
      const mu0 = rng.int(5, 15)
      const N = rng.int(2, 10)
      const xbar = Number((mu0 + rng.normal(0, s0)).toFixed(2))
      const s2 = sigma * sigma
      const s02 = s0 * s0
      const q = posterior(N, xbar, s2, mu0, s02)
      const v = s2 + q.s2N
      const t = Number((q.muN + rng.float(0.3, 2.5, 2) * sigma).toFixed(1))
      const zB = (t - q.muN) / Math.sqrt(v)
      const PB = 1 - Phi(zB)
      const zPl = (t - q.muN) / sigma
      const Ppl = 1 - Phi(zPl)
      const zML = (t - xbar) / sigma
      const PML = 1 - Phi(zML)
      const tolP = (x: number) => Math.max(0.003, 0.03 * x)
      return {
        prompt: md`Un sensore IoT misura la temperatura di un magazzino refrigerato, in °C. Il rumore del sensore ha deviazione standard nota $\sigma = ${sigma}$; il prior sulla temperatura media è $p(\mu) \sim N(${mu0}, ${f(s02)})$. Con $N = ${N}$ letture la media campionaria vale $\bar{X} = ${f(xbar, 2)}$.

Scrivi la densità predittiva $p(x\,|\,\boldsymbol{X})$ e calcola la probabilità che la prossima lettura superi la soglia di allarme $t = ${f(t, 1)}$. Confrontala con quella del modello ML «plug-in» $N(\bar{X}, \sigma^2)$: quale coda è più pesante, e perché?`,
        answers: [
          risposta(md`$\mu_N$`, q.muN, tol(q.muN, 0.003, 0.01)),
          risposta(md`varianza predittiva $\sigma^2 + \sigma_N^2$`, v, tol(v, 0.01, 0.005)),
          risposta(md`$P\{x > t\}$ con la predittiva bayesiana`, PB, tolP(PB)),
          risposta(md`$P\{x > t\}$ con il modello ML`, PML, tolP(PML)),
        ],
        solution: md`**1. Posterior.** $N\sigma_0^2 + \sigma^2 = ${N} \cdot ${f(s02)} + ${s2} = ${f(q.den)}$, quindi

$$\mu_N = \frac{${f(N * s02)}}{${f(q.den)}}\cdot ${f(xbar, 2)} + \frac{${s2}}{${f(q.den)}}\cdot ${mu0} = ${f(q.muN)},\qquad \sigma_N^2 = \frac{${f(s02)} \cdot ${s2}}{${f(q.den)}} = ${f(q.s2N, 4)}$$

**2. Densità predittiva.** $p(x\,|\,\boldsymbol{X}) \sim N(\mu_N, \sigma^2 + \sigma_N^2) = N(${f(q.muN)},\ ${f(v, 4)})$: deviazione standard $\sqrt{${f(v, 4)}} = ${f(Math.sqrt(v))}$.

**3. Probabilità bayesiana.**

$$P\{x > t\} = 1 - \Phi\left(\frac{t - \mu_N}{\sqrt{\sigma^2 + \sigma_N^2}}\right) = 1 - \Phi\left(\frac{${f(t, 1)} - ${f(q.muN)}}{${f(Math.sqrt(v))}}\right) = 1 - \Phi(${f(zB)}) = ${f(PB, 4)}$$

**4. Modello ML.** Inserisco $\hat{\mu} = \bar{X}$ nel modello e ignoro l'incertezza sul parametro:

$$P_{ML}\{x > t\} = 1 - \Phi\left(\frac{${f(t, 1)} - ${f(xbar, 2)}}{${sigma}}\right) = 1 - \Phi(${f(zML)}) = ${f(PML, 4)}$$

**5. Perché cambiano.** Le differenze sono due, e le separo con un modello intermedio $N(\mu_N, \sigma^2)$, che dà $1 - \Phi(${f(zPl)}) = ${f(Ppl, 4)}$.

- Larghezza: la predittiva ha varianza $\sigma^2 + \sigma_N^2 = ${f(v, 4)}$ invece di $${s2}$. L'aggiunta $\sigma_N^2$ è l'incertezza residua su $\mu$, e rende la coda più pesante: ${f(PB, 4)} contro ${f(Ppl, 4)}.
- Centro: il modello ML è centrato in $\bar{X} = ${f(xbar, 2)}$, la predittiva in $\mu_N = ${f(q.muN)}$, tirata verso $\mu_0 = ${mu0}$ dal prior. ${xbar > q.muN ? md`$\bar{X}$ sta più a destra di $\mu_N$, dalla parte della soglia, e questo alza la probabilità ML.` : md`$\bar{X}$ sta più a sinistra di $\mu_N$, lontano dalla soglia, e questo abbassa la probabilità ML.`}

Qui ${PB >= PML ? md`la coda bayesiana è la più pesante: $${f(PB, 4)} > ${f(PML, 4)}$.` : md`prevale l'effetto del centro e la coda ML risulta più pesante: $${f(PML, 4)} > ${f(PB, 4)}$, anche se a parità di centro la predittiva sarebbe più larga.`} Con $N$ grande $\sigma_N^2 \to 0$ e $\mu_N \to \bar{X}$: le due probabilità coincidono.`,
      }
    },
  },
  {
    id: 'es03',
    title: 'Quanti campioni perché i dati pesino almeno una frazione w?',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c28', 'c33', 'c37'],
    generate: (rng) => {
      const sigma = rng.float(1, 10, 1)
      const s0 = rng.float(1, 20, 1)
      const c = rng.pick([
        { w: 0.5, r: 1 },
        { w: 0.8, r: 4 },
        { w: 0.9, r: 9 },
        { w: 0.95, r: 19 },
        { w: 0.99, r: 99 },
      ])
      const s2 = sigma * sigma
      const s02 = s0 * s0
      const n0 = s2 / s02
      const bound = c.r * n0
      const Nmin = nPerPeso(c.r, s2, s02)
      const wAt = (Nmin * s02) / (Nmin * s02 + s2)
      const wPrima = Nmin > 1 ? ((Nmin - 1) * s02) / ((Nmin - 1) * s02 + s2) : 0
      return {
        prompt: md`Stimi la luminosità media dei salmoni con il modello gaussiano a varianza nota: rumore $\sigma = ${f(sigma, 1)}$, prior $N(\mu_0, \sigma_0^2)$ con $\sigma_0 = ${f(s0, 1)}$. Quanti campioni servono, al minimo, perché nella media a posteriori $\mu_N$ la media campionaria $\bar{X}$ pesi almeno $w = ${c.w}$? Calcola anche il rapporto $n_0 = \sigma^2/\sigma_0^2$ e il peso effettivo dei dati con il numero di campioni trovato.`,
        answers: [
          risposta(md`$n_0 = \sigma^2/\sigma_0^2$`, n0, tol(n0, 0.01, 0.00005)),
          risposta(md`$N$ minimo`, Nmin, 0.5),
          risposta('peso dei dati con N minimo', wAt, 0.002),
        ],
        solution: md`**1. La condizione.** Il peso di $\bar{X}$ nella formula della slide è $\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}$. Chiedo che sia almeno $w$:

$$\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2} \ge w \iff N\sigma_0^2 \ge w\,(N\sigma_0^2 + \sigma^2) \iff N\sigma_0^2\,(1 - w) \ge w\,\sigma^2 \iff N \ge \frac{w}{1-w}\cdot\frac{\sigma^2}{\sigma_0^2}$$

**2. I numeri.** $\sigma^2 = ${f(s2, 2)}$, $\sigma_0^2 = ${f(s02, 2)}$, quindi $n_0 = \sigma^2/\sigma_0^2 = ${sci(n0, 4)}$ e $\frac{w}{1-w} = \frac{${c.w}}{${f(1 - c.w, 2)}} = ${c.r}$:

$$N \ge ${c.r} \cdot ${sci(n0, 4)} = ${sci(bound, 4)} \;\Rightarrow\; N_{\min} = ${Nmin}$$

**3. Verifica.** Con $N = ${Nmin}$ il peso dei dati è $\frac{${Nmin} \cdot ${f(s02, 2)}}{${Nmin} \cdot ${f(s02, 2)} + ${f(s2, 2)}} = ${f(wAt, 4)} \ge ${c.w}$${Nmin > 1 ? md`; con $N = ${Nmin - 1}$ sarebbe $${f(wPrima, 4)}$, sotto la soglia` : md`; basta già un campione perché il prior è molto vago rispetto al rumore`}.

**Lettura.** Il prior vale come $n_0$ campioni virtuali e il peso dei dati è $\frac{N}{N + n_0}$: per $w = 0.9$ servono $9\,n_0$ campioni. Se $\sigma_0$ è molto piccolo (prior molto sicuro), $n_0 = \sigma^2/\sigma_0^2$ esplode e servono moltissimi dati per spostare la stima: con $\sigma_0 = \sigma/10$ si ha $n_0 = 100$ e per $w = 0.9$ servono 900 campioni. Con un prior vago ($\sigma_0 \gg \sigma$) invece bastano pochi campioni, e l'influenza del prior sparisce in fretta.`,
      }
    },
  },
  {
    id: 'es04',
    title: 'Ricavare la formula chiave p(x|X) = ∫ p(x|θ) p(θ|X) dθ',
    difficulty: 2,
    kind: 'dimostrazione',
    concepts: ['c11', 'c12', 'c13', 'c14', 'c15', 'c16', 'c17'],
    generate: (rng) => {
      const sigma = rng.pick([0.5, 1, 1.5, 2])
      const c = rng.int(8, 14)
      const d = rng.pick([0.5, 1, 1.5])
      const mus = [c - d, c, c + d]
      const pis = trePesi(rng, true)
      const x = Number((c + rng.pick([-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2])).toFixed(1))
      const g = mus.map((m) => gauss(x, m, sigma * sigma))
      const pB = somma(g.map((gi, j) => pis[j] * gi))
      const jMax = pis.indexOf(Math.max(...pis))
      const pPlug = g[jMax]
      return {
        prompt: md`**Parte 1.** Partendo da $p(\mathbf{x}\,|\,\boldsymbol{X})$ ricava

$$p(\mathbf{x}\,|\,\boldsymbol{X}) = \int p(\mathbf{x}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}$$

giustificando ciascuno dei tre passaggi, e spiega perché è una media pesata e perché i dati entrano solo attraverso la posterior.

**Parte 2.** Per vedere la media pesata con i numeri, discretizza: la luminosità dei salmoni segue $p(x\,|\,\mu) \sim N(\mu, \sigma^2)$ con $\sigma = ${sigma}$, e dopo i dati la posterior dice che $\mu$ vale $${f(mus[0])}$, $${f(mus[1])}$ o $${f(mus[2])}$ con probabilità $${pis[0]}$, $${pis[1]}$ e $${pis[2]}$. Calcola $p(x\,|\,\boldsymbol{X})$ in $x = ${f(x, 1)}$ e confrontalo con $p(x\,|\,\hat{\mu})$, dove $\hat{\mu}$ è il valore più probabile di $\mu$.`,
        answers: [
          risposta(md`$p(${f(x, 1)}\,|\,\boldsymbol{X})$`, pB, tol(pB, 0.01, 0.0005)),
          risposta(md`$p(${f(x, 1)}\,|\,\hat{\mu})$`, pPlug, tol(pPlug, 0.01, 0.0005)),
        ],
        solution: md`**1. Marginalizzazione.** $\boldsymbol{\theta}$ è una variabile aleatoria di valore ignoto: la introduco nella congiunta e la integro via.

$$p(\mathbf{x}\,|\,\boldsymbol{X}) = \int p(\mathbf{x}, \boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}$$

L'integrazione si estende all'intero spazio dei parametri: se $\boldsymbol{\theta}$ è un vettore è un integrale multiplo su tutte le componenti.

**2. Regola del prodotto (teorema di Bayes).** Con tutto condizionato a $\boldsymbol{X}$, $p(\mathbf{x}, \boldsymbol{\theta}\,|\,\boldsymbol{X}) = p(\mathbf{x}\,|\,\boldsymbol{\theta}, \boldsymbol{X})\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$:

$$p(\mathbf{x}\,|\,\boldsymbol{X}) = \int p(\mathbf{x}\,|\,\boldsymbol{\theta}, \boldsymbol{X})\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}$$

**3. Noto $\boldsymbol{\theta}$ tolgo $\boldsymbol{X}$.** La forma di $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ è nota (prima ipotesi): fissato $\boldsymbol{\theta}$ la distribuzione di $\mathbf{x}$ è completamente nota e i campioni non aggiungono nulla, quindi $p(\mathbf{x}\,|\,\boldsymbol{\theta}, \boldsymbol{X}) = p(\mathbf{x}\,|\,\boldsymbol{\theta})$ e ottengo la formula chiave.

**4. Interpretazione.** L'integrale è la forma continua di una somma: la formula fa la media di $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ su tutti i valori di $\boldsymbol{\theta}$, pesata da $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$. $\boldsymbol{X}$ compare solo nella posterior, che è quindi l'unico canale dei dati; il problema diventa calcolare $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$.

**Parte 2.** Con tre valori l'integrale diventa una somma: $p(x\,|\,\boldsymbol{X}) = \sum_{j=1}^{3} p(x\,|\,\mu_j)\,P(\mu_j\,|\,\boldsymbol{X})$. Le tre campane in $x = ${f(x, 1)}$ valgono

$$p(x\,|\,${f(mus[0])}) = ${f(g[0], 4)},\qquad p(x\,|\,${f(mus[1])}) = ${f(g[1], 4)},\qquad p(x\,|\,${f(mus[2])}) = ${f(g[2], 4)}$$

$$p(x\,|\,\boldsymbol{X}) = ${pis[0]} \cdot ${f(g[0], 4)} + ${pis[1]} \cdot ${f(g[1], 4)} + ${pis[2]} \cdot ${f(g[2], 4)} = ${f(pB, 4)}$$

Il valore più probabile è $\hat{\mu} = ${f(mus[jMax])}$ (probabilità $${pis[jMax]}$), e il modello con quel solo valore dà $p(x\,|\,\hat{\mu}) = ${f(pPlug, 4)}$. ${pB > pPlug ? md`La media pesata è più alta: in $x = ${f(x, 1)}$ contribuiscono anche le campane degli altri valori plausibili di $\mu$.` : md`La media pesata è più bassa: parte del peso va a valori di $\mu$ con campane più lontane da $x = ${f(x, 1)}$.`} Scegliere un solo valore, come fa ML, ignora l'incertezza residua su $\mu$.`,
      }
    },
  },
  {
    id: 'es05',
    title: 'Dal prodotto di gaussiane a μN e σN²',
    difficulty: 3,
    kind: 'dimostrazione',
    concepts: ['c25', 'c26', 'c27', 'c28', 'c29', 'c30'],
    generate: (rng) => {
      const s2 = rng.pick([0.25, 1, 4, 9])
      const s02 = rng.pick([0.5, 1, 2, 4])
      const N = rng.int(2, 12)
      const mu0 = rng.float(-5, 5, 1)
      const xbar = Number((mu0 + rng.normal(0, Math.sqrt(s02))).toFixed(2))
      const S = Number((N * xbar).toFixed(2))
      const A = N / s2 + 1 / s02
      const B = S / s2 + mu0 / s02
      const muN = B / A
      const s2N = 1 / A
      const q = posterior(N, S / N, s2, mu0, s02)
      return {
        prompt: md`Un sensore di pressione ha un offset $\mu$ ignoto (in hPa). Le letture di confronto con uno strumento di riferimento seguono $p(x_k\,|\,\mu) \sim N(\mu, \sigma^2)$ con $\sigma^2 = ${s2}$; il prior del produttore è $p(\mu) \sim N(\mu_0, \sigma_0^2)$ con $\mu_0 = ${f(mu0, 1)}$ e $\sigma_0^2 = ${s02}$.

(a) Partendo da $p(\mu\,|\,\boldsymbol{X}) = \alpha\prod_{k=1}^{N}p(x_k\,|\,\mu)\,p(\mu)$ arriva alla forma

$$p(\mu\,|\,\boldsymbol{X}) = \alpha''\exp\left\{-\frac{1}{2}\left[\left(\frac{N}{\sigma^2}+\frac{1}{\sigma_0^2}\right)\mu^2 - 2\left(\frac{1}{\sigma^2}\sum_{k=1}^{N}x_k + \frac{\mu_0}{\sigma_0^2}\right)\mu\right]\right\}$$

dicendo quali termini finiscono nelle costanti. (b) Spiega perché è una gaussiana. (c) Identifica $1/\sigma_N^2$ e $\mu_N/\sigma_N^2$ e ricava le due equazioni della slide. (d) Verifica che i pesi di $\mu_N$ sommano a 1.

Con $N = ${N}$ letture e $\sum_k x_k = ${f(S, 2)}$ calcola il coefficiente $A$ di $\mu^2$ e il coefficiente $B$ del termine $-2B\mu$ nella parentesi quadra, poi $\mu_N$ e $\sigma_N^2$.`,
        answers: [
          risposta(md`$A = \frac{N}{\sigma^2} + \frac{1}{\sigma_0^2}$`, A, tol(A, 0.005, 0.001)),
          risposta(md`$B = \frac{1}{\sigma^2}\sum_k x_k + \frac{\mu_0}{\sigma_0^2}$`, B, tol(B, 0.005, 0.01)),
          risposta(md`$\mu_N$`, muN, tol(muN, 0.005, 0.01)),
          risposta(md`$\sigma_N^2$`, s2N, tol(s2N, 0.01, 0.001)),
        ],
        solution: md`**(a) Dal prodotto alla forma quadratica.** Sostituisco le densità:

$$p(\mu\,|\,\boldsymbol{X}) = \alpha\prod_{k=1}^{N}\frac{1}{\sqrt{2\pi}\sigma}\exp\left[-\frac{1}{2}\left(\frac{x_k-\mu}{\sigma}\right)^2\right]\cdot\frac{1}{\sqrt{2\pi}\sigma_0}\exp\left[-\frac{1}{2}\left(\frac{\mu-\mu_0}{\sigma_0}\right)^2\right]$$

Il prodotto di esponenziali è l'esponenziale della somma; i fattori $\frac{1}{\sqrt{2\pi}\sigma}$ e $\frac{1}{\sqrt{2\pi}\sigma_0}$ entrano in $\alpha'$:

$$p(\mu\,|\,\boldsymbol{X}) = \alpha'\exp\left[-\frac{1}{2}\left(\sum_{k=1}^{N}\frac{(x_k-\mu)^2}{\sigma^2} + \frac{(\mu-\mu_0)^2}{\sigma_0^2}\right)\right]$$

Sviluppo: $\sum_k (x_k - \mu)^2 = \sum_k x_k^2 - 2\mu\sum_k x_k + N\mu^2$ e $(\mu - \mu_0)^2 = \mu^2 - 2\mu\mu_0 + \mu_0^2$. I termini $\frac{1}{\sigma^2}\sum_k x_k^2$ e $\frac{\mu_0^2}{\sigma_0^2}$ non contengono $\mu$: danno un fattore $\exp(\cdot)$ costante in $\mu$ che finisce in $\alpha''$. Raccogliendo $\mu^2$ e $\mu$ ottengo la forma della slide.

**(b) È una gaussiana.** L'esponente è un polinomio di secondo grado in $\mu$ con coefficiente di $\mu^2$ pari a $-\frac{1}{2}\left(\frac{N}{\sigma^2}+\frac{1}{\sigma_0^2}\right) < 0$: una densità con logaritmo quadratico e concavo è una gaussiana, $p(\mu\,|\,\boldsymbol{X}) \sim N(\mu_N, \sigma_N^2)$.

**(c) Identificazione.** La gaussiana canonica ha esponente $-\frac{1}{2}\frac{(\mu-\mu_N)^2}{\sigma_N^2} = -\frac{1}{2}\left[\frac{1}{\sigma_N^2}\mu^2 - 2\frac{\mu_N}{\sigma_N^2}\mu + \frac{\mu_N^2}{\sigma_N^2}\right]$, e l'ultimo termine va nella costante. Confronto i coefficienti:

$$\frac{1}{\sigma_N^2} = \frac{N}{\sigma^2}+\frac{1}{\sigma_0^2} = \frac{N\sigma_0^2+\sigma^2}{\sigma^2\sigma_0^2} \;\Rightarrow\; \sigma_N^2 = \frac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2}$$

$$\frac{\mu_N}{\sigma_N^2} = \frac{N}{\sigma^2}\bar{X} + \frac{\mu_0}{\sigma_0^2} \;\Rightarrow\; \mu_N = \frac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2}\left(\frac{N\bar{X}}{\sigma^2} + \frac{\mu_0}{\sigma_0^2}\right) = \frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}\,\bar{X} + \frac{\sigma^2}{N\sigma_0^2+\sigma^2}\,\mu_0$$

dove ho usato $\sum_k x_k = N\bar{X}$.

**(d) Pesi.** $\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2} + \frac{\sigma^2}{N\sigma_0^2+\sigma^2} = \frac{N\sigma_0^2+\sigma^2}{N\sigma_0^2+\sigma^2} = 1$: $\mu_N$ è una media pesata di $\bar{X}$ e $\mu_0$.

**Numeri.**

$$A = \frac{${N}}{${s2}} + \frac{1}{${s02}} = ${f(A, 4)},\qquad B = \frac{${f(S, 2)}}{${s2}} + \frac{${f(mu0, 1)}}{${s02}} = ${f(B, 4)}$$

$$\sigma_N^2 = \frac{1}{A} = ${f(s2N, 4)},\qquad \mu_N = \frac{B}{A} = ${f(muN, 4)}$$

Controllo con le formule della slide: $\bar{X} = ${f(S / N, 4)}$, pesi $${f(q.w, 4)}$ e $${f(q.wp, 4)}$, $\mu_N = ${f(q.w, 4)} \cdot ${p(S / N, 4)} + ${f(q.wp, 4)} \cdot ${p(mu0, 1)} = ${f(q.muN, 4)}$. I passaggi completi sono nella dimostrazione [«identificazione di μN e σN²»](#derivation:der04).`,
      }
    },
  },
  {
    id: 'es06',
    title: 'Calcolare la densità predittiva gaussiana',
    difficulty: 3,
    kind: 'dimostrazione',
    concepts: ['c38', 'c39', 'c40', 'c41', 'c42'],
    generate: (rng) => {
      const s2 = rng.pick([1, 2.25, 4])
      const s2N = rng.pick([0.1, 0.25, 0.5, 1])
      const muN = rng.float(2, 12, 2)
      const sigma = Math.sqrt(s2)
      const sN = Math.sqrt(s2N)
      const x0 = Number((muN + rng.pick([-1.5, -1, -0.5, 0.5, 1, 1.5]) * sigma).toFixed(2))
      const v = s2 + s2N
      const fval = (Math.sqrt(2 * Math.PI) * sigma * sN) / Math.sqrt(v)
      const pref = fval / (2 * Math.PI * sigma * sN)
      const pPred = gauss(x0, muN, v)
      const pPlug = gauss(x0, muN, s2)
      return {
        prompt: md`Dopo i dati la posterior della luminosità media dei salmoni è $p(\mu\,|\,\boldsymbol{X}) \sim N(\mu_N, \sigma_N^2)$ con $\mu_N = ${f(muN, 2)}$ e $\sigma_N^2 = ${s2N}$; il modello è $p(x\,|\,\mu) \sim N(\mu, \sigma^2)$ con $\sigma^2 = ${s2}$.

Calcola $p(x\,|\,\boldsymbol{X}) = \int p(x\,|\,\mu)\,p(\mu\,|\,\boldsymbol{X})\,\mathrm{d}\mu$: unisci gli esponenti, completa il quadrato in $\mu$, mostra che il termine residuo in $x$ è $\frac{(x-\mu_N)^2}{\sigma^2+\sigma_N^2}$, scrivi il fattore $f(\sigma, \sigma_N)$ come l'integrale gaussiano che avanza e calcolane il valore. Poi valuta la densità predittiva in $x = ${f(x0, 2)}$ e confrontala con il modello $N(\mu_N, \sigma^2)$ che ignora l'incertezza su $\mu$.`,
        answers: [
          risposta(md`$f(\sigma, \sigma_N)$`, fval, tol(fval, 0.005, 0.001)),
          risposta(md`$\sigma^2 + \sigma_N^2$`, v, tol(v, 0.002, 0.001)),
          risposta(md`$p(${f(x0, 2)}\,|\,\boldsymbol{X})$`, pPred, tol(pPred, 0.01, 0.0005)),
          risposta(md`densità di $N(\mu_N, \sigma^2)$ in $${f(x0, 2)}$`, pPlug, tol(pPlug, 0.01, 0.0005)),
        ],
        solution: md`**1. Unisco gli esponenti.**

$$p(x\,|\,\boldsymbol{X}) = \frac{1}{2\pi\,\sigma\sigma_N}\int\exp\left[-\frac{1}{2}\left(\frac{(x-\mu)^2}{\sigma^2} + \frac{(\mu-\mu_N)^2}{\sigma_N^2}\right)\right]\mathrm{d}\mu$$

**2. Raccolgo le potenze di $\mu$.** L'esponente, a meno di $-\frac{1}{2}$, è

$$\left(\frac{1}{\sigma^2} + \frac{1}{\sigma_N^2}\right)\mu^2 - 2\left(\frac{x}{\sigma^2} + \frac{\mu_N}{\sigma_N^2}\right)\mu + \frac{x^2}{\sigma^2} + \frac{\mu_N^2}{\sigma_N^2}$$

Chiamo $s = \frac{1}{\sigma^2} + \frac{1}{\sigma_N^2} = \frac{\sigma^2+\sigma_N^2}{\sigma^2\sigma_N^2}$ e $c = \frac{1}{s}\left(\frac{x}{\sigma^2} + \frac{\mu_N}{\sigma_N^2}\right) = \frac{\sigma_N^2\,x + \sigma^2\mu_N}{\sigma^2+\sigma_N^2}$.

**3. Completo il quadrato.** L'esponente diventa $s(\mu - c)^2 + \left[\frac{x^2}{\sigma^2} + \frac{\mu_N^2}{\sigma_N^2} - s c^2\right]$. Porto la parentesi quadra a denominatore comune:

$$\frac{x^2}{\sigma^2} + \frac{\mu_N^2}{\sigma_N^2} - s\,c^2 = \frac{(\sigma^2+\sigma_N^2)(\sigma_N^2 x^2 + \sigma^2\mu_N^2) - (\sigma_N^2 x + \sigma^2\mu_N)^2}{\sigma^2\sigma_N^2(\sigma^2+\sigma_N^2)}$$

Sviluppando, i termini $\sigma_N^4 x^2$ e $\sigma^4\mu_N^2$ si cancellano e il numeratore vale $\sigma^2\sigma_N^2(x^2 - 2x\mu_N + \mu_N^2) = \sigma^2\sigma_N^2(x - \mu_N)^2$. Quindi il termine residuo è

$$\frac{(x-\mu_N)^2}{\sigma^2+\sigma_N^2}$$

**4. La parte in $x$ esce dall'integrale.**

$$p(x\,|\,\boldsymbol{X}) = \frac{1}{2\pi\,\sigma\sigma_N}\exp\left[-\frac{1}{2}\frac{(x-\mu_N)^2}{\sigma^2+\sigma_N^2}\right]f(\sigma, \sigma_N),\qquad f(\sigma, \sigma_N) = \int\exp\left[-\frac{1}{2}\,s\,(\mu - c)^2\right]\mathrm{d}\mu$$

**5. Il fattore.** È un integrale gaussiano di varianza $1/s$: $f(\sigma, \sigma_N) = \sqrt{2\pi/s} = \sqrt{2\pi}\,\frac{\sigma\sigma_N}{\sqrt{\sigma^2+\sigma_N^2}}$. Non dipende da $x$ (lo spostamento $c$ non cambia l'area). Moltiplicato per $\frac{1}{2\pi\sigma\sigma_N}$ dà $\frac{1}{\sqrt{2\pi(\sigma^2+\sigma_N^2)}}$: la densità è normalizzata e

$$p(x\,|\,\boldsymbol{X}) \sim N(\mu_N, \sigma^2+\sigma_N^2)$$

Scorciatoia: $x = \mu + \varepsilon$ con $\mu \sim N(\mu_N, \sigma_N^2)$ e $\varepsilon \sim N(0, \sigma^2)$ indipendenti; la somma di gaussiane indipendenti è gaussiana, con medie e varianze che si sommano.

**Numeri.** $\sigma\sigma_N = ${f(sigma)} \cdot ${f(sN, 4)} = ${f(sigma * sN, 4)}$ e $\sigma^2 + \sigma_N^2 = ${f(v, 4)}$:

$$f(\sigma, \sigma_N) = \sqrt{2\pi}\cdot\frac{${f(sigma * sN, 4)}}{\sqrt{${f(v, 4)}}} = ${f(fval, 4)},\qquad \frac{f(\sigma, \sigma_N)}{2\pi\sigma\sigma_N} = ${f(pref, 4)} = \frac{1}{\sqrt{2\pi \cdot ${f(v, 4)}}}$$

$$p(${f(x0, 2)}\,|\,\boldsymbol{X}) = ${f(pref, 4)}\cdot\exp\left[-\frac{(${f(x0, 2)} - ${f(muN, 2)})^2}{2 \cdot ${f(v, 4)}}\right] = ${f(pPred, 4)}$$

Il modello $N(${f(muN, 2)}, ${s2})$ dà $${f(pPlug, 4)}$. ${pPred > pPlug ? md`In questo punto, lontano dal centro, la predittiva è più alta: essendo più larga mette più massa nelle code.` : md`In questo punto, vicino al centro, la predittiva è più bassa: essendo più larga ha il picco più basso e sposta massa verso le code.`} La differenza nasce da $\sigma_N^2 = ${s2N}$, l'incertezza residua su $\mu$.`,
      }
    },
  },
  {
    id: 'es07',
    title: 'ML contro Bayes: la risposta da orale',
    difficulty: 1,
    kind: 'concettuale',
    concepts: ['c02', 'c03', 'c46', 'c47', 'c48', 'c49', 'c50', 'c51', 'c52', 'c53'],
    generate: (rng) => {
      const nv = rng.int(2, 3)
      const vere = rng.shuffle(AFF_VERE).slice(0, nv).map((a) => ({ ...a, vera: true }))
      const false_ = rng.shuffle(AFF_FALSE).slice(0, 5 - nv).map((a) => ({ ...a, vera: false }))
      const lista = rng.shuffle([...vere, ...false_])
      const codice = lista.reduce((s, a, i) => s + (a.vera ? 2 ** i : 0), 0)
      const righe = lista.map((a, i) => `${i + 1}. ${a.testo}`).join('\n')
      const spiegazioni = lista.map((a, i) => `${i + 1}. **${a.vera ? 'Vera' : 'Falsa'}** (vale ${a.vera ? 2 ** i : 0}). ${a.perche}`).join('\n')
      return {
        prompt: md`Melgani chiede: «la stima ML è migliore o peggiore di quella bayesiana, e perché?» e «in quale caso ML e Bayes coincidono?». Prima di rispondere a voce, classifica queste affermazioni:

${righe}

Quante sono vere? Poi scrivi il codice delle vere: somma 1 se è vera la prima, 2 se è vera la seconda, 4 per la terza, 8 per la quarta, 16 per la quinta.`,
        answers: [risposta('numero di affermazioni vere', nv, 0.5), risposta('codice delle vere', codice, 0.5)],
        solution: md`${spiegazioni}

Vere: ${nv}, codice ${codice}.

**Scaletta per l'orale.**

- In ML $\boldsymbol{\theta}$ è fisso ma ignoto e la stima è un punto; nella stima bayesiana $\boldsymbol{\theta}$ è aleatorio, il prior diventa posterior e si stima una distribuzione $p(\mathbf{x}\,|\,\boldsymbol{X})$.
- Coincidono con infiniti campioni ($\mu_N \to \bar{X}$, $\sigma_N^2 \to 0$, se il prior non esclude il valore vero) o con prior uniforme (la costante si semplifica e il massimo della posterior è la stima ML).
- In pratica si preferisce ML: minore complessità computazionale e interpretabilità più facile.
- Bayes conviene con pochi dati e conoscenza a priori affidabile, e quando serve quantificare l'incertezza con un intervallo di credibilità.
- Nessuna delle due è migliore in assoluto: un prior sbagliato e troppo sicuro fa peggio di ML.`,
      }
    },
  },
  {
    id: 'es08',
    title: 'Perché la posterior è ancora gaussiana?',
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c26', 'c27'],
    generate: (rng) => {
      const s2 = rng.pick([1, 4])
      const sigma = Math.sqrt(s2)
      const N = rng.int(3, 5)
      const s02 = rng.pick([1, 2, 4])
      const mu0 = rng.int(8, 12)
      const muVera = mu0 + rng.float(-2, 2, 1)
      const xs = Array.from({ length: N }, () => Number(rng.normal(muVera, sigma).toFixed(1)))
      const xbar = media(xs)
      const q = posterior(N, xbar, s2, mu0, s02)
      const prec = N / s2 + 1 / s02
      const sML = sigma / Math.sqrt(N)
      const L = Math.max(0.4, Number((rng.float(1.5, 3) * sML).toFixed(1)))
      const caso = rng.pick(['dentro', 'dentro', 'destra', 'sinistra'])
      const a =
        caso === 'dentro'
          ? Number((xbar - rng.float(0.25, 0.75) * L).toFixed(1))
          : caso === 'destra'
            ? Number((xbar + rng.float(0.3, 1.5) * sML).toFixed(1))
            : Number((xbar - L - rng.float(0.3, 1.5) * sML).toFixed(1))
      const b = Number((a + L).toFixed(1))
      const map = Math.min(b, Math.max(a, xbar))
      const massa = Phi((b - xbar) / sML) - Phi((a - xbar) / sML)
      const posizione = xbar < a ? 'sinistra' : xbar > b ? 'destra' : 'dentro'
      return {
        prompt: md`Passerini chiede: «why do we obtain a Gaussian also as posterior?». Rispondi con le parabole. La luminosità dei salmoni segue $N(\mu, \sigma^2)$ con $\sigma^2 = ${s2}$; osservi $${elenco(xs)}$; il prior è $N(${mu0}, ${s02})$.

(a) Ogni campione contribuisce al logaritmo della posterior con una parabola in $\mu$, e il prior con un'altra. Qual è il vertice della loro somma? (b) Quanto vale la sua curvatura, cioè il coefficiente $A$ di $-\frac{1}{2}A\mu^2$? (c) Se il prior fosse uniforme su $[${f(a, 1)}, ${f(b, 1)}]$, dove cadrebbe il massimo della posterior, e la posterior sarebbe gaussiana? (d) Con quel prior uniforme, quale frazione dell'area della verosimiglianza normalizzata cade in $[${f(a, 1)}, ${f(b, 1)}]$?`,
        answers: [
          risposta('(a) vertice della somma di parabole', q.muN, tol(q.muN, 0.003, 0.01)),
          risposta(md`(b) curvatura $A$`, prec, tol(prec, 0.005, 0.001)),
          risposta('(c) massimo con prior uniforme', map, tol(map, 0.002, 0.01)),
          risposta('(d) frazione di area nell\'intervallo', massa, 0.005),
        ],
        solution: md`**Le parabole.** Il logaritmo della posterior è, a meno di una costante,

$$\ln p(\mu\,|\,\boldsymbol{X}) = -\sum_{k=1}^{N}\frac{(x_k - \mu)^2}{2\sigma^2} - \frac{(\mu - \mu_0)^2}{2\sigma_0^2} + \text{cost.}$$

Ogni campione dà una parabola rivolta verso il basso con vertice in $x_k$ e curvatura $1/\sigma^2$; il prior una con vertice in $\mu_0$ e curvatura $1/\sigma_0^2$. Una somma di parabole è ancora una parabola: l'esponente resta quadratico in $\mu$ e l'esponenziale di una parabola rivolta verso il basso è una gaussiana. Per questo la posterior è gaussiana: prior gaussiano e verosimiglianza gaussiana in $\mu$ (prior coniugato).

**(b) Curvatura.** Le curvature si sommano: $A = \frac{N}{\sigma^2} + \frac{1}{\sigma_0^2} = \frac{${N}}{${s2}} + \frac{1}{${s02}} = ${f(prec, 4)} = \frac{1}{\sigma_N^2}$, quindi $\sigma_N^2 = ${f(q.s2N, 4)}$.

**(a) Vertice.** Annullo la derivata: $\sum_k \frac{x_k - \mu}{\sigma^2} + \frac{\mu_0 - \mu}{\sigma_0^2} = 0$, cioè

$$\mu = \frac{\frac{1}{\sigma^2}\sum_k x_k + \frac{\mu_0}{\sigma_0^2}}{\frac{N}{\sigma^2} + \frac{1}{\sigma_0^2}} = \frac{${f(somma(xs) / s2, 4)} + ${f(mu0 / s02, 4)}}{${f(prec, 4)}} = ${f(q.muN)} = \mu_N$$

Il vertice è la media dei vertici pesata con le curvature: è la formula di $\mu_N$ della slide, con $\bar{X} = ${f(xbar)}$.

**(c) Prior uniforme.** Il logaritmo del prior vale una costante in $[${f(a, 1)}, ${f(b, 1)}]$ e $-\infty$ fuori. La posterior è la verosimiglianza, una gaussiana $N(\bar{X}, \sigma^2/N) = N(${f(xbar)}, ${f(s2 / N, 4)})$ in $\mu$, tagliata all'intervallo: una gaussiana troncata, non una gaussiana, perché ha supporto limitato e salta a zero agli estremi. ${posizione === 'dentro' ? md`$\bar{X} = ${f(xbar)}$ cade dentro l'intervallo, quindi il massimo è $\bar{X}$, la stima ML.` : md`$\bar{X} = ${f(xbar)}$ cade fuori dall'intervallo, a ${posizione === 'sinistra' ? 'sinistra' : 'destra'}, quindi il massimo è sull'estremo più vicino, $${f(map, 1)}$, e non coincide con la stima ML.`}

**(d) Normalizzazione.** Con $s = \sigma/\sqrt{N} = ${f(sML, 4)}$ l'area della verosimiglianza normalizzata dentro l'intervallo è

$$\Phi\left(\frac{${f(b, 1)} - ${f(xbar)}}{${f(sML, 4)}}\right) - \Phi\left(\frac{${f(a, 1)} - ${f(xbar)}}{${f(sML, 4)}}\right) = ${f(massa, 4)}$$

e la posterior troncata si ottiene dividendo per questo numero. In generale, con un prior non coniugato, la costante di normalizzazione non ha forma chiusa e va calcolata numericamente: è uno dei costi della stima bayesiana.`,
      }
    },
  },
  {
    id: 'es09',
    title: 'Tabella dei casi limite',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c32', 'c33', 'c34', 'c37', 'c49'],
    generate: (rng) => {
      const s2 = rng.pick([1, 2, 4, 9])
      const s02 = rng.pick([0.5, 1, 2, 4])
      const mu0 = rng.float(0, 10, 1)
      const xbar = Number((mu0 + rng.float(-3, 3, 1) + (rng.next() < 0.5 ? 0.25 : -0.25)).toFixed(2))
      const N = rng.int(3, 20)
      const casi = [
        { nome: md`$N = 0$`, mu: mu0, v: s02, pred: s2 + s02 },
        { nome: md`$N \to \infty$`, mu: xbar, v: 0, pred: s2 },
        { nome: md`$\sigma_0^2 \to \infty$ con $N = ${N}$`, mu: xbar, v: s2 / N, pred: s2 * (1 + 1 / N) },
        { nome: md`$\sigma_0^2 \to 0$`, mu: mu0, v: 0, pred: s2 },
      ]
      const scelti = rng.shuffle([0, 1, 2, 3]).slice(0, 2)
      const big = 10000
      const qBig = posterior(big, xbar, s2, mu0, s02)
      const answers = scelti.flatMap((i) => {
        const c = casi[i]
        return [
          risposta(md`${c.nome}: $\mu_N$`, c.mu, tol(c.mu, 0.002, 0.01)),
          risposta(md`${c.nome}: $\sigma_N^2$`, c.v, tol(c.v, 0.01, 0.002)),
          risposta(md`${c.nome}: varianza predittiva`, c.pred, tol(c.pred, 0.01, 0.002)),
        ]
      })
      return {
        prompt: md`Nel caso gaussiano con varianza nota $\sigma^2 = ${s2}$ e prior $N(\mu_0, \sigma_0^2)$ con $\mu_0 = ${f(mu0, 1)}$ e $\sigma_0^2 = ${s02}$, i campioni hanno media $\bar{X} = ${f(xbar, 2)}$. Completa le righe dei casi ${casi[scelti[0]].nome} e ${casi[scelti[1]].nome}: media a posteriori $\mu_N$, varianza a posteriori $\sigma_N^2$ e varianza della densità predittiva $\sigma^2 + \sigma_N^2$. Nel caso ${casi[2].nome} il prior ha varianza illimitata (prior uniforme); nel caso ${casi[3].nome} il prior è certo.`,
        answers,
        solution: md`Parto dalle due equazioni della slide, $\mu_N = \frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}\bar{X} + \frac{\sigma^2}{N\sigma_0^2+\sigma^2}\mu_0$ e $\sigma_N^2 = \frac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2}$, e faccio tendere il parametro indicato.

| caso | $\mu_N$ | $\sigma_N^2$ | $\sigma^2 + \sigma_N^2$ |
|---|---|---|---|
| $N = 0$ | $\mu_0 = ${f(mu0, 1)}$ | $\sigma_0^2 = ${s02}$ | $${f(s2 + s02, 3)}$ |
| $N \to \infty$ | $\bar{X} = ${f(xbar, 2)}$ | $0$ | $\sigma^2 = ${s2}$ |
| $\sigma_0^2 \to \infty$, $N = ${N}$ | $\bar{X} = ${f(xbar, 2)}$ | $\sigma^2/N = ${f(s2 / N, 4)}$ | $\sigma^2(1 + 1/N) = ${f(s2 * (1 + 1 / N), 4)}$ |
| $\sigma_0^2 \to 0$ | $\mu_0 = ${f(mu0, 1)}$ | $0$ | $\sigma^2 = ${s2}$ |

- $N = 0$: il peso dei dati è 0 e $\sigma_N^2 = \sigma_0^2$. La posterior è il prior, l'unica informazione disponibile, e la predittiva somma rumore e incertezza del prior.
- $N \to \infty$: il peso del prior $\frac{\sigma^2}{N\sigma_0^2+\sigma^2}$ va a zero come $1/N$ e $\sigma_N^2 \to 0$: la posterior è una delta di Dirac su $\bar{X}$ e la predittiva coincide con il modello ML $N(\bar{X}, \sigma^2)$. Con $N = ${big}$, per esempio, $\mu_N = ${f(qBig.muN, 4)}$ e $\sigma_N^2 = ${sci(qBig.s2N, 3)}$.
- $\sigma_0^2 \to \infty$: dividendo per $\sigma_0^2$ il peso dei dati diventa $\frac{N}{N + \sigma^2/\sigma_0^2} \to 1$ per ogni $N \ge 1$. È il prior uniforme della slide del confronto: $\mu_N$ coincide con la stima ML, ma $\sigma_N^2 = \sigma^2/N$ resta, quindi la predittiva è più larga del modello ML.
- $\sigma_0^2 \to 0$: prior dogmatico. $\mu_N = \mu_0$ e $\sigma_N^2 = 0$ per ogni $N$: i dati non contano mai. Per questo il limite $N \to \infty$ e l'equivalenza ML-Bayes richiedono $\sigma_0^2 > 0$: i due limiti non si scambiano.`,
      }
    },
  },
  {
    id: 'es10',
    title: 'Aggiornamento sequenziale: un campione alla volta',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c04', 'c28', 'c29', 'c35'],
    generate: (rng) => {
      const sigma = rng.pick([1, 2])
      const s2 = sigma * sigma
      const mu0 = rng.int(5, 15)
      const s0 = rng.pick([1, 2, 3])
      const s02 = s0 * s0
      const n = rng.int(3, 5)
      const muVera = mu0 + rng.normal(0, s0)
      const xs = Array.from({ length: n }, () => Number(rng.normal(muVera, sigma).toFixed(1)))
      const passi: { x: number; m: number; v: number; k: number; m2: number; v2: number }[] = []
      let m = mu0
      let v = s02
      for (const x of xs) {
        const k = v / (v + s2)
        const m2 = (v * x + s2 * m) / (v + s2)
        const v2 = (v * s2) / (v + s2)
        passi.push({ x, m, v, k, m2, v2 })
        m = m2
        v = v2
      }
      const xbar = media(xs)
      const blocco = posterior(n, xbar, s2, mu0, s02)
      const righe = passi
        .map((s, i) => `| ${i + 1} | $${f(s.m, 4)}$ | $${f(s.v, 4)}$ | $${f(s.x, 1)}$ | $${f(s.k, 4)}$ | $${f(s.m2, 4)}$ | $${f(s.v2, 4)}$ |`)
        .join('\n')
      return {
        prompt: md`Un sensore misura la luminosità dei salmoni con rumore $\sigma = ${sigma}$; il prior sulla media è $N(${mu0}, ${s02})$. I campioni arrivano uno alla volta: $${elenco(xs)}$.

Aggiorna la posterior dopo ogni campione, usando la posterior precedente come prior del passo successivo, con le formule di un passo (quelle della slide con $N = 1$):

$$\mu_{N+1} = \frac{\sigma_N^2\,x_{N+1} + \sigma^2\mu_N}{\sigma_N^2 + \sigma^2},\qquad \sigma_{N+1}^2 = \frac{\sigma_N^2\,\sigma^2}{\sigma_N^2 + \sigma^2}$$

Quanto valgono la media dopo il primo campione e media e varianza finali? Verifica che coincidono con l'aggiornamento in blocco.`,
        answers: [
          risposta(md`$\mu_1$`, passi[0].m2, tol(passi[0].m2, 0.003, 0.01)),
          risposta(md`$\mu_{${n}}$`, m, tol(m, 0.003, 0.01)),
          risposta(md`$\sigma_{${n}}^2$`, v, tol(v, 0.01, 0.002)),
        ],
        solution: md`**Passo per passo.** Il peso del nuovo campione è $\frac{\sigma_N^2}{\sigma_N^2 + \sigma^2}$: grande all'inizio, quando il prior è incerto, poi sempre più piccolo.

| passo | $\mu$ prima | $\sigma^2$ prima | campione | peso del campione | $\mu$ dopo | $\sigma^2$ dopo |
|---|---|---|---|---|---|---|
${righe}

**In blocco.** $\bar{X} = ${f(xbar, 4)}$ e $N\sigma_0^2 + \sigma^2 = ${n} \cdot ${s02} + ${s2} = ${f(blocco.den)}$:

$$\mu_{${n}} = \frac{${f(n * s02)}}{${f(blocco.den)}}\cdot ${f(xbar, 4)} + \frac{${s2}}{${f(blocco.den)}}\cdot ${mu0} = ${f(blocco.muN, 4)},\qquad \sigma_{${n}}^2 = \frac{${s02} \cdot ${s2}}{${f(blocco.den)}} = ${f(blocco.s2N, 4)}$$

Stesso risultato. Il motivo: a ogni passo le precisioni si sommano, e dopo ${n} passi $\frac{1}{\sigma_{${n}}^2} = \frac{1}{\sigma_0^2} + \frac{${n}}{\sigma^2} = ${f(1 / s02, 4)} + ${f(n / s2, 4)} = ${f(1 / s02 + n / s2, 4)}$; allo stesso modo le medie pesate con le precisioni si accumulano. L'ordine dei campioni non conta. È l'idea del Bayesian learning: ogni dato converte la densità corrente in una posterior più stretta, che diventa il prior del dato successivo.`,
      }
    },
  },
  {
    id: 'es11',
    title: 'Riconoscere le tre ipotesi in uno scenario',
    difficulty: 1,
    kind: 'concettuale',
    concepts: ['c05', 'c06', 'c07', 'c08'],
    generate: (rng) => {
      const mu0 = rng.int(4, 8)
      const s0 = rng.pick([0.5, 1, 1.5])
      const sigma = rng.pick([0.5, 1])
      const muVera = mu0 + rng.normal(0, s0)
      const xs = Array.from({ length: 6 }, () => Math.max(0.1, Number(rng.normal(muVera, sigma).toFixed(1))))
      const xbar = media(xs)
      const q = posterior(6, xbar, sigma * sigma, mu0, s0 * s0)
      const variante = rng.pick(VARIANTI_ES11)
      return {
        prompt: md`Vuoi stimare la riflettanza media $\mu$ (in %) della classe acqua in una banda di un'immagine multispettrale. Hai 6 pixel etichettati come acqua: $${elenco(xs)}$. Il rumore del sensore è gaussiano con $\sigma = ${sigma}$; una libreria spettrale dà per l'acqua un prior $N(${mu0}, ${f(s0 * s0, 2)})$ sulla riflettanza media.

(a) Che cosa gioca il ruolo di $p(\mathbf{x}\,|\,\boldsymbol{\theta})$, di $p(\boldsymbol{\theta})$ e di $\boldsymbol{X}$? Calcola la media a posteriori $\mu_N$.

(b) Ora cambia una cosa. ${variante.testo} Quale delle tre ipotesi fondamentali della stima bayesiana viene violata? Rispondi 1 (forma della densità nota), 2 (prior noto), 3 (campioni estratti indipendentemente dalla densità ignota $p(\mathbf{x})$), oppure 0 se reggono tutte.`,
        answers: [risposta(md`(a) $\mu_N$`, q.muN, tol(q.muN, 0.003, 0.01)), risposta('(b) ipotesi violata', variante.codice, 0.5)],
        solution: md`**(a) I tre ingredienti.**

- $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ è il modello del pixel d'acqua, $N(\mu, \sigma^2)$ con $\sigma = ${sigma}$: forma nota, media ignota (prima ipotesi).
- $p(\boldsymbol{\theta})$ è il prior della libreria spettrale, $N(${mu0}, ${f(s0 * s0, 2)})$: conoscenza iniziale in una densità nota (seconda ipotesi).
- $\boldsymbol{X}$ sono i 6 pixel etichettati, estratti indipendentemente (terza ipotesi).

La stima bayesiana si applica perché la densità ignota si può parametrizzare. $\bar{X} = ${f(xbar, 4)}$, $N\sigma_0^2 + \sigma^2 = 6 \cdot ${f(s0 * s0, 2)} + ${f(sigma * sigma, 2)} = ${f(q.den, 4)}$:

$$\mu_N = \frac{${f(6 * s0 * s0, 2)}}{${f(q.den, 4)}}\cdot ${f(xbar, 4)} + \frac{${f(sigma * sigma, 2)}}{${f(q.den, 4)}}\cdot ${mu0} = ${f(q.muN)},\qquad \sigma_N^2 = ${f(q.s2N, 4)}$$

**(b) Risposta: ${variante.codice}.** ${variante.perche}

Promemoria delle tre ipotesi: (1) la forma di $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ è nota, il valore di $\boldsymbol{\theta}$ no; (2) la conoscenza iniziale su $\boldsymbol{\theta}$ è in una densità a priori nota $p(\boldsymbol{\theta})$; (3) il resto della conoscenza è in $N$ campioni estratti indipendentemente da $p(\mathbf{x})$.`,
      }
    },
  },
  {
    id: 'es12',
    title: 'Leggere la figura del Bayesian learning',
    difficulty: 3,
    kind: 'concettuale',
    concepts: ['c34', 'c35', 'c36'],
    generate: (rng) => {
      const s2 = rng.pick([0.5, 1, 2])
      const s02 = rng.pick([1, 2, 4])
      const N1 = 1
      const [N2, N3] = rng.shuffle([5, 10, 20, 30]).slice(0, 2)
      const picco = (N: number) => Math.sqrt((N / s2 + 1 / s02) / (2 * Math.PI))
      const h1 = Number(picco(N1).toFixed(3))
      const h2 = Number(picco(N2).toFixed(3))
      const P1 = 2 * Math.PI * h1 * h1
      const P2 = 2 * Math.PI * h2 * h2
      const s2hat = (N2 - N1) / (P2 - P1)
      const inv0 = P1 - N1 / s2hat
      const s02hat = 1 / inv0
      const P3 = N3 / s2hat + inv0
      const h3 = Math.sqrt(P3 / (2 * Math.PI))
      return {
        prompt: md`Nella figura del Bayesian learning le curve della posterior $p(\mu\,|\,x_1, \ldots, x_N)$ sono gaussiane $N(\mu_N, \sigma_N^2)$. Su una versione della figura senza etichette misuri i picchi: la curva più bassa è alta $${f(h1, 3)}$, un'altra $${f(h2, 3)}$. Sai che la più bassa corrisponde a $N = ${N1}$ e l'altra a $N = ${N2}$.

Ricava dai picchi la varianza del rumore $\sigma^2$ e la varianza del prior $\sigma_0^2$, poi prevedi l'altezza del picco per $N = ${N3}$. Spiega anche come ordinare le curve per $N$ crescente, perché i loro centri non sono allineati e a che cosa tende la curva per $N \to \infty$.`,
        answers: [
          risposta(md`$\sigma^2$`, s2hat, tol(s2hat, 0.02, 0.005)),
          risposta(md`$\sigma_0^2$`, s02hat, tol(s02hat, 0.05, 0.02)),
          risposta(md`picco per $N = ${N3}$`, h3, tol(h3, 0.02, 0.005)),
        ],
        solution: md`**1. Dal picco alla precisione.** Il picco di $N(\mu_N, \sigma_N^2)$ vale $h = \frac{1}{\sqrt{2\pi}\,\sigma_N}$, quindi $\frac{1}{\sigma_N^2} = 2\pi h^2$:

$$\frac{1}{\sigma_{${N1}}^2} = 2\pi \cdot ${f(h1, 3)}^2 = ${f(P1, 4)},\qquad \frac{1}{\sigma_{${N2}}^2} = 2\pi \cdot ${f(h2, 3)}^2 = ${f(P2, 4)}$$

**2. Retta delle precisioni.** $\frac{1}{\sigma_N^2} = \frac{N}{\sigma^2} + \frac{1}{\sigma_0^2}$ è una retta in $N$: pendenza $1/\sigma^2$, intercetta $1/\sigma_0^2$.

$$\frac{1}{\sigma^2} = \frac{${f(P2, 4)} - ${f(P1, 4)}}{${N2} - ${N1}} = ${f(1 / s2hat, 4)} \;\Rightarrow\; \sigma^2 = ${f(s2hat, 4)}$$

$$\frac{1}{\sigma_0^2} = ${f(P1, 4)} - \frac{${N1}}{${f(s2hat, 4)}} = ${f(inv0, 4)} \;\Rightarrow\; \sigma_0^2 = ${f(s02hat, 3)}$$

**3. Previsione.** $\frac{1}{\sigma_{${N3}}^2} = \frac{${N3}}{${f(s2hat, 4)}} + ${f(inv0, 4)} = ${f(P3, 3)}$, picco $\sqrt{${f(P3, 3)}/(2\pi)} = ${f(h3, 3)}$.

I valori usati per disegnare erano $\sigma^2 = ${s2}$ e $\sigma_0^2 = ${s02}$. La stima di $\sigma_0^2$ è la più fragile: l'intercetta $1/\sigma_0^2$ è piccola rispetto a $1/\sigma_{${N1}}^2$, e un errore di lettura di un millesimo sul picco la sposta di qualche per cento.

**Lettura della figura.** Le curve si ordinano per altezza: il picco cresce circa come $\sqrt{N}$ e la larghezza $\sigma_N$ cala come $1/\sqrt{N}$. I centri $\mu_N$ non sono allineati perché seguono la media campionaria, che fluttua da un $N$ all'altro, tirata sempre meno verso $\mu_0$. Per $N \to \infty$, $\sigma_N^2 \to 0$ e la curva tende a una delta di Dirac centrata sulla media campionaria: è il comportamento chiamato Bayesian learning.`,
      }
    },
  },
  {
    id: 'es13',
    title: 'Covarianza ML e corretta su un piccolo dataset 2D',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c54', 'c55', 'c57', 'c58'],
    generate: (rng) => {
      const N = rng.int(3, 5)
      let pts: [number, number][] = []
      for (let t = 0; t < 20; t++) {
        pts = Array.from({ length: N }, () => [rng.int(1, 9), rng.int(1, 6)] as [number, number])
        if (new Set(pts.map((q) => q[0])).size > 1 && new Set(pts.map((q) => q[1])).size > 1) break
      }
      const m1 = media(pts.map((q) => q[0]))
      const m2 = media(pts.map((q) => q[1]))
      const d = pts.map(([a, b]) => [a - m1, b - m2])
      const S11 = somma(d.map((q) => q[0] * q[0]))
      const S12 = somma(d.map((q) => q[0] * q[1]))
      const S22 = somma(d.map((q) => q[1] * q[1]))
      const T11 = somma(pts.map((q) => q[0] * q[0])) / N
      const T12 = somma(pts.map((q) => q[0] * q[1])) / N
      const T22 = somma(pts.map((q) => q[1] * q[1])) / N
      const ml = [S11 / N, S12 / N, S22 / N]
      const nd = [S11 / (N - 1), S12 / (N - 1), S22 / (N - 1)]
      const tv = (v: number) => tol(v, 0.005, 0.005)
      const righe = pts
        .map(([a, b], k) => `| ${k + 1} | $${a}$ | $${b}$ | $${f(d[k][0], 3)}$ | $${f(d[k][1], 3)}$ | $${f(d[k][0] ** 2, 3)}$ | $${f(d[k][0] * d[k][1], 3)}$ | $${f(d[k][1] ** 2, 3)}$ |`)
        .join('\n')
      const punti = pts.map(([a, b]) => `(${a}, ${b})`).join(',\\ ')
      return {
        prompt: md`Di $N = ${N}$ salmoni misuri luminosità $x_1$ e larghezza $x_2$: $${punti}$. Calcola la stima ML del vettore medio $\hat{\mathbf{m}}$, la stima ML della matrice di covarianza $\hat{\Sigma}$ (con $\frac{1}{N}$, verificando che le due forme delle note coincidono) e lo stimatore non distorto con $\frac{1}{N-1}$.`,
        answers: [
          risposta(md`$\hat{m}_1$`, m1, tv(m1)),
          risposta(md`$\hat{m}_2$`, m2, tv(m2)),
          risposta(md`$\hat{\Sigma}_{11}$ (ML)`, ml[0], tv(ml[0])),
          risposta(md`$\hat{\Sigma}_{12}$ (ML)`, ml[1], tv(ml[1])),
          risposta(md`$\hat{\Sigma}_{22}$ (ML)`, ml[2], tv(ml[2])),
          risposta(md`$\hat{\Sigma}_{11}$ con $\frac{1}{N-1}$`, nd[0], tv(nd[0])),
          risposta(md`$\hat{\Sigma}_{12}$ con $\frac{1}{N-1}$`, nd[1], tv(nd[1])),
          risposta(md`$\hat{\Sigma}_{22}$ con $\frac{1}{N-1}$`, nd[2], tv(nd[2])),
        ],
        solution: md`**1. Vettore medio.** $\hat{\mathbf{m}} = \frac{1}{N}\sum_k \mathbf{x}_k = (${f(m1, 4)},\ ${f(m2, 4)})$.

**2. Scarti e prodotti.** Con $d_k = \mathbf{x}_k - \hat{\mathbf{m}}$:

| $k$ | $x_1$ | $x_2$ | $d_1$ | $d_2$ | $d_1^2$ | $d_1 d_2$ | $d_2^2$ |
|---|---|---|---|---|---|---|---|
${righe}

Somme: $\sum d_1^2 = ${f(S11, 4)}$, $\sum d_1 d_2 = ${f(S12, 4)}$, $\sum d_2^2 = ${f(S22, 4)}$.

**3. Stima ML.**

$$\hat{\Sigma} = \frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t = \frac{1}{${N}}\begin{bmatrix} ${f(S11, 4)} & ${f(S12, 4)} \\ ${f(S12, 4)} & ${f(S22, 4)} \end{bmatrix} = \begin{bmatrix} ${f(ml[0], 4)} & ${f(ml[1], 4)} \\ ${f(ml[1], 4)} & ${f(ml[2], 4)} \end{bmatrix}$$

**4. Seconda forma.** $\hat{\Sigma} = \frac{1}{N}\sum_k \mathbf{x}_k\mathbf{x}_k^t - \hat{\mathbf{m}}\hat{\mathbf{m}}^t$: $\frac{1}{N}\sum x_1^2 = ${f(T11, 4)}$ e $${f(T11, 4)} - ${p(m1, 4)}^2 = ${f(T11 - m1 * m1, 4)}$; $\frac{1}{N}\sum x_1 x_2 = ${f(T12, 4)}$ e $${f(T12, 4)} - ${p(m1, 4)} \cdot ${p(m2, 4)} = ${f(T12 - m1 * m2, 4)}$; $\frac{1}{N}\sum x_2^2 = ${f(T22, 4)}$ e $${f(T22, 4)} - ${p(m2, 4)}^2 = ${f(T22 - m2 * m2, 4)}$. Stessa matrice.

**5. Stimatore non distorto.** Moltiplico per $\frac{N}{N-1} = \frac{${N}}{${N - 1}}$, cioè divido le somme per $N - 1 = ${N - 1}$:

$$\hat{\Sigma}_{\text{nd}} = \frac{1}{N-1}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t = \begin{bmatrix} ${f(nd[0], 4)} & ${f(nd[1], 4)} \\ ${f(nd[1], 4)} & ${f(nd[2], 4)} \end{bmatrix}$$

**Perché serve.** $E\{\hat{\mathbf{m}}\} = \mathbf{m}$, ma $E\{\hat{\Sigma}\} = \frac{N-1}{N}\Sigma$: con $N = ${N}$ la stima ML sottostima in media la covarianza del ${f((1 - (N - 1) / N) * 100, 1)}%. Gli scarti sono presi da $\hat{\mathbf{m}}$, calcolata sugli stessi punti, e risultano più piccoli di quelli dalla media vera. Per $N \to \infty$ il fattore tende a 1: la stima ML è asintoticamente non distorta.`,
      }
    },
  },
  {
    id: 'es14',
    title: 'Il prior come campioni virtuali',
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c28', 'c29', 'c49', 'c60'],
    generate: (rng) => {
      const k = rng.pick([1, 2, 3, 4, 5])
      const n0 = k * k
      const s0 = rng.pick([0.5, 1, 2])
      const sigma = s0 * k
      const mu0 = rng.float(5, 15, 1)
      const xbar = Number((mu0 + rng.float(-4, 4, 1) + (rng.next() < 0.5 ? 0.05 : -0.05)).toFixed(2))
      const N = rng.int(1, 40)
      const muN = (N * xbar + n0 * mu0) / (N + n0)
      const s2N = (sigma * sigma) / (N + n0)
      const q = posterior(N, xbar, sigma * sigma, mu0, s0 * s0)
      return {
        prompt: md`Mostra che la media a posteriori della slide si può scrivere

$$\mu_N = \frac{N\,\bar{X} + n_0\,\mu_0}{N + n_0},\qquad \sigma_N^2 = \frac{\sigma^2}{N + n_0},\qquad n_0 = \frac{\sigma^2}{\sigma_0^2}$$

e interpreta $n_0$. Poi usa i numeri: luminosità dei salmoni con $\sigma = ${f(sigma)}$, prior $N(\mu_0, \sigma_0^2)$ con $\mu_0 = ${f(mu0, 1)}$ e $\sigma_0 = ${s0}$, $N = ${N}$ campioni con $\bar{X} = ${f(xbar, 2)}$. Quanti campioni virtuali vale il prior? Quanto valgono $\mu_N$ e $\sigma_N^2$? Per quale $N$ la media a posteriori starebbe esattamente a metà tra $\mu_0$ e $\bar{X}$?`,
        answers: [
          risposta(md`$n_0$`, n0, tol(n0, 0.005, 0.01)),
          risposta(md`$\mu_N$`, muN, tol(muN, 0.003, 0.01)),
          risposta(md`$\sigma_N^2$`, s2N, tol(s2N, 0.01, 0.002)),
          risposta('N per cui μN sta a metà', n0, 0.5),
        ],
        solution: md`**1. La riscrittura.** Divido numeratore e denominatore dei due pesi per $\sigma_0^2$:

$$\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2} = \frac{N}{N + \sigma^2/\sigma_0^2} = \frac{N}{N + n_0},\qquad \frac{\sigma^2}{N\sigma_0^2+\sigma^2} = \frac{n_0}{N + n_0}$$

quindi $\mu_N = \frac{N\bar{X} + n_0\mu_0}{N + n_0}$. Allo stesso modo $\sigma_N^2 = \frac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2} = \frac{\sigma^2}{N + n_0}$.

**2. Interpretazione.** $\mu_N$ è la media aritmetica di $N$ campioni veri, di media $\bar{X}$, e di $n_0$ campioni virtuali tutti uguali a $\mu_0$: il prior pesa come $n_0$ osservazioni. $\sigma_N^2$ è la varianza della media di $N + n_0$ campioni. Un prior più sicuro ($\sigma_0$ piccolo) vale molti campioni virtuali e trattiene $\mu_N$; un prior vago ne vale pochi, e con $\sigma_0 \to \infty$ si ha $n_0 \to 0$ e $\mu_N = \bar{X}$: il prior uniforme della slide del confronto. È l'idea degli pseudo-conteggi che Passerini usa con i prior Beta e Dirichlet.

**3. Numeri.** $n_0 = \frac{${f(sigma * sigma)}}{${f(s0 * s0)}} = ${n0}$.

$$\mu_N = \frac{${N} \cdot ${f(xbar, 2)} + ${n0} \cdot ${f(mu0, 1)}}{${N} + ${n0}} = \frac{${f(N * xbar, 2)} + ${f(n0 * mu0, 1)}}{${N + n0}} = ${f(muN, 4)},\qquad \sigma_N^2 = \frac{${f(sigma * sigma)}}{${N + n0}} = ${f(s2N, 4)}$$

Controllo con la forma della slide: pesi $${f(q.w, 4)}$ e $${f(q.wp, 4)}$, $\mu_N = ${f(q.muN, 4)}$.

**4. A metà strada.** I pesi sono uguali quando $N = n_0 = ${n0}$: allora $\mu_N = \frac{\bar{X} + \mu_0}{2}$. ${N > n0 ? md`Con $N = ${N} > ${n0}$ i dati pesano già più del prior.` : N < n0 ? md`Con $N = ${N} < ${n0}$ il prior pesa ancora più dei dati.` : md`Con $N = ${N}$ sei esattamente in quel caso.`}`,
      }
    },
  },
  {
    id: 'es15',
    title: 'Quanti campioni servono per una data certezza su μ?',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c29', 'c34'],
    generate: (rng) => {
      const s2 = rng.float(0.5, 10, 1)
      const s02 = rng.float(0.2, 10, 1)
      const frac = rng.pick([0.02, 0.05, 0.1, 0.2, 0.5])
      const eps = Math.max(0.01, Number((s02 * frac).toFixed(3)))
      const bound = s2 / eps - s2 / s02
      const Nmin = nPerVarianza(s2, s02, eps)
      const s2N = (s02 * s2) / (Nmin * s02 + s2)
      const s2Prima = Nmin > 0 ? (s02 * s2) / ((Nmin - 1) * s02 + s2) : s02
      const half = 1.96 * Math.sqrt(s2N)
      return {
        prompt: md`Una centralina misura la concentrazione di un inquinante con rumore gaussiano di varianza nota $\sigma^2 = ${f(s2, 1)}$. Il prior sulla concentrazione media è $N(\mu_0, \sigma_0^2)$ con $\sigma_0^2 = ${f(s02, 1)}$. Vuoi che la varianza a posteriori sia al più $\varepsilon = ${f(eps, 3)}$. Qual è il minimo numero di misure $N$? Quanto valgono $\sigma_N^2$ e la semiampiezza dell'intervallo di credibilità al 95%, $1.96\,\sigma_N$, con quel numero di misure?`,
        answers: [
          risposta(md`$N$ minimo`, Nmin, 0.5),
          risposta(md`$\sigma_N^2$ con $N$ minimo`, s2N, tol(s2N, 0.01, 0.0005)),
          risposta(md`$1.96\,\sigma_N$`, half, tol(half, 0.01, 0.002)),
        ],
        solution: md`**1. La condizione.** $\sigma_N^2 = \frac{\sigma_0^2\sigma^2}{N\sigma_0^2 + \sigma^2} \le \varepsilon$. Passo alle precisioni, che sono più comode: $\frac{1}{\sigma_N^2} = \frac{N}{\sigma^2} + \frac{1}{\sigma_0^2} \ge \frac{1}{\varepsilon}$, cioè

$$N \ge \frac{\sigma^2}{\varepsilon} - \frac{\sigma^2}{\sigma_0^2}$$

Si arrotonda per eccesso; se il risultato fosse negativo il prior basterebbe già e $N = 0$.

**2. Numeri.**

$$N \ge \frac{${f(s2, 1)}}{${f(eps, 3)}} - \frac{${f(s2, 1)}}{${f(s02, 1)}} = ${f(s2 / eps, 3)} - ${f(s2 / s02, 3)} = ${f(bound, 3)} \;\Rightarrow\; N_{\min} = ${Nmin}$$

**3. Verifica.** Con $N = ${Nmin}$: $\sigma_N^2 = \frac{${f(s02, 1)} \cdot ${f(s2, 1)}}{${Nmin} \cdot ${f(s02, 1)} + ${f(s2, 1)}} = ${f(s2N, 4)} \le ${f(eps, 3)}$${Nmin > 0 ? md`; con $N = ${Nmin - 1}$ sarebbe $${f(s2Prima, 4)}$, sopra la soglia` : ''}. L'intervallo di credibilità al 95% è $\mu_N \pm ${f(half, 4)}$.

**Lettura.** $\sigma_N^2$ non dipende dai valori misurati, solo da $N$: posso decidere quante misure fare prima di farle. Per $N$ grande $\sigma_N^2 \approx \sigma^2/N$: dimezzare $\varepsilon$ raddoppia circa le misure necessarie, e dimezzare la semiampiezza dell'intervallo le quadruplica. Il termine $-\sigma^2/\sigma_0^2 = -n_0$ è lo sconto portato dal prior: $n_0$ misure che non devo fare. Per $N \to \infty$, $\sigma_N^2 \to 0$ e la posterior tende a una delta di Dirac.`,
      }
    },
  },
  {
    id: 'es16',
    title: 'ML o Bayes? Scelta motivata in due applicazioni',
    difficulty: 1,
    kind: 'concettuale',
    concepts: ['c48', 'c50', 'c51', 'c52', 'c53'],
    generate: (rng) => {
      // caso a favore di Bayes, con numeri
      const bayes = rng.pick(['ecg', 'sensore'] as const)
      let testoB: string
      let muN: number
      let half: number
      let calcoloB: string
      let unita: string
      if (bayes === 'ecg') {
        const mu0 = rng.int(420, 460)
        const s0 = rng.pick([10, 15, 20])
        const sigma = rng.pick([20, 25, 30])
        const N = 5
        const xbar = Number((mu0 + rng.int(-30, 30) + 0.4).toFixed(1))
        const q = posterior(N, xbar, sigma * sigma, mu0, s0 * s0)
        muN = q.muN
        half = 1.96 * Math.sqrt(q.s2N)
        unita = 'ms'
        testoB = md`Stimare l'intervallo QT medio di una malattia cardiaca rara. Hai i tracciati ECG di soli $N = 5$ pazienti, con media $\bar{X} = ${f(xbar, 1)}$ ms e variabilità tra pazienti $\sigma = ${sigma}$ ms. La letteratura dà un valore di riferimento $N(${mu0}, ${s0}^2)$. Il cardiologo vuole sapere quanto è sicura la stima.`
        calcoloB = md`$N\sigma_0^2 + \sigma^2 = 5 \cdot ${s0 * s0} + ${sigma * sigma} = ${f(q.den)}$, $\mu_N = ${f(q.w, 4)} \cdot ${f(xbar, 1)} + ${f(q.wp, 4)} \cdot ${mu0} = ${f(muN, 2)}$ ms, $\sigma_N = ${f(Math.sqrt(q.s2N), 3)}$ ms, intervallo di credibilità al 95% $${f(muN, 2)} \pm ${f(half, 2)}$ ms.`
      } else {
        const s0 = 0.5
        const sigma = rng.pick([0.2, 0.3, 0.4])
        const N = 3
        const xbar = rng.float(-0.8, 0.8, 2)
        const q = posterior(N, xbar, sigma * sigma, 0, s0 * s0)
        muN = q.muN
        half = 1.96 * Math.sqrt(q.s2N)
        unita = '°C'
        testoB = md`Correggere l'offset di un nuovo sensore di temperatura. Hai solo $N = 3$ letture di confronto con uno strumento di riferimento: differenza media $\bar{X} = ${f(xbar, 2)}$ °C, rumore $\sigma = ${sigma}$ °C. Il datasheet del produttore dice che l'offset è distribuito come $N(0, 0.5^2)$. Ti serve sapere quanto sei sicuro della correzione.`
        calcoloB = md`$N\sigma_0^2 + \sigma^2 = 3 \cdot 0.25 + ${f(sigma * sigma, 2)} = ${f(q.den, 2)}$, $\mu_N = ${f(q.w, 4)} \cdot ${p(xbar, 2)} + ${f(q.wp, 4)} \cdot 0 = ${f(muN, 3)}$ °C, $\sigma_N = ${f(Math.sqrt(q.s2N), 3)}$ °C, intervallo di credibilità al 95% $${f(muN, 3)} \pm ${f(half, 3)}$ °C.`
      }
      // caso a favore di ML, con il peso residuo del prior
      const ml = rng.pick(['iperspettrale', 'salmoni'] as const)
      let testoML: string
      let wp: number
      let calcoloML: string
      if (ml === 'iperspettrale') {
        const sigma = rng.pick([2, 3, 4])
        const s0 = rng.pick([5, 10])
        const N = 2000000
        wp = (sigma * sigma) / (N * s0 * s0 + sigma * sigma)
        testoML = md`Stimare le statistiche della classe foresta (vettore medio e matrice di covarianza) in un'immagine iperspettrale con 200 bande e 2 milioni di pixel etichettati. In una banda la riflettanza ha $\sigma = ${sigma}$ % e un prior vago $\sigma_0 = ${s0}$ %.`
        calcoloML = md`Peso del prior nella media di una banda: $\frac{\sigma^2}{N\sigma_0^2+\sigma^2} = \frac{${sigma * sigma}}{2 \cdot 10^{6} \cdot ${s0 * s0} + ${sigma * sigma}} = ${sci(wp)}$. Trascurabile: Bayes darebbe la stessa media di ML, ma dovrebbe integrare su 200 medie e 20100 elementi della covarianza.`
      } else {
        const sigma = 1.5
        const s0 = rng.pick([3, 5])
        const N = rng.pick([10000, 20000, 50000])
        wp = (sigma * sigma) / (N * s0 * s0 + sigma * sigma)
        testoML = md`Stimare la luminosità media dei salmoni della produzione di ieri: $N = ${N}$ misure, rumore $\sigma = 1.5$, nessuna informazione a priori affidabile (al più un prior vago con $\sigma_0 = ${s0}$). Serve un numero da passare al classificatore.`
        calcoloML = md`Peso del prior: $\frac{\sigma^2}{N\sigma_0^2+\sigma^2} = \frac{2.25}{${N} \cdot ${s0 * s0} + 2.25} = ${sci(wp)}$. Con tanti dati e un prior vago le due stime coincidono (equivalenza asintotica, e prior quasi uniforme); ML è più semplice e dà direttamente il numero richiesto.`
      }
      const bayesPrimo = rng.next() < 0.5
      const casi: CasoScelta[] = bayesPrimo
        ? [
            { testo: testoB, scelta: 2, perche: calcoloB },
            { testo: testoML, scelta: 1, perche: calcoloML },
          ]
        : [
            { testo: testoML, scelta: 1, perche: calcoloML },
            { testo: testoB, scelta: 2, perche: calcoloB },
          ]
      const iB = bayesPrimo ? 1 : 2
      const iML = bayesPrimo ? 2 : 1
      return {
        prompt: md`Per ciascun caso scegli tra stima ML (rispondi 1) e stima bayesiana (rispondi 2), argomentando con i quattro criteri delle fonti: complessità computazionale e interpretabilità (a favore di ML), conoscenza a priori e quantificazione dell'incertezza (a favore di Bayes).

**Caso 1.** ${casi[0].testo}

**Caso 2.** ${casi[1].testo}

Poi calcola, per il caso in cui scegli Bayes, la media a posteriori; per l'altro, il peso che il prior avrebbe nella media a posteriori (va bene la notazione 1.5e-7).`,
        answers: [
          risposta('scelta per il caso 1', casi[0].scelta, 0.5),
          risposta('scelta per il caso 2', casi[1].scelta, 0.5),
          risposta(md`$\mu_N$ nel caso ${iB} (${unita})`, muN, tol(muN, 0.002, 0.005)),
          risposta(md`peso del prior nel caso ${iML}`, wp, Math.abs(wp) * 0.02),
        ],
        solution: md`**Caso ${iB}: stima bayesiana (2).** Pochi dati e un prior affidabile: la conoscenza a priori guida la stima dove i dati sono scarsi, e la posterior dà un intervallo di credibilità, cioè la quantificazione dell'incertezza che viene richiesta. Il costo di calcolo è irrilevante con un solo parametro e la posterior in forma chiusa. ${calcoloB}

**Caso ${iML}: stima ML (1).** Moltissimi campioni: siamo nel limite in cui le soluzioni ML e bayesiana coincidono, e il prior non sposta nulla. Restano i due vantaggi pratici di ML: minore complessità computazionale e interpretabilità più facile. ${calcoloML}`,
      }
    },
  },
  {
    id: 'es17',
    title: 'La predittiva come media pesata: area 1, media e varianza senza integrale gaussiano',
    difficulty: 3,
    kind: 'dimostrazione',
    concepts: ['c15', 'c16', 'c42', 'c44'],
    generate: (rng) => {
      const sigma = rng.pick([0.5, 1])
      const s2 = sigma * sigma
      const c = rng.int(3, 9)
      const d = rng.pick([2, 2.5, 3]) * sigma
      const mus = [c - d, c, c + d]
      const pis = trePesi(rng, false)
      const Ex = somma(mus.map((m, j) => pis[j] * m))
      const varMu = somma(mus.map((m, j) => pis[j] * (m - Ex) ** 2))
      const v = s2 + varMu
      const pMix = somma(mus.map((m, j) => pis[j] * gauss(Ex, m, s2)))
      const pG = 1 / Math.sqrt(2 * Math.PI * v)
      return {
        prompt: md`Parti da $p(\mathbf{x}\,|\,\boldsymbol{X}) = \int p(\mathbf{x}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}$.

(a) Dimostra che $\int p(\mathbf{x}\,|\,\boldsymbol{X})\,\mathrm{d}\mathbf{x} = 1$ scambiando l'ordine delle integrazioni, e di' perché lo scambio è lecito. (b) Mostra che $E\{\mathbf{x}\,|\,\boldsymbol{X}\} = \int E\{\mathbf{x}\,|\,\boldsymbol{\theta}\}\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}$ e deducine $E\{x\,|\,\boldsymbol{X}\} = \mu_N$ nel caso gaussiano. (c) Con la legge della varianza totale ottieni $\mathrm{var}\{x\,|\,\boldsymbol{X}\} = \sigma^2 + \sigma_N^2$. (d) Spiega perché (a)-(c) non bastano a dire che $p(x\,|\,\boldsymbol{X})$ è gaussiana.

Per (d) usa un controesempio: $p(x\,|\,\mu) \sim N(\mu, \sigma^2)$ con $\sigma = ${sigma}$, ma una posterior discreta che dà a $\mu$ i valori $${f(mus[0])}$, $${f(mus[1])}$, $${f(mus[2])}$ con probabilità $${pis[0]}$, $${pis[1]}$, $${pis[2]}$. Calcola media e varianza della predittiva, il suo valore nel punto medio $E\{x\,|\,\boldsymbol{X}\}$ e quello della gaussiana con la stessa media e la stessa varianza.`,
        answers: [
          risposta(md`$E\{x\,|\,\boldsymbol{X}\}$`, Ex, tol(Ex, 0.002, 0.005)),
          risposta(md`$\mathrm{var}\{x\,|\,\boldsymbol{X}\}$`, v, tol(v, 0.01, 0.005)),
          risposta('predittiva nel punto medio', pMix, tol(pMix, 0.005, 0.0005)),
          risposta('gaussiana con stessa media e varianza, nel punto medio', pG, tol(pG, 0.005, 0.0005)),
        ],
        solution: md`**(a) Area 1.**

$$\int p(\mathbf{x}\,|\,\boldsymbol{X})\,\mathrm{d}\mathbf{x} = \int\left[\int p(\mathbf{x}\,|\,\boldsymbol{\theta})\,\mathrm{d}\mathbf{x}\right]p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta} = \int 1 \cdot p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta} = 1$$

Lo scambio è lecito perché l'integranda $p(\mathbf{x}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$ è non negativa (teorema di Tonelli). Una media di densità con pesi non negativi di somma 1 è ancora una densità, una miscela: è il senso preciso di «average $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ over all possible values of $\boldsymbol{\theta}$».

**(b) Media.** Stesso scambio con $\mathbf{x}\,p(\mathbf{x}\,|\,\boldsymbol{\theta})$: $E\{\mathbf{x}\,|\,\boldsymbol{X}\} = \int E\{\mathbf{x}\,|\,\boldsymbol{\theta}\}\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}$. Nel caso gaussiano $E\{x\,|\,\mu\} = \mu$, quindi $E\{x\,|\,\boldsymbol{X}\} = \int \mu\,p(\mu\,|\,\boldsymbol{X})\,\mathrm{d}\mu = \mu_N$.

**(c) Varianza totale.** Con $E\{x^2\,|\,\boldsymbol{\theta}\} = \mathrm{var}\{x\,|\,\boldsymbol{\theta}\} + E\{x\,|\,\boldsymbol{\theta}\}^2$ e sottraendo $E\{x\,|\,\boldsymbol{X}\}^2$:

$$\mathrm{var}\{x\,|\,\boldsymbol{X}\} = \int \mathrm{var}\{x\,|\,\boldsymbol{\theta}\}\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta} + \int\left(E\{x\,|\,\boldsymbol{\theta}\} - E\{x\,|\,\boldsymbol{X}\}\right)^2 p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}$$

Nel caso gaussiano il primo termine è $\sigma^2$ (non dipende da $\mu$) e il secondo è la varianza della posterior, $\sigma_N^2$: varianza intrinseca più incertezza su $\mu$.

**(d) Il controesempio.** Le stesse formule valgono con la posterior discreta:

$$E\{x\,|\,\boldsymbol{X}\} = ${pis[0]} \cdot ${p(mus[0])} + ${pis[1]} \cdot ${p(mus[1])} + ${pis[2]} \cdot ${p(mus[2])} = ${f(Ex, 4)}$$

$$\mathrm{var}\{x\,|\,\boldsymbol{X}\} = \sigma^2 + \sum_j \pi_j(\mu_j - E\{x\,|\,\boldsymbol{X}\})^2 = ${f(s2, 2)} + ${f(varMu, 4)} = ${f(v, 4)}$$

Nel punto medio la miscela vale $\sum_j \pi_j\,N(${f(Ex, 4)};\ \mu_j, ${f(s2, 2)}) = ${f(pMix, 4)}$, mentre la gaussiana con la stessa media e la stessa varianza vale $\frac{1}{\sqrt{2\pi \cdot ${f(v, 4)}}} = ${f(pG, 4)}$. Area, media e varianza coincidono ma le densità no: la predittiva è una miscela di tre campane, non una gaussiana. Per concludere che $p(x\,|\,\boldsymbol{X})$ è gaussiana serve il calcolo esplicito dell'integrale, oppure l'argomento $x = \mu + \varepsilon$ con $\mu$ gaussiana e $\varepsilon \sim N(0, \sigma^2)$ indipendente: servono una posterior gaussiana e un parametro di posizione. I passaggi di (a)-(c) sono nella dimostrazione [«la densità predittiva è una media pesata di densità»](#derivation:der13).`,
      }
    },
  },
  {
    id: 'es18',
    title: 'Bayes o ML? Errore quadratico medio della media a posteriori',
    difficulty: 3,
    kind: 'numerico',
    concepts: ['c28', 'c48', 'c52', 'c53'],
    generate: (rng) => {
      // parametri con 0.05 < w < 0.95: con w vicino a 0 o a 1 le due stime sono quasi indistinguibili
      let sigma = 30
      let s0 = 20
      let N = 5
      for (let t = 0; t < 30; t++) {
        sigma = rng.int(1, 40)
        s0 = rng.int(1, 40)
        N = rng.int(1, 50)
        const w0 = (N * s0 * s0) / (N * s0 * s0 + sigma * sigma)
        if (w0 > 0.05 && w0 < 0.95) break
      }
      let delta = rng.int(-3 * s0, 3 * s0)
      // evita il pareggio esatto con la soglia
      if (Math.abs(delta * delta - (2 * s0 * s0 + (sigma * sigma) / N)) < 1e-9) delta = delta + 1 <= 3 * s0 ? delta + 1 : delta - 1
      const r = mseBayes(sigma, s0, N, delta)
      const soglia = Math.sqrt(r.soglia2)
      const vince = r.mse < r.mseML ? 1 : 2
      return {
        prompt: md`Un parametro clinico ha media vera $\mu_{\text{vera}}$ e rumore $\sigma = ${sigma}$ ms. Usi la media a posteriori $\mu_N$ con prior $N(\mu_0, \sigma_0^2)$, $\sigma_0 = ${s0}$ ms, il cui centro sbaglia di $\Delta = \mu_0 - \mu_{\text{vera}} = ${delta}$ ms; hai $N = ${N}$ campioni. Guardando $\mu_N$ come stimatore di $\mu_{\text{vera}}$, calcola il peso $w = \frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}$, l'errore quadratico medio di $\mu_N$ e quello di ML ($\sigma^2/N$), e la soglia su $\vert\Delta\vert$ sotto la quale Bayes vince. Chi vince qui? (Rispondi 1 per Bayes, 2 per ML.)`,
        answers: [
          risposta(md`$w$`, r.w, 0.002),
          risposta('errore quadratico medio di Bayes', r.mse, tol(r.mse, 0.01, 0.01)),
          risposta('errore quadratico medio di ML', r.mseML, tol(r.mseML, 0.005, 0.01)),
          risposta(md`soglia su $\vert\Delta\vert$`, soglia, tol(soglia, 0.005, 0.01)),
          risposta('vincitore', vince, 0.5),
        ],
        solution: md`**1. Peso.** $w = \frac{${N} \cdot ${s0 * s0}}{${N} \cdot ${s0 * s0} + ${sigma * sigma}} = \frac{${N * s0 * s0}}{${N * s0 * s0 + sigma * sigma}} = ${f(r.w, 4)}$, quindi $\mu_N = w\bar{X} + (1-w)\mu_0$.

**2. Bias.** $E\{\bar{X}\} = \mu_{\text{vera}}$, quindi $E\{\mu_N\} = w\mu_{\text{vera}} + (1-w)\mu_0$ e il bias è $(1-w)\Delta = ${f(1 - r.w, 4)} \cdot ${p(delta, 0)} = ${f(r.bias, 4)}$ ms: $\mu_N$ è tirata verso $\mu_0$.

**3. Varianza.** $\mathrm{var}\{\bar{X}\} = \sigma^2/N$ e il termine $(1-w)\mu_0$ è costante: $\mathrm{var}\{\mu_N\} = w^2\sigma^2/N = ${f(r.w, 4)}^2 \cdot ${f(r.mseML, 4)} = ${f(r.varianza, 4)}$.

**4. Errori quadratici medi.** Varianza più bias al quadrato:

$$E\{(\mu_N - \mu_{\text{vera}})^2\} = ${f(r.varianza, 4)} + ${p(r.bias, 4)}^2 = ${f(r.mse, 4)},\qquad E\{(\bar{X} - \mu_{\text{vera}})^2\} = \frac{\sigma^2}{N} = \frac{${sigma * sigma}}{${N}} = ${f(r.mseML, 4)}$$

**5. Soglia.** $w^2\frac{\sigma^2}{N} + (1-w)^2\Delta^2 < \frac{\sigma^2}{N}$ equivale a $(1-w)^2\Delta^2 < (1-w)(1+w)\frac{\sigma^2}{N}$. Divido per $(1-w)^2 > 0$: $\Delta^2 < \frac{1+w}{1-w}\cdot\frac{\sigma^2}{N}$, e con $\frac{1+w}{1-w} = \frac{2N\sigma_0^2 + \sigma^2}{\sigma^2}$ ottengo

$$\Delta^2 < 2\sigma_0^2 + \frac{\sigma^2}{N} = ${2 * s0 * s0} + ${f((sigma * sigma) / N, 4)} = ${f(r.soglia2, 4)} \iff \vert\Delta\vert < ${f(soglia, 3)}$$

**Esito.** $\vert\Delta\vert = ${Math.abs(delta)}$ ${vince === 1 ? md`è sotto la soglia: vince Bayes (1), con errore ${f(r.mse, 2)} contro ${f(r.mseML, 2)}. Il prior è centrato abbastanza bene rispetto all'incertezza che dichiara, e la varianza risparmiata vale più del bias introdotto.` : md`supera la soglia: vince ML (2), con errore ${f(r.mseML, 2)} contro ${f(r.mse, 2)}. Il prior sbaglia centro più di quanto la sua varianza dichiari, e il bias costa più della varianza risparmiata.`}

**Per $N \to \infty$.** $w \to 1$, bias e varianza di $\mu_N$ tendono a zero e $\mu_N$ converge a $\mu_{\text{vera}}$, come ML: è l'equivalenza asintotica. Serve $\sigma_0^2 > 0$: con $\sigma_0^2 = 0$ si ha $w = 0$ per ogni $N$, e l'errore resta $\Delta^2$ per sempre. I passaggi sono nella dimostrazione [«errore quadratico medio della media a posteriori»](#derivation:der12).`,
      }
    },
  },
]
