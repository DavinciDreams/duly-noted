/**
 * Permission Request Page
 * Opens in a popup to request microphone permission
 */

const grantBtn = document.getElementById('grantBtn');
const status = document.getElementById('status');

grantBtn.addEventListener('click', async () => {
  try {
    status.textContent = 'Requesting permission...';
    status.className = 'status';

    // Request microphone permission
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Stop the stream immediately - we just needed permission
    stream.getTracks().forEach(track => track.stop());

    status.textContent = '✓ Permission granted! You can close this window.';
    status.className = 'status success';

    // Notify the extension that permission was granted
    chrome.runtime.sendMessage({ type: 'PERMISSION_GRANTED' });

    // Auto-close after 2 seconds
    setTimeout(() => window.close(), 2000);

  } catch (error) {
    console.error('Permission denied:', error);
    status.textContent = '✗ Permission denied. Please allow microphone access and try again.';
    status.className = 'status error';
  }
});
