import { EventEmitter as GlandEventEmitter } from '../dist';
import { EventEmitter } from 'events';

type Result = { name: string; opsPerSec: number };

// Listeners here are synchronous, so awaiting each call only added microtask
// overhead to the measurement.
const measure = (name: string, iterations: number, fn: () => void): Result => {
  for (let i = 0; i < iterations / 10; i++) fn();

  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) fn();
  const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;

  return { name, opsPerSec: Math.floor(iterations / (durationMs / 1000)) };
};

const report = (results: Result[]) => {
  const fastest = Math.max(...results.map((r) => r.opsPerSec));
  console.log('\n=== Results Summary ===');
  for (const result of results) {
    const percent = ((result.opsPerSec / fastest) * 100).toFixed(2);
    console.log(`${result.name}: ${result.opsPerSec.toLocaleString()} ops/sec (${percent}%)`);
  }
};

const build = <T,>(Ctor: new (splitter?: string, maxCacheSize?: number) => T, events: string[]) => {
  const emitter = new Ctor();
  for (const event of events) emitter.on(event, () => {});
  return emitter;
};

const benchmarkSimpleEmission = (iterations: number) => {
  console.log('\n=== Simple Event Emission Benchmark ===');
  const results = [
    measure('GlandEventEmitter', iterations, () => (build1 as any).emit('test', {})),
    measure('Node.js EventEmitter', iterations, () => (build2 as any).emit('test', {})),
  ];
  report(results);
};
const build1 = build(GlandEventEmitter as any, ['test']);
const build2 = new EventEmitter();
build2.on('test', () => {});

const benchmarkWildcardEmission = (iterations: number) => {
  console.log('\n=== Wildcard Event Emission Benchmark ===');
  const emitter = build(GlandEventEmitter as any, ['test:*', 'test:foo', 'test:bar']);
  report([measure('GlandEventEmitter', iterations, () => emitter.emit('test:foo', {}))]);
};

const benchmarkHighFrequency = (iterations: number) => {
  console.log('\n=== High-Frequency Event Emission Benchmark ===');
  const events = Array.from({ length: 10 }, (_, i) => `event:${i}`);

  const gland = build(GlandEventEmitter as any, events);
  const node = new EventEmitter();
  for (const event of events) node.on(event, () => {});

  report([
    measure('GlandEventEmitter', iterations, () => {
      for (const event of events) gland.emit(event, {});
    }),
    measure('Node.js EventEmitter', iterations, () => {
      for (const event of events) node.emit(event, {});
    }),
  ]);
};

const benchmarkDeepHierarchy = (iterations: number) => {
  console.log('\n=== Deep Event Hierarchy Benchmark ===');
  const emitter = build(GlandEventEmitter as any, ['a:*', 'a:b:*', 'a:b:c:*', 'a:b:c:d:*', 'a:b:c:d:e']);
  report([measure('GlandEventEmitter', iterations, () => emitter.emit('a:b:c:d:e', {}))]);
};

// The cache is what keeps hot events off the tree walk. This guards the cache
// size from being set too low to hold a realistic number of live events.
const benchmarkCacheSizing = (iterations: number) => {
  console.log('\n=== Cache Sizing Benchmark (10 distinct events) ===');
  const events = Array.from({ length: 10 }, (_, i) => `event:${i}`);

  const sized = build(GlandEventEmitter as any, events) as any;
  const undersized = new (GlandEventEmitter as any)(':', 6);
  for (const event of events) undersized.on(event, () => {});

  report([
    measure('GlandEventEmitter (cache 64)', iterations, () => {
      for (const event of events) sized.emit(event, {});
    }),
    measure('GlandEventEmitter (cache 6)', iterations, () => {
      for (const event of events) undersized.emit(event, {});
    }),
  ]);
};

const runAllBenchmarks = () => {
  const iterations = 100_000;
  console.log(`Running benchmarks with ${iterations.toLocaleString()} iterations each`);

  benchmarkSimpleEmission(iterations);
  benchmarkWildcardEmission(iterations);
  benchmarkHighFrequency(iterations);
  benchmarkDeepHierarchy(iterations);
  benchmarkCacheSizing(iterations);

  console.log('\nAll benchmarks completed!');
};

runAllBenchmarks();
