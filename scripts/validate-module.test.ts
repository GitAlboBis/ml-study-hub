// @vitest-environment node
// Test del validatore di modulo (gate G2, G3, G4, G6): lo lancia come processo, come fanno gli agenti
// della Fase 6 (`npx tsx scripts/validate-module.ts <id>`), su un progetto finto in una cartella temporanea.
// `--root` sposta tutte le letture (docs/plan, docs/inventory, src/content/modules, public) su quella cartella:
// il repo vero, e in particolare docs/inventory, non viene mai toccato.
import { execFile } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'

const ROOT = path.resolve(import.meta.dirname, '..')
const TSX = path.join(ROOT, 'node_modules/tsx/dist/cli.mjs')
const SCRIPT = path.join(ROOT, 'scripts/validate-module.ts')
const ID = '_fixture'

// ---------------------------------------------------------------------------------------------------
// Fixture di base: un modulo completo che deve dare PASS. Ogni test ne rompe un pezzo solo.
// ---------------------------------------------------------------------------------------------------

const BANK_TEXT = 'Sample mean: how do you estimate the mean of a Gaussian from N samples, and why is the estimator unbiased?'

const INVENTORY = {
  moduleId: ID,
  title: 'Modulo finto per il validatore',
  concepts: [
    { id: 'c01', name: 'Stima della media dai campioni', nameEn: 'Estimating the mean from samples', kind: 'definizione', sourcePages: [{ doc: 'ch2', page: 1 }], detail: 'La media vera si stima dalle misure.', latex: [] },
    { id: 'c02', name: 'Formula della media campionaria', nameEn: 'Sample mean formula', kind: 'formula', sourcePages: [{ doc: 'ch2', page: 1 }], detail: 'Somma delle misure divisa per N.', latex: ['\\hat{\\mu}=\\frac{1}{N}\\sum_{k=1}^{N}x_k'] },
    { id: 'c03', name: 'Nota storica sulla notazione', nameEn: 'Historical note on notation', kind: 'osservazione', sourcePages: [{ doc: 'ch2', page: 2 }], detail: 'Il cappello indica una stima.', latex: [], noWidgetReason: 'nota storica senza nulla da animare' },
  ],
  derivations: [{ id: 'der01', title: 'Non distorsione della media campionaria', sourcePages: [{ doc: 'ch2', page: 2 }] }],
  workedExamples: [{ id: 'ex01', title: 'Media di cinque salmoni', sourcePages: [{ doc: 'ch2', page: 2 }], concepts: ['c02'] }],
  figures: [{ id: 'fig01', doc: 'ch2', page: 1, description: 'Istogramma delle misure', concepts: ['c01'], importance: 2 }],
  widgets: [{ id: 'fx-media-salmoni', title: 'Media dei salmoni', concepts: ['c01', 'c02'] }],
  exercises: [{ id: 'es01', title: 'Calcolare la media campionaria', type: 'numerico' }],
  examQuestions: [{ text: BANK_TEXT, prof: 'Melgani', concepts: ['c01', 'c02'] }],
}

