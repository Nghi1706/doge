// Background script for Dogecoin Profit Calculator - Manifest V3 Optimized
class BackgroundService {
    constructor() {
        this.isRunning = false;
        this.setupMessageListener();
        this.setupAlarmListener();
        this.loadState();
    }

    // message listener
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case 'start':
                    this.start();
                    sendResponse({ success: true });
                    break;
                case 'stop':
                    this.stop();
                    sendResponse({ success: true });
                    break;
                case 'getStatus':
                    sendResponse({ isRunning: this.isRunning });
                    break;
                default:
                    sendResponse({ success: false });
            }
        });
    }
    
    setupAlarmListener() {
        // Listen for alarm events - this is the ONLY way to handle periodic tasks in Manifest V3
        chrome.alarms.onAlarm.addListener(async (alarm) => {
            if (alarm.name === 'priceMonitoring') {
                console.log('Price monitoring alarm triggered');
                await this.fetchPriceFromTargetPage();
            }
        });
    }
    
    async loadState() {
        try {
            const result = await chrome.storage.local.get(['isRunning']);
            this.isRunning = result.isRunning || false;
            
            if (this.isRunning) {
                console.log('Restoring background service from saved state');
                this.startPriceMonitoring();
            }
        } catch (error) {
            console.error('Error loading state:', error);
        }
    }
    
    async start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        await chrome.storage.local.set({ isRunning: true });
        this.startPriceMonitoring();
        
        console.log('Background service started');
    }
    
    async stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        await chrome.storage.local.set({ isRunning: false });
        this.stopPriceMonitoring();
        
        console.log('Background service stopped');
    }
    
    startPriceMonitoring() {
        // Clear any existing alarm
        chrome.alarms.clear('priceMonitoring');
        
        // Create alarm to fetch price every 1 minute
        chrome.alarms.create('priceMonitoring', { 
            delayInMinutes: 1, 
            periodInMinutes: 1 
        });
        
        // Fetch immediately
        this.fetchPriceFromTargetPage();
        
        console.log('Price monitoring alarm created - will fetch every 1 minute');
    }
    
    stopPriceMonitoring() {
        chrome.alarms.clear('priceMonitoring');
        console.log('Price monitoring alarm cleared');
    }
    
    async fetchPriceFromTargetPage() {
        try {
            // Find the target tab with more flexible URL matching
            const tabs = await chrome.tabs.query({
                url: "https://www.mining-dutch.nl/pools/dogecoin.php*"
            });
            
            if (tabs.length > 0) {
                const tab = tabs[0];
                
                // Check if tab is active and ready
                if (tab.status !== 'complete') {
                    console.log('Target tab is not ready yet');
                    return;
                }
                
                try {
                    // Execute script to get price
                    const results = await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        function: () => {
                            const priceElement = document.getElementById('b-price');
                            if (priceElement) {
                                return priceElement.textContent;
                            }
                            return null;
                        }
                    });
                    
                    if (results[0]?.result) {
                        const priceText = results[0].result;
                        const price = parseFloat(priceText.replace(/[^\d.-]/g, ''));
                        
                        if (!isNaN(price)) {
                            const profit = price * 100000000; // Multiply by 100 million
                            
                            // Store the price and collect data
                            await chrome.storage.local.set({ 
                                currentPrice: profit,
                                lastPriceUpdate: new Date().toISOString()
                            });
                            
                            // Collect data with profit calculation
                            await this.collectData(profit);
                            
                            console.log('Price updated:', profit);
                        } else {
                            console.log('Invalid price format:', priceText);
                        }
                    } else {
                        console.log('Price element not found on page');
                    }
                } catch (scriptError) {
                    console.log('Script execution failed:', scriptError.message);
                }
            } else {
                console.log('Target tab not found. Please open: https://www.mining-dutch.nl/pools/dogecoin.php?page=dashboard#');
                
                // Try to find any tab with mining-dutch.nl
                const allTabs = await chrome.tabs.query({
                    url: "https://www.mining-dutch.nl/*"
                });
                
                if (allTabs.length > 0) {
                    console.log('Found mining-dutch.nl tab, but URL might be different');
                } else {
                    console.log('No mining-dutch.nl tabs found');
                }
            }
        } catch (error) {
            console.error('Error fetching price:', error);
        }
    }
    
    async collectData(profit) {
        try {
            const result = await chrome.storage.local.get(['input1', 'input2', 'input3', 'dataRecords']);
            const input1 = parseFloat(result.input1) || 0;
            const input2 = parseFloat(result.input2) || 0;
            const input3 = parseFloat(result.input3) || 1;
            
            // Skip data collection if inputs are not set
            if (input1 === 0 || input2 === 0 || input3 === 0) {
                console.log('Skipping data collection - inputs not set');
                return;
            }
            
            const cal = ((((profit * input1 + input2) / input3) - 0.04) - 1) * 100;
            
            const now = new Date();
            const record = {
                input1,
                input2,
                input3,
                profit,
                cal,
                timestamp: now.toISOString(),
                time: now.toLocaleString('vi-VN')
            };

            const dataRecords = result.dataRecords || [];
            dataRecords.unshift(record); // Add to beginning

            // Keep only last 10000 records
            if (dataRecords.length > 10000) {
                dataRecords.splice(10000);
            }

            await chrome.storage.local.set({ 
                dataRecords,
                lastPrice: profit,
                lastUpdate: now.toLocaleString('vi-VN')
            });

            console.log('Data collected:', record);
        } catch (error) {
            console.error('Error collecting data:', error);
        }
    }
}

// Initialize background service
const backgroundService = new BackgroundService();

// Log service worker startup
console.log('Background service worker started - Manifest V3 optimized with chrome.alarms');