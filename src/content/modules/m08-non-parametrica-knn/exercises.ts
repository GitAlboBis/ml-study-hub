// Esercizi generativi del modulo m08 (stima non parametrica e K-NN): uno per ogni esercizio dell'inventario
// (es01-es22). Ogni generatore usa solo rng: stesso seed, stessa istanza. I conti stanno in `calcoli`, così lo
// script di verifica li confronta con le istanze svolte dell'inventario.
import { md } from '../../types'
import type { Exercise, ExerciseAnswer, Rng } from '../../types'

type Punto = [number, number]

// ---------------------------------------------------------------------------------------------------
// Calcoli
// ---------------------------------------------------------------------------------------------------

/** Densità normale N(mu, sigma^2) in 1-D. */
const gauss = (x: number, mu: number, sigma: number) =>
  Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma)) / (sigma * Math.sqrt(2 * Math.PI))

/** Integrale di g su [a, b] con la regola di Simpson (n intervalli, n pari). */
const simpson = (g: (x: number) => number, a: number, b: number, n = 400) => {
  const h = (b - a) / n
  let s = g(a) + g(b)
  for (let i = 1; i < n; i++) s += (i % 2 === 1 ? 4 : 2) * g(a + i * h)
  return (s * h) / 3
}

/** Distanza di x dal suo K-esimo vicino in 1-D: la K-esima più piccola tra le |x − x_k|. */
const rK = (xs: number[], x: number, K: number) => xs.map((xk) => Math.abs(xk - x)).sort((a, b) => a - b)[K - 1]

/** Stima K-NN in 1-D (ch2 p47 con cella a intervallo): K/(N · 2 r_K(x)). */
const knn1d = (xs: number[], x: number, K: number) => K / (xs.length * 2 * rK(xs, x, K))

interface Cuspide { pos: number; altezza: number; sx: number; dx: number; larghezza: number }
interface Angolo { pos: number; valore: number; esce: number; entra: number }
/** Tratto di iperbole K/(2N|x − c|) tra `da` e `a`: c è il K-esimo vicino, `destra` dice se x sta a destra di c. */
interface Tratto { da: number; a: number; c: number; destra: boolean }

/**
 * Forma a tratti della stima K-NN 1-D (campioni ordinati e distinti, 2 ≤ K ≤ N): cuspidi nei punti medi dei gruppi
 * di K campioni consecutivi, minimi angolosi nei punti medi tra il campione che esce e quello che entra, rami di
 * iperbole in mezzo e due code.
 */
const struttura = (xs: number[], K: number) => {
  const N = xs.length
  const cuspidi: Cuspide[] = Array.from({ length: N - K + 1 }, (_, i) => {
    const larghezza = xs[i + K - 1] - xs[i]
    return { pos: (xs[i] + xs[i + K - 1]) / 2, altezza: K / (N * larghezza), sx: xs[i], dx: xs[i + K - 1], larghezza }
  })
  const angoli: Angolo[] = Array.from({ length: N - K }, (_, i) => ({
    pos: (xs[i] + xs[i + K]) / 2,
    valore: K / (N * (xs[i + K] - xs[i])),
    esce: xs[i],
    entra: xs[i + K],
  }))
  const tratti: Tratto[] = [{ da: -Infinity, a: cuspidi[0].pos, c: xs[K - 1], destra: false }]
  for (let i = 0; i < N - K; i++) {
    tratti.push({ da: cuspidi[i].pos, a: angoli[i].pos, c: xs[i], destra: true })
    tratti.push({ da: angoli[i].pos, a: cuspidi[i + 1].pos, c: xs[i + K], destra: false })
  }
  tratti.push({ da: cuspidi[N - K].pos, a: Infinity, c: xs[N - K], destra: true })
  return { cuspidi, angoli, tratti }
}

/** Area sotto la stima K-NN 1-D su [u, v], sommando gli integrali dei rami di iperbole. */
const areaKnn = (xs: number[], K: number, u: number, v: number) => {
  const N = xs.length
  let area = 0
  for (const t of struttura(xs, K).tratti) {
    const a = Math.max(u, t.da)
    const b = Math.min(v, t.a)
    if (b <= a) continue
    area += (K / (2 * N)) * (t.destra ? Math.log((b - t.c) / (a - t.c)) : Math.log((t.c - a) / (t.c - b)))
  }
  return area
}

/**
 * La cuspide più alta è unica? Lo è se un solo gruppo di K campioni consecutivi ha la larghezza minima. Con i
 * campioni sulla griglia a 0.1 le parità sono frequenti: gli esercizi che chiedono la posizione del picco più alto
 * rigenerano i campioni finché la risposta è una sola.
 */
const piccoUnico = (xs: number[], K: number) => {
  const w = struttura(xs, K).cuspidi.map((c) => c.larghezza)
  const min = Math.min(...w)
  return w.filter((x) => x < min + 1e-9).length === 1
}

/** Campioni 1-D ordinati sulla griglia a 0.1 in [lo, hi], a distanza almeno `gap` l'uno dall'altro. */
const campioni1d = (rng: Rng, n: number, lo: number, hi: number, gap: number) => {
  const out: number[] = []
  for (let t = 0; t < 400 && out.length < n; t++) {
    const v = rng.float(lo, hi, 1)
    if (out.every((u) => Math.abs(u - v) >= gap - 1e-9)) out.push(v)
  }
  // riserva deterministica, mai usata in pratica: completa oltre hi con passo gap
  for (let v = hi + gap; out.length < n; v += gap) out.push(Number(v.toFixed(1)))
  return out.sort((a, b) => a - b)
}

/** Punti distinti nel piano, sulla griglia a 0.1, in un quadrato di semilato `raggio` attorno al centro. */
const puntiAttorno = (rng: Rng, n: number, centro: Punto, raggio: number, visti: Set<string>) => {
  const out: Punto[] = []
  for (let t = 0; t < 500 && out.length < n; t++) {
    const p: Punto = [
      Number((centro[0] + rng.float(-raggio, raggio)).toFixed(1)),
      Number((centro[1] + rng.float(-raggio, raggio)).toFixed(1)),
    ]
    const key = `${p[0]},${p[1]}`
    if (!visti.has(key)) {
      visti.add(key)
      out.push(p)
    }
  }
  return out
}

export const calcoli = { gauss, simpson, rK, knn1d, struttura, areaKnn }

// ---------------------------------------------------------------------------------------------------
// Formattazione
// ---------------------------------------------------------------------------------------------------

/** Numero per il testo: al più d decimali, senza zeri inutili e mai -0. */
const f = (x: number, d = 3) => {
  const r = Number(x.toFixed(d))
  return String(r === 0 ? 0 : r)
}
/** Numero per la matematica con `sig` cifre significative; fuori da [0.001, 10^6) in notazione scientifica. */
const sci = (x: number, sig = 3): string => {
  if (x === 0) return '0'
  const a = Math.abs(x)
  if (a >= 1e-3 && a < 1e6) return String(Number(x.toPrecision(sig)))
  let e = Math.floor(Math.log10(a))
  let m = Number((x / 10 ** e).toPrecision(sig))
  if (Math.abs(m) >= 10) {
    m = Number((m / 10).toPrecision(sig))
    e += 1
  }
  return md`${m} \cdot 10^{${e}}`
}
/** Intero per la matematica, con lo spazio sottile tra le migliaia da 10 000 in su. */
const intero = (n: number) => {
  const s = String(Math.round(n))
  return Math.abs(n) >= 1e4 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, '\\,') : s
}
/**
 * Tolleranza: relativa, con un minimo assoluto per i valori piccoli. Il minimo assoluto non supera mai il 2% del
 * valore: con valori molto piccoli conta la parte relativa, e una risposta sbagliata (per esempio 0 al posto di una
 * distanza piccola ma non nulla) non viene accettata. Per un valore esattamente nullo resta il minimo assoluto.
 */
const tol = (v: number, rel = 0.01, abs = 0.001) =>
  v === 0 ? abs : Math.max(Math.abs(v) * rel, Math.min(abs, Math.abs(v) * 0.02))
const risposta = (label: string, value: number, tolerance = tol(value)): ExerciseAnswer => ({ label, value, tolerance })
const elenco = (xs: number[], d = 2) => xs.map((x) => f(x, d)).join(',\\ ')
const coppia = (p: Punto, d = 2) => `(${f(p[0], d)},\\ ${f(p[1], d)})`
const infTex = (x: number, d = 3) => (x === -Infinity ? '-\\infty' : x === Infinity ? '+\\infty' : f(x, d))

// ---------------------------------------------------------------------------------------------------
// Leggi K(N) per l'esercizio sulla consistenza
// ---------------------------------------------------------------------------------------------------

interface Legge { tex: string; K: (N: number) => number; lim1: string; lim2: string; c1: boolean; c2: boolean; nota: string }

const leggiK: Legge[] = [
  {
    tex: md`K_N = 5`,
    K: () => 5,
    lim1: md`\lim_{N\to+\infty} K_N = 5 \neq +\infty`,
    lim2: md`\lim_{N\to+\infty} \frac{5}{N} = 0`,
    c1: false,
    c2: true,
    nota: md`Cade la prima condizione. Il contenuto di probabilità della cella resta disperso di circa $1/\sqrt{5} \approx 45\%$ per $N$ grande, e non cala aggiungendo dati; la stima ha un bias di circa $+25\%$ e una dispersione relativa che tende a circa $58\%$. La curva resta frastagliata anche con milioni di campioni: *overfitting* persistente, varianza che non si annulla.`,
  },
  {
    tex: md`K_N = 1`,
    K: () => 1,
    lim1: md`\lim_{N\to+\infty} K_N = 1 \neq +\infty`,
    lim2: md`\lim_{N\to+\infty} \frac{1}{N} = 0`,
    c1: false,
    c2: true,
    nota: md`Cade la prima condizione nel modo peggiore: la stima diverge su ogni campione e il suo valore atteso è infinito. Sono gli spilli della prima riga della figura con $N = 1$, che restano spilli per qualunque $N$.`,
  },
  {
    tex: md`K_N = \sqrt{N}`,
    K: (N) => Math.sqrt(N),
    lim1: md`\lim_{N\to+\infty} \sqrt{N} = +\infty`,
    lim2: md`\lim_{N\to+\infty} \frac{\sqrt{N}}{N} = \lim_{N\to+\infty} \frac{1}{\sqrt{N}} = 0`,
    c1: true,
    c2: true,
    nota: md`Valgono entrambe: è l'esempio della slide 47. La cella contiene sempre più campioni, ma una frazione sempre più piccola del totale.`,
  },
  {
    tex: md`K_N = \ln N`,
    K: (N) => Math.log(N),
    lim1: md`\lim_{N\to+\infty} \ln N = +\infty`,
    lim2: md`\lim_{N\to+\infty} \frac{\ln N}{N} = 0`,
    c1: true,
    c2: true,
    nota: md`Valgono entrambe, ma $K_N$ cresce così piano (circa 14 con $N = 10^6$) che la varianza cala lentissima.`,
  },
  {
    tex: md`K_N = N/10`,
    K: (N) => N / 10,
    lim1: md`\lim_{N\to+\infty} \frac{N}{10} = +\infty`,
    lim2: md`\lim_{N\to+\infty} \frac{K_N}{N} = \frac{1}{10} \neq 0`,
    c1: true,
    c2: false,
    nota: md`Cade la seconda condizione: la cella contiene sempre il 10% dei campioni, quindi circa il 10% della massa di probabilità. Il volume non tende a zero e la stima tende alla media di $p$ su una regione larga: bias che non sparisce, *oversmoothing* persistente.`,
  },
  {
    tex: md`K_N = N/2`,
    K: (N) => N / 2,
    lim1: md`\lim_{N\to+\infty} \frac{N}{2} = +\infty`,
    lim2: md`\lim_{N\to+\infty} \frac{K_N}{N} = \frac{1}{2} \neq 0`,
    c1: true,
    c2: false,
    nota: md`Cade la seconda condizione: la cella deve contenere metà dei dati, quindi circa metà della massa di probabilità. Ogni struttura locale sparisce: è quasi il caso limite $K = N$, *oversmoothing* estremo.`,
  },
  {
    tex: md`K_N = N^{0.9}`,
    K: (N) => N ** 0.9,
    lim1: md`\lim_{N\to+\infty} N^{0.9} = +\infty`,
    lim2: md`\lim_{N\to+\infty} \frac{N^{0.9}}{N} = \lim_{N\to+\infty} N^{-0.1} = 0`,
    c1: true,
    c2: true,
    nota: md`Valgono entrambe, ma $K_N/N = N^{-0.1}$ scende piano: con $N = 10^6$ la cella contiene ancora circa il 25% dei dati e la stima resta sovra-lisciata a lungo.`,
  },
  {
    tex: md`K_N = N^{2/3}`,
    K: (N) => N ** (2 / 3),
    lim1: md`\lim_{N\to+\infty} N^{2/3} = +\infty`,
    lim2: md`\lim_{N\to+\infty} \frac{N^{2/3}}{N} = \lim_{N\to+\infty} N^{-1/3} = 0`,
    c1: true,
    c2: true,
    nota: md`Valgono entrambe: con $N = 10^6$ la cella contiene l'1% dei dati e $K_N = 10\,000$ campioni.`,
  },
  {
    tex: md`K_N = N/\ln N`,
    K: (N) => N / Math.log(N),
    lim1: md`\lim_{N\to+\infty} \frac{N}{\ln N} = +\infty`,
    lim2: md`\lim_{N\to+\infty} \frac{K_N}{N} = \lim_{N\to+\infty} \frac{1}{\ln N} = 0`,
    c1: true,
    c2: true,
    nota: md`Valgono entrambe, ma $K_N/N = 1/\ln N$ va a zero lentissimo: con $N = 10^6$ vale ancora circa $0.072$.`,
  },
]

// ---------------------------------------------------------------------------------------------------
// Esercizi
// ---------------------------------------------------------------------------------------------------

