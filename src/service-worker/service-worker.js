/**
 * Voice Starter Service Worker
 * Handles background tasks, offscreen document management, and message relaying
 */

console.log('[Service Worker] Voice Starter loaded');

// ============================================================================
// Extension Lifecycle
// ============================================================================

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Service Worker] Extension installed:', details.reason);

  if (details.reason === 'install') {
    console.log('[Service Worker] First install - welcome!');
  } else if (details.reason === 'update') {
    console.log('[Service Worker] Updated from version:', details.previousVersion);
  }

  // Set default side panel behavior
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch(err => console.error('[Service Worker] Error setting panel behavior:', err));
});

chrome.runtime.onStartup.addListener(() => {
  console.log('[Service Worker] Browser started');
});

// ============================================================================
// Offscreen Document Management
// ============================================================================

let offscreenCreated = false;

async function ensureOffscreenDocument() {
  if (offscreenCreated) {
    return true;
  }

  // Check if offscreen document already exists
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL('src/offscreen/offscreen.html')]
  });

  if (existingContexts.length > 0) {
    console.log('[Service Worker] Offscreen document already exists');
    offscreenCreated = true;
    return true;
  }

  // Create offscreen document
  try {
    await chrome.offscreen.createDocument({
      url: 'src/offscreen/offscreen.html',
      reasons: ['USER_MEDIA', 'CLIPBOARD'],
      justification: 'Recording audio, Web Speech API transcription, and clipboard operations'
    });

    offscreenCreated = true;
    console.log('[Service Worker] Offscreen document created');
    return true;
  } catch (error) {
    console.error('[Service Worker] Error creating offscreen document:', error);
    return false;
  }
}

// ============================================================================
// Message Handling
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Service Worker] Received message:', message.type);

  switch (message.type) {
    case 'START_TRANSCRIPTION':
      handleStartTranscription(message, sendResponse);
      return true; // Async

    case 'STOP_TRANSCRIPTION':
      handleStopTranscription(message, sendResponse);
      return true; // Async

    // Whisper WASM transcription (for Brave/Firefox)
    case 'START_WHISPER_TRANSCRIPTION':
      handleStartWhisper(message, sendResponse);
      return true; // Async

    case 'STOP_WHISPER_TRANSCRIPTION':
      handleStopWhisper(message, sendResponse);
      return true; // Async

    // Messages from offscreen document — relay to side panel
    case 'TRANSCRIPTION_RESULT':
    case 'TRANSCRIPTION_ERROR':
    case 'TRANSCRIPTION_STARTED':
    case 'TRANSCRIPTION_STOPPED':
    case 'WHISPER_TRANSCRIPTION_RESULT':
    case 'WHISPER_TRANSCRIPTION_ERROR':
    case 'WHISPER_TRANSCRIPTION_STARTED':
    case 'WHISPER_TRANSCRIPTION_STOPPED':
    case 'WHISPER_VOICE_ACTIVITY':
      // Forward to all extension pages (sidepanel) since runtime.sendMessage
      // from offscreen only reaches the service worker, not other contexts
      chrome.runtime.sendMessage(message).catch(() => {});
      break;

    // Messages from content scripts — forward to side panel
    case 'ELEMENT_SELECTED':
    case 'ELEMENT_SELECTION_CANCELLED':
    case 'NEW_CONSOLE_LOG':
      chrome.runtime.sendMessage(message).catch(() => {});
      break;

    case 'CONTENT_SCRIPT_INITIALIZED':
      // Content script ready — no action needed
      break;

    // Clipboard write — ensure offscreen doc exists then forward
    case 'COPY_IMAGE_TO_CLIPBOARD':
      handleCopyToClipboard(message, sendResponse);
      return true;

    default:
      sendResponse({ success: true });
  }

  return true;
});

async function handleStartTranscription(message, sendResponse) {
  try {
    // Ensure offscreen document exists
    const created = await ensureOffscreenDocument();
    if (!created) {
      sendResponse({
        success: false,
        error: 'Failed to create offscreen document'
      });
      return;
    }

    // Forward to offscreen document with target property
    chrome.runtime.sendMessage({
      type: 'START_TRANSCRIPTION',
      target: 'offscreen',
      language: message.language || 'en-US'
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error('[Service Worker] Error starting transcription:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

async function handleStopTranscription(message, sendResponse) {
  try {
    chrome.runtime.sendMessage({
      type: 'STOP_TRANSCRIPTION',
      target: 'offscreen'
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error('[Service Worker] Error stopping transcription:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// ============================================================================
// Whisper WASM Transcription (Brave/Firefox fallback)
// ============================================================================

async function handleStartWhisper(message, sendResponse) {
  try {
    const created = await ensureOffscreenDocument();
    if (!created) {
      sendResponse({
        success: false,
        error: 'Failed to create offscreen document'
      });
      return;
    }

    chrome.runtime.sendMessage({
      type: 'START_WHISPER',
      target: 'offscreen',
      language: message.language || 'en'
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error('[Service Worker] Error starting whisper:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

async function handleStopWhisper(message, sendResponse) {
  try {
    chrome.runtime.sendMessage({
      type: 'STOP_WHISPER',
      target: 'offscreen'
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error('[Service Worker] Error stopping whisper:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// ============================================================================
// Clipboard Write (via offscreen document)
// ============================================================================

async function handleCopyToClipboard(message, sendResponse) {
  try {
    const created = await ensureOffscreenDocument();
    if (!created) {
      sendResponse({ success: false, error: 'Failed to create offscreen document' });
      return;
    }

    // Forward to offscreen document
    chrome.runtime.sendMessage({
      type: 'COPY_IMAGE_TO_CLIPBOARD',
      target: 'offscreen',
      dataUrl: message.dataUrl
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error('[Service Worker] Clipboard write error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// ============================================================================
// Error Handling
// ============================================================================

self.addEventListener('error', (event) => {
  console.error('[Service Worker] Global error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[Service Worker] Unhandled promise rejection:', event.reason);
});

console.log('[Service Worker] Initialization complete');
