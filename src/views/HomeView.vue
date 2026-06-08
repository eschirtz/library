<template>
  <main class="mx-auto max-w-md pa-3">
    <div class="d-flex justify-center">
      <AppearanceSwitch />
    </div>
    <div class="py-6 my-6 text-center">
      <h1 class="mt-6 text-primary">eschirtz</h1>
    </div>
    <div class="text-center d-flex flex-column gap-6">
      <RouterLink v-for="link in links" :key="link.title" :to="link.path" class="text-secondary">{{
        link.title
      }}</RouterLink>
    </div>
  </main>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppearanceSwitch from '@/components/AppearanceSwitch.vue'

const links = [
  {
    title: 'cabin',
    path: '/cabin',
  },
  {
    title: 'solar punk',
    path: '/solar-punk',
  },
]
</script>

<style scoped></style>
