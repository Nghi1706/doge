// Popup script for Dogecoin Profit Calculator
class DogecoinCalculator {
    constructor() {
        this.isRunning = false;
        this.priceInterval = null;
        this.dataInterval = null;
        this.currentPrice = 0;
        this.dataRecords = [];
        
        this.initializeElements();
        this.loadStoredData();
        this.setupEventListeners();
        this.updateStatus();
    }
    
    initializeElements() {
        this.input1 = document.getElementById('input1');
        this.input2 = document.getElementById('input2');
        this.input3 = document.getElementById('input3');
        this.currentPriceEl = document.getElementById('currentPrice');
        this.lastUpdateEl = document.getElementById('lastUpdate');
        this.statusEl = document.getElementById('status');
        this.dataTableBody = document.getElementById('dataTableBody');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.testBtn = document.getElementById('testBtn');
        this.openPageBtn = document.getElementById('openPageBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.startTime = document.getElementById('startTime');
        this.endTime = document.getElementById('endTime');
    }
    
    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.testBtn.addEventListener('click', () => this.test());
        this.openPageBtn.addEventListener('click', () => this.openTargetPage());
        
        // Export buttons
        document.getElementById('exportCsvBtn').addEventListener('click', () => this.exportData('csv'));
        document.getElementById('exportExcelBtn').addEventListener('click', () => this.exportData('excel'));
        document.getElementById('clearDataBtn').addEventListener('click', () => this.clearData());
        
        // Auto-save inputs
        [this.input1, this.input2, this.input3].forEach(input => {
            input.addEventListener('input', () => this.saveInputs());
        });
    }
    
    async loadStoredData() {
        try {
            const result = await chrome.storage.local.get([
                'isRunning', 'currentPrice', 'dataRecords', 'input1', 'input2', 'input3'
            ]);
            
            this.isRunning = result.isRunning || false;
            this.currentPrice = result.currentPrice || 0;
            this.dataRecords = result.dataRecords || [];
            
            this.input1.value = result.input1 || '';
            this.input2.value = result.input2 || '';
            this.input3.value = result.input3 || '';
            
            this.updatePriceDisplay();
            this.updateDataTable();
            this.updateStatus();
            
            if (this.isRunning) {
                this.startPriceMonitoring();
                this.startDataCollection();
            }
        } catch (error) {
            console.error('Error loading stored data:', error);
        }
    }
    
    async saveInputs() {
        try {
            await chrome.storage.local.set({
                input1: this.input1.value,
                input2: this.input2.value,
                input3: this.input3.value
            });
        } catch (error) {
            console.error('Error saving inputs:', error);
        }
    }
    
    async start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        await chrome.storage.local.set({ isRunning: true });
        
        this.startPriceMonitoring();
        this.startDataCollection();
        this.updateStatus();
        
