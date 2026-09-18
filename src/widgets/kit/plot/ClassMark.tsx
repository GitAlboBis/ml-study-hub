// Il marcatore di classe sui segni che non sono punti (curve, aree, frecce, barre, istogrammi): la forma della
// classe con l'anello di superficie, come un punto dei Dots. Fa da etichetta diretta: dice di che classe è il segno
// senza passare dal colore, che per blu e viola non basta a chi è deuteranope (DESIGN-NOTES, regola 7).
// Non è un bersaglio (pointerEvents none) e non è letto dai lettori di schermo: la classe arriva a parole dalle
// letture del cursore-quota e dalla descrizione del grafico.
import { motion } from 'motion/react'
import { classMarker } from './marks'

export interface ClassMarkProps {
  /** indice di classe (0-5) */
  cls: number
  /** centro, in pixel dell'area interna */
  x: number
  y: number
  /** compare in dissolvenza dopo tanti millisecondi (quando la curva sotto si sta ancora tracciando) */
  appearAfterMs?: number
}

const r2 = (v: number) => Math.round(v * 100) / 100

export function ClassMark({ cls, x, y, appearAfterMs }: ClassMarkProps) {
  const mark = classMarker(cls)
  return (
    <g transform={`translate(${r2(x)},${r2(y)})`} pointerEvents="none" aria-hidden="true">
      {appearAfterMs === undefined ? (
        <path data-class-mark={cls} {...mark} />
      ) : (
        <motion.path data-class-mark={cls} {...mark} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: appearAfterMs / 1000, duration: 0.2, ease: 'easeOut' }} />
      )}
    </g>
  )
}
