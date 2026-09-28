// Esercizi generativi del modulo m04 (bontà di uno stimatore, bound di Cramér-Rao, proprietà asintotiche):
// uno per ogni esercizio dell'inventario (es01-es21). Ogni generatore usa solo rng: stesso seed, stessa istanza.
// Anche gli esercizi concettuali e le dimostrazioni chiedono almeno un numero o una scelta codificata,
// così la pagina può correggere la risposta; la soluzione riporta comunque il ragionamento completo.
import { md } from '../../types'
import type { Exercise, ExerciseAnswer } from '../../types'

// ---------------------------------------------------------------------------------------------------
// Formattazione e risposte
// ---------------------------------------------------------------------------------------------------

/** Numero in LaTeX con s cifre significative, mai -0; i valori molto piccoli o molto grandi in notazione a·10^b. */
const g = (x: number, s = 4): string => {
  if (!Number.isFinite(x)) throw new Error(`numero non finito: ${x}`)
  const a = Math.abs(x)
  if (a < 1e-12) return '0'
  if (a >= 1e-4 && a < 1e6) {
    const r = Number(x.toPrecision(s))
    return String(r === 0 ? 0 : r)
  }
  const e = Math.floor(Math.log10(a))
  const m = Number((x / 10 ** e).toPrecision(s))
  return md`${m} \cdot 10^{${e}}`
}
/** Tolleranza relativa con un minimo assoluto. */
const tol = (v: number, rel = 0.01, abs = 1e-6) => Math.max(abs, Math.abs(v) * rel)
const ans = (label: string, value: number, tolerance = tol(value)): ExerciseAnswer => ({ label, value, tolerance })
/** Risposta intera (conteggi, codici, N minimi). */
const intero = (label: string, value: number): ExerciseAnswer => ({ label, value, tolerance: 0.1 })
/** Risposta che vale zero: serve una tolleranza assoluta. */
const zero = (label: string): ExerciseAnswer => ({ label, value: 0, tolerance: 0.001 })
/** Parte intera superiore al riparo dai residui binari (100.00000000000001 non deve diventare 101). */
const ceilSafe = (x: number) => Math.ceil(x - 1e-9)

/** Funzione d'errore (Abramowitz e Stegun 7.1.26, errore < 1.5e-7). */
const erf = (x: number) => {
  const sgn = x < 0 ? -1 : 1
  const t = 1 / (1 + 0.3275911 * Math.abs(x))
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)
  return sgn * y
}
/** Funzione di distribuzione della normale standard. */
const Phi = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2))
/** Densità gaussiana 1-D. */
const gauss = (x: number, m: number, s: number) => Math.exp(-((x - m) ** 2) / (2 * s * s)) / (Math.sqrt(2 * Math.PI) * s)

// ---------------------------------------------------------------------------------------------------
// Esercizi
// ---------------------------------------------------------------------------------------------------

