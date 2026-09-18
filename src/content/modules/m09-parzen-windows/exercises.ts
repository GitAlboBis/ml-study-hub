// Esercizi generativi del modulo m09 (finestre di Parzen): uno per ogni esercizio dell'inventario (es01-es16).
// Ogni generatore usa solo rng: stesso seed, stessa istanza. I conti stanno in `calcoli`, così la verifica
// li confronta con i numeri dell'inventario (script nello scratchpad del pilota).
import { md } from '../../types'
import type { Exercise, ExerciseAnswer, Rng } from '../../types'

// ---------------------------------------------------------------------------------------------------
// Calcoli
// ---------------------------------------------------------------------------------------------------

type Punto = [number, number]

interface KernelInfo {
  id: string
  nome: string
  tex: string
  f: (x: number) => number
  sup: number
  supTex: string
  continuo: boolean
}

/** Densità normale standard 1-D: il kernel gaussiano delle slide (ch2 p58). */
const phi = (u: number) => Math.exp(-(u * u) / 2) / Math.sqrt(2 * Math.PI)

/** I sei kernel 1-D delle slide ch2 p58-59, con estremo superiore e continuità. */
const kernel: KernelInfo[] = [
  { id: 'rett', nome: 'rettangolare', tex: md`\Pi(x)`, f: (x) => (Math.abs(x) <= 0.5 ? 1 : 0), sup: 1, supTex: md`1`, continuo: false },
  { id: 'tri', nome: 'triangolare', tex: md`\Lambda(x)`, f: (x) => Math.max(0, 1 - Math.abs(x)), sup: 1, supTex: md`1`, continuo: true },
  { id: 'gauss', nome: 'gaussiano', tex: md`\frac{1}{\sqrt{2\pi}}\exp\left(-\frac{x^2}{2}\right)`, f: phi, sup: 1 / Math.sqrt(2 * Math.PI), supTex: md`\frac{1}{\sqrt{2\pi}}`, continuo: true },
  { id: 'exp', nome: 'esponenziale', tex: md`\frac{1}{2}\exp(-\vert x \vert)`, f: (x) => Math.exp(-Math.abs(x)) / 2, sup: 0.5, supTex: md`\frac{1}{2}`, continuo: true },
  { id: 'cauchy', nome: 'di Cauchy', tex: md`\frac{1}{\pi}\cdot\frac{1}{1+x^2}`, f: (x) => 1 / (Math.PI * (1 + x * x)), sup: 1 / Math.PI, supTex: md`\frac{1}{\pi}`, continuo: true },
  {
    id: 'sinc2',
    nome: 'sinc²',
    tex: md`\frac{1}{2\pi}\left(\frac{\sin(x/2)}{x/2}\right)^2`,
    f: (x) => (x === 0 ? 1 : (Math.sin(x / 2) / (x / 2)) ** 2) / (2 * Math.PI),
    sup: 1 / (2 * Math.PI),
    supTex: md`\frac{1}{2\pi}`,
    continuo: true,
  },
]

/** Numero di campioni con |x_k − x| ≤ h/2: il K della finestra a ipercubo in 1-D. */
const contaFinestra = (xs: number[], x: number, h: number) => xs.filter((xk) => Math.abs(xk - x) <= h / 2 + 1e-12).length

export const calcoli = {
  phi,
  kernel,
  contaFinestra,
  /** Stima di Parzen 1-D con finestra rettangolare: K/(N h). */
  parzenRett: (xs: number[], x: number, h: number) => contaFinestra(xs, x, h) / (xs.length * h),
  /** Stima di Parzen 1-D con kernel gaussiano di larghezza h. */
  parzenGauss: (xs: number[], x: number, h: number) => xs.reduce((s, xk) => s + phi((x - xk) / h), 0) / (xs.length * h),
  /** Picco della finestra normale a simmetria sferica: δ(0) = 1/((2π)^(n/2) h^n). */
  piccoDelta: (n: number, h: number) => 1 / ((2 * Math.PI) ** (n / 2) * h ** n),
  /** Bound sulla varianza (ch2 p61): sup(γ)·media/(N h^n). */
  boundVarianza: (sup: number, media: number, N: number, h: number, n: number) => (sup * media) / (N * h ** n),
  /** σ_k adattiva (ch2 p66): distanza euclidea media di x_k dai suoi L vicini più prossimi, x_k escluso. */
  sigmaAdattiva: (pts: Punto[], k: number, L: number) => {
    const d = pts
      .filter((_, j) => j !== k)
      .map(([a, b]) => Math.hypot(a - pts[k][0], b - pts[k][1]))
      .sort((p, q) => p - q)
    return d.slice(0, L).reduce((s, v) => s + v, 0) / L
  },
  /** Stima di Specht (ch2 p65) in n = 2 dimensioni con σ comune. */
  specht: (pts: Punto[], x: Punto, sigma: number) =>
    pts.reduce((s, [a, b]) => s + Math.exp(-((x[0] - a) ** 2 + (x[1] - b) ** 2) / (2 * sigma * sigma)) / (2 * Math.PI * sigma * sigma), 0) / pts.length,
  /** Pdf vera N(μ, σ_p²) e kernel gaussiano di larghezza h: picco medio della stima diviso picco vero. */
  rapportoPicco: (sp: number, h: number) => sp / Math.sqrt(sp * sp + h * h),
  /** Larghezza massima perché il picco medio si abbassi al più della frazione t. */
  hMassimoSfocatura: (sp: number, t: number) => sp * Math.sqrt(1 / (1 - t) ** 2 - 1),
}

// ---------------------------------------------------------------------------------------------------
// Formattazione
// ---------------------------------------------------------------------------------------------------

/** Numero per il testo: al più d decimali, senza zeri inutili e mai -0. */
const f = (x: number, d = 3) => {
  const r = Number(x.toFixed(d))
  return String(r === 0 ? 0 : r)
}
/** Tre cifre significative, per i numeri piccoli (bound sulla varianza). */
const s3 = (x: number) => {
  const r = Number(x.toPrecision(3))
  return String(r === 0 ? 0 : r)
}
/** Tolleranza: relativa, con un minimo assoluto. */
const tol = (v: number, rel = 0.01, abs = 0.001) => Math.max(abs, Math.abs(v) * rel)
const risposta = (label: string, value: number, tolerance = tol(value)): ExerciseAnswer => ({ label, value, tolerance })
const elenco = (xs: number[]) => xs.map((x) => f(x)).join(',\\ ')
/** Punto con due decimali che finisce in 5, vicino a un campione: nessun campione cade sul bordo della finestra. */
const puntoVicino = (rng: Rng, xs: number[]) => {
  const base = rng.pick(xs)
  const off = rng.pick([-0.15, -0.05, 0.05, 0.15])
  return Number((base + (base + off < 0 ? Math.abs(off) : off)).toFixed(2))
}
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b))
/** Frazione num/den ridotta, in LaTeX. */
const frazione = (num: number, den: number) => {
  if (num === 0) return '0'
  const g = gcd(num, den)
  return den / g === 1 ? String(num / g) : md`\frac{${num / g}}{${den / g}}`
}

// ---------------------------------------------------------------------------------------------------
// Esercizi
// ---------------------------------------------------------------------------------------------------

