import { EventEmitter as GlandEventEmitter } from '../dist'
import { EventEmitter } from 'events'

const measure = async (
  name: string,
  iterations: number,
  fn: () => void | Promise<void>
) => {
  for (let i = 0; i < iterations / 10; i++) {
    await fn()
  }

  console.log(`Running ${name}...`)
  const start = process.hrtime.bigint()

  for (let i = 0; i < iterations; i++) {
    await fn()
  }

  const end = process.hrtime.bigint()
  const durationMs = Number(end - start) / 1_000_000
  const opsPerSec = Math.floor(iterations / (durationMs / 1000))

  console.log(
    `${name}: ${durationMs.toFixed(
      2
    )}ms (${opsPerSec.toLocaleString()} ops/sec)`
  )

  return { name, durationMs, opsPerSec }
}

const benchmarkSimpleEmission = async (iterations: number) => {
  console.log('\n=== Simple Event Emission Benchmark ===')

  const results: any = []

  {
    const emitter = new GlandEventEmitter()
    let count = 0

    emitter.on('test', () => count++)

    results.push(
      await measure('GlandEventEmitter', iterations, () => {
        emitter.emit('test', {})
      })
    )
  }

  {
    const emitter = new EventEmitter()
    let count = 0

    emitter.on('test', () => count++)

    results.push(
      await measure('Node.js EventEmitter', iterations, () => {
        emitter.emit('test', {})
      })
    )
  }

  const fastest = results.reduce((prev, current) =>
    prev.opsPerSec > current.opsPerSec ? prev : current
  )

  console.log('\n=== Results Summary ===')
  results.forEach((result) => {
    const percentOfFastest = (
      (result.opsPerSec / fastest.opsPerSec) *
      100
    ).toFixed(2)
    console.log(
      `${
        result.name
      }: ${result.opsPerSec.toLocaleString()} ops/sec (${percentOfFastest}%)`
    )
  })
}

const benchmarkWildcardEmission = async (iterations: number) => {
  console.log('\n=== Wildcard Event Emission Benchmark ===')

  const results: any = []

  {
    const emitter = new GlandEventEmitter()
    let count = 0

    emitter.on('test:*', () => count++)
    emitter.on('test:foo', () => count++)
    emitter.on('test:bar', () => count++)
    results.push(
      await measure('GlandEventEmitter', iterations, () => {
        emitter.emit('test:foo', {})
      })
    )
  }

  const fastest = results.reduce((prev, current) =>
    prev.opsPerSec > current.opsPerSec ? prev : current
  )

  console.log('\n=== Results Summary ===')
  results.forEach((result) => {
    const percentOfFastest = (
      (result.opsPerSec / fastest.opsPerSec) *
      100
    ).toFixed(2)
    console.log(
      `${
        result.name
      }: ${result.opsPerSec.toLocaleString()} ops/sec (${percentOfFastest}%)`
    )
  })
}

const benchmarkHighFrequency = async (iterations: number) => {
  console.log('\n=== High-Frequency Event Emission Benchmark ===')

  const EVENTS_PER_ITERATION = 100
  const results: any = []

  {
    const emitter = new GlandEventEmitter()
    let count = 0

    for (let i = 0; i < 10; i++) {
      emitter.on(`event:${i}`, () => count++)
    }

    results.push(
      await measure('GlandEventEmitter', iterations, () => {
        for (let i = 0; i < 10; i++) {
          for (let j = 0; j < EVENTS_PER_ITERATION / 10; j++) {
            emitter.emit(`event:${i}`, {})
          }
        }
      })
    )
  }

  {
    const emitter = new EventEmitter()
    let count = 0

    for (let i = 0; i < 10; i++) {
      emitter.on(`event:${i}`, () => count++)
    }

    results.push(
      await measure('Node.js EventEmitter', iterations, () => {
        for (let i = 0; i < 10; i++) {
          for (let j = 0; j < EVENTS_PER_ITERATION / 10; j++) {
            emitter.emit(`event:${i}`, {})
          }
        }
      })
    )
  }

  const fastest = results.reduce((prev, current) =>
    prev.opsPerSec > current.opsPerSec ? prev : current
  )

  console.log('\n=== Results Summary ===')
  results.forEach((result) => {
    const percentOfFastest = (
      (result.opsPerSec / fastest.opsPerSec) *
      100
    ).toFixed(2)
    console.log(
      `${
        result.name
      }: ${result.opsPerSec.toLocaleString()} ops/sec (${percentOfFastest}%)`
    )
  })
}

const benchmarkDeepHierarchy = async (iterations: number) => {
  console.log('\n=== Deep Event Hierarchy Benchmark ===')

  const results: any = []

  {
    const emitter = new GlandEventEmitter()
    let count = 0

    emitter.on('a:*', () => count++)
    emitter.on('a:b:*', () => count++)
    emitter.on('a:b:c:*', () => count++)
    emitter.on('a:b:c:d:*', () => count++)
    emitter.on('a:b:c:d:e', () => count++)

    results.push(
      await measure('GlandEventEmitter', iterations, () => {
        emitter.emit('a:b:c:d:e', {})
      })
    )
  }

  const fastest = results.reduce((prev, current) =>
    prev.opsPerSec > current.opsPerSec ? prev : current
  )

  console.log('\n=== Results Summary ===')
  results.forEach((result) => {
    const percentOfFastest = (
      (result.opsPerSec / fastest.opsPerSec) *
      100
    ).toFixed(2)
    console.log(
      `${
        result.name
      }: ${result.opsPerSec.toLocaleString()} ops/sec (${percentOfFastest}%)`
    )
  })
}

const runAllBenchmarks = async () => {
  const iterations = 100000
  console.log(
    `Running benchmarks with ${iterations.toLocaleString()} iterations each`
  )

  await benchmarkSimpleEmission(iterations)
  await benchmarkWildcardEmission(iterations)
  await benchmarkHighFrequency(Math.floor(iterations / 100))
  await benchmarkDeepHierarchy(iterations)

  console.log('\nAll benchmarks completed!')
}

runAllBenchmarks().catch(console.error)
