export class EventEmitter<T = Record<string, any>> {
  private t = {}
  private c = {}
  private i = 0
  private m = 6
  private d = ':'
  constructor(d?: string, m = 6) {
    if (d) this.d = d
    if (m > 0) this.m = m
  }
  public on<K extends keyof T & string>(e: K, f: (p: T[K]) => void) {
    let n = this.t,
      p = e.split(this.d)
    for (let i = 0, l = p.length; i < l; i++) {
      const k = p[i]
      n[k] = n[k] || (i === l - 1 ? [] : {})
      if (i === l - 1) n[k].push(f)
      else n = n[k]
    }
    this.c = {}
    return this
  }
  public off<K extends keyof T & string>(e: K, f?: (p: T[K]) => void) {
    const p = e.split(this.d)
    let n = this.t,
      s = [{ n, k: p[0] }],
      d = false
    for (let i = 0, l = p.length; i < l; i++) {
      const k = p[i]
      if (!n[k]) return this
      if (i === l - 1) {
        if (!f) {
          delete n[k]
          d = true
        } else {
          const a = n[k]
          const j = a.indexOf(f)
          if (j >= 0) {
            a.splice(j, 1)
            if (!a.length) {
              delete n[k]
              d = true
            }
          }
        }
      } else {
        n = n[k]
        if (i < l - 1) s.push({ n, k: p[i + 1] })
      }
    }
    if (d)
      for (let i = s.length - 1; i >= 0; i--) {
        const { n, k } = s[i]
        if (n[k] && Object.keys(n[k]).length === 0) delete n[k]
      }
    this.c = {}
    return this
  }
  public emit<K extends keyof T & string>(e: K, p: T[K]) {
    const h = this.c[e]
    if (h) {
      h.t = ++this.i
      for (let i = 0, l = h.f.length; i < l; i++) h.f[i](p)
      return this
    }
    const r = [],
      s = e.split(this.d)
    this._f(this.t, s, 0, r)
    if (r.length) {
      this.c[e] = { f: r, t: ++this.i }
      const k = Object.keys(this.c)
      if (k.length > this.m) {
        let o = k[0],
          m = this.c[o].t
        for (let i = 1, l = k.length; i < l; i++) {
          if (this.c[k[i]].t < m) {
            m = this.c[k[i]].t
            o = k[i]
          }
        }
        delete this.c[o]
      }
      for (let i = 0, l = r.length; i < l; i++) r[i](p)
    }
    return this
  }
  private _f(n: any, p: string[], d: number, r: Function[]) {
    if (d === p.length) {
      if (Array.isArray(n)) r.push(...n)
      return
    }
    const k = p[d],
      x = n[k]
    if (x) {
      if (d === p.length - 1 && Array.isArray(x)) r.push(...x)
      else if (typeof x === 'object') this._f(x, p, d + 1, r)
    }
    const w = n['*']
    if (w) {
      if (d === p.length - 1 && Array.isArray(w)) r.push(...w)
      else if (typeof w === 'object') this._f(w, p, d + 1, r)
    }
  }
}
