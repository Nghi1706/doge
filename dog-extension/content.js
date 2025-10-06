// Content script to interact with webpage
class PriceContentScript {
  constructor() {
    this.init();
  }

  init() {
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'getPrice') {
        const price = this.getPrice();
        sendResponse({ price });
      }
    });
  }

  getPrice() {
    const element = document.getElementById('b-price');
    return element ? element.textContent.trim() : null;
  }
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PriceContentScript();
  });
} else {
  new PriceContentScript();
}