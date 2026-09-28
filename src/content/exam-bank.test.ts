import { describe, expect, it } from 'vitest'
import { renderRich } from '../lib/rich'
import {
  BANK_PARTS,
  bankKey,
  bankQuestionsCoveredBy,
  coversBankQuestion,
  examBank,
  getBankQuestion,
  isFragmentOf,
  normalizeBankText,
  reportOf,
} from './exam-bank'
import { manifest } from './manifest'

const count = (part: string) => examBank.filter((q) => q.part === part).length

describe('banca delle domande d\'orale', () => {
  it('ha 88 domande atomiche: 24 di Melgani, 23 di Passerini, 41 di Deep Learning', () => {
    expect(examBank).toHaveLength(88)
    expect(count('Melgani')).toBe(24)
    expect(count('Passerini')).toBe(23)
    expect(count('Deep Learning')).toBe(41)
    expect(BANK_PARTS).toEqual(['Melgani', 'Passerini', 'Deep Learning'])
  })

  it('le domande vengono da 82 resoconti della fonte: 20 paragrafi di Melgani, 21 di Passerini, 41 voci numerate di DL', () => {
    const reports = (part: string) => new Set(examBank.filter((q) => q.part === part).map((q) => reportOf(q.id))).size
    expect(reports('Melgani')).toBe(20)
    expect(reports('Passerini')).toBe(21)
    expect(reports('Deep Learning')).toBe(41)
    expect(reportOf('mel-14c')).toBe('mel-14')
    expect(reportOf('dl-07')).toBe('dl-07')
  })

  it('ogni domanda ha id unico, testo verbatim e traduzione non vuoti, docente e parte coerenti', () => {
    expect(new Set(examBank.map((q) => q.id)).size).toBe(examBank.length)
    for (const q of examBank) {
      expect(q.text.trim(), q.id).not.toBe('')
      expect(q.text, q.id).toBe(q.text.trim())
      expect(q.textIt.trim(), q.id).not.toBe('')
      const prof = q.part === 'Melgani' ? ['Melgani', 'Assistant'] : q.part === 'Passerini' ? ['Passerini'] : ['Ricci']
      expect(prof, q.id).toContain(q.prof)
    }
    expect(examBank.filter((q) => q.prof === 'Assistant').map((q) => q.id)).toEqual(['mel-20'])
  })

  it('ogni domanda punta ad almeno un foglio che esiste nel manifest, senza doppioni, e a una pagina della fonte', () => {
    const ids = new Set(manifest.map((m) => m.id))
    for (const q of examBank) {
      expect(q.moduleIds.length, q.id).toBeGreaterThan(0)
      expect(new Set(q.moduleIds).size, q.id).toBe(q.moduleIds.length)
      for (const m of q.moduleIds) expect(ids.has(m), `${q.id} → ${m}`).toBe(true)
      expect(q.page, q.id).toBeGreaterThanOrEqual(1)
      expect(q.page, q.id).toBeLessThanOrEqual(6)
    }
  })

  it('ogni domanda ha anche la domanda in inglese (textEn): testo semplice, in seconda persona, mai il resoconto in prima persona', () => {
    for (const q of examBank) {
      expect(typeof q.textEn, q.id).toBe('string')
      expect(q.textEn.trim(), q.id).not.toBe('')
      expect(q.textEn, q.id).toBe(q.textEn.trim())
      // la riga EN della scheda è testo semplice: niente Markdown né KaTeX
      expect(q.textEn, q.id).not.toMatch(/[$*`\\]/)
      // niente "I told him", "he asked me", "we draw": quello è il resoconto, che resta in `text`. Le parole del
      // docente fra virgolette ("tell me about it") sono la domanda stessa: si tolgono prima del controllo.
      const own = q.textEn.replace(/“[^”]*”/g, '')
      expect(own, q.id).not.toMatch(/\bI\b/)
      expect(own, q.id).not.toMatch(/\b(me|my|we|us|our|he|she|him|her)\b/i)
    }
    // il resoconto verbatim non cambia
    expect(getBankQuestion('mel-01')!.text).toMatch(/^Generalization Error \(and then Empirical error\): I told him/)
    expect(getBankQuestion('mel-01')!.textEn).toMatch(/^Generalization error/)
  })

  it('le pagine seguono l\'ordine della fonte', () => {
    const pages = examBank.map((q) => q.page)
    expect(pages).toEqual([...pages].sort((a, b) => a - b))
  })

  it('le traduzioni con formule si rendono senza errori KaTeX', () => {
    for (const q of examBank) expect(() => renderRich(q.textIt, { throwOnError: true }), q.id).not.toThrow()
  })

  it('getBankQuestion trova una domanda per id', () => {
    expect(getBankQuestion('mel-03')?.moduleIds[0]).toBe('m09-parzen-windows')
    expect(getBankQuestion('boh')).toBeUndefined()
  })
})

describe('confronto fra bankText e banca', () => {
  it('normalizza maiuscole, spazi e virgolette tipografiche', () => {
    expect(normalizeBankText('  Parzen  Window\n Estimation: “x” ’y’ ')).toBe('parzen window estimation: "x" \'y\'')
    expect(bankKey('A'.repeat(80))).toHaveLength(60)
  })

  it('un bankText con gli stessi primi 60 caratteri copre la domanda, anche con spazi diversi', () => {
    const q = getBankQuestion('mel-03')!
    expect(coversBankQuestion(q.text.replace(/\s+/g, '  ').toUpperCase(), q)).toBe(true)
    expect(coversBankQuestion(q.text.slice(0, 70), q)).toBe(true)
  })

  it('un bankText più lungo che contiene la domanda la copre (un paragrafo intero copre le sue parti)', () => {
    const whole = ['mel-14a', 'mel-14b', 'mel-14c', 'mel-14d', 'mel-14e'].map((id) => getBankQuestion(id)!.text).join(' ')
    expect(bankQuestionsCoveredBy(whole).map((q) => q.id)).toEqual(['mel-14a', 'mel-14b', 'mel-14c', 'mel-14d', 'mel-14e'])
  })

  it('le domande brevi si riconoscono solo come parola intera', () => {
    const l1 = getBankQuestion('dl-02')!
    expect(coversBankQuestion('L1 regularization', l1)).toBe(true)
    expect(coversBankQuestion('1. Weight Decay 2. L1 regularization 3. L2 regularization', l1)).toBe(true)
    expect(coversBankQuestion('L1 regularizations and more', l1)).toBe(false)
  })

  it('un pezzo di una domanda non la copre, ma si riconosce come frammento', () => {
    const q = getBankQuestion('mel-18')!
    expect(coversBankQuestion('Explain box classifier', q)).toBe(false)
    expect(isFragmentOf('Explain box classifier', q)).toBe(true)
    expect(isFragmentOf(q.text, q)).toBe(false)
    expect(isFragmentOf('Something else entirely, not in the bank at all', q)).toBe(false)
  })

  it('i quattro bankText del foglio 09 coprono le quattro domande della banca che lo riguardano', () => {
    const texts = [
      'Parzen Window Estimation: context, properties etc. Which is the most common window function (write the formula)? Is Parzen a good estimator (bias/variance)? Graphical representation of how the counting/interpolation works with  a couple of samples.',
      'Parzen Windows: general context (what we want to do, why they are non parametric estimation), gaussian kernel with spherical symmetry with formula and some drawing to represent it, How the choice of the width impacts our estimate? Is it a good estimate? (Bias, variance and consideration about the characteristics of the width to have a consistent estimate)',
      'K-NN estimation, how does it works, we draw a graph for example and asked how is the distribution, what does it mean overfit and oversmooth. Then he asked how the K-NN classifier works and made an example. Last question what are the difference with parzen window',
      'Explain non-parametric estimation, what non-parametric means and why we use it, explain both KNN and Parzen windows, do they tend to the optimal solution? Explain ML estimation, develop the first derivative for a gaussian and explain the meaning of the result. Explain box classifier',
    ]
    expect(texts.flatMap((t) => bankQuestionsCoveredBy(t).map((q) => q.id))).toEqual(['mel-03', 'mel-10', 'mel-05', 'mel-18'])
  })
})
