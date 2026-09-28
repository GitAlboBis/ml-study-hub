// "Riduci il movimento" per le pagine dell'app: vale se lo chiede il sistema (prefers-reduced-motion) oppure la
// casella delle Impostazioni (usePreferences().reduceMotion). La casella da sola mette data-motion="ridotto" su
// <html> e ferma le transizioni CSS, ma non le animazioni di motion né gli scrollIntoView con behavior 'smooth':
// giochi e pratica leggono questo hook, non solo la media query.
import { usePreferences } from '../store/preferences'
import { useReducedMotion } from '../widgets/kit/useReducedMotion'

export function useReduceMotion(): boolean {
  const system = useReducedMotion()
  const app = usePreferences((s) => s.reduceMotion)
  return system || app
}

/** Il valore per <MotionConfig reducedMotion>: 'always' quando il movimento va ridotto, altrimenti segue il sistema. */
export const motionConfigOf = (reduced: boolean): 'always' | 'user' => (reduced ? 'always' : 'user')
