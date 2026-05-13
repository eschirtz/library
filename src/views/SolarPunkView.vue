<template>
  <main class="py-6">
    <div class="py-6 my-6 text-center">
      <h1 class="mt-6 text-primary">Solar Punk</h1>
      <RouterLink to="/" class="text-secondary mt-4">back</RouterLink>
    </div>
  </main>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped>
main {
  --bg-primary: #ffedbc;
  --bg-secondary: #f5d98c;
  --text-primary: #1c1c1e;
  --text-secondary: #6e6e73;

  background-color: var(--bg-primary);
  min-height: 100vh;
}

[data-theme='dark'] main {
  --bg-primary: #155015;
  --bg-secondary: #389351;
  --text-primary: #f0f0f0;
  --text-secondary: #8e8e93;
}
</style>
