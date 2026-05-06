<template>
  <div class="appearance-switch d-flex gap-1">
    <button aria-label="Light mode" :class="{ active: mode === 'light' }" @click="setMode('light')">
      <svg width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5" />
      </svg>
    </button>

    <button
      aria-label="System mode"
      :class="{ active: mode === 'system' }"
      @click="setMode('system')"
    >
      <svg width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5" />
        <circle cx="8" cy="8" r="3" fill="currentColor" />
      </svg>
    </button>

    <button aria-label="Dark mode" :class="{ active: mode === 'dark' }" @click="setMode('dark')">
      <svg width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="7" fill="currentColor" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import useAppearance from '@/composables/useAppearance'

const { mode, setMode } = useAppearance()
</script>

<style scoped>
.appearance-switch {
  align-items: center;
}

button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: var(--text-secondary);
  opacity: 0.4;
  transition: opacity 0.15s;
}

button:hover {
  opacity: 0.7;
}

button.active {
  color: var(--text-primary);
  opacity: 1;
}
</style>
