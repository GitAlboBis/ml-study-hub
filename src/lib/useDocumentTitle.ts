// Titolo della finestra. La shell mette quello della rotta (handle.title) in un layout effect; una pagina che sa
// qualcosa di più (il foglio aperto, la pagina della fonte) lo sovrascrive con questo hook, che gira dopo.
import { useEffect } from 'react'
import { useLocation } from 'react-router'

export const APP_NAME = 'ML Study Hub'

export const documentTitle = (title: string | null | undefined) => (title ? `${title} · ${APP_NAME}` : `${APP_NAME} · Atlante di Machine Learning`)

export function useDocumentTitle(title: string | null | undefined): void {
  // anche il percorso: cambiando scheda la shell rimette il titolo della rotta, e la pagina deve riprenderselo
  const { pathname } = useLocation()
  useEffect(() => {
    document.title = documentTitle(title)
  }, [title, pathname])
}
