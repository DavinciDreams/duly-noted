/**
 * Voice Starter Side Panel
 * Main UI controller
 */

import { getDrafts, getHistory, getSettings, updateSettings, resetSettings } from '../lib/storage.js';
import { formatRelativeTime, getDestinationIcon, truncateText } from '../utils/helpers.js';
import { TranscriptionService } from '../lib/transcription-service.js';

console.log('[Side Panel] Loading...');

// Initialize transcription service
let transcriptionService = null;

// ============================================================================
// Screen Management
// ============================================================================

const screens = {
  RECORDING: 'recordingScreen',
  DESTINATION: 'destinationScreen',
  HISTORY: 'historyScreen',
  SETTINGS: 'settingsScreen',
};

let currentScreen = screens.RECORDING;

function showScreen(screenId) {
  // Hide all screens
  Object.values(screens).forEach(id => {
    const screen = document.getElementById(id);
    if (screen) {
      screen.classList.remove('active');
    }
  });

  // Show requested screen
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.add('active');
    currentScreen = screenId;
    console.log('[Side Panel] Showing screen:', screenId);
  }
}

// ============================================================================
// Recording State
// ============================================================================

let isRecording = false;
let recordingStartTime = null;
let timerInterval = null;
let currentTranscription = '';

// ============================================================================
// UI Elements
// ============================================================================

// Buttons
const recordBtn = document.getElementById('recordBtn');
const recordBtnText = document.getElementById('recordBtnText');
const settingsBtn = document.getElementById('settingsBtn');
const viewAllHistoryBtn = document.getElementById('viewAllHistoryBtn');
const backToRecordingBtn = document.getElementById('backToRecordingBtn');
const backFromHistoryBtn = document.getElementById('backFromHistoryBtn');
const backFromSettingsBtn = document.getElementById('backFromSettingsBtn');
const editTranscriptionBtn = document.getElementById('editTranscriptionBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const resetSettingsBtn = document.getElementById('resetSettingsBtn');

// Containers
const recordingStatus = document.getElementById('recordingStatus');
const recordingTimer = document.getElementById('recordingTimer');
const transcriptionContainer = document.getElementById('transcriptionContainer');
const transcriptionText = document.getElementById('transcriptionText');
const recentNotesList = document.getElementById('recentNotesList');
const historyList = document.getElementById('historyList');
const destinationTranscriptionPreview = document.getElementById('destinationTranscriptionPreview');

// Forms
const githubTokenInput = document.getElementById('githubToken');
const githubDefaultRepoInput = document.getElementById('githubDefaultRepo');
const maxDurationInput = document.getElementById('maxDuration');

// ============================================================================
// Event Listeners
// ============================================================================

// Navigation
settingsBtn.addEventListener('click', () => {
  showScreen(screens.SETTINGS);
  loadSettings();
});

viewAllHistoryBtn.addEventListener('click', () => {
  showScreen(screens.HISTORY);
  loadHistory();
});

backToRecordingBtn.addEventListener('click', () => showScreen(screens.RECORDING));
backFromHistoryBtn.addEventListener('click', () => showScreen(screens.RECORDING));
backFromSettingsBtn.addEventListener('click', () => showScreen(screens.RECORDING));

// Recording
recordBtn.addEventListener('click', handleRecordButtonClick);

// Transcription editing
editTranscriptionBtn.addEventListener('click', () => {
  const isEditable = transcriptionText.getAttribute('contenteditable') === 'true';
  transcriptionText.setAttribute('contenteditable', !isEditable);
  editTranscriptionBtn.textContent = isEditable ? 'Edit' : 'Done';

  if (!isEditable) {
    transcriptionText.focus();
  } else {
    currentTranscription = transcriptionText.textContent.trim();
  }
});

// Destination options
document.querySelectorAll('.destination-option').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const destination = e.currentTarget.getAttribute('data-destination');
    await handleDestinationSelected(destination);
  });
});

// Settings
saveSettingsBtn.addEventListener('click', handleSaveSettings);
resetSettingsBtn.addEventListener('click', handleResetSettings);

