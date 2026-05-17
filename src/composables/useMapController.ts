import { ref, computed, type Ref } from 'vue'

interface MapControllerOptions {
  containerRef: Ref<HTMLElement | null>
  imageWidth: number
  imageHeight: number
  minScale?: number
  maxScale?: number
}

export function useMapController(options: MapControllerOptions) {
  const { containerRef, maxScale = 4 } = options
  let imageWidth = options.imageWidth
  let imageHeight = options.imageHeight

  const x = ref(0)
  const y = ref(0)
  const scale = ref(1)

  let animationId: number | null = null

  function getContainerSize() {
    const el = containerRef.value
    if (!el) return { w: 0, h: 0 }
    return { w: el.clientWidth, h: el.clientHeight }
  }

  function getMinScale() {
    if (options.minScale) return options.minScale
    const { w, h } = getContainerSize()
    if (w === 0 || h === 0) return 1
    return Math.max(w / imageWidth, h / imageHeight)
  }

  function getBounds() {
    const { w, h } = getContainerSize()
    const scaledW = imageWidth * scale.value
    const scaledH = imageHeight * scale.value

    let minX: number, maxX: number, minY: number, maxY: number

    if (scaledW <= w) {
      // Center horizontally
      const cx = (w - scaledW) / 2
      minX = cx
      maxX = cx
    } else {
      minX = w - scaledW
      maxX = 0
    }

    if (scaledH <= h) {
      // Center vertically
      const cy = (h - scaledH) / 2
      minY = cy
      maxY = cy
    } else {
      minY = h - scaledH
      maxY = 0
    }

    return { minX, maxX, minY, maxY }
  }

  function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
  }

  function clampPosition() {
    const bounds = getBounds()
    x.value = clamp(x.value, bounds.minX, bounds.maxX)
    y.value = clamp(y.value, bounds.minY, bounds.maxY)
  }

  function stopAnimation() {
    if (animationId !== null) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }

  function pan(dx: number, dy: number) {
    stopAnimation()
    x.value += dx
    y.value += dy
    clampPosition()
  }

  function panEnd(_velocityX: number, _velocityY: number) {
    // No inertia — just clamp
    clampPosition()
  }

  function zoom(scaleDelta: number, originX: number, originY: number) {
    stopAnimation()

    const minS = getMinScale()
    const oldScale = scale.value
    let newScale = oldScale * scaleDelta
    newScale = clamp(newScale, minS, maxScale)

    const ratio = newScale / oldScale
    x.value = originX - (originX - x.value) * ratio
    y.value = originY - (originY - y.value) * ratio
    scale.value = newScale

    clampPosition()
  }

  function resetView() {
    stopAnimation()
    const minS = getMinScale()
    scale.value = minS

    const { w, h } = getContainerSize()
    const scaledW = imageWidth * minS
    const scaledH = imageHeight * minS

    x.value = (w - scaledW) / 2
    y.value = (h - scaledH) / 2
  }

  function setImageDimensions(w: number, h: number) {
    imageWidth = w
    imageHeight = h
    resetView()
  }

  const transform = computed(() => {
    return `translate(${x.value}px, ${y.value}px) scale(${scale.value})`
  })

  const readonlyScale = computed(() => scale.value)

  return {
    transform,
    scale: readonlyScale,
    pan,
    panEnd,
    zoom,
    resetView,
    setImageDimensions,
  }
}
