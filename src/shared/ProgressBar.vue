<script setup lang="ts">
/**
 * ProgressBar - Animated progress indicator with message.
 */
interface Props {
  progress: number
  message?: string
  showPercentage?: boolean
}

withDefaults(defineProps<Props>(), {
  message: '',
  showPercentage: true,
})
</script>

<template>
  <div class="w-full" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100">
    <div class="flex items-center justify-between mb-1">
      <span v-if="message" class="text-xs text-[var(--color-text-muted)] truncate max-w-[70%]">
        {{ message }}
      </span>
      <span v-if="showPercentage" class="text-xs font-medium text-[var(--color-text-muted)]">
        {{ Math.round(progress) }}%
      </span>
    </div>
    <div class="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div
        class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
        :style="{ width: `${Math.min(100, Math.max(0, progress))}%` }"
      />
    </div>
  </div>
</template>
