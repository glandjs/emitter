import { expect, test, describe } from 'bun:test'
import { EventEmitter } from '../dist'
describe('EventEmitter', () => {
  describe('Basic functionality', () => {
    test('should emit and receive events', () => {
      const emitter = new EventEmitter()
      let count = 0

      emitter.on('test', () => count++)
      emitter.emit('test', {})

      expect(count).toBe(1)
    })

    test('should pass payload to listeners', () => {
      const emitter = new EventEmitter<{ test: number }>()
      let payload: number = 0

      emitter.on('test', (data) => {
        payload = data
      })
      emitter.emit('test', 42)

      expect(payload).toBe(42)
    })

    test('should support multiple listeners', () => {
      const emitter = new EventEmitter()
      const results: number[] = []

      emitter.on('test', () => results.push(1))
      emitter.on('test', () => results.push(2))
      emitter.emit('test', {})

      expect(results).toEqual([1, 2])
    })

    test('should allow removing specific listeners', () => {
      const emitter = new EventEmitter()
      let count1 = 0
      let count2 = 0

      const listener1 = () => count1++
      const listener2 = () => count2++

      emitter.on('test', listener1)
      emitter.on('test', listener2)

      emitter.emit('test', {})
      expect(count1).toBe(1)
      expect(count2).toBe(1)

      emitter.off('test', listener1)
      emitter.emit('test', {})

      expect(count1).toBe(1)
      expect(count2).toBe(2)
    })

    test('should allow removing all listeners for an event', () => {
      const emitter = new EventEmitter()
      let count = 0

      emitter.on('test', () => count++)
      emitter.on('test', () => count++)

      emitter.emit('test', {})
      expect(count).toBe(2)

      emitter.off('test')
      emitter.emit('test', {})

      expect(count).toBe(2)
    })
  })
})
