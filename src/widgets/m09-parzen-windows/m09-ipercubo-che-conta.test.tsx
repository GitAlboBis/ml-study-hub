import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useProgress } from '../../store/progress'
import {
  CHALLENGE_HINT,
  CHALLENGE_PROMPT,
  SEED_DEFAULT,
  SPOTS,
  TARGET_X,
  TEX_COUNT,
  TEX_GAMMA,
  TEX_MEMBER,
  X_START,
  captionFor,
  centerOf,
  countK,
  hForK,
  salmonSet,
  stepsFor,
  texSample,
} from './ipercubo'
import Widget, { meta } from './m09-ipercubo-che-conta.widget'
import { button, expectRichCompiles, expectTexCompiles, readoutText, stubReducedMotion, valNames } from './parzen-lab-testing'

const points = salmonSet(SEED_DEFAULT)

describe('m09-ipercubo-che-conta: contratto e testi', () => {
  it('meta coerente con il file e con l\'inventario', () => {
    expect(meta.id).toBe('m09-ipercubo-che-conta')
    expect(meta.concepts).toEqual(['c04', 'c05', 'c06', 'c07'])
    expect(meta.scenario).toBe('pesce')
  })

  it('le formule usano la notazione del docente e compilano', () => {
    for (const tex of [TEX_COUNT, TEX_GAMMA, TEX_MEMBER, texSample(1), texSample(2), texSample(3)]) expectTexCompiles(tex)
    expect(TEX_COUNT).toContain(String.raw`K&=\sum_{k=1}^{N}\gamma\left(\frac{\mathbf{x}_k-\mathbf{x}^*}{h}\right)`)
    expect(TEX_COUNT).toContain(String.raw`\hat{p}(\mathbf{x}^*)&=\frac{K}{NV}`)
    expect(TEX_GAMMA).toContain(String.raw`\text{if } \mathbf{x} \text{ belongs to the hypercube}`)
    expect(TEX_MEMBER).toContain(String.raw`\mathbf{x}_k\in R\iff\gamma\left[\frac{\mathbf{x}_k-\mathbf{x}^*}{h}\right]=1`)
    const names = new Set(['h', 'n', 'V', 'K', 'N', 'p', 'k', 'u1', 'u2', 'u3', 'g'])
    for (const tex of [TEX_COUNT, texSample(3)]) for (const v of valNames(tex)) expect(names.has(v), v).toBe(true)
  })

  it('didascalie, sfida e indizio compilano; il racconto ha 7 passi e la scansione dura 250 ms a salmone', () => {
    const steps = stepsFor(40)
    expect(steps).toHaveLength(7)
    expect(steps[1].durationMs).toBe(10_000)
    for (let i = 0; i < steps.length; i++) for (const n of [1, 2, 3] as const) expectRichCompiles(captionFor(i, { K: 6, N: 40, h: '1.5', V: '2.250', p: '0.067', n }))
    expectRichCompiles(CHALLENGE_PROMPT)
    expectRichCompiles(CHALLENGE_HINT)
    expect(captionFor(0, { K: 6, N: 40, h: '1.5', V: '2.250', p: '0.067', n: 2 })).toContain(String.raw`$V = h^n$`)
  })
})

