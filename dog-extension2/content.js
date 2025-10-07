// Content script for Dogecoin Profit Calculator
// This script runs on the target page to monitor price changes

class PriceMonitor {
    constructor() {
        this.observer = null;
        this.lastPrice = null;
        this.setupPriceObserver();
    }
    
    setupPriceObserver() {
        // Monitor changes to the price element
        const targetNode = document.getElementById('b-price');
        
        if (targetNode) {
            this.observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' || mutation.type === 'characterData') {
                        this.handlePriceChange();
                    }
                });
            });
            
            this.observer.observe(targetNode, {
                childList: true,
                subtree: true,
                characterData: true
            });
            
            // Initial price check
            this.handlePriceChange();
        } else {
            console.log('Price element not found, retrying in 5 seconds...');
            setTimeout(() => this.setupPriceObserver(), 5000);
        }
    }
    
    handlePriceChange() {
        const priceElement = document.getElementById('b-price');
        if (priceElement) {
            const currentPrice = priceElement.textContent;
            
            if (currentPrice !== this.lastPrice) {
                this.lastPrice = currentPrice;
                
                // Send price update to background script
                chrome.runtime.sendMessage({
                    action: 'priceUpdate',
                    price: currentPrice,
                    timestamp: new Date().toISOString()
                });
                
                console.log('Price changed:', currentPrice);
            }
        }
    }
    
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

// Initialize price monitor when page loads
let priceMonitor = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        priceMonitor = new PriceMonitor();
    });
} else {
    priceMonitor = new PriceMonitor();
}

// Clean up when page unloads
window.addEventListener('beforeunload', () => {
    if (priceMonitor) {
        priceMonitor.destroy();
    }
});

