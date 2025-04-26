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
