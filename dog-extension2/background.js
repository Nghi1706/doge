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
            } else if (alarm.name === 'pageReopen') {
                await this.reopenTargetPage();
            } else if (alarm.name === 'tabFocus') {
                await this.focusTargetTab();
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
        chrome.alarms.clear('pageReopen');
        chrome.alarms.clear('tabFocus');
        
        // Create alarm to fetch price every 45 seconds
        chrome.alarms.create('priceMonitoring', { 
            delayInMinutes: 45/60, 
            periodInMinutes: 45/60
        });
        
        // Create alarm to reload page every 5 minutes (tăng tần suất)
        chrome.alarms.create('pageReload', { 
            delayInMinutes: 5, 
            periodInMinutes: 5 
        });
        
        // Create alarm to focus tab every 2 minutes (thêm focus)
        chrome.alarms.create('tabFocus', { 
            delayInMinutes: 2, 
            periodInMinutes: 2 
        });
        
        // Create alarm to reopen page every 15 minutes (giảm xuống)
        chrome.alarms.create('pageReopen', { 
            delayInMinutes: 15, 
            periodInMinutes: 15 
        });
        
        // Fetch immediately
        this.fetchPriceFromTargetPage();
    }
    
    stopPriceMonitoring() {
        chrome.alarms.clear('priceMonitoring');
        chrome.alarms.clear('pageReload');
        chrome.alarms.clear('pageReopen');
        chrome.alarms.clear('tabFocus');
    }
    
    async focusTargetTab() {
        try {
            const tabs = await chrome.tabs.query({
                url: "https://www.mining-dutch.nl/pools/dogecoin.php*"
            });

            if (tabs.length > 0) {
                const tab = tabs[0];
                
                // Focus vào tab để "đánh thức" nó
                await chrome.tabs.update(tab.id, { active: true });
                
                // Sau 1 giây thì quay lại tab trước đó
                setTimeout(async () => {
                    try {
                        // Lấy tất cả tabs và chuyển về tab khác
                        const allTabs = await chrome.tabs.query({});
                        const otherTab = allTabs.find(t => t.id !== tab.id && !t.url.includes('mining-dutch.nl'));
                        if (otherTab) {
                            await chrome.tabs.update(otherTab.id, { active: true });
                        }
                    } catch (error) {
                        console.log('Cannot switch back to other tab:', error);
                    }
                }, 1000);
                
                console.log('🎯 Đã focus vào tab để đánh thức');
            }
        } catch (error) {
            console.error('Error focusing tab:', error);
        }
    }
    
    async reloadTargetPage() {
        try {
            // Find the target tab
            const tabs = await chrome.tabs.query({
                url: "https://www.mining-dutch.nl/pools/dogecoin.php*"
            });

            if (tabs.length > 0) {
                const tab = tabs[0];
                
                // Thử inject script để làm trang "sống" lại trước khi reload
                try {
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        function: () => {
                            // Scroll một chút để trigger events
                            window.scrollBy(0, 10);
                            window.scrollBy(0, -10);
                            
                            // Trigger một số events để "đánh thức" trang
                            window.dispatchEvent(new Event('focus'));
                            window.dispatchEvent(new Event('mousemove'));
                            
                            // Click vào element nếu có
                            const priceElement = document.getElementById('b-price');
                            if (priceElement) {
                                priceElement.click();
                            }
                        }
                    });
                    
                    // Đợi 2 giây rồi mới reload
                    setTimeout(async () => {
                        await chrome.tabs.reload(tab.id);
                        console.log('🔄 Đã reload tab sau khi đánh thức');
                    }, 2000);
                    
                } catch (scriptError) {
                    // Nếu script fail thì reload luôn
                    await chrome.tabs.reload(tab.id);
                    console.log('🔄 Đã reload tab (script failed)');
                }
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

            if (tabs.length > 0) {
                const tab = tabs[0];
                
                // Check if tab is active and ready
                if (tab.status !== 'complete') {
                    return;
                }
                
                // Thử lấy giá với retry logic
                let attempts = 0;
                const maxAttempts = 3;
                
                while (attempts < maxAttempts) {
                    try {
                        // Execute script to get price
                        const results = await chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            function: () => {
                                // Thêm logic để check xem trang có đang "sống" không
                                const priceElement = document.getElementById('b-price');
                                if (priceElement) {
                                    // Trigger events để đánh thức element
                                    priceElement.dispatchEvent(new Event('mouseover'));
                                    
                                    return {
                                        price: priceElement.textContent,
                                        timestamp: Date.now(),
                                        pageActive: document.hasFocus(),
                                        elementVisible: priceElement.offsetParent !== null
                                    };
                                }
                                return null;
                            }
                        });
                        
                        if (results[0]?.result?.price) {
                            const data = results[0].result;
                            const priceText = data.price;
                            const price = parseFloat(priceText.replace(/[^\d.-]/g, ''));
                            
                            if (!isNaN(price)) {
                                const profit = price * 100000000;
                                
                                // Store the price and collect data
                                await chrome.storage.local.set({ 
                                    currentPrice: profit,
                                    lastPriceUpdate: new Date().toISOString(),
                                    pageStatus: {
                                        active: data.pageActive,
                                        visible: data.elementVisible,
                                        lastSuccessTime: Date.now()
                                    }
                                });
                                
                                // Collect data with profit calculation
                                await this.collectData(profit);
                                
                                // Record operation for performance monitoring
                                this.performanceMonitor.recordOperation();
                                
                                console.log(`✅ Lấy giá thành công: ${profit} (attempt ${attempts + 1})`);
                                return; // Success, exit retry loop
                                
                            } else {
                                console.log(`❌ Giá không hợp lệ: ${priceText} (attempt ${attempts + 1})`);
                            }
                        } else {
                            console.log(`❌ Không tìm thấy element (attempt ${attempts + 1})`);
                        }
                        
                    } catch (scriptError) {
                        console.log(`❌ Script execution failed (attempt ${attempts + 1}):`, scriptError.message);
                    }
                    
                    attempts++;
                    
                    // Nếu fail, đợi 5 giây rồi thử lại
                    if (attempts < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 5000));
                    }
                }
                
                // Nếu tất cả attempts đều fail, thực hiện reload
                console.log('❌ Tất cả attempts đều fail, reload tab...');
                await this.reloadTargetPage();
                
            } else {
                // Tự động mở tab mới nếu không tìm thấy
                console.log('❌ Không tìm thấy tab, mở tab mới...');
                await chrome.tabs.create({
                    url: 'https://www.mining-dutch.nl/pools/dogecoin.php?page=dashboard#',
                    active: false
                });
            }
        } catch (error) {
            console.error('Error fetching price:', error);
        }
    }
    
    async collectData(profit) {
        try {
            const result = await chrome.storage.local.get(['input1', 'input2', 'input3', 'input4', 'dataRecords']);
            const input1 = parseFloat(result.input1) || 0;
            const input2 = parseFloat(result.input2) || 0;
            const input3 = parseFloat(result.input3) || 1;
            const input4 = parseFloat(result.input4) || 0;

            // Skip data collection if inputs are not set
            if (input1 === 0 || input3 === 0) {
                console.log('Input 1 và Input 3 phải khác 0 để tính toán');
                return;
            }

            const now = new Date();
            const currentMinute = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
            // 1. Kiểm tra trùng lặp trong cùng phút
            const dataRecords = result.dataRecords || [];
            const existingRecord = dataRecords.find(record => {
                const recordTime = new Date(record.timestamp);
                const recordMinute = `${recordTime.getFullYear()}-${String(recordTime.getMonth() + 1).padStart(2, '0')}-${String(recordTime.getDate()).padStart(2, '0')} ${String(recordTime.getHours()).padStart(2, '0')}:${String(recordTime.getMinutes()).padStart(2, '0')}`;
                return recordMinute === currentMinute;
            });

            if (existingRecord) {
                console.log(`Đã có dữ liệu cho phút ${currentMinute}, bỏ qua...`);
                return;
            }
            
            const cal = ((((profit * input1 + input2) / input3) - 0.04) - 1) * 100;
            
            // 2. Tính chênh lệch với các giá trị mặc định
            const defaultDifferences = [-45, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60];
            const calculatedDiff = (profit - input3) / 10;
            const closestDiff = defaultDifferences.reduce((prev, curr) => {
                return Math.abs(curr - calculatedDiff) < Math.abs(prev - calculatedDiff) ? curr : prev;
            });

            // 3. Tính lợi nhuận = input4 * %cal
            const profit_amount = input4 * (cal / 100);

            const record = {
                input1,
                input2,
                input3,
                input4,
                profit,
                cal,
                difference: closestDiff,
                profit_amount: profit_amount,
                timestamp: now.toISOString(),
                time: now.toLocaleString('vi-VN')
            };

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

            console.log(`✅ Đã lưu dữ liệu cho phút ${currentMinute}`);

        } catch (error) {
            console.error('LỖI KHI TÍNH TOÁN:', error);
        }
    }

    // Thêm method để clear cache và cookies
    async clearCacheAndCookies() {
        try {
            // Clear cache cho domain
            await chrome.browsingData.remove({
                "origins": ["https://www.mining-dutch.nl"]
            }, {
                "cache": true,
                "cookies": true
            });
            
            console.log('🧹 Đã clear cache và cookies cho mining-dutch.nl');
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }

    // 4. Thêm method đóng/mở tab mỗi 15 phút
    async reopenTargetPage() {
        try {
            console.log('🔄 Bắt đầu đóng/mở tab mỗi 15 phút...');
            
            // Clear cache trước khi đóng tab
            await this.clearCacheAndCookies();
            
            // Tìm tab target
            const tabs = await chrome.tabs.query({
                url: "https://www.mining-dutch.nl/pools/dogecoin.php*"
            });

            if (tabs.length > 0) {
                // Đóng tất cả các tab khớp
                for (const tab of tabs) {
                    console.log(`🚪 Đóng tab: ${tab.url}`);
                    await chrome.tabs.remove(tab.id);
                }
                
                // Đợi 3 giây rồi mở lại
                setTimeout(async () => {
                    try {
                        const newTab = await chrome.tabs.create({
                            url: 'https://www.mining-dutch.nl/pools/dogecoin.php?page=dashboard#',
                            active: false // Không focus vào tab mới
                        });
                        console.log(`✅ Đã mở lại tab mới: ${newTab.id}`);
                        
                        // Đợi tab load xong rồi fetch dữ liệu
                        setTimeout(() => {
                            this.fetchPriceFromTargetPage();
                        }, 5000); // Tăng thời gian đợi lên 5 giây
                        
                    } catch (error) {
                        console.error('❌ Lỗi khi mở tab mới:', error);
                    }
                }, 3000);
                
            } else {
                console.log('❌ Không tìm thấy tab target để đóng/mở');
                // Mở tab mới nếu không tìm thấy
                await chrome.tabs.create({
                    url: 'https://www.mining-dutch.nl/pools/dogecoin.php?page=dashboard#',
                    active: false
                });
            }
        } catch (error) {
            console.error('❌ Lỗi khi thực hiện đóng/mở tab:', error);
        }
    }
}

// Initialize background service
const backgroundService = new BackgroundService();