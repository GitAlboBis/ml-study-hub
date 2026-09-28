// Quiz dentro il testo del foglio m08 (stima non parametrica e K-NN): ognuno ha il suo <Check id="chk-NN" /> in
// index.mdx, nel punto in cui il concetto è appena stato spiegato. L'integratore li unisce a data.quiz (il validatore
// risolve <Check id> su data.quiz). I conti numerici sono rifatti a mano; i dati sono diversi da quelli degli esempi
// svolti, così il quiz non ripete un risultato già scritto nel testo.
import { md } from '../../types'
import type { QuizItem } from '../../types'

export const checks: QuizItem[] = [
  // --- ML e Bayes: quando coincidono (c03, c04) -----------------------------------------------------------
  {
    id: 'chk-01',
    type: 'multi',
    q: md`Secondo le note p30, in quali casi la stima bayesiana e la stima ML danno la stessa risposta?`,
    options: [
      md`Quando il prior $p(\theta)$ è uniforme`,
      md`Quando $N \to \infty$, con un prior che dà densità positiva al valore vero del parametro`,
      md`Quando il prior gaussiano ha $\sigma_0^2 = 0$`,
      md`Con un solo campione, qualunque sia il prior`,
    ],
    answers: [0, 1],
    explanation: md`Con prior uniforme la posterior è proporzionale alla verosimiglianza, quindi il suo massimo coincide con la stima ML (la posterior resta però una curva). Per $N \to \infty$ il peso del prior, $\sigma^2/(N\sigma_0^2 + \sigma^2)$ nel caso gaussiano, va a zero. Con $\sigma_0^2 = 0$ il prior è una certezza su $\mu_0$ e i dati non lo correggono mai: $\mu_N = \mu_0$ per ogni $N$. Con un solo campione il prior pesa moltissimo.`,
    difficulty: 2,
    concepts: ['c03', 'c04'],
  },
  // --- Perché ML, perché Bayes (c01, c02, c05, c06) -------------------------------------------------------
  {
    id: 'chk-02',
    type: 'mcq',
    q: md`Quale di questi è un vantaggio della stima bayesiana rispetto a ML, secondo le note?`,
    options: [
      md`Quantifica l'incertezza: restituisce l'intera posterior e permette intervalli di credibilità`,
      md`Richiede meno calcolo, perché non deve integrare distribuzioni`,
      md`Produce una sola stima dei parametri, più facile da interpretare`,
      md`Non fa alcuna ipotesi sulla forma funzionale della pdf`,
    ],
    answer: 0,
    explanation: md`Meno calcolo (*Lower Computational Complexity*) e una sola stima facile da usare (*Simpler Interpretability*) sono i vantaggi di ML, che dà un punto nello spazio dei parametri. Rinunciare alla forma funzionale descrive la stima non parametrica: ML e Bayes sono entrambi parametrici. L'altro vantaggio di Bayes è incorporare conoscenza a priori, utile quando i dati sono scarsi.`,
    difficulty: 1,
    concepts: ['c01', 'c02', 'c05', 'c06'],
  },
  // --- Quando serve la stima non parametrica (c07-c11) ----------------------------------------------------
  {
    id: 'chk-03',
    type: 'mcq',
    q: md`Quale di queste situazioni **non** è un motivo per scegliere una stima non parametrica?`,
    options: [
      md`Non conosci la forma funzionale della pdf del fenomeno osservato`,
      md`La densità è multimodale e una sola gaussiana la approssima male`,
      md`Hai pochi campioni e poca potenza di calcolo`,
      md`La distribuzione vera è complessa e vuoi stimarla direttamente dai dati`,
    ],
    answer: 2,
    explanation: md`Le prime due sono le condizioni della slide p41 (nessuna conoscenza a priori della forma funzionale, modelli parametrici inadeguati); la quarta è la caratteristica *data-driven* delle note. La flessibilità del non parametrico ha un prezzo: più complessità computazionale e più dati per stime accurate. Pochi campioni e poco calcolo vanno nella direzione opposta.`,
    difficulty: 1,
    concepts: ['c07', 'c08', 'c09', 'c10', 'c11'],
  },
  // --- K binomiale ed errore relativo (c19, c21, c65) -----------------------------------------------------
  {
    id: 'chk-04',
    type: 'numeric',
    q: md`In una regione $R$ piccola cadono in media $K = 25$ campioni. Circa quanto vale l'errore relativo della frequenza relativa $\hat{P}_R = K/N$, cioè la sua deviazione standard divisa per $P_R$?`,
    answer: 0.2,
    tolerance: 0.01,
    explanation: md`$K$ è binomiale di parametri $N$ e $P_R$, quindi $\sqrt{\mathrm{var}\{\hat{P}_R\}}/P_R = \sqrt{(1 - P_R)/(N P_R)} \simeq 1/\sqrt{N P_R} = 1/\sqrt{K} = 1/5 = 0.2$, cioè 20%. Per dimezzarlo servono circa $K = 100$ campioni nella regione: è la versione quantitativa di «R enough large».`,
    difficulty: 2,
    concepts: ['c19', 'c21', 'c65'],
  },
  // --- La formula madre (c20, c22) ------------------------------------------------------------------------
  {
    id: 'chk-05',
    type: 'numeric',
    q: md`Su $N = 200$ campioni, $K = 30$ cadono in un intervallo di larghezza $V = 0.5$ centrato in $x^*$. Quanto vale $\hat{p}(x^*)$?`,
    answer: 0.3,
    tolerance: 0.005,
    explanation: md`Frequenza relativa $\hat{P}_R = 30/200 = 0.15$; divisa per il volume dà $\hat{p}(x^*) = 0.15/0.5 = 0.3$, cioè $K/(NV) = 30/(200 \cdot 0.5)$.`,
    difficulty: 1,
    concepts: ['c20', 'c22'],
  },
  // --- Regione fissa e N infinito (c24, c25, c66, c71) ----------------------------------------------------
  {
    id: 'chk-06',
    type: 'mcq',
    q: md`Tieni fissa la regione $R$, di volume $V$, e fai crescere $N \to \infty$. A che cosa converge $K/(NV)$?`,
    options: [
      md`A $P_R/V$, la media di $p$ su $R$: la varianza si annulla ma il bias resta`,
      md`A $p(\mathbf{x}^*)$, per la legge dei grandi numeri`,
      md`A zero, perché $V$ resta fisso mentre $N$ cresce`,
      md`Diverge, perché $K$ cresce senza limite`,
    ],
    answer: 0,
    explanation: md`La legge dei grandi numeri porta $K/N$ a $P_R$, quindi la stima tende a $P_R/V = \frac{1}{V}\int_R p(\mathbf{x})\,d\mathbf{x}$. Coincide con $p(\mathbf{x}^*)$ solo se $p$ è costante in $R$ o se $V \to 0$. Per questo $V$ deve dipendere da $N$: $V_N \to 0$ ma $N V_N \to \infty$.`,
    difficulty: 2,
    concepts: ['c24', 'c25', 'c66', 'c71'],
  },
  // --- Chi fissa cosa (c26, c27, c28) ---------------------------------------------------------------------
  {
    id: 'chk-07',
    type: 'mcq',
    q: md`Nel metodo K-NN, che cosa fissi a priori e che cosa ricavi dai dati?`,
    options: [
      md`Fissi $K$; ricavi il volume $V$ della regione che contiene esattamente $K$ campioni`,
      md`Fissi $V$; conti quanti campioni $K$ cadono nella regione`,
      md`Fissi sia $K$ sia $V$; ricavi $N$`,
      md`Fissi la forma parametrica della pdf; ricavi i suoi parametri`,
    ],
    answer: 0,
    explanation: md`Slide p45: nel K-NN «K is fixed» e l'ipervolume $V$ si calcola dal training set; le note precisano che $V$ si regola in modo che dentro cadano esattamente $K$ campioni. Fissare $V$ e contare $K$ è il metodo di Parzen. Nessuno dei due assume una forma parametrica.`,
    difficulty: 1,
    concepts: ['c26', 'c27', 'c28'],
  },
  // --- La figura di slide 46 (c32, c33, c34) --------------------------------------------------------------
  {
    id: 'chk-08',
    type: 'numeric',
    q: md`Nella riga K-NN della figura di slide p46 vale $K = \sqrt{N}$. Se il riquadro contenesse $N = 49$ campioni, quanti campioni dovrebbe racchiudere il cerchio?`,
    answer: 7,
    tolerance: 0.01,
    explanation: md`$K = \sqrt{49} = 7$: il cerchio si espande finché il bordo passa per il settimo campione più vicino al centro. Nella riga di Parzen invece imporresti il volume $V = 1/\sqrt{49} \simeq 0.143$ e conteresti quanti campioni ci cadono, un numero casuale che può essere zero.`,
    difficulty: 1,
    concepts: ['c32', 'c33', 'c34'],
  },
  // --- Condizioni generali di convergenza (c31, c69) ------------------------------------------------------
  {
    id: 'chk-09',
    type: 'tf',
    q: md`Se $V_N \to 0$ e la stima $(K_N/N)/V_N$ deve tendere a un valore finito $p(\mathbf{x})$, allora anche $K_N/N$ deve tendere a zero.`,
    answer: true,
    explanation: md`Il denominatore tende a zero: se il numeratore $K_N/N$ non facesse lo stesso, il rapporto divergerebbe. La terza condizione, $K_N/N \to 0$, è quindi una conseguenza obbligata di $V_N \to 0$, ed è per questo che la slide p47 enuncia due sole condizioni su $K_N$.`,
    difficulty: 2,
    concepts: ['c31', 'c69'],
  },
  // --- Volume della cella ipersferica (c38, c67) ----------------------------------------------------------
  {
    id: 'chk-10',
    type: 'numeric',
    q: md`Cella K-NN circolare in 2-D: il quinto vicino di $\mathbf{x}^*$ dista $r_5 = 0.5$. Quanto vale il volume $V_K(\mathbf{x}^*)$?`,
    answer: 0.7854,
    tolerance: 0.005,
    explanation: md`In 2-D l'ipersfera è un cerchio: $V = \pi r_5^2 = \pi \cdot 0.25 \simeq 0.785$. Con lo stesso raggio avresti $V = 2r = 1$ in 1-D e $V = \frac{4}{3}\pi r^3 \simeq 0.524$ in 3-D; la formula generale è $\pi^{n/2} r^n / \Gamma(n/2 + 1)$.`,
    difficulty: 1,
    concepts: ['c38', 'c67'],
  },
  // --- Stima K-NN a mano (c37, c38, c39) ------------------------------------------------------------------
  {
    id: 'chk-11',
    type: 'numeric',
    q: md`Campioni 1-D: $1.0,\ 1.4,\ 2.0,\ 2.6,\ 3.5$ (quindi $N = 5$). Con $K = 2$, quanto vale la stima K-NN in $x^* = 1.8$?`,
    answer: 0.5,
    tolerance: 0.005,
    explanation: md`Distanze da $1.8$: $0.2$ (2.0), $0.4$ (1.4), $0.8$ (1.0 e 2.6), $1.7$ (3.5). Il secondo vicino dista $r_2 = 0.4$, quindi la cella è l'intervallo $[1.4,\ 2.2]$ con $V = 2 r_2 = 0.8$ e $\hat{p}(1.8) = 2/(5 \cdot 0.8) = 0.5$.`,
    difficulty: 2,
    concepts: ['c37', 'c38', 'c39'],
  },
  // --- Leggi K(N) consistenti (c40, c41, c42, c43) --------------------------------------------------------
  {
    id: 'chk-12',
    type: 'multi',
    q: md`Quali leggi $K_N$ danno una stima K-NN consistente?`,
    options: [md`$K_N = \sqrt{N}$`, md`$K_N = 5$`, md`$K_N = N/10$`, md`$K_N = \ln N$`, md`$K_N = N^{0.9}$`],
    answers: [0, 3, 4],
    explanation: md`Servono insieme $K_N \to \infty$ e $K_N/N \to 0$. $K_N = 5$ non cresce: la varianza non si annulla e la stima resta frastagliata. $K_N = N/10$ dà $K_N/N = 0.1$: la cella tiene sempre il 10% dei dati e il bias resta. $\ln N$ e $N^{0.9}$ soddisfano entrambe le condizioni ($N^{0.9}/N = N^{-0.1} \to 0$), il logaritmo però riduce la varianza molto lentamente.`,
    difficulty: 2,
    concepts: ['c40', 'c41', 'c42', 'c43'],
  },
  // --- La cella si regola da sola (c27, c29, c68) ---------------------------------------------------------
  {
    id: 'chk-13',
    type: 'mcq',
    q: md`Con $K_N = \sqrt{N}$ e $N$ grande, come si comporta il volume della cella K-NN in un punto con densità $p(\mathbf{x}^*) > 0$?`,
    options: [
      md`$V_K \simeq 1/(\sqrt{N}\,p(\mathbf{x}^*))$: stessa legge $1/\sqrt{N}$ di Parzen, ma con una costante decisa dai dati`,
      md`$V_K = 1/\sqrt{N}$ in ogni punto, come nella riga di Parzen`,
      md`$V_K \simeq \sqrt{N}\,p(\mathbf{x}^*)$: cresce con $N$`,
      md`$V_K$ dipende solo da $N$, non dalla densità locale`,
    ],
    answer: 0,
    explanation: md`Nella cella cadono $K$ campioni su $N$, quindi $K/N \simeq p(\mathbf{x}^*)\,V_K$ e $V_K \simeq K/(N\,p(\mathbf{x}^*)) = 1/(\sqrt{N}\,p(\mathbf{x}^*))$. Il volume iniziale $V_1 = 1/p(\mathbf{x}^*)$ è piccolo dove la densità è alta: è il senso quantitativo di «adaptive to local density variations».`,
    difficulty: 2,
    concepts: ['c27', 'c29', 'c68'],
  },
  // --- La cella aleatoria: bias K/(K-1) (c70) -------------------------------------------------------------
  {
    id: 'chk-14',
    type: 'mcq',
    q: md`Campioni i.i.d., cella piccola, $K = 5$ fisso. Circa quanto vale il valore atteso della stima K-NN rispetto alla densità vera $p(\mathbf{x}^*)$?`,
    options: [
      md`$1.25\,p(\mathbf{x}^*)$: la stima è distorta verso l'alto del fattore $K/(K-1)$`,
      md`$p(\mathbf{x}^*)$: la stima è non distorta per ogni $K$`,
      md`$0.8\,p(\mathbf{x}^*)$: la stima è distorta verso il basso`,
      md`Infinito, per qualunque $K$`,
    ],
    answer: 0,
    explanation: md`Il contenuto di probabilità della cella segue una Beta$(K, N-K+1)$ ed $E\{1/P_K\} = N/(K-1)$, quindi $E\{\hat{p}\} \simeq \frac{K}{K-1}\,p(\mathbf{x}^*) = 1.25\,p(\mathbf{x}^*)$. Il valore atteso è infinito solo per $K = 1$. Con $K = 5$ fisso resta anche una dispersione relativa che non cala aggiungendo dati: circa 58% per $N$ grande.`,
    difficulty: 3,
    concepts: ['c70'],
  },
  // --- K troppo piccolo o troppo grande (c44, c45, c46) ---------------------------------------------------
  {
    id: 'chk-15',
    type: 'tf',
    q: md`Con $K$ troppo grande la stima K-NN diventa frastagliata e insegue il rumore dei campioni (*overfitting*).`,
    answer: false,
    explanation: md`È il contrario. $K$ troppo piccolo dà una stima frastagliata (*jagged*) che cattura anche le fluttuazioni minori: *overfitting*, alta varianza. $K$ troppo grande dà una stima piatta (*flat*) che media su una regione larga e perde risoluzione: *underfitting* o *oversmoothing*, alto bias. $K$ è l'iperparametro che bilancia i due errori.`,
    difficulty: 1,
    concepts: ['c44', 'c45', 'c46'],
  },
  // --- Dove cadono le cuspidi (c48, c49) ------------------------------------------------------------------
  {
    id: 'chk-16',
    type: 'mcq',
    q: md`Stima K-NN in 1-D con $K = 3$: tre campioni consecutivi stanno in $2.0,\ 2.2,\ 2.6$. Dove cade la cuspide della stima relativa a questa terna?`,
    options: [
      md`In $2.3$, punto medio tra il primo e l'ultimo campione della terna`,
      md`In $2.2$, sul campione centrale`,
      md`In $2.27$, media dei tre campioni`,
      md`In $2.0$, sul primo campione`,
    ],
    answer: 0,
    explanation: md`Dentro la terna il terzo vicino passa dall'estremo destro al sinistro quando $x$ è equidistante dai due: $x - 2.0 = 2.6 - x$, cioè $x = 2.3$. Lì il raggio è minimo ($r_3 = 0.3$) e la stima ha il massimo $K/(N \cdot 0.6)$, per esempio $0.5$ con $N = 10$. Le discontinuità di pendenza cadono lontano dai campioni, come dice la nota della slide p48.`,
    difficulty: 2,
    concepts: ['c48', 'c49'],
  },
  // --- Code pesanti (c50, c56) ----------------------------------------------------------------------------
  {
    id: 'chk-17',
    type: 'tf',
    q: md`La stima K-NN in 1-D ha area 1, come ogni pdf.`,
    answer: false,
    explanation: md`Lontano dai campioni $r_K(x)$ cresce come $\vert x \vert$ e la stima decresce come $K/(2N\vert x \vert)$: l'integrale delle code diverge, in modo lento (logaritmico). Con $K = 1$ diverge anche attorno a ogni campione. A rigore la stima K-NN non è una pdf valida; la stima di Parzen con un kernel che è una densità invece ha area 1.`,
    difficulty: 2,
    concepts: ['c50', 'c56'],
  },
  // --- Dimensioni elevate (c52, c67) ----------------------------------------------------------------------
  {
    id: 'chk-18',
    type: 'mcq',
    q: md`Perché, secondo le note, in dimensioni elevate la scelta di $K$ diventa ancora più critica?`,
    options: [
      md`Per catturare $K$ campioni la cella deve allargarsi tanto da non essere più locale, e $p$ non è più quasi costante al suo interno`,
      md`Perché in alta dimensione la formula $K/(NV)$ smette di valere`,
      md`Perché il volume dell'ipersfera cresce più in fretta di quello del cubo circoscritto`,
      md`Perché in alta dimensione $K$ deve valere sempre 1`,
    ],
    answer: 0,
    explanation: md`Le note: il volume dell'intorno cresce esponenzialmente con la dimensione. A parità di $N$ la cella che contiene $K$ vicini diventa enorme e cade l'ipotesi di regione piccola. Il rapporto sfera/cubo va nel verso opposto a quello della terza opzione: 0.785 in 2-D, 0.524 in 3-D, circa 0.0025 in 10-D. È la maledizione della dimensionalità dell'effetto Hughes.`,
    difficulty: 2,
    concepts: ['c52', 'c67'],
  },
  // --- La griglia di slide 50 (c53-c57) -------------------------------------------------------------------
  {
    id: 'chk-19',
    type: 'mcq',
    q: md`Nella prima riga della slide p50 ($N = 1$, quindi $K = 1$) che forma ha la stima K-NN?`,
    options: [
      md`Un unico spillo $1/(2\vert x - x_1 \vert)$, con asintoto verticale sul campione e code lente`,
      md`Una gaussiana centrata sul campione`,
      md`Un rettangolo di area 1 attorno al campione`,
      md`Molti picchi casuali, uno per ogni zona dell'asse`,
    ],
    answer: 0,
    explanation: md`Con un solo campione la cella centrata in $x$ arriva fino a $x_1$: $V = 2\vert x - x_1 \vert$ e $\hat{p}(x) = 1/(2\vert x - x_1 \vert)$. Le note parlano di «random peaks», ma è un solo spillo, con area infinita. Al crescere di $N$ (16, 256) la stima si avvicina alla densità vera, che per $N = \infty$ è la gaussiana o la bimodale triangolo più rettangolo; ai bordi del rettangolo, dove $p$ è discontinua, la convergenza non è garantita.`,
    difficulty: 2,
    concepts: ['c53', 'c54', 'c55', 'c56', 'c57'],
  },
  // --- Classificatore K-NN (c64) --------------------------------------------------------------------------
  {
    id: 'chk-20',
    type: 'numeric',
    q: md`Classificatore K-NN con $K = 7$: tra i 7 vicini di $\mathbf{x}$ ci sono 3 salmoni e 4 spigole. Con i prior stimati come $N_i/N$, quanto vale la probabilità a posteriori della classe salmone?`,
    answer: 0.4286,
    tolerance: 0.005,
    explanation: md`Con la stessa cella per tutte le classi e prior $N_i/N$, volume e numerosità si semplificano: $\hat{P}(\omega_i \mid \mathbf{x}) = K_i/K = 3/7 \simeq 0.429$. La regola MAP sceglie la spigola ($4/7$), cioè il voto di maggioranza tra i vicini.`,
    difficulty: 2,
    concepts: ['c64'],
  },
  // --- Funzione finestra e ipercubo (c59, c60, c61, c62) --------------------------------------------------
  {
    id: 'chk-21',
    type: 'mcq',
    q: md`Ipercubo 2-D di lato $h = 0.5$ centrato in $\mathbf{x}^* = (1,\ 1)$. Quale campione ha $\gamma\left(\frac{\mathbf{x}_k - \mathbf{x}^*}{h}\right) = 1$?`,
    options: [md`$\mathbf{x}_k = (1.2,\ 0.8)$`, md`$\mathbf{x}_k = (1.3,\ 1.0)$`, md`$\mathbf{x}_k = (0.7,\ 1.1)$`, md`$\mathbf{x}_k = (1.0,\ 1.4)$`],
    answer: 0,
    explanation: md`Con l'ipercubo unitario centrato nell'origine serve $\vert x_{k,j} - x^*_j \vert \le h/2 = 0.25$ per ogni coordinata. $(1.2,\ 0.8)$ dista $0.2$ su entrambe: dentro. Gli altri hanno una coordinata a $0.3$, $0.3$ o $0.4$: fuori. Il volume della regione è $V = h^2 = 0.25$.`,
    difficulty: 2,
    concepts: ['c59', 'c60', 'c61', 'c62'],
  },
  // --- K-NN contro Parzen (c29, c30, c31, c63) ------------------------------------------------------------
  {
    id: 'chk-22',
    type: 'multi',
    q: md`Quali affermazioni sul confronto tra K-NN e Parzen sono corrette?`,
    options: [
      md`Il K-NN si adatta alla densità locale: la cella è piccola dove i dati sono fitti`,
      md`Con una finestra a ipercubo, la stima di Parzen può valere zero dove non cadono campioni`,
      md`La stima K-NN integra a 1, quella di Parzen no`,
      md`Entrambi convergono alla pdf vera, ma a campione finito il comportamento è difficile da prevedere`,
      md`Parzen fissa $K$ e misura $V$`,
    ],
    answers: [0, 1, 3],
    explanation: md`Il K-NN è adattivo (note p32) e non si annulla mai, ma ha code lente e area infinita. Parzen dà stime lisce e di area 1 con un kernel che è una densità, e con finestre a supporto limitato può valere zero. Parzen fissa $V$ e conta $K$, il K-NN il contrario. Slide p45: «Both of these methods do in fact converge», con comportamento a campione finito difficile da prevedere.`,
    difficulty: 2,
    concepts: ['c29', 'c30', 'c31', 'c63'],
  },
]
