export class EventEmitter<T = Record<string, any>> {
  /**
   * Every path segment maps to a node holding its own listeners and children.
   * Using one shape for leaves and branches keeps `on`/`off` free of type checks.
   */
  private root: Node = createNode();
  private cache: Record<string, CacheEntry> = Object.create(null);
  private id = 0;
  constructor(
    private spliter: string = ':',
    private maxCacheSize = 64,
  ) {}

  public on<K extends keyof T & string>(event: K, listener: (payload: T[K]) => void) {
    let node = this.root;
    const parts = event.split(this.spliter);

    for (let i = 0, len = parts.length; i < len; i++) {
      const key = parts[i]!;
      node.children[key] = node.children[key] || createNode();
      node = node.children[key]!;
    }
    node.listeners.push(listener);

    this.cache = Object.create(null);
    return this;
  }

  public off<K extends keyof T & string>(event: K, listener?: (payload: T[K]) => void) {
    const parts = event.split(this.spliter);
    const path: Node[] = [];
    let node = this.root;

    for (let i = 0, len = parts.length; i < len; i++) {
      const child = node.children[parts[i]!];
      if (!child) return this;
      path.push(node);
      node = child;
    }

    if (listener) {
      const index = node.listeners.indexOf(listener);
      if (index < 0) return this;
      node.listeners.splice(index, 1);
    } else {
      node.listeners.length = 0;
    }

    // Prune upward, stopping at the first node that still holds a listener or a child.
    for (let i = parts.length - 1; i >= 0; i--) {
      const parent = path[i]!;
      const key = parts[i]!;
      const child = parent.children[key]!;
      if (child.listeners.length || Object.keys(child.children).length) break;
      delete parent.children[key];
    }

    this.cache = Object.create(null);
    return this;
  }

  public emit<K extends keyof T & string>(event: K, payload: T[K]) {
    const cached = this.cache[event];
    if (cached) {
      cached.timestamp = ++this.id;
      for (let i = 0, len = cached.listeners.length; i < len; i++) {
        cached.listeners[i]!(payload);
      }
      return this;
    }

    const listeners: Listener[] = [];
    this.find(this.root, event.split(this.spliter), 0, listeners);

    if (listeners.length) {
      this.cache[event] = { listeners, timestamp: ++this.id };
      const keys = Object.keys(this.cache);
      if (keys.length > this.maxCacheSize) {
        let oldestKey = keys[0]!;
        let oldestTimestamp = this.cache[oldestKey]!.timestamp;
        for (let i = 1, len = keys.length; i < len; i++) {
          const key = keys[i]!;
          if (this.cache[key]!.timestamp < oldestTimestamp) {
            oldestKey = key;
            oldestTimestamp = this.cache[key]!.timestamp;
          }
        }
        delete this.cache[oldestKey];
      }
    }

    for (let i = 0, len = listeners.length; i < len; i++) {
      listeners[i]!(payload);
    }
    return this;
  }

  /**
   * Collects the listeners registered for `parts[depth..]`, walking the exact
   * segment first and then a single `*` segment. A literal `*` in the event
   * name matches only the exact branch, so it never fires twice.
   */
  private find(node: Node, parts: string[], depth: number, listeners: Listener[]) {
    if (depth === parts.length) {
      if (node.listeners.length) listeners.push(...node.listeners);
      return;
    }

    const part = parts[depth]!;
    const exact = node.children[part];
    if (exact) this.find(exact, parts, depth + 1, listeners);

    if (part !== '*') {
      const wildcard = node.children['*'];
      if (wildcard) this.find(wildcard, parts, depth + 1, listeners);
    }
  }
}

type Listener = (payload: any) => void;
type Node = { listeners: Listener[]; children: Record<string, Node> };
type CacheEntry = { listeners: Listener[]; timestamp: number };

// Null-prototype maps keep event names like `constructor` or `toString`
// from resolving to something inherited from Object.prototype.
const createNode = (): Node => ({ listeners: [], children: Object.create(null) });
