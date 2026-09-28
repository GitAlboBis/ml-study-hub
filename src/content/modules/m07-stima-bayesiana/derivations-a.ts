// Derivazioni del foglio m07 (stima bayesiana e confronto ML vs Bayes): der01-der07 dell'inventario.
// Convenzione condivisa: id dell'inventario; ogni passo dell'inventario compare con il suo LaTeX copiato alla lettera
// (scripts/formula-coverage.ts lo ritrova per confronto) e con il suo perché. I passi in più servono a seguire i conti
// che la fonte salta (controllati sulle immagini di ch2 p32-40 e part1 p26-30, e ricalcolati a mano): il testo del
// perché dice quando un passo non è nella fonte. Le derivazioni der08-der13 sono in derivations-b.ts.
import { md } from '../../types'
import type { Derivation } from '../../types'

export const derivationsA: Derivation[] = [
  // --- der01 Dalla marginalizzazione alla formula chiave ------------------------------------------------
  {
    id: 'der01',
    title: 'Dalla marginalizzazione alla formula chiave p(x|X) = ∫ p(x|θ) p(θ|X) dθ',
    goal: md`Esprimere la densità desiderata $p(\mathbf{x}\,|\,\boldsymbol{X})$ tramite la densità parametrica di forma nota $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ e la densità a posteriori (*posterior density*) $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$. Sono i tre passaggi della slide p34, che le note riprendono a pagina 27.`,
    assumptions: md`Le tre ipotesi di base della slide p33. (1) La forma della densità $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ è nota, il valore del vettore dei parametri $\boldsymbol{\theta}$ non è noto esattamente (*known density form*). (2) La conoscenza iniziale su $\boldsymbol{\theta}$ sta in una densità a priori nota $p(\boldsymbol{\theta})$ (*prior knowledge*). (3) Il resto della conoscenza sta nell'insieme $\boldsymbol{X}$ di $N$ campioni $\mathbf{x}_1,\dots,\mathbf{x}_N$ estratti indipendentemente dalla densità ignota $p(\mathbf{x})$ (*independently drawn samples*). Diversamente da ML, $\boldsymbol{\theta}$ è una variabile aleatoria (*random variable*), non una costante fissa.`,
    steps: [
      {
        latex: md`p(a\,|\,c)=\int p(a,b\,|\,c)\,\mathrm{d}b`,
        why: md`Regola di marginalizzazione (*sum rule*) per variabili continue: la densità di $a$ si ottiene dalla congiunta di $a$ e $b$ integrando via $b$ su tutti i suoi valori. Vale anche con tutto condizionato a una terza quantità $c$. Passo non scritto nella fonte: è la regola che la slide usa senza nominarla.`,
      },
      {
        latex: md`p(\mathbf{x}\,|\,\boldsymbol{X})=\int p(\mathbf{x},\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}`,
        why: md`Si applica la regola con $a = \mathbf{x}$, $b = \boldsymbol{\theta}$, $c = \boldsymbol{X}$. Il valore di $\boldsymbol{\theta}$ è ignoto: lo si introduce nella densità congiunta con $\mathbf{x}$ e lo si elimina integrando. La nota inclinata della slide p34 precisa che l'integrazione si estende all'intero spazio dei parametri (*the integration extends over the entire parameter space*): se $\boldsymbol{\theta}$ ha $d$ componenti, l'integrale è $d$-uplo, su tutti i valori ammissibili.`,
      },
      {
        latex: md`p(\mathbf{x},\boldsymbol{\theta}\,|\,\boldsymbol{X})=\frac{p(\mathbf{x},\boldsymbol{\theta},\boldsymbol{X})}{p(\boldsymbol{X})}=\frac{p(\mathbf{x},\boldsymbol{\theta},\boldsymbol{X})}{p(\boldsymbol{\theta},\boldsymbol{X})}\cdot\frac{p(\boldsymbol{\theta},\boldsymbol{X})}{p(\boldsymbol{X})}`,
        why: md`Passo intermedio non scritto nella fonte. Per definizione di densità condizionata si divide la congiunta per $p(\boldsymbol{X})$; poi si moltiplica e si divide per $p(\boldsymbol{\theta},\boldsymbol{X})$, che non cambia il valore.`,
      },
      {
        latex: md`p(\mathbf{x},\boldsymbol{\theta}\,|\,\boldsymbol{X})=p(\mathbf{x}\,|\,\boldsymbol{\theta},\boldsymbol{X})\;p(\boldsymbol{\theta}\,|\,\boldsymbol{X})`,
        why: md`I due rapporti del passo precedente sono, per definizione, $p(\mathbf{x}\,|\,\boldsymbol{\theta},\boldsymbol{X})$ e $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$. È il teorema di Bayes nella forma della regola del prodotto (*product rule*): una congiunta è la condizionata per la marginale, qui con tutto condizionato ai campioni $\boldsymbol{X}$. La slide lo introduce con *by using Bayes theorem*.`,
      },
      {
        latex: md`p(\mathbf{x}\,|\,\boldsymbol{X})=\int p(\mathbf{x}\,|\,\boldsymbol{\theta},\boldsymbol{X})\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}`,
        why: md`Si sostituisce la fattorizzazione dentro l'integrale del secondo passo. Compare già la posterior $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$ come secondo fattore. È la seconda formula della slide p34.`,
      },
      {
        latex: md`p(\mathbf{x}\,|\,\boldsymbol{\theta},\boldsymbol{X})=p(\mathbf{x}\,|\,\boldsymbol{\theta})`,
        why: md`Ipotesi 1: la forma di $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ è nota, quindi, una volta fissato $\boldsymbol{\theta}$, la distribuzione di $\mathbf{x}$ è completamente nota (*the distribution of x is completely known once we know the value of the parameter vector θ*) e i campioni $\boldsymbol{X}$ non aggiungono informazione. Le note: *we can remove X from the first density*. In termini tecnici è un'indipendenza condizionata: la nuova osservazione $\mathbf{x}$ e i campioni di training $\boldsymbol{X}$ sono estratti indipendentemente dalla stessa densità, quindi sono indipendenti dato $\boldsymbol{\theta}$.`,
      },
      {
        latex: md`p(\mathbf{x}\,|\,\boldsymbol{X})=\int p(\mathbf{x}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}`,
        why: md`Si sostituisce e si ottiene la formula che la slide scrive in rosso con il diamante. Poiché il valore esatto di $\boldsymbol{\theta}$ non è noto, la stima bayesiana fa la media di $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ su tutti i possibili valori di $\boldsymbol{\theta}$ (*to average p(x|θ) over all possible values of θ*, slide p35), pesata dalla posterior. I dati $\boldsymbol{X}$ compaiono solo dentro $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$: le osservazioni influenzano $p(\mathbf{x}\,|\,\boldsymbol{X})$ solo attraverso la posterior (*the available observations X exert their influence on p(x|X) through the posterior probability density*).`,
      },
      {
        latex: md`\boldsymbol{\theta}\in\{\boldsymbol{\theta}_1,\dots,\boldsymbol{\theta}_M\}:\quad p(\mathbf{x}\,|\,\boldsymbol{X})=\sum_{j=1}^{M}p(\mathbf{x}\,|\,\boldsymbol{\theta}_j)\,P(\boldsymbol{\theta}_j\,|\,\boldsymbol{X}),\qquad\sum_{j=1}^{M}P(\boldsymbol{\theta}_j\,|\,\boldsymbol{X})=1`,
        why: md`Lettura della formula come media, dalle note di pagina 27: un integrale è una forma continua di somma, e la somma è un tipo di media (*an integral can be viewed as a continuous form of summation*). Se $\boldsymbol{\theta}$ potesse assumere solo $M$ valori, la formula chiave diventerebbe questa somma: la media dei modelli $p(\mathbf{x}\,|\,\boldsymbol{\theta}_j)$ con pesi $P(\boldsymbol{\theta}_j\,|\,\boldsymbol{X})$ non negativi e di somma 1. Il primo termine dell'integrale viene «pesato» dal secondo.`,
      },
    ],
    conclusion: md`$p(\mathbf{x}\,|\,\boldsymbol{X})=\int p(\mathbf{x}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}$. Invece di scegliere un solo valore di $\boldsymbol{\theta}$ come fa ML, la stima bayesiana mescola tutti i modelli $p(\mathbf{x}\,|\,\boldsymbol{\theta})$, ciascuno pesato dalla sua credibilità a posteriori. Poiché i dati agiscono solo attraverso $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$, il problema base del *Bayesian learning* diventa calcolare la posterior: è il compito della dimostrazione [«come si calcola la posterior»](#derivation:der02).`,
    source: [{ doc: 'ch2', page: 33 }, { doc: 'ch2', page: 34 }, { doc: 'ch2', page: 35 }, { doc: 'part1', page: 27 }],
  },

  // --- der02 La posterior da Bayes più indipendenza -----------------------------------------------------
  {
    id: 'der02',
    title: 'Come si calcola la posterior: formula di Bayes più indipendenza dei campioni',
    goal: md`Riscrivere $p(\boldsymbol{\theta}\,|\,\boldsymbol{X})$ usando solo quantità note per ipotesi, cioè il prior $p(\boldsymbol{\theta})$ e la densità parametrica dei singoli campioni $p(\mathbf{x}_k\,|\,\boldsymbol{\theta})$, fino alla forma $\alpha\prod_{k}p(\mathbf{x}_k\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})$ che la slide p36 applica all'esempio gaussiano. Sono le due relazioni della slide p35 (*from Bayes formula*, *from independence assumption*).`,
    assumptions: md`Ipotesi 1: la forma di $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ è nota, quindi per ogni $\boldsymbol{\theta}$ si sa calcolare $p(\mathbf{x}_k\,|\,\boldsymbol{\theta})$. Ipotesi 2: il prior $p(\boldsymbol{\theta})$ è noto. Ipotesi 3: gli $N$ campioni di $\boldsymbol{X}=\{\mathbf{x}_1,\dots,\mathbf{x}_N\}$ sono estratti indipendentemente, cioè, dato $\boldsymbol{\theta}$, ognuno è generato da $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ senza dipendere dagli altri. Si suppone $p(\boldsymbol{X}) > 0$.`,
    steps: [
      {
        latex: md`p(\boldsymbol{\theta},\boldsymbol{X})=p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,p(\boldsymbol{X})=p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})`,
        why: md`Passo intermedio non scritto nella fonte. La regola del prodotto fattorizza la congiunta di $\boldsymbol{\theta}$ e $\boldsymbol{X}$ in due ordini diversi: condizionando su $\boldsymbol{X}$ oppure su $\boldsymbol{\theta}$. Le due fattorizzazioni sono uguali perché descrivono la stessa densità.`,
      },
      {
        latex: md`p(\boldsymbol{\theta}\,|\,\boldsymbol{X})=\frac{p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})}{p(\boldsymbol{X})}`,
        why: md`Si dividono i due membri per $p(\boldsymbol{X})$: è la formula di Bayes applicata alla coppia $(\boldsymbol{\theta},\boldsymbol{X})$. La posterior è verosimiglianza (*likelihood*) per prior diviso la densità dei campioni. È il passaggio intermedio scritto nelle note di pagina 27.`,
      },
      {
        latex: md`p(\boldsymbol{X})=\int p(\boldsymbol{X},\boldsymbol{\theta})\,\mathrm{d}\boldsymbol{\theta}`,
        why: md`Il denominatore non è noto direttamente: lo si ottiene marginalizzando la congiunta su $\boldsymbol{\theta}$, con la stessa regola della [formula chiave](#derivation:der01). Passo intermedio non scritto nella fonte.`,
      },
      {
        latex: md`p(\boldsymbol{X})=\int p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})\,\mathrm{d}\boldsymbol{\theta}`,
        why: md`Si fattorizza la congiunta con la regola del prodotto del primo passo. Il denominatore è l'integrale del numeratore su tutti i valori di $\boldsymbol{\theta}$: la variabile $\boldsymbol{\theta}$ viene integrata via, quindi $p(\boldsymbol{X})$ non dipende da $\boldsymbol{\theta}$. È una costante di normalizzazione.`,
      },
      {
        latex: md`p(\boldsymbol{\theta}\,|\,\boldsymbol{X})=\frac{p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})}{\int p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})\,\mathrm{d}\boldsymbol{\theta}}`,
        why: md`Sostituendo si ottiene la forma della slide p35 (*from Bayes formula*): tutto è espresso con $p(\boldsymbol{X}\,|\,\boldsymbol{\theta})$ e $p(\boldsymbol{\theta})$.`,
      },
      {
        latex: md`p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\propto p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})`,
        why: md`Come funzione di $\boldsymbol{\theta}$, con i dati fissati, il denominatore è una costante: la posterior è proporzionale al prodotto di verosimiglianza e prior. Le note di pagina 28 lo dicono così: la posterior è proporzionale al prodotto delle verosimiglianze e del prior (*is proportional to the product of the likelihoods and the prior*).`,
      },
      {
        latex: md`p(\boldsymbol{X}\,|\,\boldsymbol{\theta})=\prod_{k=1}^{N}p(\mathbf{x}_k\,|\,\boldsymbol{\theta})`,
        why: md`Ipotesi 3: i campioni sono estratti indipendentemente, quindi la densità congiunta di $\boldsymbol{X}=\{\mathbf{x}_1,\dots,\mathbf{x}_N\}$ dato $\boldsymbol{\theta}$ è il prodotto delle densità dei singoli campioni (*from independence assumption*, slide p35). È la stessa fattorizzazione con cui la stima ML costruisce la verosimiglianza.`,
      },
      {
        latex: md`p(\boldsymbol{\theta}\,|\,\boldsymbol{X})=\frac{\prod_{k=1}^{N}p(\mathbf{x}_k\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})}{\int\prod_{k=1}^{N}p(\mathbf{x}_k\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})\,\mathrm{d}\boldsymbol{\theta}}`,
        why: md`Passo intermedio non scritto nella fonte: si sostituisce la produttoria sia al numeratore sia dentro l'integrale del denominatore. Ora compaiono solo quantità note per ipotesi: $p(\mathbf{x}_k\,|\,\boldsymbol{\theta})$ (forma nota) e $p(\boldsymbol{\theta})$ (prior noto).`,
      },
      {
        latex: md`p(\boldsymbol{\theta}\,|\,\boldsymbol{X})=\alpha\prod_{k=1}^{N}p(\mathbf{x}_k\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta}),\qquad\alpha=\left[\int\prod_{k=1}^{N}p(\mathbf{x}_k\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})\,\mathrm{d}\boldsymbol{\theta}\right]^{-1}`,
        why: md`Si raccoglie il denominatore, che non dipende da $\boldsymbol{\theta}$, nel fattore di normalizzazione (*normalization factor*) $\alpha = 1/p(\boldsymbol{X})$. È la «formula previously seen» che la slide p36 applica con $\boldsymbol{\theta}=\mu$, cerchiando $\alpha$ in verde.`,
      },
      {
        latex: md`\int p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}=\alpha\int\prod_{k=1}^{N}p(\mathbf{x}_k\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})\,\mathrm{d}\boldsymbol{\theta}=\alpha\cdot\frac{1}{\alpha}=1`,
        why: md`Controllo non scritto nella fonte: è proprio questa la funzione di $\alpha$. Qualunque sia il prodotto di verosimiglianza e prior, $\alpha$ lo riscala in modo che la posterior abbia area 1. Per questo nei conti si può ignorare ogni costante che non dipende da $\boldsymbol{\theta}$: la si recupera alla fine imponendo l'area 1.`,
      },
      {
        latex: md`p(\boldsymbol{\theta}\,|\,\mathbf{x}_1,\dots,\mathbf{x}_N)\propto p(\mathbf{x}_N\,|\,\boldsymbol{\theta})\;p(\boldsymbol{\theta}\,|\,\mathbf{x}_1,\dots,\mathbf{x}_{N-1})`,
        why: md`Conseguenza non scritta nella fonte, utile per capire la parola *learning*. Separando l'ultimo fattore della produttoria, il resto è (a meno di una costante) la posterior calcolata con i primi $N-1$ campioni. La posterior di oggi fa da prior per il campione di domani: ogni nuovo dato aggiorna la credenza su $\boldsymbol{\theta}$, ed è questa sequenza che la slide p38 disegna per $N$ crescente.`,
      },
    ],
    conclusion: md`$p(\boldsymbol{\theta}\,|\,\boldsymbol{X})=\alpha\prod_{k=1}^{N}p(\mathbf{x}_k\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta})$, con $\alpha = 1/p(\boldsymbol{X})$ costante di normalizzazione. Il prodotto $\prod_k p(\mathbf{x}_k\,|\,\boldsymbol{\theta})$ è lo stesso che ML massimizza; la stima bayesiana lo moltiplica per il prior e lo normalizza, così ottiene una densità su $\boldsymbol{\theta}$ invece di un solo punto.`,
    source: [{ doc: 'ch2', page: 35 }, { doc: 'ch2', page: 36 }, { doc: 'part1', page: 27 }, { doc: 'part1', page: 28 }],
  },

  // --- der03 Posterior gaussiana ------------------------------------------------------------------------
  {
    id: 'der03',
    title: "Posterior gaussiana: dal prodotto di gaussiane alla forma con α''",
    goal: md`Mostrare che nell'esempio gaussiano univariato la posterior $p(\mu\,|\,\boldsymbol{X})=\alpha\prod_{k}p(\mathbf{x}_k\,|\,\mu)\,p(\mu)$ è l'esponenziale di un polinomio di secondo grado in $\mu$, quindi è ancora una gaussiana. La slide p37 scrive solo il risultato, con la costante $\alpha''$: i passaggi intermedi sono ricostruiti qui.`,
    assumptions: md`Esempio della slide p36. $p(\mathbf{x}\,|\,\boldsymbol{\theta})$ è una gaussiana univariata; in $\boldsymbol{\theta}=[\mu,\sigma^2]$ l'unico parametro ignoto è $\mu$, la varianza $\sigma^2$ è nota, quindi $p(\mathbf{x}\,|\,\mu)\sim N(\mu,\sigma^2)$. Ipotesi ulteriore: prior gaussiano $p(\mu)\sim N(\mu_0,\sigma_0^2)$, con $\mu_0$ e $\sigma_0^2$ noti a priori. Campioni $\mathbf{x}_1,\dots,\mathbf{x}_N$ indipendenti; $\sigma > 0$, $\sigma_0 > 0$. La slide scrive $\mathbf{x}$ in grassetto anche se qui è uno scalare.`,
    steps: [
      {
        latex: md`p(\mu\,|\,\boldsymbol{X})=\alpha\prod_{k=1}^{N}p(\mathbf{x}_k\,|\,\mu)\,p(\mu)`,
        why: md`Punto di partenza della slide p36: formula di Bayes più indipendenza dei campioni ([come si calcola la posterior](#derivation:der02)), con $\boldsymbol{\theta} = \mu$. $\alpha$ è il fattore di normalizzazione.`,
      },
      {
        latex: md`p(\mu\,|\,\boldsymbol{X})=\alpha\prod_{k=1}^{N}\frac{1}{\sqrt{2\pi}\sigma}\exp\left[-\frac{1}{2}\left(\frac{\mathbf{x}_k-\mu}{\sigma}\right)^2\right]\cdot\frac{1}{\sqrt{2\pi}\sigma_0}\exp\left[-\frac{1}{2}\left(\frac{\mu-\mu_0}{\sigma_0}\right)^2\right]`,
        why: md`Si sostituiscono le ipotesi dell'esempio: ogni $p(\mathbf{x}_k\,|\,\mu)$ è la densità $N(\mu,\sigma^2)$ valutata nel campione $\mathbf{x}_k$, e il prior $p(\mu)$ è la densità $N(\mu_0,\sigma_0^2)$ valutata in $\mu$. La variabile della posterior è $\mu$; i campioni sono numeri fissati.`,
      },
      {
        latex: md`p(\mu\,|\,\boldsymbol{X})=\frac{\alpha}{(2\pi)^{\frac{N+1}{2}}\,\sigma^{N}\sigma_0}\prod_{k=1}^{N}\exp\left[-\frac{1}{2}\left(\frac{\mathbf{x}_k-\mu}{\sigma}\right)^2\right]\cdot\exp\left[-\frac{1}{2}\left(\frac{\mu-\mu_0}{\sigma_0}\right)^2\right]`,
        why: md`Passo intermedio non scritto nella fonte: si portano davanti le costanti. Il fattore $1/(\sqrt{2\pi}\sigma)$ compare $N$ volte e $1/(\sqrt{2\pi}\sigma_0)$ una volta: $\left(\frac{1}{\sqrt{2\pi}\sigma}\right)^N\frac{1}{\sqrt{2\pi}\sigma_0}=\frac{1}{(2\pi)^{(N+1)/2}\sigma^N\sigma_0}$. Nessuno di questi fattori dipende da $\mu$.`,
      },
      {
        latex: md`p(\mu\,|\,\boldsymbol{X})=\alpha'\exp\left\{-\frac{1}{2}\left[\sum_{k=1}^{N}\left(\frac{\mu-\mathbf{x}_k}{\sigma}\right)^2+\left(\frac{\mu-\mu_0}{\sigma_0}\right)^2\right]\right\}`,
        why: md`Il prodotto di esponenziali è l'esponenziale della somma degli esponenti: $\prod_k e^{a_k}\cdot e^{b}=e^{\sum_k a_k+b}$. Le costanti del passo precedente si assorbono insieme ad $\alpha$ in una nuova costante $\alpha'=\alpha/\left[(2\pi)^{(N+1)/2}\sigma^N\sigma_0\right]$. Si scrive $(\mu-\mathbf{x}_k)^2$ al posto di $(\mathbf{x}_k-\mu)^2$: il quadrato non cambia.`,
      },
      {
        latex: md`\sum_{k=1}^{N}\frac{(\mu-\mathbf{x}_k)^2}{\sigma^2}=\frac{N}{\sigma^2}\mu^2-\frac{2}{\sigma^2}\Big(\sum_{k=1}^{N}\mathbf{x}_k\Big)\mu+\frac{1}{\sigma^2}\sum_{k=1}^{N}\mathbf{x}_k^2,\qquad\frac{(\mu-\mu_0)^2}{\sigma_0^2}=\frac{\mu^2}{\sigma_0^2}-\frac{2\mu_0}{\sigma_0^2}\mu+\frac{\mu_0^2}{\sigma_0^2}`,
        why: md`Si sviluppano i quadrati, $(\mu-\mathbf{x}_k)^2=\mu^2-2\mathbf{x}_k\mu+\mathbf{x}_k^2$ e $(\mu-\mu_0)^2=\mu^2-2\mu_0\mu+\mu_0^2$, per separare i termini in $\mu^2$, quelli in $\mu$ e quelli senza $\mu$. Nella somma su $k$ il termine $\mu^2$ compare $N$ volte, da cui $N/\sigma^2$.`,
      },
      {
        latex: md`\sum_{k=1}^{N}\frac{(\mu-\mathbf{x}_k)^2}{\sigma^2}+\frac{(\mu-\mu_0)^2}{\sigma_0^2}=\left(\frac{N}{\sigma^2}+\frac{1}{\sigma_0^2}\right)\mu^2-2\left(\frac{1}{\sigma^2}\sum_{k=1}^{N}\mathbf{x}_k+\frac{\mu_0}{\sigma_0^2}\right)\mu+\underbrace{\frac{1}{\sigma^2}\sum_{k=1}^{N}\mathbf{x}_k^2+\frac{\mu_0^2}{\sigma_0^2}}_{\text{non dipende da }\mu}`,
        why: md`Passo intermedio non scritto nella fonte: si sommano i due sviluppi e si raccolgono i coefficienti delle potenze di $\mu$. Il coefficiente di $\mu^2$ somma i contributi dei dati e del prior; quello di $-2\mu$ somma $\frac{1}{\sigma^2}\sum_k\mathbf{x}_k$ e $\mu_0/\sigma_0^2$.`,
      },
      {
        latex: md`\alpha''=\alpha'\exp\left[-\frac{1}{2}\left(\frac{1}{\sigma^2}\sum_{k=1}^{N}\mathbf{x}_k^2+\frac{\mu_0^2}{\sigma_0^2}\right)\right]`,
        why: md`Passo intermedio non scritto nella fonte. Poiché $e^{a+b}=e^a e^b$, il pezzo dell'esponente senza $\mu$ si stacca come fattore moltiplicativo. Dipende dai campioni ma non da $\mu$: per la posterior, che è una funzione di $\mu$ con i dati fissati, è una costante e si assorbe in $\alpha''$.`,
      },
      {
        latex: md`p(\mu\,|\,\boldsymbol{X})=\alpha''\exp\left\{-\frac{1}{2}\left[\left(\frac{N}{\sigma^2}+\frac{1}{\sigma_0^2}\right)\mu^2-2\left(\frac{1}{\sigma^2}\sum_{k=1}^{N}\mathbf{x}_k+\frac{\mu_0}{\sigma_0^2}\right)\mu\right]\right\}`,
        why: md`È esattamente la formula della slide p37, con $\alpha''$ cerchiato in verde ed etichettato *Constant*; le note di pagina 28 la riportano uguale. Tutto ciò che dipende da $\mu$ è nell'esponente.`,
      },
      {
        latex: md`A\mu^2-2B\mu=A\left(\mu-\frac{B}{A}\right)^2-\frac{B^2}{A},\qquad A=\frac{N}{\sigma^2}+\frac{1}{\sigma_0^2}>0,\quad B=\frac{1}{\sigma^2}\sum_{k=1}^{N}\mathbf{x}_k+\frac{\mu_0}{\sigma_0^2}`,
        why: md`Passo intermedio non scritto nella fonte: completamento del quadrato (*completing the square*). Sviluppando, $A(\mu-B/A)^2=A\mu^2-2B\mu+B^2/A$; togliendo $B^2/A$ si ritrova il membro sinistro. $A$ è positivo perché somma di due quantità positive.`,
      },
      {
        latex: md`p(\mu\,|\,\boldsymbol{X})=\alpha''\,e^{\frac{B^2}{2A}}\exp\left[-\frac{1}{2}\,\frac{(\mu-B/A)^2}{1/A}\right]`,
        why: md`Si sostituisce il quadrato completato nell'esponente. Il termine $+B^2/(2A)$ non dipende da $\mu$ e diventa un altro fattore costante. Resta l'esponenziale di $-\frac{1}{2}(\mu-m)^2/v$ con $m = B/A$ e $v = 1/A$: è la forma di una densità gaussiana.`,
      },
      {
        latex: md`p(\mu\,|\,\boldsymbol{X})\sim N(\mu_N,\sigma_N^2)`,
        why: md`L'esponente è un polinomio di secondo grado in $\mu$ con coefficiente di $\mu^2$ negativo, $-\frac{1}{2}A<0$: questa è la forma di una densità gaussiana, la cui costante è fissata dall'area 1. Quindi la posterior è ancora una densità normale (*p(μ|X) is again a normal density*, slide p37), con media $\mu_N = B/A$ e varianza $\sigma_N^2 = 1/A$. La [dimostrazione successiva](#derivation:der04) li scrive in forma esplicita confrontando i coefficienti.`,
      },
    ],
    conclusion: md`Con verosimiglianza gaussiana e prior gaussiano la posterior della media è gaussiana, $p(\mu\,|\,\boldsymbol{X})\sim N(\mu_N,\sigma_N^2)$: moltiplicare gaussiane in $\mu$ significa sommare parabole negli esponenti, e una parabola rivolta verso il basso nell'esponente dà ancora una gaussiana. Il prior gaussiano è coniugato (*conjugate prior*) alla verosimiglianza gaussiana. Le costanti $\alpha$, $\alpha'$, $\alpha''$ non vanno mai calcolate: la normalizzazione segue dall'area 1.`,
    source: [{ doc: 'ch2', page: 36 }, { doc: 'ch2', page: 37 }, { doc: 'part1', page: 28 }],
  },

  // --- der04 Identificazione di μN e σN² -----------------------------------------------------------------
  {
    id: 'der04',
    title: 'Identificazione di μN e σN² («After some calculations»)',
    goal: md`Ricavare le due equazioni del sistema della slide p37, $\mu_N$ e $\sigma_N^2$, confrontando l'esponente della posterior con quello della forma canonica di una gaussiana $N(\mu_N,\sigma_N^2)$. La slide dice solo *after some calculations, one can get*, le note *after some algebraic simplifications*: i calcoli sono ricostruiti qui.`,
    assumptions: md`Le ipotesi dell'esempio gaussiano: $p(\mathbf{x}\,|\,\mu)\sim N(\mu,\sigma^2)$ con $\sigma^2>0$ noto, prior $p(\mu)\sim N(\mu_0,\sigma_0^2)$ con $\sigma_0^2>0$, campioni indipendenti. Il punto di partenza è il risultato della [dimostrazione precedente](#derivation:der03): la posterior è gaussiana e vale $\alpha''\exp\left\{-\frac{1}{2}\left[\left(\frac{N}{\sigma^2}+\frac{1}{\sigma_0^2}\right)\mu^2-2\left(\frac{1}{\sigma^2}\sum_{k}\mathbf{x}_k+\frac{\mu_0}{\sigma_0^2}\right)\mu\right]\right\}$.`,
    steps: [
      {
        latex: md`p(\mu\,|\,\boldsymbol{X})=\frac{1}{\sqrt{2\pi}\sigma_N}\exp\left[-\frac{1}{2}\left(\frac{\mu-\mu_N}{\sigma_N}\right)^2\right]`,
        why: md`Si sa già che la posterior è gaussiana: la si scrive nella forma canonica con parametri incogniti $\mu_N$ e $\sigma_N^2$. La costante $\alpha''$ non va calcolata. $p(\mu\,|\,\boldsymbol{X})$ è una densità (area 1), quindi, una volta fissati i coefficienti di $\mu^2$ e di $\mu$, la costante è per forza $1/(\sqrt{2\pi}\sigma_N)$. Basta confrontare la parte che dipende da $\mu$.`,
      },
      {
        latex: md`-\frac{1}{2}\left(\frac{\mu-\mu_N}{\sigma_N}\right)^2=-\frac{1}{2}\left[\frac{1}{\sigma_N^2}\mu^2-2\frac{\mu_N}{\sigma_N^2}\mu+\frac{\mu_N^2}{\sigma_N^2}\right]`,
        why: md`Si sviluppa il quadrato della forma canonica, $(\mu-\mu_N)^2=\mu^2-2\mu_N\mu+\mu_N^2$, per confrontarla termine a termine con l'esponente della slide p37. Il termine senza $\mu$, $\mu_N^2/\sigma_N^2$, finisce nella costante.`,
      },
      {
        latex: md`\frac{1}{\sigma_N^2}\mu^2-2\frac{\mu_N}{\sigma_N^2}\mu=\left(\frac{N}{\sigma^2}+\frac{1}{\sigma_0^2}\right)\mu^2-2\left(\frac{1}{\sigma^2}\sum_{k=1}^{N}\mathbf{x}_k+\frac{\mu_0}{\sigma_0^2}\right)\mu\qquad\forall\mu`,
        why: md`Passo intermedio non scritto nella fonte. Le due espressioni descrivono la stessa densità, quindi i loro esponenti possono differire al più per una costante. Una differenza costante per ogni $\mu$ ha coefficienti nulli di $\mu^2$ e di $\mu$: le parti che dipendono da $\mu$ devono coincidere.`,
      },
      {
        latex: md`\frac{1}{\sigma_N^2}=\frac{N}{\sigma^2}+\frac{1}{\sigma_0^2}`,
        why: md`Si uguagliano i coefficienti di $\mu^2$. Le precisioni (*precision*, inverso della varianza) si sommano: $N$ contributi $1/\sigma^2$ dai campioni più $1/\sigma_0^2$ dal prior.`,
      },
      {
        latex: md`\frac{\mu_N}{\sigma_N^2}=\frac{1}{\sigma^2}\sum_{k=1}^{N}\mathbf{x}_k+\frac{\mu_0}{\sigma_0^2}=\frac{N}{\sigma^2}\bar{X}+\frac{\mu_0}{\sigma_0^2},\qquad\bar{X}=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k`,
        why: md`Si uguagliano i coefficienti di $-2\mu$. La somma dei campioni si riscrive come $N$ volte la media campionaria (*sample mean*) $\bar{X}$, perché $\sum_k\mathbf{x}_k = N\bar{X}$: è qui che nasce la $\bar{X}$ cerchiata con l'etichetta *Sample mean* nella slide p37. I dati entrano nella posterior solo attraverso $N$ e $\bar{X}$.`,
      },
      {
        latex: md`\frac{1}{\sigma_N^2}=\frac{N\sigma_0^2+\sigma^2}{\sigma^2\sigma_0^2}\;\Rightarrow\;\sigma_N^2=\frac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2}`,
        why: md`Si porta a denominatore comune $\sigma^2\sigma_0^2$, cioè $\frac{N}{\sigma^2}+\frac{1}{\sigma_0^2}=\frac{N\sigma_0^2}{\sigma^2\sigma_0^2}+\frac{\sigma^2}{\sigma^2\sigma_0^2}$, e si inverte la frazione: è la seconda equazione del sistema della slide p37.`,
      },
      {
        latex: md`\sigma_N^2\cdot\frac{N}{\sigma^2}=\frac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2}\cdot\frac{N}{\sigma^2}=\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2},\qquad\sigma_N^2\cdot\frac{1}{\sigma_0^2}=\frac{\sigma^2}{N\sigma_0^2+\sigma^2}`,
        why: md`Passo intermedio non scritto nella fonte: i due prodotti che servono al passo successivo. Nel primo si semplifica $\sigma^2$, nel secondo $\sigma_0^2$.`,
      },
      {
        latex: md`\mu_N=\sigma_N^2\left(\frac{N}{\sigma^2}\bar{X}+\frac{\mu_0}{\sigma_0^2}\right)=\left(\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}\right)\bar{X}+\left(\frac{\sigma^2}{N\sigma_0^2+\sigma^2}\right)\mu_0`,
        why: md`Si moltiplica l'uguaglianza dei coefficienti di $\mu$ per $\sigma_N^2$ e si usano i due prodotti appena calcolati. È la prima equazione del sistema della slide p37, riportata uguale nelle note di pagina 28.`,
      },
      {
        latex: md`\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}+\frac{\sigma^2}{N\sigma_0^2+\sigma^2}=1`,
        why: md`Verifica: i due pesi sono non negativi, hanno lo stesso denominatore e sommano a 1. Quindi $\mu_N$ è una combinazione convessa di $\bar{X}$ e $\mu_0$ e cade sempre tra i due. È il senso della Nota della slide p37: le equazioni mostrano come l'informazione a priori (*prior information*) si combina con l'informazione empirica dei campioni (*empirical information in the samples*) per dare la densità a posteriori.`,
      },
      {
        latex: md`\mu_N=\frac{\frac{N}{\sigma^2}\,\bar{X}+\frac{1}{\sigma_0^2}\,\mu_0}{\frac{N}{\sigma^2}+\frac{1}{\sigma_0^2}}`,
        why: md`Rilettura non scritta nella fonte: dividendo numeratore e denominatore dei due pesi per $\sigma_0^2\sigma^2$ si ottiene una media pesata con le precisioni. $\bar{X}$ ha varianza $\sigma^2/N$, quindi precisione $N/\sigma^2$; il prior ha precisione $1/\sigma_0^2$. Pesa di più la fonte d'informazione più precisa: il peso dei dati cresce con $N$ e con $\sigma_0^2$ (prior vago), quello del prior cresce con $\sigma^2$ (dati rumorosi).`,
      },
    ],
    conclusion: md`$\mu_N=\left(\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}\right)\bar{X}+\left(\frac{\sigma^2}{N\sigma_0^2+\sigma^2}\right)\mu_0$ e $\sigma_N^2=\frac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2}$. La media a posteriori è una combinazione convessa della media campionaria e della media a priori; la precisione a posteriori $1/\sigma_N^2$ è la somma della precisione del prior e di $N$ volte quella di un campione. I casi limite in $N$ sono nella dimostrazione [«casi limite della posterior»](#derivation:der05).`,
    source: [{ doc: 'ch2', page: 37 }, { doc: 'part1', page: 28 }],
  },

  // --- der05 Casi limite N = 0 e N → ∞ ------------------------------------------------------------------
  {
    id: 'der05',
    title: 'Casi limite della posterior: N = 0 e N → ∞',
    goal: md`Verificare sulle formule di $\mu_N$ e $\sigma_N^2$ i due casi limite discussi nelle note (pagine 28 e 29), senza campioni e con infiniti campioni, e il comportamento che la slide p38 chiama *Bayesian learning*.`,
    assumptions: md`Esempio gaussiano con $\sigma^2>0$ noto e prior $N(\mu_0,\sigma_0^2)$ con $\sigma_0^2>0$, cioè un prior che non sia già una certezza. Si parte dalle formule della slide p37: $\mu_N=\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}\bar{X}+\frac{\sigma^2}{N\sigma_0^2+\sigma^2}\mu_0$ e $\sigma_N^2=\frac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2}$.`,
    steps: [
      {
        latex: md`N=0:\quad\prod_{k=1}^{0}p(\mathbf{x}_k\,|\,\mu)=1\;\Rightarrow\;p(\mu\,|\,\boldsymbol{X})=\alpha\,p(\mu)=p(\mu)`,
        why: md`Passo non scritto nella fonte, sulla formula generale della posterior. Senza campioni la produttoria è vuota e vale 1; il prior ha già area 1, quindi $\alpha = 1$ e la posterior è il prior.`,
      },
      {
        latex: md`N=0:\quad\mu_N=\frac{0}{0+\sigma^2}\bar{X}+\frac{\sigma^2}{0+\sigma^2}\mu_0=\mu_0,\qquad\sigma_N^2=\frac{\sigma_0^2\sigma^2}{\sigma^2}=\sigma_0^2`,
        why: md`Le formule della slide p37 danno lo stesso risultato: senza campioni il peso dei dati è nullo e la media a posteriori è la media a priori, perché è l'unica informazione disponibile (*since it is the only information we have*, note di pagina 28). Con $N = 0$ la media campionaria $\bar{X}$ non è definita (è $0/0$), ma il suo peso $N\sigma_0^2/(N\sigma_0^2+\sigma^2)$ è esattamente zero: il risultato $\mu_N=\mu_0$ non dipende da come la si definisce.`,
      },
      {
        latex: md`\frac{1}{\sigma_N^2}=\frac{1}{\sigma_0^2}+\frac{N}{\sigma^2}\;\Rightarrow\;\sigma_{N+1}^2<\sigma_N^2`,
        why: md`Passo non scritto nella fonte. La precisione a posteriori cresce linearmente con $N$: ogni campione aggiunge $1/\sigma^2$. Quindi la varianza a posteriori scende a ogni nuovo dato e la posterior diventa sempre più stretta, come nella sequenza di curve della slide p38 ($N$ = 1, 5, 10, 20, 30).`,
      },
      {
        latex: md`N\to\infty:\quad\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}=\frac{1}{1+\frac{\sigma^2}{N\sigma_0^2}}\to 1,\qquad\frac{\sigma^2}{N\sigma_0^2+\sigma^2}\to 0\;\Rightarrow\;\mu_N\to\bar{X}`,
        why: md`Dividendo numeratore e denominatore per $N\sigma_0^2$ si vede che $\sigma^2/(N\sigma_0^2)\to 0$: il peso dei dati tende a 1 e quello del prior a 0. L'informazione dei dati domina il prior (*the information from the data dominates the prior*, note di pagina 28) e l'influenza del prior diminuisce. Serve $\sigma_0^2 > 0$: con $\sigma_0^2 = 0$ si avrebbe $N\sigma_0^2 = 0$ per ogni $N$ e il peso dei dati resterebbe nullo (dimostrazione [«casi limite in σ0² e σ²»](#derivation:der11)).`,
      },
      {
        latex: md`\mu_N-\bar{X}=\frac{\sigma^2}{N\sigma_0^2+\sigma^2}\,(\mu_0-\bar{X})`,
        why: md`Passo non scritto nella fonte. Anche $\bar{X}$ cambia con $N$, quindi la frase «$\mu_N$ tende a $\bar{X}$» va letta come «la differenza tende a zero». Chiamando $w=N\sigma_0^2/(N\sigma_0^2+\sigma^2)$ il peso dei dati, come nel resto del foglio, il peso del prior è $1-w=\sigma^2/(N\sigma_0^2+\sigma^2)$ e si ha $\mu_N-\bar{X}=(1-w)(\mu_0-\bar{X})$: la distanza da $\bar{X}$ si riduce come $1/N$. Che $\mu_N$ converga anche alla media vera è dimostrato in [«perché la media a posteriori converge al valore vero»](#derivation:der12).`,
      },
      {
        latex: md`\sigma_N^2=\frac{\sigma_0^2\sigma^2}{N\sigma_0^2+\sigma^2}=\frac{\sigma^2}{N}\cdot\frac{1}{1+\frac{\sigma^2}{N\sigma_0^2}}\;\xrightarrow{\;N\to\infty\;}\;0`,
        why: md`Si raccoglie $N\sigma_0^2$ al denominatore. Per $N$ grande la varianza a posteriori si comporta come $\sigma^2/N$, cioè come la varianza della media campionaria, e tende a zero (*the posterior variance* $\sigma_N^2\to 0$, note di pagina 29).`,
      },
      {
        latex: md`\max_{\mu}\,p(\mu\,|\,\boldsymbol{X})=\frac{1}{\sqrt{2\pi}\,\sigma_N}\;\xrightarrow{\;N\to\infty\;}\;+\infty`,
        why: md`Passo non scritto nella fonte. Il picco di una gaussiana vale $1/(\sqrt{2\pi}\sigma_N)$: con $\sigma_N\to 0$ la posterior diventa sempre più alta e stretta, con area sempre uguale a 1. È la forma delle curve della slide p38: la posterior diventa sempre più piccata (*more and more sharply peaked*).`,
      },
      {
        latex: md`P\{\vert\mu-\mu_N\vert\ge\varepsilon\,|\,\boldsymbol{X}\}\le\frac{\sigma_N^2}{\varepsilon^2}\;\xrightarrow{\;N\to\infty\;}\;0\qquad\forall\varepsilon>0`,
        why: md`Passo non scritto nella fonte: disuguaglianza di Chebyshev applicata alla posterior, che ha media $\mu_N$ e varianza $\sigma_N^2$. Per quanto piccolo sia $\varepsilon$, la probabilità a posteriori fuori dall'intervallo $[\mu_N-\varepsilon,\mu_N+\varepsilon]$ tende a zero: tutta la massa si concentra su un solo valore.`,
      },
      {
        latex: md`p(\mu\,|\,\boldsymbol{X})\;\xrightarrow{\;N\to+\infty\;}\;\delta(\mu-\bar{X})`,
        why: md`Una densità con area 1 e tutta la massa concentrata in un punto è, al limite, una delta di Dirac (*Dirac delta function*). Poiché $\mu_N-\bar{X}\to 0$, il centro è la media campionaria. La slide p38 chiama questo comportamento *Bayesian learning*; le note di pagina 29 aggiungono che, osservando più dati, la posterior diventa più certa sul valore vero di $\mu$.`,
      },
    ],
    conclusion: md`Senza campioni la posterior è il prior: $\mu_N=\mu_0$ e $\sigma_N^2=\sigma_0^2$. Con infiniti campioni l'influenza del prior svanisce: $\mu_N\to\bar{X}$, $\sigma_N^2\to 0$ come $\sigma^2/N$, e la posterior diventa una delta di Dirac centrata in $\bar{X}$. In mezzo, ogni nuovo campione aggiunge precisione $1/\sigma^2$ e sposta $\mu_N$ da $\mu_0$ verso $\bar{X}$: è il *Bayesian learning*. Tutto questo richiede $\sigma_0^2>0$.`,
    source: [{ doc: 'part1', page: 28 }, { doc: 'part1', page: 29 }, { doc: 'ch2', page: 38 }],
  },

  // --- der06 Densità predittiva gaussiana ----------------------------------------------------------------
  {
    id: 'der06',
    title: 'Densità predittiva gaussiana: p(x|X) ~ N(μN, σ²+σN²)',
    goal: md`Calcolare l'integrale $p(\mathbf{x}\,|\,\boldsymbol{X})=\int p(\mathbf{x}\,|\,\mu)\,p(\mu\,|\,\boldsymbol{X})\,\mathrm{d}\mu$ e mostrare che dà una gaussiana di media $\mu_N$ e varianza $\sigma^2+\sigma_N^2$. La slide p39 riporta tre righe di calcolo e la conclusione; lo sviluppo, il completamento del quadrato e il valore di $f(\sigma,\sigma_N)$ sono ricostruiti qui.`,
    assumptions: md`$p(\mathbf{x}\,|\,\mu)\sim N(\mu,\sigma^2)$ con $\sigma^2>0$ noto; la posterior della media è già calcolata, $p(\mu\,|\,\boldsymbol{X})\sim N(\mu_N,\sigma_N^2)$ con $\sigma_N^2>0$ ([identificazione di μN e σN²](#derivation:der04)). Si usa la formula chiave della stima bayesiana con $\boldsymbol{\theta}=\mu$; l'integrale in $\mathrm{d}\mu$ va su tutta la retta reale.`,
    steps: [
      {
        latex: md`p(\mathbf{x}\,|\,\boldsymbol{X})=\int p(\mathbf{x}\,|\,\mu)\,p(\mu\,|\,\boldsymbol{X})\,\mathrm{d}\mu`,
        why: md`Formula chiave con $\boldsymbol{\theta}=\mu$: ottenuta la posterior della media, resta da calcolare la densità desiderata (*all that remains is to obtain the desired density p(x|X)*, slide p39). La predittiva è la media del modello $p(\mathbf{x}\,|\,\mu)$ pesata dalla posterior.`,
      },
      {
        latex: md`p(\mathbf{x}\,|\,\boldsymbol{X})=\int\frac{1}{\sqrt{2\pi}\sigma}\exp\left[-\frac{1}{2}\left(\frac{\mathbf{x}-\mu}{\sigma}\right)^2\right]\frac{1}{\sqrt{2\pi}\sigma_N}\exp\left[-\frac{1}{2}\left(\frac{\mu-\mu_N}{\sigma_N}\right)^2\right]\mathrm{d}\mu`,
        why: md`Si sostituiscono le due gaussiane: $p(\mathbf{x}\,|\,\mu)\sim N(\mu,\sigma^2)$ per ipotesi e $p(\mu\,|\,\boldsymbol{X})\sim N(\mu_N,\sigma_N^2)$ dal risultato precedente. È il secondo rigo della slide p39.`,
      },
      {
        latex: md`p(\mathbf{x}\,|\,\boldsymbol{X})=\frac{1}{2\pi\,\sigma\sigma_N}\int\exp\left\{-\frac{1}{2}\left[\frac{(\mathbf{x}-\mu)^2}{\sigma^2}+\frac{(\mu-\mu_N)^2}{\sigma_N^2}\right]\right\}\mathrm{d}\mu`,
        why: md`Passo non scritto nella fonte. Si portano fuori dall'integrale le costanti $1/(\sqrt{2\pi}\sigma)$ e $1/(\sqrt{2\pi}\sigma_N)$, il cui prodotto è $1/(2\pi\sigma\sigma_N)$, e si uniscono i due esponenziali in uno solo ($e^a e^b = e^{a+b}$).`,
      },
      {
        latex: md`\frac{(\mathbf{x}-\mu)^2}{\sigma^2}+\frac{(\mu-\mu_N)^2}{\sigma_N^2}=\frac{\sigma^2+\sigma_N^2}{\sigma^2\sigma_N^2}\,\mu^2-2\,\frac{\sigma_N^2\mathbf{x}+\sigma^2\mu_N}{\sigma^2\sigma_N^2}\,\mu+\frac{\mathbf{x}^2}{\sigma^2}+\frac{\mu_N^2}{\sigma_N^2}`,
        why: md`Si sviluppano i due quadrati e si raccolgono le potenze di $\mu$, la variabile di integrazione; $\mathbf{x}$ e $\mu_N$ sono costanti rispetto all'integrale. Coefficiente di $\mu^2$: $\frac{1}{\sigma^2}+\frac{1}{\sigma_N^2}=\frac{\sigma_N^2+\sigma^2}{\sigma^2\sigma_N^2}$. Coefficiente di $-2\mu$: $\frac{\mathbf{x}}{\sigma^2}+\frac{\mu_N}{\sigma_N^2}=\frac{\sigma_N^2\mathbf{x}+\sigma^2\mu_N}{\sigma^2\sigma_N^2}$.`,
      },
      {
        latex: md`A\mu^2-2B\mu+C=A\left(\mu-\frac{B}{A}\right)^2+C-\frac{B^2}{A},\qquad\frac{B}{A}=\frac{\sigma_N^2\mathbf{x}+\sigma^2\mu_N}{\sigma^2+\sigma_N^2}`,
        why: md`Passo non scritto nella fonte: completamento del quadrato in $\mu$, con $A=\frac{\sigma^2+\sigma_N^2}{\sigma^2\sigma_N^2}$, $B=\frac{\sigma_N^2\mathbf{x}+\sigma^2\mu_N}{\sigma^2\sigma_N^2}$ e $C=\frac{\mathbf{x}^2}{\sigma^2}+\frac{\mu_N^2}{\sigma_N^2}$. Nel rapporto $B/A$ il fattore $\sigma^2\sigma_N^2$ si semplifica.`,
      },
      {
        latex: md`C-\frac{B^2}{A}=\frac{\mathbf{x}^2\sigma_N^2(\sigma^2+\sigma_N^2)+\mu_N^2\sigma^2(\sigma^2+\sigma_N^2)-(\sigma_N^2\mathbf{x}+\sigma^2\mu_N)^2}{\sigma^2\sigma_N^2(\sigma^2+\sigma_N^2)}=\frac{\sigma^2\sigma_N^2(\mathbf{x}-\mu_N)^2}{\sigma^2\sigma_N^2(\sigma^2+\sigma_N^2)}=\frac{(\mathbf{x}-\mu_N)^2}{\sigma^2+\sigma_N^2}`,
        why: md`Passo non scritto nella fonte: il resto del completamento. Si porta tutto a denominatore comune $\sigma^2\sigma_N^2(\sigma^2+\sigma_N^2)$, notando che $B^2/A=(\sigma_N^2\mathbf{x}+\sigma^2\mu_N)^2/[\sigma^2\sigma_N^2(\sigma^2+\sigma_N^2)]$. Al numeratore i termini $\mathbf{x}^2\sigma_N^4$ e $\mu_N^2\sigma^4$ si cancellano con quelli del quadrato sottratto e resta $\sigma^2\sigma_N^2(\mathbf{x}^2-2\mathbf{x}\mu_N+\mu_N^2)=\sigma^2\sigma_N^2(\mathbf{x}-\mu_N)^2$.`,
      },
      {
        latex: md`\frac{(\mathbf{x}-\mu)^2}{\sigma^2}+\frac{(\mu-\mu_N)^2}{\sigma_N^2}=\frac{\sigma^2+\sigma_N^2}{\sigma^2\sigma_N^2}\left(\mu-\frac{\sigma_N^2\mathbf{x}+\sigma^2\mu_N}{\sigma^2+\sigma_N^2}\right)^2+\frac{(\mathbf{x}-\mu_N)^2}{\sigma^2+\sigma_N^2}`,
        why: md`Si mettono insieme i due passi precedenti. L'esponente si separa in un quadrato in $\mu$ e in un resto senza $\mu$, $(\mathbf{x}-\mu_N)^2/(\sigma^2+\sigma_N^2)$: è l'unico pezzo in cui sopravvive $\mathbf{x}$ dopo l'integrazione.`,
      },
      {
        latex: md`p(\mathbf{x}\,|\,\boldsymbol{X})=\frac{1}{2\pi\,\sigma\sigma_N}\exp\left[-\frac{1}{2}\frac{(\mathbf{x}-\mu_N)^2}{\sigma^2+\sigma_N^2}\right]f(\sigma,\sigma_N)`,
        why: md`Il fattore che non dipende da $\mu$ esce dall'integrale; l'integrale che resta viene chiamato $f(\sigma,\sigma_N)$. È il terzo rigo della slide p39, riportato uguale nelle note di pagina 29. Né la slide né le note dicono quanto vale $f$.`,
      },
      {
        latex: md`\int_{-\infty}^{+\infty}\exp\left[-\frac{a}{2}(\mu-m)^2\right]\mathrm{d}\mu=\sqrt{\frac{2\pi}{a}}\qquad(a>0,\;m\in\mathbb{R})`,
        why: md`Integrale gaussiano, passo non scritto nella fonte. La densità $N(m,1/a)$ vale $\sqrt{a/(2\pi)}\exp[-\frac{a}{2}(\mu-m)^2]$ e ha area 1, quindi l'integrale del solo esponenziale è $\sqrt{2\pi/a}$. Il valore non dipende dal centro $m$: traslare una curva non cambia la sua area.`,
      },
      {
        latex: md`f(\sigma,\sigma_N)=\int\exp\left[-\frac{1}{2}\,\frac{\sigma^2+\sigma_N^2}{\sigma^2\sigma_N^2}\left(\mu-\frac{\sigma_N^2\mathbf{x}+\sigma^2\mu_N}{\sigma^2+\sigma_N^2}\right)^2\right]\mathrm{d}\mu=\sqrt{2\pi}\,\frac{\sigma\sigma_N}{\sqrt{\sigma^2+\sigma_N^2}}`,
        why: md`Si applica l'integrale gaussiano con $a = A = (\sigma^2+\sigma_N^2)/(\sigma^2\sigma_N^2)$ e centro $m = B/A$: $\sqrt{2\pi/A}=\sqrt{2\pi\,\sigma^2\sigma_N^2/(\sigma^2+\sigma_N^2)}$. Il centro contiene $\mathbf{x}$, ma l'area non dipende dal centro: il valore dipende solo dalle larghezze $\sigma$ e $\sigma_N$, da cui il nome $f(\sigma,\sigma_N)$. Il valore esplicito è ricostruito (Duda, Hart e Stork), non compare nelle fonti del corso.`,
      },
      {
        latex: md`\frac{1}{2\pi\,\sigma\sigma_N}\cdot\sqrt{2\pi}\,\frac{\sigma\sigma_N}{\sqrt{\sigma^2+\sigma_N^2}}=\frac{1}{\sqrt{2\pi}\sqrt{\sigma^2+\sigma_N^2}}=\frac{1}{\sqrt{2\pi(\sigma^2+\sigma_N^2)}}`,
        why: md`Passo non scritto nella fonte: si moltiplicano le costanti. $\sigma\sigma_N$ si semplifica e $\sqrt{2\pi}/(2\pi)=1/\sqrt{2\pi}$.`,
      },
      {
        latex: md`p(\mathbf{x}\,|\,\boldsymbol{X})=\frac{1}{\sqrt{2\pi(\sigma^2+\sigma_N^2)}}\exp\left[-\frac{1}{2}\frac{(\mathbf{x}-\mu_N)^2}{\sigma^2+\sigma_N^2}\right]`,
        why: md`La costante trovata è proprio la costante di normalizzazione di una gaussiana di varianza $\sigma^2+\sigma_N^2$, e l'esponente è quello di una gaussiana centrata in $\mu_N$ con la stessa varianza. Il fattore $f(\sigma,\sigma_N)$ non cambia la forma in $\mathbf{x}$: completa la normalizzazione.`,
      },
      {
        latex: md`p(\mathbf{x}\,|\,\boldsymbol{X})\sim N(\mu_N,\;\sigma^2+\sigma_N^2)`,
        why: md`Conclusione in rosso della slide p39: la predittiva è gaussiana con media $\mu_N$ e varianza $\sigma^2+\sigma_N^2$. Confrontandola con il modello $p(\mathbf{x}\,|\,\mu)\sim N(\mu,\sigma^2)$ la slide scrive *and thus μ = μN*: il valore di $\mu$ che si inferisce dalla distribuzione stimata è la media a posteriori. L'identificazione riguarda solo la media, perché la varianza non è $\sigma^2$.`,
      },
      {
        latex: md`\sigma^2+\sigma_N^2>\sigma^2\quad(N\ \text{finito}),\qquad\sigma^2+\sigma_N^2\;\xrightarrow{\;N\to\infty\;}\;\sigma^2`,
        why: md`Lettura delle note di pagina 29: la varianza predittiva incorpora sia la varianza intrinseca $\sigma^2$ sia l'incertezza sulla stima di $\mu$, $\sigma_N^2$ (*incorporating both the inherent variance and the uncertainty in the estimate of μ*). Con pochi campioni la predittiva è più larga del modello con una stima puntuale inserita; con $\sigma_N^2\to 0$ torna larga $\sigma^2$.`,
      },
      {
        latex: md`\mathbf{x}=\mu+\varepsilon,\quad\mu\,|\,\boldsymbol{X}\sim N(\mu_N,\sigma_N^2),\quad\varepsilon\sim N(0,\sigma^2)\;\Rightarrow\;\mathbf{x}\,|\,\boldsymbol{X}\sim N(\mu_N,\;\sigma_N^2+\sigma^2)`,
        why: md`Controllo rapido, non nella fonte. Una nuova osservazione è la media ignota più un rumore indipendente da essa. La somma di due gaussiane indipendenti è gaussiana, con media uguale alla somma delle medie ($\mu_N+0$) e varianza uguale alla somma delle varianze. Si ritrova lo stesso risultato senza integrali.`,
      },
    ],
    conclusion: md`$p(\mathbf{x}\,|\,\boldsymbol{X})\sim N(\mu_N,\sigma^2+\sigma_N^2)$. La densità predittiva ha la media a posteriori come centro e una varianza che somma la variabilità propria dei dati, $\sigma^2$, e l'incertezza residua su $\mu$, $\sigma_N^2$. Per $N$ finito è più larga di $N(\mu_N,\sigma^2)$; le due coincidono solo quando $\sigma_N^2\to 0$.`,
    source: [{ doc: 'ch2', page: 39 }, { doc: 'part1', page: 29 }],
  },

  // --- der07 Equivalenza ML-Bayes ------------------------------------------------------------------------
  {
    id: 'der07',
    title: 'Perché ML e Bayes coincidono con infiniti campioni o con prior uniforme',
    goal: md`Giustificare le due condizioni di equivalenza della slide p40, nel limite di infiniti campioni di training (*in the asymptotic limit of infinite training samples*) e con prior uniforme (*if the prior p(θ) is uniform*), prima in generale e poi sull'esempio gaussiano. La fonte enuncia i due casi e li motiva a parole (note di pagina 30); i passaggi formali sono ricostruiti.`,
    assumptions: md`ML tratta $\boldsymbol{\theta}$ come fisso ma ignoto: lo stima con il punto $\hat{\boldsymbol{\theta}}_{ML}=\arg\max_{\boldsymbol{\theta}}p(\boldsymbol{X}\,|\,\boldsymbol{\theta})$ e lo inserisce nel modello (*plug-in*). Bayes tratta $\boldsymbol{\theta}$ come variabile aleatoria e calcola $p(\mathbf{x}\,|\,\boldsymbol{X})$ con la formula chiave. Nell'esempio gaussiano $p(\mathbf{x}\,|\,\mu)\sim N(\mu,\sigma^2)$ con $\sigma^2$ noto e prior $N(\mu_0,\sigma_0^2)$ con $\sigma_0^2>0$.`,
    steps: [
      {
        latex: md`\text{ML: }\;p(\mathbf{x}\,|\,\hat{\boldsymbol{\theta}}_{ML})\qquad\text{Bayes: }\;p(\mathbf{x}\,|\,\boldsymbol{X})=\int p(\mathbf{x}\,|\,\boldsymbol{\theta})\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})\,\mathrm{d}\boldsymbol{\theta}`,
        why: md`Passo non scritto nella fonte, che mette a confronto i due risultati. L'approccio ML stima un punto nello spazio di $\boldsymbol{\theta}$ (*a point in θ space*), l'approccio bayesiano stima una distribuzione da cui $\boldsymbol{\theta}$ viene inferito (*a distribution p(x|X) from which θ is inferred*, slide p40).`,
      },
      {
        latex: md`p(\boldsymbol{\theta}\,|\,\boldsymbol{X})=\delta(\boldsymbol{\theta}-\hat{\boldsymbol{\theta}})\;\Rightarrow\;\int p(\mathbf{x}\,|\,\boldsymbol{\theta})\,\delta(\boldsymbol{\theta}-\hat{\boldsymbol{\theta}})\,\mathrm{d}\boldsymbol{\theta}=p(\mathbf{x}\,|\,\hat{\boldsymbol{\theta}})`,
        why: md`Passo non scritto nella fonte. Per la proprietà di campionamento della delta di Dirac (*sifting property*), se la posterior è concentrata in un solo punto $\hat{\boldsymbol{\theta}}$ la media bayesiana si riduce al modello valutato in quel punto. Quindi la densità bayesiana coincide con il modello ML inserito (*plug-in*) quando la posterior collassa sulla stima ML. Se invece la posterior ha soltanto il massimo in $\hat{\boldsymbol{\theta}}_{ML}$ (prior uniforme, $N$ finito) coincide la stima puntuale del parametro, non la densità: lo mostra l'ultimo passo.`,
      },
      {
        latex: md`\hat{\mu}_{ML}=\bar{X}=\frac{1}{N}\sum_{k=1}^{N}\mathbf{x}_k`,
        why: md`Risultato della stima ML sul modello gaussiano: la stima ML della media di una gaussiana è la media campionaria.`,
      },
      {
        latex: md`N\to\infty:\quad\mu_N\to\bar{X}=\hat{\mu}_{ML},\qquad\sigma_N^2\to 0\;\Rightarrow\;p(\mathbf{x}\,|\,\boldsymbol{X})\to N(\bar{X},\sigma^2)=p(\mathbf{x}\,|\,\hat{\mu}_{ML})`,
        why: md`Equivalenza asintotica. Con infiniti campioni la media a posteriori coincide con la stima ML e la posterior collassa in una delta ([casi limite della posterior](#derivation:der05)); per il passo precedente anche la densità predittiva $N(\mu_N,\sigma^2+\sigma_N^2)$ coincide con quella ottenuta inserendo la stima ML nel modello. Le note: entrambi i metodi convergono ai valori veri dei parametri, sono stimatori consistenti (*consistent estimators*). Perché le due soluzioni coincidano il limite richiede $\sigma_0^2 > 0$, cioè un prior che non escluda il limite della stima ML: con un prior dogmatico la media a posteriori resta $\mu_0$ per ogni $N$ ([casi limite in σ0² e σ²](#derivation:der11)). Perché entrambe convergano al valore vero (consistenza) serve in più che i campioni vengano davvero dal modello $p(\mathbf{x}\,|\,\mu)$: con un modello sbagliato le due stime coincidono al limite, ma un valore vero del parametro non esiste. La convergenza al valore vero è dimostrata in [«perché la media a posteriori converge al valore vero»](#derivation:der12).`,
      },
      {
        latex: md`p(\boldsymbol{\theta})=c\;\Rightarrow\;p(\boldsymbol{\theta}\,|\,\boldsymbol{X})=\frac{p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,c}{\int p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,c\,\mathrm{d}\boldsymbol{\theta}}=\frac{p(\boldsymbol{X}\,|\,\boldsymbol{\theta})}{\int p(\boldsymbol{X}\,|\,\boldsymbol{\theta})\,\mathrm{d}\boldsymbol{\theta}}\;\propto\;p(\boldsymbol{X}\,|\,\boldsymbol{\theta})`,
        why: md`Prior uniforme: si sostituisce $p(\boldsymbol{\theta}) = c$ nella formula di Bayes e la costante $c$ si semplifica tra numeratore e denominatore. Il prior non influenza la posterior (*the prior doesn't influence the posterior*, note di pagina 30): la posterior è la verosimiglianza normalizzata. Un prior uniforme non assume alcuna conoscenza a priori (*no prior knowledge is assumed*). Su tutto lo spazio dei parametri una costante non ha area finita (prior improprio): va inteso come uniforme su una regione ampia o come limite di prior sempre più larghi.`,
      },
      {
        latex: md`\arg\max_{\boldsymbol{\theta}}\,p(\boldsymbol{\theta}\,|\,\boldsymbol{X})=\arg\max_{\boldsymbol{\theta}}\,p(\boldsymbol{X}\,|\,\boldsymbol{\theta})=\hat{\boldsymbol{\theta}}_{ML}`,
        why: md`Una costante positiva non sposta il punto di massimo: il massimo della posterior coincide con quello della verosimiglianza, cioè con la stima ML. La soluzione bayesiana si riduce a quella ML (*the Bayesian solution reduces to the ML solution*). Condizione: il prior deve essere costante su una regione che contiene $\hat{\boldsymbol{\theta}}_{ML}$; se il suo supporto la escludesse, il massimo della posterior non coinciderebbe con $\hat{\boldsymbol{\theta}}_{ML}$. Nel caso gaussiano, dove la verosimiglianza è unimodale, cadrebbe sull'estremo del supporto più vicino a $\bar{X}$; con una verosimiglianza a più massimi potrebbe cadere su un massimo locale interno al supporto.`,
      },
      {
        latex: md`\sum_{k=1}^{N}(\mathbf{x}_k-\mu)^2=\sum_{k=1}^{N}(\mathbf{x}_k-\bar{X})^2+N(\mu-\bar{X})^2\;\Rightarrow\;p(\mu\,|\,\boldsymbol{X})\propto\exp\left[-\frac{N(\mu-\bar{X})^2}{2\sigma^2}\right]`,
        why: md`Verifica sull'esempio gaussiano, non nella fonte. Scrivendo $\mathbf{x}_k-\mu=(\mathbf{x}_k-\bar{X})+(\bar{X}-\mu)$ e sviluppando, il doppio prodotto sparisce perché $\sum_k(\mathbf{x}_k-\bar{X})=0$. Con prior costante la posterior è proporzionale alla verosimiglianza e il primo addendo non dipende da $\mu$: resta una gaussiana in $\mu$ di media $\bar{X}$ e varianza $\sigma^2/N$.`,
      },
      {
        latex: md`\sigma_0^2\to\infty:\quad\mu_N=\frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}\bar{X}+\frac{\sigma^2}{N\sigma_0^2+\sigma^2}\mu_0\;\to\;\bar{X},\qquad\sigma_N^2\to\frac{\sigma^2}{N}`,
        why: md`Stesso risultato dalle formule della slide p37: il prior uniforme è il limite di un prior gaussiano sempre più largo. Per ogni $N\ge 1$ il peso del prior $\sigma^2/(N\sigma_0^2+\sigma^2)$ va a zero e $\mu_N$ coincide con $\bar{X}$; scrivendo $\sigma_N^2=\sigma^2/(N+\sigma^2/\sigma_0^2)$ si vede che la varianza a posteriori tende a $\sigma^2/N$, come nel passo precedente.`,
      },
      {
        latex: md`p(\mathbf{x}\,|\,\boldsymbol{X})\sim N\left(\bar{X},\;\sigma^2+\frac{\sigma^2}{N}\right)\;\neq\;N(\bar{X},\sigma^2)=p(\mathbf{x}\,|\,\hat{\mu}_{ML})\quad(N\ \text{finito})`,
        why: md`Precisazione non scritta nella fonte. Con prior uniforme la stima del parametro coincide con ML per ogni $N \ge 1$, ma la posterior conserva la larghezza $\sigma^2/N$. Quindi la densità predittiva $N(\bar{X},\sigma^2+\sigma^2/N)$ coincide con il *plug-in* ML solo quando anche $N$ è grande.`,
      },
    ],
    conclusion: md`ML e Bayes coincidono nei due casi della slide, in due sensi diversi. Nel limite di infiniti campioni la posterior diventa una delta sulla stima ML e il prior non conta più: coincidono la stima del parametro e la densità. Con prior uniforme la posterior è la verosimiglianza normalizzata, quindi il suo massimo è $\hat{\boldsymbol{\theta}}_{ML}$: coincide la stima del parametro, mentre per $N$ finito la densità predittiva resta più larga del *plug-in* ML. Nell'esempio gaussiano: $\mu_N\to\bar{X}=\hat{\mu}_{ML}$ in entrambi i casi. In pratica si preferisce spesso ML per il costo computazionale più basso (niente integrali su tutto lo spazio dei parametri) e per l'interpretazione più semplice (un solo valore del parametro).`,
    source: [{ doc: 'ch2', page: 40 }, { doc: 'part1', page: 30 }, { doc: 'part1', page: 29 }],
  },
]
