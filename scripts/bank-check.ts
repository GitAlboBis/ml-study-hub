// Gate G7: ogni domanda della banca d'esame (src/content/exam-bank.ts) ha la sua domanda d'orale in un foglio?
// Per ogni domanda della banca cerca, fra i fogli PRONTI (quelli con src/content/modules/<id>/data.ts, come
// hasModule nell'app) indicati in moduleIds, un ExamQuestion con fromBank: true e un bankText che la copre:
// stessi primi 60 caratteri normalizzati, oppure un brano più lungo della fonte che la contiene
// (coversBankQuestion). Se c'è la fonte (_sources/nlm_text/exam_questions.txt, esclusa da git) controlla anche
// che ogni domanda sia verbatim e che nessun pezzo della fonte sia rimasto fuori dalla banca.
//
// Uso: npx tsx scripts/bank-check.ts [--strict] [--root <cartella>]
// Stampa "Domande della banca coperte: X/Y (fogli pronti)" e l'elenco delle mancanti, divise in:
// - da coprire subito: il foglio principale (moduleIds[0]) è pronto ma non ha la domanda → exit 1;
// - coperte in un foglio non indicato: la domanda c'è, ma in un foglio assente da moduleIds (va aggiunto);
// - solo in parte: un foglio indicato ne ha un pezzo (per esempio l'ultima frase);
// - in attesa: nessun foglio indicato è pronto, oppure lo è solo uno secondario.
// Fallisce anche per un bankText che non corrisponde a nessuna domanda della banca (non verbatim) e, con la
// fonte presente, per una domanda non verbatim o per testo della fonte non assegnato. Con --strict fallisce
// finché X < Y (da usare quando tutti i 50 fogli sono pronti).
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { BANK_PARTS, bankKey, coversBankQuestion, examBank, isFragmentOf, normalizeBankText, reportOf } from '../src/content/exam-bank'
import type { BankQuestion } from '../src/content/exam-bank'
import type { ExamQuestion } from '../src/content/types'

interface ManifestEntry { id: string }
interface ReadySheet { id: string; bank: { examId: string; bankText: string }[] }

const MAX_TEXT = 70
const short = (s: string, n = MAX_TEXT) => {
  const t = s.replace(/\s+/g, ' ').trim()
  return t.length > n ? `${t.slice(0, n - 1)}…` : t
}

