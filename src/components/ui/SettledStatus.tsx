// Regione live per un conteggio che cambia mentre si scrive (risultati di una ricerca, di un filtro): annuncia il
// testo solo quando smette di cambiare (useSettledValue), così un lettore di schermo dice il conteggio una volta e
// non uno per lettera. È invisibile: il conteggio a vista lo scrive la pagina accanto, con aria-hidden.
// Va montata insieme al conteggio a vista: il primo testo è quello del montaggio e non si annuncia.
import { useSettledValue } from '../../lib/useSettledValue'

export function SettledStatus({ text, label }: { text: string; label?: string }) {
  const settled = useSettledValue(text)
  return (
    <p role="status" aria-label={label} className="visually-hidden">
      {settled}
    </p>
  )
}
