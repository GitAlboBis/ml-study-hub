// Formule del foglio m07 (stima bayesiana), seconda metà: concetti c32-c61 dell'inventario.
// Convenzione condivisa con formulas-a.ts: una voce per ogni stringa LaTeX di concepts[].latex, id "f-<concetto>"
// per la prima, "f-<concetto>-2", "f-<concetto>-3"... per le successive. Il campo latex è copiato dall'inventario
// (verificato sulle immagini di ch2 p37-40 e part1 p26, p28-30) e scripts/formula-coverage.ts lo ritrova per confronto.
// importance = examRelevance del concetto. c35, c45, c46, c48, c50-c53 e c59 non hanno LaTeX nell'inventario: nessuna voce.
// Esempio numerico ricorrente, lo stesso di formulas-a.ts: i salmoni dell'esempio sintetico del foglio
// (sigma^2 = 4, mu0 = 10, sigma0^2 = 9, N = 4, media 12.5 -> muN = 12.25, sigmaN^2 = 0.9, n0 = 4/9).
// Le formule non scritte nella fonte (f-c41, f-c60, f-c60-2, f-c61...) lo dicono nel testo.
import { md } from '../../types'
import type { Formula } from '../../types'

export const formulasB: Formula[] = [
  // --- c32-c34, c36-c37: i casi limite in N e il Bayesian learning (note p28-29, slide 38) -------------
  {
    id: 'f-c32',
    name: 'Caso limite N = 0: la media a posteriori senza campioni',
    nameEn: 'Posterior mean when no samples are available (N = 0)',
    latex: md`N=0\;\Rightarrow\;\mu_N=\mu_0`,
    explain: md`Primo dei due casi limite discussi nelle note (*when no samples are available*): senza campioni la media a posteriori coincide con la media a priori, «since it is the only information we have». Nella formula di $\mu_N$ il peso dei dati $\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}$ vale $0$ e quello del prior $\frac{\sigma^2}{N\sigma_0^2+\sigma^2}$ vale $1$. Anche la varianza torna quella del prior: $\sigma_N^2=\frac{\sigma_0^2\sigma^2}{\sigma^2}=\sigma_0^2$. La posterior coincide quindi esattamente con il prior, $p(\mu\,|\,\boldsymbol{X})=N(\mu_0,\sigma_0^2)$. Con i salmoni: prima di misurare il primo pesce la stima della luminosità media è $10$, con varianza $9$.`,
    symbols: [
      { s: md`N`, meaning: md`numero di campioni disponibili` },
      { s: md`\mu_N`, meaning: md`media a posteriori (*posterior mean*) dopo $N$ campioni` },
      { s: md`\mu_0`, meaning: md`media a priori (*prior mean*), parametro noto del prior $N(\mu_0,\sigma_0^2)$` },
    ],
    whenToUse: md`Come controllo delle formule della slide 37 su un caso estremo, e all'orale come primo dei due casi limite: nessun dato, conta solo il prior. I passaggi sono nella dimostrazione [«casi limite della posterior»](#derivation:der05).`,
    pitfalls: md`Con $N=0$ la media campionaria $\bar{X}$ non è definita ($0/0$), ma il suo peso è esattamente zero: il risultato non dipende da come la si definisce. Non confondere con il prior dogmatico ($\sigma_0^2\to 0$), dove $\mu_N=\mu_0$ vale per **ogni** $N$, non solo senza dati.`,
    importance: 2,
    blanks: [
      {
        masked: md`N=0\;\Rightarrow\;\mu_N=\boxed{\;?\;}`,
        answer: md`\mu_0`,
        distractors: [md`\bar{X}`, md`0`],
      },
    ],
    source: [{ doc: 'part1', page: 28 }],
  },
  {
    id: 'f-c33',
    name: 'Caso limite N → ∞: la media a posteriori con infiniti campioni',
    nameEn: 'Posterior mean in the limit of infinite samples (N → ∞)',
    latex: md`N\to\infty\;\Rightarrow\;\mu_N=\bar{X}`,
    explain: md`Secondo caso limite delle note: quando il numero di campioni tende a infinito la media a posteriori converge alla media campionaria, «as the information from the data dominates the prior»; la formula $\mu_N=\bar{X}$ apre la pagina 29. Dividendo per $N\sigma_0^2$ il peso dei dati diventa $\frac{1}{1+\sigma^2/(N\sigma_0^2)}\to 1$, mentre il peso del prior $\frac{\sigma^2}{N\sigma_0^2+\sigma^2}\to 0$. Lettura rigorosa: anche $\bar{X}$ cambia con $N$, quindi l'uguaglianza va letta come $\mu_N-\bar{X}=\frac{\sigma^2}{N\sigma_0^2+\sigma^2}(\mu_0-\bar{X})\to 0$. Poiché $\bar{X}$ tende alla media vera (legge dei grandi numeri), ci tende anche $\mu_N$: la media a posteriori è consistente ([«perché la media a posteriori converge al valore vero»](#derivation:der12)). $\bar{X}$ è anche la stima ML della media: da qui nasce l'equivalenza asintotica tra ML e Bayes.`,
    symbols: [
      { s: md`\bar{X}`, meaning: md`media campionaria (*sample mean*) $\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k$, uguale alla stima ML della media` },
      { s: md`\mu_N`, meaning: md`media a posteriori dopo $N$ campioni` },
      { s: md`N\to\infty`, meaning: md`limite di infiniti campioni di training` },
    ],
    whenToUse: md`All'orale, dopo il caso $N=0$: con molti dati il prior non conta più. È la base della prima condizione di equivalenza tra ML e Bayes della slide 40 (*asymptotic limit of infinite training samples*).`,
    pitfalls: md`Serve $\sigma_0^2>0$: con un prior dogmatico ($\sigma_0^2=0$) il peso dei dati è nullo per ogni $N$ e $\mu_N$ resta $\mu_0$ per sempre. Il segno $=$ abbrevia un limite: per $N$ finito $\mu_N$ sta sempre tra $\mu_0$ e $\bar{X}$ (con i salmoni, $N=4$: $\mu_N=12.25$ tra $10$ e $12.5$).`,
    importance: 3,
    blanks: [
      {
        masked: md`N\to\infty\;\Rightarrow\;\mu_N=\boxed{\;?\;}`,
        answer: md`\bar{X}`,
        distractors: [md`\mu_0`, md`\frac{\mu_0+\bar{X}}{2}`, md`0`],
      },
    ],
    source: [
      { doc: 'part1', page: 28 },
      { doc: 'part1', page: 29 },
    ],
  },
  {
    id: 'f-c34',
    name: 'La varianza a posteriori al crescere di N',
    nameEn: 'Posterior variance as N grows',
    latex: md`\sigma_N^2\to 0`,
    explain: md`Al crescere di $N$ la posterior diventa sempre più piccata (*sharply peaked*) attorno alla media campionaria: la varianza a posteriori tende a zero. Dalla formula della slide 37: $\sigma_N^2=\frac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2}=\frac{\sigma^2}{N}\cdot\frac{1}{1+\sigma^2/(N\sigma_0^2)}$, che per $N$ grande si comporta come $\frac{\sigma^2}{N}$, la varianza della media campionaria. Detto con le precisioni: $1/\sigma_N^2=N/\sigma^2+1/\sigma_0^2$ cresce linearmente con $N$. La curva si stringe e si alza, perché l'area resta 1: il picco vale $1/(\sqrt{2\pi}\,\sigma_N)$. Con i salmoni: $\sigma_N^2=0.9$ dopo 4 pesci, circa $0.1$ dopo 40.`,
    symbols: [
      { s: md`\sigma_N^2`, meaning: md`varianza a posteriori (*posterior variance*): incertezza residua sulla media $\mu$` },
      { s: md`\sigma^2`, meaning: md`varianza nota dei dati` },
      { s: md`\sigma_0^2`, meaning: md`varianza del prior` },
    ],
    whenToUse: md`Per spiegare il *Bayesian learning*: campione dopo campione l'incertezza sulla media si riduce, fino alla certezza. I passaggi sono nella dimostrazione [«casi limite della posterior»](#derivation:der05).`,
    pitfalls: md`$\sigma_N^2$ non dipende dai **valori** dei campioni ma solo da quanti sono: due insiemi diversi della stessa taglia danno la stessa larghezza. Cala come $1/N$, quindi la deviazione standard $\sigma_N$ cala solo come $1/\sqrt{N}$: per dimezzarla servono quattro volte i campioni. Tende a zero $\sigma_N^2$, non la varianza della densità predittiva, che tende a $\sigma^2$.`,
    importance: 3,
    blanks: [
      {
        masked: md`N\to\infty\;\Rightarrow\;\sigma_N^2\to\boxed{\;?\;}`,
        answer: md`0`,
        distractors: [md`\sigma^2`, md`\sigma_0^2`],
      },
      {
        masked: md`\sigma_N^2=\frac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2}\approx\boxed{\;?\;}\;\xrightarrow{\;N\to\infty\;}\;0`,
        answer: md`\frac{\sigma^2}{N}`,
        distractors: [md`\frac{\sigma_0^2}{N}`, md`\frac{\sigma^2}{N^2}`, md`\frac{\sigma^2}{\sigma_0^2}`],
      },
    ],
    source: [
      { doc: 'part1', page: 29 },
      { doc: 'ch2', page: 38 },
    ],
  },
  {
    id: 'f-c34-2',
    name: 'Il limite della posterior per N → ∞',
    nameEn: 'The limit of the posterior as N → ∞',
    latex: md`p(\mu\,|\,\boldsymbol{X})\;\xrightarrow{\;N\to+\infty\;}\;\delta(\mu-\bar{X})`,
    explain: md`Una gaussiana con centro $\bar{X}$ e varianza che tende a zero diventa, nel limite, una delta di Dirac: tutta la massa di probabilità su un solo valore di $\mu$, cioè certezza, esattamente come una stima puntuale. La slide 38: la posterior diventa sempre più piccata, «approaching a Dirac delta function as N approaches infinity»; le note: converge «to a Dirac delta function centered at $\bar{X}$», cioè $\sigma_N^2\to 0$. È il comportamento che la slide chiama *Bayesian learning*. Precisazione: il centro $\bar{X}$ cambia con $N$; formalmente la posterior si concentra attorno alla media vera, verso cui $\bar{X}$ converge.`,
    symbols: [
      { s: md`\delta(\cdot)`, meaning: md`delta di Dirac (*Dirac delta function*): nulla ovunque tranne che nell'origine, con area 1` },
      { s: md`\delta(\mu-\bar{X})`, meaning: md`massa unitaria concentrata nel punto $\mu=\bar{X}$` },
      { s: md`p(\mu\,|\,\boldsymbol{X})`, meaning: md`densità a posteriori della media, $N(\mu_N,\sigma_N^2)$` },
    ],
    whenToUse: md`Per chiudere il discorso sul *Bayesian learning* e per collegare Bayes a ML: una posterior a delta equivale a una stima puntuale, e la densità stimata torna il modello con la stima inserita.`,
    pitfalls: md`Serve $\sigma_0^2>0$: con un prior degenere ($\sigma_0^2=0$) la posterior è una delta su $\mu_0$ fin dall'inizio e i dati non la spostano. La delta non è una funzione ordinaria: la convergenza va letta come concentrazione della massa in un punto, non come limite valore per valore (in $\mu=\bar{X}$ il picco diverge).`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\mu\,|\,\boldsymbol{X})\;\xrightarrow{\;N\to+\infty\;}\;\delta(\mu-\boxed{\;?\;})`,
        answer: md`\bar{X}`,
        distractors: [md`\mu_0`, md`0`],
      },
      {
        masked: md`p(\mu\,|\,\boldsymbol{X})\;\xrightarrow{\;N\to+\infty\;}\;\boxed{\;?\;}`,
        answer: md`\delta(\mu-\bar{X})`,
        distractors: [md`\delta(\mu-\mu_0)`, md`N(\bar{X},\sigma^2)`, md`p(\mu)`],
      },
    ],
    source: [
      { doc: 'ch2', page: 38 },
      { doc: 'part1', page: 29 },
    ],
  },
  {
    id: 'f-c36',
    name: 'Posterior dopo N campioni: le curve del Bayesian learning',
    nameEn: 'Posterior of the mean for increasing N',
    latex: md`p(\mu\,|\,\mathbf{x}_1,\ldots,\mathbf{x}_N)`,
    explain: md`È l'etichetta dell'asse verticale della figura della slide 38 (riprodotta in piccolo nelle note): la stessa posterior $p(\mu\,|\,\boldsymbol{X})$, scritta elencando i campioni. Il grafico sta nello spazio dei parametri, con $\mu$ in ascissa, e mostra cinque curve per $N=1,5,10,20,30$: il picco cresce e la larghezza cala con $N$, mentre il centro si sposta perché segue la media campionaria, che fluttua da un $N$ all'altro. La fonte non riporta i parametri usati. Misurando i picchi (circa $0.44$, $0.91$, $1.28$, $1.80$, $2.20$) si ricava $1/\sigma_N^2\approx N+0.25$: è la legge $1/\sigma_N^2=N/\sigma^2+1/\sigma_0^2$ con $\sigma^2=1$ e $\sigma_0^2=4$ (ricostruzione, non scritta nella fonte).`,
    symbols: [
      { s: md`\mathbf{x}_1,\ldots,\mathbf{x}_N`, meaning: md`i primi $N$ campioni di training, cioè l'insieme $\boldsymbol{X}$` },
      { s: md`\mu`, meaning: md`media ignota, sull'asse orizzontale del grafico` },
      { s: md`N`, meaning: md`numero di campioni: etichetta di ogni curva (1, 5, 10, 20, 30)` },
    ],
    whenToUse: md`Quando all'orale ti chiedono di disegnare il *Bayesian learning*: asse $\mu$, campane sempre più strette e alte al crescere di $N$, centri che si assestano vicino alla media vera.`,
    pitfalls: md`Le curve non hanno tutte lo stesso centro: $\mu_N$ segue $\bar{X}$, che cambia con i nuovi campioni (per $N=1$ la campana sta attorno a $-1.2$, per $N=30$ appena a destra di $0$). Ogni curva ha area 1: più stretta vuol dire più alta. Il grafico è nello spazio del parametro $\mu$, non in quello dei dati $\mathbf{x}$.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\boxed{\;?\;}\,|\,\mathbf{x}_1,\ldots,\mathbf{x}_N)`,
        answer: md`\mu`,
        distractors: [md`\mathbf{x}`, md`\sigma^2`],
      },
    ],
    source: [
      { doc: 'ch2', page: 38 },
      { doc: 'part1', page: 29 },
    ],
  },
  {
    id: 'f-c37',
    name: "Il peso del prior si annulla al crescere di N",
    nameEn: 'The influence of the prior diminishes',
    latex: md`\frac{\sigma^2}{N\sigma_0^2+\sigma^2}\;\xrightarrow{\;N\to\infty\;}\;0`,
    explain: md`È il coefficiente di $\mu_0$ nella formula di $\mu_N$. Il denominatore cresce linearmente con $N$, quindi il peso della media a priori cala come $1/N$ e il peso complementare dei dati tende a 1. Le note: al crescere di $N$ la posterior si stringe attorno a $\bar{X}$ «and the influence of the prior diminishes». Conseguenza pratica: due analisti con prior diversi che vedono gli stessi dati finiscono con posterior praticamente identiche. Con i salmoni ($\sigma^2=4$, $\sigma_0^2=9$) il peso del prior vale $0.1$ dopo 4 pesci e circa $0.01$ dopo 40.`,
    symbols: [
      { s: md`\frac{\sigma^2}{N\sigma_0^2+\sigma^2}`, meaning: md`peso della media a priori $\mu_0$ in $\mu_N$` },
      { s: md`N\sigma_0^2`, meaning: md`termine che cresce con i dati: è lui a schiacciare il peso del prior` },
    ],
    whenToUse: md`Per spiegare perché con molti dati la scelta del prior diventa irrilevante, e perché ML e Bayes finiscono per coincidere.`,
    pitfalls: md`Il peso cala gradualmente, come $1/N$: con pochi dati e un prior sicuro ($\sigma_0^2$ piccolo) il prior pesa ancora molto. Se $\sigma_0^2=0$ il peso vale 1 per ogni $N$ e non si annulla mai.`,
    importance: 2,
    blanks: [
      {
        masked: md`\frac{\boxed{\;?\;}}{N\sigma_0^2+\sigma^2}\;\xrightarrow{\;N\to\infty\;}\;0`,
        answer: md`\sigma^2`,
        distractors: [md`N\sigma_0^2`, md`N\sigma^2`],
      },
    ],
    source: [{ doc: 'part1', page: 29 }],
  },

  // --- c38-c44: la densità predittiva nel caso gaussiano (slide 39, note p29) ------------------------
  {
    id: 'f-c38',
    name: "Densità predittiva nel caso gaussiano: l'integrale da calcolare",
    nameEn: 'Desired density in the Gaussian case: the integral to compute',
    latex: md`p(\mathbf{x}\,|\,\boldsymbol{X})=\int p(\mathbf{x}\,|\,\mu)\,p(\mu\,|\,\boldsymbol{X})\,\mathrm{d}\mu`,
    explain: md`«Having obtained the a posteriori density for the mean $p(\mu|\boldsymbol{X})$, all that remains is to obtain the desired density $p(\mathbf{x}|\boldsymbol{X})$»: è la formula chiave della stima bayesiana con $\boldsymbol{\theta}=\mu$. La densità cercata è la media dei modelli gaussiani $p(\mathbf{x}\,|\,\mu)$, uno per ogni valore possibile della media, pesati da quanto la posterior ritiene plausibile quel valore. Le note la chiamano distribuzione predittiva (*predictive distribution*), «which gives the probability of a new observation $x$, given the observed data $X$».`,
    symbols: [
      { s: md`p(\mathbf{x}\,|\,\boldsymbol{X})`, meaning: md`densità desiderata (*desired density*), o predittiva: densità di una nuova osservazione dati i campioni` },
      { s: md`p(\mathbf{x}\,|\,\mu)`, meaning: md`modello gaussiano dei dati $N(\mu,\sigma^2)$, con $\sigma^2$ nota` },
      { s: md`p(\mu\,|\,\boldsymbol{X})`, meaning: md`posterior della media, $N(\mu_N,\sigma_N^2)$` },
      { s: md`\mathrm{d}\mu`, meaning: md`si integra sulla media ignota: il risultato è una funzione della sola $\mathbf{x}$` },
    ],
    whenToUse: md`Secondo passo dell'esempio gaussiano, dopo aver ricavato la posterior della media. Il calcolo completo è nella dimostrazione [«densità predittiva gaussiana»](#derivation:der06).`,
    pitfalls: md`Si integra in $\mu$, non in $\mathbf{x}$. Il primo fattore è il modello di **una** osservazione per un $\mu$ fissato, non la verosimiglianza $p(\boldsymbol{X}\,|\,\mu)$ di tutti i campioni: i dati entrano solo attraverso la posterior.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\mathbf{x}\,|\,\boldsymbol{X})=\int p(\mathbf{x}\,|\,\mu)\,\boxed{\;?\;}\,\mathrm{d}\mu`,
        answer: md`p(\mu\,|\,\boldsymbol{X})`,
        distractors: [md`p(\mu)`, md`p(\boldsymbol{X}\,|\,\mu)`],
      },
      {
        masked: md`p(\mathbf{x}\,|\,\boldsymbol{X})=\int \boxed{\;?\;}\,p(\mu\,|\,\boldsymbol{X})\,\mathrm{d}\mu`,
        answer: md`p(\mathbf{x}\,|\,\mu)`,
        distractors: [md`p(\boldsymbol{X}\,|\,\mu)`, md`p(\mu\,|\,\mathbf{x})`],
      },
    ],
    source: [
      { doc: 'ch2', page: 39 },
      { doc: 'part1', page: 29 },
    ],
  },
  {
    id: 'f-c39',
    name: "Sostituzione delle due gaussiane nell'integrale",
    nameEn: 'Substituting the two Gaussian densities in the integral',
    latex: md`p(\mathbf{x}\,|\,\boldsymbol{X})=\int\frac{1}{\sqrt{2\pi}\sigma}\exp\left[-\frac{1}{2}\left(\frac{\mathbf{x}-\mu}{\sigma}\right)^2\right]\frac{1}{\sqrt{2\pi}\sigma_N}\exp\left[-\frac{1}{2}\left(\frac{\mu-\mu_N}{\sigma_N}\right)^2\right]\mathrm{d}\mu`,
    explain: md`Secondo rigo della slide 39: al posto di $p(\mathbf{x}\,|\,\mu)$ si scrive la gaussiana $N(\mu,\sigma^2)$, al posto di $p(\mu\,|\,\boldsymbol{X})$ la gaussiana $N(\mu_N,\sigma_N^2)$ ottenuta alla slide 37. Vista come funzione della variabile d'integrazione $\mu$, l'integranda è il prodotto di due campane: una centrata in $\mathbf{x}$ con larghezza $\sigma$, l'altra centrata in $\mu_N$ con larghezza $\sigma_N$. Il prodotto è grande solo dove le due campane si sovrappongono: per questo il risultato dipende da quanto $\mathbf{x}$ dista da $\mu_N$.`,
    symbols: [
      { s: md`\sigma`, meaning: md`deviazione standard nota dei dati` },
      { s: md`\sigma_N`, meaning: md`deviazione standard della posterior della media` },
      { s: md`\mu_N`, meaning: md`media della posterior` },
      { s: md`\frac{1}{\sqrt{2\pi}\sigma}`, meaning: md`costante di normalizzazione della gaussiana dei dati` },
    ],
    whenToUse: md`Per impostare il calcolo prima del completamento del quadrato: è il passo in cui le due ipotesi gaussiane entrano davvero nella formula ([«densità predittiva gaussiana»](#derivation:der06)).`,
    pitfalls: md`$(\mathbf{x}-\mu)^2=(\mu-\mathbf{x})^2$: come funzione di $\mu$ il primo fattore è una gaussiana centrata in $\mathbf{x}$. Le due costanti si portano fuori dall'integrale e danno $\frac{1}{2\pi\sigma\sigma_N}$, non $\frac{1}{\sqrt{2\pi}\,\sigma\sigma_N}$. Nella seconda campana la larghezza è $\sigma_N$, non $\sigma$.`,
    importance: 2,
    blanks: [
      {
        masked: md`p(\mathbf{x}\,|\,\boldsymbol{X})=\int\frac{1}{\sqrt{2\pi}\sigma}\exp\left[-\frac{1}{2}\left(\frac{\mathbf{x}-\mu}{\sigma}\right)^2\right]\frac{1}{\sqrt{2\pi}\sigma_N}\exp\left[-\frac{1}{2}\left(\frac{\mu-\boxed{\;?\;}}{\sigma_N}\right)^2\right]\mathrm{d}\mu`,
        answer: md`\mu_N`,
        distractors: [md`\mu_0`, md`\mathbf{x}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 39 },
      { doc: 'part1', page: 29 },
    ],
  },
  {
    id: 'f-c40',
    name: "Risultato dell'integrazione: gaussiana in x per un fattore f(σ,σN)",
    nameEn: 'Result of the integration: Gaussian in x times f(σ,σN)',
    latex: md`p(\mathbf{x}\,|\,\boldsymbol{X})=\frac{1}{2\pi\,\sigma\sigma_N}\exp\left[-\frac{1}{2}\frac{(\mathbf{x}-\mu_N)^2}{\sigma^2+\sigma_N^2}\right]f(\sigma,\sigma_N)`,
    explain: md`Terzo rigo della slide 39. Completando il quadrato in $\mu$, l'esponente si spezza in due parti: un quadrato in $\mu$, che resta dentro l'integrale, e $\frac{(\mathbf{x}-\mu_N)^2}{\sigma^2+\sigma_N^2}$, l'unico pezzo in cui compare $\mathbf{x}$, che esce dall'integrale come esponenziale. Ciò che resta dentro l'integrale è raccolto nel fattore $f(\sigma,\sigma_N)$. Come funzione di $\mathbf{x}$ la densità è quindi proporzionale a una gaussiana di media $\mu_N$ e varianza $\sigma^2+\sigma_N^2$: la conclusione si legge nell'esponente, senza calcolare $f$.`,
    symbols: [
      { s: md`\frac{1}{2\pi\,\sigma\sigma_N}`, meaning: md`prodotto delle due costanti di normalizzazione portate fuori dall'integrale` },
      { s: md`f(\sigma,\sigma_N)`, meaning: md`integrale residuo in $\mu$: dipende solo da $\sigma$ e $\sigma_N$, non da $\mathbf{x}$` },
      { s: md`\sigma^2+\sigma_N^2`, meaning: md`varianza della gaussiana in $\mathbf{x}$ che si ottiene` },
    ],
    whenToUse: md`Per riconoscere la forma gaussiana della densità predittiva: media e varianza si leggono nell'esponente. I passaggi del completamento del quadrato, omessi dalla slide, sono nella dimostrazione [«densità predittiva gaussiana»](#derivation:der06).`,
    pitfalls: md`La costante $\frac{1}{2\pi\sigma\sigma_N}$ da sola non normalizza: serve anche $f(\sigma,\sigma_N)$, e il prodotto dà $\frac{1}{\sqrt{2\pi(\sigma^2+\sigma_N^2)}}$. Nell'esponente il denominatore è la **somma delle varianze** $\sigma^2+\sigma_N^2$, non il prodotto $\sigma^2\sigma_N^2$ e non $(\sigma+\sigma_N)^2$.`,
    importance: 2,
    blanks: [
      {
        masked: md`p(\mathbf{x}\,|\,\boldsymbol{X})=\frac{1}{2\pi\,\sigma\sigma_N}\exp\left[-\frac{1}{2}\frac{(\mathbf{x}-\mu_N)^2}{\boxed{\;?\;}}\right]f(\sigma,\sigma_N)`,
        answer: md`\sigma^2+\sigma_N^2`,
        distractors: [md`\sigma^2\sigma_N^2`, md`(\sigma+\sigma_N)^2`, md`\sigma_N^2`],
      },
    ],
    source: [
      { doc: 'ch2', page: 39 },
      { doc: 'part1', page: 29 },
    ],
  },
  {
    id: 'f-c41',
    name: 'Il fattore f(σ,σN) non dipende da x',
    nameEn: 'The factor f(σ,σN)',
    latex: md`f(\sigma,\sigma_N)=\int\exp\left[-\frac{1}{2}\,\frac{\sigma^2+\sigma_N^2}{\sigma^2\sigma_N^2}\left(\mu-\frac{\sigma_N^2\,\mathbf{x}+\sigma^2\mu_N}{\sigma^2+\sigma_N^2}\right)^2\right]\mathrm{d}\mu=\sqrt{2\pi}\,\frac{\sigma\sigma_N}{\sqrt{\sigma^2+\sigma_N^2}}`,
    explain: md`Né la slide né le note definiscono $f(\sigma,\sigma_N)$: il nome dice solo che dipende da $\sigma$ e $\sigma_N$ e non da $\mathbf{x}$. È l'integrale gaussiano in $\mu$ che resta dopo il completamento del quadrato. Il centro della campana dipende da $\mathbf{x}$, ma traslare una campana non ne cambia l'area: il valore dipende solo dalla larghezza. Con $\int e^{-a u^2/2}\,du=\sqrt{2\pi/a}$ e $a=\frac{\sigma^2+\sigma_N^2}{\sigma^2\sigma_N^2}$ si ottiene $\sqrt{2\pi}\,\sigma\sigma_N/\sqrt{\sigma^2+\sigma_N^2}$, che moltiplicato per $\frac{1}{2\pi\sigma\sigma_N}$ dà esattamente la normalizzazione $\frac{1}{\sqrt{2\pi(\sigma^2+\sigma_N^2)}}$. La definizione esplicita è ricostruita dal testo di Duda, Hart e Stork seguito dalle slide: non compare nelle fonti del corso.`,
    symbols: [
      { s: md`f(\sigma,\sigma_N)`, meaning: md`integrale gaussiano residuo, costante rispetto a $\mathbf{x}$` },
      { s: md`\frac{\sigma^2+\sigma_N^2}{\sigma^2\sigma_N^2}`, meaning: md`precisione della campana in $\mu$: $\frac{1}{\sigma^2}+\frac{1}{\sigma_N^2}$` },
      { s: md`\frac{\sigma_N^2\,\mathbf{x}+\sigma^2\mu_N}{\sigma^2+\sigma_N^2}`, meaning: md`centro della campana in $\mu$: media di $\mathbf{x}$ e $\mu_N$ pesata dalle precisioni` },
    ],
    whenToUse: md`Solo se ti chiedono di completare il terzo rigo della slide 39. Per l'orale basta sapere che $f$ non dipende da $\mathbf{x}$ e quindi non cambia la forma della densità.`,
    pitfalls: md`Non serve calcolare $f$ per concludere che $p(\mathbf{x}\,|\,\boldsymbol{X})$ è gaussiana: la costante è comunque forzata dal fatto che la densità integra a 1. Il centro della campana in $\mu$ contiene $\mathbf{x}$, l'area no.`,
    importance: 1,
    blanks: [
      {
        masked: md`f(\sigma,\sigma_N)=\int\exp\left[-\frac{1}{2}\,\frac{\sigma^2+\sigma_N^2}{\sigma^2\sigma_N^2}\left(\mu-\frac{\sigma_N^2\,\mathbf{x}+\sigma^2\mu_N}{\sigma^2+\sigma_N^2}\right)^2\right]\mathrm{d}\mu=\boxed{\;?\;}`,
        answer: md`\sqrt{2\pi}\,\frac{\sigma\sigma_N}{\sqrt{\sigma^2+\sigma_N^2}}`,
        distractors: [md`\sqrt{2\pi(\sigma^2+\sigma_N^2)}`, md`\sqrt{2\pi}\,\sigma\sigma_N`, md`\frac{1}{\sqrt{2\pi}\,\sigma\sigma_N}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 39 },
      { doc: 'part1', page: 29 },
    ],
  },
  {
    id: 'f-c42',
    name: 'Densità predittiva gaussiana',
    nameEn: 'Predictive density in the Gaussian case',
    latex: md`p(\mathbf{x}\,|\,\boldsymbol{X})\sim N(\mu_N,\;\sigma^2+\sigma_N^2)`,
    explain: md`Conclusione in rosso della slide 39: «This means that $p(\mathbf{x}|\boldsymbol{X}) \sim N(\mu_N,\sigma^2+\sigma_N^2)$». La densità stimata ha la stessa forma del modello $p(\mathbf{x}\,|\,\mu)\sim N(\mu,\sigma^2)$, ma è centrata sulla media a posteriori $\mu_N$ e ha la varianza maggiorata di $\sigma_N^2$. Le note: poiché sia $p(\mathbf{x}\,|\,\mu)$ sia $p(\mu\,|\,\boldsymbol{X})$ sono gaussiane, il risultato è gaussiano. Controllo rapido: una nuova osservazione è $\mathbf{x}=\mu+\varepsilon$, con $\mu\,|\,\boldsymbol{X}\sim N(\mu_N,\sigma_N^2)$ e rumore $\varepsilon\sim N(0,\sigma^2)$ indipendente; sommando due gaussiane indipendenti le medie e le varianze si sommano. Con i salmoni: $p(\mathbf{x}\,|\,\boldsymbol{X})\sim N(12.25,\;4+0.9=4.9)$.`,
    symbols: [
      { s: md`\mu_N`, meaning: md`media della densità predittiva, uguale alla media a posteriori` },
      { s: md`\sigma^2+\sigma_N^2`, meaning: md`varianza della densità predittiva: rumore dei dati più incertezza su $\mu$` },
      { s: md`N(a,b)`, meaning: md`gaussiana di media $a$ e **varianza** $b$` },
    ],
    whenToUse: md`È il risultato finale dell'esempio gaussiano: la densità stimata con cui si ragiona su una nuova osservazione. All'orale va scritta a memoria insieme a $\mu_N$ e $\sigma_N^2$ ([«densità predittiva gaussiana»](#derivation:der06)).`,
    pitfalls: md`La varianza non è $\sigma^2$ né $\sigma_N^2$ da sola, ma la loro somma. «Poiché entrambe sono gaussiane» basta perché $\mu$ entra in $p(\mathbf{x}\,|\,\mu)$ come parametro di posizione con $\sigma^2$ fissa: se il parametro incerto fosse la varianza, una posterior gaussiana non darebbe una predittiva gaussiana.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\mathbf{x}\,|\,\boldsymbol{X})\sim N(\mu_N,\;\boxed{\;?\;})`,
        answer: md`\sigma^2+\sigma_N^2`,
        distractors: [md`\sigma^2`, md`\sigma_N^2`, md`\sigma^2\sigma_N^2`],
      },
      {
        masked: md`p(\mathbf{x}\,|\,\boldsymbol{X})\sim N(\boxed{\;?\;},\;\sigma^2+\sigma_N^2)`,
        answer: md`\mu_N`,
        distractors: [md`\mu_0`, md`\bar{X}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 39 },
      { doc: 'part1', page: 29 },
    ],
  },
  {
    id: 'f-c43',
    name: 'La media inferita dalla densità stimata',
    nameEn: 'The mean inferred from the estimated density (end of slide p39)',
    latex: md`\mu=\mu_N`,
    explain: md`La slide 39 conclude: «and thus μ=μN since p(x|μ) ~ N(μ,σ²)». Confrontando $p(\mathbf{x}\,|\,\boldsymbol{X})\sim N(\mu_N,\sigma^2+\sigma_N^2)$ con il modello $p(\mathbf{x}\,|\,\mu)\sim N(\mu,\sigma^2)$, il posto della media ignota $\mu$ è preso da $\mu_N$: il valore di $\mu$ che si inferisce dalla distribuzione stimata è la media a posteriori. È il senso della frase della slide 40 secondo cui l'approccio bayesiano stima una distribuzione «from which θ is inferred». Nel caso gaussiano la posterior è simmetrica e unimodale, quindi $\mu_N$ ne è insieme media, moda e mediana: media a posteriori e massimo a posteriori danno lo stesso valore. La frase compare solo nella slide, non nelle note.`,
    symbols: [
      { s: md`\mu`, meaning: md`media ignota del modello $N(\mu,\sigma^2)$` },
      { s: md`\mu_N`, meaning: md`valore inferito per la media: la media a posteriori` },
    ],
    whenToUse: md`Per rispondere a «alla fine, qual è la stima bayesiana di $\mu$?». Con i salmoni: $\mu_N=12.25$, contro la stima ML $\bar{X}=12.5$.`,
    pitfalls: md`L'identificazione riguarda solo la media. La varianza della predittiva è $\sigma^2+\sigma_N^2$, non $\sigma^2$: per $N$ finito $p(\mathbf{x}\,|\,\boldsymbol{X})$ non coincide con il modello $N(\mu_N,\sigma^2)$ ottenuto inserendo la stima puntuale; le due densità coincidono solo quando $\sigma_N^2\to 0$.`,
    importance: 2,
    blanks: [
      {
        masked: md`\mu=\boxed{\;?\;}`,
        answer: md`\mu_N`,
        distractors: [md`\mu_0`, md`\bar{X}`],
      },
    ],
    source: [{ doc: 'ch2', page: 39 }],
  },
  {
    id: 'f-c44',
    name: 'Varianza predittiva: variabilità intrinseca più incertezza sul parametro',
    nameEn: 'Predictive variance: inherent variance plus uncertainty in the estimate of μ',
    latex: md`\underbrace{\sigma^2}_{\text{varianza intrinseca}}+\underbrace{\sigma_N^2}_{\text{incertezza su }\mu}`,
    explain: md`Le note: la distribuzione predittiva ha media $\mu_N$ e varianza $\sigma^2+\sigma_N^2$, «incorporating both the inherent variance $\sigma^2$ and the uncertainty in the estimate of $\mu$». $\sigma^2$ è la variabilità propria dei dati, che resterebbe anche conoscendo $\mu$ esattamente; $\sigma_N^2$ è l'incertezza residua su $\mu$, che si annulla per $N\to\infty$. Con pochi campioni la predittiva è più larga del modello con la stima puntuale inserita, $N(\hat{\mu},\sigma^2)$; al crescere di $N$ le due densità coincidono. Con i salmoni: $4+0.9=4.9$, deviazione standard circa $2.21$ invece di $2$.`,
    symbols: [
      { s: md`\sigma^2`, meaning: md`varianza intrinseca dei dati (*inherent variance*): rumore che nessun campione in più elimina` },
      { s: md`\sigma_N^2`, meaning: md`incertezza residua sulla stima di $\mu$ (*uncertainty in the estimate*), che cala come $1/N$` },
    ],
    whenToUse: md`Per spiegare il vantaggio bayesiano della quantificazione dell'incertezza (*uncertainty quantification*): la predittiva sa di non conoscere $\mu$ esattamente, il modello con la stima ML inserita no.`,
    pitfalls: md`Per $N\to\infty$ la varianza predittiva tende a $\sigma^2$, non a $0$: a sparire è solo $\sigma_N^2$. Non confondere $\sigma_N^2$ (larghezza della posterior, nello spazio di $\mu$) con $\sigma^2+\sigma_N^2$ (larghezza della predittiva, nello spazio di $\mathbf{x}$).`,
    importance: 3,
    blanks: [
      {
        masked: md`\underbrace{\boxed{\;?\;}}_{\text{varianza intrinseca}}+\underbrace{\sigma_N^2}_{\text{incertezza su }\mu}`,
        answer: md`\sigma^2`,
        distractors: [md`\sigma_0^2`, md`\sigma_N^2`],
      },
      {
        masked: md`\underbrace{\sigma^2}_{\text{varianza intrinseca}}+\underbrace{\boxed{\;?\;}}_{\text{incertezza su }\mu}`,
        answer: md`\sigma_N^2`,
        distractors: [md`\sigma_0^2`, md`\sigma^2`],
      },
    ],
    source: [{ doc: 'part1', page: 29 }],
  },

  // --- c47, c49: ML contro Bayes (slide 40, note p30) ----------------------------------------------
  {
    id: 'f-c47',
    name: 'Bayes stima una distribuzione da cui si inferisce θ',
    nameEn: 'The Bayesian approach estimates a distribution from which θ is inferred',
    latex: md`p(\mathbf{x}\,|\,\boldsymbol{X})`,
    explain: md`Slide 40: «The ML approach estimates a point in θ space while the Bayesian approach estimates a distribution $p(\mathbf{x}|\boldsymbol{X})$ from which θ is inferred». ML restituisce un solo vettore $\hat{\boldsymbol{\theta}}$; Bayes restituisce un'intera densità, costruita mediando i modelli $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ pesati dalla posterior. Le note: il risultato è una distribuzione a posteriori che riflette sia i dati osservati sia le convinzioni a priori. Nell'esempio gaussiano: da $p(\mathbf{x}\,|\,\boldsymbol{X})\sim N(\mu_N,\sigma^2+\sigma_N^2)$ si legge $\mu=\mu_N$.`,
    symbols: [
      { s: md`\mathbf{x}`, meaning: md`nuova osservazione, variabile della densità stimata` },
      { s: md`\boldsymbol{X}`, meaning: md`insieme dei campioni di training osservati` },
      { s: md`p(\mathbf{x}\,|\,\boldsymbol{X})`, meaning: md`distribuzione stimata dall'approccio bayesiano` },
    ],
    whenToUse: md`Primo punto del confronto ML contro Bayes (*ML versus Bayesian estimation*): «ML stima un punto, Bayes una distribuzione».`,
    pitfalls: md`Il condizionamento è sui dati $\boldsymbol{X}$, non su un valore del parametro: $p(\mathbf{x}\,|\,\hat{\boldsymbol{\theta}}_{ML})$ è il modello di ML con la stima inserita (*plug-in*), un solo modello. In Bayes $\boldsymbol{\theta}$ non si stima direttamente: si inferisce dalla distribuzione.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\mathbf{x}\,|\,\boxed{\;?\;})`,
        answer: md`\boldsymbol{X}`,
        distractors: [md`\hat{\boldsymbol{\theta}}_{ML}`, md`\boldsymbol{\theta}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 40 },
      { doc: 'part1', page: 30 },
    ],
  },
  {
    id: 'f-c49',
    name: 'Prior uniforme: la soluzione bayesiana si riduce a ML',
    nameEn: 'ML and Bayes solutions are equivalent if the prior p(θ) is uniform',
    latex: md`p(\boldsymbol{\theta})`,
    explain: md`Seconda condizione di equivalenza della slide 40: «or if the prior $p(\boldsymbol{\theta})$ is uniform». Le note (*Uniform Prior*): un prior uniforme significa che non si assume alcuna conoscenza a priori, e la soluzione bayesiana si riduce a quella ML «because the prior doesn't influence the posterior in this case». Con $p(\boldsymbol{\theta})=c$ costante la $c$ si semplifica nella formula di Bayes, quindi $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\propto p(\boldsymbol{X}\,|\,\boldsymbol{\theta})$: il massimo della posterior (stima *maximum a posteriori*, MAP: termine che non compare in queste slide ma è quello usato da Passerini) coincide con la stima ML. Nell'esempio gaussiano il prior uniforme è il limite $\sigma_0^2\to\infty$, che dà $\mu_N\to\bar{X}$ per ogni $N\ge 1$.`,
    symbols: [
      { s: md`p(\boldsymbol{\theta})`, meaning: md`prior sul vettore dei parametri, qui uniforme: costante su tutto lo spazio dei parametri` },
    ],
    whenToUse: md`All'orale, come seconda delle due condizioni in cui ML e Bayes coincidono, insieme al limite di infiniti campioni ([«perché ML e Bayes coincidono»](#derivation:der07)).`,
    pitfalls: md`Un prior uniforme su tutta la retta non integra a 1 (prior improprio, *improper prior*): va inteso come limite di prior sempre più larghi, oppure come uniforme su un intervallo che contiene tutti i valori plausibili, stima ML compresa. Coincidono le stime puntuali, non tutto: con $\sigma_0^2\to\infty$ resta $\sigma_N^2=\sigma^2/N$ e la predittiva $N(\bar{X},\sigma^2+\sigma^2/N)$ è più larga del modello ML $N(\bar{X},\sigma^2)$.`,
    importance: 3,
    blanks: [
      {
        masked: md`p(\boldsymbol{\theta})=c\;\Rightarrow\;p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\propto\boxed{\;?\;}`,
        answer: md`p(\boldsymbol{X}\,|\,\boldsymbol{\theta})`,
        distractors: [md`p(\boldsymbol{\theta})`, md`p(\mathbf{x}\,|\,\boldsymbol{X})`],
      },
    ],
    source: [
      { doc: 'ch2', page: 40 },
      { doc: 'part1', page: 30 },
    ],
  },

  // --- c54-c58: pagina di confine, stime ML di media e covarianza (note p26) ------------------------
  {
    id: 'f-c54',
    name: 'Stima ML del vettore medio gaussiano',
    nameEn: 'ML estimate of the mean vector',
    latex: md`\hat{\mathbf{m}}=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k`,
    explain: md`In cima alla pagina 26 delle note si chiude il modello gaussiano (la frase introduttiva sta in fondo alla pagina 25): dato un insieme di $N$ campioni di training indipendenti e identicamente distribuiti (*iid*), la stima a massima verosimiglianza del vettore medio di una pdf gaussiana multivariata è la media campionaria dei vettori. È la versione vettoriale della $\bar{X}$ verso cui tende la media a posteriori: il termine ML del confronto con Bayes. Con i salmoni ($N=4$, luminosità $12.1$, $13.4$, $11.2$, $13.3$): $\hat{m}=50/4=12.5$.`,
    symbols: [
      { s: md`\hat{\mathbf{m}}`, meaning: md`stima ML del vettore medio` },
      { s: md`\mathbf{x}_k`, meaning: md`$k$-esimo campione di training, vettore di $n$ feature` },
      { s: md`N`, meaning: md`numero di campioni di training` },
    ],
    whenToUse: md`Ogni volta che stimi una gaussiana dai dati, per esempio la densità di una classe in un classificatore bayesiano; qui fa da termine di paragone ML per la media a posteriori.`,
    pitfalls: md`È non distorta per ogni $N$: $E\{\hat{\mathbf{m}}\}=\mathbf{m}$. È un vettore: si media componente per componente. Si divide per $N$, non per $N-1$: la correzione $N-1$ riguarda la covarianza.`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{\mathbf{m}}=\boxed{\;?\;}\sum_{k=1}^{N}\mathbf{x}_k`,
        answer: md`\frac{1}{N}`,
        distractors: [md`\frac{1}{N-1}`, md`N`],
      },
    ],
    source: [{ doc: 'part1', page: 26 }],
  },
  {
    id: 'f-c55',
    name: 'Stima ML della matrice di covarianza: due forme equivalenti',
    nameEn: 'ML estimate of the covariance matrix',
    latex: md`\hat{\Sigma}=\frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\mathbf{x}_k^t-\hat{\mathbf{m}}\hat{\mathbf{m}}^t`,
    explain: md`La stima ML della covarianza è la media dei prodotti esterni degli scarti dei campioni dalla media stimata. La seconda forma, media dei prodotti esterni $\mathbf{x}_k\mathbf{x}_k^t$ meno $\hat{\mathbf{m}}\hat{\mathbf{m}}^t$, si ottiene sviluppando il prodotto e usando $\sum_{k}\mathbf{x}_k=N\hat{\mathbf{m}}$ ([«le due forme della stima ML della covarianza coincidono»](#derivation:der08)). Ogni prodotto esterno è una matrice $n\times n$: la stima è simmetrica e semidefinita positiva. In una dimensione diventa la varianza campionaria con $1/N$: «media dei quadrati meno quadrato della media».`,
    symbols: [
      { s: md`\hat{\Sigma}`, meaning: md`stima ML della matrice di covarianza` },
      { s: md`(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t`, meaning: md`prodotto esterno (*outer product*) dello scarto: matrice $n\times n$` },
      { s: md`(\cdot)^t`, meaning: md`trasposto` },
      { s: md`\hat{\mathbf{m}}\hat{\mathbf{m}}^t`, meaning: md`prodotto esterno della media stimata con sé stessa` },
    ],
    whenToUse: md`Per stimare la covarianza di una classe gaussiana. La seconda forma è comoda nel calcolo incrementale: basta accumulare $\sum_k\mathbf{x}_k$ e $\sum_k\mathbf{x}_k\mathbf{x}_k^t$ in una sola passata sui dati.`,
    pitfalls: md`Si divide per $N$ e gli scarti sono rispetto alla media **stimata**: per questo la stima è distorta, $E\{\hat{\Sigma}\}=\frac{N-1}{N}\Sigma$. È un prodotto esterno $(\cdot)(\cdot)^t$, non interno $(\cdot)^t(\cdot)$, che darebbe uno scalare.`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{\Sigma}=\frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})\boxed{\;?\;}`,
        answer: md`(\mathbf{x}_k-\hat{\mathbf{m}})^t`,
        distractors: [md`(\mathbf{x}_k-\hat{\mathbf{m}})`, md`(\hat{\mathbf{m}}-\mathbf{x}_k)^t`],
      },
      {
        masked: md`\hat{\Sigma}=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k\mathbf{x}_k^t-\boxed{\;?\;}`,
        answer: md`\hat{\mathbf{m}}\hat{\mathbf{m}}^t`,
        distractors: [md`\hat{\mathbf{m}}^t\hat{\mathbf{m}}`, md`\frac{1}{N}\hat{\mathbf{m}}\hat{\mathbf{m}}^t`],
      },
    ],
    source: [{ doc: 'part1', page: 26 }],
  },
  {
    id: 'f-c56',
    name: 'Proprietà delle stime ML gaussiane: consistenza',
    nameEn: 'Properties of the estimates: asymptotically unbiased, efficient, consistent',
    latex: md`N\to+\infty:\quad\hat{\mathbf{m}}\to\mathbf{m},\qquad\hat{\Sigma}\to\Sigma`,
    explain: md`Le note elencano tre proprietà delle stime (*Properties of the Estimates*). **Asintoticamente non distorte** (*asymptotically unbiased*): al crescere di $N$ le stime si avvicinano ai valori veri di $\mathbf{m}$ e $\Sigma$. **Efficienti** (*efficient*): raggiungono la minima varianza possibile per stimatori non distorti. **Consistenti** (*consistent*): per $N\to+\infty$ $\hat{\mathbf{m}}$ e $\hat{\Sigma}$ convergono ai valori veri. La formula scrive quest'ultima: più dati, stime sempre più vicine alla verità.`,
    symbols: [
      { s: md`\hat{\mathbf{m}},\;\hat{\Sigma}`, meaning: md`stime ML di vettore medio e matrice di covarianza` },
      { s: md`\mathbf{m},\;\Sigma`, meaning: md`valori veri di vettore medio e matrice di covarianza` },
      { s: md`\to`, meaning: md`convergenza delle stime ai valori veri al crescere del numero di campioni` },
    ],
    whenToUse: md`Quando ti chiedono se le stime ML della gaussiana sono «buone»: collegale ai criteri di bontà di uno stimatore (distorsione, varianza, consistenza).`,
    pitfalls: md`Asintoticamente non distorta non vuol dire non distorta: $\hat{\Sigma}$ ha un bias per $N$ finito, $\hat{\mathbf{m}}$ no. L'efficienza come la definiscono le note (minima varianza tra gli stimatori non distorti) vale in senso stretto per $\hat{\mathbf{m}}$; per $\hat{\Sigma}$, distorta per $N$ finito, va letta in senso asintotico (osservazione non scritta nelle note).`,
    importance: 2,
    blanks: [
      {
        masked: md`N\to+\infty:\quad\hat{\mathbf{m}}\to\mathbf{m},\qquad\hat{\Sigma}\to\boxed{\;?\;}`,
        answer: md`\Sigma`,
        distractors: [md`\Sigma+\mathbf{m}\mathbf{m}^t`, md`\mathbf{0}`],
      },
    ],
    source: [{ doc: 'part1', page: 26 }],
  },
  {
    id: 'f-c57',
    name: 'Valore atteso della stima ML della media: non distorta',
    nameEn: 'Expected value of the ML mean estimate',
    latex: md`E\{\hat{\mathbf{m}}\}=\mathbf{m}`,
    explain: md`«The expected values of the ML estimates are»: la prima riga dice che la stima ML del vettore medio è non distorta (*unbiased*) per ogni $N$. Segue dalla linearità del valore atteso: $E\{\hat{\mathbf{m}}\}=\frac{1}{N}\sum_{k=1}^{N}E\{\mathbf{x}_k\}=\frac{1}{N}\cdot N\mathbf{m}=\mathbf{m}$.`,
    symbols: [
      { s: md`E\{\cdot\}`, meaning: md`valore atteso rispetto all'estrazione dei campioni di training` },
      { s: md`\mathbf{m}`, meaning: md`vero vettore medio` },
    ],
    whenToUse: md`Per mostrare che la media ML non ha bias, a differenza della covarianza ML: le due righe delle note vanno dette insieme.`,
    pitfalls: md`Non distorta non vuol dire esatta: $\hat{\mathbf{m}}$ fluttua attorno a $\mathbf{m}$ da un insieme di campioni all'altro, con covarianza $\Sigma/N$ (fatto standard, non scritto nelle note).`,
    importance: 3,
    blanks: [
      {
        masked: md`E\{\hat{\mathbf{m}}\}=\boxed{\;?\;}`,
        answer: md`\mathbf{m}`,
        distractors: [md`\frac{N-1}{N}\,\mathbf{m}`, md`\hat{\mathbf{m}}`],
      },
    ],
    source: [{ doc: 'part1', page: 26 }],
  },
  {
    id: 'f-c57-2',
    name: 'Valore atteso della stima ML della covarianza: il fattore di bias',
    nameEn: 'Expected value of the ML covariance estimate',
    latex: md`E\{\hat{\Sigma}\}=\frac{N-1}{N}\,\Sigma`,
    explain: md`La stima ML della covarianza è distorta per $N$ finito: in media sottostima $\Sigma$ del fattore $\frac{N-1}{N}$. Il motivo: gli scarti sono misurati rispetto a $\hat{\mathbf{m}}$, calcolata sugli stessi campioni e quindi più vicina a loro della media vera; si perde un grado di libertà. Il fattore tende a 1 per $N\to\infty$: per questo la stima è asintoticamente non distorta. Le note riportano il risultato senza dimostrazione; i passaggi sono nel complemento [«perché il valore atteso è (N−1)/N per Σ»](#derivation:der10).`,
    symbols: [
      { s: md`E\{\hat{\Sigma}\}`, meaning: md`valore atteso della stima ML della covarianza` },
      { s: md`\frac{N-1}{N}`, meaning: md`fattore di bias, minore di 1: con $N=4$ vale $0.75$, con $N=100$ vale $0.99$` },
      { s: md`\Sigma`, meaning: md`vera matrice di covarianza` },
    ],
    whenToUse: md`Per giustificare lo stimatore corretto con $N-1$ e come esempio di stimatore distorto ma consistente.`,
    pitfalls: md`Il fattore è $\frac{N-1}{N}<1$: la stima ML **sottostima**, non sovrastima. Con $N=1$ la stima ML è la matrice nulla (l'unico scarto è zero) e il fattore vale $0$, coerente.`,
    importance: 3,
    blanks: [
      {
        masked: md`E\{\hat{\Sigma}\}=\boxed{\;?\;}\,\Sigma`,
        answer: md`\frac{N-1}{N}`,
        distractors: [md`\frac{N}{N-1}`, md`1`, md`\frac{1}{N}`],
      },
    ],
    source: [{ doc: 'part1', page: 26 }],
  },
  {
    id: 'f-c58',
    name: 'Stimatore non distorto elementare della covarianza',
    nameEn: 'Elementary unbiased estimator for the covariance matrix',
    latex: md`\hat{\Sigma}=\frac{1}{N-1}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t`,
    explain: md`Per ottenere uno stimatore non distorto elementare (*elementary unbiased estimator*) della covarianza, soprattutto con campioni di piccola dimensione, si divide per $N-1$ invece che per $N$. Le note: questo fattore di correzione garantisce che lo stimatore di $\Sigma$ resti non distorto, «particularly when $N$ is small». Ora $E\{\hat{\Sigma}\}=\Sigma$ per ogni $N\ge 2$.`,
    symbols: [
      { s: md`\frac{1}{N-1}`, meaning: md`normalizzazione corretta: $N-1$ gradi di libertà, perché uno se ne va nella stima di $\hat{\mathbf{m}}$` },
      { s: md`\mathbf{x}_k-\hat{\mathbf{m}}`, meaning: md`scarto del $k$-esimo campione dalla media stimata` },
      { s: md`\hat{\Sigma}`, meaning: md`qui lo stimatore corretto, non quello ML` },
    ],
    whenToUse: md`Con $N$ piccolo, quando il bias $\frac{N-1}{N}$ pesa; per $N$ grande la differenza dalla stima ML è trascurabile.`,
    pitfalls: md`Le note usano lo stesso simbolo $\hat{\Sigma}$ per due stimatori diversi: con $\frac{1}{N}$ è la stima ML (distorta), con $\frac{1}{N-1}$ la versione corretta, che non è più la stima ML. Serve $N\ge 2$.`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{\Sigma}=\boxed{\;?\;}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t`,
        answer: md`\frac{1}{N-1}`,
        distractors: [md`\frac{1}{N}`, md`\frac{N-1}{N}`, md`\frac{1}{N+1}`],
      },
    ],
    source: [{ doc: 'part1', page: 26 }],
  },
  {
    id: 'f-c58-2',
    name: 'Correzione del bias della covarianza ML',
    nameEn: 'Bias correction of the ML covariance estimate',
    latex: md`\hat{\Sigma}=\frac{N}{N-1}\cdot\frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t=\frac{1}{N-1}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t`,
    explain: md`Le note: «the formula can be adjusted multiplying by $\frac{N}{N-1}$». Per linearità del valore atteso $E\{\frac{N}{N-1}\hat{\Sigma}_{ML}\}=\frac{N}{N-1}\cdot\frac{N-1}{N}\Sigma=\Sigma$: il fattore di bias si cancella. Semplificando $N$ con $\frac{1}{N}$ resta la divisione per $N-1$. I passaggi sono nella dimostrazione [«dal bias allo stimatore non distorto»](#derivation:der09).`,
    symbols: [
      { s: md`\frac{N}{N-1}`, meaning: md`fattore di correzione del bias (*correction factor*), maggiore di 1` },
      { s: md`\frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t`, meaning: md`la stima ML $\hat{\Sigma}_{ML}$ da correggere` },
    ],
    whenToUse: md`Per ricostruire a memoria lo stimatore corretto partendo dal bias: si moltiplica per l'inverso del fattore $\frac{N-1}{N}$.`,
    pitfalls: md`Si moltiplica per $\frac{N}{N-1}$, l'inverso del fattore di bias, non per $\frac{N-1}{N}$, che peggiorerebbe la sottostima. Il fattore tende a 1 per $N$ grande: la correzione conta solo con pochi campioni (con $N=4$ vale $1.33$).`,
    importance: 3,
    blanks: [
      {
        masked: md`\hat{\Sigma}=\boxed{\;?\;}\cdot\frac{1}{N}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t=\frac{1}{N-1}\sum_{k=1}^{N}(\mathbf{x}_k-\hat{\mathbf{m}})(\mathbf{x}_k-\hat{\mathbf{m}})^t`,
        answer: md`\frac{N}{N-1}`,
        distractors: [md`\frac{N-1}{N}`, md`N`, md`\frac{1}{N-1}`],
      },
    ],
    source: [{ doc: 'part1', page: 26 }],
  },

  // --- c60-c61: rilettura con i campioni virtuali e casi limite nei parametri (dalle equazioni della slide 37) ---
  {
    id: 'f-c60',
    name: 'Il prior vale come n0 campioni virtuali',
    nameEn: 'The prior acts as n0 equivalent (virtual) samples',
    latex: md`\mu_N=\frac{N\,\bar{X}+n_0\,\mu_0}{N+n_0},\qquad n_0=\frac{\sigma^2}{\sigma_0^2}`,
    explain: md`Rilettura della formula di $\mu_N$ della slide 37, non scritta nella fonte: dividendo numeratore e denominatore dei due pesi per $\sigma_0^2$ si ottiene la media aritmetica di $N$ campioni reali di media $\bar{X}$ e di $n_0$ campioni «virtuali» tutti uguali a $\mu_0$. Il prior pesa come $n_0$ osservazioni. Con $N=n_0$ la media a posteriori sta esattamente a metà tra $\mu_0$ e $\bar{X}$. Un prior sicuro ($\sigma_0$ piccolo) vale molti campioni virtuali e trattiene $\mu_N$; un prior vago ($\sigma_0$ grande) ne vale pochissimi, e con $\sigma_0\to\infty$ si ha $n_0\to 0$: il prior uniforme della slide 40. Con i salmoni: $n_0=4/9\approx 0.44$ salmoni, e $\mu_N=(4\cdot 12.5+0.44\cdot 10)/4.44=12.25$.`,
    symbols: [
      { s: md`n_0`, meaning: md`numero equivalente di campioni portati dal prior (campioni virtuali)` },
      { s: md`\bar{X}`, meaning: md`media campionaria degli $N$ campioni reali` },
      { s: md`\mu_0`, meaning: md`valore di ogni campione virtuale: la media a priori` },
    ],
    whenToUse: md`Per capire al volo il peso relativo di prior e dati, e per collegarti ai pseudo-conteggi (*pseudo-counts*) dei prior coniugati Beta e Dirichlet di Passerini.`,
    pitfalls: md`$n_0$ in generale non è intero e non dipende da $N$. Il rapporto è $\sigma^2/\sigma_0^2$ (rumore dei dati diviso incertezza del prior), non il contrario: un prior più incerto vale **meno** campioni.`,
    importance: 2,
    blanks: [
      {
        masked: md`\mu_N=\frac{N\,\bar{X}+n_0\,\mu_0}{N+n_0},\qquad n_0=\boxed{\;?\;}`,
        answer: md`\frac{\sigma^2}{\sigma_0^2}`,
        distractors: [md`\frac{\sigma_0^2}{\sigma^2}`, md`\frac{\sigma^2}{N\sigma_0^2}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 37 },
      { doc: 'part1', page: 28 },
    ],
  },
  {
    id: 'f-c60-2',
    name: 'Varianza a posteriori con i campioni virtuali',
    nameEn: 'Posterior variance with virtual samples',
    latex: md`\sigma_N^2=\frac{\sigma^2}{N+n_0}`,
    explain: md`Anche $\sigma_N^2$ si rilegge con i campioni virtuali (rilettura non scritta nella fonte): $\frac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2}$, diviso sopra e sotto per $\sigma_0^2$, diventa $\frac{\sigma^2}{N+n_0}$, la varianza della media di $N+n_0$ campioni indipendenti di varianza $\sigma^2$. Con $N=0$ dà $\sigma^2/n_0=\sigma_0^2$: il prior da solo. Con i salmoni: $4/(4+0.44)=0.9$.`,
    symbols: [
      { s: md`n_0`, meaning: md`campioni virtuali del prior, $\sigma^2/\sigma_0^2$` },
      { s: md`N+n_0`, meaning: md`numero totale di campioni, reali più virtuali` },
    ],
    whenToUse: md`Per ricordare $\sigma_N^2$ senza formula: «varianza della media di tutti i campioni, veri e virtuali».`,
    pitfalls: md`Il numeratore è $\sigma^2$, la varianza dei dati, non $\sigma_0^2$. $\sigma_N^2$ dipende da $N$ ma non dai valori dei campioni.`,
    importance: 2,
    blanks: [
      {
        masked: md`\sigma_N^2=\frac{\sigma^2}{\boxed{\;?\;}}`,
        answer: md`N+n_0`,
        distractors: [md`N`, md`n_0`, md`N\,n_0`],
      },
    ],
    source: [
      { doc: 'ch2', page: 37 },
      { doc: 'part1', page: 28 },
    ],
  },
  {
    id: 'f-c61',
    name: 'Caso limite: prior dogmatico, σ0² → 0',
    nameEn: 'Dogmatic prior: σ0² → 0',
    latex: md`\sigma_0^2\to 0:\quad\mu_N\to\mu_0,\qquad\sigma_N^2\to 0`,
    explain: md`Le fonti discutono solo i casi limite in $N$; le stesse equazioni della slide 37 danno anche quelli nei parametri (casi ricavati, non scritti nelle fonti). Con un prior di varianza nulla $n_0=\sigma^2/\sigma_0^2\to\infty$: il peso del prior tende a 1 per qualunque $N$ fissato, e la varianza a posteriori si annulla perché il prior è già una delta su $\mu_0$. I dati non spostano mai la stima. I passaggi sono nella dimostrazione [«casi limite in σ0² e σ²»](#derivation:der11).`,
    symbols: [
      { s: md`\sigma_0^2`, meaning: md`varianza del prior: $0$ vuol dire certezza assoluta su $\mu_0$ (prior dogmatico)` },
    ],
    whenToUse: md`Per mostrare l'ipotesi nascosta dietro le frasi delle note: il limite $N\to\infty$ e l'equivalenza asintotica con ML richiedono $\sigma_0^2>0$, cioè un prior che non escluda il valore vero.`,
    pitfalls: md`I due limiti non si scambiano: per ogni $\sigma_0^2>0$ fissato, $N\to\infty$ porta $\mu_N$ verso $\bar{X}$; con $\sigma_0^2=0$ esatto $\mu_N=\mu_0$ per ogni $N$. Qui $\sigma_N^2\to 0$ non vuol dire aver imparato dai dati: la certezza era già nel prior.`,
    importance: 2,
    blanks: [
      {
        masked: md`\sigma_0^2\to 0:\quad\mu_N\to\boxed{\;?\;},\qquad\sigma_N^2\to 0`,
        answer: md`\mu_0`,
        distractors: [md`\bar{X}`, md`\frac{\mu_0+\bar{X}}{2}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 37 },
      { doc: 'part1', page: 28 },
    ],
  },
  {
    id: 'f-c61-2',
    name: 'Caso limite: prior vago, σ0² → ∞',
    nameEn: 'Vague prior: σ0² → ∞',
    latex: md`\sigma_0^2\to\infty:\quad\mu_N\to\bar{X},\qquad\sigma_N^2\to\frac{\sigma^2}{N}`,
    explain: md`Con un prior larghissimo $n_0\to 0$: il peso del prior tende a 0 e $\mu_N$ coincide con la stima ML $\bar{X}$ per ogni $N\ge 1$. È il prior uniforme della slide 40: la media a posteriori coincide con la stima ML. Resta però $\sigma_N^2\to\sigma^2/N$, la varianza della media campionaria: la posterior non collassa, e la predittiva $N(\bar{X},\sigma^2+\sigma^2/N)$ resta più larga del modello ML $N(\bar{X},\sigma^2)$. Caso ricavato dalle equazioni della slide 37, non scritto nelle fonti.`,
    symbols: [
      { s: md`\sigma_0^2\to\infty`, meaning: md`prior vago: nessuna preferenza tra i valori di $\mu$` },
      { s: md`\frac{\sigma^2}{N}`, meaning: md`varianza della media campionaria` },
    ],
    whenToUse: md`Come esempio concreto della seconda condizione di equivalenza tra ML e Bayes (prior uniforme), sull'esempio gaussiano.`,
    pitfalls: md`Coincide la stima di $\mu$, non la densità predittiva: la varianza predittiva resta $\sigma^2+\sigma^2/N$. Serve $N\ge 1$: con $N=0$ la posterior è il prior stesso, con varianza infinita.`,
    importance: 2,
    blanks: [
      {
        masked: md`\sigma_0^2\to\infty:\quad\mu_N\to\bar{X},\qquad\sigma_N^2\to\boxed{\;?\;}`,
        answer: md`\frac{\sigma^2}{N}`,
        distractors: [md`0`, md`\sigma^2`, md`\infty`],
      },
    ],
    source: [
      { doc: 'ch2', page: 37 },
      { doc: 'part1', page: 28 },
      { doc: 'ch2', page: 40 },
    ],
  },
  {
    id: 'f-c61-3',
    name: 'Caso limite: dati senza rumore, σ² → 0',
    nameEn: 'Noiseless data: σ² → 0',
    latex: md`\sigma^2\to 0\;(N\ge 1):\quad\mu_N\to\bar{X},\qquad\sigma_N^2\to 0`,
    explain: md`Se le misure sono esatte, anche un solo campione ha precisione infinita ($1/\sigma^2\to\infty$) e domina il prior: $n_0\to 0$, il peso dei dati tende a 1 e $\sigma_N^2=\sigma^2/(N+n_0)\to 0$. La posterior diventa una delta su $\bar{X}$ già con $N=1$: un campione basta a conoscere $\mu$. Caso ricavato dalle equazioni della slide 37, non scritto nelle fonti.`,
    symbols: [
      { s: md`\sigma^2`, meaning: md`varianza nota dei dati: $0$ vuol dire misure senza rumore` },
      { s: md`N\ge 1`, meaning: md`serve almeno un campione` },
    ],
    whenToUse: md`Come controllo di buon senso delle formule della slide 37: con dati perfetti il prior non serve.`,
    pitfalls: md`Serve $N\ge 1$ (con $N=0$ la posterior resta il prior) e $\sigma_0^2>0$. Il limite è in $\sigma^2$ con $N$ fissato, diverso dal limite $N\to\infty$ delle note, anche se il risultato è lo stesso.`,
    importance: 2,
    blanks: [
      {
        masked: md`\sigma^2\to 0\;(N\ge 1):\quad\mu_N\to\bar{X},\qquad\sigma_N^2\to\boxed{\;?\;}`,
        answer: md`0`,
        distractors: [md`\sigma_0^2`, md`\frac{\sigma_0^2}{N}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 37 },
      { doc: 'part1', page: 28 },
    ],
  },
  {
    id: 'f-c61-4',
    name: 'Caso limite: dati molto rumorosi, σ² → ∞',
    nameEn: 'Very noisy data: σ² → ∞',
    latex: md`\sigma^2\to\infty:\quad\mu_N\to\mu_0,\qquad\sigma_N^2\to\sigma_0^2`,
    explain: md`Con $N$ fissato e misure inutilmente rumorose, $n_0\to\infty$: il peso del prior $\frac{\sigma^2}{N\sigma_0^2+\sigma^2}$ tende a 1 e $\sigma_N^2=\frac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2}\to\sigma_0^2$. I campioni non portano informazione e la posterior resta il prior, come nel caso $N=0$ delle note. Caso ricavato dalle equazioni della slide 37, non scritto nelle fonti.`,
    symbols: [
      { s: md`\sigma^2\to\infty`, meaning: md`dati dominati dal rumore: ogni misura dice pochissimo su $\mu$` },
      { s: md`\sigma_0^2`, meaning: md`varianza del prior, che la posterior conserva` },
    ],
    whenToUse: md`Per mostrare che contano i dati *informativi*, non il loro numero: il peso dei dati dipende da $N$ rispetto a $n_0=\sigma^2/\sigma_0^2$.`,
    pitfalls: md`$N$ è fissato: per ogni $\sigma^2$ finito, facendo crescere $N$ i dati vincono comunque. Non confondere con il prior dogmatico: lì $\sigma_N^2\to 0$, qui $\sigma_N^2\to\sigma_0^2$.`,
    importance: 2,
    blanks: [
      {
        masked: md`\sigma^2\to\infty:\quad\mu_N\to\mu_0,\qquad\sigma_N^2\to\boxed{\;?\;}`,
        answer: md`\sigma_0^2`,
        distractors: [md`0`, md`\infty`, md`\frac{\sigma_0^2}{N}`],
      },
    ],
    source: [
      { doc: 'ch2', page: 37 },
      { doc: 'part1', page: 28 },
    ],
  },
  {
    id: 'f-c61-5',
    name: 'Il peso dei dati dipende solo da N e n0',
    nameEn: 'Data weight in terms of n0',
    latex: md`\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}=\frac{N}{N+n_0},\qquad n_0=\frac{\sigma^2}{\sigma_0^2}`,
    explain: md`Dividendo per $\sigma_0^2$, il peso della media campionaria nella formula di $\mu_N$ diventa $\frac{N}{N+n_0}$: $\sigma^2$ e $\sigma_0^2$ contano solo attraverso il rapporto $n_0$. Ogni caso limite nei parametri si riduce quindi a $n_0\to\infty$ (prior dogmatico, dati molto rumorosi: vince il prior) oppure $n_0\to 0$ (prior vago, dati senza rumore: vincono i dati). Fa eccezione $\sigma_N^2$, in cui conta anche la scala $\sigma^2$. Con i salmoni: $\frac{4}{4+0.44}=0.9$.`,
    symbols: [
      { s: md`\frac{N}{N+n_0}`, meaning: md`peso della media campionaria $\bar{X}$ in $\mu_N$` },
      { s: md`n_0`, meaning: md`campioni virtuali del prior, $\sigma^2/\sigma_0^2$` },
    ],
    whenToUse: md`Per ricondurre i quattro casi limite nei parametri a uno solo, e per confrontare subito il peso di dati e prior.`,
    pitfalls: md`Il peso è $\frac{N}{N+n_0}$, non $\frac{N}{n_0}$: resta sempre tra 0 e 1. La riscrittura divide per $\sigma_0^2$, quindi vale per $\sigma_0^2>0$.`,
    importance: 2,
    blanks: [
      {
        masked: md`\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}=\frac{N}{\boxed{\;?\;}},\qquad n_0=\frac{\sigma^2}{\sigma_0^2}`,
        answer: md`N+n_0`,
        distractors: [md`n_0`, md`N\,n_0`, md`1+n_0`],
      },
    ],
    source: [
      { doc: 'ch2', page: 37 },
      { doc: 'part1', page: 28 },
      { doc: 'ch2', page: 40 },
    ],
  },
]
