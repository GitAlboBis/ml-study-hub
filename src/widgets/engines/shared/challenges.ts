// Le sfide comuni dei motori (CommonChallenge in types.ts): come si decidono. Logica pura, senza React.
// ChallengeRunner la disegna; presetContract la usa per controllare che lo stato iniziale non basti.
import { sortOutcome } from './dragKeyboard'
import type { Placement } from './dragKeyboard'
import type { CommonChallenge, CommonChallengeKind } from './types'

/** La risposta dello studente, per le sfide che ne vogliono una (predict, sort, compute). */
export type ChallengeAnswer =
  | { kind: 'number'; value: number }
  | { kind: 'point'; value: readonly [number, number] }
  | { kind: 'option'; index: number }
  /** dove sta ogni chip (la Placement di DragBins): null o assente = ancora nel vassoio */
  | { kind: 'placement'; bins: Placement }

/** L'esito di una verifica, con i numeri da mostrare accanto (il tuo valore, l'obiettivo, lo scarto). */
export type ChallengeOutcome =
  | { kind: 'custom'; passed: boolean }
  | { kind: 'find'; passed: boolean; score: number; target: number; gap: number; tolerance: number }
  | {
      kind: 'predict'
      passed: boolean
      /** false: la previsione manca */
      answered: boolean
      truth: number | readonly [number, number]
      /** distanza fra previsione e verità (0 o 1 per le opzioni); NaN senza previsione */
      distance: number
      /** punteggio fra 0 e 1 (vedi predictPoints) */
      points: number
    }
  | { kind: 'sort'; passed: boolean; placed: number; wrong: string[]; missing: string[] }
  | { kind: 'compute'; passed: boolean; answered: boolean; expected: number; gap: number; direction: 'high' | 'low' | 'ok' }

export const COMMON_CHALLENGE_KINDS: readonly CommonChallengeKind[] = ['custom', 'find', 'predict', 'sort', 'compute']

/** Vero se la sfida di un motore è una delle comuni, che ChallengeRunner sa disegnare. */
export function isCommonChallenge<State>(ch: { kind: string }): ch is CommonChallenge<State> {
  return (COMMON_CHALLENGE_KINDS as readonly string[]).includes(ch.kind)
}

/** Confronto con la tolleranza che non si fa ingannare dal rumore in virgola mobile (0.3 + 0.4 contro 0.7). */
const within = (d: number, tol: number) => Number.isFinite(d) && d <= tol + 1e-9 * Math.max(1, Math.abs(tol))

/**
 * Punteggio di una previsione: 'exact' 1 entro la tolleranza e 0 fuori; 'distance' 1 entro la tolleranza, poi scende
 * in linea retta fino a 0 a tre tolleranze. Con tolleranza zero conta solo il colpo esatto.
 */
export function predictPoints(distance: number, tolerance: number, mode: 'distance' | 'exact' = 'exact'): number {
  if (!Number.isFinite(distance)) return 0
  if (within(distance, tolerance)) return 1
  if (mode === 'exact' || !(tolerance > 0)) return 0
  // al milionesimo: il rumore in virgola mobile non deve lasciare 1e-16 punti a chi è a tre tolleranze
  return Math.max(0, Math.round((1 - (distance - tolerance) / (2 * tolerance)) * 1e6) / 1e6)
}

const isPair = (v: unknown): v is readonly [number, number] => Array.isArray(v) && v.length === 2

/** Decide una sfida comune sullo stato e sulla risposta dello studente. */
export function evaluateChallenge<State>(ch: CommonChallenge<State>, state: State, answer?: ChallengeAnswer): ChallengeOutcome {
  switch (ch.kind) {
    case 'custom':
      return { kind: 'custom', passed: ch.check(state) }
    case 'find': {
      const score = ch.score(state)
      const target = ch.target(state)
      const gap = Math.abs(score - target)
      return { kind: 'find', passed: within(gap, ch.tolerance), score, target, gap, tolerance: ch.tolerance }
    }
    case 'predict': {
      const truth = ch.truth(state)
      let distance = Number.NaN
      if (typeof ch.input === 'object') {
        if (answer?.kind === 'option' && typeof truth === 'number') distance = answer.index === truth ? 0 : 1
      } else if (ch.input === 'click-xy') {
        if (answer?.kind === 'point' && isPair(truth)) distance = Math.hypot(answer.value[0] - truth[0], answer.value[1] - truth[1])
      } else if (answer?.kind === 'number' && typeof truth === 'number') {
        distance = Math.abs(answer.value - truth)
      }
      const answered = !Number.isNaN(distance)
      const options = typeof ch.input === 'object'
      const passed = options ? distance === 0 : within(distance, ch.tolerance)
      const points = options ? (passed ? 1 : 0) : predictPoints(distance, ch.tolerance, ch.points)
      return { kind: 'predict', passed: answered && passed, answered, truth, distance, points }
    }
    case 'sort': {
      // lo stesso esito che DragBins mostra chip per chip (sortOutcome): un chip nel vassoio manca, non è sbagliato
      const o = sortOutcome(answer?.kind === 'placement' ? answer.bins : {}, ch.items.map((i) => i.id), ch.answer)
      return { kind: 'sort', passed: o.allCorrect, placed: o.correct.length + o.wrong.length, wrong: o.wrong, missing: o.missing }
    }
    case 'compute': {
      const expected = ch.answer(state)
      if (answer?.kind !== 'number' || !Number.isFinite(answer.value)) return { kind: 'compute', passed: false, answered: false, expected, gap: Number.NaN, direction: 'ok' }
      const gap = Math.abs(answer.value - expected)
      const passed = within(gap, ch.tolerance)
      return { kind: 'compute', passed, answered: true, expected, gap, direction: passed ? 'ok' : answer.value > expected ? 'high' : 'low' }
    }
  }
}

