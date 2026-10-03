# Changelog

All notable changes to **@glandjs/emitter** will be documented in this file.
This project follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html/).

Entries are listed newest first.

## [Unreleased]

Already in the repository but not yet published. `1.1.4` is still the latest release on npm.

### Fixed

- **Tree nodes now have a single shape.** A node used to be an array when it was a leaf and a plain object when it was a branch, so a segment that was both a leaf and a prefix ended up as an array carrying extra keys. Registering the branch before its leaf threw `TypeError: node[part].push is not a function`, and `off` could prune a subtree that still held live listeners. Every segment is now a node with its own `listeners` and `children`, which makes registration order irrelevant and keeps `off` from touching sibling branches.
- **Event names that exist on `Object.prototype` are safe.** `root` and `cache` are null-prototype maps, so `on('constructor')`, `on('__proto__')` and `emit('toString')` no longer throw or resolve to an inherited member.
- **Emitting a literal `*` fires once.** `emit('a:*')` used to match both the exact subscription and the wildcard branch, invoking each listener twice. A literal `*` segment now matches only the exact branch.
- **The build succeeds again.** `cache` was inferred as `{}`, so indexing it with a generic key failed to compile. `bun run build` exited non-zero, which left the published `dist/` stale and made the suite unrunnable on a fresh clone.
- **The test script and the test filename.** `bun test ./tests/*` did not match on Windows shells, and `emitter.integration.ts` did not follow Bun's test-file naming convention. The suite now runs via `bun test tests` against `tests/emitter.test.ts`.
- **Benchmark methodology.** The measured callback was awaited on every iteration, adding microtask overhead to a synchronous emitter and understating throughput by roughly 6x. The `await` is gone, and a cache-sizing scenario was added so the eviction cliff stays visible.

### Changed

