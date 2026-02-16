/**
 * Transcription Service
 * Simplified version inspired by atlas-agents STTService
 * Uses Web Speech API for real-time transcription
 */

export class TranscriptionService {
  constructor(config = {}) {
    this.config = {
      language: config.language || 'en-US',
      continuous: config.continuous ?? true,
      interimResults: config.interimResults ?? true,
      maxAlternatives: config.maxAlternatives || 1,
    };

    this.recognition = null;
    this._isListening = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.retryDelayMs = 1000;

    // Event callbacks
    this.onInterimTranscript = null;
    this.onFinalTranscript = null;
    this.onError = null;
    this.onStart = null;
    this.onStop = null;
  }

  /**
   * Check if Web Speech API is supported
   */
  static isSupported() {
    return typeof window !== 'undefined' &&
           (window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Request microphone permission explicitly
   */
  async requestPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('[Transcription] Microphone permission denied:', error);
      return false;
    }
  }

  /**
   * Start listening for speech
   */
  async start() {
    if (this._isListening) {
      console.warn('[Transcription] Already listening');
      return;
    }

    if (!TranscriptionService.isSupported()) {
      const error = new Error('Web Speech API not supported in this browser');
      console.error('[Transcription]', error);
      this.onError?.(error, 'not-supported');
      return;
    }

    // Note: SpeechRecognition handles microphone permission automatically
    // when start() is called - no need to call getUserMedia first
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognitionCtor();

    // Configure recognition
    this.recognition.continuous = this.config.continuous;
    this.recognition.lang = this.config.language;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;

    // Handle results
    this.recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;

      console.log('[Transcription] Result:', {
        transcript,
        confidence,
        isFinal: result.isFinal
      });

      if (result.isFinal) {
        this.onFinalTranscript?.(transcript, confidence);
      } else {
        this.onInterimTranscript?.(transcript, confidence);
      }
    };

    // Handle errors
    this.recognition.onerror = (event) => {
      console.error('[Transcription] Error:', event.error, event.message);

      // Ignore aborted errors (they happen when we manually stop)
      if (event.error === 'aborted') return;

      // Stop listening on error to prevent infinite restart loop
      this._isListening = false;

      this.onError?.(new Error(event.message || event.error), event.error);

      // Don't auto-retry - let user manually retry
      // Auto-retry was causing infinite loops on persistent errors
    };

    // Handle end (for continuous mode, restart)
    this.recognition.onend = () => {
      console.log('[Transcription] Recognition ended');

      if (this._isListening && this.config.continuous) {
        // Auto-restart for continuous mode
        try {
          this.recognition?.start();
        } catch (err) {
          console.error('[Transcription] Auto-restart failed:', err);
          this._isListening = false;
          this.onStop?.();
        }
      } else {
        this._isListening = false;
        this.onStop?.();
      }
    };

    // Handle start
    this.recognition.onstart = () => {
      console.log('[Transcription] Recognition started');
      this._isListening = true;
      this.retryCount = 0;
      this.onStart?.();
    };

    // Start recognition
    try {
      this.recognition.start();
    } catch (error) {
      console.error('[Transcription] Failed to start:', error);
      this.onError?.(error, 'start-failed');
    }
  }

  /**
   * Stop listening
   */
  stop() {
    if (!this._isListening) {
      console.warn('[Transcription] Not listening');
      return;
    }

    console.log('[Transcription] Stopping...');

    if (this.recognition) {
      try {
        this.recognition.stop();
        this.recognition = null;
      } catch (err) {
        console.error('[Transcription] Error stopping:', err);
      }
    }

    this._isListening = false;
    this.onStop?.();
  }

  /**
   * Check if currently listening
   */
  isListening() {
    return this._isListening;
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this._isListening) {
      this.stop();
    }
    this.onInterimTranscript = null;
    this.onFinalTranscript = null;
    this.onError = null;
    this.onStart = null;
    this.onStop = null;
  }

  /**
   * Change language
   */
  setLanguage(language) {
    this.config.language = language;

    // If currently listening, restart with new language
    if (this._isListening) {
      this.stop();
      setTimeout(() => this.start(), 100);
    }
  }
}
