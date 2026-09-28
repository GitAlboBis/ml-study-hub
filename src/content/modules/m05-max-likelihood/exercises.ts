// Esercizi generativi del modulo m05 (stima a massima verosimiglianza): uno per ogni esercizio dell'inventario
// (es01-es19). Ogni generatore usa solo rng: stesso seed, stessa istanza. I conti stanno in `calcoli`, così uno
// script di verifica può confrontarli con i numeri dell'inventario.
import { md } from '../../types'
import type { Exercise, ExerciseAnswer, Rng } from '../../types'

// ---------------------------------------------------------------------------------------------------
// Calcoli
// ---------------------------------------------------------------------------------------------------

const SQRT2PI = Math.sqrt(2 * Math.PI)
/** Densità normale standard. */
const phi = (u: number) => Math.exp(-(u * u) / 2) / SQRT2PI
/** Densità gaussiana 1-D di media m e deviazione standard s. */
const gauss = (x: number, m: number, s: number) => phi((x - m) / s) / s
const somma = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0)
const media = (xs: readonly number[]) => somma(xs) / xs.length

/** erf con la formula 7.1.26 di Abramowitz-Stegun (errore assoluto < 1.5e-7). */
const erf = (x: number) => {
  const s = x < 0 ? -1 : 1
  const a = Math.abs(x)
  const t = 1 / (1 + 0.3275911 * a)
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a)
  return s * y
}
/** Funzione di ripartizione della normale standard. */
const Phi = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2))

/** Γ(N + 1/2)/Γ(N) per N intero ≥ 1, con la ricorrenza g(N + 1) = g(N)·(N + 1/2)/N. */
const rapportoGamma = (N: number) => {
  let g = Math.sqrt(Math.PI) / 2
  for (let k = 1; k < N; k++) g *= (k + 0.5) / k
  return g
}

const mediana = (xs: readonly number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const n = s.length
  return n % 2 === 1 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2
}

/** Autovalori di [[a, c], [c, b]], il maggiore per primo. */
const autovalori2 = (a: number, b: number, c: number): [number, number] => {
  const t = (a + b) / 2
  const r = Math.sqrt(((a - b) / 2) ** 2 + c * c)
  return [t + r, t - r]
}

export const calcoli = {
  phi,
  gauss,
  Phi,
  rapportoGamma,
  mediana,
  autovalori2,
  /** Log-likelihood di una Bernoulli con K successi su N nel massimo θ̂ = K/N. */
  logLikBernoulli: (N: number, K: number) => K * Math.log(K / N) + (N - K) * Math.log(1 - K / N),
  /** Stima ML di σ² della Rayleigh: Σ x²/(2N). */
  sigma2Rayleigh: (xs: readonly number[]) => somma(xs.map((x) => x * x)) / (2 * xs.length),
  /** Soglia della Rayleigh con probabilità di falso allarme pfa. */
  sogliaRayleigh: (sigma: number, pfa: number) => sigma * Math.sqrt(2 * Math.log(1 / pfa)),
}

// ---------------------------------------------------------------------------------------------------
// Formattazione
// ---------------------------------------------------------------------------------------------------

/** Numero per il testo: al più d decimali, senza zeri inutili e mai -0. */
const f = (x: number, d = 3) => {
  const r = Number(x.toFixed(d))
  return String(r === 0 ? 0 : r)
}
/** Numero con tre cifre significative; molto piccolo o molto grande in notazione scientifica LaTeX. */
const sci = (x: number, cifre = 3): string => {
  if (x === 0) return '0'
  let e = Math.floor(Math.log10(Math.abs(x)))
  if (e >= -3 && e < 6) return String(Number(x.toPrecision(cifre)))
  let mant = Number((x / 10 ** e).toPrecision(cifre))
  if (Math.abs(mant) >= 10) {
    mant /= 10
    e += 1
  }
  return md`${mant} \cdot 10^{${e}}`
}
/** Tolleranza: relativa, con un minimo assoluto. */
const tol = (v: number, rel = 0.01, abs = 0.001) => Math.max(abs, Math.abs(v) * rel)
const risposta = (label: string, value: number, tolerance = tol(value)): ExerciseAnswer => ({ label, value, tolerance })
/** Risposta a codice intero (scelta tra alternative numerate). */
const codice = (label: string, value: number): ExerciseAnswer => ({ label, value, tolerance: 0.1 })
const elenco = (xs: readonly number[], d = 1) => xs.map((x) => f(x, d)).join(',\\ ')
const lettere = ['a', 'b', 'c', 'd', 'e', 'f']
/** n valori distinti a un decimale in [lo, hi], in ordine casuale. */
const distinti = (rng: Rng, n: number, lo: number, hi: number) => {
  const griglia = Array.from({ length: Math.round((hi - lo) * 10) + 1 }, (_, i) => Number((lo + i / 10).toFixed(1)))
  return rng.shuffle(griglia).slice(0, n)
}

// ---------------------------------------------------------------------------------------------------
// Esercizi
// ---------------------------------------------------------------------------------------------------

