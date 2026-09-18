// Preset del motore density1d per il widget m09-somma-dei-kernel ("La somma dei kernel in tempo reale").
// Fonte della specifica: docs/inventory/m09-parzen-windows.json (widget m09-somma-dei-kernel, concetti c15,
// c17, c18, c26) e piano, Task 4.7 punto 3. Numeri e notazione sono quelli dell'inventario:
// - 12 salmoni con luminosità 2.6 … 7.1 (qui nell'ordine in cui arrivano sul nastro, che è libero);
// - densità vera 0.7·N(4, 0.8²) + 0.3·N(6, 0.9²); h da 0.05 a 3 in scala logaritmica, predefinito 0.5;
// - soglie dei timbri: h < 0.15 sensibile (overfitting), h > 1.5 liscia (underfitting);
// - kernel gaussiano (predefinito), rettangolare, triangolare.
// Con h = 0.5 e N = 12 ogni campana ha area 1/N = 0.083 e picco γ(0)/(N h) = 0.399/6 = 0.0665.
import { formatH, mixtureScenario } from '../engines/density1d'
import type { Density1dPreset } from '../engines/density1d'

const components = [
  { weight: 0.7, mu: 4, sigma: 0.8 },
  { weight: 0.3, mu: 6, sigma: 0.9 },
]

export const scenario = mixtureScenario({
  samples: [4.1, 2.6, 5.2, 3.8, 6.3, 4.4, 3.1, 5.6, 4.0, 7.1, 3.3, 4.9],
  components,
  domain: [0, 10],
  axis: { it: 'luminosità', en: 'lightness', unit: 'scala 0-10' },
  sampleName: { one: 'salmone', many: 'salmoni' },
  decimals: 1,
})

/** I primi addendi γ(u) del punto sonda, quanti ne esistono (al più tre), poi i puntini. */
const firstAddends = (n: number) => {
  const shown = Array.from({ length: Math.min(n, 3) }, (_, i) => String.raw`\val[3]{g${i + 1}}`).join('+')
  return n > 3 ? `${shown}+\\cdots` : shown
}

