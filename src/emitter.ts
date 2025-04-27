export class EventEmitter<T = Record<string, any>> {
  private tree = {};
  private cache = {};
  private id = 0;
  constructor(private spliter: string = ':', private maxCacheSize = 6) {}

  public on<K extends keyof T & string>(event: K, listener: (payload: T[K]) => void) {
    let node = this.tree;
    const parts = event.split(this.spliter);

    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i]!;
      node[part] = node[part] || (i === len - 1 ? [] : {});
      if (i === len - 1) {
        node[part].push(listener);
      } else {
        node = node[part];
      }
    }

    this.cache = {};
    return this;
  }

  public off<K extends keyof T & string>(event: K, listener?: (payload: T[K]) => void) {
    const parts = event.split(this.spliter);
    let node = this.tree;
    const stack = [{ node, key: parts[0] }];
    let shouldCleanup = false;

    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i]!;
      if (!node[part]) return this;

      if (i === len - 1) {
        if (!listener) {
          delete node[part];
          shouldCleanup = true;
        } else {
          const listeners = node[part];
          const index = listeners.indexOf(listener);
          if (index >= 0) {
            listeners.splice(index, 1);
            if (!listeners.length) {
              delete node[part];
              shouldCleanup = true;
            }
          }
        }
      } else {
        node = node[part];
        if (i < len - 1) stack.push({ node, key: parts[i + 1] });
      }
    }

    if (shouldCleanup) {
      for (let i = stack.length - 1; i >= 0; i--) {
        const { node, key } = stack[i];
        if (node[key] && Object.keys(node[key]).length === 0) {
          delete node[key];
        }
      }
    }

    this.cache = {};
    return this;
  }

  public emit<K extends keyof T & string>(event: K, payload: T[K]) {
    const cached = this.cache[event];
    if (cached) {
      cached.timestamp = ++this.id;
      for (let i = 0, len = cached.listeners.length; i < len; i++) {
        cached.listeners[i](payload);
      }
      return this;
    }

    const listeners: Function[] = [];
    const parts = event.split(this.spliter);
    this.findListeners(this.tree, parts, 0, listeners);

    if (listeners.length) {
      this.cache[event] = { listeners, timestamp: ++this.id };

      const keys = Object.keys(this.cache);
      if (keys.length > this.maxCacheSize) {
        // Evict the oldest cache entry
        let oldestKey = keys[0];
        let oldestTimestamp = this.cache[oldestKey].timestamp;
        for (let i = 1, len = keys.length; i < len; i++) {
          const key = keys[i];
          if (this.cache[key].timestamp < oldestTimestamp) {
            oldestKey = key;
            oldestTimestamp = this.cache[key].timestamp;
          }
        }
        delete this.cache[oldestKey];
      }

      for (let i = 0, len = listeners.length; i < len; i++) {
        listeners[i](payload);
      }
    }

    return this;
  }

  private findListeners(node: any, parts: string[], depth: number, listeners: Function[]) {
    if (depth === parts.length) {
      if (Array.isArray(node)) {
        listeners.push(...node);
      }
      return;
    }

    const part = parts[depth];
    const nextNode = node[part];

    if (nextNode) {
      if (depth === parts.length - 1 && Array.isArray(nextNode)) {
        listeners.push(...nextNode);
      } else if (typeof nextNode === 'object') {
        this.findListeners(nextNode, parts, depth + 1, listeners);
      }
    }

    const wildcardNode = node['*'];
    if (wildcardNode) {
      if (depth === parts.length - 1 && Array.isArray(wildcardNode)) {
        listeners.push(...wildcardNode);
      } else if (typeof wildcardNode === 'object') {
        this.findListeners(wildcardNode, parts, depth + 1, listeners);
      }
    }
  }
}
