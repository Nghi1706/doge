// Background script for Dogecoin Profit Calculator - Manifest V3 Optimized
class PerformanceMonitor {
    constructor() {
        this.startTime = Date.now();
        this.operationCount = 0;
        this.lastCleanup = Date.now();
    }

    recordOperation() {
        this.operationCount++;
        
        // Cleanup every hour
        if (Date.now() - this.lastCleanup > 3600000) {
            this.performCleanup();
            this.lastCleanup = Date.now();
        }
    }

    async performCleanup() {
        try {
            // Clear old alarms (không ảnh hưởng data)
            const alarms = await chrome.alarms.getAll();
            alarms.forEach(alarm => {
                if (alarm.name !== 'priceMonitoring') {
                    chrome.alarms.clear(alarm.name);
                }
            });

            // Log performance stats
            const uptime = Date.now() - this.startTime;
            console.log(`Performance: ${this.operationCount} operations in ${Math.round(uptime/1000)}s`);
            
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }
}

class BackgroundService {
    constructor() {
        this.isRunning = false;
        this.performanceMonitor = new PerformanceMonitor();
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
                await this.fetchPriceFromTargetPage();
            } else if (alarm.name === 'pageReload') {
                await this.reloadTargetPage();
            }
        });
    }
    
    async loadState() {
        try {
            const result = await chrome.storage.local.get(['isRunning']);
            this.isRunning = result.isRunning || false;
            
            // if is running, start monitoring
            if (this.isRunning) {
                console.log('Restoring background service from saved state');
                this.startPriceMonitoring();
            }
            // Todo: check not running restart alarm?
            else {}
        } catch (error) {
            console.error('Error loading state:', error);
        }
    }
    
    async start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        await chrome.storage.local.set({ isRunning: true });
        this.startPriceMonitoring();
    }
    
    async stop() {
        if (!this.isRunning) return;
        this.isRunning = false;
        await chrome.storage.local.set({ isRunning: false });
        this.stopPriceMonitoring();
    }
    
    startPriceMonitoring() {
        chrome.alarms.clear('priceMonitoring');
        chrome.alarms.clear('pageReload');
        
        // Create alarm to fetch price every 1 minute
        chrome.alarms.create('priceMonitoring', { 
            delayInMinutes: 1, 
            periodInMinutes: 1 
        });
        
        // Create alarm to reload page every 10 minutes
        chrome.alarms.create('pageReload', { 
            delayInMinutes: 10, 
            periodInMinutes: 10 
        });
        
        // Fetch immediately
        this.fetchPriceFromTargetPage();
    }
    
    stopPriceMonitoring() {
        chrome.alarms.clear('priceMonitoring');
        chrome.alarms.clear('pageReload');
    }
    
    async reloadTargetPage() {
        try {
            // Find the target tab
            const tabs = await chrome.tabs.query({
                url: "https://www.mining-dutch.nl/pools/dogecoin.php*"
            });

            if (tabs.length > 0) {
                const tab = tabs[0];
                // Reload the tab
                await chrome.tabs.reload(tab.id);
            } else {
                console.log('Target page not found for reload');
            }
        } catch (error) {
            console.error('Error reloading page:', error);
        }
    }
    
    async fetchPriceFromTargetPage() {
        try {
            // Find the target tab with more flexible URL matching
            const tabs = await chrome.tabs.query({
                url: "https://www.mining-dutch.nl/pools/dogecoin.php*"
            });

            // lấy tab đầu tiên khớp => tab mở là tab đầu của trình duyệt
            if (tabs.length > 0) {
                const tab = tabs[0];
                
                // Check if tab is active and ready
                if (tab.status !== 'complete') {
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
                            const profit = price * 100000000;
                            
                            // Store the price and collect data
                            await chrome.storage.local.set({ 
                                currentPrice: profit,
                                lastPriceUpdate: new Date().toISOString()
                            });
                            
                            // Collect data with profit calculation
                            await this.collectData(profit);
                            
                            // Record operation for performance monitoring
                            this.performanceMonitor.recordOperation();
                            
                        } 
                        // todo: handle price parse error
                        else {
                        }
                    } 
                    // todo: handle element not found
                    else {
                    }
                } catch (scriptError) {
                    console.log('Script execution failed:', scriptError.message);
                }
            } else {
                
                alert('Vui lòng mở trang https://www.mining-dutch.nl/pools/dogecoin.php?page=dashboard# để tiện theo dõi giá Dogecoin');
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
            if (input1 === 0 || input3 === 0) {
                alert('input 1, input 3 phải khác 0 để tính toán');
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

            // Keep only last 1440 records 1440 / 60 = 24 hours of data
            if (dataRecords.length > 1440) {
                dataRecords.splice(1440);
            }

            await chrome.storage.local.set({ 
                dataRecords,
                lastPrice: profit,
                lastUpdate: now.toLocaleString('vi-VN')
            });

        } catch (error) {
            alert('LỖI KHI TÍNH TOÁN');
        }
    }
}

// Initialize background service
const backgroundService = new BackgroundService();