import { cleanup, render } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { M } from '../components/content/M'
import { Rich } from '../components/content/Rich'
import { extractMath, renderRich, renderTex } from './rich'

// Analizza l'HTML prodotto: i test guardano la struttura, non le stringhe di KaTeX
const dom = (html: string): HTMLElement => new DOMParser().parseFromString(html, 'text/html').body

// KaTeX (output htmlAndMathml) riporta il sorgente TeX in <annotation>
const texOf = (root: ParentNode): string[] =>
  [...root.querySelectorAll('annotation')].map((a) => a.textContent ?? '')

describe('extractMath', () => {
  it('restituisce prima le formule display, poi le inline, ogni gruppo in ordine di comparsa', () => {
    expect(extractMath('a $x_1$ b $$\\frac{1}{N}$$ c $y$ d $$z$$')).toEqual([
      { tex: '\\frac{1}{N}', display: true },
      { tex: 'z', display: true },
      { tex: 'x_1', display: false },
      { tex: 'y', display: false },
    ])
  })

  it('senza matematica restituisce un elenco vuoto', () => {
    expect(extractMath('solo testo con **grassetto**')).toEqual([])
  })

  it('toglie gli spazi attorno al LaTeX', () => {
    expect(extractMath('$ x $ e $$ y $$')).toEqual([
      { tex: 'y', display: true },
      { tex: 'x', display: false },
    ])
  })

  it('$$ su più righe è una sola formula display', () => {
    const src = 'La media campionaria:\n\n$$\n\\hat{\\mu} = \\frac{1}{N}\n\\sum_{i=1}^{N} x_i\n$$\n\ndopo la formula'
    expect(extractMath(src)).toEqual([
      { tex: '\\hat{\\mu} = \\frac{1}{N}\n\\sum_{i=1}^{N} x_i', display: true },
    ])
  })

  it('"\\$" nel testo non apre matematica', () => {
    expect(extractMath('costa 5\\$ e poi 10\\$')).toEqual([])
    expect(extractMath('costa 5\\$, mentre $x = 2$ vale 10\\$')).toEqual([{ tex: 'x = 2', display: false }])
  })

  it('"\\$" dentro la matematica non la chiude', () => {
    expect(extractMath('prezzo $\\text{costo} = 5\\$$ finale')).toEqual([
      { tex: '\\text{costo} = 5\\$', display: false },
    ])
  })

  it('"\\\\" a fine formula non viene preso per un "$" escapato', () => {
    expect(extractMath('$$a \\\\$$ e $b \\\\$')).toEqual([
      { tex: 'a \\\\', display: true },
      { tex: 'b \\\\', display: false },
    ])
  })

  it('il "$" dentro il codice non è matematica', () => {
    expect(extractMath('il comando `echo $HOME e $PATH` resta codice')).toEqual([])
    expect(extractMath('```\na = $x$\n```\n\nfuori $y$')).toEqual([{ tex: 'y', display: false }])
  })
})

describe('renderTex', () => {
  it('inline: HTML di KaTeX con MathML, senza contenitore display', () => {
    const html = renderTex('x_1', false)
    expect(html).toContain('class="katex"')
    expect(html).toContain('<math')
    expect(html).not.toContain('katex-display')
  })

  it('display: contenitore katex-display', () => {
    expect(renderTex('\\frac{1}{N}', true)).toContain('katex-display')
  })

  it('throwOnError segnala LaTeX rotto', () => {
    expect(() => renderTex('\\frac{1}', false, true)).toThrow()
  })

  it('senza throwOnError il LaTeX rotto non lancia', () => {
    expect(() => renderTex('\\frac{1}', false)).not.toThrow()
  })
})

