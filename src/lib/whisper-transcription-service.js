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
    this._isStopping = false;
    this._messageListener = null;
    this._cleanupTimer = null;
    this._finalResultPromise = null;
    this._resolveFinalResult = null;

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
            console.log('[WhisperTranscription] Result:', message.transcript);
            if (message.isFinal) {
              this.onFinalTranscript?.(message.transcript, message.confidence || 0.9);
            } else {
              this.onInterimTranscript?.(message.transcript, message.confidence || 0.5);
            }
          }
          // If we were stopping and got the final result, resolve the promise and clean up
          if (this._isStopping) {
            console.log('[WhisperTranscription] Got final result after stop, cleaning up');
            this._resolveFinalResult?.();
            this._removeListener();
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
          console.log('[WhisperTranscription] Stopped confirmation from offscreen');
          this._isListening = false;
          // Don't clean up yet - a final RESULT may still arrive after STOPPED
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
      this._removeListener();
      this.onError?.(error, 'start-failed');
    }
  }

  /**
   * Stop listening.
   * The message listener stays alive to catch the final transcription result
   * that whisper produces after the audio stream stops.
   */
  stop() {
    if (!this._isListening) {
      console.warn('[WhisperTranscription] Not listening');
      return;
    }

    console.log('[WhisperTranscription] Stopping...');
    this._isListening = false;
    this._isStopping = true;

    // Create a promise that resolves when the final whisper result arrives
    this._finalResultPromise = new Promise((resolve) => {
      this._resolveFinalResult = resolve;
    });

    chrome.runtime.sendMessage({
      type: 'STOP_WHISPER_TRANSCRIPTION'
    }).catch(err => console.error('[WhisperTranscription] Error sending stop:', err));

    this.onStop?.();

    // Safety timeout: clean up listener after 15s even if no final result arrives
    this._cleanupTimer = setTimeout(() => {
      console.log('[WhisperTranscription] Cleanup timeout - no final result received');
      this._resolveFinalResult?.();
      this._removeListener();
    }, 15000);
  }

  /**
   * Returns a promise that resolves when the final whisper result arrives
   * after stop() has been called. Use this to wait before checking transcription.
   * Resolves immediately if not in the stopping state.
   */
  waitForFinalResult() {
    if (!this._finalResultPromise) {
      return Promise.resolve();
    }
    return this._finalResultPromise;
  }

  /**
   * Check if currently listening
   */
  isListening() {
    return this._isListening;
  }

  /**
   * Clean up resources.
   * If we're waiting for a final result after stop(), the listener stays alive.
   */
  dispose() {
    if (this._isListening) {
      this.stop();
    }
    // Don't kill the listener if we're waiting for the final result
    if (!this._isStopping) {
      this._removeListener();
    }
  }

  /**
   * Remove the message listener
   */
  _removeListener() {
    if (this._cleanupTimer) {
      clearTimeout(this._cleanupTimer);
      this._cleanupTimer = null;
    }
    if (this._messageListener) {
      chrome.runtime.onMessage.removeListener(this._messageListener);
      this._messageListener = null;
    }
    this._isStopping = false;
  }
}