/**
 * Che cosa non va in una sfida comune, in parole (vuoto se è sana): la regola 8 del contratto dei preset.
 * - custom e find non devono essere superate dallo stato iniziale (altrimenti basta premere Verifica): senza
 *   `initialState` non si possono controllare, e anche questo è un problema;
 * - predict, sort e compute vogliono una risposta: si controlla che siano ben formate (verità finite, opzione
 *   giusta fra le opzioni, ogni chip con un contenitore esistente, tolleranze non negative).
 */
export function challengeProblems<State>(ch: CommonChallenge<State>, initialState: State | undefined): string[] {
  const out: string[] = []
  const needState = () => out.push(`sfida ${ch.kind}: manca lo stato iniziale per controllare che non basti a superarla`)
  const badTolerance = (t: number) => !(t >= 0 && Number.isFinite(t))
  switch (ch.kind) {
    case 'custom':
      if (initialState === undefined) needState()
      else if (ch.check(initialState)) out.push('sfida custom: lo stato iniziale la supera già')
      break
    case 'find':
      if (badTolerance(ch.tolerance)) out.push(`sfida find: tolleranza non valida (${ch.tolerance})`)
      if (initialState === undefined) needState()
      else {
        const o = evaluateChallenge(ch, initialState)
        if (o.kind === 'find' && (!Number.isFinite(o.score) || !Number.isFinite(o.target))) out.push('sfida find: punteggio o obiettivo non finiti nello stato iniziale')
        if (o.passed) out.push('sfida find: lo stato iniziale la supera già')
      }
      break
    case 'predict': {
      if (badTolerance(ch.tolerance)) out.push(`sfida predict: tolleranza non valida (${ch.tolerance})`)
      if (initialState === undefined) break
      const truth = ch.truth(initialState)
      if (typeof ch.input === 'object') {
        const n = ch.input.options.length
        if (n < 2) out.push('sfida predict: servono almeno due opzioni')
        if (typeof truth !== 'number' || !Number.isInteger(truth) || truth < 0 || truth >= n) out.push(`sfida predict: la verità ${String(truth)} non è l'indice di una delle ${n} opzioni`)
      } else if (ch.input === 'click-xy') {
        if (!isPair(truth) || !truth.every(Number.isFinite)) out.push('sfida predict: con click-xy la verità è una coppia di numeri finiti')
      } else if (typeof truth !== 'number' || !Number.isFinite(truth)) {
        out.push('sfida predict: la verità deve essere un numero finito')
      }
      break
    }
    case 'sort': {
      const bins = new Set(ch.bins.map((b) => b.id))
      const items = new Set(ch.items.map((i) => i.id))
      if (ch.items.length === 0) out.push('sfida sort: nessun chip da smistare')
      if (bins.size < 2) out.push('sfida sort: servono almeno due contenitori')
      if (items.size !== ch.items.length || bins.size !== ch.bins.length) out.push('sfida sort: id di chip o contenitori ripetuti')
      for (const i of ch.items) if (!bins.has(ch.answer[i.id] ?? '')) out.push(`sfida sort: il chip ${i.id} non ha un contenitore esistente nella risposta`)
      for (const id of Object.keys(ch.explain ?? {})) if (!items.has(id)) out.push(`sfida sort: spiegazione per un chip che non esiste (${id})`)
      break
    }
    case 'compute':
      if (badTolerance(ch.tolerance)) out.push(`sfida compute: tolleranza non valida (${ch.tolerance})`)
      if (initialState !== undefined && !Number.isFinite(ch.answer(initialState))) out.push('sfida compute: la risposta attesa non è un numero finito nello stato iniziale')
      break
  }
  return out
}
