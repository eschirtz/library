<template>
  <div class="close-layout">
    <RouterLink to="/" class="close-btn text-primary" aria-label="Close">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </RouterLink>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.close-layout {
  position: relative;
}

.close-btn {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}
</style>
