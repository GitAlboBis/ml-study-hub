// @vitest-environment node
// Test del gate G7 (scripts/bank-check.ts): lo lancia come processo, come si fa a mano
// (`npx tsx scripts/bank-check.ts`), su un progetto finto in una cartella temporanea. `--root` sposta le letture
// (docs/plan/modules.json, src/content/modules, _sources) su quella cartella; la banca è quella vera del repo.
import { execFile } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { examBank, getBankQuestion } from '../src/content/exam-bank'

const ROOT = path.resolve(import.meta.dirname, '..')
const TSX = path.join(ROOT, 'node_modules/tsx/dist/cli.mjs')
const SCRIPT = path.join(ROOT, 'scripts/bank-check.ts')
const MANIFEST = fs.readFileSync(path.join(ROOT, 'docs/plan/modules.json'), 'utf8')

const text = (id: string) => getBankQuestion(id)!.text

/** Un data.ts minimo: il gate legge solo exam. */
const dataTs = (id: string, bankTexts: string[]) =>
  `export default ${JSON.stringify({
    id,
    exam: [
      ...bankTexts.map((t, i) => ({ id: `b${i + 1}`, fromBank: true, bankText: t })),
      { id: 'libera', fromBank: false },
    ],
  })}\n`

const M09 = ['mel-03', 'mel-10', 'mel-05', 'mel-18'].map(text)

const roots: string[] = []

function makeRoot(modules: Record<string, string>, extra: Record<string, string> = {}): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bank-check-'))
  roots.push(root)
  const write = (rel: string, content: string) => {
    const file = path.join(root, rel)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, content)
  }
  write('package.json', JSON.stringify({ type: 'module' }))
  write('docs/plan/modules.json', MANIFEST)
  for (const [id, content] of Object.entries(modules)) write(`src/content/modules/${id}/data.ts`, content)
  for (const [rel, content] of Object.entries(extra)) write(rel, content)
  return root
}

const children = new Set<ChildProcess>()

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

const check = (modules: Record<string, string>, extra: Record<string, string> = {}, args: string[] = []) => run(['--root', makeRoot(modules, extra), ...args])

afterAll(() => {
  for (const child of children) child.kill()
  for (const root of roots) {
    try {
      fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
    } catch {
      // una cartella temporanea rimasta non fa fallire i test
    }
  }
})

describe('bank-check (gate G7)', () => {
  it('conta le domande coperte dai soli fogli pronti ed elenca le mancanti', async () => {
    const { code, out } = await check({ 'm09-parzen-windows': dataTs('m09-parzen-windows', M09) })
    expect(out).toContain('Domande della banca coperte: 4/88 (fogli pronti)')
    expect(out).toMatch(/Fogli pronti: 1 di 50/)
    expect(out).toMatch(/Melgani 4\/24/)
    expect(out).toMatch(/Mancanti \(84\)/)
    // una mancante in attesa del suo foglio, con il testo verbatim accorciato
    expect(out).toMatch(/mel-01 .*Generalization Error/)
    expect(code).toBe(0)
  })

  it('senza fogli pronti la copertura è 0 e tutte le domande sono in attesa', async () => {
    const { code, out } = await check({})
    expect(out).toContain(`Domande della banca coperte: 0/${examBank.length} (fogli pronti)`)
    expect(code).toBe(0)
  })

  it('una domanda il cui foglio principale è pronto ma non la contiene fa fallire il gate', async () => {
    const { code, out } = await check({ 'm09-parzen-windows': dataTs('m09-parzen-windows', [text('mel-03'), text('mel-05'), text('mel-18')]) })
    expect(out).toContain('Domande della banca coperte: 3/88 (fogli pronti)')
    expect(out).toMatch(/Da coprire subito \(1\)[\s\S]*mel-10/)
    expect(code).toBe(1)
  })

  it('un bankText che non corrisponde a nessuna domanda della banca fa fallire il gate', async () => {
    const { code, out } = await check({ 'm09-parzen-windows': dataTs('m09-parzen-windows', [...M09, 'Parzen: a question that is not in the bank at all, typed from memory']) })
    expect(out).toMatch(/bankText senza riscontro nella banca \(1\)/)
    expect(out).toMatch(/m09-parzen-windows.*not in the bank at all/)
    expect(code).toBe(1)
  })

  it('segnala i frammenti e le domande coperte in un foglio che la banca non indica', async () => {
    const { out } = await check({
      'm09-parzen-windows': dataTs('m09-parzen-windows', M09.slice(0, 3)),
      'm16-mdm-box': dataTs('m16-mdm-box', ['Explain box classifier']),
      'm20-alberi-decisione': dataTs('m20-alberi-decisione', [text('dl-29')]),
    })
    // mel-18: il foglio principale (m08) non è pronto, m16 ha solo l'ultima frase
    expect(out).toMatch(/mel-18 .*solo in parte.*m16-mdm-box/)
    // dl-29 è in m20, che la banca non indica per quella domanda
    expect(out).toMatch(/dl-29 .*m20-alberi-decisione/)
    expect(out).toMatch(/aggiungi/i)
  })

  it('con --strict il gate fallisce finché la copertura non è completa', async () => {
    const { code } = await check({ 'm09-parzen-windows': dataTs('m09-parzen-windows', M09) }, {}, ['--strict'])
    expect(code).toBe(1)
  })

  it('un data.ts che non si carica viene escluso con un avviso', async () => {
    const { out } = await check({ 'm09-parzen-windows': dataTs('m09-parzen-windows', M09), 'm08-non-parametrica-knn': 'export default {\n' })
    expect(out).toMatch(/m08-non-parametrica-knn.*non si carica/)
    expect(out).toContain('Domande della banca coperte: 4/88 (fogli pronti)')
  })

  it('con la fonte presente controlla che ogni domanda sia verbatim e che nessun testo della fonte resti fuori', async () => {
    const source = (extra: string) =>
      [
        'Questions Learning Exam',
        'The idea behind this document is to collect all of the possible questions. With that said, good luck to everybody!!',
        'Melgani part',
        ...examBank.filter((q) => q.part === 'Melgani').map((q) => q.text),
        extra,
        'Passerini part',
        ...examBank.filter((q) => q.part === 'Passerini').map((q) => q.text),
        'Deep Learning part',
        'Theory Part:',
        ...examBank.filter((q) => q.part === 'Deep Learning').map((q, i) => `${i + 1}. ${q.text}`),
        '42.',
      ].join('\n\n')
    const ok = await check({}, { '_sources/nlm_text/exam_questions.txt': source('') })
    expect(ok.out).toMatch(/Verbatim: 88\/88 domande ritrovate nella fonte/)
    expect(ok.out).toMatch(/testo della fonte non assegnato: nessuno/)
    expect(ok.code).toBe(0)
    const lost = await check({}, { '_sources/nlm_text/exam_questions.txt': source('What is a decision tree and how do you prune it?') })
    expect(lost.out).toMatch(/testo della fonte non assegnato.*decision tree/)
    expect(lost.code).toBe(1)
  })
})
