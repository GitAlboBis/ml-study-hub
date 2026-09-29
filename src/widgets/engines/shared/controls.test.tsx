import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FormulaList } from './FormulaList'
import { InsightLamps } from './InsightLamps'
import { ParamSlider } from './ParamSlider'
import { tabElementId } from './presetTools'
import { TabStrip } from './TabStrip'
import { TermLegend } from './TermLegend'
import type { Insight, ParamSpec } from './types'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('TabStrip', () => {
  const tabs = [
    { id: 'gauss', label: 'Gaussiana', en: 'Gaussian' },
    { id: 'gamma', label: 'Gamma $\\Gamma(k,\\theta)$' },
    { id: 'ray', label: 'Rayleigh' },
  ]
  function Harness({ onChange }: { onChange?: (id: string) => void }) {
    const [value, setValue] = useState('gauss')
    return (
      <>
        <TabStrip
          id="fam"
          label="Famiglia"
          tabs={tabs}
          value={value}
          panelId="pan"
          onChange={(v) => {
            setValue(v)
            onChange?.(v)
          }}
        />
        <div role="tabpanel" id="pan" aria-labelledby={tabElementId('fam', value)}>
          {value}
        </div>
      </>
    )
  }

  it('tablist con nome, schede con nomi in parole e una sola nel giro del Tab', () => {
    render(<Harness />)
    expect(screen.getByRole('tablist', { name: 'Famiglia' })).toBeInTheDocument()
    const all = screen.getAllByRole('tab')
    expect(all.map((t) => t.getAttribute('aria-label'))).toEqual(['Gaussiana (Gaussian)', 'Gamma Γ(k,θ)', 'Rayleigh'])
    expect(all.map((t) => t.tabIndex)).toEqual([0, -1, -1])
    expect(all[0]).toHaveAttribute('aria-selected', 'true')
    expect(all[0]).toHaveAttribute('aria-controls', 'pan')
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'fam-tab-gauss')
  })

  it('frecce con giro, Inizio e Fine scelgono e spostano il fuoco; il clic sceglie', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const [g, gm, r] = screen.getAllByRole('tab')
    g.focus()
    await user.keyboard('{ArrowRight}')
    expect(gm).toHaveAttribute('aria-selected', 'true')
    expect(gm).toHaveFocus()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(g).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{ArrowLeft}')
    expect(r).toHaveFocus()
    await user.keyboard('{Home}')
    expect(g).toHaveFocus()
    await user.keyboard('{End}')
    expect(r).toHaveAttribute('aria-selected', 'true')
    await user.click(gm)
    expect(onChange).toHaveBeenLastCalledWith('gamma')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('gamma')
  })
})