export const exercises: Exercise[] = [
  {
    id: 'es01',
    title: 'Classifica delle candidate nella figura «ML search»',
    difficulty: 1,
    kind: 'numerico',
    concepts: ['c12', 'c13', 'c14', 'c15'],
    generate: (rng) => {
      let sigma: number
      let x0: number
      let ms: number[]
      const slide = rng.next() < 0.2
      if (slide) {
        sigma = 1
        x0 = 1
        ms = [-2, -1.5, 0, 1, 1.5]
      } else {
        sigma = rng.pick([0.5, 0.8, 1, 1.5, 2])
        x0 = rng.float(-3, 3, 1)
        const x10 = Math.round(x0 * 10)
        // distanze da x0 tutte diverse (in decimi): nessun pareggio nella classifica
        const offs = rng.shuffle([2, 4, 5, 8, 10, 13, 15, 20, 25, 30]).slice(0, 5)
        ms = offs.map((o) => (x10 + (rng.next() < 0.5 ? -o : o)) / 10).sort((a, b) => a - b)
      }
      const L = ms.map((m) => gauss(x0, m, sigma))
      const best = L.indexOf(Math.max(...L))
      const Lmax = 1 / (sigma * SQRT2PI)
      const esatta = Math.abs(ms[best] - x0) < 1e-9
      const righe = ms.map((m, i) => `| ${i + 1} | $${f(m, 1)}$ | $${f(Math.abs(x0 - m), 1)}$ | $${L[i] < 0.001 ? sci(L[i]) : f(L[i], 4)}$ |`).join('\n')
      const ordine = L.map((_, i) => i)
        .sort((i, j) => L[j] - L[i])
        .map((i) => f(ms[i], 1))
        .join(',\\ ')
      return {
        prompt: md`Nell'impianto di confezionamento del pesce la telecamera misura la luminosità di un salmone, già centrata sul valore di riferimento della linea (scarto dalla luminosità media, in unità arbitrarie: per questo può essere negativa): $x_0 = ${f(x0, 1)}$. Il modello è una gaussiana con varianza nota, $\sigma = ${f(sigma)}$, e media $m$ ignota. Come nella figura «ML search» confronti cinque campane candidate, centrate in

$$m \in \{${elenco(ms, 1)}\}$$

(a) Quale candidata dà la likelihood più alta, e quanto vale per lei $p(x_0 \mid m)$? (b) Qual è la stima ML $\hat{m}$ e quanto vale la likelihood nel massimo?`,
        answers: [
          risposta('(a) media $m$ della candidata migliore', ms[best], 0.01),
          risposta(md`(a) $p(x_0 \mid m)$ della candidata migliore`, L[best], tol(L[best], 0.01, 0.0005)),
          risposta(md`(b) $\hat{m}$`, x0, 0.01),
          risposta(md`(b) $p(x_0 \mid \hat{m})$`, Lmax, tol(Lmax, 0.01, 0.0005)),
        ],
        solution: md`**1. La likelihood di ogni candidata.** Con un solo campione la likelihood coincide con la pdf valutata in $x_0$:

$$p(x_0 \mid m) = \frac{1}{\sigma\sqrt{2\pi}} \exp\left[-\frac{(x_0 - m)^2}{2\sigma^2}\right], \qquad \frac{1}{\sigma\sqrt{2\pi}} = ${f(Lmax, 4)}$$

| candidata | $m$ | distanza da $x_0$ | $p(x_0 \mid m)$ |
|---|---|---|---|
${righe}

**2. La classifica.** $m$ entra solo nel quadrato $(x_0 - m)^2$: la likelihood scende con la distanza da $x_0$. Dalla più alta alla più bassa: $m = ${ordine}$. Vince $m = ${f(ms[best], 1)}$, con $p(x_0 \mid m) = ${f(L[best], 4)}$: è il trattino più alto sulla verticale tratteggiata in $x_0$.${slide ? ' Sono i valori della figura della slide, con $\\sigma = 1$ e $x_0 = 1$.' : ''}

**3. La stima ML.** Le cinque campane sono solo esempi della ricerca. Derivando la log-likelihood, $\frac{\partial}{\partial m}\ln p(x_0 \mid m) = \frac{x_0 - m}{\sigma^2} = 0$, quindi

$$\hat{m} = x_0 = ${f(x0, 1)}, \qquad p(x_0 \mid \hat{m}) = \frac{1}{\sigma\sqrt{2\pi}} = ${f(Lmax, 4)}$$

${esatta ? 'Qui una candidata cade proprio su $x_0$ e coincide con la stima ML.' : 'Nessuna candidata cade su $x_0$: la migliore delle cinque non è la stima ML, che è la campana centrata esattamente sull\'osservazione.'} Il picco dipende solo da $\sigma$: una campana più stretta avrebbe un massimo più alto.`,
      }
    },
  },
  {
    id: 'es02',
    title: 'Media e varianza ML da N campioni gaussiani',
    difficulty: 1,
    kind: 'numerico',
    concepts: ['c18', 'c19', 'c28'],
    generate: (rng) => {
      const N = rng.int(4, 8)
      const xs = Array.from({ length: N }, () => rng.float(3, 6, 1))
      const S = somma(xs)
      const m = S / N
      const dev = xs.map((x) => x - m)
      const ss = somma(dev.map((d) => d * d))
      const v = ss / N
      const s2 = ss / (N - 1)
      const rapporto = (N - 1) / N
      return {
        prompt: md`La telecamera dell'impianto misura la luminosità di $N = ${N}$ salmoni:

$$\{${elenco(xs, 1)}\}$$

Assumi un modello gaussiano con media e varianza ignote. (a) Calcola la stima ML della media $\hat{m}$ e controlla che $\sum_k (x_k - \hat{m}) = 0$. (b) Calcola la stima ML della varianza $\hat{\sigma}^2$. (c) Calcola la versione non distorta, che divide per $N - 1$. (d) Quanto vale il rapporto tra la stima ML e la versione non distorta?`,
        answers: [
          risposta(md`(a) $\hat{m}$`, m, 0.005),
          risposta(md`(b) $\hat{\sigma}^2$`, v, tol(v, 0.01, 0.002)),
          risposta('(c) versione non distorta', s2, tol(s2, 0.01, 0.002)),
          risposta('(d) rapporto', rapporto, 0.002),
        ],
        solution: md`**(a) Media.** Annullando la derivata della log-likelihood rispetto a $m$ si ottiene la media campionaria:

$$\hat{m} = \frac{1}{N}\sum_{k=1}^{N} x_k = \frac{${f(S, 2)}}{${N}} = ${f(m, 4)}$$

Gli scarti $x_k - \hat{m}$ sono $${elenco(dev, 3)}$: sommati danno $0$, a meno degli arrotondamenti. $\hat{m}$ è il baricentro dei campioni.

**(b) Varianza ML.** Annullando la derivata rispetto a $\sigma^2$:

$$\hat{\sigma}^2 = \frac{1}{N}\sum_{k=1}^{N} (x_k - \hat{m})^2 = \frac{${f(ss, 4)}}{${N}} = ${f(v, 4)}$$

**(c) Versione non distorta.**

$$\frac{1}{N-1}\sum_{k=1}^{N} (x_k - \hat{m})^2 = \frac{${f(ss, 4)}}{${N - 1}} = ${f(s2, 4)}$$

**(d) Rapporto.** $\frac{${f(v, 4)}}{${f(s2, 4)}} = \frac{N-1}{N} = \frac{${N - 1}}{${N}} = ${f(rapporto, 4)}$. È il fattore di distorsione: $E\{\hat{\sigma}^2\} = \frac{N-1}{N}\sigma^2$. La stima ML sottostima la varianza con pochi campioni, perché misura gli scarti da $\hat{m}$, calcolata sugli stessi dati; il fattore tende a 1 per $N \to \infty$. La media invece è non distorta per ogni $N$.`,
      }
    },
  },
  {
    id: 'es03',
    title: 'Sviluppa la derivata prima per una gaussiana e spiega il risultato',
    difficulty: 2,
    kind: 'dimostrazione',
    concepts: ['c09', 'c10', 'c11', 'c18', 'c19'],
    generate: (rng) => {
      const N = rng.int(4, 7)
      const sigma = rng.pick([0.5, 1, 2])
      const xs = Array.from({ length: N }, () => rng.float(18, 24, 1))
      const m = media(xs)
      const mt = Number((m + rng.pick([-1, -0.5, 0.5, 1])).toFixed(2))
      const s2 = sigma * sigma
      const deriv = somma(xs.map((x) => x - mt)) / s2
      const der2 = -N / s2
      return {
        prompt: md`Un sensore IoT registra $N = ${N}$ temperature (in °C), che modelli come campioni iid di una gaussiana con varianza nota $\sigma^2 = ${f(s2, 2)}$ e media $m$ ignota:

$$\{${elenco(xs, 1)}\}$$

Scrivi la likelihood come prodotto, passa alla log-likelihood, deriva rispetto a $m$, poni a zero e risolvi; controlla la derivata seconda e spiega il significato del risultato. Per verificare i conti: (a) quanto vale $\hat{m}$? (b) Quanto vale la derivata prima della log-likelihood in $m = ${f(mt, 2)}$? (c) Quanto vale la derivata seconda?`,
        answers: [
          risposta(md`(a) $\hat{m}$`, m, 0.005),
          risposta(md`(b) $\frac{\partial \ln p}{\partial m}$ in $m = ${f(mt, 2)}$`, deriv, tol(deriv, 0.01, 0.01)),
          risposta(md`(c) $\frac{\partial^2 \ln p}{\partial m^2}$`, der2, tol(der2, 0.01, 0.01)),
        ],
        solution: md`**1. Likelihood.** I campioni sono iid, quindi la densità congiunta è il prodotto:

$$p(\mathbf{X} \mid m) = \prod_{k=1}^{N} \frac{1}{\sigma\sqrt{2\pi}} \exp\left[-\frac{(x_k - m)^2}{2\sigma^2}\right]$$

**2. Log-likelihood.** Il logaritmo trasforma il prodotto in somma ed elimina l'esponenziale:

$$\ln p(\mathbf{X} \mid m) = -N\ln\left(\sigma\sqrt{2\pi}\right) - \frac{1}{2\sigma^2}\sum_{k=1}^{N} (x_k - m)^2$$

**3. Derivata prima.** Il primo termine non dipende da $m$; la derivata di $(x_k - m)^2$ è $-2(x_k - m)$:

$$\frac{\partial \ln p(\mathbf{X} \mid m)}{\partial m} = \frac{1}{\sigma^2}\sum_{k=1}^{N} (x_k - m) = \frac{N(\bar{x} - m)}{\sigma^2}$$

**4. Zero e soluzione.** $\sum_k (x_k - \hat{m}) = 0 \Rightarrow \sum_k x_k = N\hat{m}$, quindi

$$\hat{m} = \frac{1}{N}\sum_{k=1}^{N} x_k = \frac{${f(somma(xs), 2)}}{${N}} = ${f(m, 4)}$$

In $m = ${f(mt, 2)}$ la derivata vale $\frac{${N} \cdot (${f(m, 4)} - ${f(mt, 2)})}{${f(s2, 2)}} = ${f(deriv, 3)}$: ${deriv > 0 ? 'è positiva, quindi la log-likelihood cresce andando verso $\\hat{m}$' : 'è negativa, quindi la log-likelihood cresce tornando verso $\\hat{m}$'}.

**5. Derivata seconda.** $\frac{\partial^2 \ln p}{\partial m^2} = -\frac{N}{\sigma^2} = ${f(der2, 3)} < 0$ per ogni $m$: la log-likelihood è una parabola rivolta verso il basso e il massimo è unico e globale.

**6. Significato.**
- $\sum_k (x_k - \hat{m}) = 0$: la stima è il baricentro dei campioni, dove gli scarti si compensano; ogni campione tira la media verso di sé con forza $(x_k - m)/\sigma^2$.
- Massimizzare la log-likelihood gaussiana equivale a minimizzare $\sum_k (x_k - m)^2$: ML con rumore gaussiano coincide con i minimi quadrati.
- $\sigma^2$ si semplifica: la stima della media non dipende dalla varianza.
- Con $N = 1$ ritrovo $\hat{m} = x_0$, il risultato della figura «ML search».
- $E\{\hat{m}\} = m$ e $\mathrm{var}\{\hat{m}\} = \sigma^2/N = ${f(s2 / N, 4)}$, uguale al bound di Cramér-Rao: la stima è non distorta ed efficiente.

I passaggi completi sono nella dimostrazione [«derivata prima per una gaussiana con N campioni»](#derivation:der04).`,
      }
    },
  },
  {
    id: 'es04',
    title: 'La varianza ML è distorta: dimostrare E{σ̂²} = ((N-1)/N) σ²',
    difficulty: 3,
    kind: 'dimostrazione',
    concepts: ['c24', 'c28'],
    generate: (rng) => {
      const s2 = rng.pick([0.5, 1, 2, 4, 9])
      const N = rng.int(3, 20)
      const p = rng.pick([1, 2, 5, 10])
      const atteso = ((N - 1) / N) * s2
      const bias = -s2 / N
      const Nmin = Math.ceil(100 / p)
      return {
        prompt: md`Parti dalla log-likelihood gaussiana con media e varianza entrambe ignote. Ricava la stima ML $\hat{\sigma}^2$ derivando rispetto a $\sigma^2$, poi dimostra che $E\{\hat{\sigma}^2\} = \frac{N-1}{N}\sigma^2$ usando l'identità $\sum_k (x_k - \hat{m})^2 = \sum_k (x_k - m)^2 - N(\hat{m} - m)^2$ e $\mathrm{var}\{\hat{m}\} = \sigma^2/N$.

Poi applica il risultato con varianza vera $\sigma^2 = ${f(s2)}$ e $N = ${N}$ campioni: (a) quanto vale $E\{\hat{\sigma}^2\}$? (b) Quanto vale il bias $E\{\hat{\sigma}^2\} - \sigma^2$? (c) Qual è il più piccolo $N$ per cui il bias, in valore assoluto, non supera il ${p} per cento di $\sigma^2$?`,
        answers: [
          risposta(md`(a) $E\{\hat{\sigma}^2\}$`, atteso, tol(atteso, 0.005, 0.002)),
          risposta('(b) bias', bias, tol(bias, 0.01, 0.002)),
          risposta('(c) $N$ minimo', Nmin, 0.5),
        ],
        solution: md`**1. La stima.** Con $N$ campioni iid

$$\ln p(\mathbf{X} \mid m, \sigma^2) = -\frac{N}{2}\ln(2\pi) - \frac{N}{2}\ln\sigma^2 - \frac{1}{2\sigma^2}\sum_{k=1}^{N} (x_k - m)^2$$

La derivata rispetto a $m$ dà $\hat{m} = \frac{1}{N}\sum_k x_k$. Rispetto a $\sigma^2$:

$$\frac{\partial \ln p}{\partial \sigma^2} = -\frac{N}{2\sigma^2} + \frac{1}{2\sigma^4}\sum_{k=1}^{N} (x_k - m)^2 = 0 \;\Rightarrow\; \hat{\sigma}^2 = \frac{1}{N}\sum_{k=1}^{N} (x_k - \hat{m})^2$$

**2. L'identità.** Scrivo $x_k - m = (x_k - \hat{m}) + (\hat{m} - m)$ ed elevo al quadrato:

$$\sum_{k=1}^{N} (x_k - m)^2 = \sum_{k=1}^{N} (x_k - \hat{m})^2 + 2(\hat{m} - m)\sum_{k=1}^{N} (x_k - \hat{m}) + N(\hat{m} - m)^2$$

Il termine misto è nullo perché $\sum_k (x_k - \hat{m}) = 0$.

**3. Valori attesi.** $E\{(x_k - m)^2\} = \sigma^2$, quindi $E\{\sum_k (x_k - m)^2\} = N\sigma^2$. Poiché $E\{\hat{m}\} = m$, $E\{(\hat{m} - m)^2\} = \mathrm{var}\{\hat{m}\} = \sigma^2/N$, quindi $E\{N(\hat{m} - m)^2\} = \sigma^2$.

**4. Conclusione.**

$$E\{\hat{\sigma}^2\} = \frac{1}{N}\left(N\sigma^2 - \sigma^2\right) = \frac{N-1}{N}\sigma^2$$

La stima è distorta con $N$ finito, ma $\frac{N-1}{N} \to 1$: è asintoticamente non distorta, come promettono le proprietà di ML. Lo stimatore non distorto divide per $N - 1$; in più dimensioni $E\{\hat{\Sigma}\} = \frac{N-1}{N}\Sigma$ e le slide indicano come stimatore non distorto elementare quello con $\frac{1}{N-1}$. I passaggi sono nella dimostrazione [«stima ML della varianza gaussiana e suo bias»](#derivation:der05).

**5. Numeri.** (a) $E\{\hat{\sigma}^2\} = \frac{${N - 1}}{${N}} \cdot ${f(s2)} = ${f(atteso, 4)}$. (b) Bias $= -\frac{\sigma^2}{N} = ${f(bias, 4)}$. (c) Il bias relativo è $\frac{1}{N}$: chiedo $\frac{1}{N} \leq ${f(p / 100)}$, cioè $N \geq ${Nmin}$.`,
      }
    },
  },
  {
    id: 'es05',
    title: 'ML per la Rayleigh: ampiezze radar',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c38', 'c10'],
    generate: (rng) => {
      const N = rng.int(4, 8)
      const xs = Array.from({ length: N }, () => rng.float(0.3, 3.5, 1))
      const sq = xs.map((x) => x * x)
      const S2 = somma(sq)
      const s2 = S2 / (2 * N)
      const s = Math.sqrt(s2)
      const pfa = rng.pick([0.1, 0.05, 0.01, 0.001])
      const T = calcoli.sogliaRayleigh(s, pfa)
      return {
        prompt: md`Un georadar (GPR) misura l'ampiezza dell'eco su un terreno omogeneo in $N = ${N}$ posizioni:

$$\{${elenco(xs, 1)}\}$$

Il modello è la Rayleigh, $f(x \mid \sigma) = \frac{x\exp\left(\frac{-x^2}{2\sigma^2}\right)}{\sigma^2}$ per $x \geq 0$. Ricava la stima ML derivando la log-likelihood rispetto a $\sigma^2$. (a) Quanto vale $\sum_k x_k^2$? (b) Quanto vale $\hat{\sigma}^2$? (c) E $\hat{\sigma}$? (d) Con la Rayleigh stimata, quale soglia $T$ dà una probabilità di falso allarme $P_{FA} = ${f(pfa)}$?`,
        answers: [
          risposta(md`(a) $\sum_k x_k^2$`, S2, tol(S2, 0.005, 0.01)),
          risposta(md`(b) $\hat{\sigma}^2$`, s2, tol(s2, 0.01, 0.002)),
          risposta(md`(c) $\hat{\sigma}$`, s, tol(s, 0.01, 0.002)),
          risposta('(d) soglia $T$', T, tol(T, 0.01, 0.005)),
        ],
        solution: md`**1. Log-likelihood.** Con $s = \sigma^2$ e campioni iid:

$$\ln p(\mathbf{X} \mid s) = \sum_{k=1}^{N}\ln x_k - N\ln s - \frac{1}{2s}\sum_{k=1}^{N} x_k^2$$

**2. Derivata e soluzione.**

$$\frac{\partial \ln p}{\partial s} = -\frac{N}{s} + \frac{1}{2s^2}\sum_{k=1}^{N} x_k^2 = 0 \;\Rightarrow\; \hat{\sigma}^2 = \frac{1}{2N}\sum_{k=1}^{N} x_k^2$$

La derivata seconda in $\hat{s}$ vale $\frac{N}{\hat{s}^2} - \frac{2N}{\hat{s}^2} = -\frac{N}{\hat{s}^2} < 0$: è un massimo.

**3. Numeri.** (a) I quadrati sono $${elenco(sq, 2)}$, con somma $${f(S2, 2)}$. (b) $\hat{\sigma}^2 = \frac{${f(S2, 2)}}{${2 * N}} = ${f(s2, 4)}$. (c) Per l'invarianza della stima ML, $\hat{\sigma} = \sqrt{${f(s2, 4)}} = ${f(s, 4)}$.

**4. Soglia.** Per la Rayleigh $P\{x > T\} = \exp\left(-\frac{T^2}{2\sigma^2}\right)$. Impongo $P_{FA} = ${f(pfa)}$:

$$T = \hat{\sigma}\sqrt{2\ln\frac{1}{P_{FA}}} = ${f(s, 4)} \cdot ${f(Math.sqrt(2 * Math.log(1 / pfa)), 4)} = ${f(T, 3)}$$

La stima $\hat{\sigma}^2$ è non distorta ed efficiente: con $x^2 = z_1^2 + z_2^2$ e $z_i \sim N(0, \sigma^2)$ si ha $E\{x^2\} = 2\sigma^2$, quindi $E\{\hat{\sigma}^2\} = \sigma^2$.`,
      }
    },
  },
  {
    id: 'es06',
    title: 'ML per una Bernoulli: probabilità di una parola nello spam',
    difficulty: 1,
    kind: 'numerico',
    concepts: ['c06', 'c07', 'c09', 'c10'],
    generate: (rng) => {
      const N = rng.int(20, 200)
      const K = Math.min(N - 1, Math.max(1, Math.round(N * rng.float(0.05, 0.6, 2))))
      const theta = K / N
      const lnL = calcoli.logLikBernoulli(N, K)
      const log10L = lnL / Math.LN10
      const Ngrande = 10000
      const log10Lgrande = (lnL / N) * Ngrande / Math.LN10
      return {
        prompt: md`Il filtro antispam conta in quante email di spam compare la parola «gratis»: su $N = ${N}$ email di spam compare in $K = ${K}$. Modelli ogni email con una Bernoulli di parametro $\theta$. (a) Qual è la stima ML $\hat{\theta}$? (b) Quanto vale la log-likelihood nel massimo, $\ln p(\mathbf{X} \mid \hat{\theta})$? (c) Quanto vale $\log_{10}$ della likelihood nel massimo? Poi spiega perché il prodotto diretto delle probabilità andrebbe in underflow con molte email.`,
        answers: [
          risposta(md`(a) $\hat{\theta}$`, theta, 0.002),
          risposta(md`(b) $\ln p(\mathbf{X} \mid \hat{\theta})$`, lnL, tol(lnL, 0.005, 0.05)),
          risposta(md`(c) $\log_{10} p(\mathbf{X} \mid \hat{\theta})$`, log10L, tol(log10L, 0.005, 0.03)),
        ],
        solution: md`**1. Likelihood.** $p(x \mid \theta) = \theta^x(1 - \theta)^{1-x}$ con $x \in \{0, 1\}$. Con email iid:

$$p(\mathbf{X} \mid \theta) = \prod_{k=1}^{N}\theta^{x_k}(1 - \theta)^{1 - x_k} = \theta^K(1 - \theta)^{N - K}$$

Con dati discreti è davvero la probabilità di osservare il dataset sotto il modello.

**2. Log-likelihood e derivata.**

$$\ln p(\mathbf{X} \mid \theta) = K\ln\theta + (N - K)\ln(1 - \theta), \qquad \frac{\partial \ln p}{\partial \theta} = \frac{K}{\theta} - \frac{N - K}{1 - \theta} = 0$$

Moltiplico per $\theta(1 - \theta)$: $K(1 - \theta) = (N - K)\theta$, quindi $\hat{\theta} = \frac{K}{N} = \frac{${K}}{${N}} = ${f(theta, 4)}$. La derivata seconda $-\frac{K}{\theta^2} - \frac{N - K}{(1 - \theta)^2}$ è negativa: è un massimo.

**3. Valore nel massimo.**

$$\ln p(\mathbf{X} \mid \hat{\theta}) = ${K}\ln ${f(theta, 4)} + ${N - K}\ln ${f(1 - theta, 4)} = ${f(lnL, 3)}$$

e $\log_{10} p = \frac{${f(lnL, 3)}}{\ln 10} = ${f(log10L, 3)}$: la likelihood vale circa $${sci(Math.exp(lnL))}$.

**4. Underflow.** La log-likelihood cresce linearmente con $N$. Con ${Ngrande} email e la stessa frequenza, $\log_{10}$ della likelihood sarebbe circa $${f(log10Lgrande, 0)}$: ben sotto $-324$, perché il più piccolo numero positivo della doppia precisione è circa $5 \cdot 10^{-324}$ (i numeri normalizzati arrivano a circa $2 \cdot 10^{-308}$). Il prodotto diretto darebbe 0 per ogni $\theta$ e non potrei confrontare i candidati; la somma dei logaritmi resta rappresentabile e si deriva termine a termine.`,
      }
    },
  },
  {
    id: 'es07',
    title: "ML per l'esponenziale (Gamma con k = 1): tempi di attesa di un sensore",
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c37', 'c10', 'c23', 'c24'],
    generate: (rng) => {
      const N = rng.int(4, 10)
      const xs = Array.from({ length: N }, () => rng.float(0.2, 4, 1))
      const S = somma(xs)
      const theta = S / N
      const lambda = 1 / theta
      const lnL = -N * Math.log(theta) - N
      const fattore = N / (N - 1)
      return {
        prompt: md`Un sensore IoT invia un pacchetto a istanti casuali. I tempi di attesa tra due invii (in secondi) sono:

$$\{${elenco(xs, 1)}\}$$

Il modello è l'esponenziale $f(x; \theta) = \frac{1}{\theta}e^{-x/\theta}$ per $x > 0$, cioè la Gamma della galleria con $k = 1$. (a) Ricava e calcola la stima ML $\hat{\theta}$. (b) Quanto vale la stima ML del tasso $\lambda = 1/\theta$? (c) Quanto vale la log-likelihood nel massimo? (d) La stima del tasso è distorta: $E\{\hat{\lambda}\} = c\,\lambda$. Quanto vale il fattore $c$ con questo $N$?`,
        answers: [
          risposta(md`(a) $\hat{\theta}$`, theta, tol(theta, 0.005, 0.005)),
          risposta(md`(b) $\hat{\lambda}$`, lambda, tol(lambda, 0.01, 0.002)),
          risposta('(c) log-likelihood nel massimo', lnL, tol(lnL, 0.01, 0.02)),
          risposta('(d) fattore $c$', fattore, 0.002),
        ],
        solution: md`**1. Log-likelihood.**

$$\ln p(\mathbf{X} \mid \theta) = \sum_{k=1}^{N}\left(-\ln\theta - \frac{x_k}{\theta}\right) = -N\ln\theta - \frac{1}{\theta}\sum_{k=1}^{N} x_k$$

**2. Derivata e soluzione.**

$$\frac{\partial \ln p}{\partial \theta} = -\frac{N}{\theta} + \frac{1}{\theta^2}\sum_{k=1}^{N} x_k = 0 \;\Rightarrow\; \hat{\theta} = \frac{1}{N}\sum_{k=1}^{N} x_k = \frac{${f(S, 1)}}{${N}} = ${f(theta, 4)}\ \text{s}$$

In $\hat{\theta}$ la derivata seconda vale $\frac{N}{\hat{\theta}^2} - \frac{2N\hat{\theta}}{\hat{\theta}^3} = -\frac{N}{\hat{\theta}^2} < 0$: è un massimo.

**3. Tasso.** Per l'invarianza della stima ML, $\hat{\lambda} = 1/\hat{\theta} = ${f(lambda, 4)}$ pacchetti al secondo.

**4. Valore nel massimo.** Poiché $\sum_k x_k/\hat{\theta} = N$: $\ln p(\mathbf{X} \mid \hat{\theta}) = -N\ln\hat{\theta} - N = -${N}\ln ${f(theta, 4)} - ${N} = ${f(lnL, 3)}$.

**5. Bias del tasso.** $\hat{\theta}$ è non distorta, $E\{\hat{\theta}\} = \theta$. La somma dei tempi è una Gamma di forma $N$ e $E\{1/\sum_k x_k\} = \frac{1}{(N-1)\theta}$, quindi

$$E\{\hat{\lambda}\} = \frac{N}{N-1}\lambda = ${f(fattore, 4)}\,\lambda$$

L'invarianza riguarda il valore della stima, non il bias. Il fattore tende a 1: la stima del tasso è asintoticamente non distorta, come prevedono le proprietà di ML anche quando a $N$ finito non esiste una stima efficiente.`,
      }
    },
  },
  {
    id: 'es08',
    title: 'Perché il prodotto, perché il logaritmo, che cosa descrive la likelihood',
    difficulty: 1,
    kind: 'concettuale',
    concepts: ['c02', 'c03', 'c07', 'c08', 'c09', 'c17'],
    generate: (rng) => {
      const xs = [rng.float(-2, 2, 1), rng.float(-2, 2, 1), rng.float(-2, 2, 1)]
      const lnL = (m: number) => somma(xs.map((x) => Math.log(gauss(x, m, 1))))
      const mA = rng.float(-2, 2, 1)
      let mB = rng.float(-2, 2, 1)
      if (Math.abs(mB - mA) < 0.05) mB = Number((mA + (mA > 0 ? -0.7 : 0.7)).toFixed(1))
      if (Math.abs(lnL(mA) - lnL(mB)) < 0.01) mB = Number((mB + (mB > 0 ? -0.5 : 0.5)).toFixed(1))
      const lA = lnL(mA)
      const lB = lnL(mB)
      const LA = Math.exp(lA)
      const LB = Math.exp(lB)
      const migliore = lA > lB ? 1 : 2
      const q = rng.pick([0.05, 0.1, 0.2, 0.3])
      const Nmin = Math.floor(308 / -Math.log10(q) + 1e-9) + 1
      const fattoriA = xs.map((x) => gauss(x, mA, 1))
      return {
        prompt: md`Rispondi a voce, in due minuti, alla domanda d'esame: formula della stima ML, perché la likelihood è un prodotto, che cosa descrive, perché si passa al logaritmo. Poi verifica con i numeri.

Tre letture iid da una gaussiana con $\sigma = 1$: $x_1 = ${f(xs[0], 1)}$, $x_2 = ${f(xs[1], 1)}$, $x_3 = ${f(xs[2], 1)}$. Due candidate per la media: A con $m = ${f(mA, 1)}$ e B con $m = ${f(mB, 1)}$. (a) Quanto vale la likelihood $p(\mathbf{X} \mid m)$ della candidata A? (b) Quanto vale la sua log-likelihood, calcolata come somma? (c) Quale candidata si accorda meglio con i dati (1 = A, 2 = B)? (d) Se ogni fattore della likelihood valesse circa $${f(q, 2)}$, da quanti campioni in su il prodotto scenderebbe sotto $10^{-308}$?`,
        answers: [
          risposta(md`(a) $p(\mathbf{X} \mid m_A)$`, LA, tol(LA, 0.01, 1e-9)),
          risposta(md`(b) $\ln p(\mathbf{X} \mid m_A)$`, lA, tol(lA, 0.005, 0.01)),
          codice('(c) candidata migliore (1 = A, 2 = B)', migliore),
          risposta('(d) numero di campioni', Nmin, 1.5),
        ],
        solution: md`**(a) Prodotto.** I campioni sono iid, quindi $p(\mathbf{X} \mid m_A) = \prod_k p(x_k \mid m_A)$. I tre fattori valgono $${fattoriA.map((v) => f(v, 4)).join(',\\ ')}$, e il prodotto è $${sci(LA)}$.

**(b) Somma.** $\ln p(\mathbf{X} \mid m_A) = \sum_k \ln p(x_k \mid m_A) = ${f(lA, 3)}$. Per la candidata B: likelihood $${sci(LB)}$, log-likelihood $${f(lB, 3)}$.

**(c) Confronto.** Vince la candidata ${migliore === 1 ? 'A' : 'B'}: ${migliore === 1 ? 'A' : 'B'} ha likelihood più alta e, poiché il logaritmo è monotono crescente, anche log-likelihood più alta. La classifica non cambia passando al logaritmo; cambia solo il valore.

**(d) Underflow.** $q^N < 10^{-308} \iff N > \frac{308}{-\log_{10} q} = \frac{308}{${f(-Math.log10(q), 4)}}$, quindi da $N = ${Nmin}$ campioni in su. $10^{-308}$ è circa il più piccolo numero normalizzato della doppia precisione (il valore preciso è circa $2.2 \cdot 10^{-308}$): sotto, il prodotto perde cifre significative, e sotto circa $5 \cdot 10^{-324}$, il più piccolo numero positivo, diventa zero. La somma dei logaritmi, invece, vale circa $${Nmin} \cdot \ln ${f(q, 2)} = ${f(Nmin * Math.log(q), 1)}$ e resta rappresentabile.

**Risposta modello.** La stima ML è $\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} p(\mathbf{X} \mid \boldsymbol{\theta})$: il valore dei parametri che massimizza la likelihood dei campioni osservati. Posso scriverla come prodotto $\prod_k p(\mathbf{x}_k \mid \boldsymbol{\theta})$ perché i campioni sono iid: l'indipendenza fattorizza la congiunta, l'identica distribuzione fa usare la stessa pdf in ogni fattore. La likelihood è la pdf letta come funzione di $\boldsymbol{\theta}$ con i dati fissi: misura la compatibilità (*compatibility/agreement*) tra un valore dei parametri e i dati, e non è una densità su $\boldsymbol{\theta}$. Passo al logaritmo perché è monotono crescente (*monotonically increasing*), quindi l'$\arg\max$ non cambia, e perché trasforma i prodotti in somme, più facili da derivare e al riparo dall'underflow.

**Griglia di valutazione.** Nella risposta a voce devono comparire: iid, $\arg\max$, monotono crescente, compatibilità tra parametri e dati.`,
      }
    },
  },
  {
    id: 'es09',
    title: 'ML è un buon stimatore?',
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c20', 'c21', 'c22', 'c23', 'c24', 'c25', 'c26', 'c27', 'c28'],
    generate: (rng) => {
      const N = rng.int(5, 50)
      const s2 = rng.pick([1, 2.25, 4, 9])
      const fattore = (N - 1) / N
      const atteso = fattore * s2
      const crb = s2 / N
      const affermazioni: [string, number][] = [
        ['Se esiste una stima efficiente e la stima ML è non distorta, allora la stima efficiente è quella ML.', 1],
        ['La stima ML è non distorta per ogni numero di campioni $N$.', 0],
        ['Anche se una stima efficiente non esiste, sotto le ipotesi di regolarità la stima ML è consistente.', 1],
        ["«Asintoticamente efficiente» significa che la varianza dell'errore tende a zero.", 0],
        ['Il teorema sull\'efficienza di ML vale per qualunque modello $p(\\mathbf{x} \\mid \\boldsymbol{\\theta})$, senza ipotesi.', 0],
      ]
      const [s1, s2b] = rng.shuffle(affermazioni).slice(0, 2)
      return {
        prompt: md`Costruisci la risposta completa alla domanda d'esame «ML è un buon stimatore?»: criterio di bontà, teorema sull'efficienza, tre proprietà asintotiche con le formule limite, limite a $N$ finito, conclusione. Poi rispondi.

Campioni iid da una gaussiana con varianza $\sigma^2 = ${f(s2, 2)}$, $N = ${N}$. (a) Di che fattore la stima ML della varianza sottostima in media $\sigma^2$? (b) Quanto vale $E\{\hat{\sigma}^2\}$? (c) Quanto vale il bound di Cramér-Rao per la stima della media? (d) Quanto vale il rapporto tra la varianza della media campionaria e quel bound?

Vero (1) o falso (0)? (e) ${s1[0]} (f) ${s2b[0]}`,
        answers: [
          risposta('(a) fattore', fattore, 0.002),
          risposta(md`(b) $E\{\hat{\sigma}^2\}$`, atteso, tol(atteso, 0.005, 0.002)),
          risposta('(c) bound di Cramér-Rao', crb, tol(crb, 0.01, 0.0005)),
          risposta('(d) rapporto varianza/bound', 1, 0.01),
          codice('(e) vero = 1, falso = 0', s1[1]),
          codice('(f) vero = 1, falso = 0', s2b[1]),
        ],
        solution: md`**(a)-(b)** La stima ML della varianza divide per $N$: $E\{\hat{\sigma}^2\} = \frac{N-1}{N}\sigma^2 = ${f(fattore, 4)} \cdot ${f(s2, 2)} = ${f(atteso, 4)}$.

**(c)-(d)** Per la media gaussiana l'informazione di Fisher è $N/\sigma^2$, quindi il bound è $\sigma^2/N = ${f(crb, 4)}$. La media campionaria ha proprio varianza $\sigma^2/N$: il rapporto vale 1, la stima è efficiente.

**(e)** ${s1[1] === 1 ? 'Vero.' : 'Falso.'} **(f)** ${s2b[1] === 1 ? 'Vero.' : 'Falso.'} Il teorema chiede ipotesi di regolarità su $p(\mathbf{x} \mid \boldsymbol{\theta})$; la stima ML può essere distorta a $N$ finito; l'efficienza asintotica riguarda il rapporto tra varianza e bound, che tende a 1.

**Risposta modello.** Giudico una stima dall'errore $\boldsymbol{\varepsilon} = \hat{\boldsymbol{\theta}} - \boldsymbol{\theta}$: bias $E\{\boldsymbol{\varepsilon}\}$ e varianza, da confrontare con il bound di Cramér-Rao $\mathrm{var}\{\varepsilon_i\} \geq [\mathrm{I}^{-1}(\boldsymbol{\theta})]_{ii}$. Una stima non distorta che raggiunge il bound è efficiente. Sotto certe ipotesi su $p(\mathbf{x} \mid \boldsymbol{\theta})$, se esiste una stima efficiente e la stima ML è non distorta, la stima efficiente è quella ML. Anche se una stima efficiente non esiste, ML è

$$\lim_{N \to +\infty} E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}, \qquad \lim_{N \to +\infty} \frac{\mathrm{var}\{\varepsilon_i\}}{[\mathrm{I}^{-1}(\boldsymbol{\theta})]_{ii}} = 1, \qquad \lim_{N \to +\infty} P\{\lVert\boldsymbol{\varepsilon}\rVert < \delta\} = 1$$

cioè asintoticamente non distorta, asintoticamente efficiente e consistente. Con pochi campioni può essere distorta, come la covarianza con $1/N$. Queste proprietà spiegano l'uso diffuso di ML nei problemi reali. Il confronto con la stima bayesiana è nel modulo sulla stima bayesiana.`,
      }
    },
  },
  {
    id: 'es10',
    title: 'Scegli il modello statistico per lo scenario',
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c29', 'c30', 'c31', 'c32', 'c34', 'c42', 'c43'],
    generate: (rng) => {
      const L = rng.pick([2, 4, 8, 16])
      const n = rng.pick([2, 3, 5, 10])
      interface Scenario {
        testo: string
        codice: number
        aspetto: string
        perche: string
        param?: { testo: string; valore: number }
      }
      const tutti: Scenario[] = [
        {
          testo: 'il rumore termico di un sensore di temperatura, somma di moltissimi contributi microscopici indipendenti',
          codice: 1,
          aspetto: 'natura intrinseca del fenomeno',
          perche: 'somma di molte cause indipendenti a varianza finita: per il teorema del limite centrale è gaussiana',
        },
        {
          testo: "l'ampiezza dell'eco di un georadar su un terreno omogeneo, prodotta da molti diffusori elementari",
          codice: 4,
          aspetto: 'natura intrinseca del fenomeno',
          perche: 'è il modulo di un vettore con due componenti gaussiane indipendenti, a media nulla e con la stessa varianza: Rayleigh',
        },
        {
          testo: md`l'intensità di un'immagine SAR ottenuta come media di $L = ${L}$ look indipendenti`,
          codice: 3,
          aspetto: 'pre-processing',
          perche: md`l'intensità di un look è esponenziale, cioè Gamma con $k = 1$; la media di $L$ esponenziali indipendenti è una Gamma di forma $k = L = ${L}$`,
          param: { testo: md`forma $k$ della Gamma`, valore: L },
        },
        {
          testo: 'gli importi delle transazioni con carta: positivi, con una lunga coda a destra, nati da effetti moltiplicativi',
          codice: 6,
          aspetto: 'natura intrinseca del fenomeno',
          perche: md`il logaritmo di un prodotto di fattori è una somma, quindi $\ln x$ è circa gaussiana: log-normale`,
        },
        {
          testo: md`la distanza di Mahalanobis al quadrato $(\mathbf{x} - \mathbf{m})^t\Sigma^{-1}(\mathbf{x} - \mathbf{m})$ delle letture normali di una macchina con $n = ${n}$ feature gaussiane`,
          codice: 5,
          aspetto: 'pre-processing ed estrazione della feature',
          perche: md`è la somma dei quadrati di $n$ gaussiane standard indipendenti: chi-quadro con $k = n = ${n}$ gradi di libertà`,
          param: { testo: md`gradi di libertà $k$ della chi-quadro`, valore: n },
        },
        {
          testo: 'la differenza tra due immagini satellitari della stessa zona (change detection), simmetrica ma con code più pesanti della gaussiana',
          codice: 2,
          aspetto: 'natura del fenomeno e rumore di acquisizione',
          perche: md`serve una famiglia simmetrica con forma regolabile: gaussiana generalizzata con $\beta < 2$ (con $\beta = 2$ sarebbe la gaussiana)`,
        },
      ]
      const forzato = rng.pick([2, 4])
      const altri = rng.shuffle([0, 1, 2, 3, 4, 5].filter((i) => i !== forzato)).slice(0, 3)
      const scelti = rng.shuffle([forzato, ...altri])
      const conParam = scelti.filter((i) => tutti[i].param !== undefined)
      const primo = conParam[0]
      const lettPrimo = lettere[scelti.indexOf(primo)]
      const nomi = ['gaussiano', 'gaussiano generalizzato', 'Gamma', 'Rayleigh', 'chi-quadro', 'log-normale']
      const elencoScenari = scelti.map((i, j) => `(${lettere[j]}) ${tutti[i].testo}.`).join('\n\n')
      const soluzioni = scelti
        .map((i, j) => `**(${lettere[j]}) ${nomi[tutti[i].codice - 1]}, codice ${tutti[i].codice}.** Aspetto: ${tutti[i].aspetto}. ${tutti[i].perche[0].toUpperCase()}${tutti[i].perche.slice(1)}.`)
        .join('\n\n')
      return {
        prompt: md`Per ogni scenario indica il modello più adatto tra i sei della fonte (1 = gaussiano, 2 = gaussiano generalizzato, 3 = Gamma, 4 = Rayleigh, 5 = chi-quadro, 6 = log-normale) e quale dei tre aspetti della scelta del modello la guida: natura del fenomeno, rumore di trasmissione e acquisizione, pre-processing ed estrazione delle feature.

${elencoScenari}

Infine: nello scenario (${lettPrimo}), quanto vale il parametro del modello?`,
        answers: [
          ...scelti.map((i, j) => codice(`(${lettere[j]}) codice del modello`, tutti[i].codice)),
          codice(`(${lettPrimo}) ${tutti[primo].param?.testo ?? 'parametro'}`, tutti[primo].param?.valore ?? 0),
        ],
        solution: md`${soluzioni}

**Il metodo.** Il modello si sceglie per la feature che entra davvero nel classificatore: il fenomeno suggerisce la famiglia, il rumore di mezzo e sensore la deforma, il pre-processing la trasforma. Quasi tutti i modelli nascono dalla gaussiana: la somma dei quadrati di $k$ gaussiane standard dà la chi-quadro (una Gamma di forma $k/2$ e scala 2), il modulo di due gaussiane indipendenti a media nulla e con la stessa varianza la Rayleigh, l'esponenziale di una gaussiana la log-normale. La scelta non è banale: con pochi campioni famiglie diverse si adattano quasi ugualmente bene allo stesso istogramma, e la stima ML ottimizza solo i parametri dentro la famiglia scelta.`,
      }
    },
  },
  {
    id: 'es11',
    title: 'Densità gaussiana 2-D con feature indipendenti in due modi',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c49', 'c51', 'c60', 'c61'],
    generate: (rng) => {
      const m1 = rng.float(2, 8, 1)
      const m2 = rng.int(5, 15)
      const s1 = rng.pick([0.5, 1, 1.5, 2])
      const s2 = rng.pick([0.5, 1, 2, 3])
      const a1 = rng.int(-2, 2)
      let a2 = rng.int(-2, 2)
      // Il punto non cade mai sulla media: con a1 = a2 = 0 la verifica p(x) = p(x1)p(x2) non avrebbe esponenziali.
      if (a1 === 0 && a2 === 0) a2 = rng.pick([-2, -1, 1, 2])
      const x1 = Number((m1 + a1 * s1).toFixed(2))
      const x2 = Number((m2 + a2 * s2).toFixed(2))
      const d2 = a1 * a1 + a2 * a2
      const cost = 1 / (2 * Math.PI * s1 * s2)
      const p = cost * Math.exp(-d2 / 2)
      const p1 = gauss(x1, m1, s1)
      const p2 = gauss(x2, m2, s2)
      return {
        prompt: md`Due feature di un salmone, luminosità $x_1$ e larghezza $x_2$, sono indipendenti e gaussiane: $m_1 = ${f(m1, 1)}$, $\sigma_1 = ${f(s1)}$, $m_2 = ${m2}$, $\sigma_2 = ${f(s2)}$. Quindi $\Sigma = \mathrm{diag}(\sigma_1^2, \sigma_2^2)$. Nel punto $\mathbf{x} = (${f(x1, 2)},\ ${f(x2, 2)})^t$: (a) quanto vale la distanza di Mahalanobis al quadrato da $\mathbf{m}$? (b) Quanto vale $p(\mathbf{x})$ con la formula multivariata? (c) Quanto valgono le marginali $p(x_1)$ e (d) $p(x_2)$? Verifica che $p(\mathbf{x}) = p(x_1)\,p(x_2)$.`,
        answers: [
          risposta('(a) distanza di Mahalanobis al quadrato', d2, 0.01),
          risposta(md`(b) $p(\mathbf{x})$`, p, tol(p, 0.01, 1e-6)),
          risposta(md`(c) $p(x_1)$`, p1, tol(p1, 0.01, 1e-5)),
          risposta(md`(d) $p(x_2)$`, p2, tol(p2, 0.01, 1e-5)),
        ],
        solution: md`**(a) Mahalanobis.** Con $\Sigma$ diagonale, $\Sigma^{-1} = \mathrm{diag}(1/\sigma_1^2, 1/\sigma_2^2)$ e la forma quadratica è la somma degli scarti standardizzati al quadrato:

$$d^2 = \frac{(x_1 - m_1)^2}{\sigma_1^2} + \frac{(x_2 - m_2)^2}{\sigma_2^2} = (${a1})^2 + (${a2})^2 = ${d2}$$

**(b) Formula multivariata.** $n = 2$ e $\vert\Sigma\vert^{1/2} = \sigma_1\sigma_2 = ${f(s1 * s2)}$:

$$p(\mathbf{x}) = \frac{1}{2\pi\,\sigma_1\sigma_2}\exp\left(-\frac{d^2}{2}\right) = ${f(cost, 5)} \cdot e^{-${f(d2 / 2, 1)}} = ${sci(p, 4)}$$

**(c)-(d) Marginali.**

$$p(x_1) = \frac{1}{\sigma_1\sqrt{2\pi}}e^{-(${a1})^2/2} = ${sci(p1, 4)}, \qquad p(x_2) = \frac{1}{\sigma_2\sqrt{2\pi}}e^{-(${a2})^2/2} = ${sci(p2, 4)}$$

Il prodotto vale $${sci(p1 * p2, 4)}$, uguale a $p(\mathbf{x})$: con $\Sigma$ diagonale il determinante è il prodotto delle varianze e l'esponenziale di una somma è il prodotto degli esponenziali. Per questo con feature indipendenti basta stimare $n$ medie e $n$ varianze.`,
      }
    },
  },
  {
    id: 'es12',
    title: 'Autovalori, autovettori e forma delle ellissi',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c59', 'c63', 'c64', 'c65', 'c66'],
    generate: (rng) => {
      let a = 1
      let b = 1
      let c = 1
      do {
        a = rng.int(1, 6)
        b = rng.int(1, 6)
        c = rng.pick([-3, -2, -1, 1, 2, 3])
      } while (a * b - c * c <= 0)
      const [l1, l2] = autovalori2(a, b, c)
      const vx = c
      const vy = l1 - a
      const nrm = Math.hypot(vx, vy)
      const sg = Math.sign(c)
      const e1 = [(sg * vx) / nrm, (sg * vy) / nrm]
      const angolo = (Math.atan(vy / vx) * 180) / Math.PI
      const rapporto = Math.sqrt(l1 / l2)
      const det = a * b - c * c
      const picco = 1 / (2 * Math.PI * Math.sqrt(det))
      return {
        prompt: md`La matrice di covarianza di due feature è

$$\Sigma = \begin{bmatrix} ${a} & ${c} \\ ${c} & ${b} \end{bmatrix}$$

Risolvi l'equazione caratteristica $\vert\Sigma - \lambda I\vert = 0$ ($I$ è la matrice identità) e trova gli autovettori. (a) Quanto vale l'autovalore maggiore $\lambda_1$ e (b) il minore $\lambda_2$? (c) Che angolo, in gradi, forma l'asse maggiore delle ellissi di isolivello con l'asse $x_1$ (tra $-90$ e $90$)? (d) Quanto vale il rapporto tra asse maggiore e asse minore? (e) Quanto vale $\vert\Sigma\vert$ e (f) il picco della gaussiana $\frac{1}{2\pi\vert\Sigma\vert^{1/2}}$?`,
        answers: [
          risposta(md`(a) $\lambda_1$`, l1, tol(l1, 0.005, 0.005)),
          risposta(md`(b) $\lambda_2$`, l2, tol(l2, 0.005, 0.005)),
          risposta('(c) angolo in gradi', angolo, 0.5),
          risposta('(d) rapporto tra gli assi', rapporto, tol(rapporto, 0.01, 0.005)),
          risposta(md`(e) $\vert\Sigma\vert$`, det, 0.01),
          risposta('(f) picco', picco, tol(picco, 0.01, 0.0005)),
        ],
        solution: md`**1. Equazione caratteristica.**

$$\vert\Sigma - \lambda I\vert = (${a} - \lambda)(${b} - \lambda) - (${c})^2 = \lambda^2 - ${a + b}\lambda + ${det} = 0$$

$$\lambda_{1,2} = \frac{${a + b}}{2} \pm \sqrt{\left(\frac{${a} - ${b}}{2}\right)^2 + (${c})^2} \;\Rightarrow\; \lambda_1 = ${f(l1, 4)},\quad \lambda_2 = ${f(l2, 4)}$$

Entrambi positivi: $\Sigma$ è definita positiva, come deve essere una covarianza invertibile. Controllo: $\lambda_1 + \lambda_2 = ${a + b}$ (traccia) e $\lambda_1\lambda_2 = ${det}$ (determinante).

**2. Autovettori.** Da $(\Sigma - \lambda_1 I)\mathbf{e}_1 = \mathbf{0}$, la prima riga dà $(${a} - \lambda_1)e_{11} ${c > 0 ? `+ ${c}` : `- ${-c}`}\,e_{12} = 0$, risolta da $\mathbf{e}_1 \propto (${Math.abs(c)},\ ${f(sg * vy, 4)})^t$. Normalizzato: $\mathbf{e}_1 = (${f(e1[0], 4)},\ ${f(e1[1], 4)})^t$. Poiché $\Sigma$ è simmetrica, $\mathbf{e}_2$ è ortogonale: $\mathbf{e}_2 = (${f(-e1[1], 4)},\ ${f(e1[0], 4)})^t$.

**3. Forma delle ellissi.** Gli isolivelli sono ellissi con gli assi lungo gli autovettori. L'asse maggiore segue $\mathbf{e}_1$, direzione di massima varianza, con angolo $\arctan\frac{${f(vy, 4)}}{${c}} = ${f(angolo, 2)}^\circ$. ${c > 0 ? 'Covarianza positiva: le ellissi salgono verso destra.' : 'Covarianza negativa: le ellissi scendono verso destra.'} I semiassi sono $d\sqrt{\lambda_1}$ e $d\sqrt{\lambda_2}$, quindi il rapporto è $\sqrt{\lambda_1/\lambda_2} = ${f(rapporto, 4)}$.

**4. Altezza.** $\vert\Sigma\vert = ${a} \cdot ${b} - (${c})^2 = ${det}$ e il picco è $\frac{1}{2\pi\sqrt{${det}}} = ${f(picco, 5)}$: più grande il determinante, più larga e bassa la campana.`,
      }
    },
  },
  {
    id: 'es13',
    title: 'Matrice di covarianza con le due formule',
    difficulty: 1,
    kind: 'numerico',
    concepts: ['c55', 'c56', 'c57', 'c58', 'c59'],
    generate: (rng) => {
      const pts = Array.from({ length: 4 }, () => [rng.int(2, 8), rng.int(5, 15)] as [number, number])
      const x1 = pts.map((p) => p[0])
      const x2 = pts.map((p) => p[1])
      const m1 = media(x1)
      const m2 = media(x2)
      const d1 = x1.map((v) => v - m1)
      const d2 = x2.map((v) => v - m2)
      const s11 = media(d1.map((v) => v * v))
      const s22 = media(d2.map((v) => v * v))
      const s12 = media(d1.map((v, i) => v * d2[i]))
      const e11 = media(x1.map((v) => v * v))
      const e22 = media(x2.map((v) => v * v))
      const e12 = media(x1.map((v, i) => v * x2[i]))
      const det = s11 * s22 - s12 * s12
      const pd = det > 1e-9 && s11 > 1e-9 ? 1 : 0
      const righe = pts
        .map((p, i) => `| $(${p[0]},\\ ${p[1]})$ | $${f(d1[i], 2)}$ | $${f(d2[i], 2)}$ | $${f(d1[i] * d1[i], 4)}$ | $${f(d2[i] * d2[i], 4)}$ | $${f(d1[i] * d2[i], 4)}$ |`)
        .join('\n')
      return {
        prompt: md`Quattro salmoni misurati come (luminosità, larghezza): ${pts.map((p) => `$(${p[0]},\\ ${p[1]})$`).join(', ')}. (a) Calcola il vettore medio $\hat{\mathbf{m}} = (\hat{m}_1, \hat{m}_2)^t$. (b) Calcola $\Sigma$ come media dei prodotti esterni degli scarti, con $\frac{1}{N}$: quanto valgono $\sigma_{11}$, $\sigma_{22}$ e $\sigma_{12}$? (c) Ricalcola $\Sigma$ con la forma $E\{\mathbf{x}\mathbf{x}^t\} - \mathbf{m}\mathbf{m}^t$ e verifica che coincide. (d) Quanto vale $\vert\Sigma\vert$? (e) La matrice è definita positiva (1) o solo semidefinita (0)?`,
        answers: [
          risposta(md`(a) $\hat{m}_1$`, m1, 0.005),
          risposta(md`(a) $\hat{m}_2$`, m2, 0.005),
          risposta(md`(b) $\sigma_{11}$`, s11, tol(s11, 0.01, 0.002)),
          risposta(md`(b) $\sigma_{22}$`, s22, tol(s22, 0.01, 0.002)),
          risposta(md`(b) $\sigma_{12}$`, s12, tol(s12, 0.01, 0.002)),
          risposta(md`(d) $\vert\Sigma\vert$`, det, tol(det, 0.01, 0.002)),
          codice('(e) definita positiva = 1, solo semidefinita = 0', pd),
        ],
        solution: md`**(a) Vettore medio.** $\hat{m}_1 = \frac{${somma(x1)}}{4} = ${f(m1, 4)}$, $\hat{m}_2 = \frac{${somma(x2)}}{4} = ${f(m2, 4)}$.

**(b) Media dei prodotti esterni.** $\Sigma = \frac{1}{N}\sum_k (\mathbf{x}_k - \hat{\mathbf{m}})(\mathbf{x}_k - \hat{\mathbf{m}})^t$; ogni prodotto esterno contiene i quadrati degli scarti sulla diagonale e il loro prodotto fuori.

| $\mathbf{x}_k$ | scarto 1 | scarto 2 | quadrato 1 | quadrato 2 | prodotto |
|---|---|---|---|---|---|
${righe}

Facendo la media delle ultime tre colonne:

$$\Sigma = \begin{bmatrix} ${f(s11, 4)} & ${f(s12, 4)} \\ ${f(s12, 4)} & ${f(s22, 4)} \end{bmatrix}$$

**(c) Seconda forma.** $E\{x_1^2\} = ${f(e11, 4)}$, $E\{x_2^2\} = ${f(e22, 4)}$, $E\{x_1x_2\} = ${f(e12, 4)}$. Sottraendo $\mathbf{m}\mathbf{m}^t$: $${f(e11, 4)} - ${f(m1 * m1, 4)} = ${f(e11 - m1 * m1, 4)}$, $${f(e22, 4)} - ${f(m2 * m2, 4)} = ${f(e22 - m2 * m2, 4)}$, $${f(e12, 4)} - ${f(m1 * m2, 4)} = ${f(e12 - m1 * m2, 4)}$. Stessa matrice: è la versione matriciale di $\mathrm{var} = E\{x^2\} - (E\{x\})^2$. La matrice è simmetrica perché $(x_1 - m_1)(x_2 - m_2) = (x_2 - m_2)(x_1 - m_1)$.

**(d)-(e)** $\vert\Sigma\vert = ${f(s11, 4)} \cdot ${f(s22, 4)} - (${f(s12, 4)})^2 = ${f(det, 4)}$. ${pd === 1 ? 'Determinante e traccia positivi: i due autovalori sono positivi e la matrice è definita positiva.' : 'Il determinante è nullo: un autovalore è zero, i punti stanno su una retta e la matrice è solo semidefinita positiva; $\\Sigma^{-1}$ non esiste e la gaussiana degenera.'} In ogni caso è semidefinita positiva, perché $\mathbf{a}^t\Sigma\mathbf{a}$ è la varianza di $\mathbf{a}^t\mathbf{x}$ e non può essere negativa. ${s12 > 1e-9 ? 'La covarianza positiva dice che luminosità e larghezza crescono insieme.' : s12 < -1e-9 ? 'La covarianza negativa dice che quando una feature cresce l\'altra tende a calare.' : 'La covarianza nulla dice che le due feature sono incorrelate.'}`,
      }
    },
  },
  {
    id: 'es14',
    title: 'Ipotesi del teorema del limite centrale',
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c46', 'c47', 'c30'],
    generate: (rng) => {
      const n = rng.pick([25, 36, 49, 64, 100])
      const mu = rng.pick([2, 4, 5, 8])
      const sd = mu * Math.sqrt(n)
      const z0 = rng.pick([-1, -0.5, 0.5, 1, 1.5, 2])
      const t = Math.round(n * mu + z0 * sd)
      const z = (t - n * mu) / sd
      const P = 1 - Phi(z)
      const casi: [string, number, string][] = [
        ['sommi solo 2 consumi', 1, 'con pochi addendi la somma conserva la forma degli addendi: due esponenziali danno una Gamma di forma 2, ancora asimmetrica'],
        ['sommi 100 copie dello stesso consumo (la stessa casa ripetuta)', 2, 'gli addendi sono dipendenti al massimo: la somma è 100 volte un solo consumo e resta esponenziale'],
        ['sommi 100 variabili di Cauchy indipendenti', 3, 'la Cauchy non ha varianza finita: la media di $n$ Cauchy è ancora una Cauchy, per ogni $n$'],
      ]
      const [testo, cod, perche] = rng.pick(casi)
      return {
        prompt: md`Il consumo giornaliero di una casa è esponenziale con media $\mu = ${mu}$ kWh (quindi deviazione standard $\sigma = ${mu}$ kWh), indipendente dalle altre case. Un quartiere ha $n = ${n}$ case.

Enuncia il teorema del limite centrale con le parole della fonte e indica le tre ipotesi. Poi: (a) quanto vale la media del consumo totale $S_n$? (b) E la sua deviazione standard? (c) Con l'approssimazione gaussiana, quanto vale $P\{S_n > ${t}\}$? (d) Se invece ${testo}, quale ipotesi viene a mancare? (1 = molte variabili, 2 = indipendenti e identicamente distribuite, 3 = varianza finita)`,
        answers: [
          risposta('(a) media di $S_n$', n * mu, tol(n * mu, 0.001, 0.5)),
          risposta('(b) deviazione standard di $S_n$', sd, tol(sd, 0.005, 0.05)),
          risposta('(c) probabilità', P, 0.005),
          codice('(d) ipotesi che manca', cod),
        ],
        solution: md`**Enunciato.** Se la somma di molte variabili aleatorie indipendenti e identicamente distribuite (iid) ha varianza finita, allora la somma è approssimativamente distribuita come una normale. Ipotesi: molte variabili, iid, varianza finita (per addendi iid equivale a ciascun addendo con varianza finita). In forma precisa:

$$\frac{S_n - n\mu}{\sigma\sqrt{n}} \longrightarrow N(0, 1)$$

**(a)-(b)** $E\{S_n\} = n\mu = ${n * mu}$ kWh; le varianze di addendi indipendenti si sommano, $\mathrm{var}\{S_n\} = n\sigma^2$, quindi la deviazione standard è $\sigma\sqrt{n} = ${mu}\sqrt{${n}} = ${f(sd, 2)}$ kWh.

**(c)** Standardizzo: $z = \frac{${t} - ${n * mu}}{${f(sd, 2)}} = ${f(z, 3)}$, e $P\{S_n > ${t}\} \approx 1 - \Phi(${f(z, 3)}) = ${f(P, 4)}$. Il singolo consumo è molto asimmetrico, la somma di ${n} consumi è già quasi una campana.

**(d)** Codice ${cod}: ${perche}.

**Il legame con la scelta del modello.** Molti fenomeni reali nascono da tante cause indipendenti, ciascuna con un piccolo effetto e varianza finita: per questo la gaussiana è ovunque, ed è il primo aspetto della scelta del modello, la natura intrinseca del fenomeno.`,
      }
    },
  },
  {
    id: 'es15',
    title: 'ML con un modello non derivabile: la laplaciana e la mediana',
    difficulty: 3,
    kind: 'dimostrazione',
    concepts: ['c36', 'c10', 'c44'],
    generate: (rng) => {
      const N = rng.pick([5, 7, 9])
      const xs = distinti(rng, N, 0.1, 10)
      const med = mediana(xs)
      const avg = media(xs)
      const S = (m: number) => somma(xs.map((x) => Math.abs(x - m)))
      const Smed = S(med)
      const Savg = S(avg)
      const b = N / Smed
      const ordinati = [...xs].sort((p, q) => p - q)
      return {
        prompt: md`La gaussiana generalizzata con $\beta = 1$ è la laplaciana, $f(x; m, b) = \frac{b}{2}e^{-b\vert x - m\vert}$. Mostra che massimizzare la log-likelihood rispetto a $m$ equivale a minimizzare $\sum_k \vert x_k - m\vert$ e che la soluzione è la mediana dei campioni.

Letture di uno strumento con rumore a code pesanti: $\{${elenco(xs, 1)}\}$. (a) Quanto vale la stima ML di $m$ con il modello laplaciano? (b) E con il modello gaussiano? (c) Quanto vale $\sum_k \vert x_k - m\vert$ nella stima laplaciana e (d) nella stima gaussiana? (e) Quanto vale la stima ML di $b$?`,
        answers: [
          risposta('(a) stima laplaciana di $m$', med, 0.01),
          risposta('(b) stima gaussiana di $m$', avg, 0.005),
          risposta('(c) somma dei valori assoluti nella mediana', Smed, tol(Smed, 0.005, 0.01)),
          risposta('(d) somma dei valori assoluti nella media', Savg, tol(Savg, 0.005, 0.01)),
          risposta(md`(e) $\hat{b}$`, b, tol(b, 0.01, 0.002)),
        ],
        solution: md`**1. Log-likelihood.**

$$\ln p(\mathbf{X} \mid m, b) = N\ln\frac{b}{2} - b\sum_{k=1}^{N}\vert x_k - m\vert$$

Il primo termine non dipende da $m$ e $b > 0$: massimizzare rispetto a $m$ equivale a minimizzare $S(m) = \sum_k \vert x_k - m\vert$.

**2. La derivata non si annulla: si guarda il segno.** $\vert x_k - m\vert$ non è derivabile in $m = x_k$. Fuori dai campioni, la derivata di $\vert x_k - m\vert$ rispetto a $m$ vale $-1$ se $x_k > m$ e $+1$ se $x_k < m$:

$$\frac{dS}{dm} = \#\{x_k < m\} - \#\{x_k > m\}$$

A sinistra della mediana ci sono più campioni a destra che a sinistra, quindi $S$ scende; a destra della mediana sale. Con $N$ dispari il minimo è nel campione centrale: la mediana. Qui i campioni ordinati sono $${elenco(ordinati, 1)}$ e la mediana è il ${(N + 1) / 2}° valore.

**3. Numeri.** (a) $\hat{m} = ${f(med, 1)}$. (b) La media campionaria vale $${f(avg, 4)}$. (c) $S(${f(med, 1)}) = ${f(Smed, 3)}$. (d) $S(${f(avg, 3)}) = ${f(Savg, 3)}$, maggiore o uguale, come deve essere. (e) Derivando rispetto a $b$: $\frac{N}{b} - \sum_k \vert x_k - \hat{m}\vert = 0$, quindi $\hat{b} = \frac{N}{S(\hat{m})} = \frac{${N}}{${f(Smed, 3)}} = ${f(b, 4)}$.

**4. Morale.** Cambiando il modello cambia lo stimatore ML della posizione: la media per la gaussiana ($\beta = 2$, minimi quadrati), la mediana per la laplaciana ($\beta = 1$, minimo dei valori assoluti), meno sensibile ai valori anomali. La stima ML ottimizza dentro la famiglia scelta: la scelta del modello non è neutra.`,
      }
    },
  },
  {
    id: 'es16',
    title: "ML per l'uniforme su [0, θ]: un massimo sul bordo, senza derivata nulla",
    difficulty: 2,
    kind: 'dimostrazione',
    concepts: ['c11', 'c22', 'c24'],
    generate: (rng) => {
      const theta = rng.pick([2, 3, 4, 5, 6])
      const N = rng.int(3, 8)
      const xs = Array.from({ length: N }, () => rng.float(0.1, theta, 1))
      const th = Math.max(...xs)
      const atteso = (N * theta) / (N + 1)
      const bias = -theta / (N + 1)
      const corretta = ((N + 1) / N) * th
      return {
        prompt: md`I ritardi di risposta di un sensore (in secondi) sono modellati come uniformi su $[0, \theta]$:

$$\{${elenco(xs, 1)}\}$$

Scrivi la likelihood, osserva che la derivata di $-N\ln\theta$ non si annulla mai e trova il massimo. (a) Quanto vale la stima ML $\hat{\theta}$? Se il valore vero è $\theta = ${theta}$: (b) quanto vale $E\{\hat{\theta}\}$ con $N = ${N}$? (c) Quanto vale il bias? (d) Quanto vale la stima corretta $\frac{N+1}{N}\hat{\theta}$? Spiega infine perché questo modello viola le ipotesi su $p(\mathbf{x} \mid \boldsymbol{\theta})$ del teorema sulle proprietà di ML.`,
        answers: [
          risposta(md`(a) $\hat{\theta}$`, th, 0.01),
          risposta(md`(b) $E\{\hat{\theta}\}$`, atteso, tol(atteso, 0.005, 0.005)),
          risposta('(c) bias', bias, tol(bias, 0.01, 0.005)),
          risposta('(d) stima corretta', corretta, tol(corretta, 0.005, 0.005)),
        ],
        solution: md`**1. Likelihood.** Ogni campione ha densità $1/\theta$ se $0 \leq x_k \leq \theta$ e 0 altrimenti. Il prodotto è non nullo solo se tutti i campioni stanno sotto $\theta$:

$$p(\mathbf{X} \mid \theta) = \begin{cases} \theta^{-N} & \theta \geq \max_k x_k \\ 0 & \text{altrimenti} \end{cases}$$

**2. Nessuna derivata nulla.** Dove è positiva, $\ln p = -N\ln\theta$ ha derivata $-N/\theta < 0$: non si annulla mai e la likelihood decresce. Il massimo sta sul bordo della regione ammessa, nel più piccolo $\theta$ compatibile con i dati:

$$\hat{\theta} = \max_k x_k = ${f(th, 1)}$$

**3. Valore atteso.** $P\{\hat{\theta} \leq t\} = (t/\theta)^N$ per $0 \leq t \leq \theta$, quindi la densità di $\hat{\theta}$ è $N t^{N-1}/\theta^N$ e

$$E\{\hat{\theta}\} = \int_0^{\theta} t\,\frac{N t^{N-1}}{\theta^N}\,dt = \frac{N}{N+1}\theta = \frac{${N}}{${N + 1}} \cdot ${theta} = ${f(atteso, 4)}$$

Bias $= -\frac{\theta}{N+1} = ${f(bias, 4)}$: la stima sottostima sempre, perché il campione più grande sta sotto $\theta$. Per $N \to \infty$ il bias va a zero: asintoticamente non distorta. La stima corretta $\frac{N+1}{N}\hat{\theta} = ${f(corretta, 4)}$ è non distorta, ma non è più la stima ML.

**4. Le ipotesi violate.** Il teorema sulle proprietà di ML vale «in certain hypotheses regarding $p(\mathbf{x} \mid \boldsymbol{\theta})$»: le condizioni di regolarità del bound di Cramér-Rao. Qui il supporto $[0, \theta]$ dipende dal parametro, la log-likelihood non è derivabile nel massimo e non posso scambiare derivata e integrale. È il controesempio classico: la varianza di $\hat{\theta}$ scende come $1/N^2$, più in fretta di quanto il bound prevedrebbe.`,
      }
    },
  },
  {
    id: 'es17',
    title: 'ML contro bayesiana, stima ML contro criterio ML',
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c68', 'c69', 'c06', 'c23'],
    generate: (rng) => {
      const s2 = rng.pick([1, 4])
      const s02 = rng.pick([0.25, 1, 4])
      const mu0 = rng.pick([0, 1, 2])
      const N = rng.int(2, 30)
      const xbar = rng.float(-1, 3, 2)
      const den = N * s02 + s2
      const w = (N * s02) / den
      const muN = w * xbar + (s2 / den) * mu0
      const sN2 = (s02 * s2) / den
      let p1 = rng.float(0.05, 0.5, 2)
      let p2 = rng.float(0.05, 0.5, 2)
      if (Math.abs(p1 - p2) < 0.005) p2 = Number((p1 + (p1 < 0.3 ? 0.05 : -0.05)).toFixed(2))
      const P1 = rng.pick([0.2, 0.3, 0.7, 0.8])
      const P2 = Number((1 - P1).toFixed(1))
      if (Math.abs(P1 * p1 - P2 * p2) < 1e-9) p1 = Number((p1 + 0.01).toFixed(2))
      const ml = p1 >= p2 ? 1 : 2
      const map = P1 * p1 >= P2 * p2 ? 1 : 2
      return {
        prompt: md`Rispondi a voce alle domande d'esame «ML è migliore o no della stima bayesiana? Perché?» e «In quali casi ML e bayesiana coincidono?», poi distingui la stima ML dei parametri dal criterio ML di classificazione. Verifica con i numeri.

Media ignota di una gaussiana con $\sigma^2 = ${s2}$ nota, prior $p(\mu) \sim N(${mu0}, ${f(s02, 2)})$, $N = ${N}$ campioni con media campionaria $\bar{X} = ${f(xbar, 2)}$. (a) Quanto vale la media della posterior $\mu_N$? (b) E la sua varianza $\sigma_N^2$? (c) Quanto pesa la media campionaria in $\mu_N$?

Classificazione di un campione $\mathbf{x}$ con $p(\mathbf{x} \mid \omega_1) = ${f(p1, 2)}$, $p(\mathbf{x} \mid \omega_2) = ${f(p2, 2)}$, $P(\omega_1) = ${f(P1, 1)}$, $P(\omega_2) = ${f(P2, 1)}$. (d) Quale classe sceglie il criterio ML? (e) E il criterio MAP? (1 = $\omega_1$, 2 = $\omega_2$)`,
        answers: [
          risposta(md`(a) $\mu_N$`, muN, tol(muN, 0.005, 0.005)),
          risposta(md`(b) $\sigma_N^2$`, sN2, tol(sN2, 0.01, 0.0005)),
          risposta('(c) peso della media campionaria', w, 0.003),
          codice('(d) classe scelta da ML', ml),
          codice('(e) classe scelta da MAP', map),
        ],
        solution: md`**(a)-(c) Posterior gaussiana.**

$$\mu_N = \frac{N\sigma_0^2}{N\sigma_0^2 + \sigma^2}\,\bar{X} + \frac{\sigma^2}{N\sigma_0^2 + \sigma^2}\,\mu_0 = ${f(w, 4)} \cdot ${f(xbar, 2)} + ${f(1 - w, 4)} \cdot ${mu0} = ${f(muN, 4)}$$

$$\sigma_N^2 = \frac{\sigma_0^2\sigma^2}{N\sigma_0^2 + \sigma^2} = \frac{${f(s02 * s2, 2)}}{${f(den, 2)}} = ${f(sN2, 4)}$$

La stima ML sarebbe $\bar{X} = ${f(xbar, 2)}$. Il peso dei dati, $${f(w, 4)}$, tende a 1 per $N \to \infty$ o per $\sigma_0^2 \to \infty$ (prior piatta): sono i due casi in cui ML e bayesiana coincidono. Intanto $\sigma_N^2 \to 0$ e la posterior tende a una delta di Dirac.

**(d)-(e) Criteri di decisione.** ML confronta $p(\mathbf{x} \mid \omega_1) = ${f(p1, 2)}$ e $p(\mathbf{x} \mid \omega_2) = ${f(p2, 2)}$: sceglie $\omega_${ml}$. MAP confronta $P(\omega_1)p(\mathbf{x} \mid \omega_1) = ${f(P1 * p1, 3)}$ e $P(\omega_2)p(\mathbf{x} \mid \omega_2) = ${f(P2 * p2, 3)}$: sceglie $\omega_${map}$. ${ml === map ? 'Qui le due decisioni coincidono.' : 'Qui le decisioni differiscono: le prior spostano la scelta. Con prior uguali ML e MAP coinciderebbero.'}

**Risposta modello.** In ML $\boldsymbol{\theta}$ è fisso ma ignoto e stimo un punto; nella stima bayesiana $\boldsymbol{\theta}$ è una variabile aleatoria con prior e stimo una distribuzione, $p(\mathbf{x} \mid \mathbf{X}) = \int p(\mathbf{x} \mid \boldsymbol{\theta})\,p(\boldsymbol{\theta} \mid \mathbf{X})\,d\boldsymbol{\theta}$. Coincidono con infiniti campioni o con prior uniforme, perché allora la posterior è proporzionale alla likelihood. In pratica si preferisce ML per minore complessità computazionale e interpretabilità; la bayesiana conviene con pochi dati e una prior affidabile.

La stima ML dei parametri varia $\boldsymbol{\theta}$ tenendo fissi i campioni di training, $\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} p(\mathbf{X} \mid \boldsymbol{\theta})$. Il criterio ML di classificazione tiene fisso il campione nuovo e varia la classe: $\mathbf{x} \in \omega_j \iff p(\mathbf{x} \mid \omega_j) \geq p(\mathbf{x} \mid \omega_i)$. Si usano in sequenza: prima stimo con ML le pdf di classe, poi le do al criterio di decisione.`,
      }
    },
  },
  {
    id: 'es18',
    title: 'Consistenza: condizione sufficiente e controesempio',
    difficulty: 3,
    kind: 'dimostrazione',
    concepts: ['c24', 'c26'],
    generate: (rng) => {
      const sigma = rng.pick([0.5, 1, 2, 3])
      const delta = rng.pick([0.05, 0.1, 0.2])
      const alfa = rng.pick([0.01, 0.05, 0.1])
      const Nmin = Math.ceil(Number(((sigma * sigma) / (alfa * delta * delta)).toFixed(6)))
      const theta = rng.pick([1, 2, 5])
      const N1 = rng.pick([10, 100, 1000])
      const bias = 1 - theta / N1
      const Perr = 1 / N1
      return {
        prompt: md`(1) Partendo da $E\{\varepsilon^2\} = \mathrm{var}\{\varepsilon\} + (E\{\varepsilon\})^2$ e dalla disuguaglianza di Chebyshev, dimostra che una stima asintoticamente non distorta con varianza che tende a zero è consistente.

(2) Applicazione: la media campionaria di una gaussiana con $\sigma = ${f(sigma)}$ ha varianza $\sigma^2/N$. Qual è il più piccolo $N$ che garantisce $P\{\vert\hat{m} - m\vert \geq ${f(delta)}\} \leq ${f(alfa)}$ secondo Chebyshev?

(3) Controesempio: con $\theta = ${theta}$, la stima vale $\hat{\theta} = \theta$ con probabilità $1 - 1/N$ e $\hat{\theta} = N$ con probabilità $1/N$. Con $N = ${N1}$: quanto vale il bias $E\{\hat{\theta}\} - \theta$? Quanto vale $P\{\vert\hat{\theta} - \theta\vert \geq \delta\}$ per un $\delta$ piccolo? A che valore tende il bias per $N \to \infty$?`,
        answers: [
          risposta('(2) $N$ minimo', Nmin, 0.5),
          risposta(md`(3) bias con $N = ${N1}$`, bias, tol(bias, 0.005, 0.001)),
          risposta(md`(3) probabilità d'errore con $N = ${N1}$`, Perr, tol(Perr, 0.01, 0.0001)),
          risposta('(3) limite del bias', 1, 0.01),
        ],
        solution: md`**1. Condizione sufficiente.** Con $\varepsilon = \hat{\theta} - \theta$:

$$E\{\varepsilon^2\} = \mathrm{var}\{\varepsilon\} + (E\{\varepsilon\})^2$$

Se la stima è asintoticamente non distorta, $E\{\varepsilon\} \to 0$; se la varianza tende a zero, anche il primo termine va a zero. Quindi $E\{\varepsilon^2\} \to 0$. Per la disuguaglianza di Chebyshev, per ogni $\delta > 0$

$$P\{\vert\varepsilon\vert \geq \delta\} \leq \frac{E\{\varepsilon^2\}}{\delta^2} \to 0 \;\Rightarrow\; \lim_{N \to +\infty} P\{\vert\varepsilon\vert < \delta\} = 1$$

cioè la stima è consistente. La stima ML soddisfa entrambe le condizioni (il bias svanisce e la varianza segue il bound, che scende come $1/N$), per questo è consistente.

**2. Numeri.** La media campionaria è non distorta, quindi $E\{\varepsilon^2\} = \sigma^2/N$ e $P\{\vert\hat{m} - m\vert \geq \delta\} \leq \frac{\sigma^2}{N\delta^2}$. Chiedo $\frac{\sigma^2}{N\delta^2} \leq ${f(alfa)}$:

$$N \geq \frac{\sigma^2}{${f(alfa)}\,\delta^2} = \frac{${f(sigma * sigma, 2)}}{${f(alfa)} \cdot ${f(delta * delta, 4)}} = ${Nmin}$$

Chebyshev è prudente: con la distribuzione gaussiana di $\hat{m}$ basterebbero molti meno campioni.

**3. Controesempio.** $E\{\hat{\theta}\} = \theta\left(1 - \frac{1}{N}\right) + N \cdot \frac{1}{N} = \theta + 1 - \frac{\theta}{N}$, quindi il bias è $1 - \frac{\theta}{N} = ${f(bias, 4)}$ con $N = ${N1}$, e tende a $1$, non a zero. Eppure $P\{\vert\hat{\theta} - \theta\vert \geq \delta\} = P\{\hat{\theta} = N\} = \frac{1}{N} = ${f(Perr, 4)} \to 0$: la stima è consistente. Il valore raro $N$, sempre più improbabile ma sempre più grande, tiene alto il valore atteso senza toccare la convergenza in probabilità.

**Conclusione.** «Asintoticamente non distorta e varianza che tende a zero» è condizione sufficiente per la consistenza, non necessaria, anche se la slide la chiama «necessary condition». I passaggi sono nella dimostrazione [«condizione sufficiente per la consistenza»](#derivation:der16).`,
      }
    },
  },
  {
    id: 'es19',
    title: 'Rayleigh: la stima ML di σ² è non distorta ed efficiente, quella di σ no',
    difficulty: 3,
    kind: 'dimostrazione',
    concepts: ['c38', 'c21', 'c67'],
    generate: (rng) => {
      const sigma = rng.pick([0.5, 1, 1.5, 2, 3])
      const N = rng.int(5, 20)
      const s4 = sigma ** 4
      const varS2 = s4 / N
      const fisher = N / s4
      const r = rapportoGamma(N) / Math.sqrt(N)
      const biasS = sigma * (r - 1)
      return {
        prompt: md`Per la Rayleigh la stima ML è $\hat{\sigma}^2 = \frac{1}{2N}\sum_k x_k^2$. Usando $x^2 = z_1^2 + z_2^2$ con $z_1, z_2$ gaussiane indipendenti a media nulla e varianza $\sigma^2$, dimostra che $E\{\hat{\sigma}^2\} = \sigma^2$ e $\mathrm{var}\{\hat{\sigma}^2\} = \sigma^4/N$; calcola l'informazione di Fisher rispetto a $\sigma^2$ e concludi che la stima è efficiente. Spiega poi perché $\hat{\sigma} = \sqrt{\hat{\sigma}^2}$ è distorta.

Con $\sigma = ${f(sigma)}$ e $N = ${N}$: (a) quanto vale $\mathrm{var}\{\hat{\sigma}^2\}$? (b) Quanto vale l'informazione di Fisher $\mathrm{I}(\sigma^2)$ degli $N$ campioni? (c) Quanto vale il rapporto tra la varianza e il bound di Cramér-Rao? (d) Sapendo che $E\{\hat{\sigma}\} = \sigma\,\frac{\Gamma(N + 1/2)}{\Gamma(N)\sqrt{N}}$, quanto vale il rapporto $E\{\hat{\sigma}\}/\sigma$? (e) Quanto vale il bias $E\{\hat{\sigma}\} - \sigma$?`,
        answers: [
          risposta(md`(a) $\mathrm{var}\{\hat{\sigma}^2\}$`, varS2, tol(varS2, 0.01, 0.0005)),
          risposta(md`(b) $\mathrm{I}(\sigma^2)$`, fisher, tol(fisher, 0.01, 0.001)),
          risposta('(c) rapporto varianza/bound', 1, 0.01),
          risposta(md`(d) $E\{\hat{\sigma}\}/\sigma$`, r, 0.001),
          risposta('(e) bias di $\\hat{\\sigma}$', biasS, tol(biasS, 0.02, 0.0005)),
        ],
        solution: md`**1. Media.** $z_i \sim N(0, \sigma^2)$, quindi $E\{z_i^2\} = \sigma^2$ ed $E\{x^2\} = 2\sigma^2$:

$$E\{\hat{\sigma}^2\} = \frac{1}{2N}\sum_{k=1}^{N} E\{x_k^2\} = \frac{1}{2N} \cdot N \cdot 2\sigma^2 = \sigma^2$$

**2. Varianza.** $x^2/\sigma^2 = (z_1^2 + z_2^2)/\sigma^2$ è una chi-quadro con 2 gradi di libertà, cioè un'esponenziale di media 2 e varianza 4: $\mathrm{var}\{x^2\} = 4\sigma^4$. I campioni sono indipendenti:

$$\mathrm{var}\{\hat{\sigma}^2\} = \frac{1}{4N^2} \cdot N \cdot 4\sigma^4 = \frac{\sigma^4}{N} = ${sci(varS2, 4)}$$

**3. Informazione di Fisher.** Per un campione, con $s = \sigma^2$: $\ln p(x \mid s) = \ln x - \ln s - \frac{x^2}{2s}$, $\frac{\partial^2 \ln p}{\partial s^2} = \frac{1}{s^2} - \frac{x^2}{s^3}$. Cambiando segno e prendendo il valore atteso: $-\frac{1}{s^2} + \frac{2s}{s^3} = \frac{1}{s^2}$. Per $N$ campioni:

$$\mathrm{I}(\sigma^2) = \frac{N}{\sigma^4} = ${sci(fisher, 4)}, \qquad \text{bound} = \mathrm{I}^{-1}(\sigma^2) = \frac{\sigma^4}{N}$$

La varianza raggiunge il bound: il rapporto vale 1 e la stima è efficiente. È un caso concreto del teorema: esiste una stima efficiente, la stima ML è non distorta, quindi la stima efficiente è quella ML.

**4. La stima di $\sigma$.** Per l'invarianza la stima ML di $\sigma$ è $\hat{\sigma} = \sqrt{\hat{\sigma}^2}$. La radice è concava, quindi per la disuguaglianza di Jensen $E\{\sqrt{\hat{\sigma}^2}\} < \sqrt{E\{\hat{\sigma}^2\}} = \sigma$: sottostima. Con $\sum_k x_k^2 = \sigma^2\chi^2_{2N}$ si ottiene la formula data:

$$\frac{E\{\hat{\sigma}\}}{\sigma} = \frac{\Gamma(N + 1/2)}{\Gamma(N)\sqrt{N}} = ${f(r, 4)}, \qquad E\{\hat{\sigma}\} - \sigma = ${sci(biasS, 3)}$$

Il rapporto tende a 1 per $N \to \infty$: asintoticamente non distorta. L'invarianza conserva il valore della stima, non la non distorsione.

**Riepilogo con i dati dell'esercizio.** Con $\sigma = ${f(sigma)}$ e $N = ${N}$: $\mathrm{var}\{\hat{\sigma}^2\} = \sigma^4/N = ${sci(varS2, 4)}$, uguale al bound $\mathrm{I}^{-1}(\sigma^2)$ (rapporto 1); $E\{\hat{\sigma}\}/\sigma = ${f(r, 4)}$ e bias di $\hat{\sigma}$ pari a $${sci(biasS, 3)}$.`,
      }
    },
  },
]
