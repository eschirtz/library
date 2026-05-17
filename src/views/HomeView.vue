<template>
  <main class="mx-auto max-w-md pa-3">
    <div class="d-flex justify-center">
      <AppearanceSwitch />
    </div>
    <div class="py-6 my-6 text-center">
      <h1 class="mt-6 text-primary">eschirtz</h1>
    </div>
    <div class="text-center d-flex flex-column gap-6">
      <RouterLink v-for="link in links" :key="link.title" :to="link.link" class="text-secondary">{{
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
    link: '/cabin',
  },
  {
    title: 'solar punk',
    link: '/solar-punk',
  },
  {
    title: 'samply.app',
    link: 'https://samply.app',
  },
]
</script>

<style scoped></style>
