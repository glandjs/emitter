import { EventEmitter } from '../dist';

console.log('\n=== Event Hierarchy Example ===');

const emitter = new EventEmitter();

// Register listeners at different levels of the hierarchy
emitter.on('db:connection:success', (data) => {
  console.log(`Database connected: ${data.name}`);
});

emitter.on('db:connection:error', (data) => {
  console.error(`Database connection error: ${data.error}`);
});

emitter.on('db:query:success', (data) => {
  console.log(`Query successful: ${data.rowCount} rows`);
});

emitter.on('db:query:error', (data) => {
  console.error(`Query error: ${data.error}`);
});

emitter.on('db:*:error', (data) => {
  console.warn(`DB operation failed: ${data.type}`);
});

// Emit events
emitter.emit('db:connection:success', { name: 'main-db', host: 'localhost' });
emitter.emit('db:query:success', {
  sql: 'SELECT * FROM users',
  rowCount: 10,
  duration: 5,
});

emitter.emit('db:connection:error', {
  error: 'Connection refused',
  type: 'connection',
  host: 'remote-db',
});

emitter.emit('db:query:error', {
  error: 'Table not found',
  type: 'query',
  sql: 'SELECT * FROM nonexistent',
});