// ============================================================================
// Recording Functions
// ============================================================================

async function handleRecordButtonClick() {
  if (!isRecording) {
    await startRecording();
  } else {
    await stopRecording();
  }
}

async function startRecording() {
  console.log('[Side Panel] Starting recording...');

  try {
    // Check if Web Speech API is supported
    if (!TranscriptionService.isSupported()) {
      throw new Error('Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari.');
    }

    // Open permission popup window to request microphone access
    // Side panels cannot show permission prompts, so we need a popup
    const permissionUrl = chrome.runtime.getURL('src/permission/permission.html');
    await chrome.windows.create({
      url: permissionUrl,
      type: 'popup',
      width: 450,
      height: 350,
      focused: true
    });

    showToast('Please grant microphone permission in the popup window', 'info');
    // The permission popup will notify us when permission is granted

  } catch (error) {
    console.error('[Side Panel] Error opening permission popup:', error);
    showToast(`Error: ${error.message}`, 'error');
  }
}

// Listen for permission granted message
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'PERMISSION_GRANTED') {
    console.log('[Side Panel] Permission granted, starting recording');
    actuallyStartRecording();
  }
});

async function actuallyStartRecording() {
  try {
    // Get settings for language
    const settings = await getSettings();

    // Initialize transcription service
    transcriptionService = new TranscriptionService({
      language: settings.transcriptionLanguage || 'en-US',
      continuous: true,
      interimResults: true
    });

    // Set up event handlers
    transcriptionService.onInterimTranscript = (text, confidence) => {
      // Show interim results in lighter color
      const interim = document.createElement('span');
      interim.className = 'interim-text';
      interim.style.color = '#9ca3af';
      interim.textContent = text;

      // Replace previous interim text
      const existingInterim = transcriptionText.querySelector('.interim-text');
      if (existingInterim) {
        existingInterim.remove();
      }
      transcriptionText.appendChild(interim);
    };

    transcriptionService.onFinalTranscript = (text, confidence) => {
      console.log('[Side Panel] Final transcript:', text, 'confidence:', confidence);

      // Remove interim text
      const existingInterim = transcriptionText.querySelector('.interim-text');
      if (existingInterim) {
        existingInterim.remove();
      }

      // Add final text
      if (transcriptionText.textContent) {
        transcriptionText.textContent += ' ' + text;
      } else {
        transcriptionText.textContent = text;
      }

      // Update current transcription
      currentTranscription = transcriptionText.textContent.trim();
    };

    transcriptionService.onError = (error, type) => {
      console.error('[Side Panel] Transcription error:', error, type);

      if (type === 'not-allowed') {
        showToast('Microphone access denied. Please allow microphone access in your browser settings or site permissions.', 'error');
      } else if (type === 'no-speech') {
        showToast('No speech detected. Please try again.', 'warning');
      } else {
        showToast(`Error: ${error.message}`, 'error');
      }
    };

    transcriptionService.onStart = () => {
      console.log('[Side Panel] Transcription started');
      isRecording = true;
      recordingStartTime = Date.now();

      // Update UI
      recordBtn.classList.remove('btn-primary');
      recordBtn.classList.add('btn-danger');
      recordBtnText.textContent = 'Stop Recording';

      recordingStatus.className = 'status-recording';
      recordingStatus.querySelector('.status-text').textContent = 'Recording... Speak now!';

      recordingTimer.style.display = 'block';
      transcriptionContainer.style.display = 'block';
      transcriptionText.textContent = '';

      // Start timer
      startTimer();

      showToast('Recording started - speak now!', 'success');
    };

    transcriptionService.onStop = () => {
      console.log('[Side Panel] Transcription stopped');
    };

    // Start transcription
    await transcriptionService.start();

  } catch (error) {
    console.error('[Side Panel] Error starting recording:', error);
    showToast(`Error: ${error.message}`, 'error');
  }
}

