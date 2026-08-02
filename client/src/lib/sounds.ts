// Sound notification utilities for order confirmations

export const playSuccessChime = () => {
  try {
    // Create a pleasant success chime using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Play a pleasant chord sequence for success
    const playTone = (frequency: number, startTime: number, duration: number, volume: number = 0.3) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, startTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const currentTime = audioContext.currentTime;
    
    // Success chord: C - E - G (pleasant major chord)
    playTone(523.25, currentTime, 0.3, 0.2); // C5
    playTone(659.25, currentTime + 0.1, 0.3, 0.15); // E5  
    playTone(783.99, currentTime + 0.2, 0.4, 0.1); // G5
    
  } catch (error) {
    console.log('Audio not supported, using fallback sound');
    // Fallback for browsers that don't support Web Audio
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUYrTp66hVFApGn+DyvmAcBz6Z2+3JcCQHL4HD7N2QQAsaZ7vs56hWFQlJmOHrwF4cBj2b3+vJbiMGJoP+++SWQwsYY7Xn6qxWEwlJmOHKvX4');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Silent fail if audio can't play
      });
    } catch (e) {
      // Silent fail
    }
  }
};

export const playAdminNotification = () => {
  try {
    // Create a 3-second notification chime for admin
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playTone = (frequency: number, startTime: number, duration: number, volume: number = 0.4) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, startTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const currentTime = audioContext.currentTime;
    
    // Alert pattern: Two-tone notification repeated
    // First tone sequence
    playTone(800, currentTime, 0.3, 0.3);
    playTone(600, currentTime + 0.35, 0.3, 0.3);
    
    // Second tone sequence  
    playTone(800, currentTime + 1, 0.3, 0.3);
    playTone(600, currentTime + 1.35, 0.3, 0.3);
    
    // Third tone sequence
    playTone(800, currentTime + 2, 0.3, 0.3);
    playTone(600, currentTime + 2.35, 0.3, 0.3);
    
  } catch (error) {
    console.log('Audio not supported for admin notification');
    // Fallback notification sound
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUYrTp66hVFApGn+DyvmAcBz6Z2+3JcCQHL4HD7N2QQAsaZ7vs56hWFQlJmOHrwF4cBj2b3+vJbiMGJoP+++SWQwsYY7Xn6qxWEwlJmOHKvX4');
      audio.volume = 0.4;
      audio.play().catch(() => {});
    } catch (e) {
      // Silent fail
    }
  }
};

export const initializeAudioContext = () => {
  // Initialize audio context on user interaction to comply with browser policies
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
  } catch (error) {
    console.log('Audio context initialization failed');
  }
};