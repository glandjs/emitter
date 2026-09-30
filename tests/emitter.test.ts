import { expect, test, describe } from 'bun:test';
import { EventEmitter } from '../dist';
describe('EventEmitter', () => {
  test('should emit and receive events', () => {
    const emitter = new EventEmitter();
    let count = 0;

    emitter.on('test', () => count++);
    emitter.emit('test', {});

    expect(count).toBe(1);
  });

  test('should pass payload to listeners', () => {
    const emitter = new EventEmitter<{ test: number }>();
    let payload: number = 0;

    emitter.on('test', (data) => {
      payload = data;
    });
    emitter.emit('test', 42);

    expect(payload).toBe(42);
  });

  test('should support multiple listeners', () => {
    const emitter = new EventEmitter();
    const results: number[] = [];

    emitter.on('test', () => results.push(1));
    emitter.on('test', () => results.push(2));
    emitter.emit('test', {});

    expect(results).toEqual([1, 2]);
  });

  test('should allow removing specific listeners', () => {
    const emitter = new EventEmitter();
    let count1 = 0;
    let count2 = 0;

    const listener1 = () => count1++;
    const listener2 = () => count2++;

    emitter.on('test', listener1);
    emitter.on('test', listener2);

    emitter.emit('test', {});
    expect(count1).toBe(1);
    expect(count2).toBe(1);

    emitter.off('test', listener1);
    emitter.emit('test', {});

    expect(count1).toBe(1);
    expect(count2).toBe(2);
  });

  test('should allow removing all listeners for an event', () => {
    const emitter = new EventEmitter();
    let count = 0;

    emitter.on('test', () => count++);
    emitter.on('test', () => count++);

    emitter.emit('test', {});
    expect(count).toBe(2);

    emitter.off('test');
    emitter.emit('test', {});

    expect(count).toBe(2);
  });

  describe('hierarchy', () => {
    test('should register a branch before a leaf without crashing', () => {
      const emitter = new EventEmitter();
      let leaf = 0;
      let deep = 0;

      emitter.on('a:b:c', () => deep++);
      emitter.on('a:b', () => leaf++);

      emitter.emit('a:b', {});
      emitter.emit('a:b:c', {});

      expect(leaf).toBe(1);
      expect(deep).toBe(1);
    });

    test('should register a leaf before a branch without crashing', () => {
      const emitter = new EventEmitter();
      let leaf = 0;
      let deep = 0;

      emitter.on('a:b', () => leaf++);
      emitter.on('a:b:c', () => deep++);

      emitter.emit('a:b', {});
      emitter.emit('a:b:c', {});

      expect(leaf).toBe(1);
      expect(deep).toBe(1);
    });

    test('should keep a deep listener when an ancestor leaf is removed', () => {
      const emitter = new EventEmitter();
      let deep = 0;

      emitter.on('a:b', () => {});
      emitter.on('a:b:c', () => deep++);
      emitter.off('a:b');
      emitter.emit('a:b:c', {});

      expect(deep).toBe(1);
    });

    test('should keep a leaf listener when a deep child is removed', () => {
      const emitter = new EventEmitter();
      let leaf = 0;

      emitter.on('a:b', () => leaf++);
      emitter.on('a:b:c', () => {});
      emitter.off('a:b:c');
      emitter.emit('a:b', {});

      expect(leaf).toBe(1);
    });

    test('should keep a deep listener when an ancestor branch is removed', () => {
      const emitter = new EventEmitter();
      let deep = 0;

      emitter.on('a:b:c', () => deep++);
      emitter.on('a:b', () => {});
      emitter.off('a:b');
      emitter.emit('a:b:c', {});

      expect(deep).toBe(1);
    });

    test('should support three levels in any order', () => {
      const emitter = new EventEmitter();
      const seen: number[] = [];

      emitter.on('a:b:c:d', () => seen.push(3));
      emitter.on('a:b:c', () => seen.push(2));
      emitter.on('a:b', () => seen.push(1));

      emitter.emit('a:b:c:d', {});
      emitter.emit('a:b:c', {});
      emitter.emit('a:b', {});

      expect(seen).toEqual([3, 2, 1]);
    });
  });

  describe('wildcards', () => {
    test('should match a single segment', () => {
      const emitter = new EventEmitter();
      let count = 0;

      emitter.on('user:*', () => count++);
      emitter.emit('user:login', {});
      emitter.emit('user:logout', {});

      expect(count).toBe(2);
    });

    test('should not match across segments', () => {
      const emitter = new EventEmitter();
      let count = 0;

      emitter.on('user:*', () => count++);
      emitter.emit('user:login:extra', {});

      expect(count).toBe(0);
    });

    test('should match a wildcard in the middle of a name', () => {
      const emitter = new EventEmitter();
      const seen: string[] = [];

      emitter.on('data:*:changed', () => seen.push('wildcard'));
      emitter.on('data:user:changed', () => seen.push('exact'));

      emitter.emit('data:user:changed', {});
      emitter.emit('data:post:changed', {});
      emitter.emit('data:deleted', {});

      expect(seen).toEqual(['exact', 'wildcard', 'wildcard']);
    });

    test('should fire once when a wildcard name is emitted literally', () => {
      const emitter = new EventEmitter();
      let count = 0;

      emitter.on('a:*', () => count++);
      emitter.emit('a:*', {});

      expect(count).toBe(1);
    });

    test('should match a wildcard alongside a leaf on the same segment', () => {
      const emitter = new EventEmitter();
      let count = 0;

      emitter.on('a:b', () => count++);
      emitter.on('a:*', () => count++);
      emitter.emit('a:b', {});

      expect(count).toBe(2);
    });

    test('should remove a wildcard subscription', () => {
      const emitter = new EventEmitter();
      let count = 0;

      emitter.on('a:*', () => count++);
      emitter.on('a:x', () => count++);
      emitter.off('a:*');
      emitter.emit('a:x', {});

      expect(count).toBe(1);
    });

    test('should resolve a stack of wildcards by depth', () => {
      const emitter = new EventEmitter();
      const seen: string[] = [];

      emitter.on('a:*', () => seen.push('1'));
      emitter.on('a:b:*', () => seen.push('2'));
      emitter.on('a:b:c:*', () => seen.push('3'));
      emitter.on('a:b:c:d:*', () => seen.push('4'));
      emitter.on('a:b:c:d:e', () => seen.push('exact'));

      emitter.emit('a:b:c:d:e', {});

      expect(seen).toEqual(['exact', '4']);
    });
  });

  describe('event names from the prototype chain', () => {
    test('should register a listener named constructor', () => {
      const emitter = new EventEmitter();
      let count = 0;

      emitter.on('constructor', () => count++);
      emitter.emit('constructor', {});

      expect(count).toBe(1);
    });

    test('should register a listener named __proto__', () => {
      const emitter = new EventEmitter();
      let count = 0;

      emitter.on('__proto__', () => count++);
      emitter.emit('__proto__', {});

      expect(count).toBe(1);
    });

    test('should emit a name that only exists on Object.prototype', () => {
      const emitter = new EventEmitter();

      expect(() => emitter.emit('toString', {})).not.toThrow();
      expect(() => emitter.emit('valueOf', {})).not.toThrow();
      expect(() => emitter.emit('hasOwnProperty', {})).not.toThrow();
    });

    test('should not touch Object.prototype', () => {
      const emitter = new EventEmitter();
      emitter.on('constructor', () => {});

      expect((Object.prototype as any).constructor).toBe(Object);
    });
  });

  describe('cache', () => {
    test('should pick up a listener added after a cached emit', () => {
      const emitter = new EventEmitter();
      const seen: string[] = [];

      emitter.on('w', () => seen.push('A'));
      emitter.emit('w', {});
      emitter.on('w', () => seen.push('B'));
      emitter.emit('w', {});

      expect(seen).toEqual(['A', 'A', 'B']);
    });

    test('should pick up a listener removed after a cached emit', () => {
      const emitter = new EventEmitter();
      const listener = () => {};
      let count = 0;
      const counted = () => count++;

      emitter.on('w', counted);
      emitter.emit('w', {});
      emitter.off('w', counted);
      emitter.emit('w', {});

      expect(count).toBe(1);
    });

    test('should stay within the configured cache size', () => {
      const emitter = new EventEmitter(':', 2) as any;
      const events = ['c1', 'c2', 'c3', 'c4'];

      for (const event of events) emitter.on(event, () => {});
      for (const event of events) emitter.emit(event, {});

      expect(Object.keys(emitter.cache).length).toBe(2);
    });

    test('should not cache when the size is zero', () => {
      const emitter = new EventEmitter(':', 0) as any;
      emitter.on('g', () => {});
      emitter.emit('g', {});

      expect(Object.keys(emitter.cache).length).toBe(0);
    });
  });

  describe('mutation during emit', () => {
    test('should apply a listener added mid-emit on the next emit', () => {
      const emitter = new EventEmitter();
      const seen: string[] = [];

      emitter.on('m', () => {
        seen.push('first');
        emitter.on('m', () => seen.push('added'));
      });

      emitter.emit('m', {});
      emitter.emit('m', {});

      expect(seen).toEqual(['first', 'first', 'added']);
    });

    test('should not corrupt the loop when a listener removes another', () => {
      const emitter = new EventEmitter();
      const seen: string[] = [];
      const second = () => seen.push('second');

      emitter.on('s', () => {
        seen.push('first');
        emitter.off('s', second);
      });
      emitter.on('s', second);

      emitter.emit('s', {});
      emitter.emit('s', {});

      expect(seen).toEqual(['first', 'second', 'first']);
    });
  });

  describe('edge cases', () => {
    test('should support a custom splitter', () => {
      const emitter = new EventEmitter('/');
      let count = 0;

      emitter.on('a/b', () => count++);
      emitter.emit('a/b', {});

      expect(count).toBe(1);
    });

    test('should support an empty event name', () => {
      const emitter = new EventEmitter();
      let count = 0;

      emitter.on('', () => count++);
      emitter.emit('', {});

      expect(count).toBe(1);
    });

    test('should stay chainable', () => {
      const emitter = new EventEmitter();

      expect(emitter.on('a', () => {})).toBe(emitter);
      expect(emitter.emit('a', {})).toBe(emitter);
      expect(emitter.off('a')).toBe(emitter);
    });

    test('should ignore off for an unknown event', () => {
      const emitter = new EventEmitter();
      let count = 0;

      emitter.on('a', () => count++);
      emitter.off('no:such:path', () => {});
      emitter.emit('a', {});

      expect(count).toBe(1);
    });

    test('should remove only one of two identical registrations', () => {
      const emitter = new EventEmitter();
      let count = 0;
      const listener = () => count++;

      emitter.on('a', listener);
      emitter.on('a', listener);
      emitter.off('a', listener);
      emitter.emit('a', {});

      expect(count).toBe(1);
    });

    test('should keep emitters independent', () => {
      const a = new EventEmitter();
      const b = new EventEmitter();
      let ac = 0;
      let bc = 0;

      a.on('x', () => ac++);
      b.on('x', () => bc++);
      a.emit('x', {});
      a.emit('x', {});

      expect(ac).toBe(2);
      expect(bc).toBe(0);
    });
  });
});
