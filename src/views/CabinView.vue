<template>
  <CloseLayout>
    <div ref="containerRef" class="map-container">
      <img
        src="/img/cabin/cabin.avif"
        :style="{ transform }"
        class="map-image"
        draggable="false"
        @load="onImageLoad"
      />
    </div>
  </CloseLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CloseLayout from '@/layouts/CloseLayout.vue'
import { useGestures } from '@/composables/useGestures'
import { useMapController } from '@/composables/useMapController'

const containerRef = ref<HTMLElement | null>(null)

const { transform, pan, panEnd, zoom, setImageDimensions } = useMapController({
  containerRef,
  imageWidth: 1,
  imageHeight: 1,
})

useGestures(containerRef, {
  onPan: (dx, dy) => pan(dx, dy),
  onPanEnd: (vx, vy) => panEnd(vx, vy),
  onZoom: (scaleDelta, originX, originY) => zoom(scaleDelta, originX, originY),
})

function onImageLoad(e: Event) {
  const img = e.target as HTMLImageElement
  setImageDimensions(img.naturalWidth, img.naturalHeight)
}
</script>

<style scoped>
.map-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  touch-action: none;
  user-select: none;
}

.map-image {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  will-change: transform;
}
</style>
