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
