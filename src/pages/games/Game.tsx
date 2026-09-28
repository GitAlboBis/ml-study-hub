// Pagina di un gioco (/giochi/:game): mappa il percorso al gioco giusto, lo carica (un chunk per gioco) e
// gli dà i fogli del campo scelto. Testata con il segno del gioco, il nome IT/EN e le regole; sotto la barra
// del campo e il tavolo di gioco. Se nel campo non c'è abbastanza materiale lo dice, con la via d'uscita.
// Cambiando campo la partita ricomincia (key). Un percorso che non è un gioco ha il suo messaggio.
import { lazy, Suspense } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { HATCH, Icon } from '../../components/content/shared'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import { LoadFailures } from '../practice/parts'
import { availability, GAMES, gameInfo, isGameSlug } from './catalog'
import type { GameSlug } from './catalog'
import { GameGlyph, LoadError, LoadingSheets, NotEnough, ScopeBar } from './GameKit'
import { GAME_COLUMN } from './kit'
import type { GameProps } from './kit'
import { inScope, parseScope, scopeKey, scopeSearch } from './pool'
import type { GameScope } from './pool'
import { useAllModules } from './useModules'
import { PAGE_TITLE } from '../global/ui'

const VIEWS: Record<GameSlug, LazyExoticComponent<ComponentType<GameProps>>> = {
  'formula-match': lazy(() => import('./FormulaMatch')),
  'completa-la-formula': lazy(() => import('./FillFormula')),
  'riordina-la-dimostrazione': lazy(() => import('./ProofOrder')),
  'vero-falso': lazy(() => import('./TrueFalseSprint')),
  'chi-sono': lazy(() => import('./WhoAmI')),
  palestra: lazy(() => import('./ExerciseGym')),
  'smista-i-concetti': lazy(() => import('./ConceptSort')),
}

function UnknownGame() {
  return (
    <main className="@container mx-auto max-w-[var(--sheet-max)] px-[var(--sheet-gutter)] pt-6 pb-24">
      <div className="border-2 border-border-strong bg-surface">
        <div aria-hidden="true" className={`h-3 border-b border-border-strong ${HATCH}`} />
        <div className="grid gap-3 p-6">
          <h1 className="m-0 font-label text-[length:var(--step-3)] leading-tight font-bold">Questo gioco non esiste</h1>
          <p className="m-0">Nell'atlante ci sono sette giochi, e questo indirizzo non porta a nessuno di loro.</p>
          <ul className="m-0 grid gap-1 pl-5">
            {GAMES.map((g) => (
              <li key={g.slug}>
                <Link to={`/giochi/${g.slug}`}>{g.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  )
}

export default function GamePage() {
  const { game } = useParams()
  const [params, setParams] = useSearchParams()
  const [state, retry] = useAllModules()
  const known = isGameSlug(game)
  const info = known ? gameInfo(game) : null
  useDocumentTitle(info ? info.title : 'Gioco non trovato')
  if (!known || !info) return <UnknownGame />

  const scope = parseScope(params)
  const setScope = (next: GameScope) => setParams(new URLSearchParams(scopeSearch(next)), { replace: true })
  const modules = state.status === 'ready' ? state.modules : []
  const scoped = inScope(modules, scope)
  const avail = state.status === 'ready' ? availability(info.slug, scoped, scope) : null
  const View = VIEWS[info.slug]

  return (
    <main className="@container mx-auto max-w-[var(--sheet-max)] px-[var(--sheet-gutter)] pt-6 pb-24">
      <nav aria-label="Percorso" className="mb-4">
        <Link to={`/giochi${scopeSearch(scope)}`} className="label inline-flex min-h-10 items-center gap-2 text-link no-underline hover:underline">
          <Icon name="arrow" size={16} className="rotate-180" />
          Tutti i giochi
        </Link>
      </nav>

      {/* su schermo stretto il segno del gioco fa da fascia sopra il titolo: il nome, alla misura di tutte le testate, ha la riga intera */}
      <header className="grid grid-cols-1 border-2 border-border-strong bg-surface @md:grid-cols-[auto_minmax(0,1fr)]">
        <div aria-hidden="true" className="grid h-16 place-items-center border-b-2 border-border-strong bg-surface-2 @md:h-auto @md:w-18 @md:border-r-2 @md:border-b-0 @3xl:w-28">
          <GameGlyph slug={info.slug} size={44} />
        </div>
        <div className="grid gap-4 p-4 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] @3xl:gap-8 @3xl:p-6">
          <div className="min-w-0">
            <h1 className={`m-0 ${PAGE_TITLE}`}>{info.title}</h1>
            <p lang="en" className="m-0 mt-2 text-[length:var(--step-1)] text-muted italic">
              {info.en}
            </p>
            <p className="m-0 mt-3 max-w-[var(--measure)]">{info.lead}</p>
          </div>
          <div className="border-t border-border pt-3 @3xl:border-t-0 @3xl:border-l @3xl:pt-0 @3xl:pl-6">
            <h2 className="label m-0">Come si gioca</h2>
            <ul className="m-0 mt-2 grid list-none gap-1.5 p-0 text-[length:var(--step--1)]">
              {info.rules.map((r) => (
                <li key={r} className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-2">
                  <span aria-hidden="true" className="mt-[0.45em] size-2 border border-border-strong bg-pin" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      <div className="mt-6">
        <ScopeBar scope={scope} onChange={setScope} ready={new Set(modules.map((m) => m.id))} />
      </div>

      <section aria-label="Tavolo di gioco" className={`${GAME_COLUMN} mt-8 @container`}>
        {state.status === 'loading' && <LoadingSheets />}
        {state.status === 'error' && <LoadError onRetry={retry} />}
        {state.status === 'ready' && (
          <div className="mb-4">
            <LoadFailures failed={state.failed} effect="il gioco usa gli altri fogli pronti" onRetry={retry} />
          </div>
        )}
        {avail && !avail.playable && <NotEnough reason={avail.reason ?? ''} scope={scope} onWiden={setScope} />}
        {avail?.playable && (
          <Suspense fallback={<LoadingSheets />}>
            <View key={scopeKey(scope)} modules={scoped} scope={scope} />
          </Suspense>
        )}
      </section>
    </main>
  )
}
