<script setup lang="ts">
/**
 * ToolDashboard — the OmniDoc OS homepage.
 * A searchable, category-grouped grid of every tool, plus quick access to the
 * Universal Converter and OCR Studio.
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { TOOLS, TOOL_CATEGORIES, type ToolCategory, type ToolDefinition } from '@/core/toolRegistry'
import TrustBadges from '@/components/TrustBadges.vue'
import SupportBanner from '@/components/SupportBanner.vue'

const router = useRouter()
const search = ref('')

const filtered = computed<ToolDefinition[]>(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return TOOLS
  return TOOLS.filter(
    (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
  )
})

const grouped = computed(() => {
  const result: Array<{ category: ToolCategory; label: string; tools: ToolDefinition[] }> = []
  for (const cat of Object.keys(TOOL_CATEGORIES) as ToolCategory[]) {
    const tools = filtered.value.filter((t) => t.category === cat)
    if (tools.length) result.push({ category: cat, label: TOOL_CATEGORIES[cat], tools })
  }
  return result
})

// Tailwind color → classes map (static so JIT keeps them)
const COLOR_CLASSES: Record<string, string> = {
  indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300',
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
  rose: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300',
  violet: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300',
  teal: 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-300',
  green: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',
  yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-300',
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300',
  red: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300',
  pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-300',
  cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-300',
  fuchsia: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/40 dark:text-fuchsia-300',
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

function go(tool: ToolDefinition) {
  router.push(tool.path)
}
</script>

<template>
  <div class="space-y-8">
    <!-- Hero -->
    <div class="text-center space-y-3 py-4">
      <h1 class="text-3xl sm:text-4xl font-bold">
        Every document tool, <span class="text-indigo-500">100% in your browser</span>
      </h1>
      <p class="text-[var(--color-text-muted)] max-w-2xl mx-auto">
        Convert, edit, sign, and OCR any file. Nothing is ever uploaded — your data never leaves your device.
      </p>

      <!-- Quick actions -->
      <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          @click="router.push('/convert')"
        >
          Universal Converter
        </button>
        <button
          class="px-5 py-2.5 border border-[var(--color-border)] rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          @click="router.push('/ocr')"
        >
          OCR Studio
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="max-w-md mx-auto relative">
      <svg class="w-5 h-5 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        v-model="search"
        type="text"
        placeholder="Search tools..."
        class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>

    <!-- Categories -->
    <div v-for="group in grouped" :key="group.category" class="space-y-3">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {{ group.label }}
      </h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <button
          v-for="tool in group.tools"
          :key="tool.id"
          class="group flex flex-col items-start gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] hover:border-indigo-300 hover:shadow-md transition-all text-left"
          @click="go(tool)"
        >
          <div class="w-11 h-11 rounded-lg flex items-center justify-center" :class="COLOR_CLASSES[tool.color]">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="tool.icon" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-semibold group-hover:text-indigo-500 transition-colors">{{ tool.name }}</h3>
            <p class="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-2">{{ tool.description }}</p>
          </div>
        </button>
      </div>
    </div>

    <!-- Empty -->
    <div v-if="grouped.length === 0" class="text-center py-12 text-[var(--color-text-muted)]">
      No tools match "{{ search }}".
    </div>

    <!-- Support nudge -->
    <SupportBanner />

    <!-- Trust badges -->
    <div class="pt-4">
      <TrustBadges />
    </div>
  </div>
</template>
