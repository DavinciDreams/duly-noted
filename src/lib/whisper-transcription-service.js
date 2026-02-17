/**
 * Whisper Transcription Service
 * Drop-in replacement for TranscriptionService that uses whisper.cpp WASM
 * via the offscreen document. Used when Web Speech API is unavailable (Brave, Firefox).
 *
 * Has the same public interface as TranscriptionService:
 * - start(), stop(), isListening(), dispose()
 * - onStart, onStop, onInterimTranscript, onFinalTranscript, onError callbacks
 */

export class WhisperTranscriptionService {
  constructor(config = {}) {
    this.config = {
      language: config.language || 'en',
    };

    this._isListening = false;
    this._messageListener = null;

    // Event callbacks (same interface as TranscriptionService)
    this.onInterimTranscript = null;
    this.onFinalTranscript = null;
    this.onError = null;
    this.onStart = null;
    this.onStop = null;
  }

  /**
   * Check if whisper WASM can be used (always true - it's the fallback)
   */
  static isSupported() {
    return true;
  }

  /**
   * Start whisper transcription via offscreen document
   */
  async start() {
    if (this._isListening) {
      console.warn('[WhisperTranscription] Already listening');
      return;
    }

    // Set up message listener for results from offscreen document
    this._messageListener = (message) => {
      switch (message.type) {
        case 'WHISPER_TRANSCRIPTION_STARTED':
          console.log('[WhisperTranscription] Started');
          this._isListening = true;
          this.onStart?.();
          break;

        case 'WHISPER_TRANSCRIPTION_RESULT':
          if (message.transcript) {
            if (message.isFinal) {
              this.onFinalTranscript?.(message.transcript, message.confidence || 0.9);
            } else {
              this.onInterimTranscript?.(message.transcript, message.confidence || 0.5);
            }
          }
          break;

        case 'WHISPER_TRANSCRIPTION_ERROR':
          console.error('[WhisperTranscription] Error:', message.error, message.message);
          this._isListening = false;
          this.onError?.(
            new Error(message.message || message.error),
            message.error
          );
          break;

        case 'WHISPER_TRANSCRIPTION_STOPPED':
          console.log('[WhisperTranscription] Stopped');
          this._isListening = false;
          this.onStop?.();
          break;

        case 'WHISPER_VOICE_ACTIVITY':
          // Could be used for visual feedback in the future
          break;
      }
    };

    chrome.runtime.onMessage.addListener(this._messageListener);

    // Send start message to service worker → offscreen document
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'START_WHISPER_TRANSCRIPTION',
        language: this.config.language
      });

      if (!response?.success) {
        throw new Error(response?.error || 'Failed to start whisper transcription');
      }
    } catch (error) {
      console.error('[WhisperTranscription] Failed to start:', error);
      this._cleanup();
      this.onError?.(error, 'start-failed');
    }
  }

  /**
   * Stop listening
   */
  stop() {
    if (!this._isListening) {
      console.warn('[WhisperTranscription] Not listening');
      return;
    }

    console.log('[WhisperTranscription] Stopping...');
    this._isListening = false;

    chrome.runtime.sendMessage({
      type: 'STOP_WHISPER_TRANSCRIPTION'
    }).catch(err => console.error('[WhisperTranscription] Error sending stop:', err));

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
    this._cleanup();
  }

  /**
   * Remove message listener and clear callbacks
   */
  _cleanup() {
    if (this._messageListener) {
      chrome.runtime.onMessage.removeListener(this._messageListener);
      this._messageListener = null;
    }
    this.onInterimTranscript = null;
    this.onFinalTranscript = null;
    this.onError = null;
    this.onStart = null;
    this.onStop = null;
  }
}
