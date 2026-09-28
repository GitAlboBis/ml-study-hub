import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import type { CourseId } from '../../content/types'
import { ALL_REGIONS, RegionFilter } from './RegionFilter'

afterEach(cleanup)

function Harness({ counts }: { counts?: Partial<Record<CourseId | 'all', number>> }) {
  const [value, setValue] = useState<CourseId | null>(null)
  return (
    <>
      <RegionFilter id="prova" value={value} onChange={setValue} counts={counts} />
      <p>scelta: {value ?? 'tutte'}</p>
    </>
  )
}

describe('RegionFilter', () => {
  it('un gruppo di radio con "Tutte le regioni" e le tre regioni, con i conteggi nel nome', async () => {
    const user = userEvent.setup()
    render(<Harness counts={{ all: 10, melgani: 6, passerini: 4, ricci: 0 }} />)
    const group = screen.getByRole('radiogroup', { name: 'Regione' })
    expect(group).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: `${ALL_REGIONS} 10` })).toBeChecked()
    await user.click(screen.getByRole('radio', { name: 'Ricci 0' }))
    expect(screen.getByText('scelta: ricci')).toBeInTheDocument()
    // frecce: si torna a Passerini
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByText('scelta: passerini')).toBeInTheDocument()
  })

  it('la scelta è a inchiostro, mai a spillo: il tassello Ricci resta visibile quando è premuto', () => {
    render(<Harness />)
    for (const radio of screen.getAllByRole('radio')) {
      const option = radio.closest('label')!
      expect(option.className).toContain('has-[:checked]:bg-accent')
      expect(option.className).not.toContain('bg-pin')
    }
  })
})
