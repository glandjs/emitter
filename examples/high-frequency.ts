import { EventEmitter } from '../dist';

console.log('\n=== High-Frequency Events Example ===');

const emitter = new EventEmitter();

let messageCount = 0;
let errorCount = 0;
let totalBytes = 0;

// Register listeners for metrics
emitter.on('net:packet:received', (data) => {
  messageCount++;
  totalBytes += data.size;
});

emitter.on('net:packet:error', (data) => {
  errorCount++;
});

console.log('Simulating high-frequency network traffic...');

// Simulate high-frequency events
const startTime = Date.now();
const eventCount = 100000;

for (let i = 0; i < eventCount; i++) {
  // Simulate 98% success, 2% error rate
  if (Math.random() < 0.98) {
    emitter.emit('net:packet:received', {
      id: `pkt-${i}`,
      size: Math.floor(Math.random() * 1024),
      timestamp: Date.now(),
    });
  } else {
    emitter.emit('net:packet:error', {
      id: `pkt-${i}`,
      error: 'Checksum mismatch',
      timestamp: Date.now(),
    });
  }
}

const duration = Date.now() - startTime;

console.log(`Processed ${eventCount} events in ${duration}ms`);
console.log(`Message count: ${messageCount}`);
console.log(`Error count: ${errorCount}`);
console.log(`Total bytes received: ${totalBytes}`);
console.log(`Events per second: ${Math.floor(eventCount / (duration / 1000))}`);
