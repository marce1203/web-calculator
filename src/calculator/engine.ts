import Big from 'big.js'
import { formatInput, formatNumber, toExpressionNumber } from './format'
import { operators } from './types'
import type { CalculatorKey, CalculatorState, Operator, Token } from './types'

const DIVISION_BY_ZERO = 'No se puede dividir por cero'
const MAX_INPUT_DIGITS = 12

export const initialState: CalculatorState = {
  tokens: [],
  input: '0',
  value: '0',
  phase: 'input',
  completedExpression: null,
}

function isOperator(value: Token | CalculatorKey): value is Operator {
  return operators.includes(value as Operator)
}

function normalize(value: string): string {
  return new Big(value).toString()
}

function appendDigit(input: string | null, digit: string): string {
  const current = input ?? '0'
  if (current.replace(/\D/g, '').length >= MAX_INPUT_DIGITS) return current
  if (current === '0') return digit
  if (current === '-0') return digit === '0' ? current : `-${digit}`
  return `${current}${digit}`
}

function startFreshInput(digit: string): CalculatorState {
  const input = digit
  return { ...initialState, input, value: input }
}

function enterDigit(state: CalculatorState, digit: string): CalculatorState {
  if (state.phase === 'error' || state.phase === 'result') return startFreshInput(digit)
  const input = appendDigit(state.input, digit)
  return { ...state, input, value: input, phase: 'input', completedExpression: null }
}

function enterDecimal(state: CalculatorState): CalculatorState {
  if (state.phase === 'error') return state
  if (state.phase === 'result') {
    return { ...initialState, input: '0.', value: '0.' }
  }
  const current = state.input ?? '0'
  if (current.includes('.')) return state
  const input = `${current}.`
  return { ...state, input, value: input, phase: 'input', completedExpression: null }
}

function enterOperator(state: CalculatorState, operator: Operator): CalculatorState {
  if (state.phase === 'error') return state
  if (state.phase === 'result') {
    return {
      ...state,
      tokens: [state.value, operator],
      input: null,
      phase: 'operator',
      completedExpression: null,
    }
  }

  if (state.input !== null) {
    const operand = normalize(state.input)
    return {
      ...state,
      tokens: [...state.tokens, operand, operator],
      input: null,
      value: operand,
      phase: 'operator',
    }
  }

  if (isOperator(state.tokens.at(-1) ?? '')) {
    return { ...state, tokens: [...state.tokens.slice(0, -1), operator] }
  }

  return state
}

function applyOperation(left: Big, operator: Operator, right: Big): Big {
  switch (operator) {
    case '+':
      return left.plus(right)
    case '−':
      return left.minus(right)
    case '×':
      return left.times(right)
    case '÷':
      if (right.eq(0)) throw new Error(DIVISION_BY_ZERO)
      return left.div(right)
  }
}

function evaluateTokens(tokens: Token[]): Big {
  const values: Big[] = [new Big(tokens[0] as string)]
  const lowPrecedenceOperators: Operator[] = []

  for (let index = 1; index < tokens.length; index += 2) {
    const operator = tokens[index] as Operator
    const right = new Big(tokens[index + 1] as string)
    if (operator === '×' || operator === '÷') {
      values[values.length - 1] = applyOperation(values.at(-1) as Big, operator, right)
    } else {
      lowPrecedenceOperators.push(operator)
      values.push(right)
    }
  }

  return lowPrecedenceOperators.reduce(
    (result, operator, index) => applyOperation(result, operator, values[index + 1]),
    values[0],
  )
}

function expressionFrom(tokens: Token[]): string {
  return tokens
    .map((token) => (isOperator(token) ? token : toExpressionNumber(token)))
    .join(' ')
}

function evaluate(state: CalculatorState): CalculatorState {
  if (state.phase === 'error' || state.phase === 'result' || state.input === null) return state
  const tokens = [...state.tokens, normalize(state.input)]
  if (tokens.length < 3) return state
  const completedExpression = `${expressionFrom(tokens)} =`

  try {
    const value = evaluateTokens(tokens).toString()
    return {
      tokens: [],
      input: null,
      value,
      phase: 'result',
      completedExpression,
    }
  } catch (error) {
    if (error instanceof Error && error.message === DIVISION_BY_ZERO) {
      return {
        tokens: [],
        input: null,
        value: DIVISION_BY_ZERO,
        phase: 'error',
        completedExpression,
      }
    }
    throw error
  }
}

function transformCurrent(
  state: CalculatorState,
  transform: (value: Big) => Big,
): CalculatorState {
  if (state.phase === 'error' || (state.input === null && state.phase !== 'result')) return state
  const source = state.phase === 'result' ? state.value : (state.input as string)
  const value = transform(new Big(source)).toString()
  if (state.phase === 'result') return { ...state, value }
  return { ...state, input: value, value }
}

function toggleSign(state: CalculatorState): CalculatorState {
  return transformCurrent(state, (value) => value.times(-1))
}

function percentage(state: CalculatorState): CalculatorState {
  return transformCurrent(state, (value) => value.div(100))
}

function backspace(state: CalculatorState): CalculatorState {
  if (state.phase !== 'input' || state.input === null) return state
  const shortened = state.input.slice(0, -1)
  const input = shortened === '' || shortened === '-' ? '0' : shortened
  return { ...state, input, value: input }
}

export function press(state: CalculatorState, key: CalculatorKey): CalculatorState {
  if (/^\d$/.test(key)) return enterDigit(state, key)
  if (key === 'AC') return { ...initialState }
  if (key === ',') return enterDecimal(state)
  if (isOperator(key)) return enterOperator(state, key)
  if (key === '=') return evaluate(state)
  if (key === '±') return toggleSign(state)
  if (key === '%') return percentage(state)
  return backspace(state)
}

export function getDisplay(state: CalculatorState): { expression: string; value: string } {
  const expression = state.completedExpression ?? expressionFrom(state.tokens)
  if (state.phase === 'error') return { expression, value: state.value }
  if (state.input !== null) return { expression, value: formatInput(state.input) }
  return { expression, value: formatNumber(state.value) }
}

export function keyFromKeyboard(key: string): CalculatorKey | null {
  if (/^\d$/.test(key)) return key as CalculatorKey
  const mapping: Record<string, CalculatorKey> = {
    '+': '+',
    '-': '−',
    '*': '×',
    '/': '÷',
    '.': ',',
    ',': ',',
    Enter: '=',
    '=': '=',
    Backspace: '⌫',
    Escape: 'AC',
    '%': '%',
  }
  return mapping[key] ?? null
}
