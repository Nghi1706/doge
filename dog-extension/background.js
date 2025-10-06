chrome.runtime.onInstalled.addListener(() => {
  console.log('Price Monitor Extension installed');
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPrice') {
    // Handle price monitoring requests
    sendResponse({ status: 'received' });
  }
});