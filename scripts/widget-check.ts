// scripts/widget-check.ts
// Gate G5: ogni widget dell'inventario esiste e si apre. Confronta i file src/widgets/<cartella>/<id>.widget.tsx
// con gli id dei widget di tutti gli inventari (docs/inventory/<modulo>.json) e, con --snap, fotografa
// /lab/<id> per ogni widget di un modulo con scripts/snap.mjs raccogliendo gli errori di console.
//
// Uso: npx tsx scripts/widget-check.ts [prefissi di modulo…] [--root <cartella>] [--json]
//      npx tsx scripts/widget-check.ts <modulo> --snap [--out <cartella>] [--width 390] [--dark] [--wait 3000] [--jobs 2]
// Stampa "Widget implementati: N/M" per modulo e in totale, i file di widget senza voce in nessun inventario
// e i widget che stanno nella cartella di un altro modulo. Con uno o più prefissi (m09, p0) mostra solo quei
// moduli, con l'elenco dei widget che mancano. Esce con 1 se manca un widget (o, con --snap, se un widget dà
// errori di console o non si apre), con 2 per un errore d'uso.
//
// Come nel registry (src/widgets/registry.ts) un widget si trova per id in qualunque cartella, e un "_"
// davanti alla cartella o al nome del file lo rende privato: non conta mai. --snap usa il server di sviluppo
// già acceso sulla porta 5173 (npm run dev) e non ne avvia un altro.
import { execFile } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

interface ManifestEntry { id: string; title: string }

export interface ModuleCount {
  id: string
  /** stato dell'inventario: 'ok', 'primo stadio' (non ancora chiuso), 'illeggibile' */
  inventory: 'ok' | 'primo stadio' | 'illeggibile'
  expected: number
  implemented: number
  missing: string[]
  /** widget di questo inventario il cui file sta nella cartella di un altro modulo: id → cartella */
  elsewhere: Record<string, string>
}

export interface SnapResult {
  /** lo scatto è stato fatto (snap.mjs ha stampato la riga del PNG) */
  shot: boolean
  errors: string[]
  /** lo stato del laboratorio letto nella pagina, se la lettura è riuscita */
  lab: { h1: string | null; alert: string | null; loading: boolean } | null
  /** la pagina scorre in orizzontale alla larghezza dello scatto */
  overflow: boolean
}

// ---------------------------------------------------------------------------------------------------
// Conteggio
// ---------------------------------------------------------------------------------------------------

/** I file dei widget dell'app: id → percorso relativo a src/widgets. Salta i privati, come il registry. */
export function widgetFiles(root: string): Map<string, string> {
  const dir = path.join(root, 'src/widgets')
  const found = new Map<string, string>()
  if (!fs.existsSync(dir)) return found
  for (const folder of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!folder.isDirectory() || folder.name.startsWith('_')) continue
    for (const f of fs.readdirSync(path.join(dir, folder.name))) {
      if (f.endsWith('.widget.tsx') && !f.startsWith('_')) found.set(f.slice(0, -'.widget.tsx'.length), `${folder.name}/${f}`)
    }
  }
  return found
}

function readWidgets(file: string): { ids: string[]; state: ModuleCount['inventory'] } | null {
  if (!fs.existsSync(file)) return null
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as { widgets?: unknown; stages?: Record<string, string> }
    const ids = (Array.isArray(raw.widgets) ? raw.widgets : []).flatMap((w) => (w && typeof w === 'object' && typeof (w as { id?: unknown }).id === 'string' ? [(w as { id: string }).id] : []))
    return { ids: [...new Set(ids)], state: raw.stages?.inventario === 'done' ? 'ok' : 'primo stadio' }
  } catch {
    // un inventario che un altro workflow sta scrivendo in questo momento
    return { ids: [], state: 'illeggibile' }
  }
}

