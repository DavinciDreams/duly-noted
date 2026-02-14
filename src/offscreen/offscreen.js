/**
 * Voice Starter Offscreen Document
 * Handles Web Speech API for transcription
 * (Side panels have restricted microphone access in some cases)
 */

console.log('[Offscreen] Loaded');

// Web Speech API state
let recognition = null;
let isListening = false;

// Listen for messages targeted to offscreen document
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Only handle messages targeted to offscreen
  if (message.target !== 'offscreen') {
    return false;
  }

  console.log('[Offscreen] Received message:', message.type);

  switch (message.type) {
    case 'START_TRANSCRIPTION':
      handleStartTranscription(message);
      break;

    case 'STOP_TRANSCRIPTION':
      handleStopTranscription(message);
      break;

    default:
      console.warn('[Offscreen] Unknown message type:', message.type);
  }

  return false;
});

/**
 * Start Web Speech API transcription
 */
function handleStartTranscription(message) {
  console.log('[Offscreen] Starting transcription...');

  // Check if Web Speech API is supported
  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionCtor) {
    chrome.runtime.sendMessage({
      type: 'TRANSCRIPTION_ERROR',
      error: 'not-supported',
      message: 'Web Speech API not supported'
    });
    return;
  }

  // Create recognition instance
  // Note: SpeechRecognition will automatically request microphone permission when start() is called
  recognition = new SpeechRecognitionCtor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = message.language || 'en-US';
  recognition.maxAlternatives = 1;

  // Handle results
  recognition.onresult = (event) => {
    const result = event.results[event.results.length - 1];
    const transcript = result[0].transcript;
    const confidence = result[0].confidence;

    // Send to side panel
    chrome.runtime.sendMessage({
      type: 'TRANSCRIPTION_RESULT',
      isFinal: result.isFinal,
      transcript,
      confidence
    }).catch(err => console.error('[Offscreen] Error sending result:', err));
  };

  // Handle errors
  recognition.onerror = (event) => {
    console.error('[Offscreen] Recognition error:', event.error);

    chrome.runtime.sendMessage({
      type: 'TRANSCRIPTION_ERROR',
      error: event.error,
      message: event.message || event.error
    }).catch(err => console.error('[Offscreen] Error sending error:', err));
  };

  // Handle start
  recognition.onstart = () => {
    console.log('[Offscreen] Recognition started');
    isListening = true;

    chrome.runtime.sendMessage({
      type: 'TRANSCRIPTION_STARTED'
    }).catch(err => console.error('[Offscreen] Error sending start:', err));
  };

  // Handle end
  recognition.onend = () => {
    console.log('[Offscreen] Recognition ended');

    // Auto-restart for continuous mode
    if (isListening) {
      try {
        recognition?.start();
      } catch (err) {
        console.error('[Offscreen] Auto-restart failed:', err);
        isListening = false;
        chrome.runtime.sendMessage({
          type: 'TRANSCRIPTION_STOPPED'
        }).catch(err => console.error('[Offscreen] Error sending stop:', err));
      }
    } else {
      chrome.runtime.sendMessage({
        type: 'TRANSCRIPTION_STOPPED'
      }).catch(err => console.error('[Offscreen] Error sending stop:', err));
    }
  };

  // Start recognition
  try {
    recognition.start();
  } catch (error) {
    console.error('[Offscreen] Error starting recognition:', error);
    chrome.runtime.sendMessage({
      type: 'TRANSCRIPTION_ERROR',
      error: 'start-failed',
      message: error.message
    });
  }
}

/**
 * Stop transcription
 */
function handleStopTranscription(message) {
  console.log('[Offscreen] Stopping transcription...');

  isListening = false;

  if (recognition) {
    try {
      recognition.stop();
      recognition = null;
    } catch (error) {
      console.error('[Offscreen] Error stopping recognition:', error);
    }
  }
}

console.log('[Offscreen] Initialization complete');
