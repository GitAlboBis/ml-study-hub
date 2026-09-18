import { afterEach, describe, expect, it, vi } from 'vitest'
import type { MouseEvent } from 'react'
import { followInternalLink } from './internalLinks'

const click = (a: HTMLAnchorElement, init: Partial<MouseEvent<HTMLElement>> = {}) => {
  const event = { target: a, button: 0, defaultPrevented: false, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, preventDefault: vi.fn(), ...init }
  return event as unknown as MouseEvent<HTMLElement> & { preventDefault: ReturnType<typeof vi.fn> }
}
const link = (href: string) => {
  const a = document.createElement('a')
  a.setAttribute('href', href)
  document.body.append(a)
  return a
}

afterEach(() => {
  document.body.innerHTML = ''
  window.history.replaceState(null, '', '/')
})

describe('followInternalLink', () => {
  it("un'ancora presente sulla scheda aperta ci scorre senza navigare", () => {
    const target = document.createElement('section')
    target.id = 'derivation:der04'
    target.scrollIntoView = vi.fn()
    document.body.append(target)
    const navigate = vi.fn()
    const e = click(link('#derivation:der04'))
    followInternalLink(e, navigate)
    expect(e.preventDefault).toHaveBeenCalled()
    expect(target.scrollIntoView).toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it("un'ancora assente apre la scheda Teoria dello stesso foglio", () => {
    window.history.replaceState(null, '', '/m/m09-parzen-windows/formule')
    const navigate = vi.fn()
    followInternalLink(click(link('#derivation:der04')), navigate)
    expect(navigate).toHaveBeenCalledWith('/m/m09-parzen-windows/teoria#derivation:der04')
  })

  it("un percorso dell'app passa dal router; i link esterni e i clic con modificatori no", () => {
    const navigate = vi.fn()
    followInternalLink(click(link('/m/m08-non-parametrica-knn/teoria')), navigate)
    expect(navigate).toHaveBeenCalledWith('/m/m08-non-parametrica-knn/teoria')
    navigate.mockClear()
    const external = click(link('https://example.org'))
    followInternalLink(external, navigate)
    const withCtrl = click(link('/m/x'), { ctrlKey: true })
    followInternalLink(withCtrl, navigate)
    expect(navigate).not.toHaveBeenCalled()
    expect(external.preventDefault).not.toHaveBeenCalled()
    expect(withCtrl.preventDefault).not.toHaveBeenCalled()
  })
})
