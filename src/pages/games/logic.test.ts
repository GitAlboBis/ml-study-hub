import { describe, expect, it } from 'vitest'
import { createRng } from '../../lib/rng'
import { availability, GAMES } from './catalog'
import { newSort, place, sortOver, sortPlan } from './logic/conceptSort'
import { currentPick, gymOver, newGym, recordGym, nextSeries } from './logic/exerciseGym'
import { currentRound, fillOver, newFill, nextRound, pickOption } from './logic/fillFormula'
import { closeMiss, flip, isFaceUp, isWon, matchable, matchScore, newMatch } from './logic/formulaMatch'
import { ALL_SCOPE, blanksOf, derivationsOf, exercisesOf, formulasOf, glossaryOf, inScope, normalize, parseScope, scopeLabel, scopeSearch, tfOf } from './pool'
import { checkProof, hint, inPlace, moveStep, newProof, proofScore, setOrder } from './logic/proofOrder'
import { answerSprint, multiplier, newSprint, pauseSprint, remaining, resumeSprint, SPRINT_SECONDS, startSprint, tickSprint } from './logic/trueFalse'
import { giveUp, guess, HINT_POINTS, initials, maskTerm, matchesTerm, moreHint, newWho, nextWho, pickWho, whoOver } from './logic/whoAmI'
import { cnn, FAKE_MODULES, kernels, knn, parzen } from './testData'

const rng = (seed = 1) => createRng(seed)

describe('campo di gioco (pool)', () => {
  it('legge corso e foglio dall\'URL; il foglio porta il suo corso, i valori sconosciuti valgono tutto l\'atlante', () => {
    expect(parseScope(new URLSearchParams(''))).toEqual(ALL_SCOPE)
    expect(parseScope(new URLSearchParams('corso=passerini'))).toEqual({ course: 'passerini', moduleId: null })
    expect(parseScope(new URLSearchParams('corso=ricci&foglio=m09-parzen-windows'))).toEqual({ course: 'melgani', moduleId: 'm09-parzen-windows' })
    expect(parseScope(new URLSearchParams('corso=boh&foglio=nessuno'))).toEqual(ALL_SCOPE)
  })

  it('scrive il campo nella query string e lo dice a parole', () => {
    expect(scopeSearch(ALL_SCOPE)).toBe('')
    expect(scopeSearch({ course: 'melgani', moduleId: 'm09-parzen-windows' })).toBe('?corso=melgani&foglio=m09-parzen-windows')
    expect(scopeLabel(ALL_SCOPE)).toBe("Tutto l'atlante")
    expect(scopeLabel({ course: 'ricci', moduleId: null })).toBe('Regione Ricci')
    expect(scopeLabel({ course: 'melgani', moduleId: 'm09-parzen-windows' })).toMatch(/^Foglio 09 · Finestre di Parzen/)
  })

  it('filtra i fogli per corso e per foglio', () => {
    expect(inScope(FAKE_MODULES, ALL_SCOPE)).toHaveLength(4)
    expect(inScope(FAKE_MODULES, { course: 'melgani', moduleId: null }).map((m) => m.id)).toEqual([knn.id, parzen.id])
    expect(inScope(FAKE_MODULES, { course: 'melgani', moduleId: parzen.id })).toEqual([parzen])
  })

  it('ricava i mazzi: solo vero/falso, dimostrazioni di almeno tre passi, glossario senza doppioni', () => {
    expect(formulasOf(FAKE_MODULES)).toHaveLength(7)
    expect(blanksOf(FAKE_MODULES)).toHaveLength(2)
    expect(derivationsOf(FAKE_MODULES).map((d) => d.item.id)).toEqual(['der01', 'der02'])
    expect(tfOf(FAKE_MODULES)).toHaveLength(7)
    const terms = glossaryOf(FAKE_MODULES).map((g) => g.item.term)
    expect(terms.filter((t) => t === 'Ipercubo')).toHaveLength(1)
    expect(terms).toHaveLength(9)
    expect(exercisesOf(FAKE_MODULES)).toHaveLength(3)
  })

  it('normalizza accenti, maiuscole e punteggiatura', () => {
    expect(normalize('  Sovra-lisciatura (KDE)! ')).toBe('sovra lisciatura kde')
    expect(normalize('Cramér–Rao')).toBe('cramer rao')
  })
})

