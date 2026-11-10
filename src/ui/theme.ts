export type Theme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'calculator-theme'

const themeColors: Record<Theme, string> = {
  dark: '#0b1220',
  light: '#f1f5f9',
}

function isTheme(value: string | undefined | null): value is Theme {
  return value === 'dark' || value === 'light'
}

function readStoredTheme(): Theme | undefined {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(storedTheme) ? storedTheme : undefined
  } catch {
    return undefined
  }
}

function preferredTheme(): Theme {
  try {
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

function updateThemeColor(theme: Theme): void {
  document
    .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    ?.setAttribute('content', themeColors[theme])
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  updateThemeColor(theme)
}

export function initializeTheme(): Theme {
  const theme = readStoredTheme() ?? preferredTheme()
  applyTheme(theme)
  return theme
}

export function saveTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // The in-memory theme still works when storage is unavailable.
  }
}