export function countWidgets(root: string) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/plan/modules.json'), 'utf8')) as ManifestEntry[]
  const files = widgetFiles(root)
  const cited = new Set<string>()
  const modules: ModuleCount[] = []
  const withoutInventory: string[] = []
  for (const m of manifest) {
    const inv = readWidgets(path.join(root, 'docs/inventory', `${m.id}.json`))
    if (!inv) {
      withoutInventory.push(m.id)
      continue
    }
    const missing: string[] = []
    const elsewhere: Record<string, string> = {}
    for (const id of inv.ids) {
      cited.add(id)
      const file = files.get(id)
      if (!file) missing.push(id)
      else if (file.split('/')[0] !== m.id) elsewhere[id] = file.split('/')[0]
    }
    modules.push({ id: m.id, inventory: inv.state, expected: inv.ids.length, implemented: inv.ids.length - missing.length, missing, elsewhere })
  }
  const orphans = [...files].filter(([id]) => !cited.has(id)).map(([, file]) => file).sort()
  return { modules, withoutInventory, orphans, files }
}

// ---------------------------------------------------------------------------------------------------
// Fotografie (--snap)
// ---------------------------------------------------------------------------------------------------

/** Letto nella pagina da snap.mjs: il titolo del laboratorio, un avviso di widget fermo, il caricamento ancora in corso. */
const LAB_STATE =
  "({ h1: document.querySelector('main h1')?.textContent ?? null, " +
  "alert: [...document.querySelectorAll('main [role=alert]')].map((e) => e.textContent ?? '').find((t) => /Il widget (si è fermato|non si è caricato)/.test(t)) ?? null, " +
  "loading: (document.querySelector('main')?.textContent ?? '').includes('Carico il widget') })"

/** Legge l'uscita di scripts/snap.mjs: riga del PNG con le misure, "eval: …", "errori in console (N):" e le righe sotto. */
export function parseSnapOutput(out: string): SnapResult {
  const res: SnapResult = { shot: false, errors: [], lab: null, overflow: false }
  const lines = out.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const png = /\.png (\{.*\})\s*$/.exec(line)
    if (png) {
      res.shot = true
      try {
        const info = JSON.parse(png[1]) as { scrollWidth?: number; clientWidth?: number }
        res.overflow = (info.scrollWidth ?? 0) > (info.clientWidth ?? 0)
      } catch {
        // misure illeggibili: lo scatto c'è comunque
      }
    } else if (line.startsWith('eval: ')) {
      try {
        res.lab = JSON.parse(line.slice('eval: '.length))
      } catch {
        res.lab = null
      }
    } else if (/^errori in console \(\d+\):/.test(line)) {
      for (let j = i + 1; j < lines.length && /^\s{2}\S/.test(lines[j]); j++) res.errors.push(lines[j].trim())
    }
  }
  return res
}

function snapOne(root: string, id: string, file: string, opt: { width: number; dark: boolean; wait: number }): Promise<SnapResult> {
  const args = [path.join(root, 'scripts/snap.mjs'), `lab/${id}`, file, '--width', String(opt.width), '--height', String(opt.width < 768 ? 844 : 900), '--wait', String(opt.wait), '--eval', LAB_STATE]
  if (opt.dark) args.push('--dark')
  return new Promise((resolve) => {
    // snap.mjs a volte esce con 1 dopo lo scatto (profilo temporaneo di Chrome ancora bloccato su Windows):
    // conta quello che ha stampato, non il codice d'uscita
    execFile(process.execPath, args, { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 90_000 }, (_error, stdout) => resolve(parseSnapOutput(stdout ?? '')))
  })
}

async function serverUp(): Promise<boolean> {
  try {
    const res = await fetch('http://localhost:5173/', { signal: AbortSignal.timeout(3000) })
    return res.ok
  } catch {
    return false
  }
}