describe('Formula Match', () => {
  it('non mette in gioco due formule con lo stesso LaTeX', () => {
    const ids = matchable(formulasOf([parzen])).map((f) => f.item.id)
    expect(ids).toContain('f1')
    expect(ids).not.toContain('f4')
  })

  it('una coppia trovata resta scoperta, una sbagliata si richiude', () => {
    let s = newMatch(formulasOf(FAKE_MODULES), rng(3), 3)
    expect(s.pairs).toHaveLength(3)
    expect(s.cards).toHaveLength(6)
    const a = s.cards.findIndex((c) => c.pair === 0 && c.face === 'name')
    const b = s.cards.findIndex((c) => c.pair === 0 && c.face === 'formula')
    const other = s.cards.findIndex((c) => c.pair === 1)
    // errore
    let r = flip(s, a)
    expect(r.result).toBe('opened')
    r = flip(r.state, other)
    expect(r.result).toBe('miss')
    expect(r.state.moves).toBe(1)
    expect(r.state.misses).toBe(1)
    s = closeMiss(r.state)
    expect(isFaceUp(s, a)).toBe(false)
    // coppia
    r = flip(s, a)
    r = flip(r.state, b)
    expect(r.result).toBe('match')
    expect(isFaceUp(r.state, a) && isFaceUp(r.state, b)).toBe(true)
    // una tessera già trovata non si gira più
    expect(flip(r.state, a).result).toBe('ignored')
    expect(r.state.moves).toBe(2)
  })

  it('con due tessere sbagliate scoperte, la terza le richiude', () => {
    const s = newMatch(formulasOf(FAKE_MODULES), rng(5), 3)
    const byPair = (p: number) => s.cards.map((c, i) => [c, i] as const).filter(([c]) => c.pair === p).map(([, i]) => i)
    let r = flip(s, byPair(0)[0])
    r = flip(r.state, byPair(1)[0])
    r = flip(r.state, byPair(2)[0])
    expect(r.result).toBe('opened')
    expect(r.state.open).toEqual([byPair(2)[0]])
  })

  it('vittoria e punteggio: 100 a coppia, meno le mosse sprecate e la lentezza', () => {
    let s = newMatch(formulasOf(FAKE_MODULES), rng(9), 3)
    for (let p = 0; p < 3; p++) {
      const idx = s.cards.map((c, i) => [c, i] as const).filter(([c]) => c.pair === p).map(([, i]) => i)
      s = flip(flip(s, idx[0]).state, idx[1]).state
    }
    expect(isWon(s)).toBe(true)
    expect(matchScore(3, 3, 20)).toBe(300)
    expect(matchScore(3, 5, 20)).toBe(260)
    expect(matchScore(3, 3, 55)).toBe(290)
    expect(matchScore(3, 40, 999)).toBe(30)
  })
})

describe('Completa la formula', () => {
  it('mescola risposta e distrattori; giusta vale 100 più la serie, sbagliata azzera la serie', () => {
    let s = newFill(blanksOf(FAKE_MODULES), rng(2), 8)
    expect(s.rounds).toHaveLength(2)
    const r0 = currentRound(s)!
    expect(r0.options).toContain(r0.options[r0.answer])
    expect(new Set(r0.options).size).toBe(r0.options.length)
    s = pickOption(s, r0.answer)
    expect(s.score).toBe(100)
    expect(s.streak).toBe(1)
    // una seconda scelta sulla stessa domanda non conta
    expect(pickOption(s, (r0.answer + 1) % r0.options.length)).toBe(s)
    s = nextRound(s)
    const r1 = currentRound(s)!
    const s2 = pickOption(s, r1.answer)
    expect(s2.score).toBe(220)
    const wrong = pickOption(s, (r1.answer + 1) % r1.options.length)
    expect(wrong.score).toBe(100)
    expect(wrong.streak).toBe(0)
    expect(wrong.misses).toHaveLength(1)
    expect(fillOver(nextRound(wrong))).toBe(true)
  })
})

