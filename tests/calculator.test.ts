import { describe, expect, it } from 'vitest'
import { getDisplay, initialState, press } from '../src/calculator'
import type { CalculatorKey, CalculatorState } from '../src/calculator'

function calculate(keys: CalculatorKey[], start: CalculatorState = initialState): CalculatorState {
  return keys.reduce(press, start)
}

function display(keys: CalculatorKey[]): string {
  return getDisplay(calculate(keys)).value
}

describe('motor de cálculo', () => {
  it.each([
    [['2', '+', '3', '='], '5'],
    [['7', '−', '1', '0', '='], '-3'],
    [['6', '×', '7', '='], '42'],
    [['1', '÷', '4', '='], '0,25'],
  ] as [CalculatorKey[], string][])('resuelve %j', (keys, expected) => {
    expect(display(keys)).toBe(expected)
  })

  it('respeta la precedencia de multiplicación', () => {
    expect(display(['2', '+', '3', '×', '4', '='])).toBe('14')
  })

  it('usa aritmética decimal exacta', () => {
    expect(display(['0', ',', '1', '+', '0', ',', '2', '='])).toBe('0,3')
    expect(display(['1', ',', '1', '×', '3', '='])).toBe('3,3')
  })

  it('muestra y permite recuperar un error de división por cero', () => {
    const error = calculate(['1', '÷', '0', '='])
    expect(getDisplay(error).value).toBe('No se puede dividir por cero')
    expect(getDisplay(calculate(['2', '+', '2', '='], error)).value).toBe('4')
  })

  it('ignora una segunda coma y elimina ceros a la izquierda', () => {
    expect(display(['0', '0', '7'])).toBe('7')
    expect(display([',', '5', ',', '2'])).toBe('0,52')
  })

  it('cambia el signo del número actual y del resultado', () => {
    expect(display(['5', '±'])).toBe('-5')
    expect(display(['5', '+', '2', '=', '±'])).toBe('-7')
  })

  it('calcula porcentajes sobre el número actual', () => {
    expect(display(['5', '0', '%'])).toBe('0,5')
    expect(display(['2', '0', '0', '×', '1', '0', '%', '='])).toBe('20')
  })

  it('borra el último dígito solo durante una entrada', () => {
    expect(display(['1', '2', '⌫'])).toBe('1')
    expect(display(['1', '+', '2', '=', '⌫'])).toBe('3')
  })

  it('AC restaura el estado inicial', () => {
    expect(calculate(['9', '+', '3', 'AC'])).toEqual(initialState)
  })

  it('reemplaza un operador por el siguiente', () => {
    const state = calculate(['5', '+', '×'])
    expect(getDisplay(state).expression).toBe('5 ×')
    expect(getDisplay(calculate(['2', '='], state)).value).toBe('10')
  })

  it('continúa desde el resultado con un operador y reinicia con un dígito', () => {
    expect(display(['2', '+', '3', '=', '+', '1', '='])).toBe('6')
    expect(display(['2', '+', '3', '=', '9'])).toBe('9')
    expect(display(['2', '+', '3', '=', '='])).toBe('5')
  })

  it('limita la entrada a 12 dígitos', () => {
    expect(display(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '1', '2', '3'])).toBe(
      '123.456.789.012',
    )
  })

  it('redondea la salida a 12 dígitos significativos', () => {
    expect(display(['1', '÷', '3', '='])).toBe('0,333333333333')
    expect(display(['2', '÷', '3', '='])).toBe('0,666666666667')
  })

  it('conserva precisión interna aunque redondee el display', () => {
    expect(display(['1', '÷', '3', '=', '×', '3', '='])).toBe('1')
  })

  it('usa notación científica desde 1e12 y por debajo de 1e-9', () => {
    expect(display(['9', '9', '9', '9', '9', '9', '9', '9', '9', '9', '9', '9', '+', '1', '='])).toBe(
      '1e+12',
    )
    expect(display(['1', '÷', '1', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '='])).toBe(
      '1e-10',
    )
  })
})