// data.ts vero: importa da '../../types', usa il tag md e contiene funzioni (exercises.generate).
const DATA_TS = `import { defineModule, md } from '../../types'
import type { ExamQuestion, Exercise, Flashcard, GlossaryEntry, QuizItem } from '../../types'

const pad = (i: number) => String(i + 1).padStart(2, '0')

const glossary: GlossaryEntry[] = Array.from({ length: 10 }, (_, i): GlossaryEntry => ({
  term: 'termine ' + pad(i),
  en: 'term ' + pad(i),
  def: md\`Definizione con $x_{k}$ e un prezzo di 5\\$ che non apre matematica.\`,
}))

const flashcards: Flashcard[] = Array.from({ length: 15 }, (_, i): Flashcard => ({
  id: 'fc' + pad(i),
  q: 'Domanda ' + pad(i) + ': che cosa stima la media campionaria?',
  a: md\`Stima la media vera: $\\hat{\\mu} \\to \\mu$.\`,
  kind: 'definizione',
}))

const quiz: QuizItem[] = [
  { id: 'q01', type: 'tf', q: md\`La media campionaria è non distorta: $E[\\hat{\\mu}] = \\mu$.\`, answer: true, explanation: 'Segue dalla linearità del valore atteso.', difficulty: 1, concepts: ['c02'] },
  { id: 'q02', type: 'mcq', q: 'Quale fattore moltiplica la somma?', options: [md\`$\\frac{1}{N}$\`, md\`$\\frac{1}{N-1}$\`, '1'], answer: 0, explanation: md\`Si divide per $N$.\`, difficulty: 1, concepts: ['c02'] },
  { id: 'q03', type: 'multi', q: 'Che cosa serve per la stima?', options: ['i campioni', 'la media vera', md\`il numero $N$\`], answers: [0, 2], explanation: 'La media vera è proprio ciò che non si conosce.', difficulty: 2, concepts: ['c01'] },
  { id: 'q04', type: 'numeric', q: 'Media di 2, 3 e 4?', answer: 3, tolerance: 0.01, explanation: md\`$9 / 3 = 3$.\`, difficulty: 1, concepts: ['c02'] },
  ...Array.from({ length: 8 }, (_, i): QuizItem => ({
    id: 'q' + pad(i + 4), type: 'tf', q: 'Affermazione ' + pad(i) + ': la stima migliora al crescere di N.', answer: true, explanation: md\`La varianza è $\\sigma^2 / N$.\`, difficulty: 1, concepts: ['c01'],
  })),
]

const exam: ExamQuestion[] = [
  {
    id: 'e01', q: 'Come si stima la media di una gaussiana da N campioni e perché lo stimatore è non distorto?',
    qEn: 'How do you estimate the mean of a Gaussian from N samples, and why is the estimator unbiased?',
    prof: 'Melgani', fromBank: true, bankText: '${BANK_TEXT}',
    answer: md\`Uso $\\hat{\\mu} = \\frac{1}{N}\\sum_k x_k$ e ne calcolo il valore atteso.\`,
    checklist: ['formula della media campionaria', 'ipotesi i.i.d.', 'valore atteso uguale alla media vera'],
    followUps: [{ q: 'E la varianza?', a: md\`Vale $\\sigma^2 / N$.\` }],
  },
  ...Array.from({ length: 4 }, (_, i): ExamQuestion => ({
    id: 'e' + pad(i + 1), q: 'Domanda di riserva ' + pad(i), qEn: 'Backup question ' + pad(i), prof: 'Assistant', fromBank: false,
    answer: 'Risposta di riserva.', checklist: ['punto uno', 'punto due', 'punto tre'], followUps: [],
  })),
]

const exercises: Exercise[] = Array.from({ length: 3 }, (_, i): Exercise => ({
  id: 'es' + pad(i), title: 'Media di alcune misure ' + pad(i), difficulty: 1, kind: 'numerico', concepts: ['c02'],
  generate: (rng) => {
    const n = 4 + i
    const xs = Array.from({ length: n }, () => rng.int(1, 9))
    const mean = xs.reduce((s, x) => s + x, 0) / n
    return {
      prompt: 'Calcola la media campionaria di ' + xs.join(', ') + md\`, cioè $\\hat{\\mu}$.\`,
      answers: [{ label: 'media', value: mean, tolerance: 0.01 }],
      solution: md\`$\\hat{\\mu} = \` + mean.toFixed(2) + '$',
    }
  },
}))

export default defineModule({
  id: '_fixture',
  title: 'Modulo finto per il validatore',
  titleEn: 'Validator fixture module',
  course: 'melgani',
  chapter: 'Cap. 2 · Statistical Estimation Theory',
  order: 0,
  sources: [{ doc: 'ch2', pages: [1, 2] }],
  prerequisites: [],
  estimatedMinutes: 5,
  summary: md\`La media campionaria $\\hat{\\mu}$ stima la media vera $\\mu$ della luminosità dei salmoni.\`,
  keyPoints: [md\`$\\hat{\\mu}$ è non distorta.\`, 'Serve un campione i.i.d.', 'Nel codice \`a$b\` il dollaro non apre matematica.'],
  glossary,
  formulas: [
    {
      id: 'f-media', name: 'Media campionaria', nameEn: 'Sample mean',
      latex: md\`\\hat{\\mu} = \\frac{1}{N}\\sum_{k=1}^{N} x_k\`,
      explain: md\`Somma delle $N$ misure divisa per $N$.\`,
      symbols: [{ s: md\`\\hat{\\mu}\`, meaning: 'stima della media' }, { s: 'N', meaning: 'numero di campioni' }],
      importance: 3,
      blanks: [{ masked: md\`\\hat{\\mu} = \\boxed{\\;?\\;}\\sum_{k=1}^{N} x_k\`, answer: md\`\\frac{1}{N}\`, distractors: [md\`\\frac{1}{N-1}\`, 'N'] }],
      source: [{ doc: 'ch2', page: 1 }],
    },
  ],
  derivations: [
    {
      id: 'der01', title: 'Non distorsione della media campionaria',
      goal: md\`Mostrare che $E[\\hat{\\mu}] = \\mu$.\`,
      steps: [
        { latex: md\`E[\\hat{\\mu}] = E\\left[\\frac{1}{N}\\sum_{k=1}^{N} x_k\\right]\`, why: 'Definizione dello stimatore.' },
        { latex: md\`= \\frac{1}{N}\\sum_{k=1}^{N} E[x_k]\`, why: 'Linearità del valore atteso.' },
        { latex: md\`= \\frac{1}{N} N \\mu = \\mu\`, why: md\`Ogni campione ha media $\\mu$.\` },
      ],
      conclusion: 'Lo stimatore è non distorto.',
      source: [{ doc: 'ch2', page: 2 }],
    },
  ],
  figures: [{ id: 'fig01', file: 'figures/_fixture/fig01.webp', caption: md\`Istogramma delle misure con $\\hat{\\mu}$ in evidenza.\`, alt: 'Istogramma delle misure', source: { doc: 'ch2', page: 1 } }],
  flashcards,
  quiz,
  exam,
  exercises,
  widgets: [{ id: 'fx-media-salmoni', title: 'Media dei salmoni', concepts: ['c01', 'c02'] }],
  connections: [{ to: 'm05-max-likelihood', why: 'La media campionaria è la stima ML della media.' }],
  coverage: {
    c01: ['#stima-della-media', 'widget:fx-media-salmoni', 'figure:fig01', 'flashcard:fc01'],
    c02: ['example:ex01', 'formula:f-media', 'derivation:der01', 'widget:fx-media-salmoni', 'quiz:q01', 'exam:e01', 'exercise:es01'],
    c03: ['#nota-storica', 'seeAlso:m05-max-likelihood#notazione'],
  },
})
`

