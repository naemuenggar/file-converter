/**
 * useDarkMode Composable
 * Toggles dark/light theme and persists preference.
 */
import { ref, watchEffect } from 'vue'
import { usePreferredDark, useStorage } from '@vueuse/core'

export function useDarkMode() {
  const prefersDark = usePreferredDark()
  const stored = useStorage<'light' | 'dark' | 'system'>('pdfcraft-theme', 'system')

  const isDark = ref(false)

  watchEffect(() => {
    if (stored.value === 'system') {
      isDark.value = prefersDark.value
    } else {
      isDark.value = stored.value === 'dark'
    }

    // Apply class to document
    document.documentElement.classList.toggle('dark', isDark.value)
  })

  function toggle() {
    stored.value = isDark.value ? 'light' : 'dark'
  }

  function setTheme(theme: 'light' | 'dark' | 'system') {
    stored.value = theme
  }

  return { isDark, toggle, setTheme, currentSetting: stored }
}
