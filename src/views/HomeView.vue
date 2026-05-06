<template>
  <div class="mx-auto max-w-md pa-3">
    <div class="d-flex justify-center">
      <AppearanceSwitch />
    </div>
    <div class="py-6 my-6 text-center">
      <h1 class="mt-6 text-primary">eschirtz</h1>
      <p class="text-secondary mt-2">co-founder of samply.app</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppearanceSwitch from '@/components/AppearanceSwitch.vue'

import useAppearance from '@/composables/useAppearance'

useAppearance()
</script>

<style scoped></style>
