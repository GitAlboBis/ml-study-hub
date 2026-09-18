import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { getModuleMeta } from '../content/manifest'
import { createWidgetRegistry, loadWidget, widgetExists, widgetIds } from './registry'
import { SCENARIO_IDS, WIDGET_SIZES } from './types'
import type { WidgetModule } from './types'

afterEach(cleanup)

// I file veri, letti qui senza passare dal registry: il confronto più sotto ha così un termine indipendente.
const FILES = Object.keys(import.meta.glob('./*/*.widget.tsx')).map((path) => {
  const [, folder, file] = path.split('/')
  const id = file.replace('.widget.tsx', '')
  return { path, folder, id, isPrivate: folder.startsWith('_') || id.startsWith('_') }
})

describe('registry dei widget', () => {
  it('trova per id il widget di prova', () => {
    expect(widgetExists('prova')).toBe(true)
  })

  it('non trova un id che non ha un file', () => {
    expect(widgetExists('inesistente')).toBe(false)
  })

  it('loadWidget restituisce il modulo del widget: meta e componente', async () => {
    const mod = await loadWidget('prova')
    expect(mod?.meta.id).toBe('prova')
    render(createElement(mod!.default))
    expect(screen.getByText('Widget di prova')).toBeInTheDocument()
  })

  it('loadWidget restituisce null per un id che non ha un file', async () => {
    await expect(loadWidget('inesistente')).resolves.toBeNull()
  })

  it('widgetIds non elenca il widget di prova, perché la sua cartella comincia con "_"', () => {
    expect(widgetIds()).not.toContain('prova')
  })

  it('widgetIds elenca tutti e soli i widget pubblici presenti su disco', () => {
    const expected = FILES.filter((f) => !f.isPrivate).map((f) => f.id)
    expect(widgetIds().toSorted()).toEqual(expected.toSorted())
  })

  it('ogni widget presente su disco, anche privato, si trova per id', () => {
    for (const f of FILES) expect(widgetExists(f.id), f.path).toBe(true)
  })
})

describe('createWidgetRegistry', () => {
  const fake = (id: string, moduleId: string) => async (): Promise<WidgetModule> => ({
    meta: { id, moduleId, title: id, concepts: [], scenario: 'fonte', scenarioNote: 'finto', size: 'S' },
    default: () => null,
  })
  const registry = () =>
    createWidgetRegistry({
      './m09-parzen-windows/m09-somma-kernel.widget.tsx': fake('m09-somma-kernel', 'm09-parzen-windows'),
      './m09-parzen-windows/m09_effetto_h.widget.tsx': fake('m09_effetto_h', 'm09-parzen-windows'),
      './m09-parzen-windows/_bozza.widget.tsx': fake('_bozza', 'm09-parzen-windows'),
      './_test/prova.widget.tsx': fake('prova', '_test'),
    })

  it('elenca i widget dei moduli; un "_" in mezzo al nome non li nasconde', () => {
    expect(registry().widgetIds()).toEqual(['m09-somma-kernel', 'm09_effetto_h'])
  })

  it('non elenca un widget il cui id comincia con "_"', () => {
    expect(registry().widgetIds()).not.toContain('_bozza')
  })

  it('non elenca un widget la cui cartella comincia con "_"', () => {
    expect(registry().widgetIds()).not.toContain('prova')
  })

  it('i widget non elencati esistono e si caricano comunque per id', async () => {
    const r = registry()
    for (const id of ['_bozza', 'prova']) {
      expect(r.widgetExists(id), id).toBe(true)
      expect((await r.loadWidget(id))?.meta.id).toBe(id)
    }
  })

  it('due file con lo stesso id sono un errore che nomina entrambi i percorsi', () => {
    const twice = () =>
      createWidgetRegistry({
        './m08-non-parametrica-knn/doppio.widget.tsx': fake('doppio', 'm08-non-parametrica-knn'),
        './m09-parzen-windows/doppio.widget.tsx': fake('doppio', 'm09-parzen-windows'),
      })
    expect(twice).toThrow(/m08-non-parametrica-knn\/doppio\.widget\.tsx.*m09-parzen-windows\/doppio\.widget\.tsx/)
  })
})

// Il contratto di src/widgets/types.ts vale a tempo di compilazione solo se l'autore annota `meta: WidgetMeta`:
// import.meta.glob è un cast. Qui lo si verifica su ogni file, a mano a mano che i widget arrivano.
describe.each(FILES)('contratto del widget $path', ({ folder, id, isPrivate }) => {
  it('esporta un meta completo e coerente con il percorso, più il componente di default', async () => {
    const mod = await loadWidget(id)
    expect(mod).not.toBeNull()
    const { meta } = mod!
    expect(meta.id).toBe(id)
    expect(meta.moduleId).toBe(folder)
    expect(meta.title.trim()).not.toBe('')
    expect(meta.scenarioNote.trim()).not.toBe('')
    expect(SCENARIO_IDS).toContain(meta.scenario)
    expect(WIDGET_SIZES).toContain(meta.size)
    expect(Array.isArray(meta.concepts)).toBe(true)
    for (const c of meta.concepts) expect(typeof c === 'string' && c.trim() !== '', `concetto ${JSON.stringify(c)}`).toBe(true)
    expect(mod!.default).toBeTruthy()
  }, 30_000)

  it.skipIf(isPrivate)('sta nella cartella di un modulo del manifest', () => {
    expect(getModuleMeta(folder), folder).toBeDefined()
  })
})
