// Popup script for Dogecoin Profit Calculator
class DogecoinCalculator {
    constructor() {
        this.isRunning = false;
        this.currentPrice = 0;
        this.dataRecords = [];
        this.defaultDifferences = [-45, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60];
        
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
        this.input4 = document.getElementById('input4');
        this.input5 = document.getElementById('input5');
        this.currentPriceEl = document.getElementById('currentPrice');
        this.lastUpdateEl = document.getElementById('lastUpdate');
        this.statusEl = document.getElementById('status');
        this.dataTableBody = document.getElementById('dataTableBody');
        this.countTableBody = document.getElementById('countTableBody');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.testBtn = document.getElementById('testBtn');
        this.openPageBtn = document.getElementById('openPageBtn');
        this.startTime = document.getElementById('startTime');
        this.endTime = document.getElementById('endTime');
        this.countStartTime = document.getElementById('countStartTime');
        this.countEndTime = document.getElementById('countEndTime');
    }
    
    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.testBtn.addEventListener('click', () => this.test());
        this.openPageBtn.addEventListener('click', () => this.openTargetPage());
        
        // Export buttons for data
        document.getElementById('exportCsvBtn').addEventListener('click', () => this.exportData('csv'));
        document.getElementById('exportExcelBtn').addEventListener('click', () => this.exportData('excel'));
        document.getElementById('clearDataBtn').addEventListener('click', () => this.clearData());
        
        // Export buttons for count table
        document.getElementById('exportCountCsvBtn').addEventListener('click', () => this.exportCountData('csv'));
        document.getElementById('exportCountExcelBtn').addEventListener('click', () => this.exportCountData('excel'));
        document.getElementById('refreshCountBtn').addEventListener('click', () => this.updateCountTable());
        
        // Auto-save inputs
        [this.input1, this.input2, this.input3, this.input4, this.input5].forEach(input => {
            input.addEventListener('input', () => this.saveInputs());
        });
        
