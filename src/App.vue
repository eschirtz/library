<template>
  eschirtz
  <AppearanceSwitch class="appearance-switch-pos" />
  <RouterView />
</template>

<script setup lang="ts">
import AppearanceSwitch from '@/components/AppearanceSwitch.vue'
import useAppearance from '@/composables/useAppearance'

useAppearance()
</script>

<style scoped>
.appearance-switch-pos {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 100;
}
</style>