- `maxCacheSize` now defaults to `64` instead of `6`. Once the number of live event names exceeded the cache, LRU eviction sent every emit back to a tree walk: at 10 distinct events the old default measured ~112K ops/sec against ~3.6M ops/sec at 64. Pass a smaller value explicitly to restore the previous default. See the [API reference](./API.md#listener-cache).
- The tree root was renamed from `tree` to `root`. Combined with the names introduced in 1.1.1, the current internal fields are `root`, `cache`, `id`, `maxCacheSize` and `spliter` — the last is misspelled in the source, not here. The single-letter names in the 1.1.0 entry below are a historical record of that release.
- The suite grew from 5 to 34 cases, covering registration order, wildcard resolution, prototype-chain names, cache invalidation, mutation during emit and edge cases.

### Unchanged

- The public API is still `on`, `off`, `emit`.
- A listener that throws still propagates to the caller of `emit` and skips the remaining listeners, matching Node's own `EventEmitter`.
- Wildcards still match exactly one segment.

## [1.1.4] – 2025-05-04

### Added

- **`main` and `exports` in `package.json`.** `1.1.2` dropped every entry-point field when it switched to a CommonJS build, and `1.1.3` restored only `module` and `types`. Without `main` or `exports`, neither Node nor a bundler could locate `dist/index.js`. Both conditions now resolve to the single CommonJS entry:

  ```json
  {
    "main": "./dist/index.js",
    "exports": {
      ".": {
        "import": "./dist/index.js",
        "require": "./dist/index.js"
      }
    }
  }
  ```

## [1.1.3] – 2025-05-04

### Added

- **`module` and `types` in `package.json`**, both pointing at the `tsc` output. This restores the resolution hints that 1.1.2 removed, and is what lets TypeScript find the declarations. `main` was still absent at this point, which is what 1.1.4 fixed.

### Note

1.1.2, 1.1.3 and 1.1.4 were published within half an hour of each other. They are kept as separate entries because each is a distinct published version; read them together as one repair of the entry points broken in 1.1.2.

## [1.1.2] – 2025-05-04

### Changed

- Replaced Bun's ESM-based build with a TypeScript-only CommonJS (`CJS`) output to improve compatibility with Node.js and CommonJS environments.
- Removed `bun build` from the build pipeline in favor of standard `tsc` compilation.
- Updated `tsconfig.json`:
  - Set `module` to `CommonJS`
  - Changed `target` to `ES2021`
  - Removed unused or Bun-specific options (`moduleResolution: bundler`, `verbatimModuleSyntax`, etc.)
- Removed `"type": "module"` and `"module"` fields from `package.json`.
- Output still located in `dist/`, includes `.js` and `.d.ts`.
- Tightened the `off` cleanup loop with non-null assertions so `tsc` compiles it under `strict`.

### Note

This release makes the package easier to consume in broader tooling and ecosystem setups (e.g., Jest, Node.js, older bundlers) while maintaining all functionality and TypeScript type support.

Dropping `"type": "module"` without adding a CommonJS entry point left the manifest with no way to resolve `dist/index.js`. 1.1.3 and 1.1.4 restored that.

## [1.1.1] – 2025-04-27

### Changed

- No functional changes.
- Renamed the internal fields for readability: `t` → `tree`, `c` → `cache`, `i` → `id`, `m` → `maxCacheSize`, and `d` → `spliter`. The behavior and the state shape shown in the 1.1.0 entry below are unchanged; only the property names differ.
- Added a `.prettierrc` and reformatted the source.

## [1.1.0] – 2025-04-26

### Added

- **Tree-based internal storage**
  Events are now organized in a nested tree under the emitter's `t` property, reflecting hierarchical namespaces (e.g. `user:login` → `t.user.login`) and enabling faster lookup for deeply namespaced events.
- **Hot-path LRU cache**
  By default the emitter now keeps a small, fixed-size cache (`c`) of the 6 most-frequently-used events, with a true LRU eviction policy. Each cache entry tracks:
  - `f`: array of listener functions
  - `t`: a value from the emitter's monotonic counter, used to order the cache
- **Introspectable state dump**
  Logging the emitter instance now prints its full internal shape:
  ```js
  {
    t: { … },   // tree of all registered listeners
    c: { … },   // hot-path cache entries
    i: 2,       // monotonic counter, last value handed to a cache entry
    m: 6,       // cache capacity
    d: ':',     // delimiter
    on, off, emit
  }
  ```
- **A throwing listener now propagates.** 1.0.0-alpha logged listener errors and 1.0.0 swallowed them silently. From this release `emit` lets the error reach the caller and skips the remaining listeners, matching Node's own `EventEmitter`.

### Changed

- **Bundle size** increased from ~0.77 KB (minified) to ~1.2 KB to accommodate the new tree structure and LRU cache.
- Internal fields renamed for clarity:
  - `t` (tree root)
  - `c` (cache map)
  - `i` (monotonic counter used to order the cache)
  - `m` (cache max size)
  - `d` (segment delimiter)

### Performance

- **Fast path** for hot events: emits for cached events bypass full tree traversal. A cache hit is a single property read; a miss walks the tree and then pays a linear scan of at most `m` keys to evict.
- The tree makes `on` and `off` proportional to the depth of the event name. `off` additionally checks whether a node is empty before pruning it, which is linear in that node's child count.

## [1.0.0] – 2025-04-26

### Added

- Initial stable release of the `@glandjs/emitter` package
- Core API with fully typed methods: `on`, `off`, and `emit`
- Efficient event pattern matching with delimiter-based wildcards (e.g., `user:*`, `data:*:changed`)
- Custom delimiter support via constructor parameter
- Performance optimizations:
  - Fast listener lookup with Map-based storage
  - Method chaining support for fluent API usage
- Comprehensive TypeScript type definitions for enhanced developer experience
- Zero dependencies with minimal bundle size (0.77 KB minified)
- Designed for both Gland internal usage and standalone applications
- Fully tested

### Changed

- Dropped the `async` option on `on` and `emit`, along with its timeout. Dispatch is synchronous.
- Dropped the options-object constructor from 1.0.0-alpha. The constructor now takes the delimiter directly, `new EventEmitter('-')`.
- Dropped the `maxListeners` and `verboseMemoryLeak` options. There is no listener budget and no leak warning.

### Note

A listener that throws is swallowed by an empty `catch` block in this release. It propagates from 1.1.0 onward.

Wildcards here are not segment-aware in the way later releases are: `*` is stripped from the name, and the empty segment it leaves behind matches any value, provided the name has the same number of segments.

## [1.0.0-alpha] – 2025-04-25

### Added

- Initial release of `@glandjs/emitter`, a small event emitter written in TypeScript.
- Core API: `on`, `off`, and `emit`, all strongly typed.
- Wildcard subscriptions, kept in a separate map keyed by a wildcard key in which each segment collapses to `*` or `#`, and matched segment by segment against the emitted name. Pattern-match results were memoized per pattern.
- Options object on the constructor: `delimiter`, `maxListeners` and `verboseMemoryLeak`.
- An `async` option on `on` and `emit` that resolved through a promise and accepted a timeout.
- A throwing listener was caught and logged with `console.error`.
- Zero dependencies, and usable standalone.

### Note

Every item above was reworked or removed before 1.0.0. Treat this alpha as a preview of the API shape, not of the implementation.
