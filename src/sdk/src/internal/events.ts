type Listener = (...args: unknown[]) => void

export class EventEmitter {
  private _listeners: Map<string, Set<Listener>> = new Map()

  on(event: string, fn: Listener) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set())
    this._listeners.get(event)!.add(fn)
  }

  off(event: string, fn: Listener) {
    this._listeners.get(event)?.delete(fn)
  }

  emit(event: string, ...args: any[]) {
    this._listeners.get(event)?.forEach((fn) => fn(...args))
  }

  removeAll() {
    this._listeners.clear()
  }
}
