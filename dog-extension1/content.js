class DogecoinContentScript {
  constructor() {
    this.init();
  }

  init() {
    console.log('Dogecoin content script loaded');
    
    // Listen for messages from popup or background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'getPrice') {
        const price = this.getPrice();
        sendResponse({ price });
      }
    });

    // Send price updates to background script
    this.startPriceMonitoring();
  }

  getPrice() {
    const element = document.getElementById('b-price');
    if (element) {
      const price = element.textContent.trim();
      console.log('Price found:', price);
      return price;
    }
    return null;
  }

  startPriceMonitoring() {
    // Monitor for price changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          const price = this.getPrice();
          if (price) {
            chrome.runtime.sendMessage({
              action: 'priceUpdate',
              price: price
            });
          }
        }
      });
    });

    // Start observing
    const priceElement = document.getElementById('b-price');
    if (priceElement) {
      observer.observe(priceElement, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new DogecoinContentScript();
  });
} else {
  new DogecoinContentScript();
}