# API Reference

**@glandjs/emitter** exposes three methods — `on`, `off`, and `emit` — plus a constructor. Nothing else is public.

```ts
import { EventEmitter } from '@glandjs/emitter';
```

---

## Table of Contents

- [new EventEmitter](#new-eventemitter)
- [on](#on)
- [off](#off)
- [emit](#emit)
- [Event hierarchy](#event-hierarchy)
- [Wildcards](#wildcards)
- [Listener cache](#listener-cache)
- [Typed events](#typed-events)
- [Error handling](#error-handling)

---

## new EventEmitter

```ts
new EventEmitter<T>(splitter?: string, maxCacheSize?: number)
```

| Parameter     | Type     | Default | Description                                                        |
| ------------- | -------- | ------- | ------------------------------------------------------------------ |
| `splitter`    | `string` | `':'`   | Character that separates the segments of an event name.            |
| `maxCacheSize` | `number` | `64`   | How many event names to keep in the hot-path listener cache.      |

```ts
const emitter = new EventEmitter();          // 'a:b' namespaces, cache of 64
const dashed = new EventEmitter('-', 128);   // 'a-b' namespaces, cache of 128
```

---

## on

```ts
on<K extends keyof T & string>(event: K, listener: (payload: T[K]) => void): this
```

Registers `listener` for `event`. The same function may be registered more than
once; each registration is invoked separately.

Returns the emitter, so calls can be chained.

```ts
emitter.on('user:login', (payload) => {
  console.log(payload.username);
});
```

Registering the same event is order-independent — a name can be used as a leaf
(`a:b`) and as a branch (`a:b:c`) in any sequence.

```ts
emitter.on('a:b:c', handlerDeep);
emitter.on('a:b', handlerLeaf);   // fine, in either order
```

---

## off

```ts
off<K extends keyof T & string>(event: K, listener?: (payload: T[K]) => void): this
```

Removes a subscription. With no `listener`, every listener for that event is
removed.

```ts
emitter.off('user:login', handler);  // remove one
emitter.off('user:login');           // remove all listeners for the event
```

Removing a listener only affects that exact event name. Sibling branches are
left intact:

```ts
emitter.on('a:b', handlerLeaf);
emitter.on('a:b:c', handlerDeep);

emitter.off('a:b', handlerLeaf);
emitter.emit('a:b:c', payload);   // handlerDeep still runs
```

If the same function was registered more than once, each `off` call removes one
registration. Empty branches are pruned from the tree, and a path is only
pruned when it holds neither a listener nor a child.

Calling `off` for an event that was never registered, or for a listener that is
not registered, is a no-op.

---

## emit

```ts
emit<K extends keyof T & string>(event: K, payload: T[K]): this
```

Calls every listener registered for `event`, in registration order, passing
`payload`. Returns the emitter.

```ts
emitter.emit('user:login', { username: 'alice', timestamp: Date.now() });
```

If no listener matches, `emit` does nothing and still returns the emitter.

---

## Event hierarchy

Event names are split on the `splitter` and stored as a tree, so a name can be
subscribed to at any depth. Only the fully-qualified name matches exactly — the
emitter does not fire a parent listener for a child event.

```ts
emitter.on('db:query:success', onSuccess);
emitter.on('db:query:error', onError);

emitter.emit('db:query:success', payload);   // only onSuccess runs
emitter.emit('db:query', payload);           // nothing runs
```

---

## Wildcards

A `*` segment matches exactly one segment. It can appear at any position.

```ts
emitter.on('user:*', onUserEvent);          // user:login, user:logout
emitter.on('data:*:changed', onDataChange); // data:user:changed, data:post:changed

emitter.emit('user:login', payload);
emitter.emit('data:user:changed', payload);
```

Rules:

- `*` matches **one** segment, never more. `on('user:*')` does not receive `user:login:extra`.
- An exact listener and a wildcard listener can both match; both run.
- Exact matches run before wildcard matches at the same segment.
- Emitting a name that literally contains `*` matches only the exact subscription, once.

Wildcards are not supported in a typed event map, because `'user:*'` is not a
key of the map. Use a separate untyped emitter for wildcard subscriptions.

---

## Listener cache

Resolving a listener means walking the tree. To keep hot events off that path,
`emit` caches the resolved listener array per event name, keyed by LRU, up to
`maxCacheSize` names.

The cache is dropped entirely whenever `on` or `off` is called, so a listener
added or removed during runtime is always picked up on the next `emit`.

`maxCacheSize` matters more than it looks. If the number of live event names
exceeds it, entries are evicted and those events fall back to a tree walk on
every emit:

| Distinct events | `maxCacheSize: 6` | `maxCacheSize: 64` |
| --------------- | ----------------- | ------------------ |
| 10              | ~112K ops/sec     | ~3.6M ops/sec      |
| 50              | ~110K ops/sec     | ~10M ops/sec       |

Set it to at least the number of event names your application emits regularly.

---

## Typed events

Pass a map of event names to payloads to get type checking on both `on` and `emit`.

```ts
interface Events {
  'user:login': { username: string; timestamp: number };
  'user:logout': { username: string; timestamp: number };
  'data:update': { key: string; value: unknown; timestamp: number };
}

const emitter = new EventEmitter<Events>();

emitter.on('user:login', (data) => {
  data.username;   // string
  data.missing;    // compile error
});

emitter.emit('user:login', { username: 'alice', timestamp: Date.now() });
```

For an event that carries no data, type the payload as `void` and emit `undefined`.

```ts
const emitter = new EventEmitter<{ ping: void }>();
emitter.on('ping', () => console.log('pong'));
emitter.emit('ping', undefined);
```

Without a type argument, any string is accepted and the payload is `any`.

---

## Error handling

A listener that throws propagates the error to the caller of `emit`, and the
remaining listeners for that event are skipped. This matches the behaviour of
Node's own `EventEmitter`.

```ts
emitter.on('risky', () => {
  throw new Error('boom');
});
emitter.on('risky', () => console.log('never reached'));

emitter.emit('risky', payload);   // throws
```

Wrap listener bodies in `try`/`catch` when one listener must not affect the
others.

---

## Notes on event names

Event names are stored in null-prototype maps, so names that also exist on
`Object.prototype` — `constructor`, `__proto__`, `toString`, `valueOf`,
`hasOwnProperty` — are safe to use and never reach the prototype chain.

```ts
emitter.on('constructor', handler);   // valid
emitter.emit('constructor', payload); // calls handler
```

The empty string is a valid event name.
