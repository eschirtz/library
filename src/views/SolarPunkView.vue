<template>
  <CloseLayout>
    <main class="py-6 text-center">SOLAR PUNK</main>
  </CloseLayout>
</template>

<script setup lang="ts">
import CloseLayout from '@/layouts/CloseLayout.vue'

const SOLAR_PUNK_PROJECT_LINK =
  'https://next.samply.app/p/yH0bL2flLfLK28fMWSJK?si=2jTDpFGmKmUH2PyP9o3khIpRoRJ2'

console.log('SOLAR PUNK PROJECT LINK', SOLAR_PUNK_PROJECT_LINK)
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

.box-list {
  list-style: none;
}

.box-item audio {
  width: 100%;
  margin-top: 4px;
}
</style>
