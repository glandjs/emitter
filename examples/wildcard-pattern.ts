import { EventEmitter } from '../src'

console.log('\n=== Wildcard Patterns Example ===')

const emitter = new EventEmitter()

// Register wildcard listeners
emitter.on('user:*', (data) => {
  console.log(`User event occurred: ${data.type}`)
})

emitter.on('data:*:changed', (data) => {
  console.log(`Data changed: ${data.entity} (${data.id})`)
})

// These will match the 'user:*' pattern
emitter.emit('user:login', { type: 'login', username: 'alice' })
emitter.emit('user:logout', { type: 'logout', username: 'bob' })
emitter.emit('user:update', {
  type: 'update',
  username: 'charlie',
  fields: ['email'],
})

// These will match the 'data:*:changed' pattern
emitter.emit('data:user:changed', { entity: 'user', id: '123' })
emitter.emit('data:post:changed', { entity: 'post', id: '456' })

// This will not match any pattern
emitter.emit('data:deleted', { entity: 'comment', id: '789' })
