import { ref, watch } from 'vue'

export type AppearanceMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'appearance-mode'

const mode = ref<AppearanceMode>('system')

function getSystemPreference(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', theme)
}

function updateTheme() {
  const effectiveTheme = mode.value === 'system' ? getSystemPreference() : mode.value
  applyTheme(effectiveTheme)
}

let initialized = false

function init() {
  if (initialized) return
  initialized = true

  const stored = localStorage.getItem(STORAGE_KEY) as AppearanceMode | null
  if (stored && ['light', 'dark', 'system'].includes(stored)) {
    mode.value = stored
  }

  updateTheme()

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (mode.value === 'system') {
      updateTheme()
    }
  })

  watch(mode, (newMode) => {
    localStorage.setItem(STORAGE_KEY, newMode)
    updateTheme()
  })
}

export default function useAppearance() {
  init()

  function setMode(newMode: AppearanceMode) {
    mode.value = newMode
  }

  return {
    mode,
    setMode,
  }
}
