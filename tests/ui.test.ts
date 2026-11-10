import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createCalculator } from '../src/ui/app'

describe('interfaz', () => {
  let cleanup: () => void

  function mockMatchMedia(matches: boolean): void {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(() => true),
      })),
    )
  }

  function mountCalculator(): () => void {
    document.body.innerHTML = '<main id="app"></main>'
    return createCalculator(document.querySelector('#app') as HTMLElement)
  }

  beforeEach(() => {
    window.localStorage.clear()
    delete document.documentElement.dataset.theme
    document.head.innerHTML = '<meta name="theme-color" content="#0b1220">'
    mockMatchMedia(false)
    cleanup = mountCalculator()
  })

  afterEach(() => {
    cleanup()
    window.localStorage.clear()
    delete document.documentElement.dataset.theme
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

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
    expect(document.querySelector('[aria-label="Activar modo claro"]')).not.toBeNull()
    expect(document.querySelector('[data-value]')?.getAttribute('aria-live')).toBe('polite')
  })

  it('cambia el tema y actualiza el color del navegador', () => {
    const themeButton = document.querySelector<HTMLButtonElement>('[data-theme-toggle]')

    expect(document.documentElement.dataset.theme).toBe('dark')
    themeButton?.click()

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(themeButton?.getAttribute('aria-label')).toBe('Activar modo oscuro')
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe(
      '#f1f5f9',
    )
  })

  it('guarda la elección y la respeta al volver a montar', () => {
    document.querySelector<HTMLButtonElement>('[data-theme-toggle]')?.click()
    expect(window.localStorage.getItem('calculator-theme')).toBe('light')

    cleanup()
    delete document.documentElement.dataset.theme
    cleanup = mountCalculator()

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(document.querySelector('[aria-label="Activar modo oscuro"]')).not.toBeNull()
  })

  it('usa la preferencia del sistema cuando no hay una elección guardada', () => {
    cleanup()
    mockMatchMedia(true)
    delete document.documentElement.dataset.theme
    cleanup = mountCalculator()

    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: light)')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('sigue funcionando cuando localStorage está bloqueado', () => {
    cleanup()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage blocked')
    })
    delete document.documentElement.dataset.theme
    cleanup = mountCalculator()

    expect(() => document.querySelector<HTMLButtonElement>('[data-theme-toggle]')?.click()).not.toThrow()
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('no calcula al activar con Enter el botón de tema', () => {
    clickKeys(['2', '+', '3'])
    const themeButton = document.querySelector<HTMLButtonElement>('[data-theme-toggle]')
    themeButton?.focus()
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    })
    const allowsNativeActivation = themeButton?.dispatchEvent(event)
    if (allowsNativeActivation) themeButton?.click()

    expect(event.defaultPrevented).toBe(false)
    expect(value()).toBe('3')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('conserva el cálculo en curso al cambiar el tema', () => {
    clickKeys(['8', '+', '4'])
    document.querySelector<HTMLButtonElement>('[data-theme-toggle]')?.click()
    expect(value()).toBe('4')

    clickKeys(['='])
    expect(value()).toBe('12')
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
