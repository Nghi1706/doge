class DogecoinMonitor {
  constructor() {
    this.monitorInterval = null;
    this.isRunning = false;
    this.init();
  }

  init() {
    chrome.runtime.onInstalled.addListener(() => {
      console.log('Dogecoin Profit Monitor installed');
      this.setStatus('installed');
    });

    chrome.runtime.onStartup.addListener(() => {
      this.loadStatus();
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && 
          tab.url && 
          tab.url.includes('mining-dutch.nl/pools/dogecoin.php?page=dashboard')) {
        if (this.isRunning) {
          this.startMonitoring();
        }
      }
    });

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sendResponse);
      return true; // Will respond asynchronously
    });

    // Load initial status
    this.loadStatus();
  }

  async handleMessage(message, sendResponse) {
    try {
      switch (message.action) {
        case 'start':
          await this.startMonitoring();
          sendResponse({ success: true, status: 'running' });
          break;
        case 'stop':
          await this.stopMonitoring();
          sendResponse({ success: true, status: 'stopped' });
          break;
        case 'test':
          const testResult = await this.testConnection();
          sendResponse({ success: true, testResult });
          break;
        case 'getStatus':
          sendResponse({ success: true, status: this.isRunning ? 'running' : 'stopped' });
          break;
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  async loadStatus() {
    const result = await chrome.storage.local.get(['monitorStatus']);
    this.isRunning = result.monitorStatus === 'running';
    if (this.isRunning) {
      await this.startMonitoring();
    }
  }

  async setStatus(status) {
    this.isRunning = status === 'running';
    await chrome.storage.local.set({ 
      monitorStatus: status,
      statusUpdate: new Date().toLocaleString('vi-VN')
    });
  }

  async startMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }

    this.isRunning = true;
    await this.setStatus('running');

    // Monitor every 60 seconds
    this.monitorInterval = setInterval(async () => {
      await this.monitorPrice();
    }, 60000);

    // Run immediately
    await this.monitorPrice();
    console.log('Monitoring started');
  }

  async stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    this.isRunning = false;
    await this.setStatus('stopped');
    console.log('Monitoring stopped');
  }

  async testConnection() {
    try {
      const tabs = await chrome.tabs.query({
        url: "https://www.mining-dutch.nl/pools/dogecoin.php*"
      });

      if (tabs.length === 0) {
        return {
          success: false,
          message: 'Không tìm thấy tab mining-dutch.nl',
          price: null
        };
      }

      const tab = tabs[0];
      
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          const element = document.getElementById('b-price');
          return {
            found: !!element,
            price: element ? element.textContent.trim() : null,
            url: window.location.href
          };
        }
      });

      const result = results[0]?.result;
      return {
        success: result.found,
        message: result.found ? 'Kết nối thành công!' : 'Không tìm thấy element b-price',
        price: result.price,
        url: result.url
      };
    } catch (error) {
      return {
        success: false,
        message: 'Lỗi kết nối: ' + error.message,
        price: null
      };
    }
  }

  async monitorPrice() {
    if (!this.isRunning) {
      console.log('Monitoring is stopped');
      return;
    }

    try {
      const tabs = await chrome.tabs.query({
        url: "https://www.mining-dutch.nl/pools/dogecoin.php*"
      });

      if (tabs.length === 0) {
        console.log('No matching tabs found');
        await chrome.storage.local.set({ 
          lastError: 'Không tìm thấy tab mining-dutch.nl',
          lastErrorTime: new Date().toLocaleString('vi-VN')
        });
        return;
      }

      const tab = tabs[0];
      
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          const element = document.getElementById('b-price');
          return element ? element.textContent.trim() : null;
        }
      });

      const price = results[0]?.result;
      if (price !== null && price !== undefined) {
        const profit = parseFloat(price) * 100000000;
        await this.saveData(profit);
        await chrome.storage.local.remove(['lastError', 'lastErrorTime']);
      } else {
        await chrome.storage.local.set({ 
          lastError: 'Không tìm thấy element b-price',
          lastErrorTime: new Date().toLocaleString('vi-VN')
        });
      }
    } catch (error) {
      console.error('Error monitoring price:', error);
      await chrome.storage.local.set({ 
        lastError: error.message,
        lastErrorTime: new Date().toLocaleString('vi-VN')
      });
    }
  }

  async saveData(profit) {
    try {
      const result = await chrome.storage.local.get(['input1', 'input2', 'input3', 'records']);
      const input1 = result.input1 || 0;
      const input2 = result.input2 || 0;
      const input3 = result.input3 || 1;
      
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

      const records = result.records || [];
      records.unshift(record); // Add to beginning

      // Keep only last 10000 records
      if (records.length > 10000) {
        records.splice(10000);
      }

      await chrome.storage.local.set({ 
        records,
        lastPrice: profit,
        lastUpdate: now.toLocaleString('vi-VN')
      });

      console.log('Data saved:', record);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }
}

new DogecoinMonitor();