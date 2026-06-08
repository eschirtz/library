// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as _shaka from 'shaka-player'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const shaka = _shaka as any
import { logTaper } from './loudness'
import { isIOS } from './platform'

const ALMOST_ZERO = 0.00001
const RECOVERABLE_CODES = [7000] // LOAD_INTERRUPTED
const FLAC_NOT_SUPPORTED_CODE = 4032
const PLAY_ERROR_RESTRICTIONS_CODE = 4012
const PLAY_ABORT_CODE = 20

export interface ShakaEngineCallbacks {
  onload?: () => void
  onloaderror?: (e: unknown) => void
  onbuffering?: (buffering: boolean) => void
  onpause?: () => void
  onend?: () => void
  onplay?: () => void
  onerror?: (code: string, message: string) => void
  ontimeupdate?: (currentTime: number, duration: number) => void
}

export class ShakaEngine {
  loading = false
  buffering = false
  playing = false
  volume = 100
  muted = false
  currentTime = 0
  duration = ALMOST_ZERO

  private _player: any
  private _audio?: HTMLAudioElement
  private _callbacks?: ShakaEngineCallbacks
  private _lastSrc?: string
  private _frameID?: number
  private _playerListenersAttached = false

  constructor() {
    shaka.media.ManifestParser.registerParserByMime(
      'audio/x-mpegurl',
      () => new shaka.hls.HlsParser(),
    )
    shaka.polyfill.installAll()
    if (shaka.Player.isBrowserSupported()) {
      this._player = new shaka.Player()
      this._player.configure('streaming.bufferingGoal', 30)
      this._player.configure('streaming.bufferBehind', 5)
      this._player.configure('streaming.segmentPrefetchLimit', 1)
    } else {
      console.error('ShakaEngine: browser not supported')
    }
  }

  async init(src: string, callbacks: ShakaEngineCallbacks): Promise<void> {
    this._callbacks = callbacks
    this.loading = true
    this.playing = false

    if (!this._audio) {
      this._audio = new Audio()
      this._audio.crossOrigin = 'anonymous'
      await this._player.attach(this._audio)
    }

    this._attachAudioListeners()
    if (!this._playerListenersAttached) {
      this._attachPlayerListeners()
      this._playerListenersAttached = true
    }

    try {
      await this._player.load(src)
      this._lastSrc = src
    } catch (e: any) {
      if (!RECOVERABLE_CODES.includes(e?.code)) {
        this._handleError(e)
        callbacks.onloaderror?.(e)
      }
    }
  }

  async play(): Promise<void> {
    if (!this._audio) return
    if (isIOS() && this._audio.readyState !== 4) {
      this._audio.addEventListener(
        'canplaythrough',
        () => setTimeout(() => this._audio?.play().catch(() => {}), 10),
        { once: true },
      )
    } else {
      await this._audio.play().catch((e) => {
        if (e?.code !== PLAY_ABORT_CODE) throw e
      })
    }
  }

  pause(): void {
    this._audio?.pause()
  }

  async seek(seconds: number): Promise<void> {
    if (!this._audio) return
    if (isIOS()) {
      const wasPaused = this._audio.paused
      this._audio.pause()
      this._audio.currentTime = seconds
      this.currentTime = seconds
      this._callbacks?.ontimeupdate?.(this.currentTime, this.duration)
      if (!wasPaused) {
        this._audio.addEventListener(
          'canplaythrough',
          () => setTimeout(() => this._audio?.play(), 10),
          { once: true },
        )
      }
    } else {
      this._audio.currentTime = seconds
      this.currentTime = seconds
      this._callbacks?.ontimeupdate?.(this.currentTime, this.duration)
    }
  }

  setVolume(volume: number): void {
    if (volume < 0 || volume > 100) throw new Error('Volume must be 0–100')
    if (this._audio) this._audio.volume = logTaper(volume / 100)
    this.volume = volume
  }

  setMuted(muted: boolean): void {
    if (this._audio) this._audio.muted = muted
    this.muted = muted
  }

  getAudio(): HTMLAudioElement | undefined {
    return this._audio
  }

  async unload(): Promise<void> {
    this.pause()
    cancelAnimationFrame(this._frameID ?? 0)
    this.loading = false
    this.playing = false
    await this._player?.unload(true)
  }

  destroy(): void {
    this.unload()
    this._player?.destroy()
    this._callbacks = undefined
  }

  private _attachAudioListeners() {
    if (!this._audio) return
    cancelAnimationFrame(this._frameID ?? 0)

    const tick = () => {
      if (this._audio && !this._audio.paused) {
        this.currentTime = this._audio.currentTime
        this._callbacks?.ontimeupdate?.(this.currentTime, this.duration)
      }
      this._frameID = requestAnimationFrame(tick)
    }

    this._audio.onplaying = () => {
      cancelAnimationFrame(this._frameID ?? 0)
      tick()
      this.playing = true
      this._callbacks?.onplay?.()
    }
    this._audio.onpause = () => {
      cancelAnimationFrame(this._frameID ?? 0)
      this.playing = false
      this._callbacks?.onpause?.()
    }
    this._audio.onended = () => {
      cancelAnimationFrame(this._frameID ?? 0)
      this.playing = false
      this._callbacks?.onend?.()
    }
  }

  private _attachPlayerListeners() {
    this._player.addEventListener('loaded', () => {
      this.loading = false
      this.buffering = false
      this.currentTime = 0
      this.duration = this._player?.seekRange().end ?? ALMOST_ZERO
      this._callbacks?.onload?.()
    })
    this._player.addEventListener('buffering', (e: any) => {
      this.buffering = e.buffering
      this._callbacks?.onbuffering?.(e.buffering)
    })
    this._player.addEventListener('error', (e: any) => {
      this._handleError(e.detail)
    })
  }

  private async _handleError(error: any) {
    if (!error || !('code' in error)) return
    const code = Number(error.code)
    if (RECOVERABLE_CODES.includes(code)) return
    if (code === PLAY_ERROR_RESTRICTIONS_CODE && this._lastSrc && this._callbacks) {
      // Safari restriction error on initial load — retry once
      await this.init(this._lastSrc, this._callbacks)
      return
    }
    if (code === FLAC_NOT_SUPPORTED_CODE) {
      this._callbacks?.onerror?.('FLAC_NOT_SUPPORTED', 'Try switching audio quality.')
      return
    }
    console.error('ShakaEngine error:', error)
    this._callbacks?.onerror?.('UNKNOWN_ERROR', 'An unknown error occurred.')
  }
}