export const preset: Density1dPreset = {
  scenario,
  layers: ['kernels', 'estimate', 'truth'],
  // la densità vera parte spenta: la sfida chiede di scegliere h senza vederla
  initialLayers: ['kernels', 'estimate'],
  kernels: ['gaussiano', 'rettangolare', 'triangolare'],
  initial: { h: 0.5, kernel: 'gaussiano', probe: 4.2 },
  h: { min: 0.05, max: 3 },
  samples: { editable: true, min: 1, max: 40 },
  yMax: 0.9,
  regimes: { sensitiveBelow: 0.15, smoothAbove: 1.5 },
  addends: true,
  aspect: 1.5,
  ariaLabel: 'Stima di Parzen della luminosità dei salmoni: campioni sul nastro, campane dei kernel e loro somma',
  description: 'Asse orizzontale: luminosità da 0 a 10. Asse verticale: densità. Sotto lo zero, il nastro con i campioni.',

  storyboard: [
    {
      id: 'quadro',
      label: 'Il quadro: i salmoni e la loro stima',
      phase: { kind: 'overview' },
      durationMs: 1500,
      caption: ({ n }) =>
        `Ogni salmone misurato dalla telecamera dell'impianto è un campione $x_k$ sul nastro. La curva spessa è la stima di Parzen $\\hat p(x)$ di $p(\\text{luminosità} \\mid \\text{salmone})$, costruita con ${n} campioni e **nessuna ipotesi sulla forma** della densità. Premi Play per vederla nascere.`,
    },
    {
      id: 'cadono',
      label: 'I campioni cadono sul nastro',
      phase: { kind: 'drop' },
      durationMs: (n) => n * 300,
      caption: ({ n }) =>
        `Le luminosità arrivano una alla volta: $x_1, \\dots, x_N$ con $N = ${n}$. Sono i campioni di addestramento (*training samples*): il metodo userà solo loro.`,
    },
    {
      id: 'nascono',
      label: 'Su ogni campione nasce un kernel',
      phase: { kind: 'grow' },
      durationMs: 1600,
      caption:
        'Su ogni $x_k$ cresce la stessa funzione $\\delta(x - x_k) = \\frac{1}{V(h)}\\gamma\\left(\\frac{x - x_k}{h}\\right)$, con $V(h) = h$ in una dimensione: area 1, picco $\\gamma(0)/h$. È la finestra di Parzen (*Parzen window* o *kernel*) posata sul campione.',
    },
    {
      id: 'pesano',
      label: 'Ogni kernel pesa 1/N',
      phase: { kind: 'normalize' },
      durationMs: 1100,
      caption: ({ n, invN }) =>
        `Si divide per $N = ${n}$: ogni campana scende a $\\frac{1}{N}\\delta(x - x_k)$, con area $\\frac{1}{N} = ${invN}$. Così la somma avrà area 1 e resterà una densità.`,
    },
    {
      id: 'somma',
      label: 'Le campane si sommano: ecco p̂(x)',
      phase: { kind: 'stack' },
      durationMs: 1800,
      caption:
        'Le campane si impilano: in ogni $x$ la pila arriva esattamente a $\\hat p(x) = \\frac{1}{N}\\sum_{k=1}^{N}\\delta(x - x_k)$. La stima è la media di $N$ copie dello stesso kernel posate sui dati (*an average of functions of x and the samples*).',
    },
    {
      id: 'vera',
      label: 'Confronto con la densità vera',
      phase: { kind: 'truth' },
      durationMs: 1500,
      caption: `La pila torna giù. Tratteggiata, la densità da cui sono stati estratti i salmoni (dati sintetici): $p(x) = ${scenario.truthTex ?? ''}$. L'errore quadratico integrato $\\mathrm{ISE} = \\int (\\hat p(x) - p(x))^2\\,dx$ misura quanto la stima ne dista.`,
    },
    {
      id: 'aghi',
      label: 'h piccolo: un ago per salmone',
      phase: { kind: 'bandwidth', h: 0.1, truth: true },
      durationMs: 1800,
      caption:
        'Con $h = 0.10$ ogni kernel è stretto e alto (il picco $\\gamma(0)/(Nh)$ cresce come $1/h$): la stima ha quasi un picco per campione e insegue il caso del campione. Stima sensibile, rischio di **overfitting** (*undersmoothing*).',
    },
    {
      id: 'collina',
      label: 'h grande: una collina sola',
      phase: { kind: 'bandwidth', h: 2.5, truth: true },
      durationMs: 1800,
      caption:
        'Con $h = 2.5$ ogni salmone si spalma su mezzo nastro: la stima diventa una collina bassa e larga e perde la forma di $p(x)$. Stima liscia, rischio di **underfitting** (*oversmoothing*).',
    },
    {
      id: 'tuo',
      label: 'h torna a te',
      phase: { kind: 'bandwidth', h: 'user' },
      durationMs: 1200,
      caption: ({ h }) =>
        `$h$ non sposta nessun kernel: decide solo quanto ogni campione si spalma sui vicini (*smoothing parameter*). Ora $h = ${formatH(h)}$: muovi lo slider, cambia kernel, aggiungi o togli salmoni con un clic sul nastro e guarda il contatore dei massimi locali.`,
    },
  ],

  formulas: [
    {
      id: 'stima',
      label: 'Formula viva nel punto sonda · Parzen window estimate',
      tex: ({ n }) =>
        String.raw`\begin{aligned}\hat{p}(x)&=\frac{1}{N}\sum_{k=1}^{N}\frac{1}{V(h)}\,\gamma\!\left(\frac{x-x_k}{h}\right)\\ \hat{p}(\val{x})&=\frac{1}{\val[0]{N}\cdot\val{h}}\sum_{k=1}^{\val[0]{N}}\gamma\!\left(\frac{\val{x}-x_k}{\val{h}}\right)\\ &=\frac{${firstAddends(n)}}{\val{Nh}}=\frac{\val[3]{S}}{\val{Nh}}=\val[4]{p}\end{aligned}`,
    },
    {
      id: 'delta',
      label: 'La funzione δ e il peso di ogni campione',
      tex: String.raw`\begin{gathered}\delta(x)=\frac{1}{V(h)}\gamma\!\left(\frac{x}{h}\right),\quad V(h)=h=\val{h},\qquad \hat{p}(x)=\frac{1}{N}\sum_{k=1}^{N}\delta(x-x_k)\\ \text{area di }\tfrac{1}{N}\delta(x-x_k)=\tfrac{1}{N}=\val[3]{area},\qquad \text{picco }\tfrac{\gamma(0)}{Nh}=\val[4]{peak}\end{gathered}`,
    },
  ],

  challenge: {
    kind: 'min-ise',
    tolerance: 1.05,
    prompt:
      "Con la densità vera **nascosta**, scegli con lo slider l'$h$ che secondo te minimizza l'errore quadratico integrato $\\mathrm{ISE}=\\int(\\hat p(x)-p(x))^2\\,dx$ per il kernel scelto. Premi Verifica: il widget rivela la densità vera, calcola l'$h^*$ ottimo e il rapporto $\\mathrm{ISE}(h)/\\mathrm{ISE}(h^*)$. La sfida è superata con un rapporto al più $1.05$.",
    hint:
      "Con il kernel gaussiano guarda il contatore dei massimi locali: la densità vera ha una sola gobba. Cerca l'$h$ più piccolo per cui la stima ha un solo massimo: più stretto insegue i singoli salmoni (overfitting), più largo appiattisce la gobba (underfitting).",
  },

  terms: [
    { target: 'samples', symbol: 'x_k', en: 'training samples', it: 'I campioni: la luminosità di ciascun salmone misurata sul nastro.' },
    { target: 'kernels', symbol: String.raw`\gamma(\cdot)`, en: 'Parzen window or kernel', it: 'Finestra di Parzen o kernel: quanto pesa ogni campione in base alla sua distanza da $x$.' },
    { target: 'h', symbol: 'h', en: 'width of the window (kernel), bandwidth, smoothing parameter', it: 'Larghezza della finestra, detta anche banda o parametro di smoothing: quanto ogni campione si spalma.' },
    { target: 'estimate', symbol: String.raw`\hat p(x)`, en: 'an average of functions of x and the samples', it: 'La stima: la media delle $N$ campane $\\delta(x - x_k)$.' },
    { target: 'truth', symbol: 'p(x)', en: 'true density', it: 'La densità vera che ha generato i dati sintetici: una mistura di due gaussiane.' },
  ],
  notes: [
    'Attenzione: questo *kernel* è una densità che pesa i campioni per distanza, **non** il kernel (prodotto scalare in uno spazio di feature) delle SVM della parte di Passerini.',
    'Nome alternativo del metodo: stima di densità a kernel (*kernel density estimation*, KDE).',
  ],
}