async function stopRecording() {
  console.log('[Side Panel] Stopping recording...');

  try {
    // Stop transcription service
    if (transcriptionService) {
      transcriptionService.stop();
      transcriptionService.dispose();
      transcriptionService = null;
    }

    isRecording = false;
    stopTimer();

    // Update UI
    recordBtn.classList.remove('btn-danger');
    recordBtn.classList.add('btn-primary');
    recordBtnText.textContent = 'Start Recording';

    recordingStatus.className = 'status-idle';
    recordingStatus.querySelector('.status-text').textContent = 'Recording Complete';

    recordingTimer.style.display = 'none';

    // Remove any interim text
    const existingInterim = transcriptionText.querySelector('.interim-text');
    if (existingInterim) {
      existingInterim.remove();
    }

    // Get final transcription
    currentTranscription = transcriptionText.textContent.trim();

    if (!currentTranscription) {
      showToast('No speech detected. Please try again.', 'warning');
      return;
    }

    showToast('Recording stopped', 'success');

    // Show destination chooser
    await showDestinationChooser();

  } catch (error) {
    console.error('[Side Panel] Error stopping recording:', error);
    showToast(`Error: ${error.message}`, 'error');
  }
}

function startTimer() {
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    recordingTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// ============================================================================
// Destination Chooser
// ============================================================================

async function showDestinationChooser() {
  destinationTranscriptionPreview.textContent = truncateText(currentTranscription, 200);

  // Enable/disable destination options based on settings
  const settings = await getSettings();

  document.querySelector('[data-destination="github-issue"]').disabled = !settings.githubToken;
  document.querySelector('[data-destination="github-project"]').disabled = !settings.githubToken;
  document.querySelector('[data-destination="onenote"]').disabled = !settings.onenoteToken;

  showScreen(screens.DESTINATION);
}

async function handleDestinationSelected(destination) {
  console.log('[Side Panel] Destination selected:', destination);

  if (destination === 'draft') {
    await saveDraft();
  } else {
    showToast(`${destination} integration coming in later phases`, 'warning');
  }
}

async function saveDraft() {
  try {
    const { generateUUID } = await import('../utils/helpers.js');
    const { saveDraft: saveDraftToStorage } = await import('../lib/storage.js');

    const draft = {
      id: generateUUID(),
      timestamp: Date.now(),
      transcription: currentTranscription,
    };

    // Save directly to chrome.storage
    const success = await saveDraftToStorage(draft);

    if (success) {
      showToast('Draft saved!', 'success');

      // Reset recording state
      currentTranscription = '';
      transcriptionText.textContent = '';
      transcriptionContainer.style.display = 'none';
      recordingStatus.querySelector('.status-text').textContent = 'Ready to Record';

      // Show recording screen
      showScreen(screens.RECORDING);

      // Refresh recent notes
      await loadRecentNotes();
    } else {
      throw new Error('Failed to save draft');
    }
  } catch (error) {
    console.error('[Side Panel] Error saving draft:', error);
    showToast(`Error: ${error.message}`, 'error');
  }
}

// ============================================================================
// History Functions
// ============================================================================

async function loadHistory() {
  try {
    const drafts = await getDrafts();
    const history = await getHistory();

    // Combine drafts and history
    const allItems = [
      ...drafts.map(d => ({ ...d, status: 'draft', destination: 'draft' })),
      ...history
    ];

    // Sort by timestamp (most recent first)
    allItems.sort((a, b) => b.timestamp - a.timestamp);

    if (allItems.length === 0) {
      historyList.innerHTML = '<p class="empty-state">No history yet.</p>';
      return;
    }

    historyList.innerHTML = allItems.map(item => `
      <div class="note-card" data-id="${item.id}">
        <div class="note-header">
          <span class="note-icon">${getDestinationIcon(item.destination)}</span>
          <span class="note-title">${truncateText(item.transcription, 50)}</span>
        </div>
        <div class="note-meta">
          ${formatRelativeTime(item.timestamp)}
          ${item.status === 'draft' ? '• Draft' : ''}
        </div>
      </div>
    `).join('');

    // Add click handlers
    historyList.querySelectorAll('.note-card').forEach(card => {
      card.addEventListener('click', () => {
        const itemId = card.getAttribute('data-id');
        handleHistoryItemClick(itemId, allItems);
      });
    });
  } catch (error) {
    console.error('[Side Panel] Error loading history:', error);
    historyList.innerHTML = '<p class="empty-state text-danger">Error loading history</p>';
  }
}

async function loadRecentNotes() {
  try {
    const drafts = await getDrafts();
    const history = await getHistory();

    const allItems = [
      ...drafts.map(d => ({ ...d, status: 'draft', destination: 'draft' })),
      ...history
    ];

    allItems.sort((a, b) => b.timestamp - a.timestamp);
    const recent = allItems.slice(0, 3);

    if (recent.length === 0) {
      recentNotesList.innerHTML = '<p class="empty-state">No notes yet. Start recording to create your first note!</p>';
      return;
    }

    recentNotesList.innerHTML = recent.map(item => `
      <div class="note-card" data-id="${item.id}">
        <div class="note-header">
          <span class="note-icon">${getDestinationIcon(item.destination)}</span>
          <span class="note-title">${truncateText(item.transcription, 40)}</span>
        </div>
        <div class="note-meta">${formatRelativeTime(item.timestamp)}</div>
      </div>
    `).join('');

    recentNotesList.querySelectorAll('.note-card').forEach(card => {
      card.addEventListener('click', () => {
        const itemId = card.getAttribute('data-id');
        handleHistoryItemClick(itemId, allItems);
      });
    });
  } catch (error) {
    console.error('[Side Panel] Error loading recent notes:', error);
  }
}

function handleHistoryItemClick(itemId, allItems) {
  const item = allItems.find(i => i.id === itemId);
  if (!item) return;

  if (item.status === 'draft') {
    // TODO: Show draft promotion UI in Phase 3
    showToast('Draft promotion coming in Phase 3', 'info');
  } else if (item.artifactUrl) {
    // Open artifact in new tab
    chrome.tabs.create({ url: item.artifactUrl });
  }
}

// ============================================================================
// Settings Functions
// ============================================================================

async function loadSettings() {
  try {
    const settings = await getSettings();

    githubTokenInput.value = settings.githubToken || '';
    githubDefaultRepoInput.value = settings.githubDefaultRepo || '';
    maxDurationInput.value = settings.maxRecordingDuration || 300;
  } catch (error) {
    console.error('[Side Panel] Error loading settings:', error);
    showToast('Error loading settings', 'error');
  }
}

async function handleSaveSettings() {
  try {
    const updates = {
      githubToken: githubTokenInput.value.trim() || null,
      githubDefaultRepo: githubDefaultRepoInput.value.trim() || null,
      maxRecordingDuration: parseInt(maxDurationInput.value) || 300,
    };

    const success = await updateSettings(updates);

    if (success) {
      showToast('Settings saved!', 'success');
    } else {
      throw new Error('Failed to save settings');
    }
  } catch (error) {
    console.error('[Side Panel] Error saving settings:', error);
    showToast(`Error: ${error.message}`, 'error');
  }
}

async function handleResetSettings() {
  if (!confirm('Are you sure you want to reset all settings to defaults?')) {
    return;
  }

  try {
    const success = await resetSettings();

    if (success) {
      showToast('Settings reset to defaults', 'success');
      await loadSettings();
    } else {
      throw new Error('Failed to reset settings');
    }
  } catch (error) {
    console.error('[Side Panel] Error resetting settings:', error);
    showToast(`Error: ${error.message}`, 'error');
  }
}

// ============================================================================
// Toast Notifications
// ============================================================================

function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toastContainer');

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ============================================================================
// Initialization
// ============================================================================

async function init() {
  console.log('[Side Panel] Initializing...');

  // Load initial data
  await loadRecentNotes();

  // Show recording screen
  showScreen(screens.RECORDING);

  console.log('[Side Panel] Ready');
}

// Start when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
