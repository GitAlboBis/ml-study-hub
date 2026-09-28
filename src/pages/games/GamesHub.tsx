// Hub dei giochi (/giochi): l'indice delle sette prove sul campo. In testa la cornice con le coordinate del
// campo scelto; poi la barra del campo (regione e foglio, nell'URL: ?corso=…&foglio=…) e l'elenco dei
// giochi come l'indice delle tavole di un atlante: segno, nome IT/EN, meccanica, materiale disponibile.
// Un gioco senza materiale sufficiente nel campo resta nell'elenco, tratteggiato come i fogli in
// preparazione, e dice che cosa gli manca; il collegamento porta comunque alle sue regole.
import { Link, useSearchParams } from 'react-router'
import { HATCH, Icon } from '../../components/content/shared'
import { manifest } from '../../content/manifest'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import { LoadFailures } from '../practice/parts'
import { availability, GAMES } from './catalog'
import type { Availability, GameInfo } from './catalog'
import { GameGlyph, LoadError, LoadingSheets, ScopeBar } from './GameKit'
import { inScope, parseScope, scopeLabel, scopeSearch } from './pool'
import type { GameScope } from './pool'
import { useAllModules } from './useModules'
import { HEAD_READINGS, PAGE_SUBTITLE, PAGE_TITLE, TICKS } from '../global/ui'

const H2 = 'm-0 border-t-2 border-border-strong pt-3 font-label text-[length:var(--step-2)] leading-tight font-bold'


function GameRow({ game, avail, search }: { game: GameInfo; avail: Availability | null; search: string }) {
  const waiting = avail !== null && !avail.playable
  return (
    <li className="m-0 -mt-px">
      <Link
        to={`/giochi/${game.slug}${search}`}
        className="group grid grid-cols-[auto_minmax(0,1fr)] border border-border-strong bg-surface text-text no-underline transition-[background-color] duration-[var(--dur-fast)] ease-out hover:bg-surface-2 @3xl:grid-cols-[auto_minmax(0,1fr)_15rem_auto]"
      >
        <span
          aria-hidden="true"
          className={`relative row-span-2 grid w-18 place-items-center border-r border-border-strong @3xl:row-span-1 @3xl:w-24 ${waiting ? `bg-bg ${HATCH}` : 'bg-surface-2 group-hover:bg-accent group-hover:text-accent-contrast'} transition-[background-color,color] duration-[var(--dur-fast)] ease-out`}
        >
          <GameGlyph slug={game.slug} size={36} />
        </span>
        <span className="grid content-center gap-1 px-4 pt-3 pb-1 @3xl:py-4">
          <span className="font-label text-[length:var(--step-2)] leading-tight font-bold">{game.title}</span>
          <span lang="en" className="text-[length:var(--step--1)] text-muted italic">
            {game.en}
          </span>
          <span className="max-w-[var(--measure)] text-[length:var(--step-0)] leading-snug">{game.lead}</span>
        </span>
        <span className="grid content-center gap-1 px-4 pb-3 @3xl:border-l @3xl:border-border @3xl:py-4">
          {avail === null ? (
            <span className="label">Materiale…</span>
          ) : avail.playable ? (
            <>
              <span className="label">Nel campo</span>
              <span className="text-[length:var(--step-0)] leading-tight">
                <span className="num">{avail.count}</span> {avail.unit}
              </span>
            </>
          ) : (
            <>
              <span className="label flex items-center gap-1.5 text-text">
                <Icon name="tripod" size={16} />
                In attesa di fogli
              </span>
              <span className="text-[length:var(--step--1)] leading-snug text-muted">{avail.reason}</span>
            </>
          )}
        </span>
        <span aria-hidden="true" className="hidden place-items-center px-5 @3xl:grid">
          <Icon name="arrow" className="transition-[translate] duration-[var(--dur-fast)] ease-out group-hover:translate-x-1" />
        </span>
      </Link>
    </li>
  )
}

export default function GamesHub() {
  useDocumentTitle('Giochi')
  const [params, setParams] = useSearchParams()
  const scope = parseScope(params)
  const [state, retry] = useAllModules()
  const modules = state.status === 'ready' ? state.modules : []
  const ready = new Set(modules.map((m) => m.id))
  const scoped = inScope(modules, scope)
  const search = scopeSearch(scope)
  const avails = GAMES.map((g) => (state.status === 'ready' ? availability(g.slug, scoped, scope) : null))
  const open = avails.filter((a) => a?.playable).length

  const setScope = (next: GameScope) => setParams(new URLSearchParams(scopeSearch(next)), { replace: true })

  return (
    <main className="@container mx-auto max-w-[var(--sheet-max)] px-[var(--sheet-gutter)] pt-6 pb-24">
      <header className="border-2 border-border-strong bg-surface">
        <div aria-hidden="true" className="h-2.5 border-b border-border-strong" style={TICKS} />
        <div className="grid items-end gap-6 p-5 @3xl:grid-cols-[minmax(0,1fr)_auto] @3xl:p-8">
          <div className="min-w-0">
            <h1 className="m-0">
              <span className={PAGE_TITLE}>Giochi</span>
              <span className={PAGE_SUBTITLE}>Sette prove sul campo</span>
            </h1>
            <p lang="en" className="m-0 mt-2 text-[length:var(--step-1)] text-muted italic">
              Seven field tests: formulas, proofs, terms and exercises
            </p>
            <p className="m-0 mt-4 max-w-[var(--measure)]">
              Ripassi giocando con il materiale dei fogli: formule da ricordare e completare, dimostrazioni da rimettere in ordine, affermazioni a tempo, termini da
              riconoscere in italiano e in inglese.
            </p>
          </div>
          <dl className={HEAD_READINGS}>
            <dt className="label">Campo</dt>
            <dd className="m-0">{scopeLabel(scope)}</dd>
            <dt className="label">Fogli pronti</dt>
            <dd className="num m-0">{state.status === 'ready' ? `${ready.size} di ${manifest.length}` : '…'}</dd>
            <dt className="label">Giochi aperti</dt>
            <dd className="num m-0">{state.status === 'ready' ? `${open} di ${GAMES.length}` : '…'}</dd>
          </dl>
        </div>
      </header>

      <section aria-labelledby="campo" className="mt-10 grid gap-4">
        <h2 id="campo" className={H2}>
          Dove giochi
        </h2>
        <p className="m-0 max-w-[var(--measure)] text-muted">Scegli una regione o un solo foglio: ogni gioco prende il materiale da lì.</p>
        <ScopeBar scope={scope} onChange={setScope} ready={ready} />
      </section>

      <section aria-labelledby="prove" className="mt-12 grid gap-4">
        <h2 id="prove" className={H2}>
          Le prove
        </h2>
        {state.status === 'loading' && <LoadingSheets />}
        {state.status === 'error' && <LoadError onRetry={retry} />}
        {state.status === 'ready' && <LoadFailures failed={state.failed} effect="i giochi usano gli altri fogli pronti" onRetry={retry} />}
        <ul role="list" aria-label="Giochi" className="m-0 grid list-none p-0 pt-px">
          {GAMES.map((g, i) => (
            <GameRow key={g.slug} game={g} avail={avails[i]} search={search} />
          ))}
        </ul>
      </section>
    </main>
  )
}