        // Send message to background script
        chrome.runtime.sendMessage({ action: 'start' });
    }
    
    async stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        await chrome.storage.local.set({ isRunning: false });
        
        this.stopPriceMonitoring();
        this.stopDataCollection();
        this.updateStatus();
        
        // Send message to background script
        chrome.runtime.sendMessage({ action: 'stop' });
    }
    
    async openTargetPage() {
        try {
            chrome.tabs.create({
                url: 'https://www.mining-dutch.nl/pools/dogecoin.php?page=dashboard#'
            });
        } catch (error) {
            console.error('Error opening target page:', error);
            alert('Lỗi khi mở trang: ' + error.message);
        }
    }
    
    async test() {
        try {
            // Test getting price from the target page with more flexible URL matching
            const tabs = await chrome.tabs.query({ 
                url: "https://www.mining-dutch.nl/pools/dogecoin.php*" 
            });
            
            if (tabs.length > 0) {
                const tab = tabs[0];
                
                // Check if tab is ready
                if (tab.status !== 'complete') {
                    alert('Tab chưa load xong. Vui lòng đợi và thử lại.');
                    return;
                }
                
                const result = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: () => {
                        const priceElement = document.getElementById('b-price');
                        return priceElement ? priceElement.textContent : null;
                    }
                });
                
                if (result[0]?.result) {
                    const priceText = result[0].result;
                    const price = parseFloat(priceText.replace(/[^\d.-]/g, ''));
                    
                    if (!isNaN(price)) {
                        this.currentPrice = price * 100000000; // Multiply by 100 million
                        this.updatePriceDisplay();
                        await chrome.storage.local.set({ currentPrice: this.currentPrice });
                        alert(`Test thành công! Giá hiện tại: ${this.currentPrice.toFixed(8)}`);
                    } else {
                        alert(`Giá không hợp lệ: ${priceText}`);
                    }
                } else {
                    alert('Không tìm thấy element với id="b-price". Vui lòng kiểm tra trang web.');
                }
            } else {
                // Try to find any mining-dutch.nl tab
                const allTabs = await chrome.tabs.query({
                    url: "https://www.mining-dutch.nl/*"
                });
                
                if (allTabs.length > 0) {
                    const openTab = confirm('Tìm thấy tab mining-dutch.nl nhưng URL không đúng. Bạn có muốn mở tab mới với URL đúng không?');
                    if (openTab) {
                        chrome.tabs.create({
                            url: 'https://www.mining-dutch.nl/pools/dogecoin.php?page=dashboard#'
                        });
                    }
                } else {
                    const openTab = confirm('Không tìm thấy tab mining-dutch.nl. Bạn có muốn mở tab mới không?');
                    if (openTab) {
                        chrome.tabs.create({
                            url: 'https://www.mining-dutch.nl/pools/dogecoin.php?page=dashboard#'
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Test error:', error);
            alert('Lỗi khi test: ' + error.message);
        }
    }
    
    startPriceMonitoring() {
        this.priceInterval = setInterval(async () => {
            await this.fetchPrice();
        }, 60000); // Every 60 seconds
        
        // Fetch immediately
        this.fetchPrice();
    }
    
    stopPriceMonitoring() {
        if (this.priceInterval) {
            clearInterval(this.priceInterval);
            this.priceInterval = null;
        }
    }
    
    startDataCollection() {
        this.dataInterval = setInterval(() => {
            this.collectData();
        }, 60000); // Every 1 minute
        
        // Collect immediately
        this.collectData();
    }
    
    stopDataCollection() {
        if (this.dataInterval) {
            clearInterval(this.dataInterval);
            this.dataInterval = null;
        }
    }
    
    async fetchPrice() {
        try {
            const tabs = await chrome.tabs.query({ 
                url: "https://www.mining-dutch.nl/pools/dogecoin.php*" 
            });
            
            if (tabs.length > 0) {
                const tab = tabs[0];
                
                // Check if tab is ready
                if (tab.status !== 'complete') {
                    console.log('Tab not ready yet');
                    return;
                }
                
                const result = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: () => {
                        const priceElement = document.getElementById('b-price');
                        return priceElement ? priceElement.textContent : null;
                    }
                });
                
                if (result[0]?.result) {
                    const priceText = result[0].result;
                    const price = parseFloat(priceText.replace(/[^\d.-]/g, ''));
                    
                    if (!isNaN(price)) {
                        this.currentPrice = price * 100000000; // Multiply by 100 million
                        this.updatePriceDisplay();
                        await chrome.storage.local.set({ currentPrice: this.currentPrice });
                    } else {
                        console.log('Invalid price format:', priceText);
                    }
                } else {
                    console.log('Price element not found');
                }
            } else {
                console.log('Target tab not found');
            }
        } catch (error) {
            console.error('Error fetching price:', error);
        }
    }
    
    collectData() {
        const input1 = parseFloat(this.input1.value) || 0;
        const input2 = parseFloat(this.input2.value) || 0;
        const input3 = parseFloat(this.input3.value) || 0;
        
        if (input1 === 0 || input2 === 0 || input3 === 0) {
            return; // Skip if inputs are not set
        }
        
        const profit = this.currentPrice;
        const cal = ((((profit * input1 + input2) / input3) - 0.04) - 1) * 100;
        const timestamp = new Date();
        
        const record = {
            input1,
            input2,
            input3,
            profit,
            cal,
            timestamp: timestamp.toISOString(),
            time: timestamp.toLocaleString('vi-VN')
        };
        
        this.dataRecords.unshift(record); // Add to beginning
        
        // Keep only last 10000 records
        if (this.dataRecords.length > 10000) {
            this.dataRecords.splice(10000);
        }
        
        this.updateDataTable();
        this.saveData();
    }
    
    updatePriceDisplay() {
        this.currentPriceEl.textContent = this.currentPrice.toFixed(8);
        this.lastUpdateEl.textContent = `Cập nhật: ${new Date().toLocaleTimeString()}`;
    }
    
    updateDataTable() {
        this.dataTableBody.innerHTML = '';
        
        this.dataRecords.slice(0, 50).forEach((record, index) => { // Show last 50 records
            const row = document.createElement('tr');
            
            // Add row class for styling
            if (index === 0) row.classList.add('latest-record');
            
            row.innerHTML = `
                <td>${record.input1.toFixed(6)}</td>
                <td>${record.input2.toFixed(6)}</td>
                <td>${record.input3.toFixed(6)}</td>
                <td>${record.profit.toFixed(0)}</td>
                <td class="${record.cal >= 0 ? 'positive' : 'negative'}">${record.cal.toFixed(2)}%</td>
                <td>${record.time}</td>
            `;
            this.dataTableBody.appendChild(row);
        });
    }
    
    updateStatus() {
        if (this.isRunning) {
            this.statusEl.textContent = 'Running';
            this.statusEl.className = 'status running';
        } else {
            this.statusEl.textContent = 'Stopped';
            this.statusEl.className = 'status stopped';
        }
    }
    
    async saveData() {
        try {
            await chrome.storage.local.set({ dataRecords: this.dataRecords });
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }
    
    async exportData(format) {
        const startTime = this.startTime.value;
        const endTime = this.endTime.value;
        
        let filteredRecords = this.dataRecords;
        
        if (startTime) {
            filteredRecords = filteredRecords.filter(record => 
                new Date(record.timestamp) >= new Date(startTime)
            );
        }
        
        if (endTime) {
            filteredRecords = filteredRecords.filter(record => 
                new Date(record.timestamp) <= new Date(endTime)
            );
        }
        
        if (filteredRecords.length === 0) {
            alert('Không có dữ liệu để xuất');
            return;
        }
        
        if (format === 'csv') {
            this.exportToCsv(filteredRecords);
        } else if (format === 'excel') {
            this.exportToExcel(filteredRecords);
        }
        
        alert(`✅ Đã xuất ${filteredRecords.length} bản ghi ra file ${format.toUpperCase()}`);
    }
    
    exportToCsv(records) {
        const headers = ['Input 1', 'Input 2', 'Input 3', 'Profit', 'Cal (%)', 'Timestamp', 'Time'];
        const csvContent = [
            headers.join(','),
            ...records.map(record => [
                record.input1,
                record.input2,
                record.input3,
                record.profit.toFixed(0),
                record.cal.toFixed(2),
                record.timestamp,
                `"${record.time}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        this.downloadFile(blob, `dogecoin_profit_${this.getDateString()}.csv`);
    }
    
    exportToExcel(records) {
        let excelContent = `
            <table>
                <tr>
                    <th>Input 1</th>
                    <th>Input 2</th>
                    <th>Input 3</th>
                    <th>Profit</th>
                    <th>Cal (%)</th>
                    <th>Timestamp</th>
                    <th>Time</th>
                </tr>
        `;

        records.forEach(record => {
            excelContent += `
                <tr>
                    <td>${record.input1.toFixed(2)}</td>
                    <td>${record.input2.toFixed(2)}</td>
                    <td>${record.input3.toFixed(2)}</td>
                    <td>${record.profit.toFixed(2)}</td>
                    <td>${record.cal.toFixed(2)}</td>
                    <td>${record.timestamp}</td>
                    <td>${record.time}</td>
                </tr>
            `;
        });
        
        excelContent += '</table>';

        const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        this.downloadFile(blob, `dogecoin_profit_${this.getDateString()}.xls`);
    }
    
    downloadFile(blob, filename) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }
    
    getDateString() {
        return new Date().toISOString().split('T')[0];
    }
    
    async clearData() {
        if (confirm('⚠️ Bạn có chắc chắn muốn xóa toàn bộ dữ liệu? Hành động này không thể hoàn tác!')) {
            await chrome.storage.local.remove(['dataRecords', 'currentPrice', 'lastPriceUpdate']);
            this.dataRecords = [];
            this.updateDataTable();
            alert('✅ Đã xóa toàn bộ dữ liệu thành công');
        }
    }
}

// Initialize the calculator when popup loads
document.addEventListener('DOMContentLoaded', () => {
    new DogecoinCalculator();
});
