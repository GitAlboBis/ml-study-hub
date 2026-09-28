import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ModuleManifestEntry } from '../../content/manifest'
import type { ModuleData } from '../../content/types'
import { buildSearchIndex } from '../../lib/search'
import type { AtlasIndex } from '../../lib/search'
import { useProgress } from '../../store/progress'
import { CommandPalette } from './CommandPalette'

// Un atlante finto: un foglio pronto con otto flashcard (un gruppo più lungo di cinque), uno in preparazione.
const SHEETS: ModuleManifestEntry[] = [
  { id: 'm90-finta-parzen', course: 'melgani', chapter: 'Cap. 2', title: 'Finestre di Parzen', titleEn: 'Parzen windows', sources: [] },
  { id: 'm91-finto-bayes', course: 'melgani', chapter: 'Cap. 3', title: 'Classificatore di Bayes', titleEn: 'Bayes classifier', sources: [] },
]

const PARZEN: ModuleData = {
  id: 'm90-finta-parzen', title: 'Finestre di Parzen', titleEn: 'Parzen windows', course: 'melgani', chapter: 'Cap. 2', order: 1,
  sources: [], prerequisites: [], estimatedMinutes: 60, summary: '', keyPoints: [], derivations: [], figures: [], quiz: [], exercises: [],
  connections: [], coverage: {},
  glossary: [{ term: 'Larghezza della finestra', en: 'window width', def: 'Il parametro $h$.' }],
  formulas: [
    {
      id: 'f-c01', name: 'Stima di Parzen', nameEn: 'Parzen estimate', latex: String.raw`\hat{p}(x) = \frac{1}{N h}\sum_k \gamma\left(\frac{x - x_k}{h}\right)`,
      explain: '', symbols: [{ s: 'h', meaning: 'larghezza' }], importance: 3, blanks: [], source: [],
    },
  ],
  flashcards: Array.from({ length: 8 }, (_, i) => ({ id: `fc${i}`, q: `Domanda ${i + 1} sul campione`, a: 'Risposta.', kind: 'definizione' as const })),
  exam: [],
  widgets: [{ id: 'm90-somma-kernel', title: 'La somma dei kernel', concepts: [] }],
}

const INDEX = buildSearchIndex({
  sheets: SHEETS,
  modules: [PARZEN],
  sections: { 'm90-finta-parzen': [{ slug: 'lipercubo-e-la-funzione-finestra', level: 2, title: "L'ipercubo e la funzione finestra" }] },
})

function renderPalette(loadIndex: () => Promise<AtlasIndex> = () => Promise.resolve(INDEX)) {
  const onClose = vi.fn()
  const router = createMemoryRouter(
    [
      { path: '/', element: <CommandPalette onClose={onClose} loadIndex={loadIndex} /> },
      { path: '*', element: <p>Arrivato</p> },
    ],
    { initialEntries: ['/'] },
  )
  render(<RouterProvider router={router} />)
  const at = () => `${router.state.location.pathname}${router.state.location.search}${router.state.location.hash}`
  return { router, onClose, at, user: userEvent.setup() }
}

const field = () => screen.getByRole('combobox', { name: "Cerca nell'atlante" })
const options = () => within(screen.getByRole('listbox')).getAllByRole('option')
const selected = () => options().find((o) => o.getAttribute('aria-selected') === 'true')

beforeEach(() => {
  useProgress.getState().reset()
  localStorage.clear()
})
afterEach(cleanup)