describe('m09-ipercubo-che-conta: il widget', { timeout: 20_000 }, () => {
  beforeEach(() => {
    stubReducedMotion(true)
    useProgress.setState({ challenges: {} })
  })
  afterEach(cleanup)

  const xStar = () => screen.getByRole('slider', { name: /Punto x\*/ })

  it('si apre con il quadrato di lato 1.5 in (5, 5): K = 6, V = 2.250, p̂ = 6/(40 · 2.25)', () => {
    render(<Widget />)
    expect(screen.getByRole('heading', { name: meta.title })).toBeInTheDocument()
    expect(document.querySelectorAll('[data-point]')).toHaveLength(40)
    expect(document.querySelectorAll('[data-point="in"]')).toHaveLength(6)
    expect(readoutText('Dentro l\'ipercubo')).toBe('6')
    expect(readoutText('Volume')).toBe('2.250')
    expect(readoutText('Stima in x*')).toBe((6 / 90).toFixed(4))
  })

  it('n = 1 e n = 3 cambiano volume e conteggio', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    const group = screen.getByRole('radiogroup', { name: /Dimensione/ })
    await user.click(within(group).getByRole('radio', { name: 'n = 1' }))
    expect(readoutText('Volume')).toBe('1.500')
    expect(readoutText('Dentro l\'ipercubo')).toBe(String(countK(points, centerOf(X_START, 1), 1.5)))
    await user.click(within(group).getByRole('radio', { name: 'n = 3' }))
    expect(readoutText('Volume')).toBe('3.375')
    expect(readoutText('Dentro l\'ipercubo')).toBe(String(countK(points, centerOf(X_START, 3), 1.5)))
    // i salmoni del quadrato fuori per la lunghezza sono segnati a parte
    expect(document.querySelectorAll('[data-point="out3"]').length).toBe(6 - countK(points, centerOf(X_START, 3), 1.5))
  })

  it('la scansione (reduced motion: subito) scrive tutta la fila di 0 e 1 e la somma K', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(screen.getByLabelText('Passo avanti'))
    expect(screen.getByText('Scansione: dentro o fuori?')).toBeInTheDocument()
    const row = screen.getByRole('region', { name: /Addendi della sommatoria/ })
    expect(row.textContent).toContain('= 6')
    expect(row.textContent?.match(/[01]/g)?.length).toBeGreaterThanOrEqual(40)
  })

  it('"+1 salmone" esamina un salmone alla volta e mostra il suo u e il suo γ', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('+1 salmone'))
    expect(screen.getByText('Il salmone in esame')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-point="neutral"]')).toHaveLength(39)
    await user.click(button('+1 salmone'))
    expect(document.querySelectorAll('[data-point="neutral"]')).toHaveLength(38)
    expect(document.querySelector('[data-scan]')).not.toBeNull()
  })

  it('x* si sposta da tastiera di un decimo e il conteggio segue', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    xStar().focus()
    await user.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}')
    expect(xStar()).toHaveAttribute('aria-valuetext', 'x = 4.2, y = 5.0')
    expect(readoutText('Dentro l\'ipercubo')).toBe(String(countK(points, [4.2, 5], 1.5)))
  })

  it('"Prevedi prima di guardare" nasconde conteggio e colori', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(screen.getByRole('switch', { name: 'Prevedi prima di guardare' }))
    expect(readoutText('Dentro l\'ipercubo')).toBe('?')
    expect(document.querySelectorAll('[data-point="neutral"]')).toHaveLength(40)
  })

  it('la sfida: previsioni esatte e 5 salmoni nel quadrato in (5, 3) la superano; lo stato iniziale no', async () => {
    const user = userEvent.setup()
    render(<Widget />)
    await user.click(button('Verifica'))
    expect(screen.queryByText('Sfida superata.')).not.toBeInTheDocument()
    for (const s of SPOTS) {
      const input = screen.getByRole('spinbutton', { name: new RegExp(`^K previsto in ${s.id}`) })
      fireEvent.change(input, { target: { value: String(countK(points, centerOf(s.x, 2), 1.5)) } })
      fireEvent.blur(input)
    }
    await user.click(button('Porta x* in (5, 3)'))
    const hTarget = hForK(points, TARGET_X, 5)[0]
    const hSlider = screen.getByRole('slider', { name: /Lato dell'ipercubo/ })
    hSlider.focus()
    for (let i = 0; i < Math.round((hTarget - 1.5) / 0.1); i++) await user.keyboard('{ArrowRight}')
    expect(hSlider).toHaveAttribute('aria-valuetext', hTarget.toFixed(1))
    await user.click(button('Verifica'))
    expect(screen.getByText('Sfida superata.')).toBeInTheDocument()
  })
})
