import { describe, expect, it } from 'vitest'
import { manifest } from '../../content/manifest'
import { pendingSheets, sheetRanges } from './sheets'

describe('pendingSheets', () => {
  it('i fogli di una regione non ancora pronti, nell\'ordine del manifest', () => {
    const ready = new Set(['m09-parzen-windows', 'p08-svm-hard-margin'])
    const melgani = pendingSheets('melgani', ready)
    expect(melgani).toHaveLength(manifest.filter((m) => m.course === 'melgani').length - 1)
    expect(melgani.map((m) => m.id)).not.toContain('m09-parzen-windows')
    expect(melgani[0].id).toBe('m01-segnali-learning')
    expect(pendingSheets(null, ready)).toHaveLength(manifest.length - 2)
  })
})

describe('sheetRanges', () => {
  it('scrive i numeri dei fogli come intervalli', () => {
    const ids = ['m01-segnali-learning', 'm02-sistema-ml-design', 'm03-stima-intro-parametrica', 'm05-max-likelihood', 'm07-stima-bayesiana', 'm08-non-parametrica-knn']
    expect(sheetRanges(ids)).toBe('01–03, 05, 07–08')
    expect(sheetRanges(['m09-parzen-windows'])).toBe('09')
    expect(sheetRanges([])).toBe('')
  })

  it('non dipende dall\'ordine in cui arrivano gli id e ignora quelli che non esistono', () => {
    expect(sheetRanges(['m03-stima-intro-parametrica', 'boh', 'm01-segnali-learning', 'm02-sistema-ml-design'])).toBe('01–03')
  })
})
