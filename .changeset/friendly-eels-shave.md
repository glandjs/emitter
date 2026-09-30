---
'@glandjs/emitter': patch
---

fix: make event registration order-independent and crash-free

Every path segment now uses a single node shape holding its own listeners
and children, instead of an array for leaves and an object for branches. A
segment that was both a leaf and a prefix was represented by an array with
extra keys, so registering a branch before its leaf threw
`TypeError: node[part].push is not a function`, and `off` could prune a
subtree that still held live listeners. The unified shape makes
registration order irrelevant and keeps `off` from touching siblings.

Also fixed:

- `tree` and `cache` are null-prototype maps, so event names such as
  `constructor`, `__proto__`, `toString` and `valueOf` no longer throw or
  resolve to inherited members
- emitting a literal `*` matched both the exact subscription and the
  wildcard branch, firing each listener twice
- `maxCacheSize` defaulted to 6, so more than six live event names forced
  every emit back to a tree walk; it now defaults to 64
- `tsc` failed on the cache index type, leaving `dist/` stale and the suite
  unrunnable on a fresh clone
- the test script used a glob that did not match on Windows shells, and the
  test file did not follow Bun's naming convention
- the benchmark awaited a synchronous callback each iteration, adding
  microtask overhead and understating throughput by roughly 6x

Unchanged: the public API is still `on`, `off`, `emit`. A listener that
throws still propagates to the caller of `emit` and skips the remaining
listeners, matching Node's `EventEmitter`. Wildcards still match exactly
one segment.
