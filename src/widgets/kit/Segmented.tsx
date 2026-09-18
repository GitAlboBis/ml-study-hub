// Scelta fra poche alternative (il kernel, il criterio, la velocità): tasselli affiancati, quello
// scelto pieno d'inchiostro. Sotto ci sono dei radio nativi: un solo arresto del Tab, frecce per
// scegliere, stato annunciato dal browser. È lo stesso schema di ThemeToggle.
//
// Connettori consultati (21st.dev "segmented control", ui-layouts "tabs", Magic UI): i controlli
// trovati hanno il pollice che scivola da un'opzione all'altra, angoli arrotondati e ombra. Qui il
// pollice animato non c'è di proposito: la scelta si fa spesso e con le frecce, e un'azione da
// tastiera non si anima. Dai connettori resta la semantica: radiogroup con nome, radio nativi.
//
// I tasselli vanno a capo se non ci stanno (quattro kernel su un telefono): i filetti fra l'uno e
// l'altro sono lo sfondo a inchiostro che si vede nello spazio di 1 px, così reggono anche l'a capo.
import { M } from '../../components/content/M'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  /** Simbolo in LaTeX davanti all'etichetta. Decorativo per i lettori di schermo: `label` deve bastare. */
  latex?: string
}

export interface SegmentedProps<T extends string> {
  /** Anche `name` dei radio: unico nella pagina. */
  id: string
  label: string
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Nasconde l'etichetta visibile (resta il nome accessibile del gruppo). */
  hideLabel?: boolean
  /** Etichetta a sinistra dei tasselli invece che sopra, per le barre strette come il trasporto. */
  inline?: boolean
  disabled?: boolean
}

export function Segmented<T extends string>({ id, label, options, value, onChange, hideLabel = false, inline = false, disabled = false }: SegmentedProps<T>) {
  const labelId = `${id}-label`
  return (
    <div className={inline ? 'relative flex items-center gap-2' : 'relative grid gap-1.5'}>
      <span id={labelId} className={hideLabel ? 'visually-hidden' : 'label'}>
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className={`flex flex-wrap gap-px border border-border-strong bg-border-strong ${disabled ? 'opacity-45' : ''}`}
      >
        {options.map((o) => (
          <label
            key={o.value}
            className="label relative flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 min-w-0 bg-surface px-3 py-1.5 text-center text-text [text-wrap:balance] hover:bg-surface-2 has-[:checked]:bg-accent has-[:checked]:text-accent-contrast has-[:checked]:hover:bg-accent has-[:disabled]:cursor-not-allowed has-[:focus-visible]:z-10 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
          >
            <input
              type="radio"
              name={id}
              value={o.value}
              checked={o.value === value}
              disabled={disabled}
              onChange={() => onChange(o.value)}
              className="visually-hidden"
            />
            {o.latex !== undefined && (
              // La matematica non eredita maiuscolo e spaziatura dell'etichetta. È per gli occhi: il nome
              // accessibile dell'opzione è `label`, che deve bastare da solo.
              <span aria-hidden="true" className="tracking-normal normal-case">
                <M tex={o.latex} />
              </span>
            )}
            {o.label}
          </label>
        ))}
      </div>
    </div>
  )
}
