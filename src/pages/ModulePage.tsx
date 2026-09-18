// Pagina modulo (/m/:moduleId/:tab?): il foglio dell'atlante. Testata con numero, titoli, coordinate e stato
// del rilievo; schede come collegamenti con URL propri (/m/:id/:tab, aria-current sulla scheda aperta); la scheda
// aperta dentro il contesto del modulo, così i componenti di contenuto leggono i dati per id.
// Il loader della rotta garantisce che modulo e scheda esistano nel manifest; qui si carica data.ts, che per i
// fogli non ancora scritti non c'è: allora la pagina mostra testata e fonti dal manifest.
// Le schede sono lazy, un chunk ciascuna; Esercizi, Flashcard, Quiz e Orale le scrive la pratica (Task 5.4-5.6).
import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { ComponentType, LazyExoticComponent, ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { ModuleContext } from '../components/content/ModuleContext'
import { BTN_SECONDARY, HATCH, Icon } from '../components/content/shared'
import { ModuleHeader } from '../components/layout/ModuleHeader'
import { getModuleMeta } from '../content/manifest'
import type { ModuleManifestEntry } from '../content/manifest'
import { hasModule, loadModuleData } from '../content/registry'
import type { ModuleData } from '../content/types'
import { pagesOf, sheetNumber } from '../lib/atlas'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { isModuleTab, MODULE_TABS } from '../router'
import type { ModuleTab } from '../router'
import { SourcePages } from './module/SourcePages'

type TabView = LazyExoticComponent<ComponentType<{ data: ModuleData }>>

const TAB_VIEWS: Record<ModuleTab, TabView> = {
  riassunto: lazy(() => import('./module/TabRiassunto')),
  teoria: lazy(() => import('./module/TabTeoria')),
  formule: lazy(() => import('./module/TabFormule')),
  laboratorio: lazy(() => import('./module/TabLaboratorio')),
  esercizi: lazy(() => import('./module/TabEsercizi')),
  flashcard: lazy(() => import('./module/TabFlashcard')),
  quiz: lazy(() => import('./module/TabQuiz')),
  orale: lazy(() => import('./module/TabOrale')),
  fonti: lazy(() => import('./module/TabFonti')),
}

const TAB_LABELS: Record<ModuleTab, string> = {
  riassunto: 'Riassunto',
  teoria: 'Teoria',
  formule: 'Formule',
  laboratorio: 'Laboratorio',
  esercizi: 'Esercizi',
  flashcard: 'Flashcard',
  quiz: 'Quiz',
  orale: 'Orale',
  fonti: 'Fonti',
}

/** Quanti elementi ha ogni scheda: una cifra accanto al nome, dove ha senso contarli. */
function tabCount(tab: ModuleTab, data: ModuleData): number | null {
  switch (tab) {
    case 'formule':
      return data.formulas.length
    case 'laboratorio':
      return data.widgets.length
    case 'esercizi':
      return data.exercises.length
    case 'flashcard':
      return data.flashcards.length
    case 'quiz':
      return data.quiz.length
    case 'orale':
      return data.exam.length
    case 'fonti':
      return data.sources.reduce((n, r) => n + pagesOf(r).length, 0)
    default:
      return null
  }
}

type DataState = { id: string; status: 'loading' | 'error' | 'missing' } | { id: string; status: 'ready'; data: ModuleData }

/** I dati del foglio; 'missing' senza passare dal caricamento se il modulo non ha ancora data.ts. */
function useModuleData(id: string): [state: DataState, retry: () => void] {
  const [state, setState] = useState<DataState>({ id, status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const exists = hasModule(id)

  useEffect(() => {
    if (!exists) return
    let alive = true
    loadModuleData(id).then(
      (data) => alive && setState({ id, status: 'ready', data }),
      () => alive && setState({ id, status: 'error' }),
    )
    return () => {
      alive = false
    }
  }, [id, exists, attempt])

  const retry = () => {
    setState({ id, status: 'loading' })
    setAttempt((n) => n + 1)
  }
  if (!exists) return [{ id, status: 'missing' }, retry]
  // un attimo dopo il cambio di foglio lo stato è ancora quello del foglio di prima
  return [state.id === id ? state : { id, status: 'loading' }, retry]
}

function TabNav({ data, current }: { data: ModuleData; current: ModuleTab }) {
  const active = useRef<HTMLAnchorElement>(null)
  // su schermi stretti la fila scorre: la scheda aperta resta in vista
  useEffect(() => {
    active.current?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }, [current])

  return (
    <nav aria-label="Schede del foglio" className="mt-6 overflow-x-auto overscroll-x-contain border-b-2 border-border-strong">
      <ul role="list" className="m-0 flex min-w-max list-none p-0">
        {MODULE_TABS.map((tab) => {
          const here = tab === current
          const count = tabCount(tab, data)
          return (
            <li key={tab} className="m-0">
              <Link
                ref={here ? active : undefined}
                to={`/m/${data.id}/${tab}`}
                aria-current={here ? 'page' : undefined}
                className={`label flex min-h-11 items-center gap-2 border-r border-border px-4 no-underline transition-[background-color,color] duration-[var(--dur-fast)] ease-out ${
                  here ? 'bg-pin text-pin-contrast' : 'text-text hover:bg-surface-2'
                }`}
              >
                {TAB_LABELS[tab]}
                {count !== null && <span className={`num tracking-normal ${here ? '' : 'text-muted'}`}>{count}</span>}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** Una scheda che si rompe (o il cui chunk non arriva) resta dentro la sua area, con Riprova. */
class TabBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div role="alert" className="flex flex-wrap items-center gap-3 border border-border-strong bg-error-bg p-4">
        <Icon name="cross" className="text-error" />
        <p className="m-0 min-w-0 flex-1">Questa scheda non si è aperta. Riprova; se non basta, ricarica la pagina.</p>
        <button type="button" className={BTN_SECONDARY} onClick={() => this.setState({ failed: false })}>
          <Icon name="reset" size={18} />
          Riprova
        </button>
      </div>
    )
  }
}

const TabLoading = () => (
  <p role="status" className="label m-0">
    Apro la scheda…
  </p>
)

/** Il foglio non ha ancora data.ts: testata e fonti dal manifest, e l'onestà di dire che il resto arriva. */
function Unsurveyed({ meta }: { meta: ModuleManifestEntry }) {
  return (
    <>
      <div className={`mt-6 grid min-h-40 content-end border border-border-strong p-5 ${HATCH}`}>
        <div className="grid max-w-[var(--measure)] justify-items-start gap-2">
          <p className="label m-0 bg-surface px-1 text-text">Contenuti in arrivo</p>
          <p className="m-0 bg-surface px-1">
            Riassunto, teoria, formule e widget di questo foglio sono in preparazione. Intanto puoi studiare direttamente sulle pagine delle fonti qui sotto.
          </p>
        </div>
      </div>
      <div className="mt-10">
        <SourcePages sources={meta.sources} />
      </div>
    </>
  )
}

export default function ModulePage() {
  const { moduleId = '', tab } = useParams()
  // il loader ha già verificato modulo e scheda: qui il manifest ha sempre la voce
  const meta = getModuleMeta(moduleId) as ModuleManifestEntry
  const current: ModuleTab = tab && isModuleTab(tab) ? tab : 'riassunto'
  const [state, retry] = useModuleData(moduleId)
  const data = state.status === 'ready' ? state.data : undefined
  useDocumentTitle(`Foglio ${sheetNumber(moduleId) ?? ''} · ${data?.title ?? meta.title}`)
  const View = TAB_VIEWS[current]

  return (
    <main className="@container mx-auto max-w-[var(--sheet-max)] px-[var(--sheet-gutter)] pt-6 pb-24">
      <ModuleHeader meta={meta} data={data} />

      {state.status === 'missing' && <Unsurveyed meta={meta} />}
      {state.status === 'loading' && (
        <p role="status" className="label mt-6">
          Apro il foglio…
        </p>
      )}
      {state.status === 'error' && (
        <div role="alert" className="mt-6 flex flex-wrap items-center gap-3 border border-border-strong bg-error-bg p-4">
          <Icon name="cross" className="text-error" />
          <p className="m-0 min-w-0 flex-1">I contenuti di questo foglio non si sono caricati. Riprova; se non basta, ricarica la pagina.</p>
          <button type="button" className={BTN_SECONDARY} onClick={retry}>
            <Icon name="reset" size={18} />
            Riprova
          </button>
        </div>
      )}
      {data && (
        <ModuleContext value={data}>
          <TabNav data={data} current={current} />
          <div className="mt-8">
            <TabBoundary key={current}>
              <Suspense fallback={<TabLoading />}>
                <View data={data} />
              </Suspense>
            </TabBoundary>
          </div>
        </ModuleContext>
      )}
    </main>
  )
}