const INDEX_MDX = `# Modulo finto

## Panoramica

La media campionaria $\\hat{\\mu}$ stima la media vera $\\mu$ della luminosità dei salmoni.

<Definition term="media campionaria" en="sample mean">Somma delle misure divisa per $N$.</Definition>

## Stima della media

<Formula id="f-media" />

$$
\\hat{\\mu} = \\frac{1}{N}\\sum_{k=1}^{N} x_k
$$

<Widget id="fx-media-salmoni" />

<Figure id="fig01" />

<Example id="ex01" title="Media di cinque salmoni">
  <Step title="Somma">$2 + 4 + 6 + 8 + 10 = 30$</Step>
  <Step title="Divisione">$\\hat{\\mu} = 30 / 5 = 6$</Step>
</Example>

<Derivation id="der01" />

<Check id="q01" />

### Nota storica

<Callout kind="nota">Il cappello indica una stima. <SourceRef doc="ch2" page={2} /></Callout>

Vedi anche <ModLink to="m05-max-likelihood#notazione">la stima a massima verosimiglianza</ModLink>.
`

const MODULES = [
  { id: ID, course: 'melgani', chapter: 'Cap. 2', title: 'Modulo finto', titleEn: 'Fixture', sources: [{ doc: 'ch2', pages: [1, 2] }] },
  { id: 'm05-max-likelihood', course: 'melgani', chapter: 'Cap. 2', title: 'Massima verosimiglianza', titleEn: 'Maximum likelihood', sources: [{ doc: 'ch2', pages: [3, 9] }] },
]

