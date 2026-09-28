// Test della ricerca dell'atlante su dati finti: tre fogli (due pronti, uno in preparazione), un indice delle
// sezioni che contiene un foglio non pronto e ne manca uno pronto, voci di glossario ripetute fra fogli.
import { describe, expect, it } from 'vitest'
import type { ModuleManifestEntry } from '../content/manifest'
import type { ModuleData } from '../content/types'
import { buildSearchIndex, highlightRanges, latexWords, loadSearchIndex, searchAtlas, toPlain } from './search'
import type { SearchSources } from './search'

const SHEETS: ModuleManifestEntry[] = [
  { id: 'm90-finta-parzen', course: 'melgani', chapter: 'Cap. 2 · Stima statistica', title: 'Finestre di Parzen', titleEn: 'Parzen windows', sources: [] },
  { id: 'm91-finto-bayes', course: 'melgani', chapter: 'Cap. 3 · Classificazione', title: 'Classificatore di Bayes', titleEn: 'Bayes classifier', sources: [] },
  { id: 'p90-finta-svm', course: 'passerini', chapter: 'Part 2 · Kernel', title: 'Macchine a vettori di supporto', titleEn: 'Support vector machines', sources: [] },
]

function mod(partial: Partial<ModuleData> & Pick<ModuleData, 'id'>): ModuleData {
  const meta = SHEETS.find((s) => s.id === partial.id)!
  return {
    title: meta.title, titleEn: meta.titleEn, course: meta.course, chapter: meta.chapter, order: 1, sources: [], prerequisites: [],
    estimatedMinutes: 60, summary: '', keyPoints: [], glossary: [], formulas: [], derivations: [], figures: [], flashcards: [], quiz: [],
    exam: [], exercises: [], widgets: [], connections: [], coverage: {},
    ...partial,
  }
}

const PARZEN = mod({
  id: 'm90-finta-parzen',
  glossary: [
    { term: 'Densità legittima', en: 'legitimate density function', def: 'Funzione non negativa che integra a 1.' },
    { term: 'Kernel', en: 'kernel', def: 'La funzione che pesa i campioni.' },
  ],
  formulas: [
    {
      id: 'f-c01', name: 'Kernel gaussiano sferico', nameEn: 'Spherical Gaussian kernel', latex: String.raw`\gamma(\mathbf{u}) = \frac{1}{(2\pi)^{n/2}\sigma^n} e^{-\frac{\|\mathbf{u}\|^2}{2\sigma^2}}`,
      explain: 'Una gaussiana su ogni campione.', symbols: [{ s: String.raw`\sigma`, meaning: 'deviazione standard, la larghezza della finestra' }],
      importance: 3, blanks: [], source: [],
    },
    {
      id: 'f-c02', name: 'Volume della finestra', nameEn: 'Window volume', latex: 'V = h^n', explain: 'Il volume dell\'ipercubo.',
      symbols: [{ s: 'h', meaning: 'lato dell\'ipercubo' }], importance: 2, blanks: [], source: [],
    },
  ],
  flashcards: [{ id: 'fc01', q: 'Quale kernel si usa di più?', a: 'Il gaussiano: è liscio e ha una sola larghezza, $\\sigma$.', kind: 'intuizione' }],
  exam: [{ id: 'q01', q: 'Che cosa succede se $h$ è troppo grande?', qEn: 'What happens if the window width is too large?', prof: 'Melgani', fromBank: true, answer: '', checklist: ['oversmoothing'], followUps: [] }],
  widgets: [{ id: 'm90-somma-kernel', title: 'La somma dei kernel in tempo reale', concepts: [] }],
})

const SVM = mod({
  id: 'p90-finta-svm',
  glossary: [{ term: 'Nucleo', en: 'Kernel', def: 'Prodotto scalare in uno spazio di feature.' }],
})

