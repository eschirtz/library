import useFirebase from './useFirebase'
import { fetchPlayer } from './data/fetchPlayer'
import { ShakaEngine } from './engine/shaka'
import { AudioContextEngine } from './engine/audioContext'
import { EventEmitter } from './internal/events'
import type { Queue, QueueItem } from './engine/queue'
import type { PlayerMeta, ProjectMeta } from './data/buildQueue'
import type { SamplyPlayer, PlayerState, Track, Artwork } from './types'

export type { SamplyPlayer, PlayerState, Track, Artwork }

// ── Player implementation ────────────────────────────────────────────────────

class SamplyPlayerImpl {
  name: string
  artist?: string
  artwork: Artwork
  tracks: Track[]

  private _shaka: ShakaEngine
  private _ctx: AudioContextEngine
  private _emitter: EventEmitter
  private _queue: Queue
  private _gapless: boolean
  private _currentTrackId?: string

  constructor(playerMeta: PlayerMeta, projectMeta: ProjectMeta, queue: Queue) {
    this.name = playerMeta.name || projectMeta.name || ''
    this.artist = playerMeta.artist
    this.artwork = {
      small: playerMeta.artwork?.small?.src || projectMeta.artwork?.small?.src,
      medium: playerMeta.artwork?.medium?.src || projectMeta.artwork?.medium?.src,
      large: playerMeta.artwork?.large?.src || projectMeta.artwork?.large?.src,
    }
    this.tracks = queue.items.map((item) => ({ id: item.audioboxid, name: item.name }))

    this._queue = queue
    this._shaka = new ShakaEngine()
    this._ctx = new AudioContextEngine()
    this._emitter = new EventEmitter()
    this._gapless = queue.gaplessAvailable
  }

  // ── Internal loading ───────────────────────────────────────────────────────

  async _initEngine(): Promise<void> {
    if (this._gapless) {
      await this._loadGapless()
    } else {
      await this._loadTrack(this._queue.current)
    }
  }

  private async _loadGapless(): Promise<void> {
    const src = this._queue.gaplessSrc!.aac
    await this._shaka.init(src, {
      onload: () => {
        this._initAudioContext()
        this._notifyTrackChange(this._queue.current)
        this._emitState()
      },
      ontimeupdate: (absoluteTime, _) => {
        const item = this._queue.itemAtTime(absoluteTime)
        if (item && item.audioboxid !== this._currentTrackId) {
          this._queue.setByAudioboxId(item.audioboxid)
          this._notifyTrackChange(item)
        }
        const start = this._queue.gaplessStart()
        const end = this._queue.gaplessEnd()
        this._emitter.emit('timeUpdate', {
          currentTime: absoluteTime - start,
          duration: end - start,
        })
        this._emitState()
      },
      onend: () => this._emitState(),
      onplay: () => this._emitState(),
      onpause: () => this._emitState(),
      onbuffering: () => this._emitState(),
      onerror: (code, message) => {
        console.error('Playback error:', code, message)
        this._emitState()
      },
    })
  }

  private async _loadTrack(item: QueueItem | undefined): Promise<void> {
    if (!item) return
    await this._shaka.init(item.src.aac, {
      onload: () => {
        this._initAudioContext()
        this._notifyTrackChange(item)
        this._emitState()
      },
      ontimeupdate: (currentTime, duration) => {
        this._emitter.emit('timeUpdate', { currentTime, duration })
        this._emitState()
      },
      onend: () => {
        this._queue.skipNext()
        this._loadTrack(this._queue.current)
      },
      onplay: () => this._emitState(),
      onpause: () => this._emitState(),
      onbuffering: () => this._emitState(),
      onerror: (code, message) => {
        console.error('Playback error:', code, message)
        this._emitState()
      },
    })
  }

  private _initAudioContext() {
    const audio = this._shaka.getAudio()
    if (audio) {
      this._ctx.init(audio)
      this._ctx.resume()
    }
  }

  private _notifyTrackChange(item?: QueueItem) {
    if (!item) return
    this._currentTrackId = item.audioboxid
    this._emitter.emit('trackChange', { id: item.audioboxid, name: item.name })
  }

  private _emitState() {
    this._emitter.emit('stateChange', this.getState())
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  play() {
    this._ctx.resume()
    this._shaka.play()
  }

  pause() {
    this._shaka.pause()
  }

  seek(fraction: number) {
    if (this._gapless) {
      const start = this._queue.gaplessStart()
      const end = this._queue.gaplessEnd()
      this._shaka.seek(start + fraction * (end - start))
    } else {
      this._shaka.seek(fraction * this._shaka.duration)
    }
  }

  skipNext() {
    this._queue.skipNext()
    if (this._gapless) {
      const start = this._queue.gaplessStart()
      this._shaka.seek(start)
      this._notifyTrackChange(this._queue.current)
      this._emitState()
    } else {
      this._loadTrack(this._queue.current)
    }
  }

  skipPrevious() {
    this._queue.skipPrevious()
    if (this._gapless) {
      const start = this._queue.gaplessStart()
      this._shaka.seek(start)
      this._notifyTrackChange(this._queue.current)
      this._emitState()
    } else {
      this._loadTrack(this._queue.current)
    }
  }

  playTrack(audioboxid: string) {
    if (!this._queue.setByAudioboxId(audioboxid)) return
    if (this._gapless) {
      console.log('Playing gapless track', audioboxid)
      const start = this._queue.gaplessStart()
      this._shaka.seek(start)
      this._notifyTrackChange(this._queue.current)
      this._emitState()
    } else {
      console.log('Playing non-gapless track', audioboxid)
      this._loadTrack(this._queue.current)
    }
  }

  setVolume(volume: number) {
    this._shaka.setVolume(volume)
    this._emitState()
  }

  getState(): PlayerState {
    return {
      playing: this._shaka.playing,
      buffering: this._shaka.buffering,
      loading: this._shaka.loading,
      currentTime: this._shaka.currentTime,
      duration: this._shaka.duration,
      volume: this._shaka.volume,
      currentTrackId: this._currentTrackId,
    }
  }

  on(event: string, fn: (...args: unknown[]) => void) {
    this._emitter.on(event, fn)
  }

  off(event: string, fn: (...args: unknown[]) => void) {
    this._emitter.off(event, fn)
  }

  destroy() {
    this._shaka.destroy()
    this._ctx.destroy()
    this._emitter.removeAll()
  }
}

// ── Public factory ───────────────────────────────────────────────────────────

export const samply = {
  async load(playerId: string): Promise<SamplyPlayer> {
    const fb = useFirebase()
    await fb.init()

    const { playerMeta, projectMeta, queue } = await fetchPlayer(playerId)
    const player = new SamplyPlayerImpl(playerMeta, projectMeta, queue)
    await player._initEngine()
    return player as unknown as SamplyPlayer
  },
}
