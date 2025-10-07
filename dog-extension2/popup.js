// Popup script for Dogecoin Profit Calculator
class DogecoinCalculator {
    constructor() {
        this.isRunning = false;
        this.currentPrice = 0;
        this.dataRecords = [];
        
        this.initializeElements();
        this.loadStoredData();
        this.setupEventListeners();
        this.updateStatus();
        this.startDataRefresh();
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
            
            // Check background status and sync
            this.checkBackgroundStatus();
        } catch (error) {
            console.error('Error loading stored data:', error);
        }
    }
    
    async checkBackgroundStatus() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'getStatus' });
            if (response && response.isRunning !== undefined) {
                this.isRunning = response.isRunning;
                this.updateStatus();
            }
        } catch (error) {
            console.error('Error checking background status:', error);
        }
    }
    
    // Start data refresh to sync with background
    startDataRefresh() {
        setInterval(async () => {
            await this.refreshData();
        }, 5000); // Refresh every 5 seconds
    }
    
    async refreshData() {
        try {
            const result = await chrome.storage.local.get([
                'currentPrice', 'dataRecords', 'lastPriceUpdate', 'isRunning'
            ]);
            
            // Update price if changed
            if (result.currentPrice !== this.currentPrice) {
                this.currentPrice = result.currentPrice || 0;
                this.updatePriceDisplay();
            }
            
            // Update data records if changed
            if (JSON.stringify(result.dataRecords) !== JSON.stringify(this.dataRecords)) {
                this.dataRecords = result.dataRecords || [];
                this.updateDataTable();
            }
            
            // Update running status if changed
            if (result.isRunning !== this.isRunning) {
                this.isRunning = result.isRunning || false;
                this.updateStatus();
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
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
        
        this.updateStatus();
        
        // Send message to background script
        try {
            const response = await chrome.runtime.sendMessage({ action: 'start' });
        } catch (error) {
            alert('Error starting background service: ' + error.message);
        }
    }
    
    async stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        await chrome.storage.local.set({ isRunning: false });
        
        this.updateStatus();
        
        // Send message to background script
        try {
            const response = await chrome.runtime.sendMessage({ action: 'stop' });
      
        } catch (error) {
            alert('Error stopping background service: ' + error.message);
        }
    }
    
    async openTargetPage() {
        try {
            chrome.tabs.create({
                url: 'https://www.mining-dutch.nl/pools/dogecoin.php?page=dashboard#'
            });
        } catch (error) {
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
                        await chrome.storage.local.set({ 
                            currentPrice: this.currentPrice,
                            lastPriceUpdate: new Date().toISOString()
                        });
                        alert(`Test thành công! Giá hiện tại: ${this.currentPrice.toFixed(8)}`);
                    } else {
                        alert(`Giá không hợp lệ: ${priceText}`);
                    }
                } else {
                     const openTab = confirm('Không tìm thấy profit. Bạn có muốn mở tab mới không?');
                    if (openTab) {
                        chrome.tabs.create({
                            url: 'https://www.mining-dutch.nl/pools/dogecoin.php?page=dashboard#'
                        });
                    }
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
                <td>${parseFloat(record.input1 || 0).toFixed(2)}</td>
                <td>${parseFloat(record.input2 || 0).toFixed(2)}</td>
                <td>${parseFloat(record.input3 || 0).toFixed(2)}</td>
                <td>${parseFloat(record.profit || 0).toFixed(2)}</td>
                <td class="${record.cal >= 0 ? 'positive' : 'negative'}">${parseFloat(record.cal || 0).toFixed(2)}%</td>
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
                parseFloat(record.input1 || 0),
                parseFloat(record.input2 || 0),
                parseFloat(record.input3 || 0),
                parseFloat(record.profit || 0).toFixed(0),
                parseFloat(record.cal || 0).toFixed(2),
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
                    <td>${parseFloat(record.input1 || 0).toFixed(2)}</td>
                    <td>${parseFloat(record.input2 || 0).toFixed(2)}</td>
                    <td>${parseFloat(record.input3 || 0).toFixed(2)}</td>
                    <td>${parseFloat(record.profit || 0).toFixed(2)}</td>
                    <td>${parseFloat(record.cal || 0).toFixed(2)}</td>
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
            this.currentPrice = 0;
            this.updateDataTable();
            this.updatePriceDisplay();
            alert('✅ Đã xóa toàn bộ dữ liệu thành công');
        }
    }
}

// Initialize the calculator when popup loads
document.addEventListener('DOMContentLoaded', () => {
    new DogecoinCalculator();
});
