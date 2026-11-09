import Big from 'big.js'

const SIGNIFICANT_DIGITS = 12
const SCIENTIFIC_UPPER_BOUND = new Big('1e12')
const SCIENTIFIC_LOWER_BOUND = new Big('1e-9')

Big.DP = 40
Big.RM = Big.roundHalfUp
Big.NE = -100
Big.PE = 100

function groupInteger(integer: string): string {
  const sign = integer.startsWith('-') ? '-' : ''
  const digits = sign ? integer.slice(1) : integer
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

export function formatInput(value: string): string {
  const [integer, fraction] = value.split('.')
  const groupedInteger = groupInteger(integer)
  return fraction === undefined ? groupedInteger : `${groupedInteger},${fraction}`
}

function trimScientific(value: string): string {
  const [mantissa, exponent] = value.split('e')
  const trimmedMantissa = mantissa
    .replace(/(\.\d*?[1-9])0+$/, '$1')
    .replace(/\.0+$/, '')
  return `${trimmedMantissa.replace('.', ',')}e${exponent}`
}

export function formatNumber(value: string): string {
  const number = new Big(value)
  if (number.eq(0)) return '0'

  const absolute = number.abs()
  if (absolute.gte(SCIENTIFIC_UPPER_BOUND) || absolute.lt(SCIENTIFIC_LOWER_BOUND)) {
    return trimScientific(number.toExponential(SIGNIFICANT_DIGITS - 1))
  }

  const rounded = new Big(number.toPrecision(SIGNIFICANT_DIGITS)).toFixed()
  const [integer, fraction] = rounded.split('.')
  const trimmedFraction = fraction?.replace(/0+$/, '')
  return trimmedFraction ? `${groupInteger(integer)},${trimmedFraction}` : groupInteger(integer)
}

export function toExpressionNumber(value: string): string {
  return formatInput(value)
}
