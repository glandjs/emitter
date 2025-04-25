import { EventEmitter } from '../dist'

console.log('\n=== Asynchronous Events Example ===')

const emitter = new EventEmitter()

// Register an async listener
emitter.on('data:process', async (data) => {
  console.log(`Processing data: ${data.id}`)

  // Simulate some async work
  await new Promise((resolve) => setTimeout(resolve, 100))

  console.log(`Processing completed: ${data.id}`)
  return { success: true }
})

console.log('Starting async processing...')

// Emit events asynchronously with timeout
await emitter.emit(
  'data:process',
  { id: 'task-1' },
  {
    async: true,
  }
)

console.log('Async processing initiated')