const SOURCES: SearchSources = {
  sheets: SHEETS,
  modules: [PARZEN, SVM],
  sections: {
    'm90-finta-parzen': [
      { slug: 'lipercubo-e-la-funzione-finestra', level: 2, title: "L'ipercubo e la funzione finestra" },
      { slug: 'il-kernel-gaussiano', level: 3, title: 'Il kernel gaussiano', parent: 'Esempi di kernel' },
      { slug: 'scelta-di-sigma', level: 3, title: 'Scelta di $\\sigma$', parent: 'Esempi di kernel' },
    ],
    // foglio non pronto: le sue sezioni non entrano nell'indice
    'm91-finto-bayes': [{ slug: 'la-regola-di-bayes', level: 2, title: 'La regola di Bayes' }],
    // p90 manca: la ricerca funziona lo stesso
  },
}

const index = buildSearchIndex(SOURCES)
const find = (query: string, perGroup?: number) => searchAtlas(index, query, perGroup === undefined ? {} : { perGroup })
const types = (query: string) => find(query).groups.map((g) => g.type)
const hrefs = (query: string) => find(query).groups.flatMap((g) => g.items.map((h) => h.entry.href))

describe('testo semplice per l\'indice', () => {
  it('latexWords tiene i nomi dei simboli e scarta i comandi di struttura', () => {
    const words = latexWords(String.raw`\hat{p}(\mathbf{x}) = \frac{1}{N h^n} \sum_k \gamma\left(\frac{\mathbf{x}-\mathbf{x}_k}{h}\right)`).split(' ')
    expect(words).toEqual(expect.arrayContaining(['p', 'x', 'N', 'h', 'sum', 'gamma']))
    expect(words).not.toContain('mathbf')
    expect(words).not.toContain('frac')
    expect(words).not.toContain('left')
  })

  it('toPlain toglie Markdown e collegamenti e riscrive la matematica', () => {
    const plain = toPlain('Con **$\\sigma$ piccola** vedi [la sezione](#scelta-di-sigma) e `codice`.')
    expect(plain).toContain('sigma')
    expect(plain).toContain('la sezione')
    expect(plain).not.toMatch(/[*$#`[\]()]/)
  })
})

describe('ricerca', () => {
  it('trova un foglio dal prefisso del titolo e porta al foglio', () => {
    const r = find('parz')
    expect(r.groups[0].type).toBe('foglio')
    expect(r.groups[0].items[0].entry).toMatchObject({ href: '/m/m90-finta-parzen', sheet: { number: '01', course: 'melgani', ready: true } })
  })

  it('perdona un errore di battitura nelle parole lunghe (fuzzy leggero)', () => {
    expect(hrefs('parxen')).toContain('/m/m90-finta-parzen')
    expect(hrefs('suport vectr')).toContain('/m/p90-finta-svm')
  })

  it('ignora accenti e maiuscole', () => {
    expect(hrefs('DENSITA')).toContain('/glossario#termine:legitimate-density-function')
  })

  it('trova le sezioni della teoria dal JSON, con lo slug nella destinazione', () => {
    expect(hrefs('ipercubo')).toContain('/m/m90-finta-parzen/teoria#lipercubo-e-la-funzione-finestra')
  })

  it('le sezioni di un foglio non pronto non entrano, un foglio pronto senza sezioni nel JSON funziona', () => {
    expect(hrefs('regola')).toEqual([])
    const bayes = find('bayes')
    expect(bayes.groups.map((g) => g.type)).toEqual(['foglio'])
    expect(bayes.groups[0].items[0].entry).toMatchObject({ href: '/m/m91-finto-bayes', sheet: { number: '02', ready: false } })
    expect(hrefs('supporto')).toContain('/m/p90-finta-svm')
  })

  it('trova le formule per nome italiano, inglese e per simbolo, anche scritto in greco', () => {
    const formula = '/m/m90-finta-parzen/formule#formula:f-c01'
    expect(hrefs('gaussiano sferico')).toContain(formula)
    expect(hrefs('spherical')).toContain(formula)
    expect(hrefs('sigma')).toContain(formula)
    expect(hrefs('σ')).toContain(formula)
    expect(find('volume').groups.find((g) => g.type === 'formula')?.items[0].entry.latex).toBe('V = h^n')
  })

  it('pesa i titoli più delle formule e le formule più del resto', () => {
    // "sigma" è nel titolo di una sezione, fra i simboli di una formula e nella risposta di una flashcard
    expect(types('sigma')).toEqual(['sezione', 'formula', 'flashcard'])
    // "gaussiano" è nel titolo di una sezione e nel nome di una formula: la flashcard, che lo ha nel testo, viene dopo
    expect(types('gaussiano').at(-1)).toBe('flashcard')
  })

  it('il foglio che porta il nome cercato viene prima delle sue formule, e un foglio pronto prima di uno in preparazione', () => {
    // come nell'atlante vero: titoli dei fogli lunghi, tante formule con nomi brevi che ripetono la stessa parola
    const sheets: ModuleManifestEntry[] = [
      { id: 'p95-kernel', course: 'passerini', chapter: 'Part 2', title: 'Kernel trick e kernel validi', titleEn: 'Kernel machines intro, kernel trick, valid kernels', sources: [] },
      { id: 'm95-parzen', course: 'melgani', chapter: 'Cap. 2', title: 'Finestre di Parzen (kernel density estimation)', titleEn: 'Parzen windows estimation, width effect, kernels, properties', sources: [] },
    ]
    const ready: ModuleData = {
      ...mod({ id: 'm90-finta-parzen' }),
      id: 'm95-parzen',
      formulas: Array.from({ length: 12 }, (_, i) => ({
        id: `f${i}`, name: `Stima di Parzen ${i}`, nameEn: `Parzen estimate ${i}`, latex: 'x', explain: '', symbols: [], importance: 2 as const, blanks: [], source: [],
      })),
    }
    const big = buildSearchIndex({ sheets, modules: [ready], sections: {} })
    expect(searchAtlas(big, 'parzen').groups[0].type).toBe('foglio')
    const kernelSheets = searchAtlas(big, 'kernel').groups.find((g) => g.type === 'foglio')!
    expect(kernelSheets.items.map((h) => h.entry.sheet?.id)).toEqual(['m95-parzen', 'p95-kernel'])
  })

  it('un titolo con un pedice scritto a mano (σ_k) resta testo semplice e si evidenzia', () => {
    const idx = buildSearchIndex({ ...SOURCES, modules: [{ ...PARZEN, widgets: [{ id: 'w-sigma', title: 'σ adattiva: una σ_k per ogni campione', concepts: [] }] }] })
    expect(searchAtlas(idx, 'adattiva').groups.find((g) => g.type === 'widget')?.items[0].entry.plain).toBe(true)
  })

  it('raggruppa per tipo e dice di che foglio è ogni risultato', () => {
    const r = find('kernel')
    const all = r.groups.flatMap((g) => g.items)
    expect(new Set(r.groups.map((g) => g.type)).size).toBe(r.groups.length)
    for (const h of all) expect(h.entry.sheet?.title).toBeTruthy()
    expect(r.groups.find((g) => g.type === 'widget')?.items[0].entry.href).toBe('/lab/m90-somma-kernel')
    expect(r.groups.find((g) => g.type === 'flashcard')?.items[0].entry.href).toBe('/m/m90-finta-parzen/flashcard')
  })

  it('una voce di glossario ripetuta in più fogli è una sola, con gli altri fogli accanto', () => {
    const glossary = find('kernel').groups.find((g) => g.type === 'glossario')!
    expect(glossary.items).toHaveLength(1)
    // porta alla voce del glossario (l'ancora che la pagina monta subito), non a un elenco da filtrare
    expect(glossary.items[0].entry).toMatchObject({ href: '/glossario#termine:kernel', alsoIn: ['p90-finta-svm'] })
  })

  it("porta la domanda d'orale al suo posto nella scheda Orale, anche dal testo inglese", () => {
    expect(hrefs('window width too large')).toContain('/m/m90-finta-parzen/orale#exam:q01')
  })

  it('con più parole vuole tutte le parole; se nessun risultato le ha tutte, basta una', () => {
    expect(hrefs('kernel gaussiano')).not.toContain('/m/p90-finta-svm')
    const either = hrefs('parzen supporto')
    expect(either).toEqual(expect.arrayContaining(['/m/m90-finta-parzen', '/m/p90-finta-svm']))
  })

  it('trova le pagine dell\'app', () => {
    expect(hrefs('formulario')).toContain('/formulario')
    expect(hrefs('oral exam')).toContain('/orale')
  })

  it('limita i risultati per gruppo ma conta tutto', () => {
    const r = find('kernel', 1)
    const formula = r.groups.find((g) => g.type === 'formula')
    expect(r.groups.every((g) => g.items.length <= 1)).toBe(true)
    expect(r.total).toBeGreaterThan(r.groups.length)
    expect(formula?.total).toBeGreaterThanOrEqual(1)
  })

  it('una ricerca vuota non dà risultati', () => {
    expect(find('   ')).toMatchObject({ total: 0, groups: [] })
  })

  it("dice quanti fogli sono nell'indice", () => {
    expect(index.stats).toMatchObject({ readySheets: 2, totalSheets: 3 })
    expect(index.stats.entries).toBeGreaterThan(10)
  })
})

describe('regressioni dalla revisione', () => {
  const A = mod({
    id: 'm90-finta-parzen',
    glossary: [{ term: 'Stima a massima verosimiglianza', en: 'Maximum Likelihood Estimation (MLE)', def: 'Da A.' }],
    formulas: [
      { id: 'f-knn', name: 'Stima K-NN della densità', nameEn: 'K-NN density estimate', latex: String.raw`\hat p(x) = \frac{K}{N V}`, explain: 'Fissi K.', symbols: [], importance: 3, blanks: [], source: [] },
    ],
  })
  const B = mod({ id: 'p90-finta-svm', glossary: [{ term: 'Stima a massima verosimiglianza', en: 'maximum likelihood (ML) estimation', def: 'Da B.' }] })
  const small = buildSearchIndex({ sheets: SHEETS, modules: [A, B], sections: {} })

  it('lo stesso concetto del glossario scritto in due modi è una voce sola', () => {
    const glossary = searchAtlas(small, 'massima verosimiglianza').groups.find((g) => g.type === 'glossario')!
    expect(glossary.items).toHaveLength(1)
    expect(glossary.items[0].entry).toMatchObject({ href: '/glossario#termine:maximum-likelihood-estimation-mle', alsoIn: ['p90-finta-svm'] })
  })

  it('«knn», come lo scrive la banca, trova anche ciò che è scritto «K-NN»', () => {
    const hits = searchAtlas(small, 'knn').groups.flatMap((g) => g.items.map((h) => h.entry.id))
    expect(hits).toContain('formula:m90-finta-parzen:f-knn')
    // e «k-nn» continua a trovarlo
    expect(searchAtlas(small, 'k-nn').groups.flatMap((g) => g.items.map((h) => h.entry.id))).toContain('formula:m90-finta-parzen:f-knn')
  })
})

describe('evidenziazione', () => {
  it('trova i termini nel testo originale ignorando accenti e maiuscole, solo a inizio parola', () => {
    expect(highlightRanges('Densità legittima', ['densita'])).toEqual([[0, 7]])
    expect(highlightRanges('Il kernel e i kernels', ['kernel'])).toEqual([[3, 9], [14, 20]])
    expect(highlightRanges('Sottokernel', ['kernel'])).toEqual([])
  })
})

describe('indice vero', () => {
  it('si costruisce dai fogli pronti del registro e trova il foglio di Parzen con le sue sezioni', async () => {
    const real = await loadSearchIndex()
    expect(real).toBe(await loadSearchIndex())
    const r = searchAtlas(real, 'parzen')
    // il foglio che si chiama Parzen apre la lista, prima delle decine di formule e sezioni che lo nominano
    expect(r.groups[0].type).toBe('foglio')
    expect(r.groups[0].items[0].entry.href).toBe('/m/m09-parzen-windows')
    expect(searchAtlas(real, 'ipercubo').groups.some((g) => g.type === 'sezione')).toBe(true)
    expect(real.stats.totalSheets).toBe(50)
  })
})
