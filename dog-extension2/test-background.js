// test-background.js
function log(message) {
    const logContent = document.getElementById('logContent');
    const timestamp = new Date().toLocaleTimeString();
    logContent.innerHTML += `[${timestamp}] ${message}<br>`;
    logContent.scrollTop = logContent.scrollHeight;
}

function updateStatus(isRunning) {
    const statusDiv = document.getElementById('status');
    if (isRunning) {
        statusDiv.textContent = 'Status: Running';
        statusDiv.className = 'status running';
    } else {
        statusDiv.textContent = 'Status: Stopped';
        statusDiv.className = 'status stopped';
    }
}

function updateExtensionCheck(isAvailable) {
    const checkDiv = document.getElementById('extensionCheck');
    if (isAvailable) {
        checkDiv.textContent = '✅ Extension context available';
        checkDiv.className = 'status running';
    } else {
        checkDiv.textContent = '❌ Extension context not available - Please load this page as extension';
        checkDiv.className = 'status error';
    }
}

// Check if extension context is available
function checkExtensionContext() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        updateExtensionCheck(true);
        log('✅ Extension context detected');
        return true;
    } else {
        updateExtensionCheck(false);
        log('❌ Extension context not available');
        log('💡 To fix: Load this page as extension or use chrome-extension:// URL');
        return false;
    }
}

document.getElementById('startBtn').addEventListener('click', async () => {
    if (!checkExtensionContext()) return;
    
    try {
        const response = await chrome.runtime.sendMessage({ action: 'start' });
        log(`Start response: ${JSON.stringify(response)}`);
        if (response && response.success) {
            log('✅ Background service started successfully');
            updateStatus(true);
        } else {
            log('❌ Failed to start background service');
        }
    } catch (error) {
        log(`❌ Error starting service: ${error.message}`);
    }
});

document.getElementById('stopBtn').addEventListener('click', async () => {
    if (!checkExtensionContext()) return;
    
    try {
        const response = await chrome.runtime.sendMessage({ action: 'stop' });
        log(`Stop response: ${JSON.stringify(response)}`);
        if (response && response.success) {
            log('✅ Background service stopped successfully');
            updateStatus(false);
        } else {
            log('❌ Failed to stop background service');
        }
    } catch (error) {
        log(`❌ Error stopping service: ${error.message}`);
    }
});

document.getElementById('statusBtn').addEventListener('click', async () => {
    if (!checkExtensionContext()) return;
    
    try {
        const response = await chrome.runtime.sendMessage({ action: 'getStatus' });
        log(`Status response: ${JSON.stringify(response)}`);
        if (response && response.isRunning !== undefined) {
            updateStatus(response.isRunning);
            log(`📊 Current status: ${response.isRunning ? 'Running' : 'Stopped'}`);
        } else {
            log('❌ Failed to get status');
        }
    } catch (error) {
        log(`❌ Error getting status: ${error.message}`);
    }
});

document.getElementById('clearAlarmsBtn').addEventListener('click', async () => {
    if (!checkExtensionContext()) return;
    
    try {
        await chrome.alarms.clearAll();
        log('✅ All alarms cleared');
    } catch (error) {
        log(`❌ Error clearing alarms: ${error.message}`);
    }
});

// Auto-check status on load
window.addEventListener('load', async () => {
    log('🚀 Test page loaded');
    
    if (checkExtensionContext()) {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'getStatus' });
            if (response && response.isRunning !== undefined) {
                updateStatus(response.isRunning);
                log(`📊 Initial status: ${response.isRunning ? 'Running' : 'Stopped'}`);
            }
        } catch (error) {
            log(`❌ Error getting initial status: ${error.message}`);
        }
    }
});
