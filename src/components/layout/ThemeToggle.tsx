import { useState } from 'react'
import { applyThemeChoice, readThemeChoice, type ThemeChoice } from '../../lib/theme'

const CHOICES: { value: ThemeChoice; label: string }[] = [
  { value: 'light', label: 'Giorno' },
  { value: 'dark', label: 'Notte' },
  { value: 'system', label: 'Sistema' },
]

export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>(readThemeChoice)

  return (
    <fieldset className="m-0 flex border border-border-strong p-0">
      <legend className="visually-hidden">Tema</legend>
      {CHOICES.map(({ value, label }) => (
        <label
          key={value}
          className="label cursor-pointer px-3 py-2 has-[:checked]:bg-accent has-[:checked]:text-accent-contrast has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
        >
          <input
            type="radio"
            name="tema"
            value={value}
            checked={choice === value}
            onChange={() => {
              setChoice(value)
              applyThemeChoice(value)
            }}
            className="visually-hidden"
          />
          {label}
        </label>
      ))}
    </fieldset>
  )
}
