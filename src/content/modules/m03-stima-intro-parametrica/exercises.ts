// Esercizi generativi del modulo m03 (stima statistica: introduzione, stima di pdf, stima parametrica e verosimiglianza):
// uno per ogni esercizio dell'inventario (es01-es21). Ogni generatore usa solo rng: stesso seed, stessa istanza.
// I conti stanno in `calcoli`, così uno script di verifica li può confrontare con i numeri dell'inventario.
import { md } from '../../types'
import type { Exercise, ExerciseAnswer, Rng } from '../../types'

// ---------------------------------------------------------------------------------------------------
// Calcoli
// ---------------------------------------------------------------------------------------------------

const SQRT2PI = Math.sqrt(2 * Math.PI)

/** Densità gaussiana 1-D N(mu, s²) calcolata in x. */
const gauss = (x: number, mu: number, s: number) => Math.exp(-((x - mu) ** 2) / (2 * s * s)) / (SQRT2PI * s)

/** erfc con errore relativo sotto 1.2e-7 (approssimazione di Chebyshev di Numerical Recipes). */
const erfc = (x: number) => {
  const z = Math.abs(x)
  const t = 1 / (1 + 0.5 * z)
  const r =
    t *
    Math.exp(
      -z * z -
        1.26551223 +
        t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))),
    )
  return x >= 0 ? r : 2 - r
}

/** Coda della gaussiana standard: Q(x) = P{z > x}. */
const Q = (x: number) => 0.5 * erfc(x / Math.SQRT2)

/** Somma dei quadrati degli scarti da t. */
const sq = (xs: number[], t: number) => xs.reduce((s, x) => s + (x - t) ** 2, 0)
const media = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length

/** Log-verosimiglianza gaussiana con σ nota: l(θ) = −(N/2)ln(2πσ²) − Σ(x_k − θ)²/(2σ²). */
const logLik = (xs: number[], theta: number, sigma: number) => -(xs.length / 2) * Math.log(2 * Math.PI * sigma * sigma) - sq(xs, theta) / (2 * sigma * sigma)

/** Numero di massimi locali della mistura (1/3)Σ N(a_i, σ²) sulla griglia [−0.5, 1.5]. */
const contaMode = (livelli: number[], s: number) => {
  const passo = 0.0005
  const p = (y: number) => livelli.reduce((acc, a) => acc + gauss(y, a, s), 0) / livelli.length
  let mode = 0
  let prec = p(-0.5 - passo)
  let cur = p(-0.5)
  for (let y = -0.5; y <= 1.5; y += passo) {
    const succ = p(y + passo)
    if (cur > prec && cur >= succ) mode++
    prec = cur
    cur = succ
  }
  return mode
}

export const calcoli = { gauss, erfc, Q, sq, media, logLik, contaMode }

// ---------------------------------------------------------------------------------------------------
// Formattazione
// ---------------------------------------------------------------------------------------------------

/** Numero per il testo: al più d decimali, senza zeri inutili e mai −0. */
const f = (x: number, d = 3) => {
  const r = Number(x.toFixed(d))
  return String(r === 0 ? 0 : r)
}
/** Notazione scientifica in LaTeX a partire dal logaritmo naturale (niente underflow). */
const sciLn = (l: number, d = 2) => {
  const e10 = l / Math.LN10
  let e = Math.floor(e10)
  let m = 10 ** (e10 - e)
  if (Number(m.toFixed(d)) >= 10) {
    m /= 10
    e += 1
  }
  return e === 0 ? m.toFixed(d) : md`${m.toFixed(d)}\times 10^{${e}}`
}
/** Tre cifre significative; sotto 10⁻³ passa alla notazione scientifica. */
const num = (x: number) => {
  if (x === 0) return '0'
  if (Math.abs(x) < 1e-3) return (x < 0 ? '-' : '') + sciLn(Math.log(Math.abs(x)))
  const r = Number(x.toPrecision(3))
  return String(r === 0 ? 0 : r)
}
/** Tolleranza: relativa, con un minimo assoluto. */
const tol = (v: number, rel = 0.01, abs = 0.001) => Math.max(abs, Math.abs(v) * rel)
const risposta = (label: string, value: number, tolerance = tol(value)): ExerciseAnswer => ({ label, value, tolerance })
const elenco = (xs: number[], d = 2) => xs.map((x) => f(x, d)).join(',\\ ')
/** "+ 3" oppure "- 3": un termine da accodare in una somma. */
const piu = (x: number, d = 3) => (x < 0 ? `- ${f(-x, d)}` : `+ ${f(x, d)}`)
const lettere = ['A', 'B', 'C', 'D', 'E', 'F'] as const
/** Estrae k elementi distinti, nell'ordine mescolato. */
const estrai = <T,>(rng: Rng, xs: readonly T[], k: number) => rng.shuffle(xs).slice(0, k)

// ---------------------------------------------------------------------------------------------------
// Dati fissi delle fonti
// ---------------------------------------------------------------------------------------------------

/** I 12 campioni della slide "Likelihood Function: Example" (ch2 p10), misurati sui pixel dal revisore. */
const CAMPIONI_SLIDE = [1.87, 2.08, 2.3, 2.34, 2.54, 2.88, 3.37, 3.66, 3.7, 3.89, 4.14, 4.78]

// ---------------------------------------------------------------------------------------------------
// Esercizi
// ---------------------------------------------------------------------------------------------------