/** Sostituzione che fallisce se il pezzo da rompere non c'è: una mutazione a vuoto darebbe un test finto. */
function swap(src: string, from: string, to: string): string {
  if (!src.includes(from)) throw new Error(`fixture: "${from}" non trovato`)
  return src.replace(from, () => to)
}

interface Variant {
  data?: string
  mdx?: string
  /** null = nessun file di inventario */
  inventory?: object | null
  /** false = il file della figura non esiste */
  figure?: boolean
  /** altri file del progetto finto: percorso relativo -> contenuto */
  extra?: Record<string, string>
}

const roots: string[] = []

function makeRoot(v: Variant = {}): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-module-'))
  roots.push(root)
  const write = (rel: string, content: string | Uint8Array) => {
    const file = path.join(root, rel)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, content)
  }
  // come nel repo vero: i .ts sono moduli ES
  write('package.json', JSON.stringify({ type: 'module' }))
  write('docs/plan/modules.json', JSON.stringify(MODULES))
  // '../../types' di data.ts arriva al contratto vero del repo
  write('src/content/types.ts', `export * from ${JSON.stringify(pathToFileURL(path.join(ROOT, 'src/content/types.ts')).href)}\n`)
  write(`src/content/modules/${ID}/data.ts`, v.data ?? DATA_TS)
  write(`src/content/modules/${ID}/index.mdx`, v.mdx ?? INDEX_MDX)
  if (v.inventory !== null) write(`docs/inventory/${ID}.json`, JSON.stringify(v.inventory ?? INVENTORY, null, 2))
  if (v.figure !== false) write(`public/figures/${ID}/fig01.webp`, new Uint8Array([0x52, 0x49, 0x46, 0x46]))
  for (const [rel, content] of Object.entries(v.extra ?? {})) write(rel, content)
  return root
}

const children = new Set<ChildProcess>()

/** Lancia il validatore come fanno gli agenti: node + tsx + script (npx.cmd su Windows vorrebbe una shell). */
function run(args: string[]): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    const child = execFile(process.execPath, [TSX, SCRIPT, ...args], { cwd: ROOT, encoding: 'utf8', windowsHide: true, timeout: 120_000 }, (error, stdout, stderr) => {
      children.delete(child)
      const code = error ? (typeof error.code === 'number' ? error.code : 1) : 0
      resolve({ code, out: stdout + stderr })
    })
    children.add(child)
  })
}

const validate = (v: Variant = {}) => run([ID, '--root', makeRoot(v)])

// Pulizia garantita: afterAll gira anche quando un test fallisce o va in timeout.
// Un validatore ancora vivo terrebbe aperti i file (su Windows la cartella non si cancella): prima lo si ferma.
afterAll(() => {
  for (const child of children) child.kill()
  const stuck: string[] = []
  for (const root of roots) {
    try {
      fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
    } catch {
      stuck.push(root)
    }
  }
  if (stuck.length) throw new Error('fixture temporanee non rimosse: ' + stuck.join(', '))
})

