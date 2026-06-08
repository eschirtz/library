export interface Artwork {
  small?: string
  medium?: string
  large?: string
}

export interface Track {
  id: string
  name: string
}

export interface PlayerState {
  playing: boolean
  buffering: boolean
  loading: boolean
  currentTime: number
  duration: number
  volume: number
  currentTrackId?: string
}

export interface SamplyPlayer {
  name: string
  artist?: string
  artwork: Artwork
  tracks: Track[]
  play(): void
  pause(): void
  /** Seek within the current track, fraction 0–1 */
  seek(fraction: number): void
  skipNext(): void
  skipPrevious(): void
  playTrack(id: string): void
  setVolume(volume: number): void
  getState(): PlayerState
  on(event: 'stateChange', fn: (state: PlayerState) => void): void
  on(event: 'trackChange', fn: (track: Track) => void): void
  on(event: 'timeUpdate', fn: (time: { currentTime: number; duration: number }) => void): void
  on(event: string, fn: (...args: unknown[]) => void): void
  off(event: string, fn: (...args: unknown[]) => void): void
  destroy(): void
}
