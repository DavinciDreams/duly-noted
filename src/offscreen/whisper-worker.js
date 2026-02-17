/**
 * Whisper WASM Worker for Offscreen Document
 * Handles microphone capture and whisper.cpp WASM transcription
 * Used as fallback when Web Speech API is not available (Brave, Firefox)
 */

import createModule from '../lib/transcribe-dist/shout.wasm.js';
import { StreamTranscriber } from '../lib/transcribe-dist/StreamTranscriber.js';

console.log('[Whisper Worker] Loaded');

let transcriber = null;
let mediaStream = null;
let isRunning = false;

/**
 * Initialize the StreamTranscriber with the bundled model
 */
async function initTranscriber() {
  if (transcriber && transcriber.isReady) {
    console.log('[Whisper Worker] Transcriber already initialized');
    return;
  }

  console.log('[Whisper Worker] Initializing transcriber...');

  const modelUrl = chrome.runtime.getURL('models/ggml-tiny.en-q5_1.bin');
  const workletsPath = chrome.runtime.getURL('src/lib/transcribe-dist/audio-worklets');

  transcriber = new StreamTranscriber({
    createModule,
    model: modelUrl,
    audioWorkletsPath: workletsPath,
    onReady: () => {
      console.log('[Whisper Worker] Transcriber ready');
    },
    onSegment: (segment) => {
      console.log('[Whisper Worker] Segment:', segment);
      chrome.runtime.sendMessage({
        type: 'WHISPER_TRANSCRIPTION_RESULT',
        transcript: segment.text?.trim() || '',
        isFinal: true,
        confidence: 0.9
      }).catch(err => console.error('[Whisper Worker] Error sending result:', err));
    },
    onStreamStatus: (status) => {
      console.log('[Whisper Worker] Stream status:', status);
    }
  });

  await transcriber.init();
  console.log('[Whisper Worker] Transcriber initialized');
}

/**
 * Start microphone capture and whisper transcription
 */
async function handleStartWhisper(message) {
  console.log('[Whisper Worker] Starting whisper transcription...');

  try {
    await initTranscriber();

    // Capture microphone
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    // Start the stream processing
    await transcriber.start({
      lang: message.language || 'en',
      suppress_non_speech: true,
    });

    isRunning = true;

    // Notify sidepanel that transcription has started
    chrome.runtime.sendMessage({
      type: 'WHISPER_TRANSCRIPTION_STARTED'
    }).catch(err => console.error('[Whisper Worker] Error sending start:', err));

    // Feed the media stream to the transcriber
    await transcriber.transcribe(mediaStream, {
      preRecordMs: 500,
      maxRecordMs: 10000,
      minSilenceMs: 700,
      onVoiceActivity: (isSpeaking) => {
        chrome.runtime.sendMessage({
          type: 'WHISPER_VOICE_ACTIVITY',
          isSpeaking
        }).catch(() => {});
      }
    });

  } catch (error) {
    console.error('[Whisper Worker] Error starting whisper:', error);
    chrome.runtime.sendMessage({
      type: 'WHISPER_TRANSCRIPTION_ERROR',
      error: error.name || 'start-failed',
      message: error.message
    }).catch(err => console.error('[Whisper Worker] Error sending error:', err));
  }
}

/**
 * Stop transcription and release microphone
 */
async function handleStopWhisper() {
  console.log('[Whisper Worker] Stopping whisper transcription...');

  isRunning = false;

  try {
    if (transcriber && transcriber.isStreamRunning) {
      await transcriber.stop();
    }
  } catch (error) {
    console.error('[Whisper Worker] Error stopping transcriber:', error);
  }

  // Release microphone
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }

  chrome.runtime.sendMessage({
    type: 'WHISPER_TRANSCRIPTION_STOPPED'
  }).catch(err => console.error('[Whisper Worker] Error sending stop:', err));
}

// Listen for messages from the service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen') {
    return false;
  }

  console.log('[Whisper Worker] Received message:', message.type);

  switch (message.type) {
    case 'START_WHISPER':
      handleStartWhisper(message);
      break;
    case 'STOP_WHISPER':
      handleStopWhisper();
      break;
  }

  return false;
});

console.log('[Whisper Worker] Initialization complete');
