import { onBeforeUnmount, watch, type Ref } from 'vue'

interface GestureCallbacks {
  onPanStart?: () => void
  onPan?: (dx: number, dy: number) => void
  onPanEnd?: (velocityX: number, velocityY: number) => void
  onZoom?: (scaleDelta: number, originX: number, originY: number) => void
}

export function useGestures(
  elementRef: Ref<HTMLElement | null>,
  callbacks: GestureCallbacks,
) {
  let isDragging = false
  let lastX = 0
  let lastY = 0
  let lastTime = 0
  let velocityX = 0
  let velocityY = 0

  // Pinch state
  let initialPinchDistance = 0
  let lastPinchDistance = 0

  function getDistance(t1: Touch, t2: Touch): number {
    const dx = t2.clientX - t1.clientX
    const dy = t2.clientY - t1.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  function getMidpoint(t1: Touch, t2: Touch): { x: number; y: number } {
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    }
  }

  // --- Pointer (mouse) handlers ---
  function onPointerDown(e: PointerEvent) {
    if (e.pointerType === 'touch') return // handled by touch events
    isDragging = true
    lastX = e.clientX
    lastY = e.clientY
    lastTime = performance.now()
    velocityX = 0
    velocityY = 0
    callbacks.onPanStart?.()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDragging || e.pointerType === 'touch') return
    const now = performance.now()
    const dt = now - lastTime || 16
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY

    velocityX = dx / dt * 16 // normalize to ~per-frame
    velocityY = dy / dt * 16

    lastX = e.clientX
    lastY = e.clientY
    lastTime = now
    callbacks.onPan?.(dx, dy)
  }

  function onPointerUp(e: PointerEvent) {
    if (!isDragging || e.pointerType === 'touch') return
    isDragging = false
    callbacks.onPanEnd?.(velocityX, velocityY)
  }

  // --- Touch handlers ---
  function onTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      isDragging = true
      lastX = e.touches[0].clientX
      lastY = e.touches[0].clientY
      lastTime = performance.now()
      velocityX = 0
      velocityY = 0
      callbacks.onPanStart?.()
    } else if (e.touches.length === 2) {
      isDragging = false
      initialPinchDistance = getDistance(e.touches[0], e.touches[1])
      lastPinchDistance = initialPinchDistance
    }
    e.preventDefault()
  }

  function onTouchMove(e: TouchEvent) {
    if (e.touches.length === 1 && isDragging) {
      const now = performance.now()
      const dt = now - lastTime || 16
      const dx = e.touches[0].clientX - lastX
      const dy = e.touches[0].clientY - lastY

      velocityX = dx / dt * 16
      velocityY = dy / dt * 16

      lastX = e.touches[0].clientX
      lastY = e.touches[0].clientY
      lastTime = now
      callbacks.onPan?.(dx, dy)
    } else if (e.touches.length === 2) {
      const dist = getDistance(e.touches[0], e.touches[1])
      const scaleDelta = dist / lastPinchDistance
      lastPinchDistance = dist

      const mid = getMidpoint(e.touches[0], e.touches[1])
      const el = elementRef.value!
      const rect = el.getBoundingClientRect()
      callbacks.onZoom?.(scaleDelta, mid.x - rect.left, mid.y - rect.top)
    }
    e.preventDefault()
  }

  function onTouchEnd(e: TouchEvent) {
    if (e.touches.length === 0 && isDragging) {
      isDragging = false
      callbacks.onPanEnd?.(velocityX, velocityY)
    } else if (e.touches.length === 1) {
      // Went from pinch back to single finger
      isDragging = true
      lastX = e.touches[0].clientX
      lastY = e.touches[0].clientY
      lastTime = performance.now()
      velocityX = 0
      velocityY = 0
    }
  }

  // --- Wheel handler ---
  // Trackpad two-finger scroll emits wheel events without ctrlKey → pan
  // Trackpad pinch-to-zoom emits wheel events WITH ctrlKey → zoom
  // Mouse wheel (no ctrlKey) → zoom
  let wheelPanVelocityX = 0
  let wheelPanVelocityY = 0
  let wheelPanTimer: ReturnType<typeof setTimeout> | null = null

  function onWheel(e: WheelEvent) {
    e.preventDefault()
    const el = elementRef.value!
    const rect = el.getBoundingClientRect()
    const originX = e.clientX - rect.left
    const originY = e.clientY - rect.top

    if (e.ctrlKey) {
      // Pinch-to-zoom on trackpad (or ctrl+wheel on mouse)
      const delta = -e.deltaY
      const scaleDelta = 1 + delta * 0.01
      callbacks.onZoom?.(scaleDelta, originX, originY)
    } else if (Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) > 0) {
      // Two-finger pan on trackpad / mouse wheel
      const dx = -e.deltaX
      const dy = -e.deltaY

      // Track velocity for inertia on end
      wheelPanVelocityX = dx
      wheelPanVelocityY = dy

      callbacks.onPanStart?.()
      callbacks.onPan?.(dx, dy)

      // Debounce pan end — wheel events stop firing when gesture ends
      if (wheelPanTimer) clearTimeout(wheelPanTimer)
      wheelPanTimer = setTimeout(() => {
        callbacks.onPanEnd?.(wheelPanVelocityX, wheelPanVelocityY)
        wheelPanTimer = null
      }, 100)
    }
  }

  // --- Attach / detach ---
  let cleanup: (() => void) | null = null

  function attach(el: HTMLElement) {
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)
    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('wheel', onWheel, { passive: false })

    cleanup = () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('wheel', onWheel)
    }
  }

  watch(elementRef, (el, _, onCleanup) => {
    if (el) {
      attach(el)
      onCleanup(() => {
        cleanup?.()
        cleanup = null
      })
    }
  }, { immediate: true })

  onBeforeUnmount(() => {
    cleanup?.()
    cleanup = null
  })
}
