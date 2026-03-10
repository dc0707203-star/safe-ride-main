/**
 * Notification Sound - Web Audio API based
 * This file generates notification sounds on demand
 */

// Store audio contexts
let audioContexts = {};

/**
 * Generate and play a notification chime sound
 * Works on phones and browsers
 */
export function playNotificationSound(type = 'announcement') {
  try {
    // Try using the native audio approach first
    playAudioNotification(type);
  } catch (error) {
    console.warn('Could not play audio notification:', error);
    // Fallback: use vibration if available
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  }
}

/**
 * Play audio notification using Web Audio API or Audio element
 */
function playAudioNotification(type = 'announcement') {
  try {
    // Create or reuse audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;
    
    if (type === 'announcement' || type === 'default') {
      // Gentle chime: C5, E5, G5
      playTones(audioContext, [
        { freq: 523.25, duration: 0.15 },
        { freq: 659.25, duration: 0.15 },
        { freq: 783.99, duration: 0.2 },
      ]);
    } else if (type === 'alert') {
      // Alert sound: two beeps
      playTones(audioContext, [
        { freq: 800, duration: 0.2 },
        { freq: 800, duration: 0.2, delay: 0.3 },
      ]);
    } else if (type === 'success') {
      // Success sound: ascending tones
      playTones(audioContext, [
        { freq: 392.0, duration: 0.1 },
        { freq: 523.25, duration: 0.2 },
      ]);
    }
  } catch (error) {
    console.warn('Audio playback error:', error);
  }
}

/**
 * Play multiple tones
 */
function playTones(audioContext, tones) {
  let startTime = audioContext.currentTime;
  
  tones.forEach(({ freq, duration, delay = 0 }) => {
    const time = startTime + delay;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = freq;
    oscillator.type = 'sine';
    
    // Envelope
    gainNode.gain.setValueAtTime(0.3, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);
    
    oscillator.start(time);
    oscillator.stop(time + duration);
    
    startTime = time + duration + 0.05;
  });
}

export default playNotificationSound;