describe('Riordina la dimostrazione', () => {
  const der = derivationsOf([parzen])[0].item

  it('parte mescolata, si riordina e si controlla', () => {
    let s = newProof(der, rng(4))
    expect(inPlace(s).every(Boolean)).toBe(false)
    // riordino a mano: porta ogni passo al suo posto
    for (let target = 0; target < der.steps.length; target++) {
      const from = s.order.indexOf(target)
      s = moveStep(s, from, target)
    }
    s = checkProof(s)
    expect(s.solved).toBe(true)
    expect(s.checks).toBe(1)
    expect(proofScore(der.steps.length, s.checks, s.hints)).toBe(80)
  })

  it('un controllo sbagliato segna i passi fuori posto e costa punti', () => {
    let s = setOrder(newProof(der, rng(4)), [3, 2, 1, 0])
    s = checkProof(s)
    expect(s.solved).toBe(false)
    expect(s.verdict).toEqual([false, false, false, false])
    // spostare un passo cancella l'esito del controllo
    expect(moveStep(s, 0, 1).verdict).toBeNull()
    expect(proofScore(4, 3, 1)).toBe(45)
    expect(proofScore(4, 30, 10)).toBe(20)
  })

  it('l\'aiuto mette al suo posto il primo passo sbagliato', () => {
    let s = setOrder(newProof(der, rng(4)), [1, 0, 2, 3])
    s = hint(s)
    expect(s.order).toEqual([0, 1, 2, 3])
    expect(s.hints).toBe(1)
  })

  it('due passaggi uguali valgono l\'uno per l\'altro', () => {
    const twin = derivationsOf([parzen])[1].item
    const s = checkProof(setOrder(newProof(twin, rng(1)), [2, 1, 0]))
    expect(s.solved).toBe(true)
  })

  it('ignora un ordine che non è una permutazione', () => {
    const s = newProof(der, rng(4))
    expect(setOrder(s, [0, 0, 1, 2])).toBe(s)
  })
})

describe('Vero/Falso Sprint', () => {
  const pool = tfOf(FAKE_MODULES)

  it('60 secondi; la combo alza il moltiplicatore ogni tre risposte giuste', () => {
    expect(multiplier(0)).toBe(1)
    expect(multiplier(3)).toBe(2)
    expect(multiplier(99)).toBe(4)
    let s = startSprint(newSprint(pool, rng(1)), 0)
    expect(remaining(s, 10_000)).toBe(SPRINT_SECONDS - 10)
    for (let i = 0; i < 4; i++) s = answerSprint(s, s.queue[s.index].item.answer, 1000 * (i + 1))
    // tre a ×1 e la quarta a ×2
    expect(s.score).toBe(50)
    expect(s.combo).toBe(4)
    s = answerSprint(s, !s.queue[s.index].item.answer, 6000)
    expect(s.combo).toBe(0)
    expect(s.bestCombo).toBe(4)
    expect(s.answers.filter((a) => !a.correct)).toHaveLength(1)
  })

  it('finisce allo scadere del tempo, e una risposta arrivata tardi non conta', () => {
    let s = startSprint(newSprint(pool, rng(1)), 0)
    s = tickSprint(s, 59_000)
    expect(s.endedAt).toBeNull()
    s = tickSprint(s, 60_000)
    expect(s.endedAt).toBe(60_000)
    expect(s.reason).toBe('tempo')
    const late = startSprint(newSprint(pool, rng(1)), 0)
    const after = answerSprint(late, true, 61_000)
    expect(after.answers).toHaveLength(0)
    expect(after.reason).toBe('tempo')
  })

  it('finite le domande prima del tempo, i secondi rimasti diventano bonus', () => {
    let s = startSprint(newSprint(pool.slice(0, 2), rng(1)), 0)
    s = answerSprint(s, s.queue[0].item.answer, 5_000)
    s = answerSprint(s, s.queue[1].item.answer, 10_000)
    expect(s.reason).toBe('domande')
    expect(s.timeBonus).toBe(100)
    expect(s.score).toBe(120)
  })

  it('in pausa il tempo si ferma', () => {
    let s = startSprint(newSprint(pool, rng(1)), 0)
    s = pauseSprint(s, 10_000)
    expect(remaining(s, 40_000)).toBe(50)
    s = resumeSprint(s, 40_000)
    expect(remaining(s, 45_000)).toBe(45)
    expect(answerSprint(pauseSprint(s, 46_000), true, 47_000).answers).toHaveLength(0)
  })
})

