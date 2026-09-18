// La mappa dei componenti per l'MDX dei moduli: si passa a <MDXProvider components={mdxComponents}> oppure
// direttamente al contenuto (<Content components={mdxComponents} />), dentro <ModuleContext value={data}>.
// I nomi sono l'API per gli autori e coincidono con la whitelist COMPONENTS di scripts/validate-module.ts
// e con la tabella di docs/CONTENT_GUIDE.md: aggiungerne o toglierne uno qui vuol dire cambiare anche là.
import type { MDXComponents } from 'mdx/types'
import { Callout } from './Callout'
import { Check } from './Check'
import { Col, Columns } from './Columns'
import { Definition } from './Definition'
import { Derivation } from './Derivation'
import { Example, Step } from './Example'
import { Figure } from './Figure'
import { Formula } from './Formula'
import { KeyIdea } from './KeyIdea'
import { ModLink } from './ModLink'
import { Proof } from './Proof'
import { Reveal } from './Reveal'
import { SourceRef } from './SourceRef'
import { Term } from './Term'
import { Widget } from './Widget'

export const mdxComponents = {
  Formula,
  Derivation,
  Figure,
  Widget,
  Example,
  Step,
  Callout,
  Definition,
  KeyIdea,
  Reveal,
  Proof,
  Check,
  SourceRef,
  ModLink,
  Term,
  Columns,
  Col,
} satisfies MDXComponents
