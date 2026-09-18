// Laboratorio dei widget (/lab/:widgetId): un widget a tutta pagina con i suoi metadati (foglio, concetti,
// scenario, ingombro). Serve a guardarlo da vicino e alle catture di scripts/snap-widget.mjs. /lab/_tavola ha una
// rotta sua (la tavola dei segni). Un id senza file mostra l'elenco dei widget che esistono.
import { Component, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { BTN_SECONDARY, HATCH, Icon } from '../components/content/shared'
import { getModuleMeta } from '../content/manifest'
import { sheetNumber } from '../lib/atlas'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { loadWidget, widgetIds } from '../widgets/registry'
import type { WidgetModule } from '../widgets/types'

type LoadState = { id: string; status: 'loading' | 'missing' | 'error' } | { id: string; status: 'ready'; mod: WidgetModule }

class LabBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div role="alert" className="flex flex-wrap items-center gap-3 border border-border-strong bg-error-bg p-4">
        <Icon name="cross" className="text-error" />
        <p className="m-0 min-w-0 flex-1">Il widget si è fermato per un errore.</p>
        <button type="button" className={BTN_SECONDARY} onClick={() => this.setState({ failed: false })}>
          <Icon name="reset" size={18} />
          Riprova
        </button>
      </div>
    )
  }
}

const SIZE_LABEL = { S: 'S · in colonna con il testo', M: 'M · colonna larga', L: 'L · tutta la larghezza' } as const

function Missing({ id }: { id: string }) {
  useDocumentTitle('Widget non trovato')
  const ids = widgetIds()
  return (
    <main className="mx-auto max-w-[var(--sheet-max)] px-[var(--sheet-gutter)] pt-6 pb-24">
      <div className={`grid min-h-32 content-end border-2 border-border-strong p-5 ${HATCH}`}>
        <h1 className="m-0 justify-self-start bg-surface px-2 font-label text-[length:var(--step-3)] font-bold">Widget non trovato</h1>
      </div>
      <p className="m-0 mt-6 max-w-[var(--measure)] text-muted">
        Nessun widget ha l'id <code>{id}</code>. Controlla il nome nel collegamento, oppure scegli uno dei widget già costruiti.
      </p>
      {ids.length > 0 ? (
        <ul role="list" aria-label="Widget costruiti" className="m-0 mt-4 grid list-none gap-2 p-0">
          {ids.map((w) => (
            <li key={w} className="m-0">
              <Link to={`/lab/${w}`} className="num">
                {w}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 mt-4 text-muted">Non c'è ancora nessun widget costruito.</p>
      )}
    </main>
  )
}

export default function WidgetLab() {
  const { widgetId = '' } = useParams()
  const [state, setState] = useState<LoadState>({ id: widgetId, status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const current: LoadState = state.id === widgetId ? state : { id: widgetId, status: 'loading' }

  useEffect(() => {
    let alive = true
    loadWidget(widgetId).then(
      (mod) => alive && setState(mod ? { id: widgetId, status: 'ready', mod } : { id: widgetId, status: 'missing' }),
      () => alive && setState({ id: widgetId, status: 'error' }),
    )
    return () => {
      alive = false
    }
  }, [widgetId, attempt])

  const title = current.status === 'ready' ? current.mod.meta.title : null
  useDocumentTitle(title ? `Laboratorio · ${title}` : null)

  if (current.status === 'missing') return <Missing id={widgetId} />

  if (current.status !== 'ready') {
    return (
      <main className="mx-auto max-w-[var(--sheet-max)] px-[var(--sheet-gutter)] pt-6 pb-24">
        {current.status === 'loading' ? (
          <p role="status" className={`label m-0 grid min-h-80 place-items-center border border-border ${HATCH}`}>
            <span className="bg-surface px-2 py-1">Carico il widget…</span>
          </p>
        ) : (
          <div role="alert" className="flex flex-wrap items-center gap-3 border border-border-strong bg-error-bg p-4">
            <Icon name="cross" className="text-error" />
            <p className="m-0 min-w-0 flex-1">Il widget non si è caricato. Riprova; se non basta, ricarica la pagina.</p>
            <button
              type="button"
              className={BTN_SECONDARY}
              onClick={() => {
                setState({ id: widgetId, status: 'loading' })
                setAttempt((n) => n + 1)
              }}
            >
              <Icon name="reset" size={18} />
              Riprova
            </button>
          </div>
        )}
      </main>
    )
  }

  const { meta, default: View } = current.mod
  const sheet = getModuleMeta(meta.moduleId)
  return (
    <main className="@container mx-auto max-w-[var(--sheet-max)] px-[var(--sheet-gutter)] pt-6 pb-24">
      <header className="grid gap-5 border-b-2 border-border-strong pb-5 @4xl:grid-cols-[minmax(0,1fr)_auto] @4xl:items-end">
        <div className="min-w-0">
          <h1 className="m-0 font-label text-[length:var(--step-3)] leading-tight font-bold">{meta.title}</h1>
          <p className="m-0 mt-2 max-w-[var(--measure)] text-muted">{meta.scenarioNote}</p>
        </div>
        <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[length:var(--step--1)]">
          <dt className="label">Foglio</dt>
          <dd className="m-0">
            {sheet ? (
              <Link to={`/m/${sheet.id}/laboratorio`}>
                <span className="num">{sheetNumber(sheet.id)}</span> · {sheet.title}
              </Link>
            ) : (
              <span className="num">{meta.moduleId}</span>
            )}
          </dd>
          <dt className="label">Concetti</dt>
          <dd className="num m-0">{meta.concepts.length === 1 ? '1 concetto' : `${meta.concepts.length} concetti`}</dd>
          <dt className="label">Ingombro</dt>
          <dd className="m-0">{SIZE_LABEL[meta.size]}</dd>
        </dl>
      </header>
      <div className="mt-8">
        <LabBoundary key={meta.id}>
          <View />
        </LabBoundary>
      </div>
    </main>
  )
}
