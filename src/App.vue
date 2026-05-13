<template>
  <RouterView v-slot="{ Component }">
    <Transition name="fade-zoom" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import useAppearance from '@/composables/useAppearance'

useAppearance()
</script>

<style scoped>
.fade-zoom-enter-active,
.fade-zoom-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.fade-zoom-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.fade-zoom-leave-to {
  opacity: 0;
  transform: scale(1.05);
}
</style>