async function snapModules(root: string, targets: ModuleCount[], files: Map<string, string>, opt: { out?: string; width: number; dark: boolean; wait: number; jobs: number }): Promise<boolean> {
  if (!(await serverUp())) {
    console.log('Il server di sviluppo non risponde su http://localhost:5173: va acceso con npm run dev (non lo avvia questo script).')
    return false
  }
  let clean = true
  let consoleErrors = 0
  let stopped = 0
  let unshot = 0
  for (const m of targets) {
    // i widget dell'inventario che hanno un file (dovunque sia), più i file della cartella del modulo senza voce
    const inFolder = [...files].filter(([, f]) => f.startsWith(`${m.id}/`)).map(([id]) => id)
    const fromInventory = (readWidgets(path.join(root, 'docs/inventory', `${m.id}.json`))?.ids ?? []).filter((id) => files.has(id))
    const all = [...new Set([...fromInventory, ...inFolder])]
    const dir = path.resolve(opt.out ? path.join(opt.out, m.id) : path.join(os.tmpdir(), 'widget-check', m.id))
    fs.mkdirSync(dir, { recursive: true })
    console.log(`\nFotografie di ${all.length} widget di ${m.id} (${opt.width} px, ${opt.dark ? 'notte' : 'giorno'}) in ${dir}`)
    const results = new Map<string, SnapResult>()
    let next = 0
    const worker = async () => {
      while (next < all.length) {
        const id = all[next++]
        results.set(id, await snapOne(root, id, path.join(dir, `${id}.png`), opt))
      }
    }
    await Promise.all(Array.from({ length: Math.max(1, Math.min(opt.jobs, all.length)) }, worker))
    // Con più Chrome in parallelo (e altri processi sulla macchina) uno scatto può mancare o arrivare mentre il
    // chunk del widget si sta ancora caricando: quelli si rifanno una volta, uno alla volta, con attesa doppia.
    for (const id of all) {
      const r = results.get(id)!
      if (!r.shot || r.lab?.loading) results.set(id, await snapOne(root, id, path.join(dir, `${id}.png`), { ...opt, wait: opt.wait * 2 }))
    }
    for (const id of all) {
      const r = results.get(id)!
      const problems: string[] = []
      if (!r.shot) {
        problems.push('nessuno scatto (Chrome non è partito o la pagina non si è aperta)')
        unshot++
      }
      // senza la lettura della pagina un OK non vorrebbe dire niente
      if (r.shot && r.lab === null) problems.push('stato del laboratorio illeggibile (la pagina non ha risposto a --eval)')
      if (r.lab?.h1 === 'Widget non trovato') problems.push('il laboratorio non trova il widget')
      if (r.lab?.alert) {
        problems.push(`il laboratorio dice «${r.lab.alert.trim()}»`)
        stopped++
      }
      if (r.lab?.loading) problems.push(`ancora in caricamento dopo ${opt.wait} ms`)
      if (r.errors.length) {
        problems.push(`${r.errors.length} errori in console`)
        consoleErrors += r.errors.length
      }
      if (problems.length) {
        clean = false
        console.log(`  KO  ${id}: ${problems.join('; ')}`)
        for (const e of r.errors.slice(0, 5)) console.log(`        ${e}`)
      } else console.log(`  OK  ${id}${r.overflow ? ' (attenzione: la pagina scorre in orizzontale)' : ''}`)
    }
  }
  console.log(`Errori console: ${consoleErrors} · widget fermi: ${stopped} · senza scatto: ${unshot}`)
  return clean
}

// ---------------------------------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------------------------------

const pct = (n: number, d: number) => (d === 0 ? 100 : n === d ? 100 : Math.floor((100 * n) / d))

