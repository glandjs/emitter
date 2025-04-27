import { EventEmitter } from '../dist';

console.log('\n=== Type-Safe Events Example ===');

// Define event types
interface EventMap {
  'user:login': { username: string; timestamp: number };
  'user:logout': { username: string; timestamp: number };
  'data:update': { key: string; value: any; timestamp: number };
}

// Create a typed emitter
const emitter = new EventEmitter<EventMap>();

// Register event listeners with type checking
emitter.on('user:login', (data) => {
  // TypeScript knows that data has username and timestamp properties
  console.log(`User logged in: ${data.username} at ${new Date(data.timestamp).toISOString()}`);
});

emitter.on('data:update', (data) => {
  // TypeScript knows about the data structure
  console.log(`Data updated: ${data.key} = ${JSON.stringify(data.value)}`);
});

// Emit with type-checked payloads
emitter.emit('user:login', {
  username: 'alice',
  timestamp: Date.now(),
});

emitter.emit('data:update', {
  key: 'settings',
  value: { theme: 'dark', notifications: true },
  timestamp: Date.now(),
});
