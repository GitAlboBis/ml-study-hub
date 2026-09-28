// "Rispondi ad alta voce": trascrizione con la Web Speech API (SpeechRecognition, in Chrome ed Edge con il
// prefisso webkit, in Safari; Firefox non la ha). Riconoscimento continuo con risultati provvisori: il testo
// definitivo si accumula, quello provvisorio si riscrive a ogni evento. Chrome chiude la sessione dopo
// qualche secondo di silenzio anche in modalità continua: finché l'utente non ferma, si riapre da sola.
// La trascrizione vive solo nello stato del componente: non si salva da nessuna parte.
import { useCallback, useEffect, useRef, useState } from 'react'

export type SpeechLang = 'en-US' | 'it-IT'

// Tipi minimi: lib.dom non dichiara il costruttore con prefisso e alcune versioni non dichiarano l'API.
interface RecognitionAlternative { transcript: string }
interface RecognitionResult { readonly isFinal: boolean; readonly length: number; [index: number]: RecognitionAlternative }
interface RecognitionResultList { readonly length: number; [index: number]: RecognitionResult }
interface RecognitionEvent { readonly resultIndex: number; readonly results: RecognitionResultList }
interface RecognitionErrorEvent { readonly error: string }
interface Recognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: RecognitionEvent) => void) | null
  onerror: ((e: RecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}
type RecognitionCtor = new () => Recognition

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/** Errori dopo i quali non ha senso riaprire la sessione. */
const FATAL = new Set(['not-allowed', 'service-not-allowed', 'audio-capture', 'language-not-supported', 'network'])

/** Che cosa dire all'utente per ogni errore: il problema e che cosa fare. */
export const SPEECH_ERROR: Record<string, string> = {
  'not-allowed': "Il microfono non è autorizzato. Consenti l'accesso dal lucchetto nella barra degli indirizzi, oppure rispondi con il solo cronometro.",
  'service-not-allowed': 'Il browser non permette la trascrizione su questa pagina. Rispondi ad alta voce con il solo cronometro.',
  'audio-capture': 'Non trovo un microfono. Collegane uno, oppure rispondi con il solo cronometro.',
  'language-not-supported': "Il browser non trascrive in questa lingua. Prova con l'altra.",
  network: 'La trascrizione passa dalla rete, che ora non risponde. Il cronometro continua: rispondi lo stesso.',
}

export interface SpeechAnswer {
  /** il browser ha la Web Speech API */
  supported: boolean
  listening: boolean
  /** testo definitivo, accumulato */
  finalText: string
  /** testo provvisorio della frase in corso */
  interim: string
  /** messaggio per l'utente, se la trascrizione si è fermata per un errore */
  error: string | null
  start(lang: SpeechLang): void
  stop(): void
  clear(): void
}

const join = (a: string, b: string) => [a.trim(), b.trim()].filter(Boolean).join(' ')

export function useSpeechAnswer(): SpeechAnswer {
  const [supported] = useState(() => recognitionCtor() !== null)
  const [listening, setListening] = useState(false)
  const [finalText, setFinalText] = useState('')
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)
  const rec = useRef<Recognition | null>(null)
  /** l'utente vuole ascoltare: se la sessione si chiude da sola, si riapre */
  const wanted = useRef(false)
  const finalRef = useRef('')

  const stop = useCallback(() => {
    wanted.current = false
    setListening(false)
    setInterim('')
    rec.current?.stop()
  }, [])

  const start = useCallback((lang: SpeechLang) => {
    const Ctor = recognitionCtor()
    if (!Ctor) return
    rec.current?.abort()
    const r = new Ctor()
    r.lang = lang
    r.continuous = true
    r.interimResults = true
    r.onresult = (e) => {
      let provisional = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        const text = result[0]?.transcript ?? ''
        if (result.isFinal) finalRef.current = join(finalRef.current, text)
        else provisional += text
      }
      setFinalText(finalRef.current)
      setInterim(provisional.trim())
    }
    r.onerror = (e) => {
      if (FATAL.has(e.error)) {
        wanted.current = false
        setError(SPEECH_ERROR[e.error] ?? 'La trascrizione si è fermata. Rispondi con il solo cronometro.')
      }
      // "no-speech" e "aborted": la sessione si chiude e, se serve, si riapre in onend
    }
    r.onend = () => {
      if (wanted.current && rec.current === r) {
        try {
          r.start()
          return
        } catch {
          wanted.current = false
        }
      }
      if (rec.current === r) {
        setListening(false)
        setInterim('')
      }
    }
    rec.current = r
    wanted.current = true
    setError(null)
    try {
      r.start()
      setListening(true)
    } catch {
      wanted.current = false
      setError('La trascrizione non è partita. Rispondi ad alta voce con il solo cronometro.')
    }
  }, [])

  const clear = useCallback(() => {
    finalRef.current = ''
    setFinalText('')
    setInterim('')
  }, [])

  // uscendo dalla domanda il microfono si chiude
  useEffect(
    () => () => {
      wanted.current = false
      rec.current?.abort()
      rec.current = null
    },
    [],
  )

  return { supported, listening, finalText, interim, error, start, stop, clear }
}
