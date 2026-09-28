// Dati finti per i test dei giochi: quattro fogli in tre regioni, con id veri del manifest (così il filtro
// per corso e foglio li riconosce) e contenuti piccoli ma con i casi difficili: formule con lo stesso
// LaTeX, un termine definito in due fogli, una dimostrazione con due passaggi uguali, un quiz non vero/falso.
// Solo per i test: nessun file dell'app lo importa.
import { md } from '../../content/types'
import type { CourseId, Derivation, Exercise, Formula, GlossaryEntry, ModuleData, QuizItem } from '../../content/types'

function formula(id: string, name: string, latex: string, blanks: Formula['blanks'] = [], importance: Formula['importance'] = 3): Formula {
  return { id, name, nameEn: `${name} (en)`, latex, explain: md`Spiegazione di ${name}.`, symbols: [], importance, blanks, source: [] }
}

function tf(id: string, q: string, answer: boolean): QuizItem {
  return { id, type: 'tf', q, answer, explanation: `Perché ${answer ? 'è vero' : 'è falso'}: ${q}`, difficulty: 1, concepts: [] }
}

function exercise(id: string, title: string, difficulty: Exercise['difficulty']): Exercise {
  return {
    id,
    title,
    difficulty,
    kind: 'numerico',
    concepts: [],
    generate: (rng) => {
      const a = rng.int(2, 9)
      return { prompt: `Quanto fa ${a} per 2?`, answers: [{ label: 'Risultato', value: a * 2, tolerance: 0 }], solution: `Fa ${a * 2}.` }
    },
  }
}

function fake(id: string, course: CourseId, title: string, parts: Partial<ModuleData>): ModuleData {
  return {
    id,
    title,
    titleEn: `${title} (en)`,
    course,
    chapter: 'Capitolo di prova',
    order: 1,
    sources: [],
    prerequisites: [],
    estimatedMinutes: 10,
    summary: '',
    keyPoints: [],
    glossary: [],
    formulas: [],
    derivations: [],
    figures: [],
    flashcards: [],
    quiz: [],
    exam: [],
    exercises: [],
    widgets: [],
    connections: [],
    coverage: {},
    ...parts,
  }
}

const proof: Derivation = {
  id: 'der01',
  title: 'Dal conteggio alla stima',
  goal: 'Ricavare la stima dal conteggio.',
  steps: [
    { latex: 'P_R = \\int_R p', why: 'Probabilità della regione.' },
    { latex: 'P_R \\approx p V', why: 'La densità è quasi costante in R.' },
    { latex: '\\hat P_R = K/N', why: 'Frequenza relativa.' },
    { latex: '\\hat p = K/(NV)', why: 'Si divide per il volume.' },
  ],
  conclusion: 'Fatto.',
  source: [],
}

// due passaggi hanno lo stesso LaTeX: l'uno vale l'altro nella posizione giusta
const twin: Derivation = {
  id: 'der02',
  title: 'Passaggi gemelli',
  goal: 'Una catena con un passaggio ripetuto.',
  steps: [
    { latex: 'a = b', why: 'Primo.' },
    { latex: 'b = c', why: 'Secondo.' },
    { latex: 'a = b', why: 'Di nuovo il primo.' },
  ],
  conclusion: 'Fatto.',
  source: [],
}

const short: Derivation = { id: 'der03', title: 'Troppo corta', goal: 'Due passi.', steps: [{ latex: 'x', why: '' }, { latex: 'y', why: '' }], conclusion: '', source: [] }

const g = (term: string, en: string, def: string): GlossaryEntry => ({ term, en, def })

export const parzen = fake('m09-parzen-windows', 'melgani', 'Finestre di Parzen', {
  formulas: [
    formula('f1', 'Stima di base', '\\hat p = \\frac{K}{NV}', [{ masked: '\\hat p = \\frac{K}{\\boxed{\\;?\\;}}', answer: 'NV', distractors: ['N', 'V', 'KV'] }]),
    formula('f2', 'Volume dell\'ipercubo', 'V = h^n', [{ masked: 'V = \\boxed{\\;?\\;}', answer: 'h^n', distractors: ['nh', 'h/n'] }]),
    formula('f3', 'Kernel gaussiano', '\\gamma(x) = e^{-x^2/2}/\\sqrt{2\\pi}', [], 2),
    // stesso LaTeX di f1 con un altro nome: nel memory non può fare coppia
    formula('f4', 'Due parametri', '\\hat p = \\frac{K}{N V}'),
  ],
  derivations: [proof, twin, short],
  quiz: [
    tf('t1', 'Parzen fissa il volume.', true),
    tf('t2', 'Il K-NN fissa il volume.', false),
    tf('t3', 'Il kernel gaussiano è continuo.', true),
    tf('t4', 'Con h grande la stima ha aghi.', false),
    tf('t5', 'La stima integra a 1.', true),
    { id: 'm1', type: 'mcq', q: 'Scelta multipla', options: ['a', 'b'], answer: 0, explanation: '', difficulty: 1, concepts: [] },
  ],
  glossary: [
    g('Ipercubo', 'hypercube', 'Regione di lato h e volume $h^n$.'),
    g('Larghezza della finestra', 'window width, bandwidth', 'Il parametro che controlla quanto è lisciata la stima.'),
    g('Kernel gaussiano', 'Gaussian kernel', 'La normale standard usata come finestra.'),
    g('Sovra-lisciatura', 'oversmoothing', 'Effetto di una finestra troppo larga.'),
  ],
  exercises: [exercise('es1', 'Doppio facile', 1), exercise('es2', 'Doppio medio', 2)],
})

export const knn = fake('m08-non-parametrica-knn', 'melgani', 'K-NN', {
  formulas: [formula('f1', 'Stima K-NN', '\\hat p = \\frac{K}{N V_K}')],
  glossary: [g('Vicini più prossimi', 'nearest neighbors', 'I K campioni più vicini al punto.'), g('Ipercubo', 'hypercube', 'Doppione di un altro foglio.')],
})

export const kernels = fake('p10-kernel-trick', 'passerini', 'Kernel trick', {
  formulas: [formula('f1', 'Kernel trick', 'k(x,z) = \\phi(x)^T\\phi(z)')],
  quiz: [tf('t1', 'Il kernel è un prodotto scalare.', true), tf('t2', 'Il kernel trick calcola phi esplicitamente.', false)],
  glossary: [g('Kernel', 'kernel function', 'Prodotto scalare in uno spazio di feature.'), g('Spazio delle feature', 'feature space', 'Lo spazio in cui vive phi.')],
})

export const cnn = fake('d05-cnn', 'ricci', 'Reti convoluzionali', {
  formulas: [formula('f1', 'Dimensione di uscita', 'O = (I - K + 2P)/S + 1')],
  glossary: [g('Convoluzione', 'convolution', 'Filtro che scorre sull\'immagine.'), g('Passo', 'stride', 'Di quanto si sposta il filtro.')],
  exercises: [exercise('es1', 'Doppio difficile', 3)],
})

/** I quattro fogli nell'ordine del manifest (m08, m09, p10, d05). */
export const FAKE_MODULES: ModuleData[] = [knn, parzen, kernels, cnn]
