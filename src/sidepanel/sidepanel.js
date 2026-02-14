/**
 * Voice Starter Side Panel
 * Main UI controller
 */

import { getDrafts, getHistory, getSettings, updateSettings, resetSettings } from '../lib/storage.js';
import { formatRelativeTime, getDestinationIcon, truncateText } from '../utils/helpers.js';
import { TranscriptionService } from '../lib/transcription-service.js';
import { GitHubOAuth } from '../lib/github-oauth.js';
import { GitHubService } from '../lib/github-service.js';
import { GitHubCache } from '../lib/github-cache.js';
import { NotionOAuth } from '../lib/notion-oauth.js';
import { NotionService } from '../lib/notion-service.js';

console.log('[Side Panel] Loading...');

// Initialize transcription service
let transcriptionService = null;

// ============================================================================
// Screen Management
// ============================================================================

const screens = {
  RECORDING: 'recordingScreen',
  DESTINATION: 'destinationScreen',
  GITHUB_ISSUE: 'githubIssueScreen',
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
const maxDurationInput = document.getElementById('maxDuration');

// GitHub OAuth elements
const githubOAuthSection = document.getElementById('githubOAuthSection');
const githubNotConnected = document.getElementById('githubNotConnected');
const githubConnected = document.getElementById('githubConnected');
const githubSignInBtn = document.getElementById('githubSignInBtn');
const githubSignOutBtn = document.getElementById('githubSignOutBtn');
const githubUsername = document.getElementById('githubUsername');
const githubAvatar = document.getElementById('githubAvatar');
const developerModeToggle = document.getElementById('developerModeToggle');
const githubDeveloperSection = document.getElementById('githubDeveloperSection');

// Notion OAuth elements
const notionOAuthSection = document.getElementById('notionOAuthSection');
const notionNotConnected = document.getElementById('notionNotConnected');
const notionConnected = document.getElementById('notionConnected');
const notionSignInBtn = document.getElementById('notionSignInBtn');
const notionSignOutBtn = document.getElementById('notionSignOutBtn');
const notionWorkspaceName = document.getElementById('notionWorkspaceName');
const notionWorkspaceIcon = document.getElementById('notionWorkspaceIcon');

// GitHub Issue form elements
const backFromGitHubIssueBtn = document.getElementById('backFromGitHubIssueBtn');
const githubRepoSearch = document.getElementById('githubRepoSearch');
const repoList = document.getElementById('repoList');
const recentReposList = document.getElementById('recentReposList');
const allReposList = document.getElementById('allReposList');
const selectedRepoId = document.getElementById('selectedRepoId');
const issueTitle = document.getElementById('issueTitle');
const issueBody = document.getElementById('issueBody');
const issueLabels = document.getElementById('issueLabels');
const createIssueBtn = document.getElementById('createIssueBtn');
const cancelIssueBtn = document.getElementById('cancelIssueBtn');

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

// GitHub OAuth
githubSignInBtn.addEventListener('click', handleGitHubSignIn);
githubSignOutBtn.addEventListener('click', handleGitHubSignOut);
developerModeToggle.addEventListener('change', handleDeveloperModeToggle);

// Notion OAuth
notionSignInBtn.addEventListener('click', handleNotionSignIn);
notionSignOutBtn.addEventListener('click', handleNotionSignOut);

// GitHub Issue form
backFromGitHubIssueBtn.addEventListener('click', () => showScreen(screens.DESTINATION));
cancelIssueBtn.addEventListener('click', () => showScreen(screens.DESTINATION));
createIssueBtn.addEventListener('click', handleCreateIssue);
githubRepoSearch.addEventListener('input', handleRepoSearch);
githubRepoSearch.addEventListener('focus', () => showRepoDropdown());
githubRepoSearch.addEventListener('blur', () => {
  // Delay to allow click on repo item
  setTimeout(() => hideRepoDropdown(), 200);
});

// Note: OAuth callback is now handled directly by chrome.identity.launchWebAuthFlow
// No need for message listeners

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

  // Enable/disable destination options based on OAuth authentication
  const isGitHubAuthenticated = await GitHubOAuth.isAuthenticated();
  const isNotionAuthenticated = await NotionOAuth.isAuthenticated();
  const settings = await getSettings();

  document.querySelector('[data-destination="github-issue"]').disabled = !isGitHubAuthenticated;
  document.querySelector('[data-destination="github-project"]').disabled = !isGitHubAuthenticated;
  document.querySelector('[data-destination="notion"]').disabled = !isNotionAuthenticated;
  document.querySelector('[data-destination="onenote"]').disabled = !settings.onenoteToken;

  showScreen(screens.DESTINATION);
}

