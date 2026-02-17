/**
 * Permission Request Page
 * Opens in a popup to request microphone permission
 */

const grantBtn = document.getElementById('grantBtn');
const status = document.getElementById('status');
const deniedHelp = document.getElementById('deniedHelp');

grantBtn.addEventListener('click', async () => {
  try {
    status.textContent = 'Requesting permission...';
    status.className = 'status';
    deniedHelp.style.display = 'none';

    // Request microphone permission
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Stop the stream immediately - we just needed permission
    stream.getTracks().forEach(track => track.stop());

    status.textContent = 'Permission granted! Starting recording...';
    status.className = 'status success';

    // Notify the extension that permission was granted
    chrome.runtime.sendMessage({ type: 'PERMISSION_GRANTED' });

    // Auto-close after 1.5 seconds
    setTimeout(() => window.close(), 1500);

  } catch (error) {
    console.error('Permission denied:', error);
    status.textContent = 'Permission denied. See instructions below.';
    status.className = 'status error';
    deniedHelp.style.display = 'block';
  }
});