export const exercises: Exercise[] = [
  {
    id: 'es01',
    title: "Conteggio con l'ipercubo in 1-D",
    difficulty: 1,
    kind: 'numerico',
    concepts: ['c04', 'c05', 'c06', 'c07', 'c08', 'c11'],
    generate: (rng) => {
      const N = rng.int(8, 12)
      const xs = Array.from({ length: N }, () => rng.float(0, 6, 1)).sort((a, b) => a - b)
      const h = rng.pick([0.6, 0.8, 1, 1.2, 1.6, 2, 2.4])
      const x = puntoVicino(rng, xs)
      const dentro = xs.filter((xk) => Math.abs(xk - x) <= h / 2)
      const K = dentro.length
      const p = K / (N * h)
      return {
        prompt: md`La telecamera dell'impianto del pesce misura la luminosità (*lightness*) di $N = ${N}$ salmoni:

$$\{${elenco(xs)}\}$$

Stima la densità in $x^* = ${f(x, 2)}$ con la finestra a ipercubo (*hypercube window*) di lato $h = ${f(h)}$: in 1-D l'ipercubo è un intervallo centrato in $x^*$. Quanti campioni cadono nella finestra e quanto vale $\hat{p}(x^*)$?`,
        answers: [risposta(md`$K$`, K, 0.1), risposta(md`$\hat{p}(x^*)$`, p, tol(p, 0.01, 0.002))],
        solution: md`**1. La regione.** La finestra è centrata in $x^*$ e ha lato $h$: copre $[x^* - h/2,\ x^* + h/2] = [${f(x - h / 2, 2)},\ ${f(x + h / 2, 2)}]$.

**2. Il conteggio.** $\gamma\left(\frac{x_k - x^*}{h}\right) = 1$ solo se $\vert x_k - x^* \vert \le h/2 = ${f(h / 2)}$. Cadono dentro $${elenco(dentro)}$, quindi

$$K = \sum_{k=1}^{N} \gamma\left(\frac{x_k - x^*}{h}\right) = ${K}$$

**3. La stima.** In 1-D il volume è $V = h^n = h = ${f(h)}$:

$$\hat{p}(x^*) = \frac{K}{NV} = \frac{${K}}{${N} \cdot ${f(h)}} = ${f(p)}$$

Con due feature (luminosità e larghezza) la finestra diventerebbe un quadrato di lato $h$, con volume $V = h^2$, e il test si farebbe su entrambe le componenti: $\vert u_j \vert \le 1/2$ per $j = 1, 2$.`,
      }
    },
  },
  {
    id: 'es02',
    title: 'Interpolazione con kernel gaussiano su tre campioni',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c15', 'c16', 'c35', 'c26'],
    generate: (rng) => {
      const xs = [rng.float(1, 8, 1), rng.float(1, 8, 1), rng.float(1, 8, 1)]
      const h = rng.pick([0.6, 1, 1.4, 2])
      const x = Number((rng.float(2, 7, 1) + 0.05).toFixed(2))
      const us = xs.map((xk) => (x - xk) / h)
      const gs = us.map(phi)
      const p = calcoli.parzenGauss(xs, x, h)
      const K = contaFinestra(xs, x, h)
      const pr = K / (3 * h)
      const dmin = Math.min(...xs.map((xk) => Math.abs(x - xk)))
      const vicini = xs.filter((xk) => Math.abs(Math.abs(x - xk) - dmin) < 1e-9)
      const righe = xs.map((xk, i) => md`| ${i + 1} | $${f(xk)}$ | $${f(us[i])}$ | $${f(gs[i], 4)}$ |`).join('\n')
      return {
        prompt: md`Un sensore IoT registra tre letture di temperatura: $x_1 = ${f(xs[0])}$, $x_2 = ${f(xs[1])}$ e $x_3 = ${f(xs[2])}$ °C. Con il kernel gaussiano (*Gaussian kernel*) di larghezza $h = ${f(h)}$ stima la densità in $x = ${f(x, 2)}$. Poi ripeti il calcolo con il kernel rettangolare della stessa larghezza, cioè con il semplice conteggio, e confronta i due valori.`,
        answers: [risposta(md`$\hat{p}(x)$ gaussiano`, p, tol(p, 0.01, 0.002)), risposta(md`$\hat{p}(x)$ rettangolare`, pr, tol(pr, 0.01, 0.002))],
        solution: md`**1. Argomenti normalizzati.** $u_k = (x - x_k)/h$ e $\gamma(u) = \frac{1}{\sqrt{2\pi}} e^{-u^2/2}$:

| $k$ | $x_k$ | $u_k$ | $\gamma(u_k)$ |
|---|---|---|---|
${righe}

**2. Media dei kernel.** Con $n = 1$ il volume è $V(h) = h$:

$$\hat{p}(x) = \frac{1}{N}\sum_{k=1}^{N} \frac{1}{h}\,\gamma\left(\frac{x - x_k}{h}\right) = \frac{${f(gs[0], 4)} + ${f(gs[1], 4)} + ${f(gs[2], 4)}}{3 \cdot ${f(h)}} = ${f(p)}$$

Pesa di più il campione più vicino a $x$ (${vicini.length > 1 ? 'a pari merito ' : ''}$${elenco(vicini)}$, distanza $${f(dmin, 2)}$): ogni campione contribuisce secondo la sua distanza da $x$, è l'interpolazione (*interpolation*).

**3. Conteggio.** Con il rettangolo contano solo i campioni con $\vert x - x_k \vert \le h/2 = ${f(h / 2)}$: $K = ${K}$ e $\hat{p}(x) = \frac{K}{Nh} = \frac{${K}}{3 \cdot ${f(h)}} = ${f(pr)}$.

Il rettangolo chiede solo «dentro o fuori?» e dà una stima a gradini; la gaussiana dà a tutti e tre i campioni un peso graduato e una curva liscia.`,
      }
    },
  },
  {
    id: 'es03',
    title: 'Dimostrare che la stima di Parzen integra a 1',
    difficulty: 2,
    kind: 'dimostrazione',
    concepts: ['c19', 'c20', 'c21'],
    generate: (rng) => {
      const n = rng.int(1, 3)
      const h = rng.pick([0.5, 2, 3, 4])
      const senza = h ** n
      const conH = h ** (n - 1)
      return {
        prompt: md`Dimostra che, se $\gamma(\mathbf{x}) \ge 0$ per ogni $\mathbf{x} \in \Re^n$, $\int_{\Re^n} \gamma(\mathbf{x})\,d\mathbf{x} = 1$ e $V = h^n$, la stima

$$\hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k=1}^{N} \frac{1}{h^n}\,\gamma\left(\frac{\mathbf{x} - \mathbf{x}_k}{h}\right)$$

è una densità legittima (*legitimate density function*): non negativa e di area 1. Poi rispondi con i numeri, in $n = ${n}$ dimensioni con $h = ${f(h)}$: che area ha la stima se dimentichi il fattore $1/h^n$? E se per distrazione dividi per $h$ invece che per $h^n$?`,
        answers: [risposta('area senza $1/h^n$', senza), risposta('area dividendo per $h$', conH)],
        solution: md`**1. Non negatività.** $h > 0$ e $\gamma \ge 0$, quindi ogni termine $\frac{1}{h^n}\gamma(\cdot)$ è $\ge 0$; una media di termini non negativi è non negativa: $\hat{p}(\mathbf{x}) \ge 0$.

**2. Linearità.** Integrale e somma finita si scambiano:

$$\int_{\Re^n} \hat{p}(\mathbf{x})\,d\mathbf{x} = \frac{1}{N}\sum_{k=1}^{N} \frac{1}{h^n}\int_{\Re^n} \gamma\left(\frac{\mathbf{x} - \mathbf{x}_k}{h}\right) d\mathbf{x}$$

**3. Cambio di variabile.** $\mathbf{u} = (\mathbf{x} - \mathbf{x}_k)/h$, cioè $\mathbf{x} = \mathbf{x}_k + h\mathbf{u}$: ognuna delle $n$ coordinate si allunga di $h$, quindi $d\mathbf{x} = h^n\,d\mathbf{u}$.

$$\int_{\Re^n} \gamma\left(\frac{\mathbf{x} - \mathbf{x}_k}{h}\right) d\mathbf{x} = h^n \int_{\Re^n} \gamma(\mathbf{u})\,d\mathbf{u} = h^n$$

**4. Conclusione.**

$$\int_{\Re^n} \hat{p}(\mathbf{x})\,d\mathbf{x} = \frac{1}{N}\sum_{k=1}^{N} \frac{1}{h^n}\,h^n = \frac{1}{N}\cdot N = 1$$

**Numeri.** Senza il fattore $1/h^n$ ogni termine ha area $h^n$ e la media pure: area $= h^n = ${f(h)}^{${n}} = ${f(senza)}$. Dividendo per $h$ resta $h^n/h = h^{n-1} = ${f(conH)}$${n === 1 ? ': in 1-D va bene per caso, perché $h^n = h$' : ''}. Il fattore $1/V = 1/h^n$ serve a compensare l'allargamento della finestra.`,
      }
    },
  },
  {
    id: 'es04',
    title: 'Dimostrare che la media della stima è una convoluzione',
    difficulty: 3,
    kind: 'dimostrazione',
    concepts: ['c41', 'c42', 'c44', 'c45', 'c46'],
    generate: (rng) => {
      const h = rng.pick([0.2, 0.3, 0.4, 0.5, 0.6])
      const x = rng.float(0.01, h / 2 - 0.01, 2)
      const Ex = (x + h / 2) / h
      return {
        prompt: md`**Parte 1.** Con campioni i.i.d. di densità $p(\mathbf{x})$ dimostra che

$$E\{\hat{p}(\mathbf{x})\} = p(\mathbf{x}) * \frac{1}{h^n}\gamma\left(\frac{\mathbf{x}}{h}\right)$$

e spiega perché la stima è distorta (*biased*) a $h$ finito ma asintoticamente non distorta se $h_N \to 0$.

**Parte 2.** Un punteggio normalizzato ha densità uniforme su $[0, 1]$: $p(x) = 1$ nell'intervallo, $0$ fuori. Usi il kernel rettangolare con $h = ${f(h)}$. Quanto vale la media della stima in $x = ${f(x, 2)}$, nel bordo $x = 0$ e al centro $x = 0.5$?`,
        answers: [
          risposta(md`$E\{\hat{p}(${f(x, 2)})\}$`, Ex),
          risposta(md`$E\{\hat{p}(0)\}$`, 0.5),
          risposta(md`$E\{\hat{p}(0.5)\}$`, 1),
        ],
        solution: md`**1. Linearità del valore atteso.**

$$E\{\hat{p}(\mathbf{x})\} = \frac{1}{N}\sum_{k=1}^{N} E\left\{\frac{1}{h^n}\gamma\left(\frac{\mathbf{x} - \mathbf{x}_k}{h}\right)\right\}$$

**2. Campioni identicamente distribuiti.** Gli $N$ addendi hanno la stessa media: resta quella di un solo termine, con $\mathbf{v} \sim p$.

**3. Definizione di valore atteso.**

$$E\{\hat{p}(\mathbf{x})\} = \int_{\Re^n} \frac{1}{h^n}\gamma\left(\frac{\mathbf{x} - \mathbf{v}}{h}\right) p(\mathbf{v})\,d\mathbf{v}$$

**4. È una convoluzione.** Con $g(\mathbf{x}) = \frac{1}{h^n}\gamma(\mathbf{x}/h)$ l'integrale è $\int g(\mathbf{x} - \mathbf{v})\,p(\mathbf{v})\,d\mathbf{v} = (p * g)(\mathbf{x})$. $N$ non compare: a $h$ fisso il bias non cala con più dati.

**5. Limite.** Se $h_N \to 0$, $g$ mantiene area 1 e si stringe attorno all'origine: tende alla delta di Dirac, e $p * \delta = p$ nei punti in cui $p$ è continua. Quindi $\lim_{N\to+\infty} E\{\hat{p}(\mathbf{x})\} = p(\mathbf{x})$.

**Parte 2.** Con il rettangolo $E\{\hat{p}(x)\} = \frac{1}{h}\int_{x-h/2}^{x+h/2} p(v)\,dv$: la lunghezza della finestra che cade in $[0, 1]$, divisa per $h$.

- $x = ${f(x, 2)}$: la finestra è $[${f(x - h / 2, 3)},\ ${f(x + h / 2, 3)}]$, dentro cade un tratto lungo $${f(x + h / 2, 3)}$, quindi $E = ${f(x + h / 2, 3)}/${f(h)} = ${f(Ex)}$ (bias $${f(Ex - 1)}$).
- $x = 0$: metà finestra è fuori, $E = 0.5$, la media dei limiti sinistro (0) e destro (1). Nel punto di discontinuità vale $0.5$ per ogni $h \le 2$, finché la metà destra della finestra cade tutta in $[0, 1]$.
- $x = 0.5$: la finestra $[${f(0.5 - h / 2)},\ ${f(0.5 + h / 2)}]$ è tutta dentro, $E = 1$: dove $p$ è costante attorno a $x$ non c'è bias.

Lo spigolo della densità vera diventa una rampa larga $h$: è la sfocatura (*blurring*). Con $h_N \to 0$ la rampa si restringe e il bias sparisce ovunque tranne che nel punto di salto.`,
      }
    },
  },
  {
    id: 'es05',
    title: 'Riconoscere oversmoothing e stima troppo variabile',
    difficulty: 1,
    kind: 'concettuale',
    concepts: ['c18', 'c27', 'c28', 'c29', 'c30', 'c32'],
    generate: (rng) => {
      const a = rng.pick([0.02, 0.04, 0.05, 0.08])
      const hs = rng.shuffle([a, 5 * a, 25 * a])
      const N1 = rng.pick([50, 100, 200])
      const r = rng.pick([4, 16, 100])
      const N2 = N1 * r
      const fattore = Math.sqrt(r)
      return {
        prompt: md`Un sensore IoT misura la temperatura di un magazzino: le letture hanno due mode, giorno e notte. Con $N = ${N1}$ letture calcoli tre stime di Parzen con kernel gaussiano: A con $h = ${f(hs[0])}$, B con $h = ${f(hs[1])}$, C con $h = ${f(hs[2])}$.

(a) Quale $h$ produce la stima che insegue il rumore? (b) Quale $h$ produce la stima sovra-lisciata (*oversmoothing*)? (c) Di quante volte il picco della finestra riscalata $\delta(x)$ più stretta supera quello della più larga? (d) Se le letture diventano $${N2}$ e segui la legge $h_N = h_1/\sqrt{N}$, di che fattore si riduce $h$?`,
        answers: [
          risposta('(a) $h$ della stima rumorosa', a),
          risposta('(b) $h$ della stima sovra-lisciata', 25 * a),
          risposta('(c) rapporto tra i picchi', 25),
          risposta('(d) fattore di riduzione di $h$', fattore),
        ],
        solution: md`**Ampiezza e larghezza.** In 1-D $\delta(x) = \frac{1}{h}\gamma\left(\frac{x}{h}\right)$: il picco vale $\gamma(0)/h$ e la larghezza è proporzionale a $h$, mentre l'area resta 1.

- $h = ${f(a)}$: ogni $\delta$ è un ago alto e stretto; la stima è una fila di picchi sui campioni, varia molto da un campione all'altro e insegue il rumore (*overfitting*).
- $h = ${f(25 * a)}$: ogni $\delta$ è bassa e larga; le due mode si fondono in una sola collina: sovra-lisciatura (*oversmoothing*, *underfitting*).
- $h = ${f(5 * a)}$: la via di mezzo, con due mode riconoscibili.

**(c)** I picchi stanno in rapporto inverso alle larghezze: $\frac{\gamma(0)/${f(a)}}{\gamma(0)/${f(25 * a)}} = 25$.

**(d)** Più campioni permettono una finestra più stretta. Con $h_N = h_1/\sqrt{N}$: $\frac{h_{${N1}}}{h_{${N2}}} = \sqrt{\frac{${N2}}{${N1}}} = ${f(fattore)}$. Il prodotto $N h_N = h_1\sqrt{N}$ cresce lo stesso, quindi la varianza resta sotto controllo.`,
      }
    },
  },
  {
    id: 'es06',
    title: 'Quali leggi h_N danno una stima consistente?',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c49', 'c50', 'c51', 'c53'],
    generate: (rng) => {
      const n = rng.int(1, 4)
      const candidati: [number, number][] = [[1, 2 * n], [1, n], [2, n], [1, 3 * n], [3, 2 * n], [0, 1]]
      const [num, den] = rng.pick(candidati)
      const a = num / den
      const h1 = rng.pick([0.5, 1, 2])
      // esponente di N in N h_N^n, calcolato sulla frazione per non avere residui binari
      const esp = (den - num * n) / den
      const cond1 = a > 0
      const cond2 = esp > 0
      const consistente = cond1 && cond2
      const aTex = frazione(num, den)
      const espTex = frazione(den - num * n, den).replace(/^\\frac\{-/, '-\\frac{')
      const legge = num === 0 ? md`h_N = ${f(h1)}\ \text{(costante)}` : md`h_N = ${f(h1)}\cdot N^{-${aTex}}`
      return {
        prompt: md`In dimensione $n = ${n}$ considera la legge $${legge}$, cioè $h_N = h_1 N^{-a}$ con $h_1 = ${f(h1)}$ e $a = ${aTex}$.

(a) Qual è l'esponente di $N$ in $N h_N^n$? (b) La legge dà una stima consistente? Rispondi 1 per sì, 0 per no. (c) Qual è il valore di $a$ (escluso) oltre il quale $N h_N^n$ smette di divergere?`,
        answers: [risposta('(a) esponente di $N$', esp, 0.001), risposta('(b) consistente (1 = sì, 0 = no)', consistente ? 1 : 0, 0.1), risposta('(c) $a$ limite', 1 / n, 0.001)],
        solution: md`**Le due condizioni** (ch2 p61): $\lim_{N\to+\infty} h_N = 0$ e $\lim_{N\to+\infty} N h_N^n = +\infty$.

**1. Bias.** $h_N = h_1 N^{-a} \to 0$ se e solo se $a > 0$. Qui $a = ${aTex}$: ${cond1 ? 'la condizione vale' : 'la condizione non vale, la finestra non si stringe e il bias resta'}.

**2. Varianza.** $N h_N^n = h_1^n N^{1 - an}$, con esponente $1 - a n = 1 - ${aTex}\cdot ${n} = ${espTex}$. Diverge se e solo se $1 - an > 0$, cioè $a < \frac{1}{n} = ${frazione(1, n)}$: ${cond2 ? 'la condizione vale' : esp === 0 ? '$N h_N^n = h_1^n$ resta costante e il bound sulla varianza non va a zero' : '$N h_N^n \\to 0$ e il bound sulla varianza esplode'}.

**Verdetto.** ${consistente ? 'Entrambe le condizioni valgono: la stima è consistente.' : 'Almeno una condizione cade: la stima non è consistente.'} Le leggi $h_N = h_1 N^{-a}$ consistenti sono quelle con $0 < a < \frac{1}{n}$. L'esempio di Melgani $h_N = 1/\sqrt[2n]{N}$ ha $a = \frac{1}{2n}$, a metà dell'intervallo, e dà $N h_N^n = \sqrt{N}$.

Se $h_N$ si stringe troppo in fretta ($a \ge 1/n$) la stima diventa molto variabile; se non si stringe ($a = 0$) resta distorta.`,
      }
    },
  },
  {
    id: 'es07',
    title: 'Picco della finestra gaussiana al variare di h e di n',
    difficulty: 1,
    kind: 'numerico',
    concepts: ['c25', 'c27', 'c31'],
    generate: (rng) => {
      const n = rng.int(1, 3)
      const h = rng.pick([0.2, 0.25, 0.5, 1, 2])
      const picco = calcoli.piccoDelta(n, h)
      const fatt = 2 ** n
      return {
        prompt: md`La finestra normale a simmetria sferica in $n = ${n}$ dimensioni, riscalata con $\delta(\mathbf{x}) = \frac{1}{V(h)}\gamma\left(\frac{\mathbf{x}}{h}\right)$ e $V(h) = h^n$, è

$$\delta(\mathbf{x}) = \frac{1}{(2\pi)^{n/2} h^n}\exp\left(-\frac{\Vert\mathbf{x}\Vert^2}{2h^2}\right)$$

Con $h = ${f(h)}$: (a) quanto vale il picco $\delta(\mathbf{0})$? (b) Di che fattore cresce il picco se dimezzi $h$? (c) Quanto vale il volume sotto $\delta$?`,
        answers: [risposta(md`(a) $\delta(\mathbf{0})$`, picco, tol(picco, 0.01, 0.002)), risposta('(b) fattore', fatt, 0.01), risposta('(c) volume', 1, 0.01)],
        solution: md`**(a)** Nell'origine l'esponenziale vale 1:

$$\delta(\mathbf{0}) = \frac{\gamma(\mathbf{0})}{h^n} = \frac{1}{(2\pi)^{${n}/2}\cdot ${f(h)}^{${n}}} = ${f(picco, 3)}$$

**(b)** Il picco è proporzionale a $1/h^n$: dimezzando $h$ si moltiplica per $2^n = ${fatt}$.

**(c)** Il volume resta 1 per ogni $h$: con $\mathbf{u} = \mathbf{x}/h$ si ha $d\mathbf{x} = h^n d\mathbf{u}$ e il fattore $1/h^n$ lo compensa. $h$ cambia insieme ampiezza e larghezza, ad area costante.

Controllo con la figura di ch2 p56 ($n = 2$): $h = 1, 0.5, 0.2$ danno $0.159$, $0.637$, $3.98$. Riducendo $h$ di 5 volte il picco cresce di $5^2 = 25$ volte.`,
      }
    },
  },
  {
    id: 'es08',
    title: 'Calcolo del bound sulla varianza',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c47', 'c48'],
    generate: (rng) => {
      const k = rng.pick(kernel.filter((x) => x.id !== 'sinc2'))
      const n = rng.int(1, 2)
      const N = rng.pick([100, 200, 500, 1000])
      const h = rng.pick([0.1, 0.2, 0.25, 0.5])
      const m = rng.pick([0.1, 0.15, 0.2, 0.3, 0.4])
      // in 2-D il kernel è il prodotto di due kernel 1-D, uno per feature: il suo massimo è (sup γ)²
      const sup = k.sup ** n
      const supTex = n === 1 ? k.supTex : k.sup === 1 ? md`1^2` : md`\left(${k.supTex}\right)^2`
      // il valore decimale accanto alla forma esatta solo se aggiunge qualcosa: «= 1 ≈ 1» non si scrive
      const supVal = f(sup, 4)
      const supNum = supTex === supVal ? '' : Number(supVal) === sup ? md` = ${supVal}` : md` \approx ${supVal}`
      // per un kernel prodotto il bound va come (sup γ₁ / h)^n: la dimensione pesa secondo questo rapporto
      const r = k.sup / h
      const verso = Math.abs(r - 1) < 1e-9 ? 'resta uguale' : r > 1 ? 'cresce' : 'cala'
      const B = calcoli.boundVarianza(sup, m, N, h, n)
      const sd = Math.sqrt(B)
      const fatt = 2 ** n
      return {
        prompt: md`Stimi con Parzen la densità di ${n === 1 ? 'una feature' : 'due feature'} dei salmoni (${n === 1 ? 'la lunghezza' : 'lunghezza e larghezza'}) con il kernel ${k.nome}, $\gamma(x) = ${k.tex}$${n === 2 ? ' (in 2-D si usa il prodotto di due kernel 1-D, uno per feature)' : ''}. Hai $N = ${N}$ campioni, $h_N = ${f(h)}$, $n = ${n}$, e nel punto $\mathbf{x}$ la media della stima vale $\bar{\hat{p}}(\mathbf{x}) = ${f(m)}$.

(a) Quanto vale il bound sulla varianza? (b) Qual è la deviazione standard massima della stima? (c) Di che fattore cresce il bound se dimezzi $h_N$, supponendo invariata la media della stima?`,
        answers: [risposta('(a) bound', B, tol(B, 0.02, 1e-7)), risposta('(b) deviazione standard massima', sd, tol(sd, 0.02, 1e-5)), risposta('(c) fattore', fatt, 0.01)],
        solution: md`**Bound** (ch2 p61):

$$E\left\{\left(\hat{p}(\mathbf{x}) - \bar{\hat{p}}(\mathbf{x})\right)^2\right\} \le \frac{\sup(\gamma(\cdot))\,\bar{\hat{p}}(\mathbf{x})}{N h_N^n}$$

**(a)** Per il kernel ${k.nome} $\sup\gamma = \gamma(\mathbf{0}) = ${supTex}${supNum}$${n === 2 ? ': il kernel 2-D è il prodotto di due kernel 1-D, quindi il suo massimo è il quadrato del massimo 1-D' : ''}. $N h_N^n = ${N} \cdot ${f(h)}^{${n}} = ${f(N * h ** n)}$, quindi

$$\text{bound} = \frac{${f(sup, 4)} \cdot ${f(m)}}{${f(N * h ** n)}} = ${s3(B)}$$

**(b)** $\sqrt{${s3(B)}} = ${s3(sd)}$, cioè circa il $${f((100 * sd) / m, 1)}\%$ del valore medio della stima.

**(c)** $h_N^n$ sta al denominatore: dimezzando $h_N$ il volume della finestra si divide per $2^n$ e il bound si moltiplica per $2^n = ${fatt}$. In realtà anche $\bar{\hat{p}}(\mathbf{x})$ dipende da $h$: la supposizione serve solo a isolare l'effetto del volume.

Il bound cala come $1/(N h_N^n)$: più campioni o finestre più larghe riducono la varianza.

**Dimensione.** Con un kernel prodotto $\sup\gamma = (\sup\gamma_1)^n$, quindi il bound va come $\frac{1}{N}\left(\frac{\sup\gamma_1}{h_N}\right)^n$. Qui $\sup\gamma_1/h_N = ${f(r, 3)}$: a parità di $N$ e di media della stima, ogni feature in più moltiplica il bound per $${f(r, 3)}$ (il bound ${verso}). Il bound esplode al crescere di $n$ solo se $h_N < \sup\gamma_1$: con la finestra a ipercubo basta $h_N < 1$, con il gaussiano serve $h_N < 0.399$. È una faccia della maledizione della dimensionalità (*curse of dimensionality*); anche la media della stima cambia con $n$, quindi il confronto isola solo l'effetto del volume.`,
      }
    },
  },
  {
    id: 'es09',
    title: 'σ adattiva dagli L vicini più prossimi',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c62', 'c63', 'c64'],
    generate: (rng) => {
      const pts: Punto[] = []
      while (pts.length < 5) {
        const p: Punto = [rng.int(0, 8), rng.int(0, 8)]
        if (!pts.some(([a, b]) => a === p[0] && b === p[1])) pts.push(p)
      }
      const nomi = ['A', 'B', 'C', 'D', 'E']
      const s = rng.int(0, 4)
      const L = rng.pick([2, 3])
      const sig = pts.map((_, k) => calcoli.sigmaAdattiva(pts, k, L))
      const smax = Math.max(...sig)
      // tutti i campioni con la σ massima: con coordinate intere capitano pari merito
      const imax = sig.flatMap((v, i) => (Math.abs(v - smax) < 1e-9 ? [i] : []))
      const nomiMax = imax.map((i) => nomi[i])
      const ultimo = nomiMax[nomiMax.length - 1]
      const chiMax = nomiMax.length === 1 ? ultimo : `${nomiMax.slice(0, -1).join(', ')} ${/^[AE]/.test(ultimo) ? 'ed' : 'e'} ${ultimo}`
      const piuIsolato =
        imax.length === 1
          ? md`La più grande è quella di ${chiMax} ($${f(smax)}$), il campione più isolato.`
          : md`La più grande, $${f(smax)}$, spetta a pari merito a ${chiMax}: i campioni più isolati.`
      const dist = pts
        .map(([a, b], j) => ({ j, d: Math.hypot(a - pts[s][0], b - pts[s][1]) }))
        .filter((x) => x.j !== s)
        .sort((p, q) => p.d - q.d)
      const elencoPunti = pts.map(([a, b], i) => md`${nomi[i]}$(${a}, ${b})$`).join(', ')
      const righe = dist.map((x, i) => md`| ${i + 1} | ${nomi[x.j]} | $${f(x.d)}$ |`).join('\n')
      return {
        prompt: md`Cinque salmoni descritti da due feature già normalizzate (luminosità e larghezza): ${elencoPunti}. Con la $\sigma$ adattiva del metodo di Specht, $\sigma_k$ è la distanza euclidea media di $\mathbf{x}_k$ dai suoi $L$ vicini più prossimi. Con $L = ${L}$: (a) quanto vale $\sigma$ per il campione ${nomi[s]}? (b) Qual è la $\sigma_k$ più grande fra i cinque campioni?`,
        answers: [risposta(md`(a) $\sigma_{${nomi[s]}}$`, sig[s], 0.01), risposta(md`(b) $\max_k \sigma_k$`, smax, 0.01)],
        solution: md`**Formula** (ch2 p66): $\sigma_k = \frac{1}{L}\sum_{l=1}^{L} \Vert\mathbf{x}_k - \mathbf{y}_l\Vert$, con $\mathbf{y}_1, \dots, \mathbf{y}_L$ i vicini più prossimi di $\mathbf{x}_k$ fra gli altri campioni.

**(a)** Distanze da ${nomi[s]}, in ordine crescente:

| posto | campione | distanza |
|---|---|---|
${righe}

$\sigma_{${nomi[s]}} = \frac{1}{${L}}(${dist.slice(0, L).map((x) => f(x.d)).join(' + ')}) = ${f(sig[s])}$.

**(b)** Con $L = ${L}$: ${sig.map((v, i) => md`$\sigma_{${nomi[i]}} = ${f(v)}$`).join(', ')}. ${piuIsolato}

Dove i campioni sono fitti ci sono pochi vuoti da riempire e basta una gaussiana stretta; un campione isolato riceve una gaussiana larga e bassa, che copre la zona rada. L'idea prende dal K-NN la ricerca dei vicini per fissare la larghezza dei kernel di Parzen.`,
      }
    },
  },
  {
    id: 'es10',
    title: 'Kernel validi e kernel «buoni»',
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c20', 'c22', 'c23', 'c24', 'c33', 'c34', 'c35', 'c36', 'c37', 'c38', 'c39'],
    generate: (rng) => {
      const k = rng.pick(kernel)
      const x0 = rng.pick([0.25, 0.75, 1.5, 2])
      const v = k.f(x0)
      return {
        prompt: md`Prendi il kernel ${k.nome} delle slide, $\gamma(x) = ${k.tex}$. (a) Quanto vale $\sup\gamma = \gamma(0)$? (b) Quanto vale $\gamma(${f(x0)})$? (c) Quanti dei sei kernel delle slide (rettangolare, triangolare, gaussiano, esponenziale, Cauchy, sinc²) sono continui?

Poi, a voce: quali condizioni rendono un kernel valido e quali lo rendono «buono»? Perché un $\text{sinc}$ non elevato al quadrato non andrebbe bene?`,
        answers: [risposta('(a) $\\sup\\gamma$', k.sup, 0.002), risposta(md`(b) $\gamma(${f(x0)})$`, v, 0.002), risposta('(c) kernel continui', 5, 0.1)],
        solution: md`**(a)** $\gamma(0) = ${k.supTex} \approx ${f(k.sup)}$. **(b)** $\gamma(${f(x0)}) = ${f(v, 4)}$.

**Kernel valido** (ch2 p54): $\gamma(\mathbf{x}) \ge 0$ e $\int_{\Re^n}\gamma(\mathbf{x})\,d\mathbf{x} = 1$, cioè il kernel è una densità. **Kernel «buono»**: massimo nell'origine, continuo, $\gamma(\mathbf{x}) \to 0$ per $\Vert\mathbf{x}\Vert \to +\infty$.

| kernel | $\sup\gamma$ | densità | max in 0 | continuo | $\to 0$ |
|---|---|---|---|---|---|
| rettangolare $\Pi(x)$ | $1$ | sì | sì | **no** | sì |
| triangolare $\Lambda(x)$ | $1$ | sì | sì | sì | sì |
| gaussiano | $1/\sqrt{2\pi} \approx 0.399$ | sì | sì | sì | sì |
| esponenziale | $1/2$ | sì | sì (cuspide) | sì | sì |
| Cauchy | $1/\pi \approx 0.318$ | sì | sì | sì | sì (code pesanti) |
| sinc² | $1/(2\pi) \approx 0.159$ | sì | sì | sì | sì (oscillando) |

**(c)** Cinque: solo il rettangolare salta in $\pm 1/2$, e infatti produce stime a gradini.

Il $\text{sinc}$ semplice ha lobi negativi: violerebbe $\gamma \ge 0$ e la stima potrebbe diventare negativa. Il quadrato lo rende non negativo e il fattore $1/(2\pi)$ gli dà area 1. Il gaussiano resta il più usato: liscio, derivabile, con code che si spengono in fretta.`,
      }
    },
  },
  {
    id: 'es11',
    title: 'Differenze tra Parzen e K-NN',
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c02', 'c03', 'c01'],
    generate: (rng) => {
      const N = 10
      const xs = Array.from({ length: N }, () => rng.float(0, 10, 1)).sort((a, b) => a - b)
      const x = puntoVicino(rng, xs)
      const h = rng.pick([1, 1.4, 2])
      const K = rng.pick([2, 3, 4])
      const Kp = contaFinestra(xs, x, h)
      const pP = Kp / (N * h)
      const rK = (pt: number) => xs.map((xk) => Math.abs(xk - pt)).sort((a, b) => a - b)[K - 1]
      const r = rK(x)
      const pK = K / (N * 2 * r)
      const lontano = Number((xs[N - 1] + h / 2 + rng.pick([0.5, 1, 1.5])).toFixed(2))
      const rl = rK(lontano)
      const pKl = K / (N * 2 * rl)
      return {
        prompt: md`Lunghezze (in dm) di $N = 10$ spigole: $\{${elenco(xs)}\}$. Stima la densità in $x^* = ${f(x, 2)}$ con Parzen (finestra rettangolare, $h = ${f(h)}$) e con il K-NN ($K = ${K}$). Poi ripeti nel punto $x = ${f(lontano, 2)}$, oltre l'ultimo campione. Infine spiega a voce che cosa fissa e che cosa calcola ciascun metodo.`,
        answers: [
          risposta(md`Parzen in $x^*$`, pP, tol(pP, 0.02, 0.002)),
          risposta(md`K-NN in $x^*$`, pK, tol(pK, 0.02, 0.002)),
          risposta(md`Parzen in $${f(lontano, 2)}$`, 0, 0.001),
          risposta(md`K-NN in $${f(lontano, 2)}$`, pKl, tol(pKl, 0.02, 0.001)),
        ],
        solution: md`Entrambi partono da $\hat{p}(x^*) = \frac{K}{NV}$.

**Parzen: fisso $V = h$, conto $K$.** La finestra $[${f(x - h / 2, 2)},\ ${f(x + h / 2, 2)}]$ contiene $${Kp}$ campioni: $\hat{p}(x^*) = \frac{${Kp}}{10 \cdot ${f(h)}} = ${f(pP)}$.

**K-NN: fisso $K$, misuro $V$.** L'intervallo centrato in $x^*$ si allarga fino al ${K}° vicino, a distanza $r_K = ${f(r, 2)}$: $V_K(x^*) = 2r_K = ${f(2 * r, 2)}$ e $\hat{p}(x^*) = \frac{${K}}{10 \cdot ${f(2 * r, 2)}} = ${f(pK)}$.

**Fuori dai dati.** In $x = ${f(lontano, 2)}$ la finestra di Parzen $[${f(lontano - h / 2, 2)},\ ${f(lontano + h / 2, 2)}]$ è vuota: $\hat{p} = 0$. Il K-NN allarga la cella fino a $r_K = ${f(rl, 2)}$ e dà $\hat{p} = \frac{${K}}{10 \cdot ${f(2 * rl, 2)}} = ${f(pKl)} > 0$: non si annulla mai, e le sue code scendono piano.

**A voce.** Parzen fissa la regione (e quindi $V$) e conta i campioni; il K-NN fissa $K$ e misura il volume che serve a raccoglierli. Parzen dà stime lisce con kernel lisci e di area 1, ma dipende dalla scelta di $h$; il K-NN si adatta alla densità locale ma dà stime appuntite, con code pesanti, dipendenti da $K$. Nell'illustrazione di ch2 p46: $V = 1/\sqrt{N}$ per Parzen, $K = \sqrt{N}$ per il K-NN. Entrambi convergono alla pdf vera per $N \to \infty$.`,
      }
    },
  },
  {
    id: 'es12',
    title: 'Stima di Specht in 2-D con due campioni',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c58', 'c59', 'c60'],
    generate: (rng) => {
      const x1: Punto = [rng.int(0, 3), rng.int(0, 3)]
      const x2: Punto = [x1[0] + rng.pick([1, 2, 3]), x1[1] + rng.pick([1, 2])]
      const x: Punto = [(x1[0] + x2[0]) / 2, (x1[1] + x2[1]) / 2]
      const sigma = rng.pick([1, 1.5, 2])
      const p1 = calcoli.specht([x1, x2], x, sigma)
      const p2 = calcoli.specht([x1, x2], x, sigma / 2)
      const d2 = (x[0] - x1[0]) ** 2 + (x[1] - x1[1]) ** 2
      const d2cm = (x[0] - x1[0]) ** 2 + (10 * (x[1] - x1[1])) ** 2
      const termine = (s: number) => Math.exp(-d2 / (2 * s * s)) / (2 * Math.PI * s * s)
      return {
        prompt: md`Due salmoni descritti da (lunghezza, larghezza) in dm: $\mathbf{x}_1 = (${x1[0]}, ${x1[1]})$ e $\mathbf{x}_2 = (${x2[0]}, ${x2[1]})$. Usa il kernel gaussiano a simmetria sferica (metodo di Specht) in $n = 2$.

(a) Quanto vale $\hat{p}(\mathbf{x})$ nel punto medio $\mathbf{x} = (${f(x[0])}, ${f(x[1])})$ con $\sigma = ${f(sigma)}$? (b) E con $\sigma = ${f(sigma / 2)}$? (c) Se la larghezza fosse espressa in cm (moltiplicata per 10) senza normalizzare, quanto varrebbe $\Vert\mathbf{x} - \mathbf{x}_1\Vert^2$?`,
        answers: [
          risposta(md`(a) $\hat{p}(\mathbf{x})$, $\sigma = ${f(sigma)}$`, p1, tol(p1, 0.02, 1e-5)),
          risposta(md`(b) $\hat{p}(\mathbf{x})$, $\sigma = ${f(sigma / 2)}$`, p2, tol(p2, 0.02, 1e-5)),
          risposta('(c) distanza al quadrato', d2cm, 0.01),
        ],
        solution: md`**Formula** (ch2 p65):

$$\hat{p}(\mathbf{x}) = \frac{1}{N}\sum_{k=1}^{N} \frac{1}{(2\pi\sigma^2)^{n/2}}\exp\left(-\frac{\Vert\mathbf{x} - \mathbf{x}_k\Vert^2}{2\sigma^2}\right)$$

Il punto medio è equidistante dai due campioni: $\Vert\mathbf{x} - \mathbf{x}_1\Vert^2 = \Vert\mathbf{x} - \mathbf{x}_2\Vert^2 = ${f(d2)}$. I due termini sono uguali e la media vale uno di essi. Con $n = 2$, $(2\pi\sigma^2)^{n/2} = 2\pi\sigma^2$.

**(a)** $\frac{1}{2\pi \cdot ${f(sigma * sigma)}} e^{-${f(d2)}/(2 \cdot ${f(sigma * sigma)})} = ${f(1 / (2 * Math.PI * sigma * sigma), 4)} \cdot ${f(Math.exp(-d2 / (2 * sigma * sigma)), 4)} = ${s3(termine(sigma))}$, quindi $\hat{p}(\mathbf{x}) = ${s3(p1)}$.

**(b)** Con $\sigma = ${f(sigma / 2)}$: $\frac{1}{2\pi \cdot ${f((sigma * sigma) / 4)}} e^{-${f(d2)}/(2 \cdot ${f((sigma * sigma) / 4)})} = ${s3(p2)}$. ${p2 < p1 ? 'Nel punto medio la stima scende: le gaussiane più strette coprono meno lo spazio fra i due campioni.' : 'Nel punto medio la stima sale: i campioni sono abbastanza vicini perché le due gaussiane più strette, e più alte, si sommino ancora lì.'}

**(c)** $\sigma$ è la stessa lungo tutte le feature. Con la larghezza in cm la differenza in quella feature si moltiplica per 10: $${f(x[0] - x1[0])}^2 + (10 \cdot ${f(x[1] - x1[1])})^2 = ${f(d2cm)}$ invece di $${f(d2)}$. La feature con la scala più grande domina la distanza e le «sfere» del kernel diventano ellissi schiacciate rispetto ai dati: per questo si normalizzano le feature prima della stima.`,
      }
    },
  },
  {
    id: 'es13',
    title: "Simulazione d'orale: «Is Parzen a good estimator?»",
    difficulty: 3,
    kind: 'concettuale',
    concepts: ['c67', 'c41', 'c45', 'c47', 'c49', 'c53'],
    generate: (rng) => {
      const n = rng.int(1, 3)
      const N = rng.pick([100, 400, 2500, 10000])
      const m = rng.pick([0.2, 0.3])
      const hN = N ** (-1 / (2 * n))
      const NhN = Math.sqrt(N)
      // kernel gaussiano sferico in n dimensioni: il massimo è (2π)^(-n/2)
      const sup = (2 * Math.PI) ** (-n / 2)
      const B = (sup * m) / NhN
      return {
        prompt: md`Costruisci in cinque minuti una risposta ordinata alla domanda «Is Parzen a good estimator?»: contesto e formula generale, media della stima, non distorsione asintotica, bound sulla varianza, condizioni di consistenza con un esempio, pratica a $N$ finito.

Per l'esempio usa $n = ${n}$ e $N = ${N}$ con la legge di ch2 p61, $h_N = 1/\sqrt[2n]{N}$. (a) Quanto vale $h_N$? (b) Quanto vale $N h_N^n$? (c) Con il kernel gaussiano sferico ($\sup\gamma = (2\pi)^{-n/2}$) e media della stima $${f(m)}$ nel punto, quanto vale il bound sulla varianza?`,
        answers: [risposta('(a) $h_N$', hN, tol(hN, 0.01, 0.001)), risposta('(b) $N h_N^n$', NhN, tol(NhN, 0.01, 0.01)), risposta('(c) bound', B, tol(B, 0.02, 1e-6))],
        solution: md`**Numeri.** $h_N = ${N}^{-1/${2 * n}} = ${f(hN, 4)}$; $N h_N^n = N \cdot N^{-1/2} = \sqrt{N} = ${f(NhN)}$; $\sup\gamma = (2\pi)^{-${n}/2} = ${f(sup, 4)}$, quindi bound $= \frac{${f(sup, 4)} \cdot ${f(m)}}{${f(NhN)}} = ${s3(B)}$.

**Risposta modello, in prima persona.**

1. Parzen stima la pdf senza modello parametrico: fisso una finestra di larghezza $h$ attorno a ogni campione e medio i kernel, $\hat{p}(\mathbf{x}) = \frac{1}{N}\sum_k \frac{1}{h^n}\gamma\left(\frac{\mathbf{x} - \mathbf{x}_k}{h}\right)$.
2. La media della stima è una convoluzione, $E\{\hat{p}(\mathbf{x})\} = p(\mathbf{x}) * \frac{1}{h^n}\gamma\left(\frac{\mathbf{x}}{h}\right)$: una versione sfocata di $p$, quindi a $h$ finito la stima è distorta.
3. Se $h_N \to 0$ il kernel riscalato tende alla delta di Dirac e $\lim E\{\hat{p}(\mathbf{x})\} = p(\mathbf{x})$: asintoticamente non distorta.
4. La varianza è limitata da $\frac{\sup(\gamma(\cdot))\,\bar{\hat{p}}(\mathbf{x})}{N h_N^n}$: si annulla se $N h_N^n \to +\infty$.
5. Con le due condizioni insieme, $h_N \to 0$ e $N h_N^n \to +\infty$, la stima è consistente; per esempio $h_N = 1/\sqrt[2n]{N}$, che dà $N h_N^n = \sqrt{N}$.
6. A $N$ finito tutto dipende da $h$ (o da $\sigma$): troppo grande sfoca, troppo piccolo insegue il rumore. Normalizzo le feature, posso usare una $\sigma_k$ adattiva, e in alta dimensione servono moltissimi campioni.

**Autovalutazione.** Devono comparire: la formula generale, la convoluzione, il limite alla delta di Dirac, il bound sulla varianza, le due condizioni e l'esempio di $h_N$.`,
      }
    },
  },
  {
    id: 'es14',
    title: 'Disegno con due campioni: scaletta e curva liscia',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c71', 'c10', 'c11', 'c16'],
    generate: (rng) => {
      const x1 = rng.float(0, 4, 1)
      const d = rng.pick([0.5, 1, 1.5, 2, 2.5, 3])
      const x2 = Number((x1 + d).toFixed(1))
      const hR = rng.pick([0.8, 1.2, 1.6, 2.4, 3.2])
      const hG = rng.pick([0.25, 0.5, 1, 1.5])
      const mid = (x1 + x2) / 2
      const pMid = calcoli.parzenRett([x1, x2], mid, hR)
      const pX1 = calcoli.parzenRett([x1, x2], x1, hR)
      const pG = calcoli.parzenGauss([x1, x2], mid, hG)
      const soglia = d / 2
      const altezza = 1 / (2 * hR)
      const sovrapposti = d < hR
      return {
        prompt: md`Due campioni 1-D, $x_1 = ${f(x1)}$ e $x_2 = ${f(x2)}$ ($N = 2$): è il disegno che Melgani chiede all'orale.

(a) Con il kernel rettangolare e $h = ${f(hR)}$, quanto vale $\hat{p}$ nel punto medio $x = ${f(mid, 2)}$? (b) Quanto vale in $x = x_1$? (c) Con il kernel gaussiano e $h = ${f(hG)}$, quanto vale $\hat{p}$ nel punto medio? (d) Sotto quale $h$ la curva gaussiana mostra due gobbe separate?`,
        answers: [
          risposta('(a) rettangolare, punto medio', pMid, 0.002),
          risposta(md`(b) rettangolare, $x_1$`, pX1, 0.002),
          risposta('(c) gaussiano, punto medio', pG, tol(pG, 0.01, 0.002)),
          risposta('(d) soglia di $h$', soglia, 0.01),
        ],
        solution: md`**Conteggio.** Ogni campione porta un rettangolo di base $h = ${f(hR)}$ e altezza $\frac{1}{Nh} = \frac{1}{2 \cdot ${f(hR)}} = ${f(altezza)}$, cioè area $1/N = 1/2$: su $[${f(x1 - hR / 2, 2)},\ ${f(x1 + hR / 2, 2)}]$ e su $[${f(x2 - hR / 2, 2)},\ ${f(x2 + hR / 2, 2)}]$. ${sovrapposti ? md`Si sovrappongono perché $d = ${f(d)} < h$: la stima è una scaletta $0,\ ${f(altezza)},\ ${f(2 * altezza)},\ ${f(altezza)},\ 0$.` : md`Non si sovrappongono perché $d = ${f(d)} > h$: due gradini separati alti $${f(altezza)}$ con un tratto a zero in mezzo.`}

**(a)** Nel punto medio la finestra $[${f(mid - hR / 2, 2)},\ ${f(mid + hR / 2, 2)}]$ ${sovrapposti ? 'contiene entrambi i campioni' : 'non contiene nessun campione'}: $K = ${Math.round(pMid * 2 * hR)}$ e $\hat{p} = \frac{K}{Nh} = ${f(pMid)}$.

**(b)** In $x_1$ ${pX1 > altezza + 1e-9 ? md`la finestra arriva anche a $x_2$ (perché $d \le h/2$)` : md`la finestra contiene solo $x_1$ (perché $d > h/2$)`}: $\hat{p}(x_1) = ${f(pX1)}$.

**Interpolazione.** Con la gaussiana ogni campione pesa secondo la distanza:

$$\hat{p}(x) = \frac{1}{2h}\left[\gamma\left(\frac{x - x_1}{h}\right) + \gamma\left(\frac{x - x_2}{h}\right)\right]$$

**(c)** Nel punto medio le due distanze valgono $d/2 = ${f(d / 2, 2)}$: $\hat{p} = \frac{1}{h}\gamma\left(\frac{d}{2h}\right) = \frac{1}{${f(hG)}}\gamma(${f(d / (2 * hG), 3)}) = ${f(pG)}$.

**(d)** La somma di due gaussiane uguali ha due gobbe se $\vert x_1 - x_2 \vert > 2h$, cioè $h < d/2 = ${f(soglia, 2)}$. Con $h = ${f(hG)}$ ${d > 2 * hG ? 'le gobbe sono due, con una valle in mezzo' : 'si vede una sola gobba, con il massimo a metà strada'}.

In entrambi i disegni l'area totale è 1, perché ogni campione porta massa $1/N$. Il rettangolo dà gradini con salti in $x_k \pm h/2$; la gaussiana dà una curva liscia senza salti.`,
      }
    },
  },
  {
    id: 'es15',
    title: 'Quanto si abbassa il picco: la sfocatura in forma chiusa',
    difficulty: 3,
    kind: 'numerico',
    concepts: ['c41', 'c42', 'c44', 'c45'],
    generate: (rng) => {
      const sp = rng.pick([1, 1.5, 2, 3])
      const h = rng.pick([0.5, 1, 1.5, 2])
      const t = rng.pick([0.01, 0.02, 0.05])
      const sd = Math.sqrt(sp * sp + h * h)
      const ratio = calcoli.rapportoPicco(sp, h)
      const hmax = calcoli.hMassimoSfocatura(sp, t)
      return {
        prompt: md`La temperatura notturna di un magazzino ha densità normale con deviazione standard $\sigma_p = ${f(sp)}$ °C (qui $\sigma_p$ è della densità vera, non del kernel). Stimi con Parzen, kernel gaussiano di larghezza $h = ${f(h)}$.

(a) Qual è la deviazione standard della media della stima? (b) Di che fattore si abbassa in media il picco? (c) Il risultato cambia se $N$ passa da 50 a 5000 con $h$ fisso? (d) Quale $h$ massimo abbassa il picco medio al più del $${f(100 * t)}\%$?`,
        answers: [risposta('(a) deviazione standard', sd, tol(sd, 0.005, 0.005)), risposta('(b) rapporto dei picchi', ratio, 0.005), risposta('(d) $h$ massimo', hmax, tol(hmax, 0.01, 0.002))],
        solution: md`**(a)** La media della stima è la convoluzione della pdf vera con il kernel. Se $X \sim \mathcal{N}(\mu, \sigma_p^2)$ e $Z$ è normale standard indipendente, $X + hZ$ ha densità $p * \frac{1}{h}\gamma\left(\frac{x}{h}\right)$ e varianza $\sigma_p^2 + h^2$:

$$E\{\hat{p}(x)\} = \mathcal{N}(x;\ \mu,\ \sigma_p^2 + h^2),\qquad \sqrt{${f(sp * sp)} + ${f(h * h)}} = ${f(sd)}$$

**(b)** Il picco di una normale è $1/(\sqrt{2\pi}\,\sigma)$:

$$\frac{E\{\hat{p}(\mu)\}}{p(\mu)} = \frac{\sigma_p}{\sqrt{\sigma_p^2 + h^2}} = \frac{${f(sp)}}{${f(sd)}} = ${f(ratio)}$$

cioè il $${f(100 * (1 - ratio), 1)}\%$ in meno: la stima media è la pdf vera fuori fuoco (*blurred*).

**(c)** No. $N$ non compare nella media della stima: con $h$ fisso il bias resta, cambia solo la varianza.

**(d)** Serve $\frac{\sigma_p}{\sqrt{\sigma_p^2 + h^2}} \ge ${f(1 - t, 2)}$, cioè

$$h \le \sigma_p\sqrt{\frac{1}{${f(1 - t, 2)}^2} - 1} = ${f(sp)} \cdot ${f(Math.sqrt(1 / (1 - t) ** 2 - 1), 4)} = ${f(hmax)}$$

Con $h_N \to 0$ la varianza $\sigma_p^2 + h_N^2$ torna a $\sigma_p^2$: la stima è asintoticamente non distorta.`,
      }
    },
  },
  {
    id: 'es16',
    title: 'Convergono entrambi? Condizioni di Parzen e del K-NN a confronto',
    difficulty: 3,
    kind: 'concettuale',
    concepts: ['c69', 'c49', 'c02', 'c70'],
    generate: (rng) => {
      const n = rng.int(1, 3)
      const N = rng.pick([100, 400, 900, 2500, 10000])
      const p = rng.pick([0.1, 0.2, 0.25, 0.4])
      const VN = 1 / Math.sqrt(N)
      const KN = Math.sqrt(N)
      const atteso = Math.sqrt(N) * p
      return {
        prompt: md`«Explain both KNN and Parzen windows, do they tend to the optimal solution?» Scrivi le condizioni di consistenza dei due metodi, poi fai i conti con $n = ${n}$, $N = ${N}$ e una densità vera che vale $p(\mathbf{x}^*) = ${f(p)}$ nel punto.

(a) Con l'esempio di Parzen $h_N = 1/\sqrt[2n]{N}$, quanto vale il volume $V_N = h_N^n$? (b) Quanto vale $K_N$ con la legge $K(N) = \sqrt{N}$ del K-NN? (c) Quanti campioni cadono in media nella finestra di Parzen?`,
        answers: [risposta('(a) $V_N$', VN, tol(VN, 0.01, 0.0005)), risposta('(b) $K_N$', KN, 0.01), risposta('(c) campioni attesi', atteso, tol(atteso, 0.01, 0.01))],
        solution: md`**Condizioni.** Parzen (ch2 p61): $\lim h_N = 0$ e $\lim N h_N^n = +\infty$, cioè $V_N \to 0$ e $N V_N \to +\infty$. K-NN (ch2 p47): $\lim K_N = +\infty$ e $\lim K_N/N = 0$, condizione necessaria e sufficiente nei punti in cui $p$ è continua.

**(a)** $V_N = h_N^n = \left(N^{-1/(2n)}\right)^n = N^{-1/2} = 1/\sqrt{${N}} = ${f(VN, 4)}$: è la legge $V = 1/\sqrt{N}$ dell'illustrazione di ch2 p46, per ogni $n$.

**(b)** $K_N = \sqrt{${N}} = ${f(KN)}$.

**(c)** In media nella finestra cadono circa $N V_N\,p(\mathbf{x}^*) = \sqrt{N}\,p(\mathbf{x}^*) = ${f(atteso, 2)}$ campioni, dello stesso ordine di $K_N$.

**Perché chiedono la stessa cosa.** Da $K \approx N V p(\mathbf{x}^*)$: la regione deve restringersi ($V_N \to 0$, ovvero $K_N/N \to 0$) perché $p$ sia quasi costante al suo interno, senza bias; e deve contenere sempre più campioni ($N V_N \to +\infty$, ovvero $K_N \to +\infty$) perché valga la legge dei grandi numeri, senza varianza.

**Leggi che falliscono.** $V_N$ costante viola $V_N \to 0$ (bias). $V_N = 1/N$ dà $N V_N = 1$ e viola la seconda (varianza). $K_N = 5$ costante viola $K_N \to +\infty$ (varianza). $K_N = N/2$ dà $K_N/N = 1/2$ e viola $K_N/N \to 0$ (bias).

Differenza che resta: in Parzen la cella si restringe in modo deterministico, qualunque siano i dati; nel K-NN si adatta ai dati.`,
      }
    },
  },
]
