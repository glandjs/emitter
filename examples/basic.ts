import { EventEmitter } from '../dist'

console.log('\n=== Basic Usage Example ===')

// Create a new emitter
const emitter = new EventEmitter()

// Register event listeners
emitter.on('user:login', (userData) => {
  console.log(`User logged in: ${userData.username}`)
})

emitter.on('user:logout', (userData) => {
  console.log(`User logged out: ${userData.username}`)
})

// Emit events
emitter.emit('user:login', { username: 'alice', timestamp: Date.now() })
emitter.emit('user:logout', { username: 'bob', timestamp: Date.now() })
