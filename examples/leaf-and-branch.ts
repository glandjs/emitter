import { EventEmitter } from '../dist';

console.log('\n=== Leaf and Branch on the Same Path ===');

// A segment can be both a leaf and a prefix. Registration order does not matter,
// and removing one never disturbs the other.
const emitter = new EventEmitter();

emitter.on('a:b:c', () => console.log('  deep  -> a:b:c'));
emitter.on('a:b', () => console.log('  leaf  -> a:b'));

console.log('\nEmitting both:');
emitter.emit('a:b', {});
emitter.emit('a:b:c', {});

console.log('\nRemoving the leaf, the deep listener should survive:');
emitter.off('a:b');
emitter.emit('a:b', {});
emitter.emit('a:b:c', {});

console.log('\n=== Event Names That Exist on Object.prototype ===');

const safe = new EventEmitter();
safe.on('constructor', () => console.log('  constructor listener ran'));
safe.on('__proto__', () => console.log('  __proto__ listener ran'));

safe.emit('constructor', {});
safe.emit('__proto__', {});
safe.emit('toString', {}); // no listener, no throw
console.log('  emitting toString with no listener did not throw');

console.log('\n=== Custom Splitter ===');

const dashed = new EventEmitter('-');
dashed.on('app:user-created', (data) => console.log(`  user created: ${data.name}`));
dashed.emit('app:user-created', { name: 'alice' });
