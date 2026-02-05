/**
 * Generate a notification sound and save it as an MP3 file
 * This creates a simple audio notification sound
 */

const fs = require('fs');
const path = require('path');

// Create a simple WAV file with notification tones
function generateNotificationSound() {
  // Audio parameters
  const sampleRate = 44100;
  const duration = 0.5; // seconds
  const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 (chime)
  
  // Create audio context-like calculations
  const samples = [];
  const noteDuration = duration / frequencies.length;
  const samplesPerNote = noteDuration * sampleRate;
  
  let currentSample = 0;
  
  // Generate sine wave for each frequency
  frequencies.forEach((freq) => {
    for (let i = 0; i < samplesPerNote; i++) {
      // Generate sine wave
      const value = Math.sin((2 * Math.PI * freq * i) / sampleRate);
      
      // Apply envelope (fade in and out)
      let envelope = 1;
      if (i < samplesPerNote * 0.1) {
        // Fade in
        envelope = i / (samplesPerNote * 0.1);
      } else if (i > samplesPerNote * 0.8) {
        // Fade out
        envelope = (samplesPerNote - i) / (samplesPerNote * 0.2);
      }
      
      // Scale to 16-bit PCM
      samples.push(Math.floor(value * envelope * 32767 * 0.5));
    }
  });
  
  // Create WAV file header
  const channelCount = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * channelCount * (bitsPerSample / 8);
  const blockAlign = channelCount * (bitsPerSample / 8);
  const dataSize = samples.length * blockAlign;
  const fileSize = 36 + dataSize;
  
  // Create buffer for WAV file
  const buffer = Buffer.alloc(44 + dataSize);
  
  // Write WAV header
  let offset = 0;
  
  // RIFF header
  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(fileSize, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;
  
  // fmt sub-chunk
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4; // Subchunk1Size
  buffer.writeUInt16LE(1, offset); offset += 2; // AudioFormat (PCM)
  buffer.writeUInt16LE(channelCount, offset); offset += 2;
  buffer.writeUInt32LE(sampleRate, offset); offset += 4;
  buffer.writeUInt32LE(byteRate, offset); offset += 4;
  buffer.writeUInt16LE(blockAlign, offset); offset += 2;
  buffer.writeUInt16LE(bitsPerSample, offset); offset += 2;
  
  // data sub-chunk
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;
  
  // Write PCM samples
  for (let i = 0; i < samples.length; i++) {
    buffer.writeInt16LE(samples[i], offset);
    offset += 2;
  }
  
  // Save to file
  const outputPath = path.join(__dirname, '..', 'public', 'notification-sound.wav');
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`✓ Notification sound generated: ${outputPath}`);
  console.log(`  Duration: ${duration}s`);
  console.log(`  Sample rate: ${sampleRate}Hz`);
  console.log(`  Frequencies: ${frequencies.join(', ')} Hz`);
}

// Generate the sound
try {
  generateNotificationSound();
} catch (error) {
  console.error('Error generating notification sound:', error);
  process.exit(1);
}
