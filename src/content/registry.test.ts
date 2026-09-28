import { cleanup, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { createMemoryRouter, isRouteErrorResponse, matchRoutes, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MODULE_TABS, routes } from '../router'
import { getModuleMeta, manifest, modulesByCourse } from './manifest'
import { hasModule, loadAllModuleData, loadModuleContent, loadModuleData } from './registry'

const COURSES = ['melgani', 'passerini', 'ricci'] as const

describe('manifest', () => {
  it('ha 50 voci con id unici', () => {
    expect(manifest).toHaveLength(50)
    expect(new Set(manifest.map((m) => m.id)).size).toBe(50)
  })

  it('ogni voce ha un course valido e i tre corsi sono tutti presenti', () => {
    for (const m of manifest) expect(COURSES, m.id).toContain(m.course)
    expect(new Set(manifest.map((m) => m.course))).toEqual(new Set(COURSES))
  })

  it('ogni voce ha titoli, capitolo e intervalli di pagina ben formati', () => {
    for (const m of manifest) {
      expect(m.title.trim(), m.id).not.toBe('')
      expect(m.titleEn.trim(), m.id).not.toBe('')
      expect(m.chapter.trim(), m.id).not.toBe('')
      expect(m.sources.length, m.id).toBeGreaterThan(0)
      for (const s of m.sources) {
        expect(s.pages, m.id).toHaveLength(2)
        const [from, to] = s.pages
        expect(Number.isInteger(from) && Number.isInteger(to), m.id).toBe(true)
        expect(from, m.id).toBeGreaterThanOrEqual(1)
        expect(to, m.id).toBeGreaterThanOrEqual(from)
      }
    }
  })

  it('getModuleMeta trova un modulo per id e restituisce undefined se non esiste', () => {
    expect(getModuleMeta('m09-parzen-windows')?.course).toBe('melgani')
    expect(getModuleMeta('inesistente')).toBeUndefined()
  })

  it('modulesByCourse partiziona il manifest mantenendone l\'ordine', () => {
    const parts = COURSES.map((c) => modulesByCourse(c))
    expect(parts.reduce((n, p) => n + p.length, 0)).toBe(50)
    for (const [i, c] of COURSES.entries()) {
      expect(parts[i].length, c).toBeGreaterThan(0)
      expect(parts[i]).toEqual(manifest.filter((m) => m.course === c))
    }
  })
})

describe('registry', () => {
  it('hasModule è falso per un id che non ha una cartella', () => {
    expect(hasModule('inesistente')).toBe(false)
  })

  it('loadModuleData e loadModuleContent rifiutano con un messaggio che nomina il modulo', async () => {
    await expect(loadModuleData('inesistente')).rejects.toThrow(/inesistente/)
    await expect(loadModuleContent('inesistente')).rejects.toThrow(/inesistente/)
  })

  it('loadAllModuleData carica solo moduli del manifest, con id e corso coerenti', async () => {
    const all = await loadAllModuleData()
    expect(all).toHaveLength(manifest.filter((m) => hasModule(m.id)).length)
    expect(new Set(all.map((d) => d.id)).size).toBe(all.length)
    for (const d of all) expect(getModuleMeta(d.id)?.course, d.id).toBe(d.course)
  })
})

describe('rotte', () => {
  // Ogni test delle rotte pretende anche una console pulita: React Router segnala lì le rotte foglia senza
  // elemento e il fallback mancante per le rotte lazy (una volta sola per processo, quindi va colto ovunque).
  const spies = () => [vi.spyOn(console, 'warn').mockImplementation(() => {}), vi.spyOn(console, 'error').mockImplementation(() => {})]
  let consoleSpies: ReturnType<typeof spies> = []
  beforeEach(() => { consoleSpies = spies() })
  afterEach(() => {
    cleanup()
    const calls = consoleSpies.flatMap((spy) => spy.mock.calls)
    consoleSpies.forEach((spy) => spy.mockRestore())
    expect(calls).toEqual([])
  })

  // Le rotte del piano (Task 3.8), con un percorso concreto per ciascuna.
  const PLAN_PATHS: [pattern: string, path: string][] = [
    ['/', '/'],
    ['/mappa', '/mappa'],
    ['/corso/:course', '/corso/melgani'],
    ['/m/:moduleId/:tab?', '/m/m09-parzen-windows'],
    ['/m/:moduleId/:tab?', '/m/m09-parzen-windows/formule'],
    ['/formulario', '/formulario'],
    ['/flashcard', '/flashcard'],
    ['/quiz', '/quiz'],
    ['/orale', '/orale'],
    ['/giochi', '/giochi'],
    ['/giochi/:game', '/giochi/formula-match'],
    ['/glossario', '/glossario'],
    ['/fonti/:doc/:page', '/fonti/ch2/12'],
    ['/lab/:widgetId', '/lab/parzen-kernel'],
    ['/progressi', '/progressi'],
    ['/copertura', '/copertura'],
    ['/impostazioni', '/impostazioni'],
  ]

  const leaf = (path: string) => matchRoutes(routes, path)?.at(-1)

  it.each(PLAN_PATHS)('%s: %s ha una pagina lazy con titolo', (_pattern, path) => {
    const match = leaf(path)
    expect(match?.route.path).not.toBe('*')
    expect(match?.route.lazy).toBeDefined()
    expect((match?.route.handle as { title?: string } | undefined)?.title).toBeTruthy()
  })

  it('estrae i parametri delle rotte dinamiche', () => {
    expect(leaf('/m/m09-parzen-windows/formule')?.params).toMatchObject({ moduleId: 'm09-parzen-windows', tab: 'formule' })
    expect(leaf('/m/m09-parzen-windows')?.params.tab).toBeUndefined()
    expect(leaf('/fonti/ch2/12')?.params).toMatchObject({ doc: 'ch2', page: '12' })
    expect(leaf('/lab/parzen-kernel')?.params).toMatchObject({ widgetId: 'parzen-kernel' })
  })

  it('le schede del modulo sono le nove del piano', () => {
    expect([...MODULE_TABS]).toEqual(['riassunto', 'teoria', 'formule', 'laboratorio', 'esercizi', 'flashcard', 'quiz', 'orale', 'fonti'])
  })

  const settle = async (path: string) => {
    const router = createMemoryRouter(routes, { initialEntries: [path] })
    // le pagine vere (Fase 5) sono chunk più pesanti del segnaposto: con molti test in parallelo serve più di 1 s
    await vi.waitFor(() => expect(router.state.initialized).toBe(true), { timeout: 10_000 })
    return router
  }
  const status = (router: Awaited<ReturnType<typeof settle>>) => {
    const error = Object.values(router.state.errors ?? {})[0]
    return isRouteErrorResponse(error) ? error.status : error === undefined ? 200 : 500
  }

  it.each(['/boh', '/m/inesistente', '/m/m09-parzen-windows/boh', '/corso/boh'])('%s dà 404', async (path) => {
    expect(status(await settle(path))).toBe(404)
  })

  it.each(PLAN_PATHS.map(([, path]) => path))('%s si carica senza errori', async (path) => {
    expect(status(await settle(path))).toBe(200)
  })

  it('un percorso sconosciuto mostra "Pagina non trovata" con il ritorno alla home', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/boh'] })
    render(createElement(RouterProvider, { router }))
    expect((await screen.findByRole('heading', { level: 1 }, { timeout: 10_000 })).textContent).toBe('Pagina non trovata')
    expect(screen.getByRole('link', { name: /home/i }).getAttribute('href')).toBe('/')
  }, 30_000)
})
