<template>
  <CloseLayout>
    <main>
      <!-- Loading -->
      <div v-if="status === 'loading'" class="center">
        <p>Loading player…</p>
      </div>

      <!-- Error -->
      <div v-else-if="status === 'error'" class="center">
        <p>Failed to load player.</p>
      </div>

      <!-- Player -->
      <div v-else-if="player" class="player">
        <!-- Header: artwork + meta -->
        <div class="header">
          <img v-if="artwork" :src="artwork" class="artwork" alt="artwork" />
          <div class="meta">
            <h1>{{ player.name }}</h1>
            <p v-if="player.artist" class="artist">{{ player.artist }}</p>
            <p class="track-count">{{ player.tracks.length }} tracks</p>
          </div>
        </div>

        <!-- Now playing -->
        <div class="now-playing">
          <span class="label">Now playing</span>
          <span class="current-name">{{ currentTrackName }}</span>
        </div>

        <!-- Progress bar -->
        <div class="progress-wrap" @click="onSeek">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPct + '%' }" />
          </div>
          <div class="times">
            <span>{{ fmt(state.currentTime) }}</span>
            <span>{{ fmt(state.duration) }}</span>
          </div>
        </div>

        <!-- Transport -->
        <div class="transport">
          <button @click="player.skipPrevious()">&#9664;&#9664;</button>
          <button class="play-btn" @click="togglePlay">
            <span v-if="state.loading || state.buffering">…</span>
            <span v-else-if="state.playing">&#9646;&#9646;</span>
            <span v-else>&#9654;</span>
          </button>
          <button @click="player.skipNext()">&#9654;&#9654;</button>
        </div>

        <!-- Volume -->
        <div class="volume-row">
          <span>Vol</span>
          <input type="range" min="0" max="100" :value="state.volume" @input="onVolume" />
          <span>{{ state.volume }}</span>
        </div>

        <!-- Track list -->
        <ol class="track-list">
          <li
            v-for="track in player.tracks"
            :key="track.id"
            :class="{ active: track.id === state.currentTrackId }"
            @click="player.playTrack(track.id)"
          >
            <span class="track-name">{{ track.name }}</span>
            <span v-if="track.id === state.currentTrackId" class="playing-dot">●</span>
          </li>
        </ol>
      </div>
    </main>
  </CloseLayout>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import CloseLayout from '@/layouts/CloseLayout.vue'
import { samply } from '@/sdk/src/index'
import type { SamplyPlayer, PlayerState } from '@/sdk/src/types'

const PLAYER_ID = 'yH0bL2flLfLK28fMWSJK'

const status = ref<'loading' | 'ready' | 'error'>('loading')
const player = ref<SamplyPlayer | null>(null)
const state = ref<PlayerState>({
  playing: false,
  buffering: false,
  loading: true,
  currentTime: 0,
  duration: 0,
  volume: 100,
})
const currentTrackName = ref('')

const artwork = computed(() => player.value?.artwork.medium || player.value?.artwork.small)
const progressPct = computed(() => {
  if (!state.value.duration) return 0
  return Math.min(100, (state.value.currentTime / state.value.duration) * 100)
})

function fmt(seconds: number): string {
  const s = Math.floor(seconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function togglePlay() {
  if (!player.value) return
  if (state.value.playing) player.value.pause()
  else player.value.play()
}

function onSeek(e: MouseEvent) {
  if (!player.value) return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const fraction = (e.clientX - rect.left) / rect.width
  player.value.seek(Math.max(0, Math.min(1, fraction)))
}

function onVolume(e: Event) {
  const vol = Number((e.target as HTMLInputElement).value)
  player.value?.setVolume(vol)
  state.value.volume = vol
}

// Init
samply
  .load(PLAYER_ID)
  .then((p) => {
    player.value = p
    status.value = 'ready'

    p.on('stateChange', (s) => {
      state.value = s
    })
    p.on('trackChange', (t) => {
      currentTrackName.value = t.name
    })

    // Set initial track name
    const first = p.tracks[0]
    if (first) currentTrackName.value = first.name
  })
  .catch((err) => {
    console.error(err)
    status.value = 'error'
  })

onUnmounted(() => player.value?.destroy())
</script>

<style scoped>
main {
  --bg: #ffedbc;
  --bg2: #f5d98c;
  --fg: #1c1c1e;
  --fg2: #6e6e73;
  --accent: #4a7c59;

  background: var(--bg);
  min-height: 100vh;
  padding: 24px 16px 48px;
  color: var(--fg);
  font-family: monospace;
}

[data-theme='dark'] main {
  --bg: #155015;
  --bg2: #1e6b2e;
  --fg: #f0f0f0;
  --fg2: #8e8e93;
  --accent: #7ecf8e;
}

.center {
  display: flex;
  justify-content: center;
  padding-top: 80px;
  color: var(--fg2);
}

.player {
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Header */
.header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.artwork {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
  background: var(--bg2);
}

.meta h1 {
  font-size: 1.2rem;
  font-weight: bold;
  margin: 0 0 4px;
}

.artist {
  color: var(--fg2);
  margin: 0 0 4px;
  font-size: 0.9rem;
}

.track-count {
  color: var(--fg2);
  margin: 0;
  font-size: 0.8rem;
}

/* Now playing */
.now-playing {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--fg2);
}

.current-name {
  font-size: 1rem;
  font-weight: 600;
}

/* Progress */
.progress-wrap {
  cursor: pointer;
  user-select: none;
}

.progress-bar {
  height: 6px;
  background: var(--bg2);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 3px;
  transition: width 0.1s linear;
}

.times {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--fg2);
  margin-top: 4px;
}

/* Transport */
.transport {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.transport button {
  background: none;
  border: 1px solid var(--fg2);
  border-radius: 4px;
  color: var(--fg);
  cursor: pointer;
  padding: 8px 14px;
  font-size: 0.9rem;
  font-family: monospace;
}

.play-btn {
  font-size: 1.2rem !important;
  padding: 12px 20px !important;
  border-color: var(--accent) !important;
  color: var(--accent) !important;
}

/* Volume */
.volume-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.8rem;
  color: var(--fg2);
}

.volume-row input[type='range'] {
  flex: 1;
  accent-color: var(--accent);
}

/* Track list */
.track-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.track-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  background: var(--bg2);
  font-size: 0.9rem;
  transition: opacity 0.15s;
}

.track-list li:hover {
  opacity: 0.8;
}

.track-list li.active {
  background: var(--accent);
  color: #fff;
}

.playing-dot {
  font-size: 0.6rem;
  opacity: 0.8;
}
</style>
