<template>
  <CloseLayout>
  <main class="py-6">
    <div class="mx-auto max-w-md pa-3">
      <div class="py-6 my-6 text-center">
        <h1 class="mt-6 text-primary">Solar Punk</h1>
      </div>
      <ul class="box-list">
        <li v-for="box in boxes" :key="box.id" class="box-item py-3">
          <p class="text-primary">{{ box.name }}</p>
          <audio
            v-if="audioUrls[box.id]"
            :src="audioUrls[box.id]"
            controls
            preload="none"
          />
        </li>
      </ul>
    </div>
  </main>
  </CloseLayout>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import useSamply, { type Box } from '@/composables/useSamply'
import CloseLayout from '@/layouts/CloseLayout.vue'

const SOLAR_PUNK_PROJECT_LINK = 'https://next.samply.app/p/yH0bL2flLfLK28fMWSJK?si=2jTDpFGmKmUH2PyP9o3khIpRoRJ2'

const samply = useSamply()
const boxes = ref<Box[]>([])
const audioUrls = reactive<Record<string, string>>({})

samply.getLinkContent(SOLAR_PUNK_PROJECT_LINK).then(({ boxes: sortedBoxes }) => {
  boxes.value = sortedBoxes
  for (const box of sortedBoxes) {
    samply.getDownloadUrl(SOLAR_PUNK_PROJECT_LINK, box.id).then((url) => {
      audioUrls[box.id] = url
    })
  }
})

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
