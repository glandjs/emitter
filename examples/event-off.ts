import { EventEmitter } from '../dist';

console.log('\n=== Event Cleanup Example ===');

const emitter = new EventEmitter();

console.log('Setting up event handlers...');

// Register several handlers
const handler1 = (data) => console.log(`Handler 1: ${data.message}`);
const handler2 = (data) => console.log(`Handler 2: ${data.message}`);
const handler3 = (data) => console.log(`Handler 3: ${data.message}`);

emitter.on('app:notification', handler1);
emitter.on('app:notification', handler2);
emitter.on('app:notification', handler3);

console.log('Emitting event with all handlers...');
emitter.emit('app:notification', { message: 'Test 1' });

// Remove a specific handler
console.log('Removing handler 2...');
emitter.off('app:notification', handler2);

console.log('Emitting event after removing one handler...');
emitter.emit('app:notification', { message: 'Test 2' });

// Remove all handlers for this event
console.log('Removing all handlers...');
emitter.off('app:notification');

console.log('Emitting event after removing all handlers...');
emitter.emit('app:notification', { message: 'Test 3' }); // No output expected
