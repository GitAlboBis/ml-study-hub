// Scheda Flashcard del foglio: il mazzo delle carte del modulo con ripetizione dilazionata. La coda
// (le carte in scadenza oggi) la decide FlashcardDeck; qui ci sono la testata e le letture del mazzo,
// che scendono mentre si ripassa.
import { useId, useMemo, useState } from 'react'
import { FlashcardDeck } from '../../components/practice/FlashcardDeck'
import { dueQueue } from '../../components/practice/logic'
import type { DeckEntry } from '../../components/practice/logic'
import { PracticeHeader, Reading } from '../../components/practice/parts'
import type { ModuleData } from '../../content/types'
import { progressKey, useProgress } from '../../store/progress'

export default function TabFlashcard({ data }: { data: ModuleData }) {
  const headingId = useId()
  const srs = useProgress((s) => s.flashcards)
  const entries = useMemo<DeckEntry[]>(() => data.flashcards.map((card) => ({ key: progressKey(data.id, card.id), card })), [data])

  // l'ora dell'apertura della scheda: le carte votate scadono dopo, quindi il conto scende mentre si ripassa
  const [openedAt] = useState(() => Date.now())
  const due = dueQueue(entries, srs, openedAt).length
  const unseen = entries.filter((e) => !srs[e.key]).length

  return (
    <section aria-labelledby={headingId} className="grid max-w-[48rem] gap-6">
      <PracticeHeader
        id={headingId}
        title="Flashcard"
        en="flashcards"
        lead="Gira la carta, confronta con la tua risposta e datti un voto: ogni carta torna quando stai per dimenticarla (ripetizione dilazionata, spaced repetition)."
      >
        {entries.length > 0 && (
          <>
            <Reading label="Nel mazzo" value={entries.length} />
            <Reading label="Da ripassare" value={due} />
            <Reading label="Mai viste" value={unseen} />
          </>
        )}
      </PracticeHeader>
      {/* un mazzo per foglio: cambiando modulo la sessione ricomincia */}
      <FlashcardDeck key={data.id} entries={entries} label={`Flashcard: ${data.title}`} />
    </section>
  )
}
