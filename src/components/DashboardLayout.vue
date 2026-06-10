<script setup lang="ts">
/**
 * DashboardLayout - Main application shell with sidebar navigation.
 */
import { ref } from 'vue'
import { useDarkMode } from '@/composables/useDarkMode'

const { isDark, toggle } = useDarkMode()
const sidebarOpen = ref(true)

interface NavItem {
  id: string
  label: string
  icon: string
}

const navItems: NavItem[] = [
  { id: 'studio', label: 'PDF Studio', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  { id: 'merge', label: 'Merge PDFs', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
  { id: 'to-image', label: 'PDF to Image', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'security', label: 'Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  { id: 'account', label: 'Account', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
]

const emit = defineEmits<{
  navigate: [id: string]
}>()

const activeId = ref('studio')

function navigate(id: string) {
  activeId.value = id
  emit('navigate', id)
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-[var(--color-surface)]">
    <!-- Sidebar -->
    <aside
      class="shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface-alt)] transition-all duration-200 flex flex-col"
      :class="sidebarOpen ? 'w-56' : 'w-16'"
    >
      <!-- Logo -->
      <div class="flex items-center gap-2 px-4 py-4 border-b border-[var(--color-border)]">
        <div class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
          <span class="text-white font-bold text-sm">P</span>
        </div>
        <span v-if="sidebarOpen" class="font-semibold text-sm truncate">PDFCraft</span>
      </div>

      <!-- Nav Items -->
      <nav class="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        <button
          v-for="item in navItems"
          :key="item.id"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
          :class="activeId === item.id
            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium'
            : 'text-[var(--color-text-muted)] hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-[var(--color-text)]'"
          :title="item.label"
          @click="navigate(item.id)"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="item.icon" />
          </svg>
          <span v-if="sidebarOpen" class="truncate">{{ item.label }}</span>
        </button>
      </nav>

      <!-- Bottom controls -->
      <div class="border-t border-[var(--color-border)] p-2 space-y-1">
        <!-- Theme toggle -->
        <button
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-text-muted)] hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggle"
        >
          <svg v-if="isDark" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <svg v-else class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          <span v-if="sidebarOpen" class="truncate">{{ isDark ? 'Light Mode' : 'Dark Mode' }}</span>
        </button>

        <!-- Collapse toggle -->
        <button
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-text-muted)] hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          title="Toggle sidebar"
          @click="sidebarOpen = !sidebarOpen"
        >
          <svg class="w-5 h-5 shrink-0 transition-transform" :class="{ 'rotate-180': !sidebarOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          <span v-if="sidebarOpen" class="truncate">Collapse</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto">
      <div class="max-w-5xl mx-auto p-6 lg:p-8">
        <slot />
      </div>
    </main>
  </div>
</template>
