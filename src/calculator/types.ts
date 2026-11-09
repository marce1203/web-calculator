export const operators = ['+', '−', '×', '÷'] as const

export type Operator = (typeof operators)[number]
export type CalculatorKey = `${number}` | ',' | Operator | '=' | 'AC' | '⌫' | '±' | '%'
export type Phase = 'input' | 'operator' | 'result' | 'error'
export type Token = string | Operator

export interface CalculatorState {
  tokens: Token[]
  input: string | null
  value: string
  phase: Phase
  completedExpression: string | null
}