async function handleDestinationSelected(destination) {
  console.log('[Side Panel] Destination selected:', destination);

  if (destination === 'draft') {
    await saveDraft();
  } else if (destination === 'github-issue') {
    await showGitHubIssueForm();
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
    maxDurationInput.value = settings.maxRecordingDuration || 300;

    // Update OAuth UIs
    await updateGitHubConnectionUI();
    await updateNotionConnectionUI();
  } catch (error) {
    console.error('[Side Panel] Error loading settings:', error);
    showToast('Error loading settings', 'error');
  }
}

async function handleSaveSettings() {
  try {
    const updates = {
      githubToken: githubTokenInput.value.trim() || null,
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
// GitHub OAuth Functions
// ============================================================================

async function handleGitHubSignIn() {
  try {
    console.log('[Side Panel] Initiating GitHub OAuth flow');
    githubSignInBtn.disabled = true;
    githubSignInBtn.textContent = 'Opening GitHub...';

    // Launch OAuth flow - this now completes the full flow and returns user data
    const result = await GitHubOAuth.authorize();

    // Update UI with success
    await handleGitHubAuthSuccess(result.user.login);
  } catch (error) {
    console.error('[Side Panel] GitHub sign-in error:', error);
    showToast(`Failed to sign in: ${error.message}`, 'error');
    githubSignInBtn.disabled = false;
    githubSignInBtn.innerHTML = `
      <svg class="oauth-icon" viewBox="0 0 16 16" width="20" height="20" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
      </svg>
      Sign in with GitHub
    `;
  }
}

async function handleGitHubAuthSuccess(username) {
  console.log('[Side Panel] GitHub auth successful:', username);

  // Reset sign in button
  githubSignInBtn.disabled = false;
  githubSignInBtn.innerHTML = `
    <svg class="oauth-icon" viewBox="0 0 16 16" width="20" height="20" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
    </svg>
    Sign in with GitHub
  `;

  // Update UI to show connected state
  await updateGitHubConnectionUI();

  // Enable GitHub destination options
  updateDestinationOptions();

  showToast(`Connected to GitHub as @${username}`, 'success');
}

async function handleGitHubSignOut() {
  if (!confirm('Are you sure you want to sign out of GitHub?')) {
    return;
  }

  try {
    await GitHubOAuth.signOut();
    await updateGitHubConnectionUI();
    updateDestinationOptions();
    showToast('Signed out of GitHub', 'success');
  } catch (error) {
    console.error('[Side Panel] GitHub sign-out error:', error);
    showToast(`Failed to sign out: ${error.message}`, 'error');
  }
}

function handleDeveloperModeToggle(e) {
  const isDeveloperMode = e.target.checked;

  if (isDeveloperMode) {
    githubOAuthSection.style.display = 'none';
    githubDeveloperSection.style.display = 'block';
  } else {
    githubOAuthSection.style.display = 'block';
    githubDeveloperSection.style.display = 'none';
  }
}

// ============================================================================
// Notion OAuth Functions
// ============================================================================

async function handleNotionSignIn() {
  try {
    console.log('[Side Panel] Initiating Notion OAuth flow');
    notionSignInBtn.disabled = true;
    notionSignInBtn.textContent = 'Opening Notion...';

    const result = await NotionOAuth.authorize();
    await handleNotionAuthSuccess(result.workspace.name);
  } catch (error) {
    console.error('[Side Panel] Notion sign-in error:', error);
    showToast(`Failed to sign in: ${error.message}`, 'error');
  } finally {
    notionSignInBtn.disabled = false;
    notionSignInBtn.innerHTML = `
      <svg class="oauth-icon" viewBox="0 0 100 100" width="20" height="20" fill="currentColor">
        <path d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z"/>
      </svg>
      Sign in with Notion
    `;
  }
}

async function handleNotionAuthSuccess(workspaceName) {
  console.log('[Side Panel] Notion auth successful:', workspaceName);
  await updateNotionConnectionUI();
  updateDestinationOptions();
  showToast(`Connected to Notion workspace: ${workspaceName}`, 'success');
}

async function handleNotionSignOut() {
  if (!confirm('Are you sure you want to sign out of Notion?')) {
    return;
  }

  try {
    await NotionOAuth.signOut();
    await updateNotionConnectionUI();
    updateDestinationOptions();
    showToast('Signed out of Notion', 'success');
  } catch (error) {
    console.error('[Side Panel] Notion sign-out error:', error);
    showToast(`Failed to sign out: ${error.message}`, 'error');
  }
}

async function updateNotionConnectionUI() {
  const isAuth = await NotionOAuth.isAuthenticated();

  if (isAuth) {
    // Get workspace info from storage
    const workspaceInfo = await NotionOAuth.getWorkspaceInfo();

    if (workspaceInfo) {
      notionWorkspaceName.textContent = workspaceInfo.name;
      notionWorkspaceIcon.textContent = workspaceInfo.icon || '📝';
    }

    notionNotConnected.style.display = 'none';
    notionConnected.style.display = 'block';
  } else {
    notionNotConnected.style.display = 'block';
    notionConnected.style.display = 'none';
  }
}

async function updateGitHubConnectionUI() {
  const isAuth = await GitHubOAuth.isAuthenticated();

  if (isAuth) {
    // Get user info from storage
    const { githubUsername: username } = await chrome.storage.local.get('githubUsername');

    if (username) {
      // Fetch user data for avatar
      try {
        const user = await GitHubService.getUser();
        githubUsername.textContent = `@${user.login}`;
        githubAvatar.src = user.avatar_url;
        githubAvatar.alt = `${user.login}'s avatar`;
      } catch (error) {
        console.error('[Side Panel] Error fetching user data:', error);
        githubUsername.textContent = `@${username}`;
        githubAvatar.src = `https://github.com/${username}.png`;
      }
    }

    githubNotConnected.style.display = 'none';
    githubConnected.style.display = 'block';
  } else {
    githubNotConnected.style.display = 'block';
    githubConnected.style.display = 'none';
  }
}

function updateDestinationOptions() {
  // Update GitHub destination buttons
  GitHubOAuth.isAuthenticated().then(isAuth => {
    const githubIssueBtn = document.querySelector('[data-destination="github-issue"]');
    const githubProjectBtn = document.querySelector('[data-destination="github-project"]');

    if (githubIssueBtn) {
      if (isAuth) {
        githubIssueBtn.disabled = false;
        const badge = githubIssueBtn.querySelector('.destination-badge');
        if (badge) badge.remove();
      } else {
        githubIssueBtn.disabled = true;
        if (!githubIssueBtn.querySelector('.destination-badge')) {
          const badge = document.createElement('div');
          badge.className = 'destination-badge';
          badge.textContent = 'Not configured';
          githubIssueBtn.appendChild(badge);
        }
      }
    }

    if (githubProjectBtn) {
      if (isAuth) {
        githubProjectBtn.disabled = false;
        const badge = githubProjectBtn.querySelector('.destination-badge');
        if (badge) badge.remove();
      } else {
        githubProjectBtn.disabled = true;
        if (!githubProjectBtn.querySelector('.destination-badge')) {
          const badge = document.createElement('div');
          badge.className = 'destination-badge';
          badge.textContent = 'Not configured';
          githubProjectBtn.appendChild(badge);
        }
      }
    }
  });

  // Update Notion destination button
  NotionOAuth.isAuthenticated().then(isAuth => {
    const notionBtn = document.querySelector('[data-destination="notion"]');

    if (notionBtn) {
      if (isAuth) {
        notionBtn.disabled = false;
        const badge = notionBtn.querySelector('.destination-badge');
        if (badge) badge.remove();
      } else {
        notionBtn.disabled = true;
        if (!notionBtn.querySelector('.destination-badge')) {
          const badge = document.createElement('div');
          badge.className = 'destination-badge';
          badge.textContent = 'Not configured';
          notionBtn.appendChild(badge);
        }
      }
    }
  });
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

  // Update OAuth connection UIs
  await updateGitHubConnectionUI();
  await updateNotionConnectionUI();

  // Update destination button states based on auth
  updateDestinationOptions();

  // Show recording screen
  showScreen(screens.RECORDING);

  console.log('[Side Panel] Ready');
}

// ============================================================================
// GitHub Issue Form Functions
// ============================================================================

let repositories = [];
let selectedRepo = null;

async function showGitHubIssueForm() {
  try {
    // Pre-fill issue body with transcription
    issueBody.value = currentTranscription;

    // Load repositories
    showToast('Loading repositories...', 'info');
    repositories = await GitHubService.fetchRepositories();
    console.log(`[GitHub Issue] Loaded ${repositories.length} repositories`);

    // Show the form
    showScreen(screens.GITHUB_ISSUE);

    // Focus title input
    issueTitle.focus();
  } catch (error) {
    console.error('[GitHub Issue] Error loading repositories:', error);
    showToast(`Failed to load repositories: ${error.message}`, 'error');
  }
}

function showRepoDropdown() {
  renderRepoList();
  repoList.style.display = 'block';
}

function hideRepoDropdown() {
  repoList.style.display = 'none';
}

async function handleRepoSearch(e) {
  const query = e.target.value.trim();
  renderRepoList(query);
}

async function renderRepoList(query = '') {
  // Get recently used repos
  const recentRepos = await GitHubCache.getRecentlyUsedRepos();
  const recentRepoFullNames = recentRepos.map(r => r.fullName);

  // Filter all repositories
  const filteredRepos = query
    ? GitHubService.searchRepositories(query, repositories)
    : repositories;

  // Render recently used section
  if (recentRepos.length > 0 && !query) {
    recentReposList.innerHTML = recentRepos.map(repo =>
      createRepoItem(repo.fullName, repo.description, true)
    ).join('');
  } else {
    recentReposList.innerHTML = '<div class="repo-empty">No recently used repos</div>';
  }

  // Render all repos (excluding recently used to avoid duplicates)
  const nonRecentRepos = filteredRepos.filter(repo =>
    !recentRepoFullNames.includes(repo.full_name)
  );

  if (nonRecentRepos.length > 0) {
    allReposList.innerHTML = nonRecentRepos
      .slice(0, 20) // Limit to 20 results
      .map(repo => createRepoItem(repo.full_name, repo.description, false))
      .join('');
  } else {
    allReposList.innerHTML = '<div class="repo-empty">No repositories found</div>';
  }

  // Add click handlers
  document.querySelectorAll('.repo-item').forEach(item => {
    item.addEventListener('click', handleRepoSelected);
  });
}

function createRepoItem(fullName, description, isRecent) {
  return `
    <div class="repo-item" data-repo="${fullName}">
      <div class="repo-name">${fullName}${isRecent ? ' ⭐' : ''}</div>
      ${description ? `<div class="repo-description">${description}</div>` : ''}
    </div>
  `;
}

function handleRepoSelected(e) {
  const repoFullName = e.currentTarget.getAttribute('data-repo');
  selectedRepo = repositories.find(r => r.full_name === repoFullName);

  if (selectedRepo) {
    githubRepoSearch.value = selectedRepo.full_name;
    selectedRepoId.value = selectedRepo.full_name;

    // Update UI
    document.querySelectorAll('.repo-item').forEach(item => {
      item.classList.remove('selected');
    });
    e.currentTarget.classList.add('selected');

    hideRepoDropdown();
  }
}

async function handleCreateIssue() {
  try {
    // Validate inputs
    if (!selectedRepo) {
      showToast('Please select a repository', 'error');
      githubRepoSearch.focus();
      return;
    }

    if (!issueTitle.value.trim()) {
      showToast('Please enter an issue title', 'error');
      issueTitle.focus();
      return;
    }

    // Disable button and show loading
    createIssueBtn.disabled = true;
    createIssueBtn.textContent = 'Creating...';

    // Parse repository owner and name
    const [owner, repo] = selectedRepo.full_name.split('/');

    // Parse labels (comma-separated)
    const labels = issueLabels.value
      .split(',')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    // Create issue data
    const issueData = {
      title: issueTitle.value.trim(),
      body: issueBody.value.trim(),
      labels: labels.length > 0 ? labels : undefined
    };

    console.log('[GitHub Issue] Creating issue:', issueData);

    // Create the issue
    const createdIssue = await GitHubService.createIssue(owner, repo, issueData);

    console.log('[GitHub Issue] Issue created:', createdIssue.html_url);

    // Save to history
    const { generateUUID } = await import('../utils/helpers.js');
    const { saveToHistory } = await import('../lib/storage.js');

    await saveToHistory({
      id: generateUUID(),
      timestamp: Date.now(),
      transcription: currentTranscription,
      destination: 'github-issue',
      metadata: {
        issueNumber: createdIssue.number,
        issueUrl: createdIssue.html_url,
        repository: selectedRepo.full_name,
        title: createdIssue.title
      }
    });

    // Show success with link
    showToast('✓ Issue created successfully!', 'success');

    // Reset form
    resetIssueForm();

    // Go back to recording screen
    showScreen(screens.RECORDING);

    // Show created issue details in toast
    setTimeout(() => {
      showToast(`View issue: ${createdIssue.html_url}`, 'info');
    }, 1000);

  } catch (error) {
    console.error('[GitHub Issue] Error creating issue:', error);
    showToast(`Failed to create issue: ${error.message}`, 'error');
  } finally {
    createIssueBtn.disabled = false;
    createIssueBtn.textContent = 'Create Issue';
  }
}

function resetIssueForm() {
  githubRepoSearch.value = '';
  selectedRepoId.value = '';
  issueTitle.value = '';
  issueBody.value = '';
  issueLabels.value = '';
  selectedRepo = null;
}

// ============================================================================
// Initialization
// ============================================================================

// Start when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
