# Changelog

All notable changes to **@glandjs/emitter** will be documented in this file.
This project follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-alpha] – 2025-04-25

### Added

- Initial release of `@glandjs/emitter`, a minimal and fast event emitter built with TypeScript.
- Core API: `on`, `off`, and `emit`, all strongly typed.
- Wildcard support using radix tree pattern matching (`user:*`, `data:*:changed`, etc.).
- Listener caching and internal pooling for faster event dispatch.
- Supports multiple listeners per event and nested emit calls.
- Zero dependencies, small size, and performance-first design.
- Fully tested, with 100% test coverage.
- Built for internal use in Gland, but works standalone too.

## [1.0.0] - 2025-04-26

### Added

- Initial stable release of the `@glandjs/emitter` package
- Core API with fully typed methods: `on`, `off`, and `emit`
- Efficient event pattern matching with delimiter-based wildcards (e.g., `user:*`, `data:*:changed`)
- Custom delimiter support via constructor parameter
- Performance optimizations:
  - Fast listener lookup with Map-based storage
  - Internal listener caching for reduced overhead during emit
  - Method chaining support for fluent API usage
- Comprehensive TypeScript type definitions for enhanced developer experience
- Zero dependencies with minimal bundle size (0.77 KB minified)
- Designed for both Gland internal usage and standalone applications
- Fully tested

## [1.1.0] – 2025-04-26

### Added

- **Tree-based internal storage**
  Events are now organized in a nested tree under the emitter’s `t` property, reflecting hierarchical namespaces (e.g. `user:login` → `t.user.login`) and enabling faster lookup for deeply namespaced events.
- **Hot-path LRU cache**
  By default the emitter now keeps a small, fixed-size cache (`c`) of the 6 most-frequently-used events, with a true LRU eviction policy. Each cache entry tracks:
  - `f`: array of listener functions
  - `t`: total times this event has been emitted
- **Introspectable state dump**
  Logging the emitter instance now prints its full internal shape:
  ```js
  {
    t: { … },    // tree of all registered listeners
    c: { … },    // hot-path cache entries
    i: 2,        // next listener ID
    m: 6,        // cache capacity
    d: ":",      // delimiter
    on, off, emit
  }
  ```

### Changed

- **Bundle size** increased from ~0.77 KB (minified) to ~1.2 KB to accommodate the new tree structure and LRU cache.
- Internal fields renamed for clarity:
  - `t` (tree root)
  - `c` (cache map)
  - `i` (next ID counter)
  - `m` (cache max size)

### Performance

- **Fast path** for hot events: emits for cached events bypass full tree traversal, reducing overhead for your most common events.
- Maintains O(1) amortized operations for `.on()`, `.off()` and `.emit()` even with the tree and cache.

## [1.1.1] – 2025-04-27

### Changed

- No functional changes.
- Improved code readability with better variable names and added inline comments.
- Refactored for clearer structure without modifying core logic.

## [1.1.2] – 2025-05-04

### Changed

- Replaced Bun’s ESM-based build with a TypeScript-only CommonJS (`CJS`) output to improve compatibility with Node.js and CommonJS environments.
- Removed `bun build` from the build pipeline in favor of standard `tsc` compilation.
- Updated `tsconfig.json`:
  - Set `module` to `CommonJS`
  - Changed `target` to `ES2021`
  - Removed unused or Bun-specific options (`moduleResolution: bundler`, `verbatimModuleSyntax`, etc.)
- Removed `"type": "module"` and `"module"` fields from `package.json`.
- Output still located in `dist/`, includes `.js` and `.d.ts`.

### Note

This release makes the package easier to consume in broader tooling and ecosystem setups (e.g., Jest, Node.js, older bundlers) while maintaining all functionality and TypeScript type support.
