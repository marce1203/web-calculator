import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createCalculator } from '../src/ui/app'

describe('interfaz', () => {
  let cleanup: () => void

  beforeEach(() => {
    document.body.innerHTML = '<main id="app"></main>'
    cleanup = createCalculator(document.querySelector('#app') as HTMLElement)
  })

  afterEach(() => cleanup())

  function value(): string {
    return document.querySelector('[data-value]')?.textContent ?? ''
  }

  function clickKeys(keys: string[]): void {
    for (const key of keys) {
      document.querySelector<HTMLButtonElement>(`button[data-key="${key}"]`)?.click()
    }
  }

  it('produce el mismo resultado con clics y teclado', () => {
    clickKeys(['2', '+', '3', '='])
    expect(value()).toBe('5')

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    for (const key of ['2', '+', '3', 'Enter']) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
    }
    expect(value()).toBe('5')
  })

  it('evita la acción nativa de Enter para que no duplique entradas', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('expone nombres accesibles y anuncia el resultado', () => {
    expect(document.querySelector('[aria-label="sumar"]')).not.toBeNull()
    expect(document.querySelector('[aria-label="borrar último dígito"]')).not.toBeNull()
    expect(document.querySelector('[aria-label="Borrar historial"]')).not.toBeNull()
    expect(document.querySelector('[data-value]')?.getAttribute('aria-live')).toBe('polite')
  })

  it('agrega los cálculos completados al historial, del más reciente al más antiguo', () => {
    clickKeys(['2', '+', '3', '='])
    clickKeys(['4', '×', '5', '='])

    const entries = [...document.querySelectorAll('[data-history-list] li')]
    expect(entries).toHaveLength(2)
    expect(entries[0]?.textContent).toContain('4 × 5 =')
    expect(entries[0]?.textContent).toContain('20')
    expect(entries[1]?.textContent).toContain('2 + 3 =')
    expect(entries[1]?.textContent).toContain('5')
    expect(document.querySelector<HTMLElement>('[data-history-empty]')?.hidden).toBe(true)
  })

  it('no registra operaciones incompletas ni errores y permite borrar el historial', () => {
    clickKeys(['8', '+', '='])
    clickKeys(['1', '÷', '0', '='])
    expect(document.querySelectorAll('[data-history-list] li')).toHaveLength(0)

    clickKeys(['2', '+', '2', '='])
    const clearButton = document.querySelector<HTMLButtonElement>('[data-clear-history]')
    expect(clearButton?.disabled).toBe(false)
    clearButton?.click()

    expect(document.querySelectorAll('[data-history-list] li')).toHaveLength(0)
    expect(clearButton?.disabled).toBe(true)
    expect(document.querySelector<HTMLElement>('[data-history-empty]')?.hidden).toBe(false)
  })

  it('permite activar con Enter el botón enfocado para borrar el historial', () => {
    clickKeys(['2', '+', '2', '='])
    const clearButton = document.querySelector<HTMLButtonElement>('[data-clear-history]')
    expect(clearButton).not.toBeNull()

    clearButton?.focus()
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    })
    const allowsNativeActivation = clearButton?.dispatchEvent(event)
    if (allowsNativeActivation) clearButton?.click()

    expect(document.activeElement).toBe(clearButton)
    expect(event.defaultPrevented).toBe(false)
    expect(document.querySelectorAll('[data-history-list] li')).toHaveLength(0)
  })
})