export const exercises: Exercise[] = [
  {
    id: 'es01',
    title: 'Calcolare la stima K/(N·V)',
    difficulty: 1,
    kind: 'numerico',
    concepts: ['c17', 'c20', 'c22'],
    generate: (rng) => {
      const N = rng.int(20, 500)
      const K = rng.int(1, Math.floor(N / 4))
      const dueD = rng.next() < 0.5
      const P = K / N
      let V: number
      let scena: string
      let volume: string
      if (dueD) {
        const r = rng.float(0.1, 1, 2)
        V = Math.PI * r * r
        scena = md`Nel piano (luminosità, larghezza) hai le misure di $N = ${N}$ salmoni. Attorno al punto $\mathbf{x}^*$ prendi come regione $R$ il cerchio di raggio $r = ${f(r, 2)}$ centrato in $\mathbf{x}^*$, e dentro cadono $K = ${K}$ campioni.`
        volume = md`In 2-D il volume è un'area: $V = \pi r^2 = \pi \cdot ${f(r, 2)}^2 = ${f(V, 4)}$.`
      } else {
        V = rng.float(0.05, 2, 2)
        const x = rng.float(15, 25, 1)
        scena = md`Un sensore IoT ha registrato $N = ${N}$ letture di temperatura. Attorno a $x^* = ${f(x, 1)}$ °C prendi come regione $R$ l'intervallo centrato in $x^*$ largo $V = ${f(V, 2)}$ °C, e dentro cadono $K = ${K}$ letture.`
        volume = md`In 1-D il volume è una lunghezza: $V = ${f(V, 2)}$ °C.`
      }
      const p = K / (N * V)
      const commento =
        p > 1
          ? md`La stima vale più di 1 e va bene così: $\hat{p}$ è una densità, misurata in «probabilità per unità di volume», e supera 1 ogni volta che $V < K/N$. A dover valere 1 è l'area sotto la pdf, non la sua altezza.`
          : md`Qui la stima resta sotto 1, ma lo supererebbe con una regione di volume minore di $K/N = ${f(P, 4)}$. Una densità non è una probabilità: a dover valere 1 è l'area sotto la pdf, non la sua altezza.`
      return {
        prompt: md`${scena}

Stima la probabilità $P_R$ che un campione cada in $R$ e la densità $\hat{p}(\mathbf{x}^*)$.`,
        answers: [risposta(md`$\hat{P}_R$`, P, tol(P, 0.01, 0.0005)), risposta(md`$\hat{p}(\mathbf{x}^*)$`, p, tol(p, 0.01, 0.0005))],
        solution: md`**1. Probabilità della regione.** Stimo $P_R = P\{\mathbf{x} \in R\}$ con la frequenza relativa (*relative frequency*), che la legge dei grandi numeri rende una stima consistente:

$$\hat{P}_R = \frac{K}{N} = \frac{${K}}{${N}} = ${f(P, 4)}$$

**2. Volume.** ${volume}

**3. Densità.** Se la pdf è continua e $R$ è abbastanza piccola, $P_R \simeq p(\mathbf{x}^*)\,V$. Divido la stima di $P_R$ per il volume:

$$\hat{p}(\mathbf{x}^*) = \frac{\hat{P}_R}{V} = \frac{K}{NV} = \frac{${K}}{${N} \cdot ${f(V, 4)}} = ${sci(p, 4)}$$

${commento}`,
      }
    },
  },
  {
    id: 'es02',
    title: 'Stima K-NN in 1-D da una lista di campioni',
    difficulty: 1,
    kind: 'numerico',
    concepts: ['c35', 'c36', 'c37', 'c38', 'c39', 'c49'],
    generate: (rng) => {
      const N = 8
      const griglia = Array.from({ length: 81 }, (_, i) => i / 10)
      const xs = rng.shuffle(griglia).slice(0, N).sort((a, b) => a - b)
      // punto vicino a un campione, con due decimali che finiscono in 5: nessuna distanza nulla
      const base = rng.pick(xs)
      const off = rng.pick([-0.15, -0.05, 0.05, 0.15])
      const x = Number((base + (base + off < 0 ? -off : off)).toFixed(2))
      const Ka = rng.pick([1, 2, 3])
      const Kb = Ka + 2
      const ord = xs.map((xk) => ({ xk, d: Math.abs(xk - x) })).sort((a, b) => a.d - b.d)
      const rA = ord[Ka - 1].d
      const rB = ord[Kb - 1].d
      const pA = Ka / (N * 2 * rA)
      const pB = Kb / (N * 2 * rB)
      const righe = ord.map((o, i) => md`| ${i + 1} | $${f(o.xk, 1)}$ | $${f(o.d, 2)}$ |`).join('\n')
      const passo = (K: number, r: number, p: number) => md`Allargo l'intervallo centrato in $x^*$ fino al ${K}° vicino: $r_{${K}} = ${f(r, 2)}$, quindi $V_{${K}}(x^*) = 2\,r_{${K}} = ${f(2 * r, 2)}$ e

$$\hat{p}(x^*) = \frac{K}{N\,V_K(x^*)} = \frac{${K}}{8 \cdot ${f(2 * r, 2)}} = ${f(p, 4)}$$`
      return {
        prompt: md`La telecamera dell'impianto misura la luminosità (*lightness*, scala da 0 a 8) di $N = 8$ salmoni:

$$\{${elenco(xs, 1)}\}$$

Stima la densità in $x^* = ${f(x, 2)}$ con il metodo K-NN, prima con $K = ${Ka}$ e poi con $K = ${Kb}$. Prima dei conti scrivi le due ipotesi del metodo. Per ogni $K$ trova il raggio $r_K$ (distanza dal $K$-esimo vicino) e la stima $\hat{p}(x^*)$.`,
        answers: [
          risposta(md`$r_{${Ka}}$`, rA, 0.006),
          risposta(md`$\hat{p}(x^*)$ con $K = ${Ka}$`, pA, tol(pA, 0.01, 0.002)),
          risposta(md`$r_{${Kb}}$`, rB, 0.006),
          risposta(md`$\hat{p}(x^*)$ con $K = ${Kb}$`, pB, tol(pB, 0.01, 0.002)),
        ],
        solution: md`**Ipotesi.** (1) $K$ è fissato a priori, prima di guardare $x^*$: qui $K = ${Ka}$ e poi $K = ${Kb}$. (2) La forma della cella è scelta a priori: in 1-D l'ipersfera è un intervallo simmetrico centrato in $x^*$, con semi-larghezza $r$ e volume $V = 2r$.

**1. Distanze da $x^* = ${f(x, 2)}$, in ordine crescente.**

| ordine | campione | distanza |
|---|---|---|
${righe}

**2. $K = ${Ka}$.** ${passo(Ka, rA, pA)}

**3. $K = ${Kb}$.** ${passo(Kb, rB, pB)}

**Confronto.** Con $K = ${Kb}$ la cella è larga $${f(2 * rB, 2)}$ invece di $${f(2 * rA, 2)}$: la stima media su una zona più ampia, cambia meno da un campione all'altro e perde dettaglio locale. Al crescere di $K$ la curva si appiattisce (*oversmoothing*); con $K$ piccolo insegue i singoli campioni (*overfitting*). Il numeratore $K$ è fissato: tutta l'informazione sulla densità sta nel volume.${Ka === 1 ? md` Con $K = 1$ basta avvicinare $x^*$ a un campione perché $r_1 \to 0$ e la stima diverga: è il caso limite degli spilli.` : ''}`,
      }
    },
  },
  {
    id: 'es03',
    title: 'Stima K-NN in 2-D con cella circolare',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c36', 'c37', 'c38', 'c39'],
    generate: (rng) => {
      const M = rng.int(10, 15)
      const pts = puntiAttorno(rng, M, [2.5, 2.5], 2.3, new Set<string>())
      const N = pts.length
      const xq: Punto = [Number((rng.float(1, 3.9, 1) + 0.05).toFixed(2)), Number((rng.float(1, 3.9, 1) + 0.05).toFixed(2))]
      const K = rng.int(2, 5)
      const info = pts.map((p, i) => ({
        i: i + 1,
        p,
        d: Math.hypot(p[0] - xq[0], p[1] - xq[1]),
        dq: Math.max(Math.abs(p[0] - xq[0]), Math.abs(p[1] - xq[1])),
      }))
      const ord = [...info].sort((a, b) => a.d - b.d)
      const r = ord[K - 1].d
      const V = Math.PI * r * r
      const p = K / (N * V)
      const s = info.map((o) => o.dq).sort((a, b) => a - b)[K - 1]
      const Vq = (2 * s) ** 2
      const pq = K / (N * Vq)
      const tabella = info.map((o) => md`| ${o.i} | $${f(o.p[0], 1)}$ | $${f(o.p[1], 1)}$ |`).join('\n')
      const ordinata = ord.map((o, j) => md`| ${j + 1} | ${o.i} | $${coppia(o.p, 1)}$ | $${f(o.d, 3)}$ | $${f(o.dq, 2)}$ |`).join('\n')
      return {
        prompt: md`Nel piano (luminosità $x_1$, larghezza $x_2$) hai $N = ${N}$ salmoni di training:

| $k$ | $x_1$ | $x_2$ |
|---|---|---|
${tabella}

Stima la densità nel punto $\mathbf{x}^* = ${coppia(xq)}$ con il K-NN, $K = ${K}$ e cella circolare: trova il raggio $r_K$, l'area $V_K(\mathbf{x}^*)$ e la stima. Poi ripeti con una cella quadrata centrata in $\mathbf{x}^*$, allargata finché contiene $K$ campioni.`,
        answers: [
          risposta(md`$r_K$`, r, 0.005),
          risposta(md`$V_K(\mathbf{x}^*)$ (cerchio)`, V, tol(V, 0.015, 0.002)),
          risposta(md`$\hat{p}(\mathbf{x}^*)$ (cerchio)`, p, tol(p, 0.02, 0.0005)),
          risposta(md`$\hat{p}(\mathbf{x}^*)$ (quadrato)`, pq, tol(pq, 0.02, 0.0005)),
        ],
        solution: md`**1. Distanze.** Con la cella circolare la vicinanza si misura con la distanza euclidea $\Vert\mathbf{x}_k - \mathbf{x}^*\Vert$; con la cella quadrata conta la coordinata più lontana, $\max_j \vert x_{k,j} - x^*_j \vert$. In ordine di distanza euclidea:

| ordine | $k$ | $\mathbf{x}_k$ | euclidea | massima coordinata |
|---|---|---|---|---|
${ordinata}

**2. Cella circolare.** Il cerchio si allarga fino al ${K}° vicino: $r_K = ${f(r, 3)}$ e

$$V_K(\mathbf{x}^*) = \pi\,r_K^2 = \pi \cdot ${f(r, 3)}^2 = ${f(V, 4)}, \qquad \hat{p}(\mathbf{x}^*) = \frac{K}{N\,V_K(\mathbf{x}^*)} = \frac{${K}}{${N} \cdot ${f(V, 4)}} = ${f(p, 4)}$$

**3. Cella quadrata.** Il quadrato centrato in $\mathbf{x}^*$ contiene $\mathbf{x}_k$ se il suo semilato è almeno la massima coordinata di $\mathbf{x}_k$. La ${K}ª più piccola di queste distanze è $${f(s, 2)}$: il lato vale $${f(2 * s, 2)}$ e

$$V = (2 \cdot ${f(s, 2)})^2 = ${f(Vq, 4)}, \qquad \hat{p}(\mathbf{x}^*) = \frac{${K}}{${N} \cdot ${f(Vq, 4)}} = ${f(pq, 4)}$$

La forma della cella è la seconda ipotesi del K-NN: cambiandola cambiano la misura di vicinanza, la formula del volume e quindi il numero finale, anche con gli stessi dati.`,
      }
    },
  },
  {
    id: 'es04',
    title: 'Quali leggi K(N) sono consistenti?',
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c40', 'c41', 'c42', 'c43'],
    generate: (rng) => {
      const L = rng.pick(leggiK)
      const Nq = rng.pick([1e4, 1e6])
      const Kint = (N: number) => Math.max(1, Math.round(L.K(N)))
      const Kq = Kint(Nq)
      const rq = Kq / Nq
      const consistente = L.c1 && L.c2
      const cade = consistente ? 0 : !L.c1 ? 1 : 2
      const righe = [100, 1e4, 1e6].map((N) => md`| $${intero(N)}$ | $${intero(Kint(N))}$ | $${sci(Kint(N) / N)}$ |`).join('\n')
      return {
        prompt: md`Scegli il numero di vicini con la legge $${L.tex}$ (arrotondato all'intero). Condizioni della slide 47:

$$\lim_{N\to+\infty} K_N = +\infty, \qquad \lim_{N\to+\infty} \frac{K_N}{N} = 0$$

(a) Quanto vale $K_N$ con $N = ${intero(Nq)}$? (b) Quanto vale $K_N/N$? (c) La stima K-NN è consistente? Rispondi 1 per sì, 0 per no. (d) Quale condizione cade? Rispondi 0 se nessuna, 1 se la prima, 2 se la seconda. Spiega quale difetto resta nella stima.`,
        answers: [
          risposta(md`(a) $K_N$`, Kq, Math.max(0.6, Kq * 0.005)),
          risposta(md`(b) $K_N/N$`, rq, tol(rq, 0.01, 1e-8)),
          risposta('(c) consistente (1 = sì, 0 = no)', consistente ? 1 : 0, 0.1),
          risposta('(d) condizione che cade (0, 1 o 2)', cade, 0.1),
        ],
        solution: md`**1. I numeri.**

| $N$ | $K_N$ | $K_N/N$ |
|---|---|---|
${righe}

Con $N = ${intero(Nq)}$: $K_N = ${intero(Kq)}$ e $K_N/N = ${sci(rq)}$.

**2. Prima condizione** (i campioni nella cella crescono senza limite, la dispersione relativa della stima va a zero):

$$${L.lim1}$$

**3. Seconda condizione** (la cella contiene una frazione sempre più piccola dei dati, quindi il suo volume tende a zero e il bias sparisce):

$$${L.lim2}$$

**Verdetto: ${consistente ? 'consistente' : 'non consistente'}.** ${L.nota}

Le due condizioni servono insieme: $K_N$ deve crescere, ma molto più piano di $N$. Per le potenze $K_N = N^a$ la regola è $0 < a < 1$.`,
      }
    },
  },
  {
    id: 'es05',
    title: 'Compilare la tabella della figura Parzen contro K-NN',
    difficulty: 1,
    kind: 'numerico',
    concepts: ['c32', 'c33', 'c34'],
    generate: (rng) => {
      // da N = 4 in su: con N = 1 il cerchio di area 1 (r ≈ 0.564) esce dal quadrato unitario
      const m = rng.int(2, 20)
      const N = m * m
      const V = 1 / m
      const r = Math.sqrt(V / Math.PI)
      const colonne = [1, 4, 9, 16, 100].map((n) => md`| $${n}$ | $${f(1 / Math.sqrt(n), 3)}$ | $${Math.sqrt(n)}$ |`).join('\n')
      return {
        prompt: md`Nella figura della slide 46 la riga di Parzen segue la legge $V = \frac{1}{\sqrt{N}}$, quella del K-NN la legge $K = \sqrt{N}$. Il riquadro è il quadrato unitario e la regione è un cerchio centrato nel suo centro.

Con $N = ${N}$ campioni: (a) quanto vale il volume $V$ di Parzen? (b) Quanti vicini $K$ usa il K-NN? (c) Qual è il raggio del cerchio di Parzen? (d) Quanto vale $N \cdot V$ per Parzen? (e) In Parzen quale quantità è casuale, cioè dipende da dove cadono i campioni? Rispondi 1 per $K$, 2 per $V$. (f) E nel K-NN?`,
        answers: [
          risposta('(a) V di Parzen', V, tol(V, 0.005, 0.0005)),
          risposta('(b) K del K-NN', m, 0.1),
          risposta('(c) raggio del cerchio di Parzen', r, tol(r, 0.005, 0.0005)),
          risposta('(d) N·V', m, 0.01),
          risposta('(e) casuale in Parzen (1 = K, 2 = V)', 1, 0.1),
          risposta('(f) casuale nel K-NN (1 = K, 2 = V)', 2, 0.1),
        ],
        solution: md`**(a)** $V = \frac{1}{\sqrt{N}} = \frac{1}{\sqrt{${N}}} = \frac{1}{${m}} = ${f(V, 4)}$.

**(b)** $K = \sqrt{N} = \sqrt{${N}} = ${m}$.

**(c)** In 2-D il volume è l'area del cerchio: $\pi r^2 = V$, quindi $r = \sqrt{V/\pi} = \sqrt{${f(V, 4)}/\pi} = ${f(r, 4)}$.

**(d)** $N \cdot V = \frac{N}{\sqrt{N}} = \sqrt{N} = ${m}$: è il numero atteso di campioni nel cerchio se la densità vale 1 (quadrato unitario uniforme), perché qui il cerchio sta tutto dentro il quadrato ($r = ${f(r, 3)} \le 0.5$). Con $N = 1$ non varrebbe: il cerchio di area 1 ha raggio $0.564$ ed esce dal quadrato. La legge dà $V_N \to 0$ e $N V_N \to +\infty$: le due condizioni di consistenza di Parzen.

**(e)** In Parzen il cerchio è fissato prima di guardare i dati: è casuale il numero $K$ di campioni che ci cadono dentro, e può anche essere 0 (stima nulla).

**(f)** Nel K-NN è fissato $K$: il cerchio si allarga fino al $K$-esimo vicino, quindi è casuale il volume $V$. La stima non è mai nulla.

Le cinque colonne della figura:

| $N$ | $V = 1/\sqrt{N}$ | $K = \sqrt{N}$ |
|---|---|---|
${colonne}

In entrambe le righe la regione si restringe al crescere di $N$, mentre i campioni che contiene aumentano. Con densità vera $p$ nel centro, la cella K-NN vale circa $V_K \simeq \frac{K}{N\,p} = \frac{1}{\sqrt{N}\,p}$: nel quadrato uniforme ($p = 1$) è proprio il volume di Parzen, altrove si adatta alla densità locale. Nel disegno della slide, attenzione: a ridursi come $1/\sqrt{N}$ è il raggio dei cerchi di Parzen, non l'area. La legge da ricordare è quella scritta, sul volume.`,
      }
    },
  },
  {
    id: 'es06',
    title: 'Disegnare la stima K-NN e spiegare overfit e oversmooth',
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c44', 'c45', 'c46', 'c47', 'c48'],
    generate: (rng) => {
      const N = rng.pick([6, 7, 8])
      let xs = campioni1d(rng, N, 0, 8, 0.2)
      const Kp = 2
      let Kg = rng.pick([4, 5])
      // con due gruppi della stessa larghezza minima i picchi più alti sarebbero due: si rigenerano i campioni
      for (let t = 0; t < 50 && !(piccoUnico(xs, Kp) && piccoUnico(xs, Kg)); t++) {
        xs = campioni1d(rng, N, 0, 8, 0.2)
        Kg = rng.pick([4, 5])
      }
      const sp = struttura(xs, Kp)
      const sg = struttura(xs, Kg)
      const max = (cs: Cuspide[]) => cs.reduce((b, c) => (c.altezza > b.altezza + 1e-12 ? c : b), cs[0])
      const mp = max(sp.cuspidi)
      const mg = max(sg.cuspidi)
      const tab = (cs: Cuspide[]) =>
        cs.map((c) => md`| $[${f(c.sx, 1)},\ ${f(c.dx, 1)}]$ | $${f(c.larghezza, 1)}$ | $${f(c.pos, 2)}$ | $${f(c.altezza, 3)}$ |`).join('\n')
      const radice = Math.sqrt(N)
      return {
        prompt: md`Un sensore di vibrazione ha registrato $N = ${N}$ letture (in mm/s):

$$\{${elenco(xs, 1)}\}$$

Disegna a mano la stima K-NN in 1-D con $K = ${Kp}$ e con $K = ${Kg}$: dove cadono i picchi, dove sono i punti angolosi, come vanno le code. Per ciascun $K$ trova la posizione e l'altezza del picco più alto e il numero di picchi. Poi spiega che cosa vogliono dire *overfit* e *oversmooth* e come sceglieresti $K$.`,
        answers: [
          risposta(md`posizione del picco più alto, $K = ${Kp}$`, mp.pos, 0.006),
          risposta(md`altezza del picco più alto, $K = ${Kp}$`, mp.altezza, tol(mp.altezza, 0.01, 0.002)),
          risposta(md`numero di picchi, $K = ${Kp}$`, sp.cuspidi.length, 0.1),
          risposta(md`posizione del picco più alto, $K = ${Kg}$`, mg.pos, 0.006),
          risposta(md`altezza del picco più alto, $K = ${Kg}$`, mg.altezza, tol(mg.altezza, 0.01, 0.002)),
          risposta(md`numero di picchi, $K = ${Kg}$`, sg.cuspidi.length, 0.1),
        ],
        solution: md`**La forma della stima.** In 1-D la cella è un intervallo che arriva al $K$-esimo vicino: $\hat{p}(x) = \frac{K}{2N\,r_K(x)}$. I $K$ vicini di $x$ sono sempre $K$ campioni consecutivi; la stima ha un picco (cuspide) nel punto medio di ogni gruppo di $K$ campioni consecutivi, alto $\frac{K}{N \cdot \text{larghezza del gruppo}}$, quindi $N - K + 1$ picchi. I minimi angolosi cadono nei punti medi tra il campione che esce dalla cella e quello che entra. I passaggi sono nella dimostrazione [«forma 1-D della stima K-NN»](#derivation:der04).

**$K = ${Kp}$.** ${sp.cuspidi.length} picchi:

| gruppo | larghezza | picco in | altezza |
|---|---|---|---|
${tab(sp.cuspidi)}

Il più alto sta sopra la coppia più stretta: in $${f(mp.pos, 2)}$, alto $\frac{${Kp}}{${N} \cdot ${f(mp.larghezza, 1)}} = ${f(mp.altezza, 3)}$.

**$K = ${Kg}$.** ${sg.cuspidi.length} picchi:

| gruppo | larghezza | picco in | altezza |
|---|---|---|---|
${tab(sg.cuspidi)}

Il più alto sta in $${f(mg.pos, 2)}$, alto $${f(mg.altezza, 3)}$.

**Il disegno.** Tra un punto angoloso e il successivo la curva è un ramo di iperbole. I punti angolosi cadono tra i campioni, non sopra: è la nota della slide 48. Le code scendono come $\frac{K}{2N\vert x \vert}$ e non toccano mai lo zero.

**Overfit.** Con $K = ${Kp}$ la cella è minuscola: la stima ha molti picchi alti e stretti, segue ogni fluttuazione dei campioni e cambierebbe molto con un altro campione di letture. È l'*overfitting*: alta varianza, sensibilità al rumore.

**Oversmooth.** Con $K = ${Kg}$ ogni cella abbraccia buona parte dei dati: meno picchi, più bassi e più larghi, e la struttura locale sparisce. È l'*oversmoothing* (*underfitting*): alto bias, perdita di risoluzione.

**Come scelgo $K$.** $K$ è un iperparametro: bilancia bias e varianza. Lo lego a $N$ con una legge consistente come $K = \sqrt{N}$ (qui $\sqrt{${N}} \approx ${f(radice, 2)}$, quindi $K \approx ${Math.round(radice)}$), oppure lo scelgo con una procedura di validazione.`,
      }
    },
  },
  {
    id: 'es07',
    title: 'Differenze tra K-NN e Parzen',
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c26', 'c27', 'c28', 'c29', 'c30', 'c31', 'c63'],
    generate: (rng) => {
      const N = 16
      const c = rng.float(1, 1.6, 1)
      const nd = rng.int(10, 12)
      const visti = new Set<string>()
      const xs: number[] = []
      const aggiungi = (v: number) => {
        let w = Math.min(4, Math.max(0, Number(v.toFixed(2))))
        while (visti.has(w.toFixed(2))) w = Number((w + 0.01).toFixed(2))
        visti.add(w.toFixed(2))
        xs.push(w)
      }
      for (let i = 0; i < nd; i++) aggiungi(rng.normal(c, 0.3))
      for (let i = nd; i < N; i++) aggiungi(rng.float(2.2, 4, 2))
      xs.sort((a, b) => a - b)
      const xd = c
      // punto rado: centro del buco più largo tra campioni consecutivi oltre 1.9
      let xr = 3.9
      let buco = -1
      for (let i = 0; i + 1 < N; i++) {
        if (xs[i] >= 1.9 && xs[i + 1] - xs[i] > buco) {
          buco = xs[i + 1] - xs[i]
          xr = Number(((xs[i] + xs[i + 1]) / 2).toFixed(2))
        }
      }
      const V = 1 / Math.sqrt(N)
      const K = Math.sqrt(N)
      const parzen = (x: number) => xs.filter((v) => Math.abs(v - x) <= V / 2).length
      const Kd = parzen(xd)
      const Kr = parzen(xr)
      const pPd = Kd / (N * V)
      const pPr = Kr / (N * V)
      const rd = rK(xs, xd, K)
      const rr = rK(xs, xr, K)
      const pKd = K / (N * 2 * rd)
      const pKr = K / (N * 2 * rr)
      return {
        prompt: md`Un sensore di temperatura normalizzata (scala da 0 a 4) ha registrato $N = 16$ valori:

$$\{${elenco(xs, 2)}\}$$

Usa le leggi della figura della slide 46: per Parzen $V = 1/\sqrt{N}$, per il K-NN $K = \sqrt{N}$. Stima la densità nel punto $x_1 = ${f(xd, 2)}$ (zona densa) e nel punto $x_2 = ${f(xr, 2)}$ (zona rada) con i due metodi. Quanti campioni conta Parzen in $x_1$? Poi spiega che cosa è fissato e che cosa è calcolato in ciascun metodo, come si comportano in zona densa e rada, vantaggi e svantaggi, e se convergono alla pdf vera.`,
        answers: [
          risposta(md`$K$ contato da Parzen in $x_1$`, Kd, 0.1),
          risposta(md`Parzen in $x_1$`, pPd, tol(pPd, 0.01, 0.002)),
          risposta(md`K-NN in $x_1$`, pKd, tol(pKd, 0.01, 0.002)),
          risposta(md`Parzen in $x_2$`, pPr, tol(pPr, 0.01, 0.002)),
          risposta(md`K-NN in $x_2$`, pKr, tol(pKr, 0.01, 0.002)),
        ],
        solution: md`**Formula comune.** Entrambi partono da $\hat{p}(x^*) = \frac{K}{NV}$; cambia quale dei due parametri fisso.

**Parzen: fisso $V = 1/\sqrt{16} = 0.25$, conto $K$.** L'intervallo è largo $0.25$ e centrato nel punto.

- In $x_1 = ${f(xd, 2)}$ la finestra $[${f(xd - V / 2, 3)},\ ${f(xd + V / 2, 3)}]$ contiene $${Kd}$ campioni: $\hat{p} = \frac{${Kd}}{16 \cdot 0.25} = ${f(pPd, 4)}$.
- In $x_2 = ${f(xr, 2)}$ la finestra $[${f(xr - V / 2, 3)},\ ${f(xr + V / 2, 3)}]$ contiene $${Kr}$ campioni: $\hat{p} = ${f(pPr, 4)}$.${Kr === 0 ? ' Dove non cade nessun campione la stima di Parzen con finestra rettangolare vale zero.' : ''}

**K-NN: fisso $K = \sqrt{16} = 4$, misuro $V$.** L'intervallo si allarga fino al 4° vicino.

- In $x_1$: $r_4 = ${f(rd, 3)}$, $V = ${f(2 * rd, 3)}$, $\hat{p} = \frac{4}{16 \cdot ${f(2 * rd, 3)}} = ${f(pKd, 4)}$.
- In $x_2$: $r_4 = ${f(rr, 3)}$, $V = ${f(2 * rr, 3)}$, $\hat{p} = ${f(pKr, 4)}$: la cella si allarga dove i dati sono radi, e la stima non si annulla mai.

**Fissato e calcolato.** Parzen fissa la regione (quindi $V$, cioè $h$) e calcola $K$ dai campioni; il K-NN fissa $K$ e calcola il volume che serve a raccoglierli. L'iperparametro da scegliere è $h$ nel primo caso, $K$ nel secondo.

**Vantaggi e svantaggi (dalle note).** Il K-NN si adatta alle variazioni locali di densità, ma la scelta di $K$ è cruciale; dà stime spigolose con code pesanti. Parzen con un kernel liscio dà stime lisce e meno sensibili al rumore, ma dipende dalla larghezza della finestra: troppo piccola porta a *overfitting*, troppo grande a *oversmoothing*.

**Convergenza.** Nella figura entrambe le regioni si restringono al crescere di $N$ mentre i campioni al loro interno aumentano: i due metodi convergono alla pdf vera nei punti di continuità. Il loro comportamento a campione finito, però, è difficile da prevedere.`,
      }
    },
  },
  {
    id: 'es08',
    title: 'Dimostrare la formula madre',
    difficulty: 2,
    kind: 'dimostrazione',
    concepts: ['c16', 'c17', 'c20', 'c21', 'c22', 'c23', 'c24'],
    generate: (rng) => {
      const mu = rng.pick([4, 5, 6])
      const sigma = rng.pick([0.5, 0.8, 1, 1.2])
      const c = rng.pick([0, 0.5, 1.5])
      const x = Number((mu + c * sigma).toFixed(2))
      const V = Number((sigma * rng.pick([0.25, 0.5, 1, 1.5])).toFixed(2))
      const PR = simpson((t) => gauss(t, mu, sigma), x - V / 2, x + V / 2)
      const px = gauss(x, mu, sigma)
      const pV = px * V
      const rapporto = PR / pV
      const N = rng.pick([200, 500, 1000])
      const EK = N * PR
      const concava = c < 1
      return {
        prompt: md`**Parte 1.** Ricava la stima $\hat{p}(\mathbf{x}^*) = \frac{K}{NV}$ partendo dalla definizione di $P_R$ come integrale della pdf su una regione $R$ che contiene $\mathbf{x}^*$. Enuncia le ipotesi, introduci la frequenza relativa, scrivi il limite della legge dei grandi numeri e discuti le due osservazioni sulla dimensione di $R$.

**Parte 2.** La luminosità dei salmoni segue una gaussiana di media $${mu}$ e deviazione standard $${f(sigma)}$. Prendi $x^* = ${f(x, 2)}$ e l'intervallo $R$ centrato in $x^*$ largo $V = ${f(V, 2)}$. Calcola la probabilità esatta $P_R$ (con un integrale numerico o con la funzione di ripartizione), il valore approssimato $p(x^*)\,V$, il rapporto $P_R / (p(x^*)V)$ e il numero atteso di campioni in $R$ su $N = ${N}$ salmoni.`,
        answers: [
          risposta(md`$P_R$ esatta`, PR, tol(PR, 0.01, 0.0005)),
          risposta(md`$p(x^*)\,V$`, pV, tol(pV, 0.01, 0.0005)),
          risposta(md`rapporto $P_R/(p(x^*)V)$`, rapporto, 0.005),
          risposta(md`$E\{K\}$`, EK, tol(EK, 0.01, 0.1)),
        ],
        solution: md`**1. Probabilità della regione.** Per definizione di pdf

$$P_R = P\{\mathbf{x} \in R\} = \int_R p(\mathbf{x})\,d\mathbf{x}$$

**2. Ipotesi.** La pdf vera $p(\mathbf{x})$ è continua e $R$ è abbastanza piccola perché $p$ non vari in modo significativo al suo interno. Allora $p(\mathbf{x}) \simeq p(\mathbf{x}^*)$ esce dall'integrale e resta il volume:

$$\int_R p(\mathbf{x})\,d\mathbf{x} \simeq p(\mathbf{x}^*)\int_R d\mathbf{x} = p(\mathbf{x}^*)\,V$$

La slide scrive «=»: in rigore, per il teorema della media integrale esiste $\boldsymbol{\xi} \in R$ con $P_R = p(\boldsymbol{\xi})\,V$, e l'ipotesi di regione piccola serve a sostituire $\boldsymbol{\xi}$ con $\mathbf{x}^*$.

**3. Frequenza relativa.** $K$ degli $N$ campioni di training (i.i.d., estratti da $p$) cadono in $R$. Stimo

$$\hat{P}_R = \frac{K}{N}, \qquad \lim_{N\to+\infty} P\{\vert\hat{P}_R - P_R\vert < \delta\} = 1 \quad \forall\delta > 0$$

Il limite è la legge dei grandi numeri: la stima è consistente. I passaggi con la binomiale e la disuguaglianza di Chebyshev sono nella dimostrazione [«perché K/N è consistente»](#derivation:der06).

**4. Uguaglio e divido per $V$.** $p(\mathbf{x}^*)\,V \simeq \hat{P}_R = K/N$, quindi

$$\hat{p}(\mathbf{x}^*) = \frac{\hat{P}_R}{V} = \frac{K}{NV}$$

**5. Le due osservazioni.** $R$ deve essere abbastanza grande da contenere molti campioni, altrimenti $K/N$ è rumorosa (varianza). Deve anche essere abbastanza piccola da limitare la variabilità di $p$ al suo interno, altrimenti la stima diventa una media della pdf su una zona larga (bias). Le due richieste tirano in versi opposti: K-NN e Parzen le conciliano facendo dipendere la regione da $N$.

**Parte 2.** $p(x^*) = ${f(px, 4)}$ e, integrando la gaussiana su $[${f(x - V / 2, 3)},\ ${f(x + V / 2, 3)}]$,

$$P_R = ${f(PR, 4)}, \qquad p(x^*)\,V = ${f(px, 4)} \cdot ${f(V, 2)} = ${f(pV, 4)}, \qquad \frac{P_R}{p(x^*)V} = ${f(rapporto, 3)}$$

${concava ? md`Qui $x^*$ sta nella parte concava della campana (entro una deviazione standard dalla media): la pdf nella regione è in media più bassa che in $x^*$, e il rapporto scende sotto 1.` : md`Qui $x^*$ sta nella coda convessa (oltre una deviazione standard dalla media): la pdf nella regione è in media più alta che in $x^*$, e il rapporto sale sopra 1.`} L'errore cresce con $V^2$: stringere $R$ lo riduce. Su $N = ${N}$ salmoni mi aspetto $E\{K\} = N\,P_R = ${f(EK, 1)}$ campioni nella regione: se sono pochi, $K/N$ oscilla molto. Lo scarto relativo tipico è circa $1/\sqrt{E\{K\}} = ${f(1 / Math.sqrt(EK), 3)}$.`,
      }
    },
  },
  {
    id: 'es09',
    title: 'Dove cadono i punti angolosi?',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c48', 'c49'],
    generate: (rng) => {
      let xs: number[] = []
      let K = 2
      for (let t = 0; t < 50; t++) {
        const N = rng.pick([4, 5])
        K = rng.pick([2, 3])
        xs = campioni1d(rng, N, 0, 5, 0.1)
        const s = struttura(xs, K)
        const punti = [...s.cuspidi.map((q) => q.pos), ...s.angoli.map((q) => q.pos)]
        // nessun punto angoloso sopra un campione, e una sola cuspide più alta (niente parità di larghezza)
        if (punti.every((q) => xs.every((xk) => Math.abs(q - xk) > 1e-9)) && piccoUnico(xs, K)) break
      }
      const N = xs.length
      const { cuspidi, angoli } = struttura(xs, K)
      const alta = cuspidi.reduce((b, q) => (q.altezza > b.altezza + 1e-12 ? q : b), cuspidi[0])
      const primo = angoli[0]
      const tabC = cuspidi
        .map((q) => md`| $[${f(q.sx, 1)},\ ${f(q.dx, 1)}]$ | $${f(q.larghezza, 1)}$ | $${f(q.pos, 2)}$ | $\frac{${K}}{${N} \cdot ${f(q.larghezza, 1)}} = ${f(q.altezza, 4)}$ |`)
        .join('\n')
      const tabA = angoli
        .map((q) => md`| $${f(q.esce, 1)}$ | $${f(q.entra, 1)}$ | $${f(q.pos, 2)}$ | $${f(q.valore, 4)}$ |`)
        .join('\n')
      return {
        prompt: md`Hai $N = ${N}$ misure di lunghezza (in dm) di spigole, già ordinate: $\{${elenco(xs, 1)}\}$. Con la stima K-NN in 1-D e $K = ${K}$ trova (a) il numero di cuspidi, (b) la posizione e (c) l'altezza della cuspide più alta, (d) la posizione del primo minimo angoloso da sinistra e (e) il valore della stima in quel punto. Verifica che nessun punto angoloso coincide con un campione.`,
        answers: [
          risposta('(a) numero di cuspidi', cuspidi.length, 0.1),
          risposta('(b) posizione della cuspide più alta', alta.pos, 0.006),
          risposta('(c) altezza della cuspide più alta', alta.altezza, tol(alta.altezza, 0.01, 0.002)),
          risposta('(d) posizione del primo minimo angoloso', primo.pos, 0.006),
          risposta('(e) stima nel primo minimo angoloso', primo.valore, tol(primo.valore, 0.01, 0.002)),
        ],
        solution: md`**Regola.** $\hat{p}(x) = \frac{K}{2N\,r_K(x)}$ e i $K$ vicini di $x$ sono sempre $K$ campioni consecutivi $x_{(i)}, \dots, x_{(i+K-1)}$, con $r_K(x) = \max\{x - x_{(i)},\ x_{(i+K-1)} - x\}$.

- Cuspide (massimo locale) quando $x$ è equidistante dagli estremi del gruppo: $x = \frac{x_{(i)} + x_{(i+K-1)}}{2}$, dove la stima vale $\frac{K}{N\,(x_{(i+K-1)} - x_{(i)})}$.
- Minimo angoloso quando il gruppo scorre di un posto, cioè quando $x$ è equidistante dal campione che esce e da quello che entra: $x = \frac{x_{(i)} + x_{(i+K)}}{2}$, dove $r_K = \frac{x_{(i+K)} - x_{(i)}}{2}$.

**Cuspidi** ($N - K + 1 = ${cuspidi.length}$, una per gruppo di ${K} campioni consecutivi):

| gruppo | larghezza | cuspide in | altezza |
|---|---|---|---|
${tabC}

La più alta è in $${f(alta.pos, 2)}$, sopra il gruppo più stretto, alta $${f(alta.altezza, 4)}$.

**Minimi angolosi** ($N - K = ${angoli.length}$):

| esce | entra | angolo in | stima |
|---|---|---|---|
${tabA}

Il primo è in $${f(primo.pos, 2)}$, dove la stima vale $\frac{${K}}{${N} \cdot ${f(primo.entra - primo.esce, 1)}} = ${f(primo.valore, 4)}$.

**Controllo.** Nessuna delle posizioni trovate coincide con un campione $\{${elenco(xs, 1)}\}$: i punti angolosi sono punti medi tra campioni. È la nota della slide 48, «the discontinuities in the slopes generally occur away from the positions of the points themselves». A saltare è la pendenza, che passa da $+\frac{K}{2N\,r_K^2}$ a $-\frac{K}{2N\,r_K^2}$; la stima resta continua.`,
      }
    },
  },
  {
    id: 'es10',
    title: 'Funzione finestra e conteggio in un ipercubo',
    difficulty: 1,
    kind: 'numerico',
    concepts: ['c59', 'c60', 'c61', 'c62'],
    generate: (rng) => {
      const n = rng.pick([1, 2])
      const h = rng.pick([0.6, 0.8, 1, 1.2, 1.6, 2])
      const xq = Array.from({ length: n }, () => Number((rng.float(2.5, 6, 1) + 0.05).toFixed(2)))
      const M = rng.int(5, 8)
      const campioni = Array.from({ length: M }, () => xq.map((c) => Number((c + rng.float(-1.2 * h, 1.2 * h)).toFixed(1))))
      const us = campioni.map((xk) => xk.map((v, j) => (v - xq[j]) / h))
      const gam = us.map((u) => (u.every((uj) => Math.abs(uj) <= 0.5) ? 1 : 0))
      const K = gam.reduce<number>((s, g) => s + g, 0)
      const V = h ** n
      const p = K / (M * V)
      const vettore = (v: number[], d: number) => (n === 1 ? f(v[0], d) : `(${v.map((x) => f(x, d)).join(',\\ ')})`)
      const righe = campioni
        .map((xk, k) => md`| ${k + 1} | $${vettore(xk, 1)}$ | $${vettore(us[k], 3)}$ | $${gam[k]}$ |`)
        .join('\n')
      const scena = n === 1 ? 'temperature in °C di un magazzino' : 'luminosità e larghezza di alcuni salmoni'
      const centro = n === 1 ? 'x^*' : '\\mathbf{x}^*'
      return {
        prompt: md`Hai $N = ${M}$ campioni di training in $n = ${n}$ ${n === 1 ? 'dimensione' : 'dimensioni'} (${scena}):

$$${campioni.map((xk) => vettore(xk, 1)).join(',\\quad ')}$$

Usa la finestra a ipercubo di spigolo $h = ${f(h)}$ centrata in $${centro} = ${vettore(xq, 2)}$. Per ogni campione calcola l'argomento $\frac{\mathbf{x}_k - \mathbf{x}^*}{h}$ e il valore della funzione finestra $\gamma$. Quanti campioni cadono nell'ipercubo, quanto vale il volume $V$ e quanto vale la stima $\hat{p}(\mathbf{x}^*)$?`,
        answers: [
          risposta(md`$K$`, K, 0.1),
          risposta(md`$V = h^n$`, V, tol(V, 0.005, 0.001)),
          risposta(md`$\hat{p}(\mathbf{x}^*)$`, p, tol(p, 0.01, 0.002)),
        ],
        solution: md`**1. Funzione finestra.** Con l'ipercubo di lato 1 centrato nell'origine

$$\gamma(\mathbf{u}) = \begin{cases} 1, & \vert u_j \vert \le \frac{1}{2}, \quad j = 1, \dots, n \\ 0, & \text{altrimenti} \end{cases}$$

Il campione $\mathbf{x}_k$ appartiene alla regione se $\gamma\left(\frac{\mathbf{x}_k - \mathbf{x}^*}{h}\right) = 1$: sottrarre $\mathbf{x}^*$ centra il cubo nell'origine, dividere per $h$ lo riporta a lato 1. In pratica ogni coordinata di $\mathbf{x}_k$ deve distare da quella di $\mathbf{x}^*$ al più $h/2 = ${f(h / 2)}$.

**2. Argomenti e valori.**

| $k$ | $\mathbf{x}_k$ | $(\mathbf{x}_k - \mathbf{x}^*)/h$ | $\gamma$ |
|---|---|---|---|
${righe}

**3. Conteggio.** $K = \sum_{k=1}^{N} \gamma\left(\frac{\mathbf{x}_k - \mathbf{x}^*}{h}\right) = ${K}$.${n === 2 ? ' In 2-D basta una coordinata fuori per escludere il campione.' : ''}

**4. Stima.** $V = h^n = ${f(h)}^{${n}} = ${f(V, 4)}$ e

$$\hat{p}(\mathbf{x}^*) = \frac{K}{NV} = \frac{${K}}{${M} \cdot ${f(V, 4)}} = ${f(p, 4)}$$

È ancora la formula $K/(NV)$: Parzen fissa la regione e conta i campioni. Siccome $\gamma$ è pari, «$\mathbf{x}_k$ sta nel cubo centrato in $\mathbf{x}^*$» equivale a «$\mathbf{x}^*$ sta nel cubo centrato in $\mathbf{x}_k$»: la stessa somma si legge come una finestra attorno a ogni campione.`,
      }
    },
  },
  {
    id: 'es11',
    title: 'Quando ML e Bayes coincidono e quale scegliere',
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c01', 'c02', 'c03', 'c04', 'c05', 'c06'],
    generate: (rng) => {
      const sigma = rng.pick([1, 2, 3])
      const s0 = rng.pick([0.5, 1, 2, 4])
      const mu0 = rng.pick([18, 20, 22])
      const X = Number((mu0 + rng.pick([-1, 1]) * rng.float(1, 3, 1)).toFixed(1))
      const N = rng.pick([2, 4, 5, 10])
      const den = N * s0 * s0 + sigma * sigma
      const muN = ((N * s0 * s0) / den) * X + ((sigma * sigma) / den) * mu0
      const sN2 = (s0 * s0 * sigma * sigma) / den
      const gap = ((sigma * sigma) / den) * Math.abs(X - mu0)
      const den10 = 10 * N * s0 * s0 + sigma * sigma
      const gap10 = ((sigma * sigma) / den10) * Math.abs(X - mu0)
      const peso = (N * s0 * s0) / den
      return {
        prompt: md`Un sensore di temperatura ha rumore gaussiano noto, $\sigma = ${sigma}$ °C. La scheda tecnica suggerisce che la temperatura media vera stia attorno a $\mu_0 = ${mu0}$ °C, con incertezza $\sigma_0 = ${f(s0)}$ °C (prior gaussiano). Su $N = ${N}$ letture la media campionaria vale $\bar{X} = ${f(X, 1)}$ °C.

(a) Qual è la stima ML della media? (b) Qual è la media a posteriori $\mu_N$? (c) Quanto distano le due stime? (d) Quanto distano se le letture diventano $${10 * N}$ con la stessa media campionaria? (e) Quanto vale $\sigma_N^2$? Dai le distanze con almeno tre cifre significative, calcolandole con la formula e non sottraendo valori arrotondati. Poi rispondi alla domanda d'esame: in quali casi ML e Bayes coincidono, perché in pratica si preferisce spesso ML, che cosa offre in più Bayes?`,
        answers: [
          risposta(md`(a) $\hat{\mu}_{ML}$`, X, 0.01),
          risposta(md`(b) $\mu_N$`, muN, 0.005),
          risposta(md`(c) $\vert\bar{X} - \mu_N\vert$`, gap, tol(gap, 0.01, 0.002)),
          risposta(md`(d) distanza con $10N$ letture`, gap10, tol(gap10, 0.02, 0.001)),
          risposta(md`(e) $\sigma_N^2$`, sN2, tol(sN2, 0.01, 0.001)),
        ],
        solution: md`**(a)** Per la gaussiana la stima ML della media è la media campionaria: $\hat{\mu}_{ML} = \bar{X} = ${f(X, 1)}$.

**(b)** Con prior $N(\mu_0, \sigma_0^2)$ la posterior è gaussiana con (slide 37 del Cap. 2)

$$\mu_N = \left(\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}\right)\bar{X} + \left(\frac{\sigma^2}{N\sigma_0^2+\sigma^2}\right)\mu_0, \qquad \sigma_N^2 = \frac{\sigma_0^2\,\sigma^2}{N\sigma_0^2+\sigma^2}$$

Qui $N\sigma_0^2 + \sigma^2 = ${f(den, 3)}$ e il peso dei dati vale $${f(peso, 4)}$: $\mu_N = ${f(peso, 4)} \cdot ${f(X, 1)} + ${f(1 - peso, 4)} \cdot ${mu0} = ${f(muN, 3)}$.

**(c)** $\bar{X} - \mu_N = \frac{\sigma^2}{N\sigma_0^2+\sigma^2}(\bar{X} - \mu_0)$, quindi la distanza vale $\frac{${sigma * sigma}}{${f(den, 3)}} \cdot ${f(Math.abs(X - mu0), 1)} = ${sci(gap, 3)}$.

**(d)** Con $${10 * N}$ letture: $\frac{${sigma * sigma}}{${f(den10, 3)}} \cdot ${f(Math.abs(X - mu0), 1)} = ${sci(gap10, 3)}$. La distanza cala circa come $1/N$.

**(e)** $\sigma_N^2 = ${f(sN2, 4)}$: la posterior resta una curva con la sua larghezza. Un intervallo di credibilità al 95% è circa $\mu_N \pm 1.96\,\sigma_N = [${f(muN - 1.96 * Math.sqrt(sN2), 2)},\ ${f(muN + 1.96 * Math.sqrt(sN2), 2)}]$.

**Quando coincidono.**

- Nel limite di infiniti campioni: il peso del prior $\frac{\sigma^2}{N\sigma_0^2+\sigma^2}$ tende a zero, $\mu_N \to \bar{X}$ e $\sigma_N^2 \to 0$; entrambi i metodi convergono al valore vero, sono consistenti. Serve un prior che non escluda il valore vero: con $\sigma_0^2 = 0$ la posterior resta ferma su $\mu_0$.
- Con prior uniforme: $p(\theta) = c$ si semplifica nella regola di Bayes, la posterior è proporzionale alla verosimiglianza e il suo massimo coincide con la stima ML. Nel caso gaussiano è il limite $\sigma_0^2 \to +\infty$, che dà $\mu_N \to \bar{X}$ per ogni $N$. I passaggi sono nella dimostrazione [«quando ML e Bayes coincidono»](#derivation:der10).

**Perché spesso si preferisce ML.** Costa meno calcolo (cerco un massimo invece di integrare intere distribuzioni) e dà una sola stima, facile da interpretare e da usare per una predizione diretta.

**Che cosa offre Bayes.** Incorpora la conoscenza a priori, utile quando i dati sono pochi (qui la scheda tecnica), e quantifica l'incertezza con la posterior intera, per esempio con intervalli di credibilità.`,
      }
    },
  },
  {
    id: 'es12',
    title: 'Classificare con il K-NN',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c64'],
    generate: (rng) => {
      type Etichettato = { p: Punto; cl: 1 | 2; d: number }
      let c1: Punto[] = []
      let c2: Punto[] = []
      let xq: Punto = [0, 0]
      let K = 3
      let tutti: Etichettato[] = []
      for (let t = 0; t < 60; t++) {
        const A: Punto = [rng.float(1.5, 2.5, 1), rng.float(1.5, 2.5, 1)]
        const B: Punto = [Number((A[0] + rng.float(1.5, 2.5, 1)).toFixed(1)), Number((A[1] + rng.float(0.5, 1.5, 1)).toFixed(1))]
        const visti = new Set<string>()
        c1 = puntiAttorno(rng, rng.int(4, 6), A, 1.2, visti)
        c2 = puntiAttorno(rng, rng.int(4, 6), B, 1.2, visti)
        const s = rng.float(0.35, 0.65, 2)
        xq = [
          Number((Number((A[0] + s * (B[0] - A[0])).toFixed(1)) + 0.05).toFixed(2)),
          Number((Number((A[1] + s * (B[1] - A[1])).toFixed(1)) + 0.05).toFixed(2)),
        ]
        K = rng.pick([1, 3, 5, 7])
        tutti = [...c1.map((p) => ({ p, cl: 1 as const })), ...c2.map((p) => ({ p, cl: 2 as const }))]
          .map((o) => ({ ...o, d: Math.hypot(o.p[0] - xq[0], o.p[1] - xq[1]) }))
          .sort((a, b) => a.d - b.d)
        if (K < tutti.length && tutti[K].d - tutti[K - 1].d > 1e-6) break
      }
      const N1 = c1.length
      const N2 = c2.length
      const N = N1 + N2
      const vicini = tutti.slice(0, K)
      const K1 = vicini.filter((o) => o.cl === 1).length
      const K2 = K - K1
      const r = vicini[K - 1].d
      const V = Math.PI * r * r
      const p1 = K1 / (N1 * V)
      const p2 = K2 / (N2 * V)
      const P1 = N1 / N
      const P2 = N2 / N
      const post1 = K1 / K
      const decisione = K1 > K2 ? 1 : 2
      const nome = (cl: 1 | 2) => (cl === 1 ? 'salmone' : 'spigola')
      const elencoCl = [...c1.map((p) => ({ p, cl: 1 as const })), ...c2.map((p) => ({ p, cl: 2 as const }))]
      const tabella = elencoCl.map((o, i) => md`| ${i + 1} | $${coppia(o.p, 1)}$ | ${nome(o.cl)} |`).join('\n')
      const tabVicini = vicini.map((o, i) => md`| ${i + 1} | $${coppia(o.p, 1)}$ | ${nome(o.cl)} | $${f(o.d, 3)}$ |`).join('\n')
      return {
        prompt: md`Pesci di training nel piano (luminosità, larghezza): $N_1 = ${N1}$ salmoni (classe $\omega_1$) e $N_2 = ${N2}$ spigole (classe $\omega_2$).

| $k$ | $\mathbf{x}_k$ | classe |
|---|---|---|
${tabella}

Classifica il pesce $\mathbf{x} = ${coppia(xq)}$ con il K-NN, $K = ${K}$ e cella circolare. Trova (a) quanti dei $K$ vicini sono salmoni, (b) la probabilità a posteriori stimata $\hat{P}(\omega_1 \vert \mathbf{x})$, (c) la densità condizionata stimata $\hat{p}(\mathbf{x} \vert \omega_1)$, (d) la decisione (1 = salmone, 2 = spigola). Mostra che la regola coincide con la regola MAP applicata alle stime K-NN.`,
        answers: [
          risposta(md`(a) $K_1$`, K1, 0.1),
          risposta(md`(b) $\hat{P}(\omega_1 \vert \mathbf{x})$`, post1, 0.005),
          risposta(md`(c) $\hat{p}(\mathbf{x} \vert \omega_1)$`, p1, tol(p1, 0.02, 0.002)),
          risposta('(d) decisione (1 = salmone, 2 = spigola)', decisione, 0.1),
        ],
        solution: md`**1. I $K = ${K}$ vicini.** Allargo il cerchio centrato in $\mathbf{x}$ finché contiene $K$ campioni di qualunque classe:

| ordine | $\mathbf{x}_k$ | classe | distanza |
|---|---|---|---|
${tabVicini}

Il raggio è $r_K = ${f(r, 3)}$ e l'area $V = \pi r_K^2 = ${f(V, 4)}$. Nel cerchio: $K_1 = ${K1}$ salmoni e $K_2 = ${K2}$ spigole.

**2. Densità condizionate** (stessa cella per le due classi):

$$\hat{p}(\mathbf{x} \vert \omega_1) = \frac{K_1}{N_1 V} = \frac{${K1}}{${N1} \cdot ${f(V, 4)}} = ${f(p1, 4)}, \qquad \hat{p}(\mathbf{x} \vert \omega_2) = \frac{K_2}{N_2 V} = ${f(p2, 4)}$$

**3. Prior stimati con le frequenze.** $\hat{P}(\omega_1) = \frac{${N1}}{${N}} = ${f(P1, 4)}$, $\hat{P}(\omega_2) = \frac{${N2}}{${N}} = ${f(P2, 4)}$.

**4. Regola di Bayes.** I prodotti valgono $${f(p1 * P1, 4)}$ e $${f(p2 * P2, 4)}$; la loro somma è $${f(p1 * P1 + p2 * P2, 4)} = \frac{K}{NV}$, la densità non condizionata. Dividendo:

$$\hat{P}(\omega_i \vert \mathbf{x}) = \frac{\frac{K_i}{N_i V}\cdot\frac{N_i}{N}}{\frac{K}{NV}} = \frac{K_i}{K}: \qquad \hat{P}(\omega_1 \vert \mathbf{x}) = \frac{${K1}}{${K}} = ${f(post1, 4)}, \quad \hat{P}(\omega_2 \vert \mathbf{x}) = ${f(1 - post1, 4)}$$

**5. Decisione MAP.** Scelgo la classe con posterior massima, cioè la più rappresentata tra i $K$ vicini: **${nome(decisione)}**. È il voto di maggioranza. Volume e numerosità delle classi si semplificano: conta solo chi sta nel cerchio.

**Ipotesi.** Uso la stessa cella per tutte le classi (così $V$ si semplifica) e stimo i prior con $N_i/N$ (così $N_i$ si semplifica). Con due classi un $K$ dispari evita i pareggi. $K = 1$ è la regola del vicino più prossimo, con un confine di decisione frastagliato; $K = N$ assegna sempre la classe più numerosa del training set.`,
      }
    },
  },
  {
    id: 'es13',
    title: 'Perché e quando usare una stima non parametrica',
    difficulty: 1,
    kind: 'concettuale',
    concepts: ['c07', 'c08', 'c09', 'c10', 'c11', 'c12', 'c13', 'c14'],
    generate: (rng) => {
      const a = rng.float(1.5, 2.5, 1)
      const b = Number((a + rng.pick([4, 4.5, 5])).toFixed(1))
      const n1 = rng.int(5, 7)
      const n2 = rng.int(5, 7)
      const xs = [
        ...Array.from({ length: n1 }, () => Number((a + rng.float(-0.5, 0.5, 1)).toFixed(1))),
        ...Array.from({ length: n2 }, () => Number((b + rng.float(-0.5, 0.5, 1)).toFixed(1))),
      ].sort((u, v) => u - v)
      const N = xs.length
      const m = xs.reduce((s, v) => s + v, 0) / N
      const sd = Math.sqrt(xs.reduce((s, v) => s + (v - m) ** 2, 0) / N)
      const g = 1 / (sd * Math.sqrt(2 * Math.PI))
      const K = xs.filter((v) => Math.abs(v - m) <= 0.5).length
      const p = K / N
      return {
        prompt: md`In un allevamento misuri la lunghezza (dm) di $N = ${N}$ spigole di due annate diverse:

$$\{${elenco(xs, 1)}\}$$

(a) Adatta una gaussiana con ML: quanto valgono la media e la deviazione standard (con $1/N$)? (b) Quanto vale la pdf gaussiana adattata nella sua media? (c) Stima la densità nello stesso punto contando i campioni in un intervallo largo $V = 1$ centrato lì: quanto vale $K/(NV)$?

Poi spiega che cosa vuol dire «non parametrico», in quali due casi serve, quali caratteristiche hanno questi metodi e che prezzo si paga, quali sono i due metodi del corso e la loro idea intuitiva.`,
        answers: [
          risposta('(a) media', m, 0.01),
          risposta('(a) deviazione standard ML', sd, tol(sd, 0.01, 0.005)),
          risposta('(b) pdf gaussiana nella media', g, tol(g, 0.015, 0.002)),
          risposta(md`(c) $K/(NV)$ nella media`, p, 0.01),
        ],
        solution: md`**(a)** $\hat{\mu} = \frac{1}{N}\sum_k x_k = ${f(m, 3)}$ e $\hat{\sigma} = \sqrt{\frac{1}{N}\sum_k (x_k - \hat{\mu})^2} = ${f(sd, 3)}$.

**(b)** Nel suo massimo la gaussiana vale $\frac{1}{\hat{\sigma}\sqrt{2\pi}} = ${f(g, 4)}$.

**(c)** L'intervallo $[${f(m - 0.5, 2)},\ ${f(m + 0.5, 2)}]$ contiene $K = ${K}$ campioni: $\hat{p} = \frac{${K}}{${N} \cdot 1} = ${f(p, 3)}$.

Il modello gaussiano mette il suo picco proprio nella valle tra le due annate, dove non c'è nessun pesce. È il secondo caso della slide 41: il modello parametrico non approssima bene la pdf. Il conteggio locale, che non assume nessuna forma, vede la valle.

**Non parametrico.** I metodi parametrici assumono una forma funzionale (gaussiana, Poisson...) e ne stimano il vettore di parametri $\boldsymbol{\theta}$ con ML o con Bayes. I metodi non parametrici non fissano una forma: stimano direttamente il valore della pdf nei punti di interesse. Non vuol dire «senza parametri da scegliere»: $K$ o la larghezza della finestra vanno scelti.

**Quando serve (slide 41).** (1) Non ho conoscenza a priori sulla forma funzionale della pdf: ho solo i campioni. (2) I modelli parametrici non la approssimano bene, come in questo esempio bimodale.

**Caratteristiche.** Si applicano direttamente alle osservazioni (*data-driven*): i campioni vanno conservati e ogni valutazione li usa tutti. Sono flessibili e catturano strutture complesse, al prezzo di più calcolo e di più dati per stime accurate.

**I due metodi.** K-NN (*K-nearest neighbor*): la densità in un punto dipende da quanto sono vicini i suoi $K$ vicini più prossimi; se sono vicinissimi la densità è alta, se bisogna andare lontano è bassa. Finestre di Parzen (*Parzen windows*): una piccola finestra, spesso un kernel gaussiano, attorno a ogni campione; la densità in un punto è la media dei contributi delle finestre vicine.`,
      }
    },
  },
  {
    id: 'es14',
    title: 'Frequenza relativa, stima della pdf e loro incertezza',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c20', 'c22', 'c65', 'c66'],
    generate: (rng) => {
      const N = rng.int(10, 500) * 10
      const K = rng.int(5, Math.floor(N / 5))
      const V = rng.float(0.05, 1, 2)
      const P = K / N
      const p = P / V
      const sdP = Math.sqrt((P * (1 - P)) / N)
      const sdp = sdP / V
      const rel = sdp / p
      return {
        prompt: md`Su $N = ${intero(N)}$ letture di un sensore di pressione, $K = ${intero(K)}$ cadono in una fascia $R$ larga $V = ${f(V, 2)}$ bar attorno a $x^*$. Calcola la stima di $P_R$, la stima della pdf in $x^*$, la deviazione standard approssimata di entrambe e l'errore relativo della stima della pdf. Confronta l'errore relativo con $1/\sqrt{K}$.`,
        answers: [
          risposta(md`$\hat{P}_R$`, P, tol(P, 0.01, 0.0002)),
          risposta(md`$\hat{p}(x^*)$`, p, tol(p, 0.01, 0.001)),
          risposta(md`deviazione standard di $\hat{P}_R$`, sdP, tol(sdP, 0.02, 0.00005)),
          risposta(md`deviazione standard di $\hat{p}(x^*)$`, sdp, tol(sdp, 0.02, 0.0002)),
          risposta('errore relativo', rel, tol(rel, 0.02, 0.001)),
        ],
        solution: md`**1. Stime.** $\hat{P}_R = \frac{K}{N} = \frac{${intero(K)}}{${intero(N)}} = ${f(P, 5)}$ e $\hat{p}(x^*) = \frac{K}{NV} = \frac{${f(P, 5)}}{${f(V, 2)}} = ${sci(p, 4)}$.

**2. Incertezza di $K/N$.** I campioni sono i.i.d.: ognuno cade in $R$ con probabilità $P_R$, quindi $K$ è binomiale di parametri $N$ e $P_R$, con $E\{\hat{P}_R\} = P_R$ e $\mathrm{var}\{\hat{P}_R\} = \frac{P_R(1 - P_R)}{N}$. Sostituisco la stima al posto di $P_R$:

$$\sqrt{\frac{${f(P, 5)} \cdot ${f(1 - P, 5)}}{${intero(N)}}} = ${sci(sdP, 3)}$$

**3. Incertezza della pdf.** $V$ è fissato, quindi divido per $V$: $${sci(sdP, 3)}/${f(V, 2)} = ${sci(sdp, 3)}$.

**4. Errore relativo.**

$$\frac{${sci(sdp, 3)}}{${sci(p, 4)}} = \sqrt{\frac{1 - P_R}{N P_R}} = ${f(rel, 4)}, \qquad \frac{1}{\sqrt{K}} = \frac{1}{\sqrt{${intero(K)}}} = ${f(1 / Math.sqrt(K), 4)}$$

L'errore relativo dipende quasi solo da quanti campioni cadono nella regione: $\sqrt{(1 - P_R)/K}$, e $1 - P_R = ${f(1 - P, 3)}$ ${P < 0.1 ? 'è vicino a 1' : 'lo rende un po\' più piccolo di $1/\\sqrt{K}$'}. È la versione quantitativa di «$R$ abbastanza grande»: per un errore del 10% servono circa 100 campioni nella regione. Dimezzando $V$ il conteggio atteso si dimezza e l'errore relativo cresce di circa $\sqrt{2}$: meno bias, più varianza.`,
      }
    },
  },
  {
    id: 'es15',
    title: 'Dimostrare che K/N è una stima consistente di P_R',
    difficulty: 3,
    kind: 'dimostrazione',
    concepts: ['c19', 'c20', 'c21', 'c65'],
    generate: (rng) => {
      const P = rng.float(0.1, 0.5, 2)
      const N = rng.pick([100, 200, 500, 1000, 2000])
      const delta = rng.pick([0.02, 0.05, 0.1])
      const eps = rng.pick([0.05, 0.1])
      const varP = (P * (1 - P)) / N
      const bound = varP / (delta * delta)
      const Nmin = Math.ceil((P * (1 - P)) / (eps * delta * delta) - 1e-9)
      return {
        prompt: md`**Parte 1.** Mostra che $K$, il numero di campioni di training che cadono in una regione $R$ fissata, è una variabile binomiale di parametri $N$ e $P_R$. Calcola media e varianza di $K/N$, applica la disuguaglianza di Chebyshev e ricava il limite della slide 43:

$$\lim_{N\to+\infty} P\{\vert\hat{P}_R - P_R\vert < \delta\} = 1 \quad \forall\delta > 0$$

Spiega perché è proprio la definizione di stima consistente e che ruolo ha l'indipendenza dei campioni.

**Parte 2.** Con $P_R = ${f(P, 2)}$, $N = ${N}$ e $\delta = ${f(delta, 2)}$: quanto vale $\mathrm{var}\{\hat{P}_R\}$? Quanto vale il maggiorante di Chebyshev di $P\{\vert\hat{P}_R - P_R\vert \ge \delta\}$? Qual è il più piccolo $N$ che porta il maggiorante a non più di $${f(eps, 2)}$?`,
        answers: [
          risposta(md`$\mathrm{var}\{\hat{P}_R\}$`, varP, tol(varP, 0.01, 1e-7)),
          risposta('maggiorante di Chebyshev', bound, tol(bound, 0.01, 0.001)),
          risposta(md`$N$ minimo`, Nmin, Math.max(1.5, Nmin * 0.005)),
        ],
        solution: md`**1. Indicatrici.** Scrivo $K = \sum_{k=1}^{N} I_k$ con $I_k = 1$ se $\mathbf{x}_k \in R$ e $0$ altrimenti. I campioni sono i.i.d. e $R$ è fissata prima di guardarli, quindi le $I_k$ sono prove di Bernoulli indipendenti con la stessa probabilità di successo $P\{I_k = 1\} = P_R$.

**2. Binomiale.** La somma di $N$ prove di Bernoulli indipendenti con lo stesso parametro è binomiale:

$$P(K = k) = \binom{N}{k} P_R^{k} (1 - P_R)^{N-k}, \qquad E\{K\} = N P_R, \qquad \mathrm{var}\{K\} = N P_R (1 - P_R)$$

**3. Frequenza relativa.** Dividendo per $N$:

$$E\{\hat{P}_R\} = P_R, \qquad \mathrm{var}\{\hat{P}_R\} = \frac{P_R (1 - P_R)}{N}$$

La stima è non distorta e la sua varianza scende come $1/N$.

**4. Chebyshev.** Per una variabile di media $P_R$:

$$P\{\vert\hat{P}_R - P_R\vert \ge \delta\} \le \frac{\mathrm{var}\{\hat{P}_R\}}{\delta^2} = \frac{P_R (1 - P_R)}{N \delta^2}$$

**5. Limite.** Per $N \to +\infty$ il maggiorante tende a zero per ogni $\delta$ fissato, quindi la probabilità dell'evento complementare tende a 1: è il limite della slide 43. Convergere in probabilità al valore vero è la definizione di stima consistente (*consistent estimate*).

**Ruolo dell'indipendenza.** Senza indipendenza la varianza di $K$ non sarebbe $N P_R(1 - P_R)$: letture correlate di un sensore contano come meno campioni «nuovi» e la varianza può non scendere come $1/N$. Anche la regione fissata conta: nel K-NN la cella dipende dai campioni e questo argomento non si applica così com'è.

**Parte 2.** $\mathrm{var}\{\hat{P}_R\} = \frac{${f(P, 2)} \cdot ${f(1 - P, 2)}}{${N}} = ${sci(varP, 4)}$ e il maggiorante vale $\frac{${sci(varP, 4)}}{${f(delta, 2)}^2} = ${f(bound, 4)}$${bound >= 1 ? ': supera 1, quindi con questo $N$ Chebyshev non dice nulla' : ''}. Per portarlo a non più di $${f(eps, 2)}$:

$$N \ge \frac{P_R(1 - P_R)}{\varepsilon\,\delta^2} = \frac{${f(P * (1 - P), 4)}}{${f(eps, 2)} \cdot ${f(delta * delta, 4)}} = ${f((P * (1 - P)) / (eps * delta * delta), 2)} \;\Rightarrow\; N_{\min} = ${intero(Nmin)}$$

Chebyshev è prudente: la probabilità vera di uno scarto così grande è molto più piccola del maggiorante. Per la consistenza basta che il maggiorante vada a zero.`,
      }
    },
  },
  {
    id: 'es16',
    title: 'Bias e varianza della stima a regione fissata',
    difficulty: 3,
    kind: 'dimostrazione',
    concepts: ['c23', 'c24', 'c25', 'c66', 'c68', 'c69'],
    generate: (rng) => {
      const mu = 20
      const sigma = rng.pick([1, 1.5, 2])
      const c = rng.pick([0, 0.5, 1.5, 2])
      const x = mu + c * sigma
      // V almeno pari a sigma: con V = sigma/2 il bias scende sotto 0.001 e l'errore delle tavole della normale
      // (circa 1e-4 su P_R) ne diventa una frazione troppo grande
      const V = Number((sigma * rng.pick([1, 1.5, 2])).toFixed(2))
      const N = rng.pick([50, 100, 200, 500])
      const px = gauss(x, mu, sigma)
      const PR = simpson((t) => gauss(t, mu, sigma), x - V / 2, x + V / 2)
      const E = PR / V
      const bias = E - px
      const sd = Math.sqrt((PR * (1 - PR)) / N) / V
      const Nmin = Math.ceil((PR * (1 - PR)) / (V * V * bias * bias) - 1e-9)
      return {
        prompt: md`**Parte 1.** Con $R$ fissata di volume $V$ e campioni i.i.d., ricava il valore atteso e la varianza di $\hat{p}(\mathbf{x}^*) = K/(NV)$. Interpreta il valore atteso come media spaziale della pdf su $R$ e collega i due risultati alle osservazioni «$R$ enough small» e «$R$ enough large» della slide 44. Concludi con le condizioni $V_N \to 0$ e $N V_N \to +\infty$ e di' come le realizzano Parzen e K-NN.

**Parte 2.** La temperatura di una serra segue una gaussiana di media $20$ °C e deviazione standard $${f(sigma)}$ °C. Stimi la pdf in $x^* = ${f(x, 2)}$ con l'intervallo centrato largo $V = ${f(V, 2)}$ e $N = ${N}$ letture. Calcola $p(x^*)$, $E\{\hat{p}(x^*)\}$, il bias, la deviazione standard della stima e il numero di letture oltre il quale la deviazione standard scende sotto il valore assoluto del bias.`,
        answers: [
          risposta(md`$p(x^*)$`, px, tol(px, 0.01, 0.0002)),
          risposta(md`$E\{\hat{p}(x^*)\}$`, E, tol(E, 0.01, 0.0002)),
          risposta('bias', bias, Math.max(0.0001, Math.abs(bias) * 0.05)),
          risposta('deviazione standard', sd, tol(sd, 0.02, 0.0005)),
          risposta(md`$N$ oltre cui la deviazione standard è minore del bias`, Nmin, Math.max(2, Nmin * 0.1)),
        ],
        solution: md`**1. Valore atteso.** Con $R$ fissata $K$ è binomiale, $E\{K\} = N P_R$:

$$E\{\hat{p}(\mathbf{x}^*)\} = \frac{E\{K\}}{NV} = \frac{P_R}{V} = \frac{1}{V}\int_R p(\mathbf{x})\,d\mathbf{x}$$

È la media spaziale di $p$ su $R$: coincide con $p(\mathbf{x}^*)$ solo se $p$ è costante in $R$, oppure nel limite $V \to 0$ se $p$ è continua. Una regione larga liscia i dettagli: è il bias, e il motivo di «$R$ enough small».

**2. Varianza.**

$$\mathrm{var}\{\hat{p}(\mathbf{x}^*)\} = \frac{\mathrm{var}\{K\}}{N^2 V^2} = \frac{P_R(1 - P_R)}{N V^2} \simeq \frac{p(\mathbf{x}^*)}{N V}$$

Esplode quando $NV$ è piccolo, cioè quando in $R$ cadono pochi campioni: è il motivo di «$R$ enough large». L'errore relativo vale circa $1/\sqrt{E\{K\}}$.

**3. Conclusione.** Per annullare entrambi serve una regione che dipende da $N$: $V_N \to 0$ (bias nullo) e $N V_N \to +\infty$ (varianza nulla, $E\{K_N\} \to +\infty$). Parzen sceglie la legge del volume, per esempio $V_N = 1/\sqrt{N}$, che dà $N V_N = \sqrt{N}$. Il K-NN sceglie $K_N$, per esempio $K_N = \sqrt{N}$, e il volume segue: $V_K \simeq \frac{K_N}{N\,p(\mathbf{x}^*)} = \frac{1}{\sqrt{N}\,p(\mathbf{x}^*)}$. I passaggi sono nella dimostrazione [«bias e varianza di K/(N·V)»](#derivation:der07).

**Parte 2.** $p(x^*) = \frac{1}{${f(sigma)}\sqrt{2\pi}}\exp\left(-\frac{(${f(x, 2)} - 20)^2}{2 \cdot ${f(sigma)}^2}\right) = ${f(px, 5)}$. Integrando la gaussiana su $[${f(x - V / 2, 3)},\ ${f(x + V / 2, 3)}]$ ottengo $P_R = ${f(PR, 5)}$, quindi

$$E\{\hat{p}(x^*)\} = \frac{${f(PR, 5)}}{${f(V, 2)}} = ${f(E, 5)}, \qquad \text{bias} = ${f(E, 5)} - ${f(px, 5)} = ${f(bias, 5)}$$

${bias < 0 ? 'Il bias è negativo: vicino al picco la campana è concava e la media sulla regione sta sotto il valore puntuale.' : 'Il bias è positivo: nella coda la campana è convessa e la media sulla regione sta sopra il valore puntuale.'}

$$\sqrt{\frac{P_R(1 - P_R)}{N V^2}} = \sqrt{\frac{${f(PR, 5)} \cdot ${f(1 - PR, 5)}}{${N} \cdot ${f(V, 2)}^2}} = ${f(sd, 5)}$$

La deviazione standard scende come $1/\sqrt{N}$, il bias no: diventa più piccola del bias quando

$$N > \frac{P_R(1 - P_R)}{V^2\,\text{bias}^2} \;\Rightarrow\; N \approx ${intero(Nmin)}$$

Oltre quel punto altri dati non servono più: domina il bias, e l'unico rimedio è stringere $R$.`,
      }
    },
  },
  {
    id: 'es17',
    title: "Località dell'intorno in alta dimensione",
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c52', 'c67'],
    generate: (rng) => {
      const N = rng.pick([1000, 10000, 100000, 1000000])
      const K = rng.pick([5, 10, 20, 50])
      const s = rng.pick([0.1, 0.2, 0.3, 0.5])
      const q = K / N
      const l = (n: number) => q ** (1 / n)
      const t = Math.log(q) / Math.log(s)
      const nmax = Math.ceil(t - 1e-9) - 1
      const righe = [1, 2, 3, 10, 100].map((n) => md`| $${n}$ | $${sci(l(n), 3)}$ |`).join('\n')
      return {
        prompt: md`Hai $N = ${intero(N)}$ campioni distribuiti uniformemente nell'ipercubo unitario $[0, 1]^n$ e vuoi una stima K-NN con $K = ${K}$. In media, il sottocubo che contiene $K$ campioni ha volume $K/N$, quindi lato $\ell = (K/N)^{1/n}$. Quanto vale $\ell$ per $n = 2$, $n = 10$ e $n = 100$? Qual è la dimensione massima $n$ per cui $\ell$ resta sotto $${f(s, 1)}$? Commenta il risultato.`,
        answers: [
          risposta(md`$\ell$ con $n = 2$`, l(2), tol(l(2), 0.01, 1e-5)),
          risposta(md`$\ell$ con $n = 10$`, l(10), tol(l(10), 0.01, 0.001)),
          risposta(md`$\ell$ con $n = 100$`, l(100), tol(l(100), 0.005, 0.001)),
          risposta(md`$n$ massimo con $\ell < ${f(s, 1)}$`, nmax, 0.1),
        ],
        solution: md`**1. Frazione di volume.** $K/N = ${K}/${intero(N)} = ${sci(q, 3)}$. Con campioni uniformi il sottocubo deve avere volume $\ell^n = K/N$:

| $n$ | $\ell = (K/N)^{1/n}$ |
|---|---|
${righe}

**2. Dimensione massima.** $\ell < s \iff \frac{\ln(K/N)}{n} < \ln s \iff n < \frac{\ln(K/N)}{\ln s} = \frac{${f(Math.log(q), 3)}}{${f(Math.log(s), 3)}} = ${f(t, 3)}$ (dividendo per $\ln s < 0$ il verso si inverte). Quindi $n_{\max} = ${nmax}$.

**Commento.** In 1-D l'intorno dei $K$ vicini è una frazione minuscola dell'asse; in 10 dimensioni il suo lato è ${f(l(10), 2)}, in 100 dimensioni ${f(l(100), 2)}: per catturare $K$ campioni la cella deve coprire quasi tutto l'intervallo lungo ogni asse. La cella non è più «locale» e cade l'ipotesi di pdf quasi costante in $R$. È la nota delle note: «in higher dimensions the volume of the neighborhood grows exponentially», quindi la scelta di $K$ diventa ancora più critica. Anche la forma della cella conta: la frazione del cubo occupata dall'ipersfera inscritta vale $0.785$ in 2-D, $0.524$ in 3-D e circa $0.0025$ in 10-D. È l'effetto Hughes del Cap. 3: a $N$ fisso, aggiungere dimensioni svuota lo spazio e peggiora la stima delle pdf.`,
      }
    },
  },
  {
    id: 'es18',
    title: 'La stima K-NN integra a 1?',
    difficulty: 3,
    kind: 'dimostrazione',
    concepts: ['c50', 'c56', 'c63'],
    generate: (rng) => {
      const x1 = rng.float(0.5, 3.5, 1)
      const eps = rng.pick([0.1, 0.01, 0.001])
      const L = rng.pick([1, 10, 100])
      const aSpillo = Math.log(L / eps)
      const N = rng.pick([9, 16, 25, 100])
      const K = Math.sqrt(N)
      const decade = (K / N) * Math.log(10)
      const fattore = Math.exp(N / K)
      return {
        prompt: md`**Parte 1.** In 1-D con $N = 1$ e $K = 1$ (un solo campione in $x_1 = ${f(x1, 1)}$) mostra che la stima K-NN vale $\hat{p}(x) = \frac{1}{2\vert x - x_1 \vert}$. Quanto vale la sua area sulla zona $${sci(eps)} \le \vert x - x_1 \vert \le ${L}$? Che cosa succede se allarghi la zona?

**Parte 2.** Per $N$ e $K$ qualunque mostra che le code decadono come $\frac{K}{2N\vert x \vert}$. Con $N = ${N}$ e $K = \sqrt{N}$: di quanto cresce l'area sotto le due code a ogni decade (ogni volta che l'intervallo si allarga di un fattore 10)? Di che fattore devi allargare l'intervallo perché le code aggiungano area 1?

**Parte 3.** Quanto vale invece l'area sotto una stima di Parzen con kernel che è una densità?`,
        answers: [
          risposta('(1) area dello spillo', aSpillo, tol(aSpillo, 0.01, 0.01)),
          risposta('(2) area aggiunta per decade', decade, tol(decade, 0.01, 0.002)),
          risposta('(2) fattore per aggiungere area 1', fattore, tol(fattore, 0.02, 0.05)),
          risposta('(3) area della stima di Parzen', 1, 0.001),
        ],
        solution: md`**Parte 1.** Con un solo campione la cella centrata in $x$ deve arrivare a $x_1$: $r_1(x) = \vert x - x_1 \vert$, $V = 2\vert x - x_1 \vert$ e

$$\hat{p}(x) = \frac{K}{NV} = \frac{1}{2\vert x - x_1 \vert}$$

Un asintoto verticale sul campione e due rami che scendono piano: è la prima riga della figura della slide 50. Sulla zona richiesta, per simmetria,

$$2\int_{${sci(eps)}}^{${L}} \frac{dt}{2t} = \ln\frac{${L}}{${sci(eps)}} = ${f(aSpillo, 3)}$$

L'area diverge in entrambe le direzioni: $\ln(L/\varepsilon) \to +\infty$ sia per $\varepsilon \to 0$ (attorno al campione) sia per $L \to +\infty$ (nelle code).

**Parte 2.** Oltre l'ultima cuspide i $K$ vicini sono sempre gli ultimi $K$ campioni e $r_K(x) = x - x_{(N-K+1)}$, quindi

$$\hat{p}(x) = \frac{K}{2N\,(x - x_{(N-K+1)})} \simeq \frac{K}{2N\,\vert x \vert} \quad (\vert x \vert \to \infty)$$

e così a sinistra. Ogni coda aggiunge $\frac{K}{2N}\ln\frac{L}{L_0}$ tra $L_0$ e $L$; le due insieme $\frac{K}{N}\ln\frac{L}{L_0}$. Con $N = ${N}$, $K = ${K}$:

- per decade: $\frac{K}{N}\ln 10 = \frac{${K}}{${N}} \cdot 2.3026 = ${f(decade, 4)}$;
- per aggiungere area 1: $\frac{K}{N}\ln\frac{L}{L_0} = 1 \Rightarrow \frac{L}{L_0} = e^{N/K} = e^{${f(N / K, 2)}} = ${f(fattore, 2)}$.

L'area cresce senza limite, ma in modo logaritmico, cioè lentissimo. La stima K-NN è buona localmente, ma non è una pdf normalizzata.

**Parte 3.** Parzen integra a 1: con $\gamma \ge 0$ di area 1 e $V = h^n$, il cambio di variabile $d\mathbf{x} = h^n d\mathbf{u}$ dà area 1 a ogni termine $\frac{1}{h^n}\gamma\left(\frac{\mathbf{x} - \mathbf{x}_k}{h}\right)$, e la media di $N$ termini ha area 1. È una delle differenze tra i due metodi: Parzen dà una densità legittima, il K-NN no.`,
      }
    },
  },
  {
    id: 'es19',
    title: "Simulazione d'orale: 'do they tend to the optimal solution?'",
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c31', 'c40', 'c42', 'c57', 'c69'],
    generate: (rng) => {
      const n = rng.pick([1, 2, 3])
      const N = rng.pick([100, 256, 400, 10000])
      const K = Math.sqrt(N)
      const h = N ** (-1 / (2 * n))
      const bias = K / (K - 1)
      const dispersione = Math.sqrt((N - K + 1) / (N * (K - 2)))
      return {
        prompt: md`All'orale ti chiedono: «K-NN e Parzen tendono alla soluzione ottima?». Prepara una risposta di 3-4 minuti. Per renderla concreta usa $N = ${intero(N)}$ campioni in $n = ${n}$ ${n === 1 ? 'dimensione' : 'dimensioni'}: calcola $K_N = \sqrt{N}$, $K_N/N$, la larghezza di Parzen $h_N = 1/\sqrt[2n]{N}$ e il prodotto $N h_N^n$. Poi calcola il fattore di bias $K/(K-1)$ e la dispersione relativa $\sqrt{(N - K + 1)/(N(K - 2))}$ della stima K-NN con quel $K$.`,
        answers: [
          risposta(md`$K_N$`, K, 0.1),
          risposta(md`$K_N/N$`, K / N, tol(K / N, 0.01, 1e-5)),
          risposta(md`$h_N$`, h, tol(h, 0.01, 0.0005)),
          risposta(md`$N h_N^n$`, K, tol(K, 0.01, 0.01)),
          risposta('fattore di bias', bias, 0.002),
          risposta('dispersione relativa', dispersione, tol(dispersione, 0.01, 0.002)),
        ],
        solution: md`**I numeri.** $K_N = \sqrt{${intero(N)}} = ${K}$, $K_N/N = ${sci(K / N, 3)}$. Per Parzen $h_N = ${intero(N)}^{-1/${2 * n}} = ${f(h, 4)}$, quindi $V_N = h_N^n = 1/\sqrt{N} = ${sci(1 / K, 3)}$ e $N h_N^n = \sqrt{N} = ${K}$. Bias $\frac{K}{K-1} = ${f(bias, 4)}$ (circa $+${f((bias - 1) * 100, 1)}\%$), dispersione relativa $${f(dispersione, 3)}$.

**Scaletta della risposta.**

1. **Sì, asintoticamente.** Entrambi i metodi convergono alla pdf vera nei punti in cui $p$ è continua (slide 45): sono consistenti.
2. **Le condizioni.** K-NN: $\lim_{N\to+\infty} K_N = +\infty$ e $\lim_{N\to+\infty} K_N/N = 0$, necessarie e sufficienti (slide 47), esempio $K_N = \sqrt{N}$. Parzen: $\lim_{N\to+\infty} h_N = 0$ e $\lim_{N\to+\infty} N h_N^n = +\infty$, esempio $h_N = 1/\sqrt[2n]{N}$, cioè $V_N = 1/\sqrt{N}$ come nella figura della slide 46. In generale: $V_N \to 0$, $K_N \to +\infty$, $K_N/N \to 0$.
3. **Il significato.** Una condizione annulla la varianza (molti campioni nella regione: $K_N \to +\infty$, $N V_N \to +\infty$), l'altra il bias (regione che si stringe: $V_N \to 0$, $K_N/N \to 0$).
4. **Il limite pratico.** Sono risultati asintotici: a campione finito il comportamento è difficile da prevedere e dipende da $K$ o da $h$. Con $N = ${intero(N)}$ la stima K-NN ha ancora un bias di circa $${f((bias - 1) * 100, 1)}\%$ e una dispersione del $${f(dispersione * 100, 0)}\%$. Nella figura della slide 50, con $N = 256$ la stima è ancora rumorosa.
5. **Un dettaglio.** A $N$ finito la stima K-NN non è nemmeno una pdf normalizzata: le code scendono come $1/\vert x \vert$ e l'area è infinita.`,
      }
    },
  },
  {
    id: 'es20',
    title: 'Chi è aleatorio nel K-NN? Bias e dispersione di una stima K-NN',
    difficulty: 3,
    kind: 'dimostrazione',
    concepts: ['c20', 'c40', 'c70'],
    generate: (rng) => {
      const N = rng.pick([50, 100, 256, 500, 1000, 5000])
      const K = rng.int(3, Math.min(50, Math.floor(N / 4)))
      const EP = K / (N + 1)
      const dispP = Math.sqrt((N - K + 1) / (K * (N + 2)))
      const bias = K / (K - 1)
      const disp = Math.sqrt((N - K + 1) / (N * (K - 2)))
      return {
        prompt: md`**Parte 1.** Spiega perché l'argomento binomiale delle slide 43-44 (regione «predefined», $K$ aleatorio) non si applica così com'è al K-NN, dove $K$ è fissato e la cella dipende dai campioni. Mostra che il contenuto di probabilità della cella K-NN, $P_K$, è la $K$-esima statistica d'ordine di $N$ uniformi, quindi $P_K \sim \mathrm{Beta}(K, N - K + 1)$, e leggi le due condizioni della slide 47.

**Parte 2.** Con $N = ${N}$ e $K = ${K}$ calcola $E\{P_K\}$, la dispersione relativa di $P_K$, il fattore di bias della stima K-NN e la sua deviazione standard relativa.`,
        answers: [
          risposta(md`$E\{P_K\}$`, EP, tol(EP, 0.01, 0.0001)),
          risposta(md`dispersione relativa di $P_K$`, dispP, tol(dispP, 0.01, 0.002)),
          risposta(md`fattore di bias $K/(K-1)$`, bias, 0.002),
          risposta('deviazione standard relativa della stima', disp, tol(disp, 0.01, 0.002)),
        ],
        solution: md`**Chi è aleatorio.** Nelle slide 43-44 la regione è fissata prima di guardare i campioni: $K$ è aleatorio (binomiale) e $V$ è un numero. Nel K-NN i ruoli si scambiano: $K$ è deciso a priori, mentre la cella è costruita sui campioni, quindi sono aleatori il suo volume $V_K(\mathbf{x}^*)$ e il suo contenuto di probabilità $P_K$. La binomiale non serve più.

**1. Distanze.** Sia $D_k = \Vert\mathbf{x}_k - \mathbf{x}^*\Vert$ e $G(r) = \int_{\Vert\mathbf{x} - \mathbf{x}^*\Vert \le r} p(\mathbf{x})\,d\mathbf{x}$ la probabilità che un campione cada nella cella di raggio $r$: è la funzione di ripartizione delle distanze, continua perché $p$ è una densità.

**2. Uniformi.** Per la trasformazione integrale di probabilità $U_k = G(D_k)$ è uniforme in $(0, 1)$, e le $U_k$ sono i.i.d. perché lo sono i campioni. Da qui in poi $p$, $\mathbf{x}^*$ e la dimensione $n$ spariscono.

**3. Statistica d'ordine.** La cella arriva al $K$-esimo vicino, cioè alla $K$-esima distanza in ordine crescente $D_{(K)}$; $G$ è crescente, quindi

$$P_K = G(D_{(K)}) = U_{(K)}, \qquad f_{U_{(K)}}(u) = \frac{N!}{(K-1)!\,(N-K)!}\,u^{K-1}(1-u)^{N-K}$$

($K - 1$ campioni sotto $u$, uno in $u$, $N - K$ sopra): è la $\mathrm{Beta}(K, N - K + 1)$.

**4. Momenti.**

$$E\{P_K\} = \frac{K}{N+1} \simeq \frac{K}{N}, \qquad \frac{\sqrt{\mathrm{var}\{P_K\}}}{E\{P_K\}} = \sqrt{\frac{N-K+1}{K\,(N+2)}} \simeq \frac{1}{\sqrt{K}}$$

**5. Le due condizioni.** La dispersione relativa si annulla solo se $K_N \to +\infty$; il contenuto medio tende a zero solo se $K_N/N \to 0$, e allora (dove $p(\mathbf{x}^*) > 0$) anche il volume tende a zero.

**6. Bias e dispersione della stima.** Con cella piccola $P_K \simeq p(\mathbf{x}^*)V_K$, quindi $\hat{p} \simeq p(\mathbf{x}^*)\frac{K/N}{P_K}$. Con $E\{1/P_K\} = \frac{N}{K-1}$ e $E\{1/P_K^2\} = \frac{N(N-1)}{(K-1)(K-2)}$:

$$E\{\hat{p}(\mathbf{x}^*)\} \simeq \frac{K}{K-1}\,p(\mathbf{x}^*), \qquad \frac{\mathrm{var}\{\hat{p}\}}{E\{\hat{p}\}^2} \simeq \frac{N-K+1}{N\,(K-2)}$$

I passaggi completi sono nella dimostrazione [«il contenuto della cella è una variabile Beta»](#derivation:der09).

**Parte 2.** Con $N = ${N}$ e $K = ${K}$:

- $E\{P_K\} = \frac{${K}}{${N + 1}} = ${f(EP, 5)}$;
- dispersione relativa di $P_K$: $\sqrt{\frac{${N - K + 1}}{${K} \cdot ${N + 2}}} = ${f(dispP, 4)}$ (contro $1/\sqrt{K} = ${f(1 / Math.sqrt(K), 4)}$);
- fattore di bias: $\frac{${K}}{${K - 1}} = ${f(bias, 4)}$, cioè la stima sovrastima di circa il $${f((bias - 1) * 100, 1)}\%$;
- deviazione standard relativa: $\sqrt{\frac{${N - K + 1}}{${N} \cdot ${K - 2}}} = ${f(disp, 4)}$.

Con $K$ fisso questi numeri non scendono al crescere di $N$: è il «Fixed K» delle note, varianza che non si annulla.`,
      }
    },
  },
  {
    id: 'es21',
    title: 'Disegnare tutta la curva K-NN, code comprese',
    difficulty: 3,
    kind: 'numerico',
    concepts: ['c47', 'c48', 'c49', 'c50', 'c71'],
    generate: (rng) => {
      const N = rng.int(4, 6)
      const K = rng.pick([2, 3])
      const xs = campioni1d(rng, N, 0, 5, 0.2)
      const { cuspidi, angoli, tratti } = struttura(xs, K)
      const xq = rng.float(xs[0] + 0.1, xs[N - 1] - 0.1, 2)
      const xL = Number((xs[0] - rng.pick([0.5, 1, 2])).toFixed(1))
      const xR = Number((xs[N - 1] + rng.pick([0.5, 1, 2])).toFixed(1))
      const pq = knn1d(xs, xq, K)
      const pL = knn1d(xs, xL, K)
      const pR = knn1d(xs, xR, K)
      const alta = cuspidi.reduce((b, q) => (q.altezza > b.altezza + 1e-12 ? q : b), cuspidi[0])
      const hN = 1 / (xs[N - 1] - xs[0])
      const a0 = xs[0] - 1
      const a1 = xs[N - 1] + 1
      const area = areaKnn(xs, K, a0, a1)
      const coeff = K / (2 * N)
      const formula = (t: Tratto) => (t.destra ? md`\frac{${f(coeff, 4)}}{x - ${f(t.c, 1)}}` : md`\frac{${f(coeff, 4)}}{${f(t.c, 1)} - x}`)
      const intervallo = (t: Tratto) => `${t.da === -Infinity ? '(' : '['}${infTex(t.da, 2)},\\ ${infTex(t.a, 2)}${t.a === Infinity ? ')' : ']'}`
      const righe = tratti.map((t, i) => md`| ${i + 1} | $${intervallo(t)}$ | $${f(t.c, 1)}$ | $${formula(t)}$ |`).join('\n')
      const tq = tratti.find((t) => xq >= t.da - 1e-12 && xq <= t.a + 1e-12) ?? tratti[0]
      const raccordi = [...cuspidi.map((q) => ({ pos: q.pos, v: q.altezza })), ...angoli.map((q) => ({ pos: q.pos, v: q.valore }))]
        .sort((u, v) => u.pos - v.pos)
        .map((q) => md`$\hat{p}(${f(q.pos, 2)}) = ${f(q.v, 4)}$`)
        .join(', ')
      return {
        prompt: md`Campioni 1-D ordinati: $\{${elenco(xs, 1)}\}$ ($N = ${N}$), stima K-NN con $K = ${K}$. Costruisci l'intera stima a tratti: finestre di $K$ campioni consecutivi, cuspidi, minimi angolosi, rami di iperbole $\frac{K}{2N\vert x - c \vert}$ con il loro $c$, code. Poi calcola: (a) $\hat{p}(${f(xq, 2)})$; (b) $\hat{p}(${f(xL, 1)})$ nella coda sinistra; (c) $\hat{p}(${f(xR, 1)})$ nella coda destra; (d) l'altezza della cuspide più alta; (e) l'area sotto la stima su $[${f(a0, 1)},\ ${f(a1, 1)}]$; (f) l'altezza dell'unica cuspide se usassi $K = N$.`,
        answers: [
          risposta(md`(a) $\hat{p}(${f(xq, 2)})$`, pq, tol(pq, 0.01, 0.002)),
          risposta(md`(b) $\hat{p}(${f(xL, 1)})$`, pL, tol(pL, 0.01, 0.002)),
          risposta(md`(c) $\hat{p}(${f(xR, 1)})$`, pR, tol(pR, 0.01, 0.002)),
          risposta('(d) cuspide più alta', alta.altezza, tol(alta.altezza, 0.01, 0.002)),
          risposta('(e) area', area, tol(area, 0.02, 0.005)),
          risposta('(f) cuspide con K = N', hN, tol(hN, 0.01, 0.001)),
        ],
        solution: md`**1. Finestre e cuspidi.** Le cuspidi cadono nei punti medi dei gruppi di $K = ${K}$ campioni consecutivi, alte $\frac{K}{N \cdot \text{larghezza}}$: ${cuspidi.map((q) => md`$${f(q.pos, 2)}$ (gruppo $[${f(q.sx, 1)},\ ${f(q.dx, 1)}]$, altezza $${f(q.altezza, 4)}$)`).join('; ')}.

**2. Minimi angolosi.** Nei punti medi tra il campione che esce e quello che entra: ${angoli.map((q) => md`$${f(q.pos, 2)}$ (valore $${f(q.valore, 4)}$)`).join('; ')}.

**3. Tratti.** Con $\frac{K}{2N} = ${f(coeff, 4)}$, in ogni tratto la stima è $\frac{K}{2N\vert x - c \vert}$ con $c$ il $K$-esimo vicino:

| tratto | intervallo | $c$ | $\hat{p}(x)$ |
|---|---|---|---|
${righe}

Il primo e l'ultimo tratto sono le code: a sinistra $c = x_{(K)} = ${f(xs[K - 1], 1)}$, a destra $c = x_{(N-K+1)} = ${f(xs[N - K], 1)}$.

**4. Valori.**

- (a) $x = ${f(xq, 2)}$ cade nel tratto con $c = ${f(tq.c, 1)}$: $\hat{p} = \frac{${f(coeff, 4)}}{${f(Math.abs(xq - tq.c), 2)}} = ${f(pq, 4)}$.
- (b) coda sinistra: $\hat{p}(${f(xL, 1)}) = \frac{${f(coeff, 4)}}{${f(xs[K - 1], 1)} - (${f(xL, 1)})} = ${f(pL, 4)}$.
- (c) coda destra: $\hat{p}(${f(xR, 1)}) = \frac{${f(coeff, 4)}}{${f(xR, 1)} - ${f(xs[N - K], 1)}} = ${f(pR, 4)}$.
- (d) la cuspide più alta è in $${f(alta.pos, 2)}$, alta $${f(alta.altezza, 4)}$, sopra il gruppo più stretto.

**5. Continuità.** Nei raccordi i due tratti adiacenti danno lo stesso valore (${raccordi}): la curva è continua, a saltare è solo la pendenza.

**6. Area.** Sommando gli integrali dei rami, $\int \frac{K}{2N(x - c)}dx = \frac{K}{2N}\ln\vert x - c \vert$, sull'intervallo $[${f(a0, 1)},\ ${f(a1, 1)}]$ ottengo $${f(area, 4)}$. Allargando l'intervallo l'area continua a crescere, come $\frac{K}{N}\ln L$, perché le code scendono come $1/\vert x \vert$: la stima non integra a 1.

**Casi limite.** Con $K = 1$ ogni campione è centro di due rami che divergono: $\hat{p} \to +\infty$ sui campioni. Con $K = N$ resta un'unica cuspide nel punto medio tra minimo e massimo, alta $\frac{1}{x_{(N)} - x_{(1)}} = \frac{1}{${f(xs[N - 1] - xs[0], 1)}} = ${f(hN, 4)}$: ogni struttura interna sparisce.`,
      }
    },
  },
  {
    id: 'es22',
    title: 'Casi limite: che cosa succede se...',
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c23', 'c24', 'c40', 'c44', 'c45', 'c71'],
    generate: (rng) => {
      const N = rng.pick([20, 50, 100])
      const pA = 1 / (N * 1e-3)
      const w = rng.pick([0.4, 0.8, 1.2, 2])
      const limB = 1 - w / 4
      const Ltot = rng.pick([4, 5, 8, 10])
      const pC = 1 / Ltot
      const d1 = rng.pick([0.01, 0.05, 0.1])
      const pD = 1 / (2 * N * d1)
      const xa = rng.float(0.5, 2, 1)
      const xb = Number((xa + rng.float(2, 5, 1)).toFixed(1))
      const pE = 1 / (xb - xa)
      const Nf = rng.pick([1e4, 1e6])
      const Kf = Math.sqrt(Nf)
      const dF = rng.pick([0.2, 0.5, 1])
      const pF = Kf / (2 * Nf * (dF + Kf / (Nf + 1)))
      return {
        prompt: md`Per ogni situazione di' a che cosa tende la stima e perché, e rispondi con il numero richiesto.

(a) $N = ${N}$ campioni fissi, $R$ che si stringe attorno a $x^*$. Se $x^*$ coincide con un campione e $R$ è un intervallo largo $V = 10^{-3}$ che contiene solo quel campione, quanto vale $K/(NV)$?

(b) $V$ fisso e $N \to +\infty$. La pdf vera è il triangolo $p(x) = 1 - \vert x - 1 \vert$ su $[0, 2]$, $x^* = 1$ e $R = [1 - ${f(w / 2)},\ 1 + ${f(w / 2)}]$: a che valore tende la stima?

(c) $R$ grande quanto tutto il supporto dei dati, un intervallo lungo $V = ${Ltot}$ che contiene tutti i campioni: quanto vale la stima?

(d) K-NN con $K = 1$ e $N = ${N}$: quanto vale la stima a distanza $${f(d1, 2)}$ dal campione più vicino?

(e) K-NN con $K = N$: i campioni estremi sono $x_{(1)} = ${f(xa, 1)}$ e $x_{(N)} = ${f(xb, 1)}$. Quanto è alta l'unica cuspide?

(f) K-NN con $K_N = \sqrt{N}$ e $N = ${intero(Nf)}$ campioni uniformi su $[0, 1]$, nel punto $x^* = ${f(1 + dF, 1)}$ fuori dal supporto: quanto vale circa la stima?`,
        answers: [
          risposta('(a)', pA, tol(pA, 0.01, 0.01)),
          risposta('(b)', limB, 0.002),
          risposta('(c)', pC, tol(pC, 0.01, 0.001)),
          risposta('(d)', pD, tol(pD, 0.01, 0.01)),
          risposta('(e)', pE, tol(pE, 0.01, 0.001)),
          risposta('(f)', pF, tol(pF, 0.03, 0.0005)),
        ],
        solution: md`**(a) $N$ fisso, $V \to 0$.** Con $V = 10^{-3}$: $\hat{p} = \frac{1}{${N} \cdot 10^{-3}} = ${f(pA, 2)}$, e continua a crescere stringendo $R$: la stima diverge sui campioni. In un punto che non coincide con un campione, prima o poi la regione è vuota: $K = 0$ e la stima vale 0. A dati fissi non posso rendere esatta $P_R = p(\mathbf{x}^*)V$ stringendo $R$: è il senso di «$R$ enough large».

**(b) $V$ fisso, $N \to +\infty$.** Per la legge dei grandi numeri $K/N \to P_R$, quindi $\hat{p} \to P_R/V$, la media spaziale di $p$ su $R$:

$$\frac{1}{V}\int_{1 - ${f(w / 2)}}^{1 + ${f(w / 2)}} (1 - \vert x - 1 \vert)\,dx = \frac{1}{${f(w)}}\left(${f(w)} - \frac{${f(w)}^2}{4}\right) = 1 - \frac{${f(w)}}{4} = ${f(limB, 3)}$$

contro $p(1) = 1$. La varianza si annulla, il bias ($${f(limB - 1, 3)}$) resta: è il senso di «$R$ enough small».

**(c) $R$ = tutto.** $K = N$ e $P_R = 1$: $\hat{p} = \frac{N}{N V} = \frac{1}{${Ltot}} = ${f(pC, 3)}$, piatta, qualunque sia la forma della pdf. Anche qui: $V$ deve dipendere da $N$.

**(d) K-NN con $K = 1$.** $\hat{p} = \frac{1}{2N\,r_1} = \frac{1}{2 \cdot ${N} \cdot ${f(d1, 2)}} = ${f(pD, 3)}$, e diverge avvicinandosi al campione. Valore atteso infinito, area infinita: *overfitting* estremo, la prima riga della figura della slide 50.

**(e) K-NN con $K = N$.** La cella deve contenere tutti i campioni: un'unica cuspide nel punto medio $${f((xa + xb) / 2, 2)}$, alta $\frac{1}{x_{(N)} - x_{(1)}} = ${f(pE, 4)}$, con code $\frac{1}{2\vert x \vert}$. Tutta la struttura interna sparisce: *oversmoothing* estremo.

**(f) Fuori dal supporto.** Con $K_N = ${intero(Kf)}$ i vicini sono i campioni più grandi; il $K$-esimo più grande vale circa $1 - \frac{K}{N+1}$, quindi $r_K \simeq ${f(dF, 1)} + ${sci(Kf / (Nf + 1), 3)}$ e

$$\hat{p}(x^*) \simeq \frac{K_N}{2N\,r_K} = ${sci(pF, 3)}$$

Il volume non tende a zero (resta circa $2 \cdot ${f(dF, 1)}$), ma la stima tende lo stesso a $0 = p(x^*)$ perché $K_N/N \to 0$.

**Il filo comune.** Il $K$ utile sta tra i due estremi $K = 1$ e $K = N$, e al crescere di $N$ deve allontanarsi da entrambi: $K_N \to +\infty$ (via da $K = 1$) e $K_N/N \to 0$ (via da $K = N$). Sono le due condizioni della slide 47.`,
      }
    },
  },
]
