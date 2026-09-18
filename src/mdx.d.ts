// Tipi dei moduli .mdx compilati da @mdx-js/rollup (vedi vite.config.ts).
//
// 1. tsconfig.app.json limita "types" a vite/client, quindi @types/mdx non viene caricato da solo:
//    la direttiva qui sotto lo include e dichiara `*.mdx` come
//    `export default function MDXContent(props: MDXProps): JSX.Element`.
// 2. @types/mdx si appoggia al namespace JSX, che React 19 non espone piu come globale: senza
//    l'augmentation `MDXContent` e `MDXComponents` di 'mdx/types' degradano ad `any` in silenzio
//    (skipLibCheck nasconde l'errore). E il rimedio indicato dalla guida MDX per TypeScript.
/// <reference types="mdx" />
import * as React from 'react'

declare module 'mdx/types.js' {
  export import JSX = React.JSX
}
