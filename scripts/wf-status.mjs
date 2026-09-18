// Stato di un workflow dal suo journal.jsonl: node scripts/wf-status.mjs <dir del run>
import fs from 'node:fs'
import path from 'node:path'
const dir = process.argv[2]
const ls = fs.readFileSync(path.join(dir, 'journal.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
const st = new Map()
for (const o of ls) if (o.agentId) { const p = st.get(o.agentId) || {}; st.set(o.agentId, { ...p, label: o.label || p.label, state: o.type, result: o.result || p.result }) }
const by = {}
for (const v of st.values()) (by[v.state] = by[v.state] || []).push(v.label)
for (const [k, v] of Object.entries(by)) console.log(`${k} (${v.length}): ${v.join(', ')}`)
if (process.argv.includes('--results')) for (const v of st.values()) if (v.result) console.log(`\n## ${v.label}\n${JSON.stringify(v.result, null, 1).slice(0, 1800)}`)
