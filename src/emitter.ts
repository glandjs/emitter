export interface EmitterOptions {
  delimiter?: string // Event delimiter (default: ':')
  maxListeners?: number // Maximum listeners per event (default: 10)
  warn?: boolean // Log warnings for memory leaks (default: false)
}

type Listener = (payload: any) => void

interface ListenerNode {
  fn: Listener
  next: number
  pattern?: string
}

interface RadixNode {
  listeners: number
  listenerCount: number
  children: number[]
  wildcard: number
  isEnd: boolean
}

export class EventEmitter<
  Events extends Record<string, any> = Record<string, any>
> {
  private readonly _d: string // Delimiter
  private readonly _m: number // Max listeners
  private readonly _w: boolean // Warn on memory leak

  //
  private _root = this._createNode()
  private _nodes: RadixNode[] = [this._root]
  private _listeners: ListenerNode[] = []
  private _free: number = -1

  private _cache = new Map<string, number[]>()
  private _cacheHits = new Map<string, number>()

  constructor(options?: EmitterOptions) {
    this._d = options?.delimiter ?? ':'
    this._m = options?.maxListeners ?? 10
    this._w = options?.warn ?? false
  }

  private _createNode(): RadixNode {
    return {
      listeners: -1,
      listenerCount: 0,
      children: [],
      wildcard: -1,
      isEnd: false,
    }
  }

  public on<E extends keyof Events & string>(
    event: E,
    listener: (payload: Events[E]) => void
  ): this {
    return this._addListener(event, listener)
  }

  private _addListener<E extends keyof Events & string>(
    event: E,
    listener: (payload: Events[E]) => void
  ): this {
    const path = String(event)
    this._cache.delete(path)

    const listenerNode: ListenerNode = {
      fn: listener as Listener,
      next: -1,
    }

    let idx: number
    if (this._free !== -1) {
      idx = this._free
      this._free = this._listeners[idx].next
      this._listeners[idx] = listenerNode
    } else {
      idx = this._listeners.push(listenerNode) - 1
    }

    if (path.includes('*')) {
      listenerNode.pattern = path
      this._addWildcardListener(path, idx)
      return this
    }

    const parts = path.split(this._d)
    let node = this._root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isLast = i === parts.length - 1

      let childIdx = node.children[part.charCodeAt(0)]
      if (childIdx === undefined) {
        childIdx = this._nodes.push(this._createNode()) - 1
        node.children[part.charCodeAt(0)] = childIdx
      }

      node = this._nodes[childIdx]

      if (isLast) {
        node.isEnd = true

        if (this._m > 0 && node.listenerCount >= this._m && this._w) {
          console.warn(
            `MaxListenersExceededWarning: ${node.listenerCount} listeners for '${path}'`
          )
        }

        listenerNode.next = node.listeners
        node.listeners = idx
        node.listenerCount++
      }
    }

    return this
  }

  private _addWildcardListener(pattern: string, listenerIdx: number): void {
    const parts = pattern.split(this._d)
    let node = this._root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (part === '*') {
        if (node.wildcard === -1) {
          node.wildcard = this._nodes.push(this._createNode()) - 1
        }
        node = this._nodes[node.wildcard]
      } else {
        let childIdx = node.children[part.charCodeAt(0)]
        if (childIdx === undefined) {
          childIdx = this._nodes.push(this._createNode()) - 1
          node.children[part.charCodeAt(0)] = childIdx
        }
        node = this._nodes[childIdx]
      }

      if (i === parts.length - 1) {
        const listenerNode = this._listeners[listenerIdx]
        listenerNode.next = node.listeners
        node.listeners = listenerIdx
        node.listenerCount++
        node.isEnd = true
      }
    }
  }

  public off<E extends keyof Events & string>(
    event: E,
    listener?: (payload: Events[E]) => void
  ): this {
    const path = String(event)
    this._cache.delete(path)

    if (path.includes('*')) {
      return this._removeWildcardListener(path, listener as Listener)
    }

    const parts = path.split(this._d)
    let node = this._root
    const nodeStack = [0]

    for (const part of parts) {
      const childIdx = node.children[part.charCodeAt(0)]
      if (childIdx === undefined) return this

      nodeStack.push(childIdx)
      node = this._nodes[childIdx]
    }

    if (!node.isEnd) return this

    if (listener) {
      let prevIdx = -1
      let currIdx = node.listeners

      while (currIdx !== -1) {
        const curr = this._listeners[currIdx]

        if (curr.fn === listener) {
          if (prevIdx === -1) {
            node.listeners = curr.next
          } else {
            this._listeners[prevIdx].next = curr.next
          }

          curr.next = this._free
          this._free = currIdx
          node.listenerCount--
          break
        }

        prevIdx = currIdx
        currIdx = curr.next
      }
    } else {
      let currIdx = node.listeners

      while (currIdx !== -1) {
        const next = this._listeners[currIdx].next
        this._listeners[currIdx].next = this._free
        this._free = currIdx
        currIdx = next
      }

      node.listeners = -1
      node.listenerCount = 0
      node.isEnd = false
    }

    return this
  }

  private _removeWildcardListener(pattern: string, listener?: Listener): this {
    const parts = pattern.split(this._d)
    let node = this._root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (part === '*') {
        if (node.wildcard === -1) return this
        node = this._nodes[node.wildcard]
      } else {
        const childIdx = node.children[part.charCodeAt(0)]
        if (childIdx === undefined) return this
        node = this._nodes[childIdx]
      }
    }

    if (!node.isEnd) return this

    let prevIdx = -1
    let currIdx = node.listeners

    while (currIdx !== -1) {
      const curr = this._listeners[currIdx]
      const next = curr.next

      if (!listener || curr.fn === listener) {
        if (prevIdx === -1) {
          node.listeners = next
        } else {
          this._listeners[prevIdx].next = next
        }

        curr.next = this._free
        this._free = currIdx
        node.listenerCount--

        if (listener) break
      } else {
        prevIdx = currIdx
      }

      currIdx = next
    }

    return this
  }

  public emit<E extends keyof Events & string>(
    event: E,
    payload: Events[E]
  ): this {
    this._emit(String(event), payload)
    return this
  }

  private _emit(path: string, payload: any): void {
    let listeners = this._cache.get(path)

    if (listeners) {
      const hits = (this._cacheHits.get(path) || 0) + 1
      this._cacheHits.set(path, hits)

      for (let i = 0; i < listeners.length; i++) {
        try {
          this._listeners[listeners[i]].fn(payload)
        } catch (error) {
          console.error('Error in event listener:', error)
        }
      }
      return
    }

    const collectListeners: number[] = []
    const parts = path.split(this._d)

    this._matchExact(this._root, parts, 0, collectListeners)

    this._matchWildcard(this._root, path, parts, 0, collectListeners)

    for (let i = 0; i < collectListeners.length; i++) {
      try {
        this._listeners[collectListeners[i]].fn(payload)
      } catch (error) {
        console.error('Error in event listener:', error)
      }
    }

    const hits = this._cacheHits.get(path) || 0
    this._cacheHits.set(path, hits + 1)

    if (hits > 3 && collectListeners.length > 0) {
      this._cache.set(path, collectListeners.slice())
    }
  }

  private _matchExact(
    node: RadixNode,
    parts: string[],
    depth: number,
    results: number[]
  ): void {
    if (depth === parts.length) {
      if (node.isEnd) {
        let idx = node.listeners
        while (idx !== -1) {
          results.push(idx)
          idx = this._listeners[idx].next
        }
      }
      return
    }

    const part = parts[depth]
    const childIdx = node.children[part.charCodeAt(0)]

    if (childIdx !== undefined) {
      this._matchExact(this._nodes[childIdx], parts, depth + 1, results)
    }
  }

  private _matchWildcard(
    node: RadixNode,
    fullPath: string,
    parts: string[],
    depth: number,
    results: number[]
  ): void {
    if (node.wildcard !== -1) {
      const wildcardNode = this._nodes[node.wildcard]
      if (wildcardNode.isEnd) {
        let idx = wildcardNode.listeners
        while (idx !== -1) {
          const listener = this._listeners[idx]
          const pattern = listener.pattern

          if (pattern && this._matchPattern(pattern, fullPath)) {
            results.push(idx)
          }

          idx = listener.next
        }
      }

      if (depth < parts.length) {
        this._matchWildcard(wildcardNode, fullPath, parts, depth + 1, results)
      }
    }

    if (depth < parts.length) {
      const part = parts[depth]
      const childIdx = node.children[part.charCodeAt(0)]

      if (childIdx !== undefined) {
        this._matchWildcard(
          this._nodes[childIdx],
          fullPath,
          parts,
          depth + 1,
          results
        )
      }
    }
  }

  private _matchPattern(pattern: string, path: string): boolean {
    const patternParts = pattern.split(this._d)
    const pathParts = path.split(this._d)

    if (patternParts.length !== pathParts.length) return false

    for (let i = 0; i < patternParts.length; i++) {
      const pp = patternParts[i]
      const ep = pathParts[i]

      if (pp !== '*' && pp !== ep) return false
    }

    return true
  }
}