describe('Chi sono?', () => {
  const pool = glossaryOf(FAKE_MODULES)

  it('riconosce il termine in italiano o in inglese, con piccoli errori di battitura', () => {
    const entry = { term: 'Larghezza della finestra', en: 'window width, bandwidth', def: '' }
    expect(matchesTerm('larghezza della finestra', entry)).toBe(true)
    expect(matchesTerm('Bandwidth', entry)).toBe(true)
    expect(matchesTerm('larghezza dela finestra', entry)).toBe(true)
    expect(matchesTerm('finestra', entry)).toBe(false)
    expect(matchesTerm('', entry)).toBe(false)
    const kde = { term: 'Stima a finestre di Parzen', en: 'Parzen windows estimation, kernel density estimation (KDE)', def: '' }
    expect(matchesTerm('KDE', kde)).toBe(true)
    expect(matchesTerm('kernel density estimation', kde)).toBe(true)
  })

  it('le iniziali tengono la prima lettera di ogni parola; la definizione non svela il termine', () => {
    expect(initials('Larghezza della finestra')).toBe('L________ d____ f_______')
    expect(initials('Kernel sinc²')).toBe('K_____ s___²')
    expect(maskTerm('Il bandwidth decide tutto; $h$ è la larghezza della finestra.', { term: 'Larghezza della finestra', en: 'bandwidth', def: '' })).toBe(
      'Il ▢▢▢ decide tutto; $h$ è la ▢▢▢.',
    )
  })

  it('ogni indizio in più vale meno punti; lo sbaglio apre il prossimo indizio', () => {
    let s = newWho(pool, rng(7), 3)
    expect(s.rounds).toHaveLength(3)
    expect(s.rounds[0].options).toHaveLength(4)
    const first = currentWho(s)
    s = guess(s, first.term)
    expect(s.outcome?.points).toBe(HINT_POINTS[0])
    s = nextWho(s)
    s = guess(s, 'sicuramente sbagliato')
    expect(s.stage).toBe(1)
    expect(s.tries).toEqual(['sicuramente sbagliato'])
    s = moreHint(s)
    expect(s.stage).toBe(2)
    s = guess(s, currentWho(s).en.split(',')[0])
    expect(s.outcome?.points).toBe(HINT_POINTS[2])
    expect(s.score).toBe(HINT_POINTS[0] + HINT_POINTS[2])
  })

  it('alle quattro opzioni una scelta sbagliata chiude il turno a zero; arrendersi vale zero', () => {
    let s = newWho(pool, rng(7), 2)
    s = moreHint(moreHint(moreHint(s)))
    expect(s.stage).toBe(3)
    const round = s.rounds[s.index]
    s = pickWho(s, (round.answer + 1) % round.options.length)
    expect(s.outcome).toMatchObject({ solved: false, points: 0 })
    s = giveUp(nextWho(s))
    expect(s.outcome).toMatchObject({ solved: false, points: 0 })
    expect(whoOver(nextWho(s))).toBe(true)
  })

  function currentWho(s: ReturnType<typeof newWho>) {
    return s.rounds[s.index].entry.item
  }
})

describe('Palestra esercizi', () => {
  const pool = exercisesOf(FAKE_MODULES)

  it('parte dal livello scelto, sale dopo tre risolti di fila e scende dopo due falliti', () => {
    let s = newGym(pool, rng(1), 1)
    expect(currentPick(s)?.exercise.difficulty).toBe(1)
    s = recordGym(s, true, pool, rng(2))
    s = recordGym(s, true, pool, rng(3))
    expect(s.level).toBe(1)
    s = recordGym(s, true, pool, rng(4))
    expect(s.level).toBe(2)
    expect(s.event).toBe('su')
    expect(currentPick(s)?.exercise.difficulty).toBe(2)
    s = recordGym(s, false, pool, rng(5))
    s = recordGym(s, false, pool, rng(6))
    expect(s.level).toBe(1)
    expect(s.event).toBe('giu')
    // punti: 10 per livello più 5 per ogni risolto di fila prima (fino a 4)
    expect(s.score).toBe(10 + 15 + 20)
  })

  it('una serie dura dieci esercizi; la successiva riparte dal livello raggiunto', () => {
    let s = newGym(pool, rng(1), 3)
    expect(currentPick(s)?.exercise.difficulty).toBe(3)
    for (let i = 0; i < 10; i++) s = recordGym(s, i % 2 === 0, pool, rng(10 + i))
    expect(gymOver(s)).toBe(true)
    expect(s.results).toHaveLength(10)
    const next = nextSeries(s, pool, rng(99))
    expect(next.results).toHaveLength(0)
    expect(next.level).toBe(s.level)
    expect(gymOver(next)).toBe(false)
  })

  it('senza esercizi del livello chiesto prende il più vicino', () => {
    const s = newGym(exercisesOf([cnn]), rng(1), 1)
    expect(currentPick(s)?.exercise.difficulty).toBe(3)
  })
})