// process.exitCode e non process.exit(): su Windows l'uscita immediata può troncare l'output scritto su una pipe.
async function main(): Promise<void> {
  let root = path.resolve(import.meta.dirname, '..')
  let parsed
  try {
    parsed = parseArgs({
      allowPositionals: true,
      options: {
        root: { type: 'string' },
        json: { type: 'boolean' },
        snap: { type: 'boolean' },
        out: { type: 'string' },
        width: { type: 'string' },
        dark: { type: 'boolean' },
        wait: { type: 'string' },
        jobs: { type: 'string' },
      },
    })
  } catch (e) {
    console.log(`${e instanceof Error ? e.message : String(e)}\nUso: npx tsx scripts/widget-check.ts [prefissi di modulo…] [--root <cartella>] [--json] [--snap --out <cartella> --width 390 --dark --wait 3000 --jobs 2]`)
    process.exitCode = 2
    return
  }
  const { values, positionals } = parsed
  if (values.root) root = path.resolve(values.root)
  if (values.snap && positionals.length === 0) {
    console.log('--snap fotografa i widget di un modulo: indicalo, per esempio  npx tsx scripts/widget-check.ts m09 --snap')
    process.exitCode = 2
    return
  }

  const { modules, withoutInventory, orphans, files } = countWidgets(root)
  const chosen = positionals.length ? modules.filter((m) => positionals.some((p) => m.id.startsWith(p))) : modules
  if (positionals.length && chosen.length === 0) {
    console.log(`Nessun modulo con inventario comincia con ${positionals.join(', ')}`)
    process.exitCode = 2
    return
  }
  const implemented = chosen.reduce((a, m) => a + m.implemented, 0)
  const expected = chosen.reduce((a, m) => a + m.expected, 0)

  if (values.json) {
    console.log(JSON.stringify({ total: { implemented, expected }, modules: chosen, withoutInventory, orphans }, null, 2))
  } else {
    const width = Math.max(0, ...chosen.map((m) => m.id.length))
    for (const m of chosen) {
      const note = m.inventory === 'ok' ? '' : m.inventory === 'primo stadio' ? '  (inventario al primo stadio)' : '  (inventario illeggibile: in scrittura?)'
      console.log(`${m.id.padEnd(width)}  ${`${m.implemented}/${m.expected}`.padStart(7)}${note}`)
      // i mancanti si elencano quando servono: modulo scelto a mano, oppure pochi alla fine del lavoro
      if (positionals.length || (m.implemented > 0 && m.missing.length <= 5)) for (const id of m.missing) console.log(`    manca  ${id}`)
      for (const [id, folder] of Object.entries(m.elsewhere)) console.log(`    nota   ${id}: il file sta nella cartella ${folder}`)
    }
    if (!positionals.length && withoutInventory.length) console.log(`Senza inventario: ${withoutInventory.length} ${withoutInventory.length === 1 ? 'modulo' : 'moduli'} (${withoutInventory.join(', ')})`)
    console.log(`Widget implementati: ${implemented}/${expected} (${pct(implemented, expected)}%)`)
    if (!positionals.length && chosen.some((m) => m.missing.length > 5 && m.implemented > 0)) console.log("Per l'elenco dei widget che mancano a un modulo: npx tsx scripts/widget-check.ts <prefisso>, per esempio m03")
    if (orphans.length) {
      console.log(`File di widget senza voce nell'inventario (${orphans.length}):`)
      for (const f of orphans) console.log(`  src/widgets/${f}`)
    }
  }
  let ok = implemented === expected
  if (values.snap) {
    const snapOk = await snapModules(root, chosen, files, {
      out: values.out,
      width: Number(values.width ?? 1440),
      dark: values.dark ?? false,
      wait: Number(values.wait ?? 3000),
      jobs: Number(values.jobs ?? 2),
    })
    ok = ok && snapOk
  }
  if (!ok) process.exitCode = 1
}

// Si esegue solo come script: i test importano parseSnapOutput senza lanciare il conteggio.
const invoked = process.argv[1] ? path.resolve(process.argv[1]) : ''
const self = fileURLToPath(import.meta.url)
if (process.platform === 'win32' ? invoked.toLowerCase() === self.toLowerCase() : invoked === self) await main()
