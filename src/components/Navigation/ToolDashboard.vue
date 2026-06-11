<script setup lang="ts">
/**
 * ToolDashboard — the OmniDoc OS homepage.
 * A searchable, category-grouped grid of every tool, wrapped in a premium hero
 * with an ambient floating background, gradient headline, format chips, and
 * scroll-reveal sections.
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { TOOLS, TOOL_CATEGORIES, type ToolCategory, type ToolDefinition } from '@/core/toolRegistry'
import TrustBadges from '@/components/TrustBadges.vue'
import FloatingBackground from '@/shared/FloatingBackground.vue'
import FormatChip from '@/shared/FormatChip.vue'
import MotionButton from '@/shared/MotionButton.vue'
import SectionReveal from '@/shared/SectionReveal.vue'

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

// Formats showcased in the hero chip row.
const FORMATS = ['PDF', 'DOCX', 'XLSX', 'PPTX', 'JPG', 'PNG', 'HTML', 'TXT']

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
  <div class="space-y-16">
    <!-- ─── Hero ──────────────────────────────────────────────────────────── -->
    <!-- Full-bleed: section spans the whole viewport width so the gradient
         reaches both screen edges; content stays centered in an inner wrapper. -->
    <section class="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden pt-10 pb-12">
      <FloatingBackground :intensity="1" />

      <div class="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-6 py-8">


        <SectionReveal as="h1" class="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
          Every document tool,<br class="hidden sm:block" />
          <span class="text-gradient">100% in your browser</span>
        </SectionReveal>

        <SectionReveal
          as="p"
          :delay="80"
          class="text-base sm:text-lg text-[var(--color-text-muted)] max-w-2xl mx-auto"
        >
          Convert, edit, sign, and OCR any file. Nothing is ever uploaded — your data
          never leaves your device.
        </SectionReveal>

        <!-- Quick actions -->
        <SectionReveal :delay="160" class="flex flex-wrap items-center justify-center gap-3 pt-1">
          <MotionButton variant="primary" size="lg" @click="router.push('/convert')">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Universal Converter
          </MotionButton>
          <MotionButton variant="secondary" size="lg" @click="router.push('/ocr')">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M8 12h8" />
            </svg>
            OCR Studio
          </MotionButton>
        </SectionReveal>

        <!-- Format chips -->
        <SectionReveal :delay="240" class="flex flex-wrap items-center justify-center gap-2 pt-2 max-w-2xl mx-auto">
          <FormatChip v-for="f in FORMATS" :key="f" :label="f" />
        </SectionReveal>
      </div>
    </section>

    <!-- ─── Search ────────────────────────────────────────────────────────── -->
    <div class="max-w-lg mx-auto relative -mt-6">
      <svg class="w-5 h-5 text-[var(--color-text-muted)] absolute left-4 top-1/2 -translate-y-1/2 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        v-model="search"
        type="text"
        placeholder="Search 24 tools..."
        class="w-full pl-12 pr-4 py-3.5 rounded-2xl glass text-sm outline-none transition-all duration-300 focus:shadow-[var(--glow)] focus:border-indigo-400/60"
      />
    </div>

    <!-- ─── Categories ────────────────────────────────────────────────────── -->
    <SectionReveal
      v-for="(group, gi) in grouped"
      :key="group.category"
      :delay="gi * 60"
      class="space-y-4"
    >
      <h2 class="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        {{ group.label }}
      </h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <button
          v-for="tool in group.tools"
          :key="tool.id"
          class="hover-lift group flex flex-col items-start gap-3 p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-left"
          @click="go(tool)"
        >
          <div class="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110" :class="COLOR_CLASSES[tool.color]">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="tool.icon" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-bold group-hover:text-indigo-500 transition-colors">{{ tool.name }}</h3>
            <p class="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">{{ tool.description }}</p>
          </div>
        </button>
      </div>
    </SectionReveal>

    <!-- Empty -->
    <div v-if="grouped.length === 0" class="text-center py-16 text-[var(--color-text-muted)]">
      <p class="text-lg">No tools match "{{ search }}".</p>
      <button class="mt-3 text-indigo-500 font-medium hover:underline" @click="search = ''">
        Clear search
      </button>
    </div>

    <!-- Trust badges -->
    <SectionReveal class="pt-4">
      <TrustBadges />
    </SectionReveal>
  </div>
</template>
