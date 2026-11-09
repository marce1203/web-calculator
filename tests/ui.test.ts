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

  it('produce el mismo resultado con clics y teclado', () => {
    for (const key of ['2', '+', '3', '=']) {
      document.querySelector<HTMLButtonElement>(`button[data-key="${key}"]`)?.click()
    }
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
    expect(document.querySelector('[data-value]')?.getAttribute('aria-live')).toBe('polite')
  })
})
