<p align="center">
  <a href="#" target="blank"><img src="https://github.com/glandjs/glandjs.github.io/blob/main/public/logo.png" width="200" alt="Gland Emitter Logo" /></a>
</p>

<p align="center">
  <a href="https://npmjs.com/package/@glandjs/emitter" target="_blank"><img src="https://img.shields.io/npm/v/@glandjs/emitter.svg" alt="NPM Version" /></a>
  <a href="https://npmjs.com/package/@glandjs/emitter" target="_blank"><img src="https://img.shields.io/npm/l/@glandjs/emitter.svg" alt="Package License" /></a>
  <a href="https://npmjs.com/package/@glandjs/emitter" target="_blank"><img src="https://img.shields.io/npm/dm/@glandjs/emitter.svg" alt="NPM Downloads" /></a>
</p>

<h1 align="center">@glandjs/emitter</h1>

<p align="center">A blazing-fast, lightweight event emitter for efficient and scalable communication.</p>

## Description

> What if you could emit events with just a few simple commands and have them handled with maximum efficiency?

**@glandjs/emitter** is an ultra-fast, protocol-agnostic event emitter that serves as the backbone of communication within the Gland architecture. With just **three simple methods**: `on`, `off`, and `emit`, it powers an event-driven system that is lightweight, scalable, and highly performant.

This package is designed to be **minimal** yet **extremely fast** and **low-overhead**. It is engineered to handle high-frequency event dispatches, optimize memory usage, and provide type-safe APIs with **zero dependencies**.

## Philosophy

> If Gland’s core architecture is like a language, then @glandjs/emitter is its most basic, high-performance tool for communication.

At its core, **@glandjs/emitter** is all about flexibility, simplicity, and speed. It does not concern itself with how events are transmitted (whether over HTTP, WebSocket, or any other transport) or the specifics of any event type. It’s **transport-agnostic** and designed to facilitate communication **within the system** — between decoupled components — without imposing unnecessary constraints.

Its purpose is to provide a **lightweight** and **minimalistic** solution for handling events, enabling seamless interaction between the system components, all while ensuring **maximum performance**.

## Design Intent

The design of @glandjs/emitter focuses on simplicity and performance. It’s not a complex event system that introduces unnecessary abstractions or layers; instead, it’s designed to handle **high-volume events** in a system with minimal memory footprint and maximum throughput.

- **Minimalism**: We only expose three methods: `on`, `off`, and `emit`. These three methods cover the entire event handling process. Nothing more is needed.
- **Event Hierarchy**: Event names use a `:` separator, allowing for a **namespaced** structure (e.g., `user:login`, `system:error`). The emitter efficiently resolves events with hierarchies or wildcards, without sacrificing performance.
- **Decoupling**: Components using this emitter are **completely decoupled**. There is no direct dependency between listeners and emitters. A listener only cares about the event name, not who emits it or how it gets there.
- **Performance First**: Designed to be **memory efficient** and **fast**. The emitter avoids memory-heavy operations like closures or deep object copying.

## Documentation

For full documentation on how to use **@glandjs/emitter**, check out the following resources:

- [Official Documentation](#)
- [API Reference](#/api)
- [Contributing Guide](./docs/CONTRIBUTING.md)

## License

MIT © Mahdi — See [LICENSE](./LICENSE)
