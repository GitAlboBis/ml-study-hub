import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProgress } from '../../../store/progress'
import { ChallengePanel } from './ChallengePanel'

beforeEach(() => useProgress.setState({ challenges: {} }))
afterEach(cleanup)

const button = (text: string) => screen.getByText(text, { selector: 'button' })
const after = (a: Node, b: Node) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

describe('ChallengePanel (il Challenge del kit con lo spazio per la risposta)', () => {
  it('la risposta sta fra la consegna e Verifica; senza risposta non c\'è il suo contenitore', () => {
    const { container, rerender } = render(<ChallengePanel prompt="Quanto vale 1/8?" status="idle" onCheck={() => {}} widgetId="w" answer={<input aria-label="Risposta" />} />)
    const field = screen.getByLabelText('Risposta')
    expect(after(screen.getByText('Quanto vale 1/8?'), field)).toBe(true)
    expect(after(field, button('Verifica'))).toBe(true)
    rerender(<ChallengePanel prompt="Quanto vale 1/8?" status="idle" onCheck={() => {}} widgetId="w" />)
    expect(container.querySelector('[data-challenge-answer]')).toBeNull()
  })

  it('come il kit: Verifica chiama onCheck, l\'indizio si apre con aria-expanded, l\'esito si annuncia e il successo va nei progressi', async () => {
    const user = userEvent.setup()
    const onCheck = vi.fn()
    const { rerender } = render(<ChallengePanel prompt="Trova h." hint="Guarda la curva." status="idle" onCheck={onCheck} widgetId="w" />)
    await user.click(button('Verifica'))
    expect(onCheck).toHaveBeenCalledTimes(1)
    const hint = button('Indizio')
    expect(hint).toHaveAttribute('aria-expanded', 'false')
    await user.click(hint)
    expect(hint).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Guarda la curva.')).toBeVisible()
    rerender(<ChallengePanel prompt="Trova h." hint="Guarda la curva." status="ko" onCheck={onCheck} widgetId="w" />)
    expect(screen.getByRole('status')).toHaveTextContent(/Non ancora/)
    rerender(<ChallengePanel prompt="Trova h." hint="Guarda la curva." status="ok" onCheck={onCheck} widgetId="w" />)
    expect(screen.getByRole('status')).toHaveTextContent(/Sfida superata/)
    expect(useProgress.getState().challenges.w).toBeDefined()
  })
})