export const exercises: Exercise[] = [
  {
    id: 'es01',
    title: 'Calcola la verosimiglianza di due candidati',
    difficulty: 1,
    kind: 'numerico',
    concepts: ['c51', 'c53', 'c56'],
    generate: (rng) => {
      const N = rng.int(3, 6)
      const xs = Array.from({ length: N }, () => rng.float(1, 6, 1))
      const sigma = rng.pick([0.5, 1, 2])
      const s2 = sigma * sigma
      const tA = rng.float(1, 6, 1)
      let tB = rng.float(1, 6, 1)
      for (let i = 0; i < 50 && (Math.abs(tA - tB) < 0.3 || Math.abs(sq(xs, tA) - sq(xs, tB)) < 0.05); i++) tB = rng.float(1, 6, 1)
      if (Math.abs(tA - tB) < 0.3 || Math.abs(sq(xs, tA) - sq(xs, tB)) < 0.05) tB = tA <= 3.5 ? tA + 1.5 : tA - 1.5
      const SA = sq(xs, tA)
      const SB = sq(xs, tB)
      const c0 = -(N / 2) * Math.log(2 * Math.PI * s2)
      const lA = c0 - SA / (2 * s2)
      const lB = c0 - SB / (2 * s2)
      const migliore = lA > lB ? 1 : 2
      const xbar = media(xs)
      const termini = (t: number) => xs.map((x) => `(${f(x, 1)} - ${f(t, 1)})^2`).join(' + ')
      const blocco = (nome: string, t: number, S: number, l: number) => md`**Candidato $\theta_${nome} = ${f(t, 1)}$.** Somma dei quadrati degli scarti:

$$\sum_{k=1}^{${N}}(x_k - \theta_${nome})^2 = ${termini(t)} = ${f(S)}$$

$$l(\theta_${nome}) = -\frac{${N}}{2}\ln(2\pi\cdot ${f(s2, 2)}) - \frac{${f(S)}}{2\cdot ${f(s2, 2)}} = ${f(c0)} - ${f(S / (2 * s2))} = ${f(l)}$$

quindi $p(\mathbf{X}\mid\theta_${nome}) = e^{${f(l)}} \approx ${sciLn(l)}$.`
      return {
        prompt: md`La telecamera dell'impianto del pesce misura la luminosità di $N = ${N}$ salmoni:

$$\mathbf{X} = \{${elenco(xs, 1)}\}$$

Modello le letture con una gaussiana di deviazione standard nota $\sigma = ${f(sigma)}$ e media $\theta$ incognita. Calcola la log-verosimiglianza $l(\theta) = \ln p(\mathbf{X}\mid\theta)$ per i due candidati $\theta_A = ${f(tA, 1)}$ e $\theta_B = ${f(tB, 1)}$, e di' quale dei due è più compatibile con i dati (scrivi 1 per $\theta_A$, 2 per $\theta_B$).`,
        answers: [
          risposta(md`$l(\theta_A)$`, lA, tol(lA, 0.005, 0.02)),
          risposta(md`$l(\theta_B)$`, lB, tol(lB, 0.005, 0.02)),
          risposta('candidato più compatibile (1 = A, 2 = B)', migliore, 0.1),
        ],
        solution: md`**1. Il modello.** Ogni campione ha densità $p(x_k\mid\theta) = \frac{1}{\sqrt{2\pi}\,\sigma}\exp\left(-\frac{(x_k - \theta)^2}{2\sigma^2}\right)$. I campioni sono iid, quindi la verosimiglianza è il prodotto delle $N$ densità:

$$p(\mathbf{X}\mid\theta) = \prod_{k=1}^{N} p(x_k\mid\theta) = (2\pi\sigma^2)^{-N/2}\exp\left(-\frac{1}{2\sigma^2}\sum_{k=1}^{N}(x_k - \theta)^2\right)$$

Il logaritmo trasforma il prodotto in somma: $l(\theta) = -\frac{N}{2}\ln(2\pi\sigma^2) - \frac{1}{2\sigma^2}\sum_{k}(x_k - \theta)^2$. Il primo termine vale $${f(c0)}$ e non dipende da $\theta$.

${blocco('A', tA, SA, lA)}

${blocco('B', tB, SB, lB)}

**Confronto.** Vince il candidato con la log-verosimiglianza più alta, cioè con la somma dei quadrati degli scarti più piccola: $\theta_${migliore === 1 ? 'A' : 'B'}$. Il rapporto delle verosimiglianze vale $e^{${f(Math.abs(lA - lB))}} \approx ${num(Math.exp(Math.abs(lA - lB)))}$: con quel parametro i campioni osservati sono ${num(Math.exp(Math.abs(lA - lB)))} volte più plausibili. ${Math.abs((migliore === 1 ? tA : tB) - xbar) < 1e-9 ? md`Il candidato vincente coincide con la media campionaria $\bar{x} = ${f(xbar)}$, che è la stima ML: rende minima la somma dei quadrati degli scarti.` : md`Nessuno dei due è il massimo assoluto: la stima ML è la media campionaria $\bar{x} = ${f(xbar)}$, che rende minima la somma dei quadrati degli scarti.`}`,
      }
    },
  },
  {
    id: 'es02',
    title: 'Perché il prodotto? Dimostra la fattorizzazione',
    difficulty: 2,
    kind: 'dimostrazione',
    concepts: ['c35', 'c36', 'c51', 'c52'],
    generate: (rng) => {
      const sigma = rng.pick([0.5, 1, 1.5])
      const theta = rng.float(18, 24, 1)
      const rho = rng.pick([0.5, 0.7, 0.9])
      const x1 = Number((theta + sigma * rng.float(-1.2, 1.2, 2)).toFixed(2))
      const mc = theta + rho * (x1 - theta)
      const sc = sigma * Math.sqrt(1 - rho * rho)
      const x2 = Number((mc + sc * rng.float(-1.2, 1.2, 2)).toFixed(2))
      const p1 = gauss(x1, theta, sigma)
      const p2 = gauss(x2, theta, sigma)
      const indip = p1 * p2
      const pc = gauss(x2, mc, sc)
      const congiunta = p1 * pc
      return {
        prompt: md`**Parte 1.** Partendo dalla densità congiunta $p(\mathbf{x}_1, \dots, \mathbf{x}_N\mid\boldsymbol{\theta})$, dimostra che con campioni iid la verosimiglianza è il prodotto delle densità dei singoli campioni. Indica dove usi l'indipendenza e dove l'identica distribuzione, e che cosa cambia se due campioni sono dipendenti.

**Parte 2.** Un sensore IoT di temperatura ha letture gaussiane di media $\theta = ${f(theta, 1)}$ °C e deviazione standard $\sigma = ${f(sigma)}$ °C. Due letture consecutive valgono $x_1 = ${f(x1, 2)}$ e $x_2 = ${f(x2, 2)}$. In realtà sono correlate, con coefficiente $\rho = ${f(rho)}$: la seconda, data la prima, è gaussiana con media $\theta + \rho(x_1 - \theta)$ e deviazione standard $\sigma\sqrt{1 - \rho^2}$. Calcola (a) il prodotto delle marginali $p(x_1\mid\theta)\,p(x_2\mid\theta)$, cioè ciò che scriverebbe chi assume l'indipendenza; (b) la densità condizionata $p(x_2\mid x_1, \theta)$; (c) la densità congiunta vera $p(x_1, x_2\mid\theta)$.`,
        answers: [
          risposta('(a) prodotto delle marginali', indip, tol(indip, 0.01, 1e-5)),
          risposta(md`(b) $p(x_2\mid x_1, \theta)$`, pc, tol(pc, 0.01, 1e-5)),
          risposta('(c) congiunta vera', congiunta, tol(congiunta, 0.01, 1e-5)),
        ],
        solution: md`**Parte 1.**

**1. Definizione.** La verosimiglianza è la densità congiunta di tutti i campioni, vista come funzione di $\boldsymbol{\theta}$:

$$p(\mathbf{X}\mid\boldsymbol{\theta}) = p(\mathbf{x}_1, \mathbf{x}_2, \dots, \mathbf{x}_N\mid\boldsymbol{\theta})$$

**2. Indipendenza.** Per $\boldsymbol{\theta}$ fissato i campioni sono indipendenti, quindi la congiunta si fattorizza nel prodotto delle marginali:

$$p(\mathbf{x}_1, \dots, \mathbf{x}_N\mid\boldsymbol{\theta}) = p_1(\mathbf{x}_1\mid\boldsymbol{\theta})\,p_2(\mathbf{x}_2\mid\boldsymbol{\theta})\cdots p_N(\mathbf{x}_N\mid\boldsymbol{\theta})$$

**3. Identica distribuzione.** Tutte le marginali sono la stessa funzione: $p_1(\cdot\mid\boldsymbol{\theta}) = \dots = p_N(\cdot\mid\boldsymbol{\theta}) = p(\cdot\mid\boldsymbol{\theta})$.

**4. Risultato.**

$$p(\mathbf{X}\mid\boldsymbol{\theta}) = \prod_{k=1}^{N} p(\mathbf{x}_k\mid\boldsymbol{\theta}),\qquad l(\boldsymbol{\theta}) = \ln p(\mathbf{X}\mid\boldsymbol{\theta}) = \sum_{k=1}^{N}\ln p(\mathbf{x}_k\mid\boldsymbol{\theta})$$

**5. Campioni dipendenti.** La regola della catena vale sempre: $p(\mathbf{x}_1, \mathbf{x}_2\mid\boldsymbol{\theta}) = p(\mathbf{x}_1\mid\boldsymbol{\theta})\,p(\mathbf{x}_2\mid\mathbf{x}_1, \boldsymbol{\theta})$. Solo con l'indipendenza $p(\mathbf{x}_2\mid\mathbf{x}_1, \boldsymbol{\theta}) = p(\mathbf{x}_2\mid\boldsymbol{\theta})$; altrimenti il prodotto delle marginali non è la congiunta. L'ipotesi iid di rado vale nei dati reali (letture consecutive di un sensore, pixel vicini), ma la si assume per semplificare i calcoli.

**Parte 2.**

**(a)** $p(x_1\mid\theta) = \frac{1}{\sqrt{2\pi}\cdot ${f(sigma)}}\exp\left(-\frac{(${f(x1, 2)} - ${f(theta, 1)})^2}{2\cdot ${f(sigma * sigma, 2)}}\right) = ${num(p1)}$ e $p(x_2\mid\theta) = ${num(p2)}$, quindi

$$p(x_1\mid\theta)\,p(x_2\mid\theta) = ${num(p1)}\cdot ${num(p2)} = ${num(indip)}$$

**(b)** Data la prima lettura la seconda ha media $${f(theta, 1)} + ${f(rho)}\cdot(${f(x1, 2)} - ${f(theta, 1)}) = ${f(mc)}$ e deviazione standard $${f(sigma)}\sqrt{1 - ${f(rho * rho, 2)}} = ${f(sc)}$:

$$p(x_2\mid x_1, \theta) = \frac{1}{\sqrt{2\pi}\cdot ${f(sc)}}\exp\left(-\frac{(${f(x2, 2)} - ${f(mc)})^2}{2\cdot ${f(sc)}^2}\right) = ${num(pc)}$$

**(c)** Regola della catena: $p(x_1, x_2\mid\theta) = p(x_1\mid\theta)\,p(x_2\mid x_1, \theta) = ${num(p1)}\cdot ${num(pc)} = ${num(congiunta)}$.

La congiunta vera è $${f(congiunta / indip, 2)}$ volte il prodotto delle marginali: con letture correlate, sapere $x_1$ cambia la previsione su $x_2$, e il prodotto delle marginali non descrive più i dati.`,
      }
    },
  },
  {
    id: 'es03',
    title: 'Soglie e probabilità d’errore del canale PAM rumoroso',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c09', 'c12', 'c13', 'c14'],
    generate: (rng) => {
      const variante = rng.next() < 0.4
      const a1 = variante ? rng.pick([0.1, 0.2, 0.3]) : 0.25
      const d = variante ? rng.pick([0.2, 0.3, 0.4]) : 0.25
      const livelli = [a1, a1 + d, a1 + 2 * d].map((a) => Number(a.toFixed(3)))
      const sMin = Math.max(0.03, Math.ceil((d / 8.4) * 100) / 100)
      const sn = rng.float(sMin, 0.15, 2)
      const t1 = Number((a1 + d / 2).toFixed(4))
      const t2 = Number((a1 + (3 * d) / 2).toFixed(4))
      const arg = d / (2 * sn)
      const q = Q(arg)
      const Pe = (4 / 3) * q
      return {
        prompt: md`Una sorgente emette tre simboli equiprobabili, Yes, Maybe e No, trasmessi con un modulatore PAM come impulsi di ampiezza $${livelli.map((a) => f(a)).join(',\\ ')}$. Il canale aggiunge rumore gaussiano a media nulla con deviazione standard $\sigma_n = ${f(sn, 2)}$: $y = x + n$. Trova le soglie di decisione a massima verosimiglianza $t_1 \lt t_2$ e la probabilità d'errore media $P_e$ (in percentuale).`,
        answers: [
          risposta(md`$t_1$`, t1, 0.001),
          risposta(md`$t_2$`, t2, 0.001),
          risposta(md`$P_e$ (%)`, Pe * 100, tol(Pe * 100, 0.02, 1e-5)),
        ],
        solution: md`**1. Densità condizionate.** Dato il simbolo di ampiezza $a$, $y = a + n$ è gaussiana centrata in $a$: $p(y\mid a) = \frac{1}{\sqrt{2\pi}\,\sigma_n}\exp\left(-\frac{(y - a)^2}{2\sigma_n^2}\right)$. La densità di $y$ è la convoluzione della distribuzione discreta di $x$ con la densità del rumore, una mistura di tre gaussiane di peso $\frac{1}{3}$.

**2. Soglie ML.** Decido il simbolo con la verosimiglianza più alta. Fra due livelli adiacenti le campane hanno la stessa varianza, quindi si incrociano dove $(y - a_i)^2 = (y - a_{i+1})^2$, a metà strada:

$$t_1 = \frac{${f(livelli[0])} + ${f(livelli[1])}}{2} = ${f(t1, 4)},\qquad t_2 = \frac{${f(livelli[1])} + ${f(livelli[2])}}{2} = ${f(t2, 4)}$$

Con prior uguali (qui $\frac{1}{3}$) le soglie ML sono anche quelle a minimo errore.

**3. Errori per simbolo.** Ogni soglia dista $\frac{d}{2} = ${f(d / 2, 4)}$ dal livello più vicino, cioè $\frac{d}{2\sigma_n} = \frac{${f(d / 2, 4)}}{${f(sn, 2)}} = ${f(arg)}$ deviazioni standard. Il simbolo più basso sbaglia solo se il rumore supera $+d/2$: probabilità $Q(${f(arg)}) = ${num(q)}$. Quello più alto, lo stesso. Quello centrale sbaglia da entrambi i lati: $2Q(${f(arg)})$.

**4. Probabilità d'errore media.**

$$P_e = \frac{1}{3}\left[Q + 2Q + Q\right] = \frac{4}{3}\,Q\left(\frac{d}{2\sigma_n}\right) = \frac{4}{3}\cdot ${num(q)} = ${num(Pe)}$$

cioè $${num(Pe * 100)}\%$. Casi limite: con $\sigma_n \to 0$, $P_e \to 0$; con $\sigma_n \to +\infty$, $Q \to \frac{1}{2}$ e $P_e \to \frac{2}{3}$, come tirare a indovinare fra tre simboli.`,
      }
    },
  },
  {
    id: 'es04',
    title: 'A quale categoria di segnale appartiene?',
    difficulty: 1,
    kind: 'concettuale',
    concepts: ['c28', 'c29', 'c30', 'c31', 'c32', 'c78'],
    generate: (rng) => {
      const scenari = [
        { txt: 'trasmettere bit con un modulatore PAM su un canale rumoroso', cat: 1, why: 'la sorgente è completamente nota (simboli e livelli possibili) e il rumore entra in trasmissione' },
        { txt: 'stimare la velocità di un bersaglio da un sonar', cat: 2, why: 'la struttura del segnale di eco è nota, la velocità è un parametro aleatorio da inferire dalle osservazioni rumorose' },
        { txt: 'rivelare oggetti sepolti con il georadar (ground penetrating radar)', cat: 3, why: 'il segnale è completamente ignoto, segnale e rumore sono aleatori e contano solo i dati osservati' },
        { txt: "stimare l'ampiezza incognita dell'interferenza di rete a 50 Hz che si somma a un ECG", cat: 2, why: "la forma dell'interferenza è nota (una sinusoide a 50 Hz), manca solo un parametro, l'ampiezza" },
        { txt: "stimare l'ampiezza di una portante a frequenza nota ricevuta con fase aleatoria", cat: 2, why: 'la struttura è nota (una sinusoide a frequenza data) e restano da stimare parametri aleatori, ampiezza e fase' },
        { txt: 'modellare il rumore sismico di fondo registrato da un sismografo', cat: 3, why: 'non esiste un modello della sorgente e la stima si basa solo sulle registrazioni' },
      ]
      const scelti = estrai(rng, scenari, 4)
      const modelli = [
        { nome: 'una gaussiana 1-D', r: 2, tex: md`\boldsymbol{\theta} = (\mu, \sigma^2)` },
        { nome: 'una gaussiana con due feature', r: 5, tex: md`\boldsymbol{\theta} = (\mu_1, \mu_2, \sigma_1^2, \sigma_2^2, \sigma_{12})` },
        { nome: 'una Rayleigh', r: 1, tex: md`\boldsymbol{\theta} = (\sigma)` },
        { nome: 'una Gamma', r: 2, tex: md`\boldsymbol{\theta} = (k, \theta)` },
      ]
      const mod = rng.pick(modelli)
      const nomi = ['', 'segnale deterministico rumoroso', 'segnale parametrico rumoroso', 'segnale aleatorio rumoroso']
      const noto = ['', 'completamente nota', 'parzialmente nota', 'completamente ignota']
      const resta = ['', 'non resta nulla da stimare, solo da decidere in presenza di rumore', md`un vettore $\boldsymbol{\theta}$ di $r$ numeri (stima parametrica)`, md`l'intera funzione $p(\mathbf{x})$ (stima non parametrica)`]
      return {
        prompt: md`Classifica ogni scenario nella sua categoria di segnale stocastico: 1 = deterministico rumoroso, 2 = parametrico rumoroso, 3 = aleatorio rumoroso.

${scelti.map((s, i) => `- **${lettere[i]}.** ${s.txt}`).join('\n')}

Poi: per uno scenario della categoria 2 decidi di modellare la grandezza con ${mod.nome}. Quanti parametri $r$ restano da stimare?`,
        answers: [...scelti.map((s, i) => risposta(`categoria di ${lettere[i]}`, s.cat, 0.1)), risposta(md`$r$`, mod.r, 0.1)],
        solution: md`**Criterio.** Conta quanto conosco della sorgente di informazione: completamente nota (1), nota solo in parte (2), completamente ignota (3). Il rumore c'è in tutti e tre i casi.

${scelti.map((s, i) => `- **${lettere[i]}** → ${s.cat} (${nomi[s.cat]}): ${s.why}.`).join('\n')}

**Che cosa resta da stimare.** Categoria 1, sorgente ${noto[1]}: ${resta[1]}. Categoria 2, sorgente ${noto[2]}: resta ${resta[2]}. Categoria 3, sorgente ${noto[3]}: resta ${resta[3]}. Il corso si concentra sulle categorie 2 e 3, le più comuni nelle applicazioni, e sul problema della stima della pdf.

**Parametri.** Con ${mod.nome} il vettore è $${mod.tex}$, quindi $r = ${mod.r}$. Stimare la pdf diventa stimare un punto nello spazio $${mod.r}$-dimensionale dei parametri.`,
      }
    },
  },
  {
    id: 'es05',
    title: 'Parametrico o non parametrico?',
    difficulty: 1,
    kind: 'concettuale',
    concepts: ['c39', 'c40', 'c41', 'c42', 'c43', 'c44', 'c45', 'c46', 'c47', 'c48', 'c78'],
    generate: (rng) => {
      const N1 = rng.pick([20, 30, 40])
      const N2 = rng.pick([2000, 5000, 8000])
      const casi = rng.shuffle([
        { txt: `rumore termico di un sensore, di forma notoriamente gaussiana, con ${N1} campioni`, cod: 1, why: `la forma è nota: stimo solo media e varianza, e ${N1} campioni bastano` },
        { txt: `luminosità di un pescato misto di salmoni e spigole: l'istogramma ha due gobbe; ${N2} campioni`, cod: 0, why: `nessuna delle tre famiglie ha due gobbe e i campioni abbondano: lascio parlare i dati (K-NN o Parzen)` },
        { txt: "ampiezza dell'eco di un radar, modulo di un vettore 2-D con componenti gaussiane", cod: 3, why: 'il modulo di un vettore 2-D con componenti gaussiane indipendenti a media nulla segue una Rayleigh' },
        { txt: 'tempi di attesa dei clienti a uno sportello', cod: 2, why: 'grandezza positiva e asimmetrica, tipica dei modelli di code: Gamma' },
      ])
      return {
        prompt: md`Per ogni caso scegli l'approccio alla stima della pdf e, se parametrico, la famiglia. Codici: 0 = non parametrico, 1 = gaussiana, 2 = Gamma, 3 = Rayleigh.

${casi.map((c, i) => `- **${lettere[i]}.** ${c.txt}`).join('\n')}

Quanti parametri stimi nel caso gaussiano 1-D?`,
        answers: [...casi.map((c, i) => risposta(`codice di ${lettere[i]}`, c.cod, 0.1)), risposta('parametri della gaussiana 1-D', 2, 0.1)],
        solution: md`**Le definizioni.** Negli approcci parametrici la forma della distribuzione è nota e ci si concentra sulla stima dei suoi parametri. Nei non parametrici non si assume alcuna forma e ci si affida ai dati per inferire la distribuzione. Ogni metodo ha i suoi vantaggi, a seconda dei dati e dei requisiti dell'analisi.

${casi.map((c, i) => `- **${lettere[i]}** → ${c.cod}: ${c.why}.`).join('\n')}

**Gaussiana 1-D.** $\boldsymbol{\theta} = (\mu, \sigma^2)$: due parametri, media e varianza.

**I tre metodi non parametrici dell'albero.**

- *K-Nearest Neighbors*: stima la densità dalla vicinanza dei punti nello spazio delle feature.
- *Parzen Windows*: una funzione finestra liscia i contributi dei punti e costruisce la stima.
- *Orthogonal Function Approximation*: approssima la densità con funzioni ortogonali senza imporre una forma.`,
      }
    },
  },
  {
    id: 'es06',
    title: 'Dalla verosimiglianza alla log-verosimiglianza: stessi massimi, numeri diversi',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c55', 'c56', 'c57', 'c59'],
    generate: (rng) => {
      const slide = rng.next() < 0.3
      let xs: number[]
      let sigma: number
      let tc: number
      if (slide) {
        xs = [...CAMPIONI_SLIDE]
        sigma = 1
        tc = 5
      } else {
        const N = rng.int(8, 15)
        xs = Array.from({ length: N }, () => rng.float(1, 6, 2)).sort((a, b) => a - b)
        sigma = rng.pick([0.8, 1, 1.2, 1.5])
        const m0 = media(xs)
        tc = rng.float(1, 6, 1)
        for (let i = 0; i < 50 && Math.abs(tc - m0) < 0.8; i++) tc = rng.float(1, 6, 1)
        if (Math.abs(tc - m0) < 0.8) tc = Number((m0 < 3.5 ? m0 + 1.5 : m0 - 1.5).toFixed(1))
      }
      const N = xs.length
      const s2 = sigma * sigma
      const somma = xs.reduce((s, x) => s + x, 0)
      const xbar = somma / N
      const somma2 = xs.reduce((s, x) => s + x * x, 0)
      const S = sq(xs, xbar)
      const c0 = -(N / 2) * Math.log(2 * Math.PI * s2)
      const lhat = c0 - S / (2 * s2)
      const lc = lhat - (N * (tc - xbar) ** 2) / (2 * s2)
      const salto = lhat - lc
      return {
        prompt: md`${slide ? md`Sono i 12 campioni misurati sulla slide dell'esempio di verosimiglianza:` : md`Un sensore IoT registra $N = ${N}$ letture:`}

$$\mathbf{X} = \{${elenco(xs, 2)}\}$$

Modello gaussiano con $\sigma = ${f(sigma)}$ nota e media $\theta$ incognita. Calcola la stima $\hat{\theta}$ che massimizza la verosimiglianza, la log-verosimiglianza $l(\hat{\theta})$, la log-verosimiglianza $l(${f(tc, 1)})$ e la differenza $l(\hat{\theta}) - l(${f(tc, 1)})$.`,
        answers: [
          risposta(md`$\hat{\theta}$`, xbar, 0.005),
          risposta(md`$l(\hat{\theta})$`, lhat, tol(lhat, 0.003, 0.03)),
          risposta(md`$l(${f(tc, 1)})$`, lc, tol(lc, 0.005, 0.1)),
          risposta(md`$l(\hat{\theta}) - l(${f(tc, 1)})$`, salto, tol(salto, 0.01, 0.05)),
        ],
        solution: md`**1. La stima.** Per la gaussiana a varianza nota la log-verosimiglianza è una parabola in $\theta$, massima nella media campionaria:

$$\hat{\theta} = \bar{x} = \frac{1}{N}\sum_{k=1}^{N}x_k = \frac{${f(somma, 2)}}{${N}} = ${f(xbar)}$$

**2. Il massimo.** Scompongo $\sum_k (x_k - \theta)^2 = \sum_k (x_k - \bar{x})^2 + N(\theta - \bar{x})^2$. Il primo termine vale $\sum_k x_k^2 - N\bar{x}^2 = ${f(somma2, 3)} - ${N}\cdot ${f(xbar, 4)}^2 = ${f(S)}$. Allora

$$l(\hat{\theta}) = -\frac{N}{2}\ln(2\pi\sigma^2) - \frac{1}{2\sigma^2}\sum_{k=1}^{N}(x_k - \bar{x})^2 = ${f(c0)} - \frac{${f(S)}}{${f(2 * s2, 2)}} = ${f(lhat)}$$

e la verosimiglianza nel massimo vale $p(\mathbf{X}\mid\hat{\theta}) = e^{${f(lhat)}} \approx ${sciLn(lhat)}$.

**3. Il confronto.** Dalla scomposizione, $l(\theta) = l(\hat{\theta}) - \frac{N}{2\sigma^2}(\theta - \bar{x})^2$:

$$l(${f(tc, 1)}) = ${f(lhat)} - \frac{${N}}{${f(2 * s2, 2)}}(${f(tc, 1)} - ${f(xbar)})^2 = ${f(lc)}$$

cioè $p(\mathbf{X}\mid ${f(tc, 1)}) \approx ${sciLn(lc)}$. La differenza fra le log-verosimiglianze è $${f(salto)}$: la verosimiglianza in $\theta = ${f(tc, 1)}$ è $e^{${f(salto)}}$ volte più piccola.

**4. Che cosa insegna.** Verosimiglianza e log-verosimiglianza hanno lo stesso massimizzatore, perché il logaritmo è monotono crescente. Con soli ${N} campioni la verosimiglianza è già dell'ordine di $${sciLn(lhat, 1)}$: il prodotto di $N$ densità decresce in modo esponenziale con $N$. In logaritmo gli stessi numeri diventano $${f(lhat, 1)}$ e $${f(lc, 1)}$, facili da maneggiare.${slide ? ' Sono i valori della slide: picco di circa $1.5\\times 10^{-7}$ in $\\hat{\\theta} \\approx 3.1$ e massimo di $l(\\theta)$ attorno a $-15.7$.' : ''}`,
      }
    },
  },
  {
    id: 'es07',
    title: 'pdf o verosimiglianza? Leggi gli assi',
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c50', 'c53', 'c58'],
    generate: (rng) => {
      const grafici = [
        { txt: md`in ascissa $x$ (luminosità del pesce, da 0 a 8), una campana centrata in 3, disegnata con $\theta = 3$ fissato`, tipo: 1, why: md`varia $x$, $\theta$ è fissato: è una pdf $p(x\mid\theta)$ e la sua area vale 1` },
        { txt: md`in ascissa $\theta$ da 1 a 7, con 12 campioni fissati: una campana stretta con massimo $1.5\times 10^{-7}$`, tipo: 2, why: md`varia $\theta$, i campioni sono fissati: è la verosimiglianza $p(\mathbf{X}\mid\theta)$; la sua area non vale 1` },
        { txt: md`in ascissa $\theta$, una parabola concava con massimo $-15.7$ e valori fino a $-100$`, tipo: 2, why: md`è il logaritmo della verosimiglianza, $l(\theta)$, funzione di $\theta$ a campioni fissati; valori negativi, niente area unitaria` },
        { txt: md`in ascissa $x$, quattro curve tratteggiate della stessa larghezza, una per ciascun valore candidato di $\theta$`, tipo: 1, why: md`ogni curva è una pdf $p(x\mid\theta)$ con il suo $\theta$ fissato, ognuna di area 1` },
        { txt: md`in ascissa $\theta \in [0, 1]$, la curva $\theta^{7}(1 - \theta)^{3}$ per 7 email di spam su 10 ricevute, con massimo in $0.7$`, tipo: 2, why: md`è la verosimiglianza della probabilità di spam $\theta$ dati i conteggi osservati; la sua area vale $\frac{7!\,3!}{11!} \approx 7.6\times 10^{-4}$, non 1` },
        { txt: md`in ascissa $x$ (temperatura letta da un sensore IoT), la curva $p(x\mid\hat{\theta})$ sovrapposta all'istogramma normalizzato delle letture`, tipo: 1, why: md`$\hat{\theta}$ è fissato alla stima e varia $x$: è una pdf di area 1` },
      ]
      const scelti = estrai(rng, grafici, 4)
      const N = rng.int(2, 4)
      const sigma = rng.pick([0.8, 1, 1.5])
      const c = rng.float(1, 3, 1)
      const xs = Array.from({ length: N }, () => Number((c + sigma * rng.float(-1, 1, 1)).toFixed(2)))
      const xbar = media(xs)
      const S = sq(xs, xbar)
      const picco = Math.exp(logLik(xs, xbar, sigma))
      const larghezza = Math.sqrt((2 * Math.PI * sigma * sigma) / N)
      const area = picco * larghezza
      return {
        prompt: md`Per ogni grafico indica se rappresenta una pdf $p(x\mid\theta)$ (scrivi 1) o una verosimiglianza $p(\mathbf{X}\mid\theta)$ (scrivi 2).

${scelti.map((g, i) => `- **${lettere[i]}.** ${g.txt}`).join('\n')}

Poi un conto: con $N = ${N}$ campioni $\{${elenco(xs, 2)}\}$ e modello gaussiano con $\sigma = ${f(sigma)}$ nota, quanto vale l'area sotto la verosimiglianza $\int p(\mathbf{X}\mid\theta)\,d\theta$?`,
        answers: [...scelti.map((g, i) => risposta(`grafico ${lettere[i]}`, g.tipo, 0.1)), risposta(md`$\int p(\mathbf{X}\mid\theta)\,d\theta$`, area, tol(area, 0.015, 1e-5))],
        solution: md`**Regola.** Guardo l'ascissa. Se varia $x$ e $\theta$ è fissato, la curva è una pdf: la sua area vale 1. Se variano i parametri e i campioni sono fissati, è una verosimiglianza: misura la compatibilità tra $\theta$ e $\mathbf{X}$, non è una densità in $\theta$ e non è «la probabilità che $\theta$ sia vero».

${scelti.map((g, i) => `- **${lettere[i]}** → ${g.tipo}: ${g.why}.`).join('\n')}

**L'area.** Dalla scomposizione dei quadrati la verosimiglianza, in funzione di $\theta$, è una campana:

$$p(\mathbf{X}\mid\theta) = p(\mathbf{X}\mid\bar{x})\,\exp\left(-\frac{(\theta - \bar{x})^2}{2\,\sigma^2/N}\right)$$

con $\bar{x} = ${f(xbar)}$ e $\sum_k (x_k - \bar{x})^2 = ${f(S)}$. Il picco vale $p(\mathbf{X}\mid\bar{x}) = (2\pi\sigma^2)^{-N/2}\exp\left(-\frac{${f(S)}}{2\cdot ${f(sigma * sigma, 2)}}\right) = ${num(picco)}$. L'integrale di una campana di questo tipo è il picco per $\sqrt{2\pi\sigma^2/N} = ${f(larghezza)}$:

$$\int p(\mathbf{X}\mid\theta)\,d\theta = ${num(picco)}\cdot ${f(larghezza)} = ${num(area)}$$

Un numero qualunque, lontano da 1: la verosimiglianza non è una densità di probabilità su $\theta$. Nell'esempio della slide, con 12 campioni, l'area vale circa $1.07\times 10^{-7}$.`,
      }
    },
  },
  {
    id: 'es08',
    title: 'Bias e varianza di due stimatori della varianza',
    difficulty: 3,
    kind: 'numerico',
    concepts: ['c65', 'c66', 'c67', 'c68', 'c69', 'c74'],
    generate: (rng) => {
      const s2 = rng.int(1, 9)
      const N = rng.int(4, 50)
      const sigma = Math.sqrt(s2)
      const E1 = ((N - 1) / N) * s2
      const b1 = -s2 / N
      const v1 = (2 * (N - 1) * s2 * s2) / (N * N)
      const v2 = (2 * s2 * s2) / (N - 1)
      const mse1 = v1 + b1 * b1
      // simulazione Monte Carlo con lo stesso rng: 5000 training set da N campioni
      const R = 5000
      let m1 = 0
      let q1 = 0
      let m2 = 0
      let q2 = 0
      for (let r = 0; r < R; r++) {
        const xs = Array.from({ length: N }, () => rng.normal(0, sigma))
        const ss = sq(xs, media(xs))
        const a = ss / N
        const b = ss / (N - 1)
        m1 += a
        q1 += a * a
        m2 += b
        q2 += b * b
      }
      m1 /= R
      m2 /= R
      const var1 = q1 / R - m1 * m1
      const var2 = q2 / R - m2 * m2
      return {
        prompt: md`Campioni gaussiani iid con varianza vera $\sigma^2 = ${s2}$; ogni training set ha $N = ${N}$ campioni. Confronta i due stimatori

$$S_1 = \frac{1}{N}\sum_{k=1}^{N}(x_k - \bar{x})^2,\qquad S_2 = \frac{1}{N-1}\sum_{k=1}^{N}(x_k - \bar{x})^2$$

Calcola $E\{S_1\}$, il bias di $S_1$, la varianza di $S_1$ e la varianza di $S_2$.`,
        answers: [
          risposta(md`$E\{S_1\}$`, E1, tol(E1, 0.005, 0.001)),
          risposta(md`bias di $S_1$`, b1, tol(b1, 0.01, 0.0005)),
          risposta(md`$\operatorname{var}\{S_1\}$`, v1, tol(v1, 0.01, 0.001)),
          risposta(md`$\operatorname{var}\{S_2\}$`, v2, tol(v2, 0.01, 0.001)),
        ],
        solution: md`**1. Lo strumento.** Con campioni gaussiani $\frac{1}{\sigma^2}\sum_k (x_k - \bar{x})^2$ segue una chi-quadro con $N - 1$ gradi di libertà: media $N - 1$, varianza $2(N - 1)$. Gli scarti sono presi da $\bar{x}$, calcolata sugli stessi dati: si perde un grado di libertà.

**2. Stimatore $S_1$ (quello ML).**

$$E\{S_1\} = \frac{N-1}{N}\sigma^2 = \frac{${N - 1}}{${N}}\cdot ${s2} = ${f(E1, 4)},\qquad \text{bias} = E\{S_1\} - \sigma^2 = -\frac{\sigma^2}{N} = ${f(b1, 4)}$$

$$\operatorname{var}\{S_1\} = \frac{\sigma^4}{N^2}\cdot 2(N-1) = \frac{2\cdot ${N - 1}\cdot ${s2 * s2}}{${N * N}} = ${f(v1, 4)}$$

**3. Stimatore $S_2$.**

$$E\{S_2\} = \sigma^2 = ${s2}\ \ (\text{bias nullo}),\qquad \operatorname{var}\{S_2\} = \frac{2\sigma^4}{N-1} = \frac{2\cdot ${s2 * s2}}{${N - 1}} = ${f(v2, 4)}$$

**4. Lettura.** $S_2$ è non polarizzato. $S_1$ è polarizzato a $N$ finito, sottostima la varianza, ma il bias $-\sigma^2/N$ va a zero: è asintoticamente non polarizzato. Entrambe le varianze vanno a zero, quindi sono entrambi consistenti. L'errore quadratico medio di $S_1$ vale $\operatorname{var} + \text{bias}^2 = ${f(mse1, 4)}$, contro $${f(v2, 4)}$ di $S_2$: accettando un piccolo bias, $S_1$ sbaglia meno in media quadratica.

**5. Verifica Monte Carlo.** Ho generato 5000 training set da $N = ${N}$ campioni:

| stimatore | media simulata | media teorica | varianza simulata | varianza teorica |
|---|---|---|---|---|
| $S_1$ | ${f(m1, 3)} | ${f(E1, 3)} | ${f(var1, 3)} | ${f(v1, 3)} |
| $S_2$ | ${f(m2, 3)} | ${s2} | ${f(var2, 3)} | ${f(v2, 3)} |

Le differenze sono l'errore della simulazione, dell'ordine di qualche percento.`,
      }
    },
  },
  {
    id: 'es09',
    title: 'Bound di Cramér-Rao per la media di una gaussiana',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c70', 'c71', 'c72', 'c75'],
    generate: (rng) => {
      const N = rng.int(5, 100)
      const sigma = rng.float(0.5, 3, 1)
      const s2 = sigma * sigma
      const I = N / s2
      const bound = s2 / N
      const varMed = (Math.PI * s2) / (2 * N)
      const Nmed = Math.ceil((Math.PI * N) / 2)
      return {
        prompt: md`Un sensore di pressione fornisce $N = ${N}$ letture iid gaussiane con deviazione standard nota $\sigma = ${f(sigma, 1)}$ e media $\theta$ incognita. Calcola l'informazione di Fisher $I(\theta)$, il bound di Cramér-Rao, la varianza asintotica della mediana campionaria, $\frac{\pi\sigma^2}{2N}$, e quanti campioni servirebbero alla mediana per avere la stessa varianza della media campionaria con $${N}$ campioni (il minimo numero intero).`,
        answers: [
          risposta(md`$I(\theta)$`, I, tol(I, 0.005, 0.001)),
          risposta('bound di Cramér-Rao', bound, tol(bound, 0.005, 0.0001)),
          risposta('varianza della mediana', varMed, tol(varMed, 0.005, 0.0001)),
          risposta('campioni per la mediana', Nmed, 0.1),
        ],
        solution: md`**1. Derivata della log-verosimiglianza.**

$$\ln p(\mathbf{X}\mid\theta) = -\frac{N}{2}\ln(2\pi\sigma^2) - \frac{1}{2\sigma^2}\sum_{k=1}^{N}(x_k - \theta)^2,\qquad \frac{\partial \ln p(\mathbf{X}\mid\theta)}{\partial\theta} = \frac{1}{\sigma^2}\sum_{k=1}^{N}(x_k - \theta)$$

**2. Informazione di Fisher.** Elevo al quadrato e prendo la media. I termini $(x_k - \theta)^2$ valgono $\sigma^2$ in media; i doppi prodotti fra campioni indipendenti a media nulla si annullano:

$$I(\theta) = \frac{1}{\sigma^4}\,E\left\{\left(\sum_{k=1}^{N}(x_k - \theta)\right)^2\right\} = \frac{N\sigma^2}{\sigma^4} = \frac{N}{\sigma^2} = \frac{${N}}{${f(s2, 2)}} = ${f(I, 3)}$$

Stesso risultato con la derivata seconda: $-\frac{\partial^2 \ln p}{\partial\theta^2} = \frac{N}{\sigma^2}$.

**3. Bound.** $\operatorname{var}\{\varepsilon\} \ge [I(\theta)]^{-1} = \frac{\sigma^2}{N} = ${num(bound)}$, cioè una deviazione standard di almeno $\frac{\sigma}{\sqrt{N}} = ${f(Math.sqrt(bound), 4)}$.

**4. Media campionaria.** $E\{\bar{x}\} = \theta$ e $\operatorname{var}\{\bar{x}\} = \frac{\sigma^2}{N} = ${num(bound)}$: è non polarizzata e raggiunge il bound, quindi è efficiente. È anche la stima ML.

**5. Mediana.** Varianza asintotica $\frac{\pi\sigma^2}{2N} = ${num(varMed)}$, $\frac{\pi}{2} \approx 1.57$ volte il bound: non è efficiente. Per scendere a $\frac{\sigma^2}{${N}}$ le servono $M$ campioni con $\frac{\pi\sigma^2}{2M} \le \frac{\sigma^2}{${N}}$, cioè $M \ge \frac{\pi}{2}\cdot ${N} = ${f((Math.PI * N) / 2, 2)}$: almeno ${Nmed} campioni. In cambio la mediana resiste meglio agli outlier.`,
      }
    },
  },
  {
    id: 'es10',
    title: 'MLE contro BE: compila la tabella',
    difficulty: 1,
    kind: 'concettuale',
    concepts: ['c60', 'c61', 'c62', 'c63', 'c64', 'c79'],
    generate: (rng) => {
      const frasi = [
        { txt: md`$\boldsymbol{\theta}$ è una costante fissa ma incognita`, cod: 1 },
        { txt: md`$\boldsymbol{\theta}$ è una variabile aleatoria con una distribuzione a priori nota`, cod: 2 },
        { txt: 'usa solo i campioni osservati', cod: 1 },
        { txt: 'combina i campioni con la distribuzione a priori', cod: 2 },
        { txt: 'massimizza una funzione obiettivo basata solo sui dati', cod: 1 },
        { txt: 'produce una densità a posteriori con il teorema di Bayes', cod: 2 },
        { txt: 'restituisce un valore puntuale nello spazio dei parametri', cod: 1 },
        { txt: "fornisce una descrizione probabilistica completa dell'incertezza sul parametro", cod: 2 },
        { txt: 'è spesso preferita per il costo computazionale più basso e la più facile interpretazione', cod: 1 },
        { txt: 'permette di incorporare conoscenze o convinzioni a priori sui parametri', cod: 2 },
      ]
      const scelte = estrai(rng, frasi, 6)
      const N = rng.int(5, 40)
      const xbar = rng.float(2, 4, 2)
      return {
        prompt: md`Attribuisci ogni affermazione alla procedura giusta: 1 = stima a massima verosimiglianza (MLE), 2 = stima bayesiana (BE).

${scelte.map((s, i) => `- **${lettere[i]}.** ${s.txt}`).join('\n')}

Domanda bonus: $N = ${N}$ campioni gaussiani con $\sigma$ nota hanno media $\bar{x} = ${f(xbar, 2)}$. Con un prior uniforme su $\theta$, dove sta il massimo del posterior?`,
        answers: [...scelte.map((s, i) => risposta(`affermazione ${lettere[i]}`, s.cod, 0.1)), risposta('massimo del posterior', xbar, 0.005)],
        solution: md`${scelte.map((s, i) => `- **${lettere[i]}** → ${s.cod === 1 ? 'MLE' : 'BE'}.`).join('\n')}

| | Maximum Likelihood Estimation | Bayesian Estimation |
|---|---|---|
| natura di $\boldsymbol{\theta}$ | costante fissa ma incognita | variabile aleatoria con prior noto |
| informazione usata | solo i campioni osservati | campioni più distribuzione a priori |
| obiettivo | massimizzare la verosimiglianza, funzione obiettivo basata solo sui dati | ottenere la densità a posteriori con il teorema di Bayes |
| risultato | un valore puntuale | una descrizione probabilistica completa dell'incertezza |

**Quando scelgo l'una o l'altra.** Con una conoscenza a priori affidabile e pochi campioni la BE la sfrutta; senza un prior credibile, o quando contano calcolo e interpretabilità, la MLE.

**Bonus.** Con prior costante $p(\theta\mid\mathbf{X}) \propto p(\mathbf{X}\mid\theta)$: il posterior ha la forma della verosimiglianza e lo stesso massimo, $\hat{\theta}_{ML} = \bar{x} = ${f(xbar, 2)}$. È uno dei due casi in cui ML e Bayes danno la stessa soluzione; l'altro è il limite di infiniti campioni di training.`,
      }
    },
  },
  {
    id: 'es11',
    title: 'Consistente o no?',
    difficulty: 3,
    kind: 'dimostrazione',
    concepts: ['c73', 'c74', 'c76', 'c77'],
    generate: (rng) => {
      const s2 = rng.int(1, 9)
      const N = rng.pick([10, 25, 50, 100])
      const c = rng.pick([0.5, 1, -1, 2])
      const tipi = [
        { tex: md`\bar{x}`, nome: 'la media campionaria', bias: 0, biasTex: '0', v: s2 / N, vTex: md`\frac{\sigma^2}{N}`, cons: 1, motivo: 'bias nullo e varianza che va a zero' },
        { tex: md`x_1`, nome: 'il solo primo campione', bias: 0, biasTex: '0', v: s2, vTex: md`\sigma^2`, cons: 0, motivo: md`non polarizzato, ma la varianza resta $\sigma^2$ per ogni $N$: la probabilità di sbagliare di più di $\delta$ non scende` },
        { tex: md`\bar{x} ${piu(c, 1)}`, nome: 'la media campionaria più una costante', bias: c, biasTex: f(c, 1), v: s2 / N, vTex: md`\frac{\sigma^2}{N}`, cons: 0, motivo: md`la varianza va a zero ma il bias resta $${f(c, 1)}$: la stima si concentra attorno al valore sbagliato` },
        { tex: md`\bar{x} + \frac{1}{N}`, nome: 'la media campionaria più 1/N', bias: 1 / N, biasTex: md`\frac{1}{N}`, v: s2 / N, vTex: md`\frac{\sigma^2}{N}`, cons: 1, motivo: 'bias e varianza vanno entrambi a zero' },
      ]
      const ordine = rng.shuffle(tipi)
      const conBias = ordine.map((t, i) => ({ t, i })).filter(({ t }) => t.bias !== 0)
      const mse = (t: (typeof tipi)[number]) => t.v + t.bias * t.bias
      return {
        prompt: md`Campioni iid con media $\theta$ e varianza $\sigma^2 = ${s2}$. Quattro stimatori della media:

${ordine.map((t, i) => `- **${lettere[i]}.** $\\hat{\\theta}_${lettere[i]} = ${t.tex}$`).join('\n')}

Per ciascuno calcola bias e varianza in funzione di $N$ e stabilisci se è consistente (1 = sì, 0 = no), usando le condizioni delle note e la disuguaglianza di Chebyshev. Poi calcola l'errore quadratico medio $E\{\varepsilon^2\}$ degli stimatori polarizzati per $N = ${N}$.`,
        answers: [
          ...ordine.map((t, i) => risposta(`${lettere[i]} consistente (1 = sì, 0 = no)`, t.cons, 0.1)),
          ...conBias.map(({ t, i }) => risposta(md`$E\{\varepsilon^2\}$ di ${lettere[i]} con $N = ${N}$`, mse(t), tol(mse(t), 0.005, 0.0005))),
        ],
        solution: md`**1. Le condizioni.** Uno stimatore è consistente se $\lim_{N\to+\infty} P\{\vert\varepsilon\vert \lt \delta\} = 1$ per ogni $\delta > 0$. Le note chiedono non polarizzazione asintotica e varianza che tende a zero. Che bastino lo dice Chebyshev:

$$P\{\vert\varepsilon\vert \ge \delta\} \le \frac{E\{\varepsilon^2\}}{\delta^2} = \frac{\operatorname{var}\{\varepsilon\} + \left(E\{\varepsilon\}\right)^2}{\delta^2}$$

Se bias e varianza vanno a zero, il membro destro va a zero per ogni $\delta$.

**2. Tabella** (media campionaria: $E\{\bar{x}\} = \theta$, $\operatorname{var}\{\bar{x}\} = \sigma^2/N$).

| stimatore | bias | varianza | $E\{\varepsilon^2\}$ con $N = ${N}$ | consistente |
|---|---|---|---|---|
${ordine.map((t, i) => `| ${lettere[i]}: $${t.tex}$ | $${t.biasTex}$ | $${t.vTex}$ | ${f(mse(t), 4)} | ${t.cons === 1 ? 'sì' : 'no'} |`).join('\n')}

${ordine.map((t, i) => `- **${lettere[i]}**, ${t.nome}: ${t.motivo}.`).join('\n')}

**3. Una precisione.** Le due condizioni sono sufficienti ma, a rigore, non necessarie: lo stimatore che una volta su $N$ aggiunge $N$ alla media campionaria ha bias costante 1, eppure sbaglia di più di $\delta$ con probabilità al più $\frac{1}{N} + P\{\vert\bar{x} - \theta\vert \ge \delta\} \to 0$. All'orale riporto la formulazione del docente e, se serve, lo preciso.`,
      }
    },
  },
  {
    id: 'es12',
    title: 'Dove serve la stima nello schema a blocchi',
    difficulty: 1,
    kind: 'concettuale',
    concepts: ['c15', 'c19', 'c20', 'c21', 'c22', 'c23', 'c24', 'c25', 'c26', 'c27'],
    generate: (rng) => {
      const compiti = [
        { txt: 'stimare media e deviazione standard di ogni feature per normalizzarle', cod: 1 },
        { txt: 'stimare la varianza del rumore di un sensore per poterlo attenuare', cod: 1 },
        { txt: 'sostituire i valori mancanti con una stima tratta dalla distribuzione della feature', cod: 1 },
        { txt: "ricavare poche feature compatte dalle centinaia di bande di un'immagine iperspettrale analizzandone le proprietà statistiche", cod: 2 },
        { txt: 'costruire una rappresentazione compatta e informativa dei dati grezzi per i blocchi successivi', cod: 2 },
        { txt: 'misurare la dispersione della luminosità dentro la sagoma del pesce come descrittore', cod: 2 },
        { txt: 'stimare le densità condizionate della luminosità di salmone e spigola da usare nel classificatore', cod: 3 },
        { txt: "apprendere la distribuzione dei battiti ECG normali per riconoscere quelli patologici", cod: 3 },
        { txt: 'stimare le probabilità delle classi per migliorare la decisione del classificatore', cod: 3 },
      ]
      const uscite = [
        { txt: "assegnare ogni pixel di un'immagine satellitare ad acqua, vegetazione, suolo o urbano", cod: 1 },
        { txt: 'riconoscere la specie di un pesce sul nastro', cod: 1 },
        { txt: "stabilire se in un radargramma c'è un oggetto sepolto", cod: 2 },
        { txt: "accorgersi se nel segnale di un sensore compare un'anomalia", cod: 2 },
        { txt: 'prevedere la radiazione solare di domani', cod: 3 },
        { txt: "prevedere il consumo elettrico della prossima ora", cod: 3 },
      ]
      const sc = estrai(rng, compiti, 4)
      const us = estrai(rng, uscite, 2)
      const blocchi = ['', 'Pre-processing', 'Feature Extraction', 'Recognition']
      const tipi = ['', 'Classification', 'Detection', 'Prediction']
      return {
        prompt: md`Nello schema Physical World → Acquisition → Pre-processing → Feature Extraction → Recognition → Post-recognition → Decision il docente indica tre blocchi con «Statistical estimation can be necessary here». A quale blocco appartiene ciascun compito? Codici: 1 = Pre-processing, 2 = Feature Extraction, 3 = Recognition.

${sc.map((s, i) => `- **${lettere[i]}.** ${s.txt}`).join('\n')}

Poi, nello schema Information Source → Observation Space → Statistical Modeling & Estimation → Output, di che tipo è l'uscita? Codici: 1 = Classification, 2 = Detection, 3 = Prediction.

${us.map((u, i) => `- **${lettere[i + 4]}.** ${u.txt}`).join('\n')}`,
        answers: [...sc.map((s, i) => risposta(`compito ${lettere[i]}`, s.cod, 0.1)), ...us.map((u, i) => risposta(`uscita ${lettere[i + 4]}`, u.cod, 0.1))],
        solution: md`${sc.map((s, i) => `- **${lettere[i]}** → ${s.cod}, ${blocchi[s.cod]}.`).join('\n')}
${us.map((u, i) => `- **${lettere[i + 4]}** → ${u.cod}, ${tipi[u.cod]}.`).join('\n')}

**I tre blocchi.** Acquisition, Post-recognition e Decision non hanno la freccia.

- *Pre-processing*: normalizzazione dei dati, riduzione del rumore, gestione dei valori mancanti, perché i dati in ingresso siano puliti e adatti alle elaborazioni successive.
- *Feature Extraction*: feature significative ricavate dai dati grezzi analizzandone le proprietà statistiche, una rappresentazione compatta e informativa per i compiti a valle.
- *Recognition*: identificare pattern, apprendere distribuzioni di probabilità, migliorare le decisioni.

**Il secondo schema.** La sorgente di informazione produce osservazioni o misure del mondo reale (sensori, immagini, testo). Lo spazio delle osservazioni è l'insieme di tutte le osservazioni possibili, dati grezzi e forse rumorosi. Il blocco di modellazione statistica e stima modella le distribuzioni sottostanti, con un approccio parametrico o non parametrico scelto dal progettista. L'uscita può essere:

- *Classification*: assegnare i dati a una tra più categorie predefinite;
- *Detection*: stabilire presenza o assenza di un pattern o di un segnale;
- *Prediction*: prevedere esiti futuri in base al modello appreso.`,
      }
    },
  },
  {
    id: 'es13',
    title: 'Simulazione d’orale: la likelihood in tre minuti',
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c51', 'c52', 'c53', 'c61', 'c62', 'c67', 'c68', 'c70', 'c72', 'c76'],
    generate: (rng) => {
      const sigma = rng.pick([0.5, 1, 2])
      const c = rng.float(1, 4, 1)
      const xs = Array.from({ length: 3 }, () => Number((c + sigma * rng.float(-1, 1, 1)).toFixed(2)))
      const theta = Number((c + sigma * rng.float(-0.5, 0.5, 1)).toFixed(2))
      const dens = xs.map((x) => gauss(x, theta, sigma))
      const L = dens[0] * dens[1] * dens[2]
      const l = Math.log(L)
      const xbar = media(xs)
      const bound = (sigma * sigma) / 3
      return {
        prompt: md`Melgani ti chiede, in sequenza: scrivi la formula della verosimiglianza; perché puoi usare il prodotto delle probabilità dei singoli campioni; che cosa descrive la verosimiglianza; come si descrive la bontà di una stima; in che cosa differiscono ML e stima bayesiana. Rispondi a voce, poi confronta con la griglia della soluzione.

Per fissare le idee con i numeri: tre campioni $\{${elenco(xs, 2)}\}$ da una gaussiana con $\sigma = ${f(sigma)}$ nota. Calcola $p(\mathbf{X}\mid\theta)$ e $l(\theta)$ per $\theta = ${f(theta, 2)}$, la stima ML $\hat{\theta}$ e il bound di Cramér-Rao per la sua varianza.`,
        answers: [
          risposta(md`$p(\mathbf{X}\mid\theta)$`, L, tol(L, 0.01, 1e-6)),
          risposta(md`$l(\theta)$`, l, tol(l, 0.003, 0.01)),
          risposta(md`$\hat{\theta}$`, xbar, 0.005),
          risposta('bound di Cramér-Rao', bound, tol(bound, 0.005, 0.0005)),
        ],
        solution: md`**I numeri.** Le tre densità valgono $p(x_k\mid\theta) = ${dens.map((d) => num(d)).join(',\\ ')}$. Con campioni iid le moltiplico:

$$p(\mathbf{X}\mid\theta) = \prod_{k=1}^{3} p(x_k\mid\theta) = ${num(L)},\qquad l(\theta) = \sum_{k=1}^{3}\ln p(x_k\mid\theta) = ${f(l)}$$

La stima ML è la media campionaria, $\hat{\theta} = ${f(xbar)}$. È non polarizzata, con varianza $\frac{\sigma^2}{N} = \frac{${f(sigma * sigma, 2)}}{3} = ${f(bound, 4)}$, uguale al bound di Cramér-Rao $[I(\theta)]^{-1}$ con $I(\theta) = N/\sigma^2$: è efficiente.

**Risposta modello, in breve.**

1. La verosimiglianza è $p(\mathbf{X}\mid\boldsymbol{\theta}) = \prod_{k=1}^{N} p(\mathbf{x}_k\mid\boldsymbol{\theta})$ e la stima ML è $\hat{\boldsymbol{\theta}} = \arg\max_{\boldsymbol{\theta}} p(\mathbf{X}\mid\boldsymbol{\theta})$.
2. Il prodotto: $p(\mathbf{X}\mid\boldsymbol{\theta})$ è la congiunta; l'indipendenza (a $\boldsymbol{\theta}$ fissato) la fattorizza nelle marginali, l'identica distribuzione le rende tutte la stessa $p(\cdot\mid\boldsymbol{\theta})$.
3. Descrive la compatibilità (*compatibility/agreement*) tra $\boldsymbol{\theta}$ e $\mathbf{X}$: quanto bene il modello spiega i campioni. Non è una densità in $\boldsymbol{\theta}$.
4. Bontà: $\hat{\boldsymbol{\theta}}(\mathbf{X})$ è aleatoria; errore $\boldsymbol{\varepsilon} = \hat{\boldsymbol{\theta}} - \boldsymbol{\theta}$; ideale non polarizzata e senza varianza; bias $E\{\boldsymbol{\varepsilon}\}$; varianza con pavimento di Cramér-Rao $[\mathbf{I}^{-1}(\boldsymbol{\theta})]_{ii}$; efficiente se lo raggiunge; per $N \to +\infty$ non polarizzazione ed efficienza asintotiche e consistenza.
5. ML: $\boldsymbol{\theta}$ fisso ma incognito, solo i dati, un punto. Bayes: $\boldsymbol{\theta}$ aleatorio con prior, posterior con il teorema di Bayes, una distribuzione. Coincidono con infiniti campioni o prior uniforme.

**Griglia di autovalutazione.** Ho scritto la produttoria con gli estremi $k = 1$ e $N$ e la notazione $p(\mathbf{X}\mid\boldsymbol{\theta})$? Ho detto queste parole chiave: *iid*, *compatibility/agreement*, *fixed but unknown*, *prior*, *posterior*, *unbiased*, *efficient*, *consistent*? Un punto per ciascuna: sotto 8 su 10, ripassa la parte mancante.`,
      }
    },
  },
  {
    id: 'es14',
    title: 'Overfitting: riconoscilo e spiegalo',
    difficulty: 1,
    kind: 'concettuale',
    concepts: ['c01', 'c02', 'c03'],
    generate: (rng) => {
      const eR = rng.int(6, 10)
      const eD = rng.int(2, 5)
      const tD = eD + rng.int(1, 2)
      const tR = Math.max(eR + rng.int(0, 2), tD + 1)
      const tT = tR + rng.int(3, 8)
      const modelli = rng.shuffle([
        { nome: 'una retta (pendenza e intercetta)', train: eR, test: tR, tipo: 'retta' },
        { nome: 'una curva dolce', train: eD, test: tD, tipo: 'dolce' },
        { nome: 'una curva tortuosa che separa perfettamente i campioni di training', train: 0, test: tT, tipo: 'tortuosa' },
      ])
      const iO = modelli.findIndex((m) => m.tipo === 'tortuosa')
      const iB = modelli.findIndex((m) => m.tipo === 'dolce')
      const Nnuovi = rng.pick([200, 500, 1000])
      const erroriB = (tD / 100) * Nnuovi
      return {
        prompt: md`Sullo stesso training set di salmoni e spigole (feature: luminosità e larghezza) addestri tre confini di decisione e poi li provi su pesci nuovi:

${modelli.map((m, i) => `${i + 1}. ${m.nome}: errore sul training ${m.train}%, errore sui pesci nuovi ${m.test}%`).join('\n')}

Quale modello è in overfitting (scrivi il suo numero)? Quanto vale la differenza tra il suo errore sui pesci nuovi e quello sul training (in punti percentuali)? Quale modello sceglieresti? Quanti errori ti aspetti che faccia su ${Nnuovi} pesci nuovi?`,
        answers: [
          risposta('modello in overfitting', iO + 1, 0.1),
          risposta('divario (punti percentuali)', tT, 0.1),
          risposta('modello da scegliere', iB + 1, 0.1),
          risposta(`errori su ${Nnuovi} pesci`, erroriB, 0.6),
        ],
        solution: md`**Overfitting: il modello ${iO + 1}.** Ha zero errori sul training e il peggiore errore sui pesci nuovi, ${tT}%: un divario di ${tT} punti. Un modello molto flessibile migliora l'adattamento ai dati di training ma rischia di impararli troppo bene, compreso il rumore presente nelle feature e nelle etichette, che possono contenere errori umani. Memorizza i campioni invece di generalizzare a dati nuovi, mai visti.

**Il modello da scegliere: il ${iB + 1}**, la curva dolce, con l'errore più basso sui pesci nuovi (${tD}%). La retta è troppo semplice e sbaglia anche sul training (${eR}%). Su ${Nnuovi} pesci nuovi mi aspetto circa $${f(tD / 100, 2)}\cdot ${Nnuovi} = ${f(erroriB, 1)}$ errori.

**La regola.** Non bisogna adattare troppo il classificatore ai campioni di training: serve un compromesso tra complessità del modello e capacità di generalizzazione. Si parte da modelli semplici, più robusti, e si aumenta la complessità solo se non bastano. L'errore sul training scende sempre con la complessità; quello sui dati nuovi scende e poi risale. Per accorgermene misuro l'errore su dati non usati per addestrare.`,
      }
    },
  },
  {
    id: 'es15',
    title: 'Discreta più continua: che cosa diventa y?',
    difficulty: 2,
    kind: 'concettuale',
    concepts: ['c08', 'c10', 'c11', 'c12', 'c13'],
    generate: (rng) => {
      const sn = rng.pick([0.03, 0.05, 0.07, 0.09, 0.15, 0.2, 0.25])
      const y0 = rng.float(0.2, 0.8, 2)
      const livelli = [0.25, 0.5, 0.75]
      const cond = livelli.map((a) => gauss(y0, a, sn))
      const py = cond.reduce((s, v) => s + v, 0) / 3
      const post = cond[0] / (cond[0] + cond[1] + cond[2])
      const mode = contaMode(livelli, sn)
      return {
        prompt: md`Nel canale PAM delle note $x$ vale $0.25$ (Yes), $0.5$ (Maybe) o $0.75$ (No), ciascuno con probabilità $\frac{1}{3}$, e il rumore $n$ è gaussiano a media nulla con $\sigma_n = ${f(sn, 2)}$, indipendente da $x$. Il ricevitore osserva $y = x + n$.

Spiega perché $y$ ha una densità mentre $x$ ha solo una distribuzione di probabilità e scrivi la densità di $y$ come convoluzione. Poi calcola, per $y_0 = ${f(y0, 2)}$: la densità $p_y(y_0)$, la probabilità $P(\text{Yes}\mid y_0)$ e il numero di gobbe (massimi locali) di $p_y$.`,
        answers: [
          risposta(md`$p_y(y_0)$`, py, tol(py, 0.01, 1e-5)),
          risposta(md`$P(\text{Yes}\mid y_0)$`, post, tol(post, 0.01, 0.002)),
          risposta('numero di gobbe', mode, 0.1),
        ],
        solution: md`**1. Discreta più continua.** $x$ assume solo tre valori: ha una distribuzione di probabilità, cioè tre masse di $\frac{1}{3}$. $n$ è continua. Se sommo una variabile continua a una indipendente, qualunque essa sia, ottengo una variabile continua: $y$ ha quindi una densità (PDF).

**2. Convoluzione.** Per l'indipendenza la densità di $y$ è la convoluzione di $P_x$ con $p_n$. Convolvere tre impulsi di massa $\frac{1}{3}$ con una campana vuol dire copiare la campana su ogni livello e pesarla $\frac{1}{3}$:

$$p_y(y) = \sum_{i=1}^{3} P_x(a_i)\,p_n(y - a_i) = \frac{1}{3}\left[p_n(y - 0.25) + p_n(y - 0.5) + p_n(y - 0.75)\right]$$

Ogni addendo è una densità condizionata: $p(y\mid\text{Yes}) = p_n(y - 0.25)$, una gaussiana centrata in $0.25$ con dispersione data dal rumore.

**3. In $y_0 = ${f(y0, 2)}$.** Le tre condizionate valgono $p(y_0\mid\text{Yes}) = ${num(cond[0])}$, $p(y_0\mid\text{Maybe}) = ${num(cond[1])}$, $p(y_0\mid\text{No}) = ${num(cond[2])}$. Quindi

$$p_y(y_0) = \frac{1}{3}\left(${num(cond[0])} + ${num(cond[1])} + ${num(cond[2])}\right) = ${num(py)}$$

$$P(\text{Yes}\mid y_0) = \frac{\frac{1}{3}\,p(y_0\mid\text{Yes})}{p_y(y_0)} = \frac{p(y_0\mid\text{Yes})}{\sum_{i=1}^{3} p(y_0\mid a_i)} = \frac{${num(cond[0])}}{${num(cond[0] + cond[1] + cond[2])}} = ${num(post)}$$

Nel caso ideale le probabilità condizionate valevano 0 oppure 1; con il rumore diventano numeri intermedi, e la decisione non è più certa.

**4. Forma della densità.** Con $\sigma_n = ${f(sn, 2)}$ la densità di $y$ ha ${mode === 1 ? 'una sola gobba' : `${mode} gobbe`}. ${mode === 3 ? 'Il rumore è piccolo rispetto alla distanza fra i livelli ($0.25$): tre campane separate, una per simbolo.' : 'Il rumore è grande rispetto alla distanza fra i livelli ($0.25$): le tre campane si fondono in una collina sola e da $y$ è difficile risalire al simbolo.'} La soglia fra i due regimi è circa $\sigma_n = 0.121$.`,
      }
    },
  },
  {
    id: 'es16',
    title: 'Formula il problema della stima di pdf con la notazione del docente',
    difficulty: 1,
    kind: 'concettuale',
    concepts: ['c16', 'c17', 'c34', 'c35', 'c37', 'c49', 'c50', 'c54'],
    generate: (rng) => {
      const n = rng.int(2, 5)
      const N = rng.pick([50, 100, 250, 500])
      const rPiena = n + (n * (n + 1)) / 2
      const rDiag = 2 * n
      const rIso = n + 1
      return {
        prompt: md`Un drone acquisisce $N = ${N}$ pixel di un campo, ognuno descritto dalla riflettanza in $n = ${n}$ bande. Scrivi con la notazione delle slide: il vettore delle feature e l'insieme di training, con il significato di $n$, $N$ e dell'ipotesi iid; l'obiettivo della stima; per il caso parametrico il vettore $\boldsymbol{\theta}$, $r$ e $p(\mathbf{x}\mid\boldsymbol{\theta})$.

Poi, se modelli i pixel con una gaussiana in $n = ${n}$ dimensioni, quanti parametri $r$ stimi con covarianza piena? E con covarianza diagonale? E con covarianza $\sigma^2 I$, uguale in tutte le bande? Quanti numeri contiene in tutto l'insieme di training?`,
        answers: [
          risposta('r con covarianza piena', rPiena, 0.1),
          risposta('r con covarianza diagonale', rDiag, 0.1),
          risposta(md`$r$ con covarianza $\sigma^2 I$`, rIso, 0.1),
          risposta('numeri nel training set', N * n, 0.1),
        ],
        solution: md`**Notazione.**

- $\mathbf{x} = (x_1, x_2, \dots, x_n)$: vettore di $n = ${n}$ feature con pdf incognita $p(\mathbf{x})$, la densità congiunta delle bande.
- $\mathbf{X} = \{\mathbf{x}_1, \mathbf{x}_2, \dots, \mathbf{x}_N\}$: $N = ${N}$ campioni di training, indipendenti e identicamente distribuiti, estratti da $p(\mathbf{x})$. In tutto $N \cdot n = ${N * n}$ numeri. $n$ minuscolo conta le feature, $N$ maiuscolo i campioni.
- Obiettivo: una stima $\hat{p}(\mathbf{x})$, costruita sui campioni $\mathbf{X}$, il più vicina possibile alla pdf vera $p(\mathbf{x})$. È l'obiettivo del capitolo: stimare la distribuzione statistica di un segnale stocastico da un insieme di osservazioni.
- Caso parametrico: il modello ha $r$ parametri, $\boldsymbol{\theta} = (\theta_1, \theta_2, \dots, \theta_r)$, e scrivo $p(\mathbf{x}\mid\boldsymbol{\theta})$ per sottolineare la dipendenza.

**Parametri della gaussiana.** Il vettore medio ha $n$ componenti. La covarianza piena è simmetrica: contano gli elementi sulla diagonale e sopra, $\frac{n(n+1)}{2}$.

$$r_{\text{piena}} = n + \frac{n(n+1)}{2} = ${n} + ${(n * (n + 1)) / 2} = ${rPiena},\qquad r_{\text{diag}} = n + n = ${rDiag},\qquad r_{\sigma^2 I} = n + 1 = ${rIso}$$

Con due feature la covarianza piena dà $r = 5$: due medie, due varianze e una covarianza.

**La figura 3D della slide introduttiva.** Sul piano ci sono le feature $x_1$ e $x_2$, in verticale $p(\mathbf{x})$: la distribuzione da stimare è una superficie sopra lo spazio delle feature; più superfici a campana si leggono come densità di classi diverse, che si sovrappongono in parte.

**I parametri che più probabilmente hanno generato i campioni.** Al variare di $\boldsymbol{\theta}$ la verosimiglianza $p(\mathbf{X}\mid\boldsymbol{\theta})$ dice quanto ogni candidato rende plausibili i campioni osservati; analizzandola, e cercandone il massimo, individuo i parametri che si adattano meglio ai dati. È il ponte verso la stima a massima verosimiglianza.`,
      }
    },
  },
  {
    id: 'es17',
    title: 'Canale PAM ideale: decodifica e probabilità',
    difficulty: 1,
    kind: 'numerico',
    concepts: ['c05', 'c06', 'c07', 'c08'],
    generate: (rng) => {
      const livelli = [0.25, 0.5, 0.75]
      const simboli = ['Yes', 'Maybe', 'No']
      const seq = Array.from({ length: 8 }, () => rng.int(0, 2))
      const conta = [0, 1, 2].map((s) => seq.filter((v) => v === s).length)
      const k = rng.int(2, 8)
      const tk = k - 0.5
      const prior = rng.pick([
        [0.5, 0.3, 0.2],
        [0.2, 0.3, 0.5],
        [0.6, 0.2, 0.2],
        [0.4, 0.4, 0.2],
      ])
      const attesi = 8 * prior[0]
      return {
        prompt: md`Il campionatore di un ricevitore PAM senza rumore legge, al centro degli impulsi, le ampiezze

$$${seq.map((v) => f(livelli[v], 2)).join(',\\ ')}$$

Decodifica la sequenza con il classificatore ideale e conta quanti Yes, Maybe e No contiene. A che istante, in multipli di $T$, viene letto il campione numero ${k}? Infine, se la sorgente emettesse i simboli con prior $P(\text{Yes}) = ${f(prior[0])}$, $P(\text{Maybe}) = ${f(prior[1])}$, $P(\text{No}) = ${f(prior[2])}$, quanti Yes ti aspetteresti in media su 8 simboli?`,
        answers: [
          risposta('numero di Yes', conta[0], 0.1),
          risposta('numero di Maybe', conta[1], 0.1),
          risposta('numero di No', conta[2], 0.1),
          risposta(md`istante del campione ${k} (in $T$)`, tk, 0.01),
          risposta('Yes attesi su 8', attesi, 0.01),
        ],
        solution: md`**1. Il sistema.** La sorgente emette Yes, Maybe, No; il modulatore PAM trasforma ogni simbolo in un impulso rettangolare di durata $T$ e ampiezza $0.25$ (Yes), $0.5$ (Maybe) o $0.75$ (No); il canale lo porta al ricevitore; il campionatore legge un valore per impulso (le note: «every x.5T», che si legge come il centro di ogni impulso, negli istanti $t_j = (j + 0.5)T$ con $j = 0, 1, 2, \dots$); il classificatore decide il simbolo.

**2. Decodifica.** Il classificatore ideale lavora sui valori esatti: $0.25 \to$ Yes, $0.5 \to$ Maybe, $0.75 \to$ No.

$$${seq.map((v) => md`\text{${simboli[v]}}`).join(',\\ ')}$$

Yes: ${conta[0]}, Maybe: ${conta[1]}, No: ${conta[2]}.

**3. Istante.** Il campione numero ${k} ha indice $j = ${k - 1}$: $t_{${k - 1}} = (${k - 1} + 0.5)T = ${f(tk, 1)}\,T$.

**4. Probabilità.** Il valore campionato $Y_s$ è una variabile aleatoria discreta con tre valori. Con simboli equiprobabili $P(Y_s = 0.25) = P(Y_s = 0.5) = P(Y_s = 0.75) = \frac{1}{3}$. Le condizionate sono 0 oppure 1:

$$P(Y_s = a\mid s) = \begin{array}{c|ccc} & \text{Yes} & \text{Maybe} & \text{No}\\ \hline 0.25 & 1 & 0 & 0\\ 0.5 & 0 & 1 & 0\\ 0.75 & 0 & 0 & 1\end{array}$$

**5. Prior diversi.** Con $P(\text{Yes}) = ${f(prior[0])}$ mi aspetto in media $8\cdot ${f(prior[0])} = ${f(attesi, 2)}$ Yes. Cambiano solo le frequenze attese dei simboli, e con esse le probabilità dei valori campionati: $P(Y_s = 0.25) = \sum_s P(Y_s = 0.25\mid s)\,P(s) = P(\text{Yes})$. Le condizionate restano 0 oppure 1, quindi la regola di decisione non cambia: senza rumore non c'è incertezza da modellare e nulla da stimare.`,
      }
    },
  },
  {
    id: 'es18',
    title: 'ML statistico o non statistico? E che cosa fare con i dati incompleti',
    difficulty: 1,
    kind: 'concettuale',
    concepts: ['c33', 'c38'],
    generate: (rng) => {
      const metodi = [
        { txt: 'classificatore bayesiano con densità gaussiane stimate a massima verosimiglianza', cod: 1, why: 'le densità di classe sono il cuore del modello' },
        { txt: 'stima di densità con le finestre di Parzen', cod: 1, why: 'il risultato è proprio una stima della PDF' },
        { txt: 'rete neurale profonda addestrata end-to-end sulle immagini', cod: 0, why: 'impara i pattern dai dati senza un modello probabilistico esplicito della PDF' },
        { txt: 'perceptron', cod: 0, why: 'cerca un iperpiano che separa le classi, senza stimare alcuna densità' },
        { txt: 'K-NN usato come stimatore di densità', cod: 1, why: md`produce una stima della PDF, $\hat{p} = K/(NV)$` },
        { txt: 'classificatore MAP con prior e verosimiglianze stimate dai dati', cod: 1, why: 'decide con prior e densità condizionate stimate' },
        { txt: 'support vector machine', cod: 0, why: 'massimizza il margine fra le classi senza modellare la PDF' },
      ]
      const scelti = estrai(rng, metodi, 5)
      const N = rng.pick([100, 200, 400])
      const q = rng.pick([0.1, 0.2, 0.3])
      const incompleti = Math.round(q * N)
      const tenute = N - incompleti
      const buttati = incompleti
      const misurati = 2 * N - incompleti
      return {
        prompt: md`**Parte 1.** Per ogni metodo scrivi 1 se rientra nel machine learning statistico (la PDF ha un ruolo chiave) o 0 se è non statistico (non richiede esplicitamente la PDF).

${scelti.map((m, i) => `- **${lettere[i]}.** ${m.txt}`).join('\n')}

**Parte 2.** Hai $N = ${N}$ letture bivariate (temperatura e umidità di un sensore IoT); nel ${f(q * 100)}% delle righe manca uno dei due valori. Se scarti tutte le righe incomplete, quante righe restano? Quanti valori effettivamente misurati butti via?`,
        answers: [...scelti.map((m, i) => risposta(`metodo ${lettere[i]}`, m.cod, 0.1)), risposta('righe che restano', tenute, 0.1), risposta('valori misurati buttati', buttati, 0.1)],
        solution: md`**Parte 1.** Nel machine learning statistico la PDF ha un ruolo chiave per modellare i dati e fare previsioni: stimarla permette di inferire pattern e relazioni. Il non statistico, come certe reti profonde, impara i pattern con approcci guidati dai dati senza assumere un modello probabilistico sottostante.

${scelti.map((m, i) => `- **${lettere[i]}** → ${m.cod}: ${m.why}.`).join('\n')}

**Parte 2.** Le righe incomplete sono $${f(q)}\cdot ${N} = ${incompleti}$: ne restano $${tenute}$. Ognuna delle righe scartate conteneva un valore misurato: butto via ${buttati} misure su ${misurati}, una quota del ${f((buttati / misurati) * 100, 1)}% dell'informazione raccolta. Il principio delle note è l'opposto: massimizzare l'uso di tutta l'informazione disponibile, anche con dati incompleti o imperfetti. L'algoritmo del capitolo per questo caso è l'EM (*Expectation-Maximization*, ch2 p.72-73). Passo E: con i parametri correnti $\boldsymbol{\theta}^{(k)}$ calcola il valore atteso della log-verosimiglianza dei dati completi rispetto ai valori mancanti, dati quelli osservati, $Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)}) = E\{\log p(\mathbf{X}, \mathbf{Y}\mid\boldsymbol{\theta})\mid \mathbf{X}, \boldsymbol{\theta}^{(k)}\}$. Per una gaussiana bivariata servono le statistiche sufficienti attese: per una riga senza umidità $x_m$ non basta $E\{x_m\mid x_o\}$, servono anche $E\{x_m^2\mid x_o\}$ ed $E\{x_m x_o\mid x_o\}$. Se sostituisci il mancante con la sola media condizionata e ristimi, varianza e covarianza escono sottostimate. Passo M: massimizza $Q$ rispetto ai parametri, $\boldsymbol{\theta}^{(k+1)} = \arg\max Q(\boldsymbol{\theta}, \boldsymbol{\theta}^{(k)})$. Poi si ripete con i nuovi parametri.`,
      }
    },
  },
  {
    id: 'es19',
    title: 'Quanto pesa il prior? ML e Bayes a confronto sui numeri',
    difficulty: 2,
    kind: 'numerico',
    concepts: ['c61', 'c62', 'c63', 'c64', 'c79'],
    generate: (rng) => {
      // Numeri della slide (N = 12, x̄ = 3.13, σ = 1, prior N(5, 0.5²)) in un caso su quattro. Negli altri
      // si estrae finché il peso dei dati sta fra 0.2 e 0.9 e il prior dista almeno 1 dalla media campionaria:
      // così μ_N si stacca da x̄ di almeno 0.1 e w da 1 di almeno 0.1, e la risposta ML non passa le tolleranze.
      let N = 12
      let xbar = 3.13
      let sigma = 1
      let mu0 = 5
      let s0 = 0.5
      if (rng.next() >= 0.25) {
        for (let tentativo = 0; tentativo < 200; tentativo++) {
          const n = rng.int(1, 30)
          const xb = rng.float(2, 4, 2)
          const sg = rng.float(0.5, 2, 1)
          const m0 = rng.float(0, 6, 1)
          const sp = rng.float(0.1, 2, 1)
          const peso = (n * sp * sp) / (n * sp * sp + sg * sg)
          if (peso >= 0.2 && peso <= 0.9 && Math.abs(m0 - xb) >= 1) {
            N = n
            xbar = xb
            sigma = sg
            mu0 = m0
            s0 = sp
            break
          }
        }
      }
      const s2 = sigma * sigma
      const v0 = s0 * s0
      const w = (N * v0) / (N * v0 + s2)
      const muN = w * xbar + (1 - w) * mu0
      const sN = Math.sqrt((v0 * s2) / (N * v0 + s2))
      const N100 = N * 100
      const w100 = (N100 * v0) / (N100 * v0 + s2)
      const mu100 = w100 * xbar + (1 - w100) * mu0
      return {
        prompt: md`Un sensore misura una temperatura con rumore gaussiano di deviazione standard nota $\sigma = ${f(sigma, 1)}$; la media $\theta$ è incognita. Con $N = ${N}$ letture la media campionaria vale $\bar{x} = ${f(xbar, 2)}$. Un tecnico, per esperienza, ti dà un prior gaussiano su $\theta$ con media $\mu_0 = ${f(mu0, 1)}$ e deviazione standard $\sigma_0 = ${f(s0, 1)}$.

Calcola la stima ML, il peso dei dati $w$ nella media a posteriori, la media a posteriori $\mu_N$ e la deviazione standard a posteriori $\sigma_N$.`,
        answers: [
          risposta(md`$\hat{\theta}_{ML}$`, xbar, 0.005),
          risposta(md`$w$`, w, tol(w, 0.005, 0.002)),
          risposta(md`$\mu_N$`, muN, 0.005),
          risposta(md`$\sigma_N$`, sN, tol(sN, 0.01, 0.001)),
        ],
        solution: md`**1. Stima ML.** $\hat{\theta}_{ML} = \bar{x} = ${f(xbar, 2)}$: usa solo i dati.

**2. Posterior.** Verosimiglianza gaussiana in $\theta$ per prior gaussiano: il posterior è gaussiano, con

$$w = \frac{N\sigma_0^2}{N\sigma_0^2 + \sigma^2} = \frac{${N}\cdot ${f(v0, 4)}}{${N}\cdot ${f(v0, 4)} + ${f(s2, 2)}} = ${f(w, 4)}$$

$$\mu_N = w\,\bar{x} + (1 - w)\,\mu_0 = ${f(w, 4)}\cdot ${f(xbar, 2)} + ${f(1 - w, 4)}\cdot ${f(mu0, 1)} = ${f(muN, 4)}$$

$$\sigma_N^2 = \frac{\sigma_0^2\,\sigma^2}{N\sigma_0^2 + \sigma^2} = ${f(sN * sN, 5)},\qquad \sigma_N = ${f(sN, 4)}$$

**3. Quanto pesa il prior.** Il prior pesa $1 - w = ${f(1 - w, 4)}$. La stima bayesiana si sposta di $${f(Math.abs(muN - xbar), 3)}$ dalla stima ML, verso $\mu_0$. ${w > 0.95 ? 'I dati dominano: la stima bayesiana è quasi quella ML.' : w < 0.5 ? 'Con questi numeri il prior conta più dei dati: il tecnico era molto sicuro, o le letture sono poche e rumorose.' : 'Dati e prior contano entrambi.'}

**4. Verso la coincidenza.** Con $100$ volte più letture ($N = ${N100}$) il peso dei dati sale a $${f(w100, 4)}$ e $\mu_N = ${f(mu100, 4)}$, praticamente $\bar{x}$. Con $\sigma_0 \to +\infty$, prior quasi uniforme, $w \to 1$ e $\mu_N \to \bar{x}$ per qualunque $N$. Sono i due casi in cui ML e Bayes danno la stessa soluzione: infiniti campioni di training o prior uniforme.`,
      }
    },
  },
  {
    id: 'es20',
    title: 'Soglie MAP del canale PAM con prior diversi',
    difficulty: 3,
    kind: 'numerico',
    concepts: ['c08', 'c13', 'c14'],
    generate: (rng) => {
      let sn = 0.1
      let P = [0.5, 0.3, 0.2]
      let t12 = 0
      let t23 = 0
      let ok = false
      for (let tentativo = 0; tentativo < 50 && !ok; tentativo++) {
        sn = rng.float(0.05, 0.15, 2)
        const p1 = rng.float(0.1, 0.8, 2)
        const p2 = rng.float(0.1, Number((0.9 - p1).toFixed(2)), 2)
        const p3 = Number((1 - p1 - p2).toFixed(2))
        P = [p1, p2, p3]
        t12 = 0.375 + 4 * sn * sn * Math.log(p1 / p2)
        t23 = 0.625 + 4 * sn * sn * Math.log(p2 / p3)
        ok = p3 >= 0.1 && t23 - t12 > 0.05
      }
      if (!ok) {
        sn = 0.1
        P = [0.5, 0.3, 0.2]
        t12 = 0.375 + 4 * sn * sn * Math.log(P[0] / P[1])
        t23 = 0.625 + 4 * sn * sn * Math.log(P[1] / P[2])
      }
      const [p1, p2, p3] = P
      const q1 = Q((t12 - 0.25) / sn)
      const q2 = Q((0.5 - t12) / sn)
      const q3 = Q((t23 - 0.5) / sn)
      const q4 = Q((0.75 - t23) / sn)
      const PeMAP = p1 * q1 + p2 * (q2 + q3) + p3 * q4
      const qML = Q(0.125 / sn)
      const PeML = (1 + p2) * qML
      const k = 4 * sn * sn
      return {
        prompt: md`Canale PAM delle note: livelli $a_1 = 0.25$ (Yes), $a_2 = 0.5$ (Maybe), $a_3 = 0.75$ (No), rumore gaussiano a media nulla con $\sigma_n = ${f(sn, 2)}$. La sorgente non è equiprobabile: $P(\text{Yes}) = ${f(p1, 2)}$, $P(\text{Maybe}) = ${f(p2, 2)}$, $P(\text{No}) = ${f(p3, 2)}$. Calcola le due soglie a minimo errore (MAP) $t_{12}$ e $t_{23}$, poi la probabilità d'errore con queste soglie e con le soglie ML a metà strada ($0.375$ e $0.625$), in percentuale.`,
        answers: [
          risposta(md`$t_{12}$`, t12, 0.001),
          risposta(md`$t_{23}$`, t23, 0.001),
          risposta(md`$P_e$ MAP (%)`, PeMAP * 100, tol(PeMAP * 100, 0.01, 0.005)),
          risposta(md`$P_e$ ML (%)`, PeML * 100, tol(PeML * 100, 0.01, 0.005)),
        ],
        solution: md`**1. La regola.** A minimo errore scelgo il simbolo che massimizza $P(s)\,p(y\mid s)$. La soglia fra due livelli adiacenti $a_1 \lt a_2$ è dove i due prodotti sono uguali:

$$P_1\exp\left(-\frac{(t - a_1)^2}{2\sigma_n^2}\right) = P_2\exp\left(-\frac{(t - a_2)^2}{2\sigma_n^2}\right)$$

Passo ai logaritmi; i termini in $t^2$ si cancellano:

$$(t - a_2)^2 - (t - a_1)^2 = 2\sigma_n^2\ln\frac{P_2}{P_1}\;\Rightarrow\; t = \frac{a_1 + a_2}{2} + \frac{\sigma_n^2}{a_2 - a_1}\ln\frac{P_1}{P_2}$$

**2. Le soglie.** Con $a_2 - a_1 = 0.25$ il coefficiente vale $\frac{\sigma_n^2}{0.25} = 4\sigma_n^2 = ${f(k, 4)}$:

$$t_{12} = 0.375 + ${f(k, 4)}\ln\frac{${f(p1, 2)}}{${f(p2, 2)}} = ${f(t12, 4)},\qquad t_{23} = 0.625 + ${f(k, 4)}\ln\frac{${f(p2, 2)}}{${f(p3, 2)}} = ${f(t23, 4)}$$

$t_{12} \lt t_{23}$: la regione di Maybe esiste. Ogni soglia si sposta verso il simbolo meno probabile e allarga la regione di quello più probabile.

**3. Errore con le soglie MAP.** Yes sbaglia se $y > t_{12}$, Maybe se esce da $[t_{12}, t_{23}]$, No se $y \lt t_{23}$:

$$P_e = P(\text{Yes})\,Q\left(\frac{t_{12} - 0.25}{\sigma_n}\right) + P(\text{Maybe})\left[Q\left(\frac{0.5 - t_{12}}{\sigma_n}\right) + Q\left(\frac{t_{23} - 0.5}{\sigma_n}\right)\right] + P(\text{No})\,Q\left(\frac{0.75 - t_{23}}{\sigma_n}\right)$$

Le code valgono $${num(q1)}$, $${num(q2)}$, $${num(q3)}$, $${num(q4)}$, quindi $P_e = ${num(PeMAP * 100)}\%$.

**4. Errore con le soglie ML.** Ogni soglia dista $0.125$ dai livelli: $Q(0.125/\sigma_n) = ${num(qML)}$ e

$$P_e = \left[P(\text{Yes}) + 2P(\text{Maybe}) + P(\text{No})\right]Q\left(\frac{0.125}{\sigma_n}\right) = (1 + ${f(p2, 2)})\cdot ${num(qML)} = ${num(PeML * 100)}\%$$

Il MAP sbaglia ${PeMAP < PeML ? 'meno' : 'come'}: è il criterio a minimo errore quando i prior sono quelli veri. Caso di riferimento: con $\sigma_n = 0.1$ e prior $0.5$, $0.3$, $0.2$ le soglie sono $0.395$ e $0.641$ e l'errore scende da $13.7\%$ a $13.2\%$.

**5. Se $\sigma_n \to 0$.** Lo spostamento $4\sigma_n^2\ln\frac{P_1}{P_2}$ va a zero: le soglie tornano ai punti medi e il prior conta sempre meno, perché le campane sono così strette che la misura decide da sola.`,
      }
    },
  },
  {
    id: 'es21',
    title: 'Perché il posterior della media gaussiana è ancora gaussiano',
    difficulty: 3,
    kind: 'dimostrazione',
    concepts: ['c62', 'c79'],
    generate: (rng) => {
      // La varianza predittiva σ² + σ_N² e quella con prior uniforme σ²(1 + 1/N) differiscono, in rapporto a σ²,
      // di 1/(N(Nσ0²/σ² + 1)). Si estrae finché la differenza supera il 3%, sei volte la tolleranza relativa
      // delle risposte: altrimenti scambiare le due varianze verrebbe accettato.
      let N = 5
      let sigma = 1
      let s0 = 0.3
      for (let tentativo = 0; tentativo < 200; tentativo++) {
        const n = rng.int(2, 20)
        const sg = rng.pick([0.5, 1, 1.5, 2])
        const sp = rng.pick([0.1, 0.2, 0.3, 0.5, 1])
        if (1 / (n * ((n * sp * sp) / (sg * sg) + 1)) >= 0.03) {
          N = n
          sigma = sg
          s0 = sp
          break
        }
      }
      const xbar = rng.float(2, 4, 2)
      const mu0 = rng.float(0, 6, 1)
      const s2 = sigma * sigma
      const v0 = s0 * s0
      const prec = N / s2 + 1 / v0
      const vN = 1 / prec
      const muN = vN * ((N * xbar) / s2 + mu0 / v0)
      const pred = s2 + vN
      const predUnif = s2 * (1 + 1 / N)
      return {
        prompt: md`Campioni iid $\mathcal{N}(\theta, \sigma^2)$ con $\sigma$ nota, prior $p(\theta) = \mathcal{N}(\mu_0, \sigma_0^2)$.

**Parte 1.** Partendo da $p(\theta\mid\mathbf{X}) \propto p(\mathbf{X}\mid\theta)\,p(\theta)$, raccogli i termini in $\theta^2$ e in $\theta$, completa il quadrato e ricava $\frac{1}{\sigma_N^2} = \frac{N}{\sigma^2} + \frac{1}{\sigma_0^2}$ e $\mu_N = \sigma_N^2\left(\frac{N\bar{x}}{\sigma^2} + \frac{\mu_0}{\sigma_0^2}\right)$. Poi ricava la densità $p(x\mid\mathbf{X})$ e spiega perché con prior uniforme la stima del parametro coincide con quella ML mentre la densità resta più larga.

**Parte 2.** Numeri: $N = ${N}$, $\bar{x} = ${f(xbar, 2)}$, $\sigma = ${f(sigma, 1)}$, $\mu_0 = ${f(mu0, 1)}$, $\sigma_0 = ${f(s0, 1)}$. Calcola $\sigma_N^2$, $\mu_N$, la varianza di $p(x\mid\mathbf{X})$ e la varianza che avrebbe con prior uniforme.`,
        answers: [
          risposta(md`$\sigma_N^2$`, vN, tol(vN, 0.01, 0.0001)),
          risposta(md`$\mu_N$`, muN, 0.005),
          risposta(md`varianza di $p(x\mid\mathbf{X})$`, pred, tol(pred, 0.005, 0.001)),
          risposta('varianza con prior uniforme', predUnif, tol(predUnif, 0.005, 0.001)),
        ],
        solution: md`**1. Verosimiglianza in $\theta$.** Con $\sum_k (x_k - \theta)^2 = \sum_k (x_k - \bar{x})^2 + N(\theta - \bar{x})^2$, la parte che dipende da $\theta$ è

$$p(\mathbf{X}\mid\theta) \propto \exp\left(-\frac{N(\theta - \bar{x})^2}{2\sigma^2}\right)$$

una gaussiana in $\theta$ centrata in $\bar{x}$ con varianza $\sigma^2/N$.

**2. Prodotto con il prior.** Due esponenziali di quadratiche danno l'esponenziale di una quadratica:

$$p(\theta\mid\mathbf{X}) \propto \exp\left(-\frac{N(\theta - \bar{x})^2}{2\sigma^2} - \frac{(\theta - \mu_0)^2}{2\sigma_0^2}\right) = \exp\left(-\frac{1}{2}\left[\left(\frac{N}{\sigma^2} + \frac{1}{\sigma_0^2}\right)\theta^2 - 2\left(\frac{N\bar{x}}{\sigma^2} + \frac{\mu_0}{\sigma_0^2}\right)\theta\right] + \text{cost.}\right)$$

**3. Completamento del quadrato.** Confronto con $-\frac{(\theta - \mu_N)^2}{2\sigma_N^2} = -\frac{1}{2}\left[\frac{\theta^2}{\sigma_N^2} - \frac{2\mu_N\theta}{\sigma_N^2}\right] + \text{cost.}$:

$$\frac{1}{\sigma_N^2} = \frac{N}{\sigma^2} + \frac{1}{\sigma_0^2},\qquad \frac{\mu_N}{\sigma_N^2} = \frac{N\bar{x}}{\sigma^2} + \frac{\mu_0}{\sigma_0^2}$$

Il posterior è $\mathcal{N}(\mu_N, \sigma_N^2)$: il prior gaussiano è coniugato per la media. Riscrivendo, $\mu_N = \frac{N\sigma_0^2}{N\sigma_0^2 + \sigma^2}\bar{x} + \frac{\sigma^2}{N\sigma_0^2 + \sigma^2}\mu_0$ e $\sigma_N^2 = \frac{\sigma_0^2\sigma^2}{N\sigma_0^2 + \sigma^2}$.

**4. Densità dei dati.** $p(x\mid\mathbf{X}) = \int p(x\mid\theta)\,p(\theta\mid\mathbf{X})\,d\theta$: $x = \theta + n$ con $\theta \sim \mathcal{N}(\mu_N, \sigma_N^2)$ e $n \sim \mathcal{N}(0, \sigma^2)$ indipendenti, quindi $p(x\mid\mathbf{X}) = \mathcal{N}(\mu_N, \sigma^2 + \sigma_N^2)$.

**5. Prior uniforme.** Con $\sigma_0 \to +\infty$: $\sigma_N^2 \to \sigma^2/N$ e $\mu_N \to \bar{x} = \hat{\theta}_{ML}$, la stima del parametro coincide con quella ML. La densità però diventa $\mathcal{N}\left(\bar{x}, \sigma^2(1 + 1/N)\right)$, più larga della $\mathcal{N}(\bar{x}, \sigma^2)$ della ML: conserva l'incertezza residua sul parametro, che sparisce solo per $N \to +\infty$.

**Parte 2.**

$$\frac{1}{\sigma_N^2} = \frac{${N}}{${f(s2, 2)}} + \frac{1}{${f(v0, 2)}} = ${f(prec, 4)}\;\Rightarrow\;\sigma_N^2 = ${f(vN, 5)}$$

$$\mu_N = ${f(vN, 5)}\left(\frac{${N}\cdot ${f(xbar, 2)}}{${f(s2, 2)}} + \frac{${f(mu0, 1)}}{${f(v0, 2)}}\right) = ${f(muN, 4)}$$

Varianza di $p(x\mid\mathbf{X})$: $\sigma^2 + \sigma_N^2 = ${f(s2, 2)} + ${f(vN, 5)} = ${f(pred, 5)}$. Con prior uniforme: $\sigma^2(1 + 1/N) = ${f(s2, 2)}\cdot\left(1 + \frac{1}{${N}}\right) = ${f(predUnif, 5)}$. La stima ML userebbe varianza $${f(s2, 2)}$.`,
      }
    },
  },
]