describe('InsightLamps', () => {
  interface S {
    n: number
  }
  const insights: Insight<S>[] = [
    { id: 'big', label: '$N$ grande', en: 'large sample', when: (s) => s.n > 30, tone: 'ok' },
    { id: 'odd', label: 'N dispari', when: (s) => s.n % 2 === 1, tone: 'warn' },
    { id: 'none', label: 'Nessun campione', when: (s) => s.n === 0 },
  ]

  it('lista: tutte le spie, accese e spente dette a parole e con il tassello', () => {
    render(<InsightLamps insights={insights} state={{ n: 31 }} />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent(/Accesa:/)
    expect(items[1]).toHaveTextContent(/Accesa:/)
    expect(items[2]).toHaveTextContent(/Spenta:/)
    expect(items[0].querySelector('[data-lamp="on"] svg')).not.toBeNull()
    expect(items[2].querySelector('[data-lamp="off"] svg')).toBeNull()
    expect(items[0].querySelector('em[lang="en"]')).toHaveTextContent('large sample')
  })

  it('timbri: solo le accese', () => {
    render(<InsightLamps insights={insights} state={{ n: 4 }} variant="badges" />)
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    cleanup()
    render(<InsightLamps insights={insights} state={{ n: 0 }} variant="badges" />)
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })

  it('annuncia le spie accese quando lo stato si ferma, non a ogni cambio', () => {
    vi.useFakeTimers()
    const { container, rerender } = render(<InsightLamps insights={insights} state={{ n: 4 }} />)
    const live = container.querySelector('[aria-live="polite"]')!
    expect(live).toHaveTextContent('Spie: nessuna accesa.')
    rerender(<InsightLamps insights={insights} state={{ n: 33 }} />)
    rerender(<InsightLamps insights={insights} state={{ n: 40 }} />)
    expect(live).toHaveTextContent('Spie: nessuna accesa.')
    act(() => vi.advanceTimersByTime(600))
    expect(live).toHaveTextContent('Spie accese: N grande.')
  })
})

describe('ParamSlider', () => {
  const spec: ParamSpec = { id: 'n', label: 'Numero di campioni $N$', en: 'sample size', min: 2, max: 5000, initial: 12, scale: 'log', step: 1 }

  function Harness() {
    const [v, setV] = useState(spec.initial)
    return (
      <>
        <ParamSlider spec={spec} value={v} onChange={setV} />
        <output data-testid="v">{v}</output>
      </>
    )
  }

  it('nome in parole con il termine inglese, valore leggibile, frecce sui valori tondi', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const slider = screen.getByRole('slider', { name: 'Numero di campioni (sample size)' })
    expect(slider).toHaveAttribute('aria-valuetext', '12')
    slider.focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByTestId('v')).toHaveTextContent('14')
    await user.keyboard('{End}')
    expect(screen.getByTestId('v')).toHaveTextContent('5000')
    expect(slider).toHaveAttribute('aria-valuetext', '5000')
    await user.keyboard('{Home}')
    expect(screen.getByTestId('v')).toHaveTextContent('2')
  })

  it('scala lineare con un aggancio della slide fuori griglia', async () => {
    const user = userEvent.setup()
    const lin: ParamSpec = { id: 'x', label: 'Soglia $x^*$', min: 0, max: 1, initial: 0.3, step: 0.1, snaps: [0.37] }
    const onChange = vi.fn()
    render(<ParamSlider spec={lin} value={0.3} onChange={onChange} />)
    const slider = screen.getByRole('slider', { name: 'Soglia' })
    expect(slider).toHaveAttribute('aria-valuetext', '0.30')
    slider.focus()
    await user.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenLastCalledWith(0.37)
  })
})

describe('FormulaList', () => {
  it('risolve le formule nel contesto e fa annunciare solo la prima con segnaposto', () => {
    const { container } = render(
      <FormulaList
        ctx={{ n: 3 }}
        values={{ p: 0.25, N: 3 }}
        formulas={[
          { id: 'def', label: 'Definizione', tex: String.raw`\hat p(x) = \frac{K}{NV}` },
          { id: 'num', label: 'Con i numeri', tex: (c: { n: number }) => String.raw`\hat p = \val[2]{p} \quad (N = ${c.n})` },
          { id: 'n', tex: String.raw`N = \val[0]{N}` },
        ]}
      />,
    )
    expect(container.querySelectorAll('[data-formula]')).toHaveLength(3)
    expect(screen.getByText('Con i numeri')).toBeInTheDocument()
    const live = container.querySelectorAll('[aria-live="polite"]')
    expect(live).toHaveLength(1)
    expect(container.querySelector('[data-formula="num"] [aria-live]')).not.toBeNull()
  })
})

describe('TermLegend', () => {
  it('passare o mettere a fuoco una voce la mostra, un clic la fissa', async () => {
    const user = userEvent.setup()
    const onPreview = vi.fn()
    const onPin = vi.fn()
    const { container } = render(
      <TermLegend
        terms={[
          { target: 'estimate', symbol: String.raw`\hat p(x)`, it: 'la stima', en: 'estimate' },
          { target: 'truth', symbol: 'p(x)', it: 'la densità vera', en: 'true density' },
        ]}
        pinned="truth"
        onPreview={onPreview}
        onPin={onPin}
        notes={['Non è il kernel delle SVM.']}
        swatch={(t) => <svg data-swatch={t} />}
      />,
    )
    const [est, truth] = [...container.querySelectorAll<HTMLButtonElement>('[data-term]')]
    expect(truth).toHaveAttribute('aria-pressed', 'true')
    expect(est).toHaveAttribute('aria-pressed', 'false')
    expect(container.querySelector('[data-swatch="estimate"]')).not.toBeNull()
    est.focus()
    expect(onPreview).toHaveBeenLastCalledWith('estimate')
    await user.click(est)
    expect(onPin).toHaveBeenLastCalledWith('estimate')
    expect(screen.getByText('Non è il kernel delle SVM.')).toBeInTheDocument()
  })
})