describe.concurrent('validate-module (CLI)', { timeout: 180_000 }, () => {
  it('PASS quando il modulo è completo', async () => {
    const r = await validate()
    expect(r.out).toContain(`PASS ${ID}: 3 concetti coperti, 1 formule, 1 derivazioni, 1 widget, 15 flashcard, 12 quiz, 5 domande, 3 esercizi`)
    expect(r.out).not.toContain('FAIL')
    expect(r.out).not.toContain('avviso')
    expect(r.code).toBe(0)
  })

  it('FAIL leggibile quando un concetto non è coperto (G2)', async () => {
    const r = await validate({ data: swap(DATA_TS, "    c02: ['example:ex01',", "    c02x: ['example:ex01',") })
    expect(r.out).toContain(`FAIL ${ID}`)
    expect(r.out).toContain('copertura: concetto c02 "Formula della media campionaria" non mappato')
    // la chiave sbagliata viene nominata, così l'autore vede il refuso
    expect(r.out).toContain('copertura: chiave "c02x" non è un concetto dell\'inventario')
    expect(r.out).not.toMatch(/\n\s+at .+:\d+:\d+/) // niente stack trace
    expect(r.code).toBe(1)
  })

  it('FAIL se un concetto formula non ha Formula né Derivation, o un concetto non ha teoria o widget (G2)', async () => {
    const r = await validate({
      data: swap(
        swap(DATA_TS, "c02: ['example:ex01', 'formula:f-media', 'derivation:der01', 'widget:fx-media-salmoni',", "c02: ['example:ex01', 'widget:fx-media-salmoni',"),
        "c01: ['#stima-della-media', 'widget:fx-media-salmoni',",
        'c01: [',
      ),
    })
    expect(r.out).toContain('copertura: formula c02 "Formula della media campionaria" senza Formula o Derivation')
    expect(r.out).toContain('copertura: c01 "Stima della media dai campioni" non ha una sezione di teoria')
    expect(r.out).toContain('copertura: c01 "Stima della media dai campioni" non ha un widget')
    expect(r.code).toBe(1)
  })

  it('FAIL per LaTeX rotto in una formula (G3)', async () => {
    const r = await validate({ data: swap(DATA_TS, 'latex: md`\\hat{\\mu} = \\frac{1}{N}\\sum_{k=1}^{N} x_k`', 'latex: md`\\hat{\\mu} = \\frac{1}{N`') })
    expect(r.out).toContain(`FAIL ${ID}: 1 errori`)
    expect(r.out).toContain('formula f-media: KaTeX -> ')
    expect(r.code).toBe(1)
  })

  it('FAIL per LaTeX rotto dentro un Rich (G3)', async () => {
    const r = await validate({ data: swap(DATA_TS, 'a: md`Stima la media vera: $\\hat{\\mu} \\to \\mu$.`', 'a: md`Stima la media vera: $\\hat{\\mu \\to \\mu$.`') })
    expect(r.out).toContain(`FAIL ${ID}`)
    expect(r.out).toContain('flashcard fc01.a: KaTeX -> ')
    expect(r.out).toContain('flashcard fc15.a: KaTeX -> ')
    expect(r.code).toBe(1)
  })

  it('FAIL per un $ spaiato in un Rich, ma non per \\$ o per il codice', async () => {
    const r = await validate({ data: swap(DATA_TS, "conclusion: 'Lo stimatore è non distorto.'", "conclusion: 'Lo stimatore $E[x] è non distorto.'") })
    expect(r.out).toContain(`FAIL ${ID}: 1 errori`)
    expect(r.out).toContain('derivation der01.conclusion: $ spaiato')
    expect(r.code).toBe(1)
  })

  it('FAIL per un componente MDX non ammesso', async () => {
    const r = await validate({ mdx: swap(INDEX_MDX, '<Check id="q01" />', '<Check id="q01" />\n\n<Tabs items="a,b" />\n\nTesto con <span>HTML</span> in linea.') })
    expect(r.out).toContain(`FAIL ${ID}: 2 errori`)
    expect(r.out).toMatch(/MDX riga 30: componente non ammesso <Tabs>/)
    expect(r.out).toMatch(/MDX riga 32: elemento HTML <span> non ammesso/)
    expect(r.code).toBe(1)
  })

  it('FAIL per <Formula id> inesistente e per attributi obbligatori mancanti', async () => {
    const r = await validate({
      mdx: swap(swap(INDEX_MDX, '<Formula id="f-media" />', '<Formula id="f-inesistente" />'), '<Callout kind="nota">', '<Callout>'),
    })
    expect(r.out).toContain(`FAIL ${ID}: 2 errori`)
    expect(r.out).toMatch(/MDX riga \d+: <Formula id="f-inesistente"> non esiste in data\.ts/)
    expect(r.out).toMatch(/MDX riga \d+: <Callout> senza attributo kind/)
    expect(r.code).toBe(1)
  })

  it('FAIL per una destinazione di copertura inesistente (G2)', async () => {
    const r = await validate({
      data: swap(DATA_TS, "c01: ['#stima-della-media', 'widget:fx-media-salmoni',", "c01: ['#stima-della-media', 'widget:fx-media-salmoni', 'widget:w-inesistente', '#titolo-che-non-esiste', 'seeAlso:m77-inesistente#x', 'seeAlso:_fixture#panoramica', 'boh', '#dettaglio-tecnico',"),
      mdx: INDEX_MDX + '\n#### Dettaglio tecnico\n\nTesto.\n',
    })
    expect(r.out).toContain(`FAIL ${ID}: 6 errori`)
    expect(r.out).toContain('copertura: c01 -> destinazione inesistente widget:w-inesistente')
    expect(r.out).toContain('copertura: c01 -> destinazione inesistente #titolo-che-non-esiste')
    expect(r.out).toContain('copertura: c01 -> destinazione inesistente seeAlso:m77-inesistente#x')
    expect(r.out).toContain('copertura: c01 -> destinazione inesistente seeAlso:_fixture#panoramica (seeAlso rimanda a un altro modulo')
    expect(r.out).toContain('copertura: c01 -> destinazione inesistente boh')
    // il titolo c'è, ma è di livello 4: l'indice della pagina arriva fino al livello 3
    expect(r.out).toContain('copertura: c01 -> destinazione inesistente #dettaglio-tecnico (titolo di livello 4 o più')
    expect(r.code).toBe(1)
  })

  it('FAIL per ancore interne che non portano a nessun titolo', async () => {
    const r = await validate({
      mdx: INDEX_MDX + '\nTorna alla [stima](#stima-della-media), non alla [sezione fantasma](#fantasma) né <ModLink to="_fixture#altro-fantasma">qui</ModLink>.\n',
    })
    expect(r.out).toContain(`FAIL ${ID}: 2 errori`)
    expect(r.out).toContain('MDX riga 36: link #fantasma: nessun titolo con slug "fantasma" in questo modulo')
    expect(r.out).toContain('MDX riga 36: ModLink _fixture#altro-fantasma: nessun titolo con slug "altro-fantasma" in questo modulo')
    expect(r.code).toBe(1)
  })

  it('FAIL per codici interni visibili allo studente; i rimandi [nome](#derivation:der01) valgono solo verso elementi esistenti', async () => {
    const r = await validate({
      data: swap(DATA_TS, 'def: md`Definizione con', 'def: md`Come in der01, vedi [la dimostrazione](#derivation:der01) e [niente](#formula:f-c99). Definizione con'),
      mdx: INDEX_MDX + '\nLa figura fig01 lo mostra; la [dimostrazione](#derivation:der01) no.\n',
    })
    expect(r.out).toContain(`FAIL ${ID}`)
    expect(r.out).toMatch(/glossary\[0\]: codice interno visibile allo studente \(der01\)/)
    expect(r.out).toContain('rimando a "formula:f-c99", che non esiste in questo modulo')
    expect(r.out).toMatch(/MDX riga \d+: codice interno visibile allo studente \(fig01\)/)
    expect(r.out).not.toContain('derivation:der01", che non esiste')
    expect(r.code).toBe(1)
  })

  it('ancore verso altri moduli: avviso, non errore, e solo se l\'altro modulo è già scritto', async () => {
    const other = 'src/content/modules/m05-max-likelihood/index.mdx'
    const presente = await validate({ extra: { [other]: '# Massima verosimiglianza\n\n## Notazione\n\nTesto.\n' } })
    expect(presente.out).toContain(`PASS ${ID}`)
    expect(presente.out).not.toContain('avviso')
    expect(presente.code).toBe(0)

    const assente = await validate({ extra: { [other]: '# Massima verosimiglianza\n\n## Un altro titolo\n\nTesto.\n' } })
    expect(assente.out).toContain(`PASS ${ID}`)
    expect(assente.out).toContain('! avviso: copertura: c03 -> seeAlso:m05-max-likelihood#notazione: il modulo m05-max-likelihood non ha un titolo con slug "notazione"')
    expect(assente.out).toContain('! avviso: MDX riga 34: ModLink m05-max-likelihood#notazione: il modulo m05-max-likelihood non ha un titolo con slug "notazione"')
    expect(assente.code).toBe(0)
  })

  it('FAIL per dati fuori contratto: id duplicati, quiz fuori range, blank senza \\boxed, fonti non valide, esercizio non deterministico', async () => {
    let data = swap(DATA_TS, "{ id: 'q03', type: 'multi'", "{ id: 'q04', type: 'multi'")
    data = swap(data, "'1'], answer: 0,", "'1'], answer: 3,")
    data = swap(data, '\\boxed{\\;?\\;}', '?')
    data = swap(data, "source: [{ doc: 'ch2', page: 1 }],", 'source: [],')
    data = swap(data, "source: [{ doc: 'ch2', page: 2 }],", "source: [{ doc: 'cap2' as 'ch2', page: 2 }],")
    data = swap(data, 'rng.int(1, 9)', 'Math.floor(Math.random() * 1e9)')
    const r = await validate({ data })
    expect(r.out).toContain(`FAIL ${ID}: 8 errori`)
    expect(r.out).toContain('quiz: id duplicato q04')
    expect(r.out).toContain('quiz q02: answer fuori range')
    expect(r.out).toContain('formula f-media.blanks[0].masked: manca \\boxed{\\;?\\;} al posto della risposta')
    expect(r.out).toContain('formula f-media: source vuoto, serve almeno una pagina sorgente')
    expect(r.out).toContain('derivation der01.source[0]: pagina sorgente non valida {"doc":"cap2","page":2}')
    for (const ex of ['es01', 'es02', 'es03']) expect(r.out).toContain(`exercise ${ex} [seed 1, 2, 3, 4, 5 e altri 15]: stesso seed, istanze diverse`)
    expect(r.code).toBe(1)
  })

  it('FAIL per una domanda della banca non inclusa (G4)', async () => {
    const r = await validate({ data: swap(DATA_TS, `bankText: '${BANK_TEXT}'`, "bankText: 'Un altro testo che non viene dalla banca'") })
    expect(r.out).toContain(`FAIL ${ID}: 1 errori`)
    expect(r.out).toContain(`banca: domanda non inclusa -> "${BANK_TEXT.slice(0, 60)}`)
    expect(r.code).toBe(1)
  })

  it('elenca insieme difetti diversi: figura mancante (G6), soglie di pratica (G4), esercizio che lancia, LaTeX rotto nel MDX', async () => {
    const r = await validate({
      figure: false,
      data: swap(swap(DATA_TS, 'Array.from({ length: 15 }, (_, i): Flashcard', 'Array.from({ length: 14 }, (_, i): Flashcard'), 'const n = 4 + i\n', "const n = 4 + i\n    if (i === 0 && rng.int(0, 1) === 1) throw new Error('divisione per zero')\n"),
      mdx: swap(INDEX_MDX, '$2 + 4 + 6 + 8 + 10 = 30$', '$\\frac{30}{$'),
    })
    expect(r.out).toContain(`FAIL ${ID}: 4 errori`)
    expect(r.out).toContain('figure fig01: file mancante public/figures/_fixture/fig01.webp')
    expect(r.out).toContain('pratica: flashcards 14 < 15')
    expect(r.out).toMatch(/exercise es01 \[seed [^\]]+\]: eccezione -> divisione per zero/)
    expect(r.out).toMatch(/MDX riga 22: KaTeX -> /)
    expect(r.code).toBe(1)
  })

  it('FAIL leggibile se il MDX non compila', async () => {
    // tag rimasto aperto: un errore solo, senza la cascata di "destinazione inesistente" per titoli ed esempi
    const aperto = await validate({ mdx: swap(INDEX_MDX, '</Example>', '') })
    expect(aperto.out).toContain(`FAIL ${ID}: 1 errori`)
    expect(aperto.out).toContain('MDX non compila: Expected a closing tag for `<Example>` (21:1-21:52)')
    expect(aperto.out).not.toMatch(/\n\s+at .+:\d+:\d+/)
    expect(aperto.code).toBe(1)

    // graffa fuori dalla matematica: MDX la legge come espressione JavaScript
    const graffa = await validate({ mdx: swap(INDEX_MDX, 'Il cappello indica una stima.', 'Il cappello {indica una stima.') })
    expect(graffa.out).toContain(`FAIL ${ID}: 1 errori`)
    expect(graffa.out).toMatch(/MDX non compila \(riga 32, colonna \d+\): /)
    expect(graffa.code).toBe(1)
  })

  it('FAIL leggibile se data.ts non si carica', async () => {
    const r = await validate({ data: swap(DATA_TS, "const pad = (i: number) => String(i + 1).padStart(2, '0')", "const pad = (i: number) => String(i + 1).padStart(2, '0')\nthrow new Error('data.ts esploso')") })
    expect(r.out).toContain(`FAIL ${ID}`)
    expect(r.out).toContain('data.ts non si carica')
    expect(r.out).toContain('data.ts esploso')
    expect(r.code).toBe(1)
  })

  it('un data.ts fuori contratto dà errori leggibili e non ferma gli altri controlli', async () => {
    let data = swap(DATA_TS, '  glossary,\n', '  glossary: undefined as never,\n')
    data = swap(data, "checklist: ['formula della media campionaria', 'ipotesi i.i.d.', 'valore atteso uguale alla media vera'],", 'checklist: undefined as never,')
    data = swap(data, "    c03: ['#nota-storica',", "    c03: ['#nota-fantasma',")
    const r = await validate({ data })
    expect(r.out).toContain(`FAIL ${ID}: 4 errori`)
    expect(r.out).toContain('data.glossary mancante o non array')
    expect(r.out).toMatch(/orale: controllo interrotto da un'eccezione -> .+npx tsc -p tsconfig\.app\.json --noEmit/)
    expect(r.out).toContain('copertura: c03 -> destinazione inesistente #nota-fantasma')
    expect(r.out).toContain('pratica: glossary 0 < 10')
    expect(r.out).not.toMatch(/\n\s+at .+:\d+:\d+/)
    expect(r.code).toBe(1)
  })

  it('FAIL leggibile se manca l\'inventario o il modulo', async () => {
    const senzaInventario = await validate({ inventory: null })
    expect(senzaInventario.out).toContain(`FAIL ${ID}: inventario non trovato: docs/inventory/${ID}.json`)
    expect(senzaInventario.code).toBe(1)

    const senzaModulo = await run(['m05-max-likelihood', '--root', makeRoot()])
    expect(senzaModulo.out).toContain('FAIL m05-max-likelihood: ')
    expect(senzaModulo.out).not.toMatch(/\n\s+at .+:\d+:\d+/)
    expect(senzaModulo.code).toBe(1)
  })

  it('senza id stampa l\'uso ed esce con 1', async () => {
    const r = await run([])
    expect(r.out).toContain('Uso: npx tsx scripts/validate-module.ts <moduleId>')
    expect(r.code).toBe(1)
  })
})