export const exercises: Exercise[] = [
  {
    id: 'es01',
    title: 'Bias, varianza ed errore quadratico medio di due stimatori della media',
    difficulty: 1,
    kind: 'numerico',
    concepts: ['c15', 'c16', 'c17', 'c19'],
    generate: (rng) => {
      const m = rng.float(2, 8, 1)
      const s = rng.float(0.5, 3, 1)
      const N = rng.pick([5, 10, 20, 50])
      const a = rng.pick([0.8, 0.9])
      const varA = (s * s) / N
      const biasB = (a - 1) * m
      const varB = a * a * varA
      const mseA = varA
      const mseB = varB + biasB * biasB
      const vince = mseA <= mseB ? 1 : 2
      return {
        prompt: md`La telecamera dell'impianto di confezionamento misura la luminosità (*lightness*) dei salmoni. Le misure sono campioni iid gaussiani con media vera $m = ${g(m)}$ e deviazione standard $\sigma = ${g(s)}$. Con $N = ${N}$ salmoni confronti due stimatori della media:

- A, la media campionaria: $\hat{m}_A = \frac{1}{N}\sum_{k=1}^{N} x_k$;
- B, la media campionaria ristretta verso zero (*shrinkage*): $\hat{m}_B = ${a}\,\hat{m}_A$.

Per ciascuno calcola il bias $E\{\varepsilon\} = E\{\hat{m}\} - m$, la varianza $\operatorname{var}\{\varepsilon\}$ e l'errore quadratico medio (*mean squared error*) $E\{\varepsilon^2\}$. Quale dei due è non polarizzato (*unbiased*)? Quale ha l'errore quadratico medio più piccolo?`,
        answers: [
          zero(md`$E\{\varepsilon_A\}$`),
          ans(md`$\operatorname{var}\{\varepsilon_A\}$`, varA),
          ans(md`$E\{\varepsilon_A^2\}$`, mseA),
          ans(md`$E\{\varepsilon_B\}$`, biasB),
          ans(md`$\operatorname{var}\{\varepsilon_B\}$`, varB),
          ans(md`$E\{\varepsilon_B^2\}$`, mseB),
          intero('errore quadratico medio più piccolo (1 = A, 2 = B)', vince),
        ],
        solution: md`**1. L'errore di stima.** Per entrambi gli stimatori $\varepsilon = \hat{m} - m$. I valori attesi si calcolano sui training set possibili, con $m$ fisso.

**2. Stimatore A.** Per la linearità del valore atteso $E\{\hat{m}_A\} = \frac{1}{N}\sum_{k=1}^{N} E\{x_k\} = m$, quindi $E\{\varepsilon_A\} = 0$: A è non polarizzato. Con campioni indipendenti le varianze si sommano:

$$\operatorname{var}\{\varepsilon_A\} = \operatorname{var}\{\hat{m}_A\} = \frac{1}{N^2}\sum_{k=1}^{N}\operatorname{var}\{x_k\} = \frac{\sigma^2}{N} = \frac{${g(s * s)}}{${N}} = ${g(varA)}$$

**3. Stimatore B.** $E\{\hat{m}_B\} = a\,m$, quindi $E\{\varepsilon_B\} = (a - 1)\,m = (${a} - 1)\cdot ${g(m)} = ${g(biasB)}$: B è polarizzato. La costante esce al quadrato dalla varianza:

$$\operatorname{var}\{\varepsilon_B\} = a^2\,\frac{\sigma^2}{N} = ${g(a * a)} \cdot ${g(varA)} = ${g(varB)}$$

**4. Errore quadratico medio.** Vale $E\{\varepsilon^2\} = \operatorname{var}\{\varepsilon\} + (E\{\varepsilon\})^2$ (passaggi nella dimostrazione [«errore quadratico medio = varianza + bias²»](#derivation:der03)):

$$E\{\varepsilon_A^2\} = ${g(varA)} + 0 = ${g(mseA)}, \qquad E\{\varepsilon_B^2\} = ${g(varB)} + (${g(biasB)})^2 = ${g(mseB)}$$

**5. Confronto.** ${vince === 1 ? 'Qui vince A: il bias al quadrato di B costa più della varianza che B risparmia.' : 'Qui vince B: il bias al quadrato costa meno della varianza risparmiata.'} In generale B batte A quando $(1 - a^2)\,\frac{\sigma^2}{N} > (1 - a)^2 m^2$: pochi campioni, molto rumore, media piccola.

B ha varianza sotto $\sigma^2/N$, che è il bound di Cramér-Rao per la media: nessuna contraddizione, perché il bound riguarda solo gli stimatori non polarizzati. Per $N \to +\infty$ la varianza di B va a zero ma il bias $(a - 1)\,m$ resta: B converge ad $a\,m$, quindi non è asintoticamente non polarizzato né consistente. A è non polarizzato, efficiente e consistente.`,
      }
    },
  },
  {
    id: 'es02',
    title: 'Bound di Cramér-Rao per la luminosità media e numero minimo di campioni',
    difficulty: 1,
    kind: 'numerico',
    concepts: ['c22', 'c24', 'c28', 'c29'],
    generate: (rng) => {
      const s = rng.float(1, 4, 1)
      const N = rng.pick([10, 25, 50, 100])
      const soglia = rng.pick([0.1, 0.2, 0.5])
      const I = N / (s * s)
      const bound = (s * s) / N
      const dev = Math.sqrt(bound)
      const rapporto = (s * s) / (soglia * soglia)
      const Nmin = ceilSafe(rapporto)
      return {
        prompt: md`La luminosità dei salmoni è gaussiana con deviazione standard nota $\sigma = ${g(s)}$ (la conosci dalla calibrazione della telecamera); la media $m$ è ignota e la stimi con $N = ${N}$ salmoni.

(a) Quanto vale l'informazione di Fisher (*Fisher information*) $I(m)$? (b) Quanto vale il bound di Cramér-Rao sulla varianza di uno stimatore non polarizzato di $m$? (c) Qual è la deviazione standard minima raggiungibile? (d) Quanti salmoni servono, al minimo, perché la deviazione standard minima non superi $${g(soglia)}$? (e) La media campionaria è efficiente?`,
        answers: [
          ans('(a) $I(m)$', I),
          ans('(b) bound $I^{-1}(m)$', bound),
          ans('(c) deviazione standard minima', dev),
          intero('(d) $N$ minimo', Nmin),
          intero('(e) efficiente (1 = sì, 0 = no)', 1),
        ],
        solution: md`**1. Log-likelihood.** Con campioni iid la likelihood è il prodotto delle densità, quindi il logaritmo è una somma:

$$\ln p(\mathbf{X}|m) = -\frac{N}{2}\ln(2\pi\sigma^2) - \frac{1}{2\sigma^2}\sum_{k=1}^{N}(x_k - m)^2$$

**2. Score.** $\frac{\partial \ln p(\mathbf{X}|m)}{\partial m} = \frac{1}{\sigma^2}\sum_{k=1}^{N}(x_k - m)$.

**3. Informazione di Fisher** (definizione della slide con $r = 1$):

$$I(m) = E\left\{\left(\frac{1}{\sigma^2}\sum_{k=1}^{N}(x_k - m)\right)^2\right\} = \frac{1}{\sigma^4}\sum_{k=1}^{N}E\{(x_k - m)^2\} = \frac{N}{\sigma^2} = \frac{${N}}{${g(s * s)}} = ${g(I)}$$

I doppi prodotti con $k \neq j$ hanno media nulla: i campioni sono indipendenti e centrati sulla media vera.

**4. Bound e deviazione standard minima.** $\operatorname{var}\{\varepsilon\} \geq I^{-1}(m) = \frac{\sigma^2}{N} = ${g(bound)}$, quindi nessuno stimatore non polarizzato scende sotto una deviazione standard di $\sqrt{${g(bound)}} = ${g(dev)}$.

**5. Campioni necessari.** $\frac{\sigma}{\sqrt{N}} \le ${g(soglia)} \iff N \geq \frac{\sigma^2}{${g(soglia)}^2} = \frac{${g(s * s)}}{${g(soglia * soglia)}} = ${g(rapporto)}$, quindi $N_{\min} = ${Nmin}$. Il bound scende come $1/N$: per dimezzare la deviazione standard servono quattro volte i salmoni.

**6. Efficienza.** La media campionaria è non polarizzata e ha varianza $\sigma^2/N$, uguale al bound: è efficiente. È anche la stima ML della media, come prevede il teorema su ML ed efficienza. I passaggi completi sono nella dimostrazione [«bound di Cramér-Rao per la media di una gaussiana»](#derivation:der05).`,
      }
    },
  },
  {
    id: 'es03',
    title: 'Bias della stima ML della varianza e correzione',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c15', 'c16', 'c34', 'c48'],
    generate: (rng) => {
      const N = rng.pick([3, 5, 10, 20])
      const s2 = rng.float(1, 9, 1)
      const v = Number((s2 * rng.float(0.6, 1.3, 2)).toFixed(2))
      const media = ((N - 1) / N) * s2
      const bias = -s2 / N
      const fattore = N / (N - 1)
      const corretta = v * fattore
      return {
        prompt: md`Un sensore IoT di temperatura ha rumore gaussiano con varianza vera $\sigma^2 = ${g(s2)}$. Con $N = ${N}$ letture stimi media e varianza con la massima verosimiglianza (*maximum likelihood*, ML):

$$\hat{m} = \frac{1}{N}\sum_{k=1}^{N} x_k, \qquad \hat{\sigma}^2 = \frac{1}{N}\sum_{k=1}^{N}(x_k - \hat{m})^2$$

(a) Quanto vale $E\{\hat{\sigma}^2\}$? (b) Quanto vale il bias $E\{\varepsilon\} = E\{\hat{\sigma}^2\} - \sigma^2$? (c) Per quale fattore moltiplichi $\hat{\sigma}^2$ per renderla non polarizzata? (d) Su un lotto di letture ottieni $\hat{\sigma}^2 = ${g(v)}$: quanto vale la stima corretta? (e) La stima ML è asintoticamente non polarizzata (*asymptotically unbiased*)?`,
        answers: [
          ans('(a) $E\\{\\hat{\\sigma}^2\\}$', media),
          ans('(b) bias', bias),
          ans('(c) fattore di correzione', fattore),
          ans('(d) stima corretta', corretta),
          intero('(e) asintoticamente unbiased (1 = sì, 0 = no)', 1),
        ],
        solution: md`**1. Scomposizione degli scarti.** Aggiungo e tolgo la media vera: $x_k - \hat{m} = (x_k - m) - (\hat{m} - m)$. Poiché $\sum_{k}(x_k - m) = N(\hat{m} - m)$, sviluppando il quadrato il doppio prodotto vale $-2N(\hat{m} - m)^2$ e resta

$$\sum_{k=1}^{N}(x_k - \hat{m})^2 = \sum_{k=1}^{N}(x_k - m)^2 - N(\hat{m} - m)^2$$

**2. Valore atteso.** $E\{(x_k - m)^2\} = \sigma^2$ ed $E\{(\hat{m} - m)^2\} = \operatorname{var}\{\hat{m}\} = \sigma^2/N$:

$$E\{\hat{\sigma}^2\} = \frac{1}{N}\left(N\sigma^2 - N\,\frac{\sigma^2}{N}\right) = \frac{N-1}{N}\,\sigma^2 = \frac{${N - 1}}{${N}}\cdot ${g(s2)} = ${g(media)}$$

Il grado di libertà perso serve a stimare $m$: gli scarti da $\hat{m}$ sono in media più piccoli degli scarti da $m$.

**3. Bias.** $E\{\varepsilon\} = -\frac{\sigma^2}{N} = ${g(bias)}$: la stima ML sottostima la varianza.

**4. Correzione.** Moltiplico per $\frac{N}{N-1} = ${g(fattore)}$ e ottengo $\frac{1}{N-1}\sum_{k}(x_k - \hat{m})^2$, lo stimatore non polarizzato elementare delle slide (lo stesso fattore corregge la matrice di covarianza, $E\{\hat{\Sigma}\} = \frac{N-1}{N}\Sigma$).

**5. Sul lotto.** $${g(v)} \cdot ${g(fattore)} = ${g(corretta)}$.

**6. Comportamento asintotico.** $\lim_{N\to+\infty} E\{\varepsilon\} = \lim_{N\to+\infty}\left(-\frac{\sigma^2}{N}\right) = 0$: la stima ML è polarizzata a $N$ finito ma asintoticamente non polarizzata, come dicono le note per ogni stima ML. Con $N = ${N}$ il bias vale il ${g(100 / N, 3)}% di $\sigma^2$. Passaggi completi: [«la stima ML della varianza è biased ma asintoticamente buona»](#derivation:der11).`,
      }
    },
  },
  {
    id: 'es04',
    title: 'Efficienza asintotica: il rapporto varianza/bound',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c23', 'c35', 'c49'],
    generate: (rng) => {
      const N = rng.pick([5, 10, 50, 100])
      const p = rng.pick([95, 99])
      const s2 = rng.float(1, 9, 1)
      const s4 = s2 * s2
      const varML = (2 * (N - 1) * s4) / (N * N)
      const bound = (2 * s4) / N
      const rapporto = (N - 1) / N
      const Nmin = ceilSafe(100 / (100 - p))
      const rapportoC = N / (N - 1)
      return {
        prompt: md`Stimi la varianza del rumore di un sensore, $\sigma^2 = ${g(s2)}$, con la massima verosimiglianza su $N = ${N}$ letture gaussiane con media ignota. Sai che

$$\operatorname{var}\{\hat{\sigma}^2_{ML}\} = \frac{2(N-1)}{N^2}\,\sigma^4, \qquad [\mathbf{I}^{-1}(\boldsymbol{\theta})]_{\sigma^2\sigma^2} = \frac{2\sigma^4}{N}$$

(a) Calcola la varianza. (b) Calcola il bound. (c) Calcola il rapporto varianza/bound. (d) Qual è il minimo $N$ per cui il rapporto è almeno $${p / 100}$? (e) Calcola il rapporto per lo stimatore corretto $\tilde{\sigma}^2 = \frac{1}{N-1}\sum_{k}(x_k - \hat{m})^2$, che ha varianza $\frac{2\sigma^4}{N-1}$. (f) Il rapporto minore di 1 dello stimatore ML viola la disuguaglianza di Cramér-Rao?`,
        answers: [
          ans('(a) varianza ML', varML),
          ans('(b) bound', bound),
          ans('(c) rapporto ML', rapporto),
          intero('(d) $N$ minimo', Nmin),
          ans('(e) rapporto dello stimatore corretto', rapportoC),
          intero('(f) viola il bound (1 = sì, 0 = no)', 0),
        ],
        solution: md`**1. Numeri.** Con $\sigma^4 = ${g(s4)}$:

$$\operatorname{var}\{\hat{\sigma}^2_{ML}\} = \frac{2\cdot ${N - 1}}{${N * N}}\cdot ${g(s4)} = ${g(varML)}, \qquad \frac{2\sigma^4}{N} = ${g(bound)}$$

**2. Rapporto.** $\frac{2(N-1)\sigma^4/N^2}{2\sigma^4/N} = \frac{N-1}{N} = ${g(rapporto)}$, e tende a 1 per $N \to +\infty$: la stima ML è asintoticamente efficiente (*asymptotically efficient*), come dice la definizione $\lim_{N\to+\infty}\frac{\operatorname{var}\{\varepsilon_i\}}{[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}} = 1$.

**3. $N$ minimo.** $\frac{N-1}{N} = 1 - \frac{1}{N} \geq ${p / 100} \iff N \geq \frac{1}{1 - ${p / 100}} = ${g(100 / (100 - p))}$, quindi $N_{\min} = ${Nmin}$.

**4. Stimatore corretto.** $\frac{2\sigma^4/(N-1)}{2\sigma^4/N} = \frac{N}{N-1} = ${g(rapportoC)}$: sopra 1 per ogni $N$ finito, quindi non è efficiente, ma tende a 1: è asintoticamente efficiente.

**5. Nessuna violazione.** Il bound $2\sigma^4/N$ vale per gli stimatori non polarizzati; la stima ML della varianza è polarizzata, con $E\{\hat{\sigma}^2\} = \psi(\sigma^2) = \frac{N-1}{N}\sigma^2$. Per uno stimatore così il limite corretto si moltiplica per $\left(\frac{\partial\psi}{\partial\sigma^2}\right)^2 = \frac{(N-1)^2}{N^2}$, e rispetto a quel limite il rapporto diventa $\frac{N}{N-1} \geq 1$. Un rapporto sotto 1 dice soltanto che si confronta uno stimatore polarizzato con il bound degli stimatori non polarizzati. Passaggi in [«la stima ML della varianza è biased ma asintoticamente buona»](#derivation:der11).`,
      }
    },
  },
  {
    id: 'es05',
    title: 'Consistenza in numeri: probabilità di stare entro δ',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c36', 'c37'],
    generate: (rng) => {
      const s = rng.float(1, 3, 1)
      const d = rng.pick([0.1, 0.25, 0.5])
      const N = rng.pick([10, 25, 100])
      const [p0, z] = rng.pick([
        [0.9, 1.645],
        [0.95, 1.96],
        [0.99, 2.576],
      ] as const)
      const u = (d * Math.sqrt(N)) / s
      const P = 2 * Phi(u) - 1
      const Nstar = ((z * s) / d) ** 2
      const Nmin = ceilSafe(Nstar)
      return {
        prompt: md`Stimi la luminosità media dei salmoni con la media campionaria di $N = ${N}$ misure gaussiane iid con deviazione standard $\sigma = ${g(s)}$. Fissa $\delta = ${g(d)}$.

(a) Quanto vale $u = \delta\sqrt{N}/\sigma$? (b) Quanto vale $P\{\vert\varepsilon\vert < \delta\}$? (c) Quante misure servono, al minimo, perché questa probabilità sia almeno $${p0}$? Usa il quantile gaussiano $z = ${z}$. Infine commenta che cosa succede per $N \to +\infty$.`,
        answers: [
          ans('(a) $u$', u),
          ans('(b) $P\\{\\vert\\varepsilon\\vert < \\delta\\}$', P, 0.005),
          intero('(c) $N$ minimo', Nmin),
        ],
        solution: md`**1. Distribuzione dell'errore.** $\varepsilon = \hat{m} - m$ è una combinazione lineare di gaussiane indipendenti, quindi è gaussiana con media $0$ e varianza $\sigma^2/N$: $\frac{\varepsilon}{\sigma/\sqrt{N}}$ è una normale standard $Z$.

**2. Probabilità.**

$$P\{\vert\varepsilon\vert < \delta\} = P\left\{\vert Z\vert < \frac{\delta\sqrt{N}}{\sigma}\right\} = 2\Phi(u) - 1, \qquad u = \frac{${g(d)}\sqrt{${N}}}{${g(s)}} = ${g(u)}$$

Con $\Phi(${g(u)}) = ${g(Phi(u))}$ ottengo $P = ${g(P)}$.

**3. $N$ minimo.** $2\Phi(u) - 1 \geq ${p0} \iff \Phi(u) \geq \frac{1 + ${p0}}{2} \iff u \geq z = ${z}$, cioè

$$N \geq \left(\frac{z\,\sigma}{\delta}\right)^2 = \left(\frac{${z}\cdot ${g(s)}}{${g(d)}}\right)^2 = ${g(Nstar)} \quad\Rightarrow\quad N_{\min} = ${Nmin}$$

**4. Consistenza.** Per ogni $\delta > 0$ fissato, $u = \delta\sqrt{N}/\sigma \to +\infty$ e quindi $P\{\vert\varepsilon\vert < \delta\} \to 1$: è la definizione di stima consistente $\lim_{N\to+\infty} P\{\Vert\boldsymbol{\varepsilon}\Vert < \delta\} = 1$ per ogni $\delta > 0$ (qui $r = 1$, la norma è il valore assoluto). Un $\delta$ più piccolo richiede più campioni, ma il limite resta 1: il $\delta$ si fissa prima di far crescere $N$.`,
      }
    },
  },
  {
    id: 'es06',
    title: 'Compila la pagella di quattro stimatori',
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c13', 'c16', 'c28', 'c34', 'c35', 'c36', 'c40'],
    generate: (rng) => {
      // la media vera sta lontana da 5, così lo stimatore costante non indovina per caso
      const m = rng.next() < 0.5 ? rng.float(2, 4.5, 1) : rng.float(5.5, 8, 1)
      const s = rng.float(0.5, 3, 1)
      const N = rng.pick([10, 20, 50])
      const v = (s * s) / N
      const mseCost = (5 - m) ** 2
      return {
        prompt: md`La luminosità dei salmoni è gaussiana con media vera $m = ${g(m)}$ (che tu non conosci) e deviazione standard nota $\sigma = ${g(s)}$; hai $N = ${N}$ misure. Quattro colleghi propongono uno stimatore di $m$ ciascuno:

- (a) la media campionaria $\bar{x} = \frac{1}{N}\sum_{k=1}^{N} x_k$;
- (b) il primo campione $x_1$;
- (c) $\bar{x} + \frac{1}{N}$;
- (d) la costante $5$.

Per ciascuno decidi se è non polarizzato, efficiente, asintoticamente non polarizzato, asintoticamente efficiente, consistente, e conta quante delle cinque proprietà possiede. Poi calcola (e) il rapporto tra la varianza di (b) e il bound di Cramér-Rao e (f) l'errore quadratico medio di (d).`,
        answers: [
          intero('(a) proprietà della media campionaria', 5),
          intero('(b) proprietà di $x_1$', 2),
          intero('(c) proprietà di $\\bar{x} + 1/N$', 3),
          intero('(d) proprietà della costante', 0),
          ans('(e) varianza di $x_1$ / bound', N),
          ans('(f) errore quadratico medio della costante', mseCost),
        ],
        solution: md`Il bound di Cramér-Rao per la media è $\sigma^2/N = ${g(v)}$.

| stimatore | bias | varianza | unbiased | efficiente | asint. unbiased | asint. efficiente | consistente | totale |
|---|---|---|---|---|---|---|---|---|
| $\bar{x}$ | $0$ | $\sigma^2/N = ${g(v)}$ | sì | sì | sì | sì | sì | 5 |
| $x_1$ | $0$ | $\sigma^2 = ${g(s * s)}$ | sì | no | sì | no | no | 2 |
| $\bar{x} + 1/N$ | $1/N = ${g(1 / N)}$ | $\sigma^2/N = ${g(v)}$ | no | no | sì | sì | sì | 3 |
| $5$ | $5 - m = ${g(5 - m)}$ | $0$ | no | no | no | no | no | 0 |

**(a) Media campionaria.** Non polarizzata, varianza uguale al bound per ogni $N$: efficiente, quindi anche asintoticamente efficiente; bias nullo e varianza che tende a zero la rendono consistente. La sua varianza non è nulla, come chiederebbe la stima ideale, ma con $N$ finito nessuno stimatore non polarizzato fa meglio.

**(b) Primo campione.** $E\{x_1\} = m$: non polarizzato per ogni $N$, quindi anche asintoticamente. Ignora gli altri $N - 1$ dati: la varianza resta $\sigma^2$ e il rapporto con il bound vale $\frac{\sigma^2}{\sigma^2/N} = N = ${N}$, che diverge. Non è efficiente (per $N > 1$) né asintoticamente efficiente. Non è consistente: $P\{\vert x_1 - m\vert < \delta\} = 2\Phi(\delta/\sigma) - 1$ resta sotto 1 qualunque sia $N$.

**(c) Media più $1/N$.** Bias $1/N \neq 0$: polarizzato, quindi non efficiente, perché il bound e l'efficienza riguardano gli stimatori non polarizzati, anche se la sua varianza coincide in numero con $\sigma^2/N$. Il bias tende a zero (asintoticamente non polarizzato), il rapporto varianza/bound vale 1 (asintoticamente efficiente), bias e varianza tendono a zero (consistente).

**(d) Costante.** Varianza nulla, sotto il bound: nessuna contraddizione, perché il bias $5 - m$ è diverso da zero e non cala con $N$. L'errore quadratico medio è tutto bias: $(5 - ${g(m)})^2 = ${g(mseCost)}$. Il rapporto varianza/bound vale 0, non 1; $P\{\vert 5 - m\vert < \delta\} = 0$ per ogni $\delta < ${g(Math.abs(5 - m))}$. Nessuna proprietà, salvo il caso fortuito $m = 5$. Mostra perché la stima ideale chiede due condizioni insieme: varianza nulla da sola non basta.`,
      }
    },
  },
  {
    id: 'es07',
    title: "Uno stimatore con varianza sotto il bound: contraddizione?",
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c21', 'c23', 'c30'],
    generate: (rng) => {
      const S = rng.pick([12, 24, 48])
      const lam = rng.pick([4, 8, 16])
      const s = rng.int(20, 60)
      const bound = (s * s) / S
      const varR = (s * s * S) / (S + lam) ** 2
      const rapporto = (S * S) / (S + lam) ** 2
      return {
        prompt: md`Un collega stima il sovrapprezzo per stanza $\theta$ (in migliaia di euro) delle case di un quartiere con il modello $y_k = \theta x_k + n_k$: $x_k$ è il numero di stanze oltre la prima e $n_k$ è rumore gaussiano con $\sigma = ${s}$. Per le case del campione $S = \sum_{k} x_k^2 = ${S}$. Usa la ridge $\hat{\theta}_\lambda = \frac{\sum_k x_k y_k}{S + \lambda}$ con $\lambda = ${lam}$ e ti mostra che la sua varianza sta sotto il bound di Cramér-Rao.

(a) Calcola il bound $\sigma^2/S$. (b) Calcola la varianza della ridge, $\frac{\sigma^2 S}{(S + \lambda)^2}$. (c) Calcola il rapporto varianza/bound. (d) Quale ipotesi del bound non rispetta la ridge? Spiega perché non c'è contraddizione, discuti il caso limite dello stimatore costante e perché nei problemi reali si usano spesso stimatori polarizzati.`,
        answers: [
          ans('(a) bound', bound),
          ans('(b) varianza della ridge', varR),
          ans('(c) rapporto', rapporto),
          intero('(d) ipotesi violata (1 = assenza di bias, 2 = regolarità, 3 = campioni iid)', 1),
        ],
        solution: md`**1. Numeri.** $\frac{\sigma^2}{S} = \frac{${s * s}}{${S}} = ${g(bound)}$ e $\frac{\sigma^2 S}{(S + \lambda)^2} = \frac{${s * s}\cdot ${S}}{${(S + lam) ** 2}} = ${g(varR)}$. Il rapporto è $\left(\frac{S}{S + \lambda}\right)^2 = ${g(rapporto)} < 1$.

**2. Perché non c'è contraddizione.** La slide dice che il bound è un limite inferiore alla varianza di uno stimatore **non polarizzato** (*unbiased*). La ridge è la stima ai minimi quadrati moltiplicata per $\frac{S}{S + \lambda} < 1$: $E\{\hat{\theta}_\lambda\} = \frac{S}{S + \lambda}\,\theta$, con bias $-\frac{\lambda\theta}{S + \lambda} \neq 0$. Il bound non le si applica, e l'ipotesi violata è l'assenza di bias. Per uno stimatore con bias $b(\theta)$ il limite diventa $\frac{(1 + \partial b/\partial\theta)^2}{I(\theta)} = \frac{\sigma^2 S}{(S + \lambda)^2}$, che la ridge raggiunge esattamente.

**3. Caso limite.** Lo stimatore costante $\hat{\theta} = c$ ha varianza zero, sotto qualunque bound, ma il suo errore quadratico medio è $(c - \theta)^2$: sbaglia sempre dello stesso bias. Scendere sotto il bound è facile se si accetta un bias: il bound vincola solo gli stimatori che non ne hanno.

**4. Perché si usano stimatori polarizzati.** Conta l'errore quadratico medio, varianza più bias al quadrato: con pochi dati e molto rumore un piccolo bias può ridurre molto la varianza e far sbagliare meno. Le slide lo ammettono: nei problemi reali le stime vengono spesso da stimatori polarizzati e inefficienti, e per giudicarli si guarda il comportamento per $N \to +\infty$. Qui $S$ cresce con $N$, il fattore $\frac{S}{S + \lambda} \to 1$ e la ridge diventa asintoticamente non polarizzata. I conti completi sono in [«uno stimatore biased sotto il bound: ridge a un parametro»](#derivation:der18).`,
      }
    },
  },
  {
    id: 'es08',
    title: 'Dimostra le due identità della slide 13',
    difficulty: 2,
    kind: 'dimostrazione',
    concepts: ['c12', 'c16', 'c17', 'c18'],
    generate: (rng) => {
      const theta = rng.float(3, 6, 1)
      const stime = Array.from({ length: 4 }, () => rng.float(theta - 0.5, theta + 0.7, 2))
      const media = stime.reduce((a, b) => a + b, 0) / 4
      const bias = media - theta
      const errori = stime.map((t) => t - theta)
      const varianza = stime.reduce((a, t) => a + (t - media) ** 2, 0) / 4
      const mse = errori.reduce((a, e) => a + e * e, 0) / 4
      const elenco = stime.map((t) => g(t)).join(',\\ ')
      return {
        prompt: md`Dimostra che, per l'errore di stima $\varepsilon = \hat{\theta} - \theta$ di un parametro scalare,

1. $E\{\varepsilon\} = 0$ se e solo se $E\{\hat{\theta}\} = \theta$;
2. $\operatorname{var}\{\varepsilon\} = E\{(\hat{\theta} - \bar{\hat{\theta}})^2\}$, cioè la varianza dell'errore coincide con la varianza della stima.

Indica dove usi il fatto che $\theta$ è una costante e rispetto a quale variabile aleatoria calcoli i valori attesi.

Poi verifica sui numeri. Il parametro vero è $\theta = ${g(theta)}$ e immagini di poter ripetere l'acquisizione: quattro training set equiprobabili danno le stime $\hat{\theta} \in \{${elenco}\}$. Calcola $E\{\hat{\theta}\}$, $E\{\varepsilon\}$, $\operatorname{var}\{\varepsilon\}$ ed $E\{\varepsilon^2\}$.`,
        answers: [
          ans('$E\\{\\hat{\\theta}\\}$', media),
          ans('$E\\{\\varepsilon\\}$', bias, tol(bias, 0.01, 0.0005)),
          ans('$\\operatorname{var}\\{\\varepsilon\\}$', varianza, tol(varianza, 0.01, 0.0005)),
          ans('$E\\{\\varepsilon^2\\}$', mse, tol(mse, 0.01, 0.0005)),
        ],
        solution: md`**Rispetto a che cosa.** La stima è una funzione del training set, $\hat{\theta} = \hat{\theta}(\mathbf{X})$. I valori attesi sono medie su tutti i training set possibili, distribuiti come $p(\mathbf{X}|\theta)$, con $\theta$ e $N$ fissati: $E\{\hat{\theta}\} = \int \hat{\theta}(\mathbf{X})\,p(\mathbf{X}|\theta)\,d\mathbf{X}$. $\theta$ è fisso ma ignoto: non è una variabile aleatoria.

**Identità 1.** Per la linearità del valore atteso e perché $\theta$ è una costante ($E\{\theta\} = \theta$):

$$E\{\varepsilon\} = E\{\hat{\theta} - \theta\} = E\{\hat{\theta}\} - \theta$$

Quindi $E\{\varepsilon\} = 0 \iff E\{\hat{\theta}\} = \theta$. La freccia della slide vale in entrambi i versi.

**Identità 2.** Per definizione $\operatorname{var}\{\varepsilon\} = E\{(\varepsilon - E\{\varepsilon\})^2\}$. Sostituisco $\varepsilon = \hat{\theta} - \theta$ ed $E\{\varepsilon\} = \bar{\hat{\theta}} - \theta$:

$$\varepsilon - E\{\varepsilon\} = (\hat{\theta} - \theta) - (\bar{\hat{\theta}} - \theta) = \hat{\theta} - \bar{\hat{\theta}} \quad\Rightarrow\quad \operatorname{var}\{\varepsilon\} = E\{(\hat{\theta} - \bar{\hat{\theta}})^2\} = \operatorname{var}\{\hat{\theta}\}$$

$\theta$ si cancella perché è una costante: sottrarre una costante non cambia la dispersione. Nella formula compare la media della stima, non il valore vero; solo se la stima è non polarizzata vale anche $\operatorname{var}\{\varepsilon\} = E\{(\hat{\theta} - \theta)^2\}$. Passaggi in [«da E{ε} = 0 a E{θ̂} = θ»](#derivation:der01) e [«la varianza dell'errore è la varianza della stima»](#derivation:der02).

**Verifica numerica.** Gli errori sono $\varepsilon \in \{${errori.map((e) => g(e)).join(',\\ ')}\}$.

- $E\{\hat{\theta}\} = \frac{1}{4}(${stime.map((t) => g(t)).join(' + ')}) = ${g(media)}$ ed $E\{\varepsilon\} = ${g(media)} - ${g(theta)} = ${g(bias)}$, uguale alla media degli errori.
- Varianza della stima e varianza dell'errore coincidono: $\frac{1}{4}\sum_j(\hat{\theta}_j - ${g(media)})^2 = ${g(varianza)}$.
- $E\{\varepsilon^2\} = \frac{1}{4}\sum_j \varepsilon_j^2 = ${g(mse)}$, pari a $\operatorname{var}\{\varepsilon\} + (E\{\varepsilon\})^2 = ${g(varianza)} + ${g(bias * bias)}$.`,
      }
    },
  },
  {
    id: 'es09',
    title: 'Matrice di Fisher per una gaussiana con media e varianza incognite',
    difficulty: 3,
    kind: 'dimostrazione',
    concepts: ['c25', 'c26', 'c27'],
    generate: (rng) => {
      const N = rng.pick([10, 20, 50, 100])
      const s2 = rng.float(0.5, 4, 1)
      const I11 = N / s2
      const I22 = N / (2 * s2 * s2)
      const bm = s2 / N
      const bs = (2 * s2 * s2) / N
      return {
        prompt: md`Stimi insieme media e varianza della luminosità dei salmoni: $\boldsymbol{\theta} = (m, \sigma^2)$, con $N = ${N}$ campioni iid gaussiani; nel punto vero $\sigma^2 = ${g(s2)}$.

Calcola con la definizione elemento per elemento

$$[\mathbf{I}(\boldsymbol{\theta})]_{ij} = E\left\{\frac{\partial \ln[p(\mathbf{X}|\boldsymbol{\theta})]}{\partial\theta_i}\cdot\frac{\partial \ln[p(\mathbf{X}|\boldsymbol{\theta})]}{\partial\theta_j}\right\}$$

i quattro elementi della matrice di Fisher, invertila e scrivi i due bound. Perché i termini fuori diagonale sono nulli?`,
        answers: [
          ans('$[\\mathbf{I}]_{11}$', I11),
          zero('$[\\mathbf{I}]_{12} = [\\mathbf{I}]_{21}$'),
          ans('$[\\mathbf{I}]_{22}$', I22),
          ans('bound per $m$', bm),
          ans('bound per $\\sigma^2$', bs),
        ],
        solution: md`**1. Log-likelihood e score.** $\ln p(\mathbf{X}|\boldsymbol{\theta}) = -\frac{N}{2}\ln(2\pi\sigma^2) - \frac{1}{2\sigma^2}\sum_{k=1}^{N}(x_k - m)^2$, quindi

$$\frac{\partial \ln p}{\partial m} = \frac{1}{\sigma^2}\sum_{k=1}^{N}(x_k - m), \qquad \frac{\partial \ln p}{\partial \sigma^2} = -\frac{N}{2\sigma^2} + \frac{1}{2\sigma^4}\sum_{k=1}^{N}(x_k - m)^2 = \frac{1}{2\sigma^4}\sum_{k=1}^{N}\left[(x_k - m)^2 - \sigma^2\right]$$

Servono i momenti centrali della gaussiana: $E\{(x - m)^2\} = \sigma^2$, $E\{(x - m)^3\} = 0$, $E\{(x - m)^4\} = 3\sigma^4$. Con campioni indipendenti e centrati i termini con $k \neq j$ hanno media nulla.

**2. Elemento (1,1).** $[\mathbf{I}]_{11} = \frac{1}{\sigma^4}\sum_{k} E\{(x_k - m)^2\} = \frac{N}{\sigma^2} = \frac{${N}}{${g(s2)}} = ${g(I11)}$.

**3. Elemento (2,2).** $E\{[(x - m)^2 - \sigma^2]^2\} = 3\sigma^4 - 2\sigma^4 + \sigma^4 = 2\sigma^4$, quindi

$$[\mathbf{I}]_{22} = \frac{1}{4\sigma^8}\cdot N \cdot 2\sigma^4 = \frac{N}{2\sigma^4} = \frac{${N}}{2\cdot ${g(s2 * s2)}} = ${g(I22)}$$

**4. Elementi fuori diagonale.**

$$[\mathbf{I}]_{12} = \frac{1}{2\sigma^6}\sum_{k=1}^{N}E\left\{(x_k - m)^3 - \sigma^2(x_k - m)\right\} = 0$$

Sopravvivono solo i termini con lo stesso campione, che contengono momenti centrali dispari: nulli per la simmetria della gaussiana. La matrice è simmetrica, quindi $[\mathbf{I}]_{21} = 0$.

**5. Inversa e bound.** La matrice è diagonale e si inverte elemento per elemento:

$$\mathbf{I}(\boldsymbol{\theta}) = \begin{bmatrix} \frac{N}{\sigma^2} & 0 \\ 0 & \frac{N}{2\sigma^4} \end{bmatrix}, \qquad \operatorname{var}\{\varepsilon_m\} \geq \frac{\sigma^2}{N} = ${g(bm)}, \qquad \operatorname{var}\{\varepsilon_{\sigma^2}\} \geq \frac{2\sigma^4}{N} = ${g(bs)}$$

Con termini fuori diagonale nulli $[\mathbf{I}^{-1}]_{ii} = 1/[\mathbf{I}]_{ii}$: non stimare $\sigma^2$ non peggiora il bound su $m$. La media campionaria raggiunge $\sigma^2/N$ ed è efficiente; la stima ML della varianza ha varianza $\frac{2(N-1)}{N^2}\sigma^4$ ed è solo asintoticamente efficiente. Passaggi: [«matrice di Fisher 2×2 per una gaussiana»](#derivation:der12).`,
      }
    },
  },
  {
    id: 'es10',
    title: 'Filtro antispam: bound per una probabilità di Bernoulli',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c02', 'c22', 'c28', 'c41', 'c46'],
    generate: (rng) => {
      const theta = rng.float(0.1, 0.9, 2)
      const N = rng.pick([20, 50, 200])
      let k = 0
      for (let i = 0; i < N; i++) if (rng.next() < theta) k++
      const ml = k / N
      const q = theta * (1 - theta)
      const I = N / q
      const bound = q / N
      const laplace = (k + 1) / (N + 2)
      const biasL = (1 - 2 * theta) / (N + 2)
      return {
        prompt: md`Il filtro antispam osserva una parola sospetta: ogni email che la contiene è spam con probabilità $\theta$, indipendentemente dalle altre. Su $N = ${N}$ email con la parola ne trovi $k = ${k}$ di spam.

(a) Scrivi la likelihood e ricava la stima ML di $\theta$: quanto vale? Supponi ora che il valore vero sia $\theta = ${g(theta)}$. (b) Quanto vale l'informazione di Fisher $I(\theta)$? (c) Quanto vale il bound di Cramér-Rao? (d) Quanto vale $\operatorname{var}\{k/N\}$? La stima ML è efficiente? (e) Uno stimatore alternativo è $(k + 1)/(N + 2)$: quanto vale sui tuoi dati? (f) Qual è il suo bias?`,
        answers: [
          ans('(a) $\\hat{\\theta}_{ML}$', ml, tol(ml, 0.01, 0.0005)),
          ans('(b) $I(\\theta)$', I),
          ans('(c) bound', bound),
          ans('(d) $\\operatorname{var}\\{k/N\\}$', bound),
          ans('(e) $(k+1)/(N+2)$', laplace),
          ans('(f) bias di $(k+1)/(N+2)$', biasL, tol(biasL, 0.01, 0.00005)),
        ],
        solution: md`**(a) Likelihood.** Ogni email è una Bernoulli, $p(x|\theta) = \theta^{x}(1 - \theta)^{1 - x}$; con email indipendenti la likelihood è il prodotto:

$$p(\mathbf{X}|\theta) = \prod_{k'=1}^{N}\theta^{x_{k'}}(1 - \theta)^{1 - x_{k'}} = \theta^{k}(1 - \theta)^{N - k}$$

$\ln p = k\ln\theta + (N - k)\ln(1 - \theta)$; la derivata $\frac{k}{\theta} - \frac{N - k}{1 - \theta}$ si annulla in $\hat{\theta}_{ML} = \frac{k}{N} = \frac{${k}}{${N}} = ${g(ml)}$.

**(b) Fisher.** Lo score di una email è $\frac{x - \theta}{\theta(1 - \theta)}$, con media nulla e varianza $\frac{\theta(1 - \theta)}{\theta^2(1 - \theta)^2} = \frac{1}{\theta(1 - \theta)}$. Con $N$ email indipendenti l'informazione si somma:

$$I(\theta) = \frac{N}{\theta(1 - \theta)} = \frac{${N}}{${g(theta)}\cdot ${g(1 - theta)}} = ${g(I)}$$

**(c) Bound.** $\operatorname{var}\{\varepsilon\} \geq \frac{\theta(1 - \theta)}{N} = ${g(bound)}$.

**(d) Efficienza.** $k$ è una binomiale: $E\{k\} = N\theta$, $\operatorname{var}\{k\} = N\theta(1 - \theta)$. Quindi $E\{k/N\} = \theta$ (non polarizzata) e $\operatorname{var}\{k/N\} = \frac{\theta(1 - \theta)}{N} = ${g(bound)}$, uguale al bound: la stima ML è efficiente. È il caso previsto dal teorema: lo stimatore efficiente esiste, la ML è non polarizzata, ed è proprio la ML.

**(e)-(f) Stimatore alternativo.** $\frac{k + 1}{N + 2} = \frac{${k + 1}}{${N + 2}} = ${g(laplace)}$: è la media a posteriori con prior uniforme (la regola di Laplace). $E\left\{\frac{k + 1}{N + 2}\right\} = \frac{N\theta + 1}{N + 2}$, quindi il bias è $\frac{1 - 2\theta}{N + 2} = ${g(biasL)}$: nullo solo per $\theta = 1/2$, tende a zero per $N \to +\infty$ (asintoticamente non polarizzato). Evita le stime $0$ e $1$ quando $k = 0$ o $k = N$, utili in un filtro che moltiplica tante probabilità.`,
      }
    },
  },
  {
    id: 'es11',
    title: 'Risposta orale: come si descrive la bontà di una stima? La ML è un buon stimatore?',
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c10', 'c11', 'c12', 'c13', 'c22', 'c28', 'c34', 'c35', 'c36', 'c46', 'c47'],
    generate: (rng) => {
      const s = rng.float(1, 4, 1)
      const N = rng.pick([16, 25, 64, 100])
      const v = (s * s) / N
      return {
        prompt: md`Prepara la risposta orale, 3-4 minuti, alla domanda «How can we describe the goodness of an estimation? Is Maximum Likelihood a good estimator?» in sei punti:

1. la stima dipende da $\mathbf{X}$ ed è aleatoria;
2. l'errore di stima;
3. bias, varianza e stima ideale;
4. bound di Cramér-Rao, matrice di Fisher, efficienza;
5. proprietà asintotiche con le tre formule;
6. proprietà della stima ML.

Scrivi per ogni punto la formula esatta della slide, poi confrontala con la soluzione. Controlla i conti sull'esempio che porterai all'orale: luminosità media dei salmoni, gaussiana con $\sigma = ${g(s)}$ nota, $N = ${N}$ salmoni, stima ML $\hat{m} = \bar{x}$. Calcola (a) $\operatorname{var}\{\varepsilon\}$, (b) il bound $I^{-1}(m)$, (c) il loro rapporto, (d) quante delle cinque proprietà (unbiased, efficiente, asintoticamente unbiased, asintoticamente efficiente, consistente) possiede $\hat{m}$.`,
        answers: [
          ans('(a) $\\operatorname{var}\\{\\varepsilon\\}$', v),
          ans('(b) $I^{-1}(m)$', v),
          ans('(c) rapporto', 1),
          intero('(d) proprietà possedute', 5),
        ],
        solution: md`**1. La stima è aleatoria.** «La stima dipende dal vettore delle osservazioni, $\hat{\boldsymbol{\theta}} = \hat{\boldsymbol{\theta}}(\mathbf{X})$: se cambio il training set cambia la stima, quindi $\hat{\boldsymbol{\theta}}$ è un vettore aleatorio.»

**2. Errore di stima.** «Definisco $\boldsymbol{\varepsilon} = \hat{\boldsymbol{\theta}} - \boldsymbol{\theta} = \boldsymbol{\varepsilon}(\mathbf{X}, \boldsymbol{\theta}) = [\hat{\theta}_i - \theta_i : i = 1, 2, \ldots, r]$.»

**3. Bias, varianza, stima ideale.** «La stima ideale ha ogni $\varepsilon_i$ non polarizzato e senza varianza. Il bias è la media dell'errore; la stima è non polarizzata se $E\{\boldsymbol{\varepsilon}\} = 0$, cioè $E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}$. La varianza è $\operatorname{var}\{\varepsilon_i\} = E\{(\hat{\theta}_i - \bar{\hat{\theta}}_i)^2\}$. Le due condizioni insieme sono un riferimento, difficile da raggiungere.»

**4. Cramér-Rao.** «Per giudicare la varianza la confronto con il bound di Cramér-Rao, limite inferiore per gli stimatori non polarizzati:

$$\operatorname{var}\{\varepsilon_i\} \geq [\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}, \qquad \mathbf{I}(\boldsymbol{\theta}) = E\{\nabla_{\boldsymbol{\theta}}\ln[p(\mathbf{X}|\boldsymbol{\theta})]\,\nabla_{\boldsymbol{\theta}}\ln[p(\mathbf{X}|\boldsymbol{\theta})]^t\}$$

Chi raggiunge il bound è efficiente.»

**5. Proprietà asintotiche.** «Spesso gli stimatori reali sono polarizzati e inefficienti, quindi li giudico per $N \to +\infty$:

$$\lim_{N\to+\infty}E\{\hat{\boldsymbol{\theta}}\} = \boldsymbol{\theta}, \qquad \lim_{N\to+\infty}\frac{\operatorname{var}\{\varepsilon_i\}}{[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}} = 1, \qquad \lim_{N\to+\infty}P\{\Vert\boldsymbol{\varepsilon}\Vert < \delta\} = 1 \;\;\forall\delta > 0$$

Condizione per la consistenza: stima asintoticamente non polarizzata con varianza che tende a zero.»

**6. La ML.** «Sì, è un buon stimatore: se esiste uno stimatore efficiente e la stima ML è non polarizzata, lo stimatore efficiente è la ML; se non esiste, la ML è comunque asintoticamente non polarizzata, asintoticamente efficiente e consistente. Per questo si usa in tanti problemi reali.»

**Controllo dei conti.** (a) $\operatorname{var}\{\varepsilon\} = \frac{\sigma^2}{N} = \frac{${g(s * s)}}{${N}} = ${g(v)}$. (b) $I(m) = N/\sigma^2$, quindi $I^{-1}(m) = ${g(v)}$. (c) Rapporto $1$: la media campionaria è efficiente. (d) Tutte e cinque: non polarizzata ed efficiente per ogni $N$, quindi anche asintoticamente; varianza che tende a zero, quindi consistente.

Autovalutazione: se nella tua risposta manca il limite su $\delta$ «per ogni $\delta > 0$», la parola «unbiased» nell'enunciato del bound o una delle due ipotesi del teorema sulla ML, rileggi la teoria.`,
      }
    },
  },
  {
    id: 'es12',
    title: 'Abbina il fenomeno al modello statistico',
    difficulty: 1,
    kind: 'concettuale',
    concepts: ['c52', 'c53', 'c54', 'c55', 'c56', 'c59', 'c60', 'c61', 'c62'],
    generate: (rng) => {
      type Chiave = 'gauss' | 'ggauss' | 'gamma' | 'rayleigh' | 'chi2' | 'lognormal'
      const nomi: Record<Chiave, string> = {
        gauss: 'gaussiano (*Gaussian*)',
        ggauss: 'gaussiano generalizzato (*Generalized Gaussian*)',
        gamma: 'Gamma',
        rayleigh: 'Rayleigh',
        chi2: 'Chi-quadrato (*Chi-square*)',
        lognormal: 'Log-Normale (*Log-Normal*)',
      }
      const modelli = rng.shuffle(Object.keys(nomi) as Chiave[])
      const codice = (c: Chiave) => modelli.indexOf(c) + 1
      const situazioni = rng.shuffle([
        {
          testo: 'i tempi di attesa dei clienti in una coda',
          modello: 'gamma' as Chiave,
          perche: 'dati continui non negativi, il caso tipico della teoria delle code (*queuing theory*). Aspetto in gioco: la natura statistica intrinseca del fenomeno',
        },
        {
          testo: "l'ampiezza dell'eco di un radar diffusa dal terreno",
          modello: 'rayleigh' as Chiave,
          perche: 'le note lo indicano per radar e comunicazioni, per i segnali diffusi (*scattered signals*). Aspetti in gioco: la natura del fenomeno (la diffusione) e il rumore introdotto dal sensore attivo',
        },
        {
          testo: 'gli importi delle transazioni con carta, con una lunga coda verso i valori alti',
          modello: 'lognormal' as Chiave,
          perche: 'variabili con asimmetria positiva (*positively skewed*), come i dati finanziari. Aspetto in gioco: la natura del fenomeno',
        },
        {
          testo: 'la statistica di un test di bontà di adattamento (*goodness-of-fit*)',
          modello: 'chi2' as Chiave,
          perche: "le note lo citano per i test di ipotesi e la bontà di adattamento. Aspetto in gioco: l'elaborazione dei dati, perché la statistica nasce da una somma di scarti quadratici normalizzati",
        },
        {
          testo: 'il dato radar dopo una trasformazione logaritmica e una media su molti pixel',
          modello: 'gauss' as Chiave,
          perche: 'la media di molti valori indipendenti tende a una gaussiana. Aspetto in gioco: il pre-processing e l\'estrazione delle feature, che cambiano la statistica del dato grezzo',
        },
      ])
      const lettere = ['a', 'b', 'c', 'd', 'e']
      return {
        prompt: md`Nella scelta del modello statistico per $p(\mathbf{x})$ le slide chiedono di considerare tre aspetti: la natura statistica intrinseca del fenomeno, il rumore introdotto nella trasmissione e nell'acquisizione (dal mezzo di propagazione, passivo, e dal sensore, attivo), il pre-processing e l'estrazione delle feature. I modelli dell'elenco, con un codice:

${modelli.map((c, i) => `${i + 1}. ${nomi[c]}`).join('\n')}

Per ciascuna situazione scrivi il codice del modello più adatto secondo le note e indica quale aspetto è in gioco:

${situazioni.map((s, i) => `- (${lettere[i]}) ${s.testo};`).join('\n')}`,
        answers: situazioni.map((s, i) => intero(`(${lettere[i]}) codice del modello`, codice(s.modello))),
        solution: md`${situazioni.map((s, i) => `**(${lettere[i]})** ${nomi[s.modello]}, codice ${codice(s.modello)}: ${s.perche}.`).join('\n\n')}

Il modello ${nomi.ggauss} (codice ${codice('ggauss')}) resta fuori: le note lo descrivono come un'alternativa flessibile, con un parametro di forma che va da distribuzioni appuntite a code pesanti fino a distribuzioni quasi piatte, e contiene la gaussiana come caso particolare. La scelta del modello viene prima della stima: se il modello è sbagliato, le buone proprietà asintotiche della ML non portano al valore vero, perché nessun valore dei parametri descrive i dati.`,
      }
    },
  },
  {
    id: 'es13',
    title: 'Dalla disuguaglianza di Chebyshev alla consistenza',
    difficulty: 3,
    kind: 'dimostrazione',
    concepts: ['c19', 'c36', 'c38'],
    generate: (rng) => {
      const c = rng.pick([0.5, 1, 2])
      const s = rng.float(0.5, 2, 1)
      const d = rng.pick([0.1, 0.2, 0.5])
      const N = rng.pick([50, 100, 500])
      const alpha = rng.pick([0.05, 0.1])
      const mse = (s * s) / N + (c * c) / (N * N)
      const cheb = mse / (d * d)
      const a = alpha * d * d
      const Nstar = (s * s + Math.sqrt(s ** 4 + 4 * a * c * c)) / (2 * a)
      const Nmin = ceilSafe(Nstar)
      return {
        prompt: md`Dimostra che, se uno stimatore è asintoticamente non polarizzato e la sua varianza tende a zero per $N \to +\infty$, allora è consistente secondo la definizione $\lim_{N\to+\infty}P\{\Vert\boldsymbol{\varepsilon}\Vert < \delta\} = 1$ per ogni $\delta > 0$. Suggerimento: limita $P\{\vert\varepsilon_i\vert \geq \delta\}$ con $E\{\varepsilon_i^2\}/\delta^2$ e scomponi $E\{\varepsilon_i^2\}$ in varianza più bias al quadrato.

Poi applica il ragionamento a uno stimatore della media con bias $c/N$ e varianza $\sigma^2/N$ (per esempio $\hat{\theta} = \bar{x} + c/N$), con $c = ${c}$, $\sigma = ${g(s)}$ e $\delta = ${g(d)}$. (a) Calcola $E\{\varepsilon^2\}$ per $N = ${N}$. (b) Calcola il limite di Chebyshev per $P\{\vert\varepsilon\vert \geq \delta\}$. (c) Trova il minimo $N$ per cui questo limite non supera $${alpha}$. (d) Bias che tende a zero e varianza che tende a zero sono sufficienti per la consistenza? Commenta la parola «necessary» della slide.`,
        answers: [
          ans('(a) $E\\{\\varepsilon^2\\}$', mse),
          ans('(b) limite di Chebyshev', cheb),
          intero('(c) $N$ minimo', Nmin),
          intero('(d) sufficienti (1 = sì, 0 = no)', 1),
        ],
        solution: md`**1. Markov su $\varepsilon_i^2$.** $\varepsilon_i^2$ è non negativa, quindi (disuguaglianza di Markov, cioè Chebyshev):

$$P\{\vert\varepsilon_i\vert \geq \delta\} = P\{\varepsilon_i^2 \geq \delta^2\} \leq \frac{E\{\varepsilon_i^2\}}{\delta^2}$$

**2. Scomposizione.** $E\{\varepsilon_i^2\} = \operatorname{var}\{\varepsilon_i\} + (E\{\varepsilon_i\})^2$.

**3. Limite.** Se $\lim_{N\to+\infty}E\{\varepsilon_i\} = 0$ e $\lim_{N\to+\infty}\operatorname{var}\{\varepsilon_i\} = 0$, allora $E\{\varepsilon_i^2\} \to 0$ e $P\{\vert\varepsilon_i\vert \geq \delta\} \to 0$ per ogni $\delta > 0$ fissato: $P\{\vert\varepsilon_i\vert < \delta\} \to 1$.

**4. Caso vettoriale.** $P\{\Vert\boldsymbol{\varepsilon}\Vert \geq \delta\} \leq \frac{1}{\delta^2}\sum_{i=1}^{r}E\{\varepsilon_i^2\} \to 0$: basta che la proprietà valga per ogni componente. Passaggi in [«bias → 0 e varianza → 0 portano alla consistenza»](#derivation:der07).

**(a)** $E\{\varepsilon^2\} = \frac{\sigma^2}{N} + \frac{c^2}{N^2} = \frac{${g(s * s)}}{${N}} + \frac{${g(c * c)}}{${N * N}} = ${g(mse)}$.

**(b)** $\frac{E\{\varepsilon^2\}}{\delta^2} = \frac{${g(mse)}}{${g(d * d)}} = ${g(cheb)}$.${cheb >= 1 ? ' Il limite supera 1: con questo $N$ Chebyshev non garantisce nulla.' : ''}

**(c)** Chiedo $\frac{\sigma^2}{N} + \frac{c^2}{N^2} \leq \alpha\delta^2 = ${g(a)}$, cioè $\alpha\delta^2 N^2 - \sigma^2 N - c^2 \geq 0$. La radice positiva è

$$N^* = \frac{\sigma^2 + \sqrt{\sigma^4 + 4\alpha\delta^2 c^2}}{2\alpha\delta^2} = ${g(Nstar)} \quad\Rightarrow\quad N_{\min} = ${Nmin}$$

Chebyshev è prudente: la probabilità vera di un errore grande è molto più piccola del limite.

**(d)** Sì, sono sufficienti: è ciò che hai appena dimostrato. La slide le chiama «necessary condition». In senso stretto non sono necessarie: lo stimatore che vale $\bar{x}$ con probabilità $1 - 1/N$ e $N^2$ con probabilità $1/N$ è consistente (l'evento anomalo diventa raro) ma il suo valore atteso diverge. All'orale riporto la formulazione del docente e, se serve, aggiungo che la dimostrazione con Chebyshev le usa come condizioni sufficienti.`,
      }
    },
  },
  {
    id: 'es14',
    title: 'Tasso di anomalie di un sensore: ML biased ma asintoticamente buona',
    difficulty: 3,
    kind: 'numerico',
    concepts: ['c46', 'c47', 'c48', 'c49', 'c50'],
    generate: (rng) => {
      const lam = rng.float(0.5, 5, 1)
      const N = rng.pick([5, 10, 50, 200])
      const media = (N * lam) / (N - 1)
      const biasRel = 1 / (N - 1)
      const varianza = (N * N * lam * lam) / ((N - 1) ** 2 * (N - 2))
      const bound = (lam * lam) / N
      const rapporto = N ** 3 / ((N - 1) ** 2 * (N - 2))
      const tau = 1 / lam
      return {
        prompt: md`Una rete di sensori registra i tempi tra due anomalie consecutive; li modelli come esponenziali iid di tasso $\lambda$ (anomalie all'ora), $p(x|\lambda) = \lambda e^{-\lambda x}$. La stima ML del tasso è il reciproco della media dei tempi, $\hat{\lambda}_{ML} = N / \sum_{k} x_k$.

Con tasso vero $\lambda = ${g(lam)}$ e $N = ${N}$ tempi calcola: (a) $E\{\hat{\lambda}_{ML}\} = \frac{N}{N-1}\lambda$; (b) il bias relativo $E\{\varepsilon\}/\lambda$; (c) la varianza $\frac{N^2\lambda^2}{(N-1)^2(N-2)}$; (d) il bound di Cramér-Rao $\lambda^2/N$; (e) il rapporto varianza/bound. Poi commenta le tre proprietà asintotiche e confronta con la stima ML del tempo medio $\tau = 1/\lambda$.`,
        answers: [
          ans('(a) $E\\{\\hat{\\lambda}_{ML}\\}$', media),
          ans('(b) bias relativo', biasRel),
          ans('(c) varianza', varianza),
          ans('(d) bound', bound),
          ans('(e) rapporto', rapporto),
        ],
        solution: md`**Da dove vengono le formule.** $\ln p(\mathbf{X}|\lambda) = N\ln\lambda - \lambda\sum_{k}x_k$; la derivata $\frac{N}{\lambda} - \sum_{k}x_k$ si annulla in $\hat{\lambda}_{ML} = N/T$ con $T = \sum_k x_k$. La somma di $N$ esponenziali iid è una Gamma, per cui $E\{T^{-1}\} = \frac{\lambda}{N-1}$ ed $E\{T^{-2}\} = \frac{\lambda^2}{(N-1)(N-2)}$. Lo score di un tempo, $\frac{1}{\lambda} - x$, ha varianza $\frac{1}{\lambda^2}$, quindi $I(\lambda) = \frac{N}{\lambda^2}$.

**Numeri.**

- (a) $E\{\hat{\lambda}_{ML}\} = \frac{${N}}{${N - 1}}\cdot ${g(lam)} = ${g(media)}$: la stima sovrastima il tasso.
- (b) bias relativo $\frac{1}{N-1} = ${g(biasRel)}$.
- (c) $\operatorname{var}\{\hat{\lambda}_{ML}\} = ${g(varianza)}$.
- (d) bound $\frac{\lambda^2}{N} = ${g(bound)}$.
- (e) rapporto $\frac{N^3}{(N-1)^2(N-2)} = ${g(rapporto)}$.

**Proprietà asintotiche.** Il bias $\frac{\lambda}{N-1} \to 0$: asintoticamente non polarizzata. Il rapporto tende a 1: asintoticamente efficiente. Bias e varianza tendono a zero: consistente. A $N$ finito la stima è polarizzata e la sua varianza sta sopra il bound: è il caso delle note, «anche se uno stimatore efficiente non esiste, la ML ha buone proprietà asintotiche». Anche correggendo il bias con $\frac{N-1}{\sum_k x_k}$ la varianza $\frac{\lambda^2}{N-2}$ resta sopra $\frac{\lambda^2}{N}$: per $\lambda$ uno stimatore efficiente non esiste.

**Il tempo medio.** Con la parametrizzazione $\tau = 1/\lambda = ${g(tau)}$ ore la stima ML è la media dei tempi, $\hat{\tau}_{ML} = \bar{x}$: non polarizzata, con varianza $\frac{\tau^2}{N} = ${g((tau * tau) / N)}$ uguale al bound $I^{-1}(\tau) = \tau^2/N$. Per $\tau$ lo stimatore efficiente esiste ed è la ML, come dice il teorema. Lo stesso modello dà una stima efficiente o no a seconda del parametro scelto. Passaggi in [«tempi esponenziali: tempo medio e tasso»](#derivation:der15).`,
      }
    },
  },
  {
    id: 'es15',
    title: 'Bias che svanisce e bias che resta',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c15', 'c19', 'c34', 'c36', 'c38', 'c67'],
    generate: (rng) => {
      const c = rng.pick([-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2])
      const s = rng.float(0.5, 3, 1)
      const N = rng.pick([10, 100, 1000])
      const v = (s * s) / N
      const b1 = c / N
      const mse1 = v + b1 * b1
      const mse2 = v + c * c
      return {
        prompt: md`Un termometro digitale misura la temperatura di una stanza con campioni iid di media vera $m$ e deviazione standard $\sigma = ${g(s)}$. Due firmware stimano $m$ con $N = ${N}$ letture:

$$\hat{\theta}_1 = \bar{x} + \frac{c}{N}, \qquad \hat{\theta}_2 = \bar{x} + c, \qquad c = ${g(c)}$$

Per ciascuno calcola bias ed errore quadratico medio, e di' se è asintoticamente non polarizzato e consistente.`,
        answers: [
          ans('bias di $\\hat{\\theta}_1$', b1, tol(b1, 0.01, 1e-7)),
          ans('$E\\{\\varepsilon_1^2\\}$', mse1),
          ans('bias di $\\hat{\\theta}_2$', c),
          ans('$E\\{\\varepsilon_2^2\\}$', mse2),
          intero('$\\hat{\\theta}_1$ consistente (1 = sì, 0 = no)', 1),
          intero('$\\hat{\\theta}_2$ consistente (1 = sì, 0 = no)', 0),
        ],
        solution: md`**Varianza.** Aggiungere una costante non cambia la dispersione: entrambi hanno varianza $\frac{\sigma^2}{N} = \frac{${g(s * s)}}{${N}} = ${g(v)}$, che tende a zero.

**Primo firmware.** $E\{\hat{\theta}_1\} = m + \frac{c}{N}$, bias $\frac{c}{N} = ${g(b1)}$. Errore quadratico medio:

$$E\{\varepsilon_1^2\} = \frac{\sigma^2}{N} + \frac{c^2}{N^2} = ${g(v)} + ${g(b1 * b1)} = ${g(mse1)}$$

Il bias tende a zero: asintoticamente non polarizzato. Bias e varianza vanno a zero, quindi per la disuguaglianza di Chebyshev è consistente ([«bias → 0 e varianza → 0 portano alla consistenza»](#derivation:der07)).

**Secondo firmware.** $E\{\hat{\theta}_2\} = m + c$, bias $c = ${g(c)}$ per ogni $N$. Errore quadratico medio:

$$E\{\varepsilon_2^2\} = \frac{\sigma^2}{N} + c^2 = ${g(v)} + ${g(c * c)} = ${g(mse2)}$$

La varianza va a zero, il bias no: $\hat{\theta}_2$ si concentra attorno a $m + c$, non a $m$. Per ogni $\delta < ${g(Math.abs(c))}$ si ha $P\{\vert\hat{\theta}_2 - m\vert < \delta\} \to 0$: non è né asintoticamente non polarizzato né consistente. L'errore quadratico medio non scende sotto $c^2 = ${g(c * c)}$.

**Morale.** La slide chiede entrambe le condizioni: varianza che tende a zero da sola non basta, serve anche il bias che si spegne. È il terzo controesempio di [«legami tra le proprietà»](#derivation:der16): uno strumento con offset costante è preciso ma non accurato.`,
      }
    },
  },
  {
    id: 'es16',
    title: "Bound sull'intercetta di una regressione dei prezzi delle case",
    difficulty: 3,
    kind: 'numerico',
    concepts: ['c22', 'c26', 'c27'],
    generate: (rng) => {
      const N = rng.int(20, 500)
      // case vere: superficie media 60-150 m², dispersione al più metà della media (x̄ ≥ 2 s_x, fattore ≥ 5)
      const xbar = rng.int(60, 150)
      const sx = rng.int(15, Math.min(40, Math.floor(xbar / 2)))
      const s = rng.int(5, 40)
      const s2 = s * s
      const I11 = N / s2
      const fattore = 1 + (xbar * xbar) / (sx * sx)
      const inv11 = (s2 / N) * fattore
      const inv22 = s2 / (N * sx * sx)
      return {
        prompt: md`Un'agenzia stima i prezzi delle case con $y_k = a_0 + b_0 x_k + n_k$: $y_k$ è il prezzo in migliaia di euro, $x_k$ la superficie in m², $n_k$ rumore gaussiano con $\sigma = ${s}$ nota. Ha $N = ${N}$ case con superficie media $\bar{x} = ${xbar}$ m² e deviazione standard $s_x = ${sx}$ m² (cioè $\sum_k x_k = N\bar{x}$ e $\sum_k x_k^2 = N(s_x^2 + \bar{x}^2)$).

(a) Quanto vale $[\mathbf{I}]_{11}$, l'informazione sull'intercetta $a_0$? (b) Quanto vale il bound sull'intercetta $[\mathbf{I}^{-1}]_{11}$? (c) Di che fattore $[\mathbf{I}^{-1}]_{11}$ supera $1/[\mathbf{I}]_{11}$? (d) Quanto vale il bound sulla pendenza $[\mathbf{I}^{-1}]_{22}$? Perché non cambia se centri la superficie?`,
        answers: [
          ans('(a) $[\\mathbf{I}]_{11}$', I11),
          ans('(b) $[\\mathbf{I}^{-1}]_{11}$', inv11),
          ans('(c) fattore', fattore),
          ans('(d) $[\\mathbf{I}^{-1}]_{22}$', inv22),
        ],
        solution: md`**1. Matrice di Fisher.** Le derivate della log-likelihood sono $\frac{1}{\sigma^2}\sum_k n_k$ rispetto ad $a_0$ e $\frac{1}{\sigma^2}\sum_k x_k n_k$ rispetto a $b_0$; i valori attesi dei loro prodotti danno

$$\mathbf{I}(a_0, b_0) = \frac{1}{\sigma^2}\begin{bmatrix} N & \sum_k x_k \\ \sum_k x_k & \sum_k x_k^2 \end{bmatrix} = \frac{1}{\sigma^2}\begin{bmatrix} N & N\bar{x} \\ N\bar{x} & N(s_x^2 + \bar{x}^2) \end{bmatrix}$$

**(a)** $[\mathbf{I}]_{11} = \frac{N}{\sigma^2} = \frac{${N}}{${s2}} = ${g(I11)}$. Se ignorassi la pendenza, il bound sarebbe $\frac{\sigma^2}{N} = ${g(s2 / N)}$.

**2. Inversa.** $\det\mathbf{I} = \frac{1}{\sigma^4}\left[N\sum_k x_k^2 - (\sum_k x_k)^2\right] = \frac{N^2 s_x^2}{\sigma^4}$, e $[\mathbf{I}^{-1}]_{11} = \frac{[\mathbf{I}]_{22}}{\det\mathbf{I}}$:

$$[\mathbf{I}^{-1}]_{11} = \frac{\sigma^2}{N}\left(1 + \frac{\bar{x}^2}{s_x^2}\right) = ${g(s2 / N)}\cdot\left(1 + \frac{${xbar * xbar}}{${sx * sx}}\right) = ${g(inv11)}$$

**(c)** Il fattore è $1 + \frac{\bar{x}^2}{s_x^2} = ${g(fattore)}$. Il bound usa l'elemento diagonale dell'**inversa**, non l'inverso dell'elemento diagonale: $[\mathbf{I}^{-1}]_{11} \geq 1/[\mathbf{I}]_{11}$, con l'uguaglianza solo se il termine fuori diagonale è nullo. Intercetta e pendenza sono accoppiate: con case lontane dall'origine ($\bar{x} \gg s_x$) un errore sulla pendenza sposta l'intercetta, che è un'estrapolazione a superficie zero.

**(d)** $[\mathbf{I}^{-1}]_{22} = \frac{[\mathbf{I}]_{11}}{\det\mathbf{I}} = \frac{\sigma^2}{N s_x^2} = \frac{${s2}}{${N}\cdot ${sx * sx}} = ${g(inv22)}$. Dipende solo dalla dispersione delle superfici: centrare ($\bar{x} = 0$) sposta i dati senza cambiarne la dispersione. Centrando, la matrice diventa diagonale e il bound sull'intercetta torna $\sigma^2/N$. Passaggi in [«diagonale dell'inversa con parametri accoppiati»](#derivation:der14).`,
      }
    },
  },
  {
    id: 'es17',
    title: 'Una sola osservazione: la stima ML è anche efficiente?',
    difficulty: 1,
    kind: 'numerico',
    concepts: ['c28', 'c41', 'c45', 'c46'],
    generate: (rng) => {
      const x0 = rng.float(-5, 5, 1)
      const s = rng.float(0.5, 3, 1)
      const N = rng.pick([4, 9, 16, 25])
      const s2 = s * s
      return {
        prompt: md`La luminosità dei salmoni è gaussiana con deviazione standard nota $\sigma = ${g(s)}$ e media $m$ ignota. Hai misurato un solo salmone: $x_0 = ${g(x0)}$ (è l'esempio della figura «ML search»).

(a) Ricava la stima ML di $m$: quanto vale? (b) Quanto vale $\operatorname{var}\{\hat{m}\}$? (c) Quanto vale l'informazione di Fisher $I(m)$ per $N = 1$? (d) La stima è efficiente? (e) Con $N = ${N}$ salmoni la stima ML diventa la media campionaria: quanto vale la sua varianza?`,
        answers: [
          ans('(a) $\\hat{m}$', x0, tol(x0, 0.01, 0.01)),
          ans('(b) $\\operatorname{var}\\{\\hat{m}\\}$', s2),
          ans('(c) $I(m)$', 1 / s2),
          intero('(d) efficiente (1 = sì, 0 = no)', 1),
          ans('(e) varianza con $N$ campioni', s2 / N),
        ],
        solution: md`**(a) Stima ML.** La likelihood è una sola gaussiana vista come funzione di $m$:

$$p(x_0|m) = \frac{1}{\sqrt{2\pi}\,\sigma}\exp\left(-\frac{(x_0 - m)^2}{2\sigma^2}\right), \qquad \frac{\partial \ln p(x_0|m)}{\partial m} = \frac{x_0 - m}{\sigma^2} = 0 \;\Rightarrow\; \hat{m} = x_0 = ${g(x0)}$$

La derivata seconda $-1/\sigma^2$ è negativa: è un massimo. Nella figura, tra le gaussiane che scorrono lungo l'asse vince quella centrata sull'osservazione.

**(b) Bias e varianza.** $E\{\hat{m}\} = E\{x_0\} = m$: non polarizzata. $\operatorname{var}\{\hat{m}\} = \sigma^2 = ${g(s2)}$.

**(c) Fisher.** $I(m) = E\left\{\frac{(x_0 - m)^2}{\sigma^4}\right\} = \frac{1}{\sigma^2} = ${g(1 / s2)}$, bound $\frac{1}{I(m)} = \sigma^2$.

**(d) Efficienza.** Varianza uguale al bound: la stima è efficiente. Torna con il teorema delle note: esiste uno stimatore efficiente, la stima ML è non polarizzata, quindi lo stimatore efficiente è la ML.

**(e) Più salmoni.** Con $N$ campioni $\hat{m} = \bar{x}$ ha varianza $\frac{\sigma^2}{N} = \frac{${g(s2)}}{${N}} = ${g(s2 / N)}$, di nuovo uguale al bound $\sigma^2/N$. Con $N = 1$ chiedersi se la stima è consistente non ha senso, perché la consistenza riguarda $N \to +\infty$; con $N$ campioni la varianza va a zero e la stima è consistente. Passaggi in [«stima ML della media da una sola osservazione»](#derivation:der08).`,
      }
    },
  },
  {
    id: 'es18',
    title: 'Informazione di Fisher con la derivata seconda',
    difficulty: 3,
    kind: 'dimostrazione',
    concepts: ['c24', 'c26', 'c63'],
    generate: (rng) => {
      const s = rng.float(0.5, 3, 1)
      const theta = rng.float(0.1, 0.9, 2)
      const lam = rng.float(0.5, 5, 1)
      const N = rng.pick([10, 20, 50])
      const Ia = N / (s * s)
      const Ib = N / (theta * (1 - theta))
      const Ic = N / (lam * lam)
      return {
        prompt: md`Sotto le condizioni di regolarità l'informazione di Fisher ha anche la forma con la curvatura

$$I(\theta) = -E\left\{\frac{\partial^2 \ln p(\mathbf{X}|\theta)}{\partial\theta^2}\right\}$$

Usala per calcolare l'informazione di $N = ${N}$ campioni iid nei tre casi: (a) media di una gaussiana con $\sigma = ${g(s)}$ nota; (b) probabilità di una Bernoulli, nel punto $\theta = ${g(theta)}$ (email spam); (c) tasso di un'esponenziale, nel punto $\lambda = ${g(lam)}$ (tempi tra anomalie). Verifica che ogni risultato coincide con quello del quadrato dello score. (d) In quale dei tre casi la derivata seconda dipende dai dati?`,
        answers: [
          ans('(a) $I(m)$', Ia),
          ans('(b) $I(\\theta)$', Ib),
          ans('(c) $I(\\lambda)$', Ic),
          intero('(d) caso con derivata seconda aleatoria (1 = a, 2 = b, 3 = c)', 2),
        ],
        solution: md`**(a) Gaussiana.** $\frac{\partial \ln p}{\partial m} = \frac{1}{\sigma^2}\sum_k(x_k - m)$, $\frac{\partial^2 \ln p}{\partial m^2} = -\frac{N}{\sigma^2}$. Quindi $I(m) = \frac{N}{\sigma^2} = ${g(Ia)}$. Con lo score: $E\left\{\left(\frac{1}{\sigma^2}\sum_k(x_k - m)\right)^2\right\} = \frac{N\sigma^2}{\sigma^4}$, lo stesso valore.

**(b) Bernoulli.** Con $k$ successi $\ln p = k\ln\theta + (N - k)\ln(1 - \theta)$ e

$$\frac{\partial^2 \ln p}{\partial\theta^2} = -\frac{k}{\theta^2} - \frac{N - k}{(1 - \theta)^2}$$

Uso $E\{k\} = N\theta$: $I(\theta) = \frac{N}{\theta} + \frac{N}{1 - \theta} = \frac{N}{\theta(1 - \theta)} = ${g(Ib)}$. Con lo score: $\frac{k - N\theta}{\theta(1 - \theta)}$ ha varianza $\frac{N\theta(1 - \theta)}{\theta^2(1 - \theta)^2}$, lo stesso valore.

**(c) Esponenziale.** $\ln p = N\ln\lambda - \lambda\sum_k x_k$, $\frac{\partial^2 \ln p}{\partial\lambda^2} = -\frac{N}{\lambda^2}$, quindi $I(\lambda) = \frac{N}{\lambda^2} = ${g(Ic)}$. Con lo score: $\sum_k\left(\frac{1}{\lambda} - x_k\right)$ ha varianza $N\cdot\frac{1}{\lambda^2}$, lo stesso valore.

**(d)** Solo nel caso (b) la derivata seconda contiene i dati ($k$): va presa in media. Nei casi (a) e (c) la curvatura è la stessa per ogni training set. Nel widget della curvatura, per la Bernoulli la log-likelihood cambia apertura da un campione all'altro; per la gaussiana è sempre la stessa parabola, larga quanto $\sigma/\sqrt{N}$.

**Perché le due forme coincidono.** Derivando $\int p(\mathbf{X}|\theta)\,d\mathbf{X} = 1$ due volte sotto il segno di integrale si ottiene $E\{\partial^2\ln p/\partial\theta^2\} + E\{(\partial\ln p/\partial\theta)^2\} = 0$. Lo scambio tra derivata e integrale è la condizione di regolarità: con supporto dipendente dal parametro, come nell'uniforme su $[0, \theta]$, cade. Passaggi in [«le due forme dell'informazione di Fisher»](#derivation:der13).`,
      }
    },
  },
  {
    id: 'es19',
    title: 'Ridge a un parametro: bias, varianza e confronto con il bound',
    difficulty: 3,
    kind: 'numerico',
    concepts: ['c19', 'c23', 'c30'],
    generate: (rng) => {
      const theta = rng.int(5, 20)
      const s = rng.int(20, 60)
      const S = rng.pick([12, 24, 48])
      const lam = rng.pick([4, 8, 16, 32])
      const s2 = s * s
      const bias = (-lam * theta) / (S + lam)
      const varR = (s2 * S) / (S + lam) ** 2
      const mse = (lam * lam * theta * theta + s2 * S) / (S + lam) ** 2
      const bound = s2 / S
      const lamStar = s2 / (theta * theta)
      const mseStar = s2 / (S + lamStar)
      return {
        prompt: md`Stimi il sovrapprezzo per stanza delle case di un quartiere con $y_k = \theta x_k + n_k$: $y_k$ in migliaia di euro, $x_k$ numero di stanze oltre la prima (fissato), $n_k$ rumore gaussiano iid con $\sigma = ${s}$. Il valore vero è $\theta = ${theta}$ e le case del campione danno $S = \sum_k x_k^2 = ${S}$. Usi la ridge $\hat{\theta}_\lambda = \frac{\sum_k x_k y_k}{S + \lambda}$ con $\lambda = ${lam}$.

Calcola (a) il bias, (b) la varianza, (c) l'errore quadratico medio, (d) il bound di Cramér-Rao $\sigma^2/S$, (e) il $\lambda^*$ che minimizza l'errore quadratico medio e (f) l'errore quadratico medio in $\lambda^*$. Perché la varianza sotto il bound non contraddice la disuguaglianza di Cramér-Rao?`,
        answers: [
          ans('(a) bias', bias),
          ans('(b) varianza', varR),
          ans('(c) errore quadratico medio', mse),
          ans('(d) bound', bound),
          ans('(e) $\\lambda^*$', lamStar),
          ans('(f) errore quadratico medio in $\\lambda^*$', mseStar),
        ],
        solution: md`**1. Stimatore di riferimento.** I minimi quadrati $\hat{\theta}_0 = \frac{\sum_k x_k y_k}{S}$ coincidono con la ML: non polarizzati, con varianza $\frac{\sigma^2}{S}$. Lo score $\frac{1}{\sigma^2}\sum_k x_k(y_k - \theta x_k)$ dà $I(\theta) = \frac{S}{\sigma^2}$, quindi il bound è $\frac{\sigma^2}{S} = \frac{${s2}}{${S}} = ${g(bound)}$ e $\hat{\theta}_0$ è efficiente.

**2. Bias.** $\hat{\theta}_\lambda = \frac{S}{S + \lambda}\hat{\theta}_0$, quindi $E\{\varepsilon\} = -\frac{\lambda\theta}{S + \lambda} = -\frac{${lam}\cdot ${theta}}{${S + lam}} = ${g(bias)}$.

**3. Varianza.** $\operatorname{var}\{\varepsilon\} = \left(\frac{S}{S + \lambda}\right)^2\frac{\sigma^2}{S} = \frac{\sigma^2 S}{(S + \lambda)^2} = \frac{${s2}\cdot ${S}}{${(S + lam) ** 2}} = ${g(varR)}$, sotto il bound.

**4. Errore quadratico medio.** Varianza più bias al quadrato:

$$E\{\varepsilon^2\} = \frac{\lambda^2\theta^2 + \sigma^2 S}{(S + \lambda)^2} = ${g(mse)}$$

${mse < bound ? md`Minore del bound: con questi numeri la ridge sbaglia meno dello stimatore efficiente.` : md`Maggiore del bound: con questo $\lambda$ il bias costa più di quanto la ridge risparmia in varianza.`}

**5. $\lambda$ ottimo.** $\frac{d}{d\lambda}E\{\varepsilon^2\} = \frac{2S(\lambda\theta^2 - \sigma^2)}{(S + \lambda)^3} = 0$ in $\lambda^* = \frac{\sigma^2}{\theta^2} = \frac{${s2}}{${theta * theta}} = ${g(lamStar)}$ (derivata negativa prima, positiva dopo). Sostituendo $\lambda^*\theta^2 = \sigma^2$:

$$E\{\varepsilon^2\}\big\vert_{\lambda^*} = \frac{\sigma^2}{S + \lambda^*} = ${g(mseStar)} < \frac{\sigma^2}{S}$$

**6. Nessuna contraddizione.** Il bound della slide vale per gli stimatori non polarizzati. Per uno stimatore con bias $b(\theta)$ il limite è $\frac{(1 + \partial b/\partial\theta)^2}{I(\theta)}$; qui $1 + \partial b/\partial\theta = \frac{S}{S + \lambda}$ e il limite è $\frac{\sigma^2 S}{(S + \lambda)^2}$, proprio la varianza della ridge. $\lambda^*$ non dipende da $N$, mentre $S$ cresce con $N$: il guadagno $\frac{S}{S + \lambda^*} \to 1$ e con tanti dati il vantaggio del bias svanisce. Passaggi in [«uno stimatore biased sotto il bound: ridge a un parametro»](#derivation:der18).`,
      }
    },
  },
  {
    id: 'es20',
    title: 'Uniforme su [0, θ]: bias della ML, correzione e confronto con il bound formale',
    difficulty: 3,
    kind: 'numerico',
    concepts: ['c15', 'c22', 'c36', 'c70'],
    generate: (rng) => {
      const theta = rng.float(2, 20, 1)
      const N = rng.pick([5, 10, 20, 50])
      const d = rng.pick([0.1, 0.2, 0.5])
      const EM = (N * theta) / (N + 1)
      const bias = -theta / (N + 1)
      const fattore = (N + 1) / N
      const varC = (theta * theta) / (N * (N + 2))
      const formale = (theta * theta) / (N * N)
      const P = 1 - (1 - d / theta) ** N
      return {
        prompt: md`Un sensore di livello restituisce letture iid uniformi su $[0, \theta]$, dove $\theta$ è il fondo scala da stimare. La stima ML è il massimo $M = \max_k x_k$ delle $N$ letture. Con $\theta = ${g(theta)}$ e $N = ${N}$:

(a) calcola $E\{M\}$; (b) calcola il bias; (c) trova il fattore che rende lo stimatore non polarizzato; (d) calcola la varianza dello stimatore corretto $\tilde{\theta}$; (e) applica meccanicamente la formula della slide, $I(\theta) = E\{(\partial\ln p(\mathbf{X}|\theta)/\partial\theta)^2\}$, e calcola il bound formale $1/I(\theta)$; (f) calcola $P\{\vert M - \theta\vert < \delta\}$ con $\delta = ${d}$. Quale ipotesi del bound di Cramér-Rao è violata? La stima ML è consistente?`,
        answers: [
          ans('(a) $E\\{M\\}$', EM),
          ans('(b) bias', bias),
          ans('(c) fattore', fattore),
          ans('(d) $\\operatorname{var}\\{\\tilde{\\theta}\\}$', varC),
          ans('(e) bound formale', formale),
          ans('(f) $P\\{\\vert M - \\theta\\vert < \\delta\\}$', P, 0.002),
        ],
        solution: md`**1. Stima ML.** $p(\mathbf{X}|\theta) = \theta^{-N}$ se $\theta \geq M$ e $0$ altrimenti: la likelihood decresce con $\theta$, quindi il massimo è sul bordo, $\hat{\theta}_{ML} = M$. La derivata non si annulla mai: qui la stima ML non si trova ponendo il gradiente a zero.

**2. Distribuzione di $M$.** $P\{M \le t\} = (t/\theta)^N$, quindi $p_M(t) = \frac{N t^{N-1}}{\theta^N}$ su $[0, \theta]$.

**(a)-(b)** $E\{M\} = \frac{N}{N+1}\theta = ${g(EM)}$; bias $-\frac{\theta}{N+1} = ${g(bias)}$. Il massimo non può superare $\theta$: la stima sottostima sempre, ma il bias tende a zero (asintoticamente non polarizzata).

**(c)-(d)** $\tilde{\theta} = \frac{N+1}{N}M$ con fattore $${g(fattore)}$; è non polarizzato e, da $\operatorname{var}\{M\} = \frac{N\theta^2}{(N+1)^2(N+2)}$,

$$\operatorname{var}\{\tilde{\theta}\} = \frac{\theta^2}{N(N+2)} = ${g(varC)}$$

**(e) Bound formale.** Per $\theta \geq M$ lo score è $\frac{\partial}{\partial\theta}(-N\ln\theta) = -\frac{N}{\theta}$, sempre lo stesso: $I(\theta) = \frac{N^2}{\theta^2}$ e il bound formale vale $\frac{\theta^2}{N^2} = ${g(formale)}$. Lo stimatore corretto, non polarizzato, ha varianza **più piccola**: $${g(varC)} < ${g(formale)}$.

**Ipotesi violata.** Non l'assenza di bias, che $\tilde{\theta}$ rispetta, ma la regolarità che la slide sottintende: il supporto $[0, \theta]$ dipende dal parametro. Derivando $\int_0^\theta p(x|\theta)\,dx = 1$ compare un termine di bordo, lo score non ha media nulla (vale sempre $-N/\theta$) e la dimostrazione del bound cade. La varianza scende come $1/N^2$, più in fretta di qualunque bound regolare.

**(f) Consistenza.** $P\{\vert M - \theta\vert < \delta\} = P\{M > \theta - \delta\} = 1 - \left(1 - \frac{\delta}{\theta}\right)^N = ${g(P)}$, che tende a 1 per ogni $\delta > 0$: la stima ML è consistente. Passaggi in [«quando le ipotesi di regolarità cadono: l'uniforme»](#derivation:der20).`,
      }
    },
  },
  {
    id: 'es21',
    title: 'Dalla densità congiunta al prodotto: dove servono «independent» e «identically distributed»',
    difficulty: 2,
    kind: 'dimostrazione',
    concepts: ['c02', 'c03'],
    generate: (rng) => {
      const m0 = rng.float(3, 5, 1)
      const xs = [rng.float(m0 - 1.2, m0 + 1.2, 1), rng.float(m0 - 1.2, m0 + 1.2, 1), rng.float(m0 - 1.2, m0 + 1.2, 1)]
      const dens = xs.map((x) => gauss(x, m0, 1))
      const L = dens.reduce((a, b) => a * b, 1)
      const lnL = dens.reduce((a, b) => a + Math.log(b), 0)
      const mhat = (xs[0] + xs[1] + xs[2]) / 3
      const s = rng.float(0.5, 2, 1)
      const N = rng.pick([10, 20, 50])
      const varDich = (s * s) / (2 * N)
      const varVera = (s * s) / N
      return {
        prompt: md`Dimostra che $p(\mathbf{X}|\boldsymbol{\theta}) = \prod_{k=1}^{N} p(\mathbf{x}_k|\boldsymbol{\theta})$ partendo dalla densità congiunta $p(\mathbf{x}_1, \ldots, \mathbf{x}_N|\boldsymbol{\theta})$ e dalla regola del prodotto delle densità condizionate. Indica in quale passo usi l'indipendenza e in quale l'identica distribuzione, e che cosa otterresti con campioni indipendenti ma non identicamente distribuiti. Il testo d'esame chiede proprio questo: «why we can use the separate products of the probabilities».

Poi i numeri. Tre salmoni hanno luminosità $x_1 = ${g(xs[0])}$, $x_2 = ${g(xs[1])}$, $x_3 = ${g(xs[2])}$; il modello è gaussiano con $\sigma = 1$ nota. (a) Calcola $p(\mathbf{X}|m)$ in $m = ${g(m0)}$. (b) Calcola $\ln p(\mathbf{X}|m)$ nello stesso punto. (c) Quanto vale la stima ML di $m$?

Infine un errore di registrazione: $N = ${N}$ misure distinte con $\sigma = ${g(s)}$ vengono salvate due volte ciascuna, e chi analizza tratta le $2N$ righe come iid. (d) Quale varianza della media dichiara? (e) Qual è la varianza vera?`,
        answers: [
          ans('(a) $p(\\mathbf{X}|m)$', L),
          ans('(b) $\\ln p(\\mathbf{X}|m)$', lnL),
          ans('(c) $\\hat{m}$', mhat, tol(mhat, 0.01, 0.005)),
          ans('(d) varianza dichiarata', varDich),
          ans('(e) varianza vera', varVera),
        ],
        solution: md`**1. Definizione.** La likelihood è la densità congiunta del training set vista come funzione di $\boldsymbol{\theta}$: $p(\mathbf{X}|\boldsymbol{\theta}) = p(\mathbf{x}_1, \ldots, \mathbf{x}_N|\boldsymbol{\theta})$.

**2. Regola del prodotto** (vale sempre, senza ipotesi):

$$p(\mathbf{x}_1, \ldots, \mathbf{x}_N|\boldsymbol{\theta}) = p(\mathbf{x}_1|\boldsymbol{\theta})\,p(\mathbf{x}_2|\mathbf{x}_1, \boldsymbol{\theta})\cdots p(\mathbf{x}_N|\mathbf{x}_1, \ldots, \mathbf{x}_{N-1}, \boldsymbol{\theta})$$

**3. Indipendenza.** Noto $\boldsymbol{\theta}$, i campioni precedenti non dicono nulla sul $k$-esimo: $p(\mathbf{x}_k|\mathbf{x}_1, \ldots, \mathbf{x}_{k-1}, \boldsymbol{\theta}) = p_k(\mathbf{x}_k|\boldsymbol{\theta})$. È l'unico passo che usa l'indipendenza.

**4. Identica distribuzione.** Tutti i campioni vengono dallo stesso modello: $p_k = p$ per ogni $k$, e si ottiene $\prod_{k=1}^{N} p(\mathbf{x}_k|\boldsymbol{\theta})$. Con campioni indipendenti ma non identicamente distribuiti resterebbe un prodotto, ma di densità $p_k$ diverse (per esempio sensori con rumori diversi).

**(a)-(b) Numeri.** Le tre densità in $m = ${g(m0)}$ valgono $${dens.map((v) => g(v)).join(',\\ ')}$, quindi

$$p(\mathbf{X}|m) = ${dens.map((v) => g(v)).join(' \\cdot ')} = ${g(L)}, \qquad \ln p(\mathbf{X}|m) = ${g(lnL)}$$

Il logaritmo trasforma il prodotto in somma: $\ln p = -\frac{3}{2}\ln(2\pi) - \frac{1}{2}\sum_k(x_k - m)^2$.

**(c)** La somma dei quadrati è minima nella media: $\hat{m} = \frac{${g(xs[0])} + ${g(xs[1])} + ${g(xs[2])}}{3} = ${g(mhat)}$.

**(d)-(e) Misure duplicate.** Chi usa il prodotto su $2N$ righe conta ogni misura due volte: il picco della likelihood si stringe come se i dati fossero il doppio e la varianza dichiarata è $\frac{\sigma^2}{2N} = ${g(varDich)}$. La media delle $2N$ righe coincide con la media delle $N$ misure distinte, quindi la varianza vera è $\frac{\sigma^2}{N} = ${g(varVera)}$: il doppio. Le copie non sono indipendenti, e il prodotto sottovaluta l'incertezza della stima. Passaggi in [«perché la likelihood è un prodotto»](#derivation:der19).`,
      }
    },
  },
]
