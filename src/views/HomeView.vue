<template>
  <main class="mx-auto max-w-md pa-3">
    <div class="d-flex justify-center">
      <AppearanceSwitch />
    </div>
    <div class="py-6 my-6 text-center">
      <h1 class="mt-6 text-primary">eschirtz</h1>
      <p class="text-secondary mt-2">co-founder of samply.app</p>
    </div>
    <div class="text-center d-flex flex-column gap-6">
      <RouterLink v-for="view in views" :key="view.title" :to="view.link" class="text-secondary">{{
        view.title
      }}</RouterLink>
    </div>
  </main>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppearanceSwitch from '@/components/AppearanceSwitch.vue'

const views = [
  {
    title: 'solar punk',
    link: '/solar-punk',
  },
  {
    title: 'cabin',
    link: '/cabin',
  },
]
</script>

<style scoped></style>