describe('Smista i concetti', () => {
  it('con più regioni smista per docente, con una regione per foglio, con un foglio non si gioca', () => {
    expect(sortPlan(FAKE_MODULES, ALL_SCOPE)).toMatchObject({ ok: true, mode: 'docente' })
    expect(sortPlan(inScope(FAKE_MODULES, { course: 'melgani', moduleId: null }), { course: 'melgani', moduleId: null })).toMatchObject({ ok: true, mode: 'foglio' })
    const one = sortPlan([parzen], { course: 'melgani', moduleId: parzen.id })
    expect(one.ok).toBe(false)
    expect(sortPlan([kernels], { course: 'passerini', moduleId: null }).ok).toBe(false)
    expect(sortPlan([parzen], ALL_SCOPE).ok).toBe(false)
  })

  it('giusta al primo colpo 10, al secondo 5; lo sbaglio lascia la carta in mano', () => {
    let s = newSort(FAKE_MODULES, ALL_SCOPE, rng(3), 6)!
    expect(s.mode).toBe('docente')
    expect(s.cards.length).toBeGreaterThan(0)
    // nessuna carta con lo stesso testo in due contenitori
    const texts = s.cards.map((c) => normalize(c.text))
    expect(new Set(texts).size).toBe(texts.length)
    const card = s.cards[0]
    const wrongBin = s.bins.find((b) => b.id !== card.bin)!.id
    s = place(s, wrongBin)
    expect(s.index).toBe(0)
    expect(s.mistakes).toBe(1)
    expect(s.last).toMatchObject({ correct: false })
    s = place(s, card.bin)
    expect(s.index).toBe(1)
    expect(s.score).toBe(5)
    while (!sortOver(s)) s = place(s, s.cards[s.index].bin)
    expect(s.score).toBe(5 + 10 * (s.cards.length - 1))
  })
})

describe('catalogo', () => {
  it('ha sette giochi con percorsi diversi', () => {
    expect(GAMES).toHaveLength(7)
    expect(new Set(GAMES.map((g) => g.slug)).size).toBe(7)
  })

  it('dice quanto materiale c\'è e se basta per giocare', () => {
    expect(availability('formula-match', FAKE_MODULES, ALL_SCOPE)).toMatchObject({ count: 6, playable: true })
    expect(availability('formula-match', [cnn], { course: 'ricci', moduleId: null })).toMatchObject({ count: 1, playable: false })
    expect(availability('vero-falso', [kernels], { course: 'passerini', moduleId: null }).playable).toBe(false)
    expect(availability('smista-i-concetti', [parzen], ALL_SCOPE).playable).toBe(false)
    expect(availability('palestra', [], ALL_SCOPE)).toMatchObject({ count: 0, playable: false })
    for (const game of GAMES) expect(availability(game.slug, FAKE_MODULES, ALL_SCOPE).playable).toBe(true)
  })
})

describe('Chi sono? senza sinonimi (regressione)', () => {
  it('lo stesso concetto con due grafie vale una volta: una risposta non ha mai un suo sinonimo fra le opzioni', () => {
    const a = { ...knn, glossary: [{ term: 'Sovradattamento', en: 'overfitting', def: 'Da K-NN.' }, { term: 'Semidefinita positiva', en: 'positive semi-definite', def: 'x' }] }
    const b = { ...parzen, glossary: [{ term: 'Overfitting (sovradattamento)', en: 'Overfitting', def: 'Da Parzen.' }, { term: 'Matrice semidefinita', en: 'positive semidefinite', def: 'y' }] }
    const c = { ...kernels, glossary: [{ term: 'Stima a massima verosimiglianza', en: 'Maximum Likelihood Estimation (MLE)', def: 'z' }, { term: 'Stima a massima verosimiglianza', en: 'maximum likelihood (ML) estimation', def: 'w' }] }
    const pool = glossaryOf([a, b, c])
    expect(pool.map((g) => g.item.term)).toEqual(['Sovradattamento', 'Semidefinita positiva', 'Stima a massima verosimiglianza'])
  })
})
