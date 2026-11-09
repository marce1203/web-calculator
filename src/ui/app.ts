import { getDisplay, initialState, keyFromKeyboard, press } from '../calculator'
import type { CalculatorKey, CalculatorState } from '../calculator'

interface ButtonDefinition {
  key: CalculatorKey
  label: string
  ariaLabel?: string
  kind?: 'utility' | 'operator' | 'equals'
}

const buttons: ButtonDefinition[] = [
  { key: 'AC', label: 'AC', ariaLabel: 'borrar todo', kind: 'utility' },
  { key: '±', label: '±', ariaLabel: 'cambiar signo', kind: 'utility' },
  { key: '%', label: '%', ariaLabel: 'porcentaje', kind: 'utility' },
  { key: '÷', label: '÷', ariaLabel: 'dividir', kind: 'operator' },
  { key: '7', label: '7' },
  { key: '8', label: '8' },
  { key: '9', label: '9' },
  { key: '×', label: '×', ariaLabel: 'multiplicar', kind: 'operator' },
  { key: '4', label: '4' },
  { key: '5', label: '5' },
  { key: '6', label: '6' },
  { key: '−', label: '−', ariaLabel: 'restar', kind: 'operator' },
  { key: '1', label: '1' },
  { key: '2', label: '2' },
  { key: '3', label: '3' },
  { key: '+', label: '+', ariaLabel: 'sumar', kind: 'operator' },
  { key: '⌫', label: '⌫', ariaLabel: 'borrar último dígito', kind: 'utility' },
  { key: '0', label: '0' },
  { key: ',', label: ',', ariaLabel: 'coma decimal' },
  { key: '=', label: '=', ariaLabel: 'igual', kind: 'equals' },
]

function valueSize(value: string): string {
  if (value.length > 25) return 'display-value display-value--smallest'
  if (value.length > 16) return 'display-value display-value--smaller'
  if (value.length > 11) return 'display-value display-value--small'
  return 'display-value'
}

export function createCalculator(root: HTMLElement): () => void {
  root.innerHTML = `
    <section class="calculator" aria-label="Calculadora">
      <div class="display" aria-label="Pantalla de la calculadora">
        <div class="display-expression" data-expression aria-hidden="true">&nbsp;</div>
        <output class="display-value" data-value aria-live="polite" aria-atomic="true">0</output>
      </div>
      <div class="keypad" data-keypad></div>
      <p class="keyboard-hint">También podés usar el teclado</p>
    </section>
  `

  const keypad = root.querySelector<HTMLElement>('[data-keypad]')
  const expressionElement = root.querySelector<HTMLElement>('[data-expression]')
  const valueElement = root.querySelector<HTMLOutputElement>('[data-value]')
  if (!keypad || !expressionElement || !valueElement) {
    throw new Error('No se pudo crear la calculadora')
  }

  for (const definition of buttons) {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = definition.label
    button.dataset.key = definition.key
    button.className = `key${definition.kind ? ` key--${definition.kind}` : ''}`
    if (definition.ariaLabel) button.setAttribute('aria-label', definition.ariaLabel)
    keypad.append(button)
  }

  let state: CalculatorState = { ...initialState }

  const render = () => {
    const display = getDisplay(state)
    expressionElement.textContent = display.expression || '\u00a0'
    valueElement.textContent = display.value
    valueElement.className = valueSize(display.value)
  }

  const handleKey = (key: CalculatorKey) => {
    state = press(state, key)
    render()
  }

  const onClick = (event: Event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('button[data-key]')
    if (button && root.contains(button)) handleKey(button.dataset.key as CalculatorKey)
  }

  const onKeydown = (event: KeyboardEvent) => {
    const key = keyFromKeyboard(event.key)
    if (!key) return
    event.preventDefault()
    handleKey(key)
  }

  keypad.addEventListener('click', onClick)
  document.addEventListener('keydown', onKeydown)
  render()

  return () => {
    keypad.removeEventListener('click', onClick)
    document.removeEventListener('keydown', onKeydown)
  }
}
