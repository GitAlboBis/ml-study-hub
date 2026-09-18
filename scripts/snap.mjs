// Fotografie delle pagine con Chrome headless, via DevTools Protocol (niente Playwright: il disco è quasi pieno).
// Serve il server di sviluppo acceso (npm run dev).
//
// Uso: node scripts/snap.mjs <percorso o URL> <file.png> [opzioni]
//   --width 1440 --height 900   viewport (mobile: --width 390 --height 844)
//   --dark                      tema notte (data-theme="dark"); senza, tema giorno
//   --full                      tutta la pagina invece del solo primo schermo
//   --wait 2500                 attesa dopo il caricamento, in ms
//   --scroll "<selettore CSS>"  porta l'elemento in cima prima dello scatto (utile per i widget caricati da vicino)
//   --click "<testo esatto>"    preme il pulsante con quel testo o aria-label (ripetibile)
//   --reduced                   prefers-reduced-motion: reduce
//   --eval "<espressione JS>"   la valuta nella pagina prima dello scatto e ne stampa il risultato
// Stampa anche gli errori della console della pagina.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const [target, out, ...rest] = process.argv.slice(2)
if (!target || !out) {
  console.log('Uso: node scripts/snap.mjs <percorso o URL> <file.png> [--width N --height N --dark --full --wait ms --scroll sel --click testo --reduced]')
  process.exit(2)
}
const opt = { width: 1440, height: 900, dark: false, full: false, wait: 2500, scroll: null, click: [], reduced: false, eval: null }
for (let i = 0; i < rest.length; i++) {
  const k = rest[i].replace(/^--/, '')
  if (k === 'dark' || k === 'full' || k === 'reduced') opt[k] = true
  else if (k === 'click') opt.click.push(rest[++i])
  else opt[k] = ['width', 'height', 'wait'].includes(k) ? Number(rest[++i]) : rest[++i]
}
const url = /^https?:/.test(target) ? target : `http://localhost:5173${target.startsWith('/') ? '' : '/'}${target}`

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p))
if (!CHROME) { console.error('Chrome o Edge non trovato'); process.exit(1) }
const port = 9300 + Math.floor(Math.random() * 500)
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'snap-'))
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', '--force-device-scale-factor=1', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const cleanup = () => { try { chrome.kill() } catch { /* già chiuso */ } setTimeout(() => fs.rmSync(profile, { recursive: true, force: true }), 500) }

try {
  let wsUrl
  for (let i = 0; i < 50 && !wsUrl; i++) {
    await sleep(200)
    try { wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page')?.webSocketDebuggerUrl } catch { /* non ancora pronto */ }
  }
  if (!wsUrl) throw new Error('Chrome non risponde sulla porta di debug')
  const ws = new WebSocket(wsUrl)
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j })
  let id = 0
  const pending = new Map()
  const errors = []
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data)
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id) }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 300))
    if (msg.method === 'Runtime.exceptionThrown') errors.push(String(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text).slice(0, 300))
  }
  const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })) })
  const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value

  await send('Runtime.enable')
  await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: opt.width, height: opt.height, deviceScaleFactor: 1, mobile: opt.width < 768 })
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: opt.dark ? 'dark' : 'light' }, { name: 'prefers-reduced-motion', value: opt.reduced ? 'reduce' : 'no-preference' }] })
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `try { localStorage.setItem('ml-study-theme', '${opt.dark ? 'dark' : 'light'}') } catch {}` })
  await send('Page.navigate', { url })
  await sleep(opt.wait)
  if (opt.scroll) {
    await evaluate(`(async () => { const el = document.querySelector(${JSON.stringify(opt.scroll)}); if (el) { el.scrollIntoView({ block: 'start' }); window.scrollBy(0, -80) } return !!el })()`)
    await sleep(1500)
  }
  for (const label of opt.click) {
    const ok = await evaluate(`(() => { const b = [...document.querySelectorAll('button, a, [role=tab]')].find((e) => ((e.getAttribute('aria-label') || e.textContent) || '').trim() === ${JSON.stringify(label)}); if (b) b.click(); return !!b })()`)
    if (!ok) errors.push(`--click: nessun pulsante "${label}"`)
    await sleep(900)
  }
  if (opt.eval) console.log('eval:', JSON.stringify(await evaluate(`(async () => (${opt.eval}))()`)))
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: opt.full })
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true })
  fs.writeFileSync(out, Buffer.from(shot.result.data, 'base64'))
  const info = await evaluate('JSON.stringify({ title: document.title, scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, height: document.documentElement.scrollHeight })')
  console.log(`${out} ${info}`)
  if (errors.length) console.log(`errori in console (${errors.length}):\n  ${errors.slice(0, 10).join('\n  ')}`)
  ws.close()
} catch (e) {
  console.error(String(e))
  process.exitCode = 1
} finally {
  cleanup()
}