        // Auto-refresh count table when date changes
        this.countStartTime.addEventListener('change', () => this.updateCountTable());
        this.countEndTime.addEventListener('change', () => this.updateCountTable());
    }
    
    async loadStoredData() {
        try {
            const result = await chrome.storage.local.get([
                'isRunning', 'currentPrice', 'dataRecords', 'input1', 'input2', 'input3', 'input4', 'input5'
            ]);
            
            this.isRunning = result.isRunning || false;
            this.currentPrice = result.currentPrice || 0;
            this.dataRecords = result.dataRecords || [];
            
            this.input1.value = result.input1 || '';
            this.input2.value = result.input2 || '';
            this.input3.value = result.input3 || '';
            this.input4.value = result.input4 || '';
            this.input5.value = result.input5 || '';
            
            this.updatePriceDisplay();
            this.updateDataTable();
            this.updateCountTable();
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
        
        // Auto-update profit calculations every minute
        setInterval(async () => {
            await this.updateProfitCalculations();
        }, 60000); // Update every 60 seconds
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
                this.updateCountTable(); // Update count table when data changes
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
    
    async updateProfitCalculations() {
        try {
            // Lấy dữ liệu hiện tại
            const result = await chrome.storage.local.get(['dataRecords', 'input4', 'input5']);
            const dataRecords = result.dataRecords || [];
            const input4 = parseFloat(result.input4) || 0;
            const input5 = result.input5 || '';
            
            if (!input5 || input4 === 0) {
                return;
            }
            
            // Cập nhật tất cả các bản ghi với công thức mới
            let hasChanges = false;
            const updatedRecords = dataRecords.map(record => {
                const oldProfitAmount = record.profit_amount;
                
                // Tính lại lợi nhuận với công thức mới
                const startTime = new Date(input5);
                const recordTime = new Date(record.timestamp);
                const timeDiffMinutes = Math.floor((recordTime - startTime) / (1000 * 60)); // Chỉ tính phút nguyên
                const newProfitAmount = 4 * input4 * timeDiffMinutes * (record.cal / 100);
                
                if (Math.abs(oldProfitAmount - newProfitAmount) > 0.01) {
                    hasChanges = true;
                }
                
                return {
                    ...record,
                    profit_amount: newProfitAmount
                };
            });
            
            // Lưu lại dữ liệu đã cập nhật
            if (hasChanges) {
                await chrome.storage.local.set({ dataRecords: updatedRecords });
                this.dataRecords = updatedRecords;
                this.updateDataTable();
                this.updateCountTable();
            }
            
        } catch (error) {
            console.error('Error updating profit calculations:', error);
        }
    }
    
    async saveInputs() {
        try {
            await chrome.storage.local.set({
                input1: this.input1.value,
                input2: this.input2.value,
                input3: this.input3.value,
                input4: this.input4.value,
                input5: this.input5.value
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
    
    calculateTotalProfit() {
        // Tính tổng lợi nhuận từ tất cả các bản ghi
        return this.dataRecords.reduce((total, record) => {
            return total + (parseFloat(record.profit_amount) || 0);
        }, 0);
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
                <td>${parseFloat(record.input4 || 0).toFixed(2)}</td>
                <td>${record.input5 ? new Date(record.input5).toLocaleString('vi-VN') : 'N/A'}</td>
                <td>${parseFloat(record.profit || 0).toFixed(2)}</td>
                <td class="${record.cal >= 0 ? 'positive' : 'negative'}">${parseFloat(record.cal || 0).toFixed(2)}%</td>
                <td class="${record.difference >= 0 ? 'positive' : 'negative'}">${record.difference || 0}</td>
                <td class="${record.profit_amount >= 0 ? 'positive' : 'negative'}">${parseFloat(record.profit_amount || 0).toFixed(2)}</td>
                <td>${record.time}</td>
            `;
            this.dataTableBody.appendChild(row);
        });
    }
    
    updateCountTable() {
        // Get filtered records based on date range
        const filteredRecords = this.getFilteredRecordsForCount();
        
        // Count occurrences of each difference
        const countMap = {};
        this.defaultDifferences.forEach(diff => {
            countMap[diff] = 0;
        });
        
        filteredRecords.forEach(record => {
            const diff = record.difference;
            if (countMap.hasOwnProperty(diff)) {
                countMap[diff]++;
            }
        });
        
        const totalRecords = filteredRecords.length;
        
        // Update table
        this.countTableBody.innerHTML = '';
        
        this.defaultDifferences.forEach(diff => {
            const count = countMap[diff];
            
            // Tính tổng lợi nhuận cho từng chênh lệch
            const recordsWithDiff = filteredRecords.filter(record => record.difference === diff);
            const totalProfitForDiff = recordsWithDiff.reduce((total, record) => {
                return total + (parseFloat(record.profit_amount) || 0);
            }, 0);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="${diff >= 0 ? 'positive' : 'negative'}">${diff}</td>
                <td>${count}</td>
                <td class="${totalProfitForDiff >= 0 ? 'positive' : 'negative'}">${totalProfitForDiff.toFixed(2)}</td>
            `;
            this.countTableBody.appendChild(row);
        });
    }
    
    getFilteredRecordsForCount() {
        const startTime = this.countStartTime.value;
        const endTime = this.countEndTime.value;
        
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
        
        return filteredRecords;
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
    
    async exportCountData(format) {
        const filteredRecords = this.getFilteredRecordsForCount();
        
        if (filteredRecords.length === 0) {
            alert('Không có dữ liệu để xuất bảng đếm');
            return;
        }
        
        // Count occurrences of each difference
        const countMap = {};
        this.defaultDifferences.forEach(diff => {
            countMap[diff] = 0;
        });
        
        filteredRecords.forEach(record => {
            const diff = record.difference;
            if (countMap.hasOwnProperty(diff)) {
                countMap[diff]++;
            }
        });
        
        const totalRecords = filteredRecords.length;
        const countData = this.defaultDifferences.map(diff => {
            const recordsWithDiff = filteredRecords.filter(record => record.difference === diff);
            const totalProfitForDiff = recordsWithDiff.reduce((total, record) => {
                return total + (parseFloat(record.profit_amount) || 0);
            }, 0);
            
            return {
                difference: diff,
                count: countMap[diff],
                totalProfit: totalProfitForDiff.toFixed(2)
            };
        });
        
        if (format === 'csv') {
            this.exportCountToCsv(countData);
        } else if (format === 'excel') {
            this.exportCountToExcel(countData);
        }
        
        const dateRange = this.getDateRangeString();
        alert(`✅ Đã xuất bảng đếm (${totalRecords} bản ghi${dateRange}) ra file ${format.toUpperCase()}`);
    }
    
    getDateRangeString() {
        const startTime = this.countStartTime.value;
        const endTime = this.countEndTime.value;
        
        if (startTime && endTime) {
            return ` từ ${startTime} đến ${endTime}`;
        } else if (startTime) {
            return ` từ ${startTime}`;
        } else if (endTime) {
            return ` đến ${endTime}`;
        }
        return '';
    }
    
    exportToCsv(records) {
        const headers = ['Input 1', 'Input 2', 'Input 3', 'Input 4', 'Input 5', 'Profit', 'Cal (%)', 'Chênh lệch', 'Lợi nhuận', 'Timestamp', 'Time'];
        const csvContent = [
            headers.join(','),
            ...records.map(record => [
                parseFloat(record.input1 || 0),
                parseFloat(record.input2 || 0),
                parseFloat(record.input3 || 0),
                parseFloat(record.input4 || 0),
                record.input5 || 'N/A',
                parseFloat(record.profit || 0).toFixed(0),
                parseFloat(record.cal || 0).toFixed(2),
                record.difference || 0,
                parseFloat(record.profit_amount || 0).toFixed(2),
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
                    <th>Input 4</th>
                    <th>Input 5</th>
                    <th>Profit</th>
                    <th>Cal (%)</th>
                    <th>Chênh lệch</th>
                    <th>Lợi nhuận</th>
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
                    <td>${parseFloat(record.input4 || 0).toFixed(2)}</td>
                    <td>${record.input5 || 'N/A'}</td>
                    <td>${parseFloat(record.profit || 0).toFixed(2)}</td>
                    <td>${parseFloat(record.cal || 0).toFixed(2)}</td>
                    <td>${record.difference || 0}</td>
                    <td>${parseFloat(record.profit_amount || 0).toFixed(2)}</td>
                    <td>${record.timestamp}</td>
                    <td>${record.time}</td>
                </tr>
            `;
        });
        
        excelContent += '</table>';

        const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        this.downloadFile(blob, `dogecoin_profit_${this.getDateString()}.xls`);
    }
    
    exportCountToCsv(countData) {
        const headers = ['Chênh lệch', 'Số lượng', 'Tổng lợi nhuận'];
        const csvContent = [
            headers.join(','),
            ...countData.map(item => [
                item.difference,
                item.count,
                item.totalProfit
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        this.downloadFile(blob, `dogecoin_count_${this.getDateString()}.csv`);
    }
    
    exportCountToExcel(countData) {
        let excelContent = `
            <table>
                <tr>
                    <th>Chênh lệch</th>
                    <th>Số lượng</th>
                    <th>Tổng lợi nhuận</th>
                </tr>
        `;

        countData.forEach(item => {
            excelContent += `
                <tr>
                    <td>${item.difference}</td>
                    <td>${item.count}</td>
                    <td>${item.totalProfit}</td>
                </tr>
            `;
        });
        
        excelContent += '</table>';

        const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        this.downloadFile(blob, `dogecoin_count_${this.getDateString()}.xls`);
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
            this.updateCountTable();
            this.updatePriceDisplay();
            alert('✅ Đã xóa toàn bộ dữ liệu thành công');
        }
    }
}

// Initialize the calculator when popup loads
document.addEventListener('DOMContentLoaded', () => {
    new DogecoinCalculator();
});