describe('palette di ricerca', () => {
  it('si apre con il fuoco nel campo e, a campo vuoto, propone dove andare', async () => {
    renderPalette()
    expect(screen.getByRole('dialog', { name: "Cerca nell'atlante" })).toBeInTheDocument()
    expect(field()).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent(/formule/)
    expect(within(screen.getByRole('group', { name: 'Vai a' })).getByRole('option', { name: /Formulario/ })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Riprendi' })).toBeNull()
  })

  it('a campo vuoto propone di riprendere dallo spillo', async () => {
    useProgress.getState().markSection('m90-finta-parzen', 'lipercubo-e-la-funzione-finestra')
    const { user, at } = renderPalette()
    const resume = within(screen.getByRole('group', { name: 'Riprendi' })).getByRole('option')
    expect(resume).toHaveAttribute('aria-selected', 'true')
    // appena l'indice è pronto titoli del foglio e della sezione sono quelli veri, non ricavati dallo slug
    expect(await within(resume).findByText("L'ipercubo e la funzione finestra")).toBeInTheDocument()
    expect(resume).toHaveTextContent(/Finestre di Parzen/)
    await user.keyboard('{Enter}')
    expect(at()).toBe('/m/m90-finta-parzen/teoria#lipercubo-e-la-funzione-finestra')
  })

  it('cerca, raggruppa per tipo con il foglio e seleziona il primo risultato', async () => {
    const { user } = renderPalette()
    await user.type(field(), 'parzen')
    expect(await screen.findByRole('group', { name: /Fogli/ })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/risultat.* per «parzen»/))
    expect(screen.getByRole('group', { name: /Formule/ })).toBeInTheDocument()
    const first = options()[0]
    expect(first).toHaveAttribute('aria-selected', 'true')
    expect(first).toHaveTextContent(/Finestre di Parzen/)
    expect(field()).toHaveAttribute('aria-activedescendant', first.id)
    expect(field()).toHaveAttribute('aria-expanded', 'true')
    // ogni risultato dice di che foglio è
    const formula = within(screen.getByRole('group', { name: /Formule/ })).getByRole('option')
    expect(formula).toHaveTextContent(/foglio 01/i)
  })

  it('le frecce scorrono i risultati attraverso i gruppi e girano in cima e in fondo; Invio apre', async () => {
    const { user, onClose, at } = renderPalette()
    await user.type(field(), 'parzen')
    await screen.findByRole('group', { name: /Fogli/ })
    const all = options()
    await user.keyboard('{ArrowDown}')
    expect(selected()).toBe(all[1])
    expect(field()).toHaveAttribute('aria-activedescendant', all[1].id)
    await user.keyboard('{ArrowUp}{ArrowUp}')
    expect(selected()).toBe(all.at(-1))
    await user.keyboard('{ArrowDown}{Enter}')
    expect(at()).toBe('/m/m90-finta-parzen')
    expect(onClose).toHaveBeenCalled()
  })

  it('un clic apre il risultato: la sezione della teoria porta al suo titolo', async () => {
    const { user, at } = renderPalette()
    await user.type(field(), 'ipercubo')
    const section = within(await screen.findByRole('group', { name: /Sezioni/ })).getByRole('option')
    await user.click(section)
    expect(at()).toBe('/m/m90-finta-parzen/teoria#lipercubo-e-la-funzione-finestra')
  })

  it('la formula porta alla sua cornice nella scheda Formule', async () => {
    const { user, at } = renderPalette()
    await user.type(field(), 'stima di parzen')
    await user.click(within(await screen.findByRole('group', { name: /Formule/ })).getByRole('option'))
    expect(at()).toBe('/m/m90-finta-parzen/formule#formula:f-c01')
  })

  it('il widget porta al laboratorio', async () => {
    const { user, at } = renderPalette()
    await user.type(field(), 'somma kernel')
    await user.click(within(await screen.findByRole('group', { name: /Laboratorio/ })).getByRole('option'))
    expect(at()).toBe('/lab/m90-somma-kernel')
  })

  it('un gruppo lungo mostra i primi cinque e si allarga con "Mostra"', async () => {
    const { user } = renderPalette()
    await user.type(field(), 'campione')
    const group = await screen.findByRole('group', { name: /Flashcard/ })
    const more = within(group).getByRole('option', { name: /Mostra altri 3/ })
    expect(within(group).getAllByRole('option')).toHaveLength(6)
    await user.click(more)
    expect(within(screen.getByRole('group', { name: /Flashcard/ })).getAllByRole('option')).toHaveLength(8)
    expect(field()).toHaveFocus()
  })

  it('un foglio in preparazione compare con il suo stato', async () => {
    const { user } = renderPalette()
    await user.type(field(), 'bayes')
    const sheet = within(await screen.findByRole('group', { name: /Fogli/ })).getByRole('option')
    expect(sheet).toHaveTextContent(/Classificatore di Bayes/)
    expect(sheet).toHaveTextContent(/in preparazione/i)
  })

  it('senza risultati lo dice, suggerisce come cercare e propone il glossario', async () => {
    const { user, at } = renderPalette()
    await user.type(field(), 'zzqqxx')
    expect(await screen.findByText(/Nessun risultato per «zzqqxx»/)).toBeInTheDocument()
    expect(screen.getByText(/termine inglese/)).toBeInTheDocument()
    expect(screen.getByText(/1 foglio su 2/)).toBeInTheDocument()
    expect(selected()).toHaveTextContent(/Cerca «zzqqxx» nel glossario/)
    await user.keyboard('{Enter}')
    expect(at()).toBe('/glossario?q=zzqqxx')
  })

  it("mentre l'indice si prepara lo dice", async () => {
    const { user } = renderPalette(() => new Promise<AtlasIndex>(() => {}))
    await user.type(field(), 'parzen')
    // il conteggio si annuncia a scrittura ferma
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/preparo l'indice.*/i))
    expect(screen.getByRole('status')).toHaveTextContent(/parzen/)
  })

  it("se l'indice non si prepara lo dice e lascia il glossario", async () => {
    const { user } = renderPalette(() => Promise.reject(new Error('rete')))
    await user.type(field(), 'parzen')
    expect(await screen.findByText(/Non riesco a preparare l'indice/)).toBeInTheDocument()
    expect(selected()).toHaveTextContent(/nel glossario/)
  })

  it('Esc chiude la palette', async () => {
    const { user, onClose } = renderPalette()
    await user.type(field(), 'parzen')
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('il conteggio annunciato non cambia a ogni lettera: arriva una volta, a scrittura ferma', async () => {
    const { user } = renderPalette()
    // l'indice pronto prima di scrivere, come quando la palette è aperta da un attimo
    await screen.findByRole('option', { name: /Formulario/ })
    const status = screen.getByRole('status')
    const seen: string[] = []
    const observer = new MutationObserver(() => {
      const text = status.textContent ?? ''
      if (seen.at(-1) !== text) seen.push(text)
    })
    observer.observe(status, { childList: true, subtree: true, characterData: true })
    await user.type(field(), 'parzen')
    await waitFor(() => expect(status).toHaveTextContent(/risultat.* per «parzen»/))
    observer.disconnect()
    expect(seen).toHaveLength(1)
  })

  it('i dettagli in inglese hanno lang="en"', async () => {
    const { user } = renderPalette()
    await user.type(field(), 'parzen')
    const formula = within(await screen.findByRole('group', { name: /Formule/ })).getByRole('option')
    expect(within(formula).getByText('Parzen estimate').closest('[lang]')).toHaveAttribute('lang', 'en')
  })

  it('accorda i plurali: «1 altro risultato», «e in 1 altro foglio»', async () => {
    const two: ModuleData = { ...PARZEN, id: 'm91-finto-bayes', title: 'Classificatore di Bayes', flashcards: [], widgets: [], formulas: [] }
    const index = buildSearchIndex({ sheets: SHEETS, modules: [{ ...PARZEN, flashcards: PARZEN.flashcards.slice(0, 6) }, two], sections: {} })
    const { user } = renderPalette(() => Promise.resolve(index))
    await user.type(field(), 'campione')
    expect(await screen.findByRole('option', { name: 'Mostra 1 altro risultato' })).toBeInTheDocument()
    await user.clear(field())
    await user.type(field(), 'window width')
    const term = within(await screen.findByRole('group', { name: /Glossario/ })).getByRole('option')
    expect(term).toHaveAccessibleName(/e in 1 altro foglio/)
    expect(term).not.toHaveAccessibleName(/altri 1/)
  })

  it("l'errore dell'indice parla della ricerca, non della «palette»", async () => {
    const { user } = renderPalette(() => Promise.reject(new Error('rete')))
    await user.type(field(), 'parzen')
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Chiudi la ricerca e riaprila per riprovare.'))
    expect(document.body.textContent).not.toMatch(/palette/i)
  })

  it('il pulsante di chiusura ha un nome e chiude', async () => {
    const { user, onClose } = renderPalette()
    await user.click(screen.getByRole('button', { name: 'Chiudi la ricerca' }))
    expect(onClose).toHaveBeenCalled()
  })
})