async function main(): Promise<void> {
  let root = path.resolve(import.meta.dirname, '..')
  let strict = false
  try {
    const { values } = parseArgs({ options: { root: { type: 'string' }, strict: { type: 'boolean' } } })
    if (values.root) root = path.resolve(values.root)
    strict = values.strict ?? false
  } catch {
    console.log('Uso: npx tsx scripts/bank-check.ts [--strict] [--root <cartella>]')
    process.exitCode = 1
    return
  }
  const abs = (...parts: string[]) => path.join(root, ...parts)
  let failed = false

  // --- la banca ---------------------------------------------------------------------------------
  const perPart = BANK_PARTS.map((p) => `${p} ${examBank.filter((q) => q.part === p).length}`).join(', ')
  const reports = new Set(examBank.map((q) => reportOf(q.id))).size
  console.log(`Banca domande d'orale: ${examBank.length} domande (${perPart}) da ${reports} resoconti della fonte`)

  // --- verbatim, se la fonte è sul disco --------------------------------------------------------
  const sourceFile = abs('_sources/nlm_text/exam_questions.txt')
  if (fs.existsSync(sourceFile)) {
    const source = normalizeBankText(fs.readFileSync(sourceFile, 'utf8'))
    const notVerbatim = examBank.filter((q) => !source.includes(normalizeBankText(q.text)))
    let rest = source
    for (const q of examBank) rest = rest.replace(normalizeBankText(q.text), ' ')
    rest = rest
      .replace('questions learning exam', ' ')
      .replace(/the idea behind this document[\s\S]*?good luck to everybody!*/, ' ')
      .replace(/(melgani|passerini|deep learning) part/g, ' ')
      .replace('theory part:', ' ')
      .replace(/(^|\s)\d{1,2}\.(?=\s|$)/g, ' ')
    const leftover = rest.replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
    console.log(`Verbatim: ${examBank.length - notVerbatim.length}/${examBank.length} domande ritrovate nella fonte; testo della fonte non assegnato: ${leftover === '' ? 'nessuno' : `«${short(leftover, 160)}»`}`)
    for (const q of notVerbatim) console.log(`  - ${q.id} non si ritrova nella fonte: "${short(q.text)}"`)
    if (notVerbatim.length > 0 || leftover !== '') failed = true
  } else {
    console.log('Verbatim: fonte non trovata (_sources/nlm_text/exam_questions.txt), controllo saltato')
  }

  // --- fogli pronti -----------------------------------------------------------------------------
  const manifest = JSON.parse(fs.readFileSync(abs('docs/plan/modules.json'), 'utf8')) as ManifestEntry[]
  const withData = manifest.filter((m) => fs.existsSync(abs('src/content/modules', m.id, 'data.ts')))
  const ready: ReadySheet[] = []
  for (const m of withData) {
    try {
      const mod = (await import(pathToFileURL(abs('src/content/modules', m.id, 'data.ts')).href)) as { default?: { exam?: ExamQuestion[] } }
      const exam = mod.default?.exam
      if (!Array.isArray(exam)) throw new Error('export default senza exam')
      ready.push({
        id: m.id,
        bank: exam.flatMap((e) => (e.fromBank && typeof e.bankText === 'string' ? [{ examId: e.id, bankText: e.bankText }] : [])),
      })
    } catch (e) {
      console.log(`  ! ${m.id}: data.ts non si carica, escluso dal conteggio (${e instanceof Error ? short(e.message, 120) : String(e)})`)
    }
  }
  const readyIds = new Set(ready.map((s) => s.id))
  console.log(`Fogli pronti: ${ready.length} di ${manifest.length}${ready.length > 0 ? ` (${ready.map((s) => s.id).join(', ')})` : ''}`)

  // --- copertura --------------------------------------------------------------------------------
  const coveredIn = (q: BankQuestion, sheets: ReadySheet[]) => sheets.filter((s) => s.bank.some((b) => coversBankQuestion(b.bankText, q))).map((s) => s.id)
  const fragmentsIn = (q: BankQuestion, sheets: ReadySheet[]) => sheets.filter((s) => s.bank.some((b) => isFragmentOf(b.bankText, q))).map((s) => s.id)

  type Missing = { q: BankQuestion; line: string }
  const now: Missing[] = []
  const elsewhere: Missing[] = []
  const partial: Missing[] = []
  const waiting: Missing[] = []
  let covered = 0
  const coveredByPart = new Map<string, number>()

  const mods = (q: BankQuestion) => q.moduleIds.map((id) => (readyIds.has(id) ? `${id} (pronto)` : id)).join(', ')

  for (const q of examBank) {
    const listed = ready.filter((s) => q.moduleIds.includes(s.id))
    if (coveredIn(q, listed).length > 0) {
      covered++
      coveredByPart.set(q.part, (coveredByPart.get(q.part) ?? 0) + 1)
      continue
    }
    const head = `${q.id} "${short(q.text)}"`
    const other = coveredIn(q, ready.filter((s) => !q.moduleIds.includes(s.id)))
    const pieces = fragmentsIn(q, listed)
    if (readyIds.has(q.moduleIds[0])) now.push({ q, line: `${head} → foglio principale ${q.moduleIds[0]} pronto senza questa domanda` })
    else if (other.length > 0) elsewhere.push({ q, line: `${head} → c'è in ${other.join(', ')}: aggiungi il foglio a moduleIds in exam-bank.ts` })
    else if (pieces.length > 0) partial.push({ q, line: `${head} → solo in parte (un frammento) in ${pieces.join(', ')}; fogli: ${mods(q)}` })
    else waiting.push({ q, line: `${head} → fogli: ${mods(q)}` })
  }

  console.log('')
  console.log(`Domande della banca coperte: ${covered}/${examBank.length} (fogli pronti)`)
  console.log('  ' + BANK_PARTS.map((p) => `${p} ${coveredByPart.get(p) ?? 0}/${examBank.filter((q) => q.part === p).length}`).join(' · '))

  const missing = examBank.length - covered
  if (missing > 0) {
    console.log(`Mancanti (${missing}):`)
    const group = (title: string, items: Missing[]) => {
      if (items.length === 0) return
      console.log(`  ${title} (${items.length}):`)
      for (const m of items) console.log(`    - ${m.line}`)
    }
    group('Da coprire subito', now)
    group('Coperte in un foglio non indicato', elsewhere)
    group('Coperte solo in parte', partial)
    group('In attesa dei fogli', waiting)
  }
  if (now.length > 0) failed = true

  // --- bankText che non corrispondono a nessuna domanda -----------------------------------------
  const orphans = ready.flatMap((s) =>
    s.bank
      .filter((b) => !examBank.some((q) => coversBankQuestion(b.bankText, q) || isFragmentOf(b.bankText, q)))
      .map((b) => `${s.id} · ${b.examId}: "${short(b.bankText)}" (chiave "${bankKey(b.bankText)}")`),
  )
  if (orphans.length > 0) {
    console.log(`bankText senza riscontro nella banca (${orphans.length}): il testo deve essere verbatim`)
    for (const o of orphans) console.log(`  - ${o}`)
    failed = true
  }

  if (strict && covered < examBank.length) failed = true
  process.exitCode = failed ? 1 : 0
}

await main()
