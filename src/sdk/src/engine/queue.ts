export interface QueueItemSource {
  aac: string
  flac?: string
}

export interface QueueItemTransition {
  /** Absolute end time (seconds) of this track in the gapless master manifest */
  aac: number
  flac?: number
}

export interface QueueItem {
  id: string
  audioboxid: string
  src: QueueItemSource
  name: string
  loudness?: { integratedLufs?: number; truePeak?: number }
  transition?: QueueItemTransition
}

export interface GaplessSrc {
  aac: string
  flac?: string
}

export class Queue {
  items: QueueItem[] = []
  gaplessSrc?: GaplessSrc
  private _index = 0

  get current(): QueueItem | undefined {
    return this.items[this._index]
  }

  get index(): number {
    return this._index
  }

  get atEnd(): boolean {
    return this._index === this.items.length - 1
  }

  get gaplessAvailable(): boolean {
    return !!this.gaplessSrc && this.items.length > 1 && this.items.every((i) => i.transition !== undefined)
  }

  init(items: QueueItem[], gaplessSrc?: GaplessSrc, startId?: string) {
    this.items = items
    this.gaplessSrc = gaplessSrc
    if (startId) {
      const idx = items.findIndex((i) => i.id === startId)
      this._index = idx >= 0 ? idx : 0
    } else {
      this._index = 0
    }
  }

  setByAudioboxId(audioboxid: string): boolean {
    const idx = this.items.findIndex((i) => i.audioboxid === audioboxid)
    if (idx < 0) return false
    this._index = idx
    return true
  }

  skipNext() {
    this._index = this._index >= this.items.length - 1 ? 0 : this._index + 1
  }

  skipPrevious() {
    this._index = this._index <= 0 ? this.items.length - 1 : this._index - 1
  }

  /** Absolute start time (seconds) of the current track in the gapless manifest */
  gaplessStart(quality: 'compressed' | 'lossless' = 'compressed'): number {
    const prev = this.items[this._index - 1]?.transition
    if (quality === 'lossless' && prev?.flac) return prev.flac
    return prev?.aac ?? 0
  }

  /** Absolute end time (seconds) of the current track in the gapless manifest */
  gaplessEnd(quality: 'compressed' | 'lossless' = 'compressed'): number {
    const curr = this.items[this._index]?.transition
    if (quality === 'lossless' && curr?.flac) return curr.flac
    return curr?.aac ?? 0
  }

  /** Identify which queue item contains a given absolute gapless time position */
  itemAtTime(
    absoluteTime: number,
    quality: 'compressed' | 'lossless' = 'compressed',
  ): QueueItem | undefined {
    const TOLERANCE = 0.01
    let i = 0
    for (const item of this.items) {
      const t =
        quality === 'lossless' && item.transition?.flac
          ? item.transition.flac
          : item.transition?.aac
      if (t === undefined || t >= absoluteTime + TOLERANCE) break
      i++
    }
    return this.items[i] ?? this.items[0]
  }
}