describe('renderRich', () => {
  it('gli underscore nella matematica non diventano corsivo', () => {
    const html = renderRich('stima $\\hat{\\mu}_{ML} = x_1 + x_2$ con **grassetto**')
    expect(html).toContain('katex')
    expect(html).toContain('<strong>grassetto</strong>')
    expect(html).not.toContain('<em>')
  })

  it('"\\$" nel testo resta un dollaro e non apre matematica', () => {
    const body = dom(renderRich('costa 5\\$ e poi 10\\$'))
    expect(body.querySelector('.katex')).toBeNull()
    expect(body.textContent?.trim()).toBe('costa 5$ e poi 10$')
  })

  it('$$ su più righe diventa una formula display fra due paragrafi', () => {
    const src = 'La media campionaria:\n\n$$\n\\hat{\\mu} = \\frac{1}{N}\n\\sum_{i=1}^{N} x_i\n$$\n\ndopo la formula'
    const body = dom(renderRich(src))
    expect(body.querySelectorAll('.katex-display')).toHaveLength(1)
    expect(texOf(body)).toEqual(['\\hat{\\mu} = \\frac{1}{N}\n\\sum_{i=1}^{N} x_i'])
    const paragraphs = [...body.querySelectorAll('p')].map((p) => p.textContent?.trim())
    expect(paragraphs[0]).toBe('La media campionaria:')
    expect(paragraphs.at(-1)).toBe('dopo la formula')
    expect(renderRich(src)).not.toContain('$$')
  })

  it('"<" e ">" dentro la matematica non rompono l\'HTML', () => {
    const body = dom(renderRich('se $a < b$ e $c > d$ allora $a<b>c$ vale'))
    expect(texOf(body)).toEqual(['a < b', 'c > d', 'a<b>c'])
    expect(body.querySelectorAll('.katex')).toHaveLength(3)
    // nessun tag nato per sbaglio da "<b>" e il testo attorno resta al suo posto
    expect(body.querySelector('b')).toBeNull()
    expect(body.querySelectorAll('p')).toHaveLength(1)
    expect(body.textContent).toMatch(/^se .* e .* allora .* vale\s*$/s)
  })

  it('la pipe dentro la matematica non spezza le celle di una tabella GFM', () => {
    const src = [
      '| Simbolo | Significato |',
      '|---|---|',
      '| $P(x|\\omega_i)$ | verosimiglianza |',
      '| $|\\Sigma|$ | determinante |',
    ].join('\n')
    const body = dom(renderRich(src))
    const rows = [...body.querySelectorAll('tbody tr')]
    expect(rows).toHaveLength(2)
    for (const row of rows) {
      expect(row.querySelectorAll('td')).toHaveLength(2)
      expect(row.querySelector('td:first-child .katex')).not.toBeNull()
    }
    expect(texOf(body)).toEqual(['P(x|\\omega_i)', '|\\Sigma|'])
    expect(rows[0].querySelector('td:last-child')?.textContent).toBe('verosimiglianza')
  })

  it('grassetto e liste attorno alla matematica restano Markdown', () => {
    const src = [
      '**Stimatore $\\hat{\\theta}$** non distorto, con**$k$**-NN:',
      '',
      '- media $\\mu$',
      '- varianza **$\\sigma^2$**',
      '',
      '1. primo $x_1$',
      '2. secondo $x_2$',
    ].join('\n')
    const body = dom(renderRich(src))
    const strong = [...body.querySelectorAll('strong')]
    expect(strong).toHaveLength(3)
    for (const s of strong) expect(s.querySelector('.katex')).not.toBeNull()
    expect(body.querySelectorAll('ul > li')).toHaveLength(2)
    expect(body.querySelectorAll('ol > li')).toHaveLength(2)
    for (const li of body.querySelectorAll('li')) expect(li.querySelector('.katex')).not.toBeNull()
    expect(texOf(body)).toEqual(['\\hat{\\theta}', 'k', '\\mu', '\\sigma^2', 'x_1', 'x_2'])
    expect(body.textContent).not.toContain('**')
  })

  it('con inline:true non produce <p>', () => {
    const html = renderRich('testo con $x$ e **grassetto**', { inline: true })
    expect(html).not.toContain('<p')
    expect(html).toContain('katex')
    expect(html).toContain('<strong>grassetto</strong>')
  })

  it('senza inline il testo è un paragrafo', () => {
    expect(renderRich('testo con $x$')).toMatch(/^<p>/)
  })

  it('con più di dieci formule ognuna torna al proprio posto', () => {
    const src = Array.from({ length: 12 }, (_, i) => `$x_{${i}}$`).join(' poi ')
    const body = dom(renderRich(src, { inline: true }))
    expect(texOf(body)).toEqual(Array.from({ length: 12 }, (_, i) => `x_{${i}}`))
  })

  it('il "$" dentro il codice non diventa matematica', () => {
    const body = dom(renderRich('il comando `echo $HOME e $PATH` resta codice, $x$ no'))
    expect(body.querySelector('code')?.textContent).toBe('echo $HOME e $PATH')
    expect(texOf(body)).toEqual(['x'])
  })

  it('throwOnError si propaga alle formule del testo', () => {
    expect(() => renderRich('rotta: $\\frac{1}$', { throwOnError: true })).toThrow()
    expect(() => renderRich('rotta: $\\frac{1}$')).not.toThrow()
  })
})

// I componenti stanno qui (con createElement, il file non è .tsx) perché sono un guscio sottile su rich.ts
describe('componenti Rich e M', () => {
  afterEach(cleanup)

  it('<Rich> a blocchi è un div con paragrafi, Markdown e matematica', () => {
    const { container } = render(createElement(Rich, { text: 'stima **non distorta** di $\\mu$' }))
    const root = container.firstElementChild
    expect(root?.tagName).toBe('DIV')
    expect(root?.querySelector('p strong')?.textContent).toBe('non distorta')
    expect(texOf(container)).toEqual(['\\mu'])
  })

  it('<Rich inline> è uno span senza <p>', () => {
    const { container } = render(createElement(Rich, { text: 'vale $x$', inline: true }))
    const root = container.firstElementChild
    expect(root?.tagName).toBe('SPAN')
    expect(root?.querySelector('p')).toBeNull()
    expect(root?.querySelector('.katex')).not.toBeNull()
  })

  it('<Rich className> mette la classe sul contenitore', () => {
    const { container } = render(createElement(Rich, { text: 'testo', className: 'prose' }))
    expect(container.firstElementChild?.className).toBe('prose')
  })

  it('<Rich> si aggiorna quando cambia il testo', () => {
    const { container, rerender } = render(createElement(Rich, { text: 'prima $a$' }))
    rerender(createElement(Rich, { text: 'dopo $b$' }))
    expect(texOf(container)).toEqual(['b'])
  })

  it('<M> inline: span.math-inline con KaTeX', () => {
    const { container } = render(createElement(M, { tex: 'x_1' }))
    const root = container.firstElementChild
    expect(root?.tagName).toBe('SPAN')
    expect(root?.className).toBe('math-inline')
    expect(root?.querySelector('.katex-display')).toBeNull()
    expect(texOf(container)).toEqual(['x_1'])
  })

  it('<M display>: span.math-display con katex-display', () => {
    const { container } = render(createElement(M, { tex: '\\frac{1}{N}', display: true }))
    const root = container.firstElementChild
    expect(root?.className).toBe('math-display')
    expect(root?.querySelector('.katex-display')).not.toBeNull()
  })

  it('<M> con LaTeX rotto non fa cadere la pagina', () => {
    expect(() => render(createElement(M, { tex: '\\frac{1}' }))).not.toThrow()
  })
})
