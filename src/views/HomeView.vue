<template>
  <div class="mx-auto max-w-md pa-3">
    <div class="d-flex justify-center">
      <AppearanceSwitch />
    </div>
    <p class="text-center">eschirtz</p>
  </div>
</template>

<script setup lang="ts">
import AppearanceSwitch from '@/components/AppearanceSwitch.vue'

import useAppearance from '@/composables/useAppearance'

useAppearance()
</script>

<style scoped></style>
