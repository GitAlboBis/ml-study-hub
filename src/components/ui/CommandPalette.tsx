// Palette di ricerca (Ctrl+K o ⌘K, Esc per chiudere). Per ora c'è solo il campo: la ricerca con minisearch su
// titoli, sezioni, formule, glossario, flashcard e domande (Task 5.7) riempirà l'area dei risultati.
// Nessuna animazione di apertura: si apre da tastiera decine di volte al giorno e deve essere istantanea.
// Dai connettori (21st.dev "Command Palette", "Command Menu", originui "Command") nessun codice preso: sono tutti
// su cmdk o Radix Dialog; qui bastano <dialog> nativo, un campo di ricerca e una regione di stato.
import { useId, useRef, useState } from 'react'
import { closeDialog, useModalDialog } from './useModalDialog'

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [query, setQuery] = useState('')
  const titleId = useId()
  useModalDialog(dialog)
  const requestClose = () => closeDialog(dialog.current, onClose)
  const q = query.trim()

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return
        e.preventDefault()
        requestClose()
      }}
      // clic sul fondale: il bersaglio è il dialogo stesso, non il suo contenuto
      onClick={(e) => e.target === e.currentTarget && requestClose()}
      className="mx-auto mt-[12dvh] mb-auto w-[min(40rem,calc(100vw-2rem))] max-w-none border border-border-strong bg-surface p-0 text-text shadow-2 backdrop:bg-bg/75"
    >
      <h2 id={titleId} className="visually-hidden">
        Cerca nell'atlante
      </h2>
      <form
        role="search"
        onSubmit={(e) => e.preventDefault()}
        className="flex items-center gap-3 border-b border-border-strong px-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-focus"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true" className="shrink-0 text-muted">
          <path d="M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM15.5 15.5L21 21" />
        </svg>
        <input
          type="search"
          // il fuoco va nel campo appena la palette si apre (showModal rispetta autofocus)
          autoFocus
          aria-label="Cerca nell'atlante"
          placeholder="Formule, termini, fogli…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-h-14 min-w-0 flex-1 bg-transparent text-[length:var(--step-1)] text-text outline-none placeholder:text-faint focus-visible:outline-none"
        />
        <kbd className="num border border-border px-1.5 text-[length:var(--step--1)] text-muted" aria-hidden="true">
          Esc
        </kbd>
      </form>
      <p role="status" className="m-0 p-4 text-muted">
        {q
          ? `Nessun risultato per «${q}»: la ricerca nei contenuti è in preparazione.`
          : "La ricerca in formule, glossario, flashcard e domande d'orale è in preparazione. Per ora apri un foglio dall'indice."}
      </p>
    </dialog>
  )
}
