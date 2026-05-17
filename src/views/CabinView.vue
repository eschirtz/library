<template>
  <CloseLayout>
    <div ref="containerRef" class="map-container" @pointermove="onMarkerMove" @pointerup="onMarkerUp">
      <div class="map-surface" :style="{ transform }">
        <img
          src="/img/cabin/cabin.avif"
          class="map-image"
          draggable="false"
          @load="onImageLoad"
        />
        <img
          v-for="marker in markers"
          :key="marker.id"
          src="/img/cabin/mowbot.avif"
          class="marker"
          :style="{ left: marker.x + 'px', top: marker.y + 'px' }"
          draggable="false"
          @pointerdown.stop="startMarkerDrag($event, marker)"
        />
      </div>
    </div>
  </CloseLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import CloseLayout from '@/layouts/CloseLayout.vue'
import { useGestures } from '@/composables/useGestures'
import { useMapController } from '@/composables/useMapController'

const containerRef = ref<HTMLElement | null>(null)

const { transform, scale, pan, panEnd, zoom, setImageDimensions } = useMapController({
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

// Mowbot markers
const markers = reactive([
  { id: 'q1', x: 200, y: 200 },
  { id: 'q2', x: 400, y: 300 },
  { id: 'q3', x: 600, y: 400 },
])

onMounted(async () => {
  for (const marker of markers) {
    const snap = await getDoc(doc(db, 'cabin', marker.id))
    if (snap.exists()) {
      const data = snap.data()
      marker.x = data.x
      marker.y = data.y
    }
  }
})

let activeMarker: (typeof markers)[number] | null = null

function startMarkerDrag(e: PointerEvent, marker: (typeof markers)[number]) {
  activeMarker = marker
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}

function onMarkerMove(e: PointerEvent) {
  if (!activeMarker) return
  activeMarker.x += e.movementX / scale.value
  activeMarker.y += e.movementY / scale.value
}

function onMarkerUp() {
  if (activeMarker) {
    setDoc(doc(db, 'cabin', activeMarker.id), { x: activeMarker.x, y: activeMarker.y })
  }
  activeMarker = null
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

.map-surface {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  will-change: transform;
}

.map-image {
  display: block;
}

.marker {
  position: absolute;
  width: 40px;
  height: 40px;
  translate: -50% -50%;
  cursor: grab;
}

.marker:active {
  cursor: grabbing;
}
</style>
