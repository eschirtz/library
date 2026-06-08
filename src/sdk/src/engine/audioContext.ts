import { db2gain } from './loudness'

export class AudioContextEngine {
  private ctx?: AudioContext
  private gain?: GainNode
  private source?: MediaElementAudioSourceNode

  init(audio: HTMLAudioElement) {
    if (this.ctx && this.gain) return
    // @ts-ignore webkitAudioContext for old Safari
    this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    this.gain = this.ctx.createGain()
    this._attachSource(audio)
    this.gain.connect(this.ctx.destination)
  }

  resume() {
    this.ctx?.resume()
  }

  private _attachSource(audio: HTMLAudioElement) {
    let source: MediaElementAudioSourceNode | undefined
    try {
      source = this.ctx?.createMediaElementSource(audio)
    } catch {
      console.warn('AudioContext: unable to create source node, may already be connected')
    }
    if (!source) return
    this.source?.disconnect()
    this.source = source
    if (this.gain) this.source.connect(this.gain)
  }

  applyGain(db: number) {
    if (!this.ctx || !this.gain) return
    const gainVal = db2gain(db)
    this.gain.gain.cancelScheduledValues(this.ctx.currentTime)
    this.gain.gain.setValueAtTime(this.gain.gain.value, this.ctx.currentTime)
    this.gain.gain.exponentialRampToValueAtTime(gainVal, this.ctx.currentTime + 0.1)
  }

  destroy() {
    this.source?.disconnect()
    this.gain?.disconnect()
    this.ctx?.close()
    this.ctx = undefined
    this.gain = undefined
    this.source = undefined
  }
}
