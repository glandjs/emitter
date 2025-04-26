export class EventEmitter<T = Record<string, any>> {
  m = new Map<string, [Function, boolean][]>()
  d = ':'
  constructor(delimiter?: string) {
    if (delimiter) this.d = delimiter
  }
  on<K extends keyof T & string>(e: K, f: (p: T[K]) => void) {
    const w = e.includes('*')
    const k = w ? e.replace(/\*/g, '') : e
    const a = this.m.get(k) || []
    a.push([f, w])
    this.m.set(k, a)
    return this
  }

  off<K extends keyof T & string>(e: K, f?: (p: T[K]) => void) {
    const w = e.includes('*')
    const k = w ? e.replace(/\*/g, '') : e
    const a = this.m.get(k)
    if (!a) return this
    if (f) {
      const i = a.findIndex((x) => x[0] === f)
      if (i >= 0) a.splice(i, 1)
      if (!a.length) this.m.delete(k)
    } else this.m.delete(k)
    return this
  }
  emit<K extends keyof T & string>(e: K, p: T[K]) {
    const a = this.m.get(e)
    if (a)
      for (let i = 0; i < a.length; i++)
        if (!a[i][1])
          try {
            a[i][0](p)
          } catch {}

    this.m.forEach((a, k) => {
      if (!a.some((x) => x[1])) return
      const P = k.split(this.d)
      const E = e.split(this.d)
      if (P.length !== E.length) return
      for (let i = 0; i < P.length; i++) if (P[i] && P[i] !== E[i]) return
      for (let i = 0; i < a.length; i++)
        if (a[i][1])
          try {
            a[i][0](p)
          } catch {}
    })
    return this
  }
}
