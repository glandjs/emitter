export interface EventEmitterOptions {
  /** Event delimiter (default: ':') */
  delimiter?: string
  /** Maximum listeners per event (default: 10) */
  maxListeners?: number
  /** Log warnings for potential memory leaks (default: false) */
  verboseMemoryLeak?: boolean
}

export interface EventOptions {
  /** Whether to handle events asynchronously */
  async: boolean
  /** Timeout for async operations (ms) */
  timeout?: number
}

type Listener = (payload: any) => void

export class EventEmitter<
  EM extends Record<string, any> = Record<string, any>
> {
  private readonly _delimiter: string
  private readonly _maxListeners: number
  private readonly _verboseMemoryLeak: boolean

  private _events: Record<string, Listener[]> = Object.create(null)
  private _wildcardEvents: Record<string, Array<[string, Listener]>> =
    Object.create(null)

  private _patternCache: Record<string, Record<string, boolean>> =
    Object.create(null)

  constructor(options?: EventEmitterOptions) {
    this._delimiter = options?.delimiter ?? ':'
    this._maxListeners = options?.maxListeners ?? 10
    this._verboseMemoryLeak = options?.verboseMemoryLeak ?? false
  }

  public on<E extends keyof EM & string>(
    event: E,
    listener: (payload: EM[E]) => void
  ): this
  public on<E extends keyof EM & string>(
    event: E,
    listener: (payload: EM[E]) => void,
    options: EventOptions
  ): Promise<this>
  public on<E extends keyof EM & string>(
    event: E,
    listener: (payload: EM[E]) => void,
    options?: EventOptions
  ): this | Promise<this> {
    if (options?.async) {
      return Promise.resolve().then(() => this._addListener(event, listener))
    }

    return this._addListener(event, listener)
  }

  public off<E extends keyof EM & string>(
    event: E,
    listener?: (payload: EM[E]) => void
  ): this {
    const eventName = event as string

    if (eventName.includes('*')) {
      const pattern = eventName
      const wildcardKey = this._getWildcardKey(pattern)

      const listeners = this._wildcardEvents[wildcardKey]
      if (!listeners) return this

      if (!listener) {
        delete this._wildcardEvents[wildcardKey]
      } else {
        const idx = listeners.findIndex(
          ([p, l]) => p === pattern && l === listener
        )
        if (idx !== -1) {
          listeners.splice(idx, 1)
          if (listeners.length === 0) {
            delete this._wildcardEvents[wildcardKey]
          }
        }
      }

      this._patternCache = Object.create(null)

      return this
    }

    const eventListeners = this._events[eventName]
    if (!eventListeners) return this

    if (!listener) {
      delete this._events[eventName]
    } else {
      const idx = eventListeners.indexOf(listener)
      if (idx !== -1) {
        eventListeners.splice(idx, 1)
        if (eventListeners.length === 0) {
          delete this._events[eventName]
        }
      }
    }

    return this
  }

  public emit<E extends keyof EM & string>(event: E, payload: EM[E]): this
  public emit<E extends keyof EM & string>(
    event: E,
    payload: EM[E],
    options: EventOptions
  ): Promise<this>
  public emit<E extends keyof EM & string>(
    event: E,
    payload: EM[E],
    options?: EventOptions
  ): this | Promise<this> {
    const eventName = event as string

    if (options?.async) {
      return new Promise((resolve, reject) => {
        const timeoutId = options.timeout
          ? setTimeout(
              () => reject(new Error(`Event emission timeout: ${eventName}`)),
              options.timeout
            )
          : null

        Promise.resolve().then(() => {
          try {
            this._emitEvent(eventName, payload)
            if (timeoutId) clearTimeout(timeoutId)
            resolve(this)
          } catch (error) {
            if (timeoutId) clearTimeout(timeoutId)
            reject(error)
          }
        })
      })
    }

    this._emitEvent(eventName, payload)
    return this
  }

  private _addListener<E extends keyof EM & string>(
    event: E,
    listener: (payload: EM[E]) => void
  ): this {
    const eventName = event as string

    if (eventName.includes('*')) {
      const pattern = eventName
      const wildcardKey = this._getWildcardKey(pattern)

      if (!this._wildcardEvents[wildcardKey]) {
        this._wildcardEvents[wildcardKey] = []
      }

      const listeners = this._wildcardEvents[wildcardKey]

      if (this._maxListeners > 0 && listeners.length >= this._maxListeners) {
        if (this._verboseMemoryLeak) {
          console.warn(
            `MaxListenersExceededWarning: Possible memory leak detected. ${listeners.length} listeners added for wildcard pattern '${pattern}'`
          )
        }
      }

      listeners.push([pattern, listener as Listener])
      return this
    }

    if (!this._events[eventName]) {
      this._events[eventName] = []
    }

    const listeners = this._events[eventName]

    if (this._maxListeners > 0 && listeners.length >= this._maxListeners) {
      if (this._verboseMemoryLeak) {
        console.warn(
          `MaxListenersExceededWarning: Possible memory leak detected. ${listeners.length} listeners added for event '${eventName}'`
        )
      }
    }

    listeners.push(listener as Listener)
    return this
  }

  private _emitEvent(eventName: string, payload: any): void {
    const directListeners = this._events[eventName]
    if (directListeners) {
      const listeners = directListeners.slice()
      for (let i = 0; i < listeners.length; i++) {
        try {
          listeners[i](payload)
        } catch (error) {
          console.error('Error in event listener:', error)
        }
      }
    }

    const wildcardKeys = Object.keys(this._wildcardEvents)
    if (wildcardKeys.length === 0) return

    for (let i = 0; i < wildcardKeys.length; i++) {
      const key = wildcardKeys[i]
      const wildcardListeners = this._wildcardEvents[key]

      for (let j = 0; j < wildcardListeners.length; j++) {
        const [pattern, listener] = wildcardListeners[j]

        if (this._matchPattern(pattern, eventName)) {
          try {
            listener(payload)
          } catch (error) {
            console.error('Error in wildcard event listener:', error)
          }
        }
      }
    }
  }

  private _getWildcardKey(pattern: string): string {
    return pattern
      .split(this._delimiter)
      .map((part) => (part === '*' ? '*' : '#'))
      .join(this._delimiter)
  }

  private _matchPattern(pattern: string, eventName: string): boolean {
    const patternCache =
      this._patternCache[pattern] || (this._patternCache[pattern] = {})

    if (patternCache[eventName] !== undefined) {
      return patternCache[eventName]
    }

    const patternParts = pattern.split(this._delimiter)
    const eventParts = eventName.split(this._delimiter)

    if (patternParts.length !== eventParts.length && !pattern.includes('*')) {
      patternCache[eventName] = false
      return false
    }

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i]
      const eventPart = eventParts[i]

      if (patternPart === '*') {
        continue
      }

      if (!eventPart || patternPart !== eventPart) {
        patternCache[eventName] = false
        return false
      }
    }

    patternCache[eventName] = true
    return true
  }
}
