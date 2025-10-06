class PriceMonitorExtension {
  constructor() {
    this.init();
  }

  async init() {
    await this.loadSavedInputs();
    this.setupEventListeners();
    this.updateDisplay();
    this.startMonitoring();
  }

  async loadSavedInputs() {
    const result = await chrome.storage.local.get(['input1', 'input2', 'input3']);
    if (result.input1 !== undefined) document.getElementById('input1').value = result.input1;
    if (result.input2 !== undefined) document.getElementById('input2').value = result.input2;
    if (result.input3 !== undefined) document.getElementById('input3').value = result.input3;
  }

  setupEventListeners() {
    document.getElementById('saveInputs').addEventListener('click', () => this.saveInputs());
    document.getElementById('exportCsv').addEventListener('click', () => this.exportData('csv'));
    document.getElementById('exportExcel').addEventListener('click', () => this.exportData('excel'));
    document.getElementById('clearData').addEventListener('click', () => this.clearData());
  }

  async saveInputs() {
    const input1 = parseFloat(document.getElementById('input1').value) || 0;
    const input2 = parseFloat(document.getElementById('input2').value) || 0;
    const input3 = parseFloat(document.getElementById('input3').value) || 1;

    await chrome.storage.local.set({ input1, input2, input3 });
    this.updateStatus('Đã lưu tham số');
  }

  async getCurrentPrice() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          const element = document.getElementById('b-price');
          return element ? element.textContent.trim() : null;
        }
      });

      return results[0]?.result;
    } catch (error) {
      console.error('Error getting price:', error);
      return null;
    }
  }

  calculateProfit(currentPrice, input1, input2, input3) {
    // Profit calculation logic - có thể tùy chỉnh theo yêu cầu
    const profit = currentPrice || 0;
    return profit * 100000000;
  }

  calculateCal(profit, input1, input2, input3) {
    if (input3 === 0) return 0;
    return ((((profit * input1 + input2) / input3) - 0.04) - 1) * 100;
  }

  async saveRecord(input1, input2, input3, profit, cal) {
    const now = new Date();
    const record = {
      input1,
      input2,
      input3,
      profit,
      cal,
      timestamp: now.toISOString(),
      time: now.toLocaleString()
    };

    const result = await chrome.storage.local.get(['records']);
    const records = result.records || [];
    records.unshift(record); // Thêm vào đầu mảng

    // Giới hạn số lượng records (có thể tùy chỉnh)
    if (records.length > 1000) {
      records.splice(1000);
    }

    await chrome.storage.local.set({ records });
    await chrome.storage.local.set({ lastPrice: profit, lastUpdate: now.toLocaleString() });
  }

  async updateDisplay() {
    // Update current price and last update time
    const result = await chrome.storage.local.get(['lastPrice', 'lastUpdate']);
    document.getElementById('currentPrice').textContent = result.lastPrice || '--';
    document.getElementById('lastUpdate').textContent = result.lastUpdate || '--';

    // Update table
    await this.updateTable();
  }

  async updateTable() {
    const result = await chrome.storage.local.get(['records']);
    const records = result.records || [];
    const tbody = document.getElementById('tableBody');
    
    tbody.innerHTML = '';
    
    // Hiển thị 10 bản ghi gần nhất
    const displayRecords = records;
    
    displayRecords.forEach(record => {
      const row = tbody.insertRow();
      row.insertCell(0).textContent = record.input1.toFixed(2);
      row.insertCell(1).textContent = record.input2.toFixed(2);
      row.insertCell(2).textContent = record.input3.toFixed(2);
      row.insertCell(3).textContent = record.profit.toFixed(2);
      row.insertCell(4).textContent = record.cal.toFixed(2);
      row.insertCell(5).textContent = record.time;
    });
  }

  async monitorPrice() {
    try {
      const currentPrice = await this.getCurrentPrice();
      
      if (currentPrice !== null) {
        const result = await chrome.storage.local.get(['input1', 'input2', 'input3']);
        const input1 = result.input1 || 0;
        const input2 = result.input2 || 0;
        const input3 = result.input3 || 1;

        const profit = this.calculateProfit(parseFloat(currentPrice), input1, input2, input3);
        const cal = this.calculateCal(profit, input1, input2, input3);

        await this.saveRecord(input1, input2, input3, profit, cal);
        await this.updateDisplay();
        
        this.updateStatus(`Đã cập nhật giá: ${currentPrice}`);
      } else {
        this.updateStatus('Không tìm thấy element #b-price trên trang hiện tại');
      }
    } catch (error) {
      console.error('Monitor error:', error);
      this.updateStatus('Lỗi khi lấy giá');
    }
  }

  startMonitoring() {
    // Lấy giá ngay lập tức
    this.monitorPrice();
    
    // Thiết lập interval 1 phút
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
    
    this.monitorInterval = setInterval(() => {
      this.monitorPrice();
    }, 60000); // 60000ms = 1 phút
  }

  updateStatus(message) {
    document.getElementById('status').textContent = message;
  }

  async exportData(format) {
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;

    const result = await chrome.storage.local.get(['records']);
    let records = result.records || [];

    // Filter by date range if specified
    if (fromDate || toDate) {
      records = records.filter(record => {
        const recordDate = new Date(record.timestamp);
        const from = fromDate ? new Date(fromDate) : new Date('1900-01-01');
        const to = toDate ? new Date(toDate) : new Date('2100-12-31');
        return recordDate >= from && recordDate <= to;
      });
    }

    if (records.length === 0) {
      alert('Không có dữ liệu để xuất');
      return;
    }

    if (format === 'csv') {
      this.exportToCsv(records);
    } else if (format === 'excel') {
      this.exportToExcel(records);
    }
  }

  exportToCsv(records) {
    const headers = ['Input1', 'Input2', 'Input3', 'Profit', 'Cal', 'Time'];
    const csvContent = [
      headers.join(','),
      ...records.map(record => [
        record.input1,
        record.input2,
        record.input3,
        record.profit,
        record.cal,
        `"${record.time}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `price_monitor_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  exportToExcel(records) {
    // Simple Excel export (HTML table format)
    const headers = ['Input1', 'Input2', 'Input3', 'Profit', 'Cal', 'Time'];
    let excelContent = '<table><tr>';
    headers.forEach(header => {
      excelContent += `<th>${header}</th>`;
    });
    excelContent += '</tr>';

    records.forEach(record => {
      excelContent += '<tr>';
      excelContent += `<td>${record.input1}</td>`;
      excelContent += `<td>${record.input2}</td>`;
      excelContent += `<td>${record.input3}</td>`;
      excelContent += `<td>${record.profit}</td>`;
      excelContent += `<td>${record.cal}</td>`;
      excelContent += `<td>${record.time}</td>`;
      excelContent += '</tr>';
    });
    excelContent += '</table>';

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `price_monitor_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
  }

  async clearData() {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu?')) {
      await chrome.storage.local.remove(['records', 'lastPrice', 'lastUpdate']);
      await this.updateDisplay();
      this.updateStatus('Đã xóa toàn bộ dữ liệu');
    }
  }
}

// Initialize extension when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PriceMonitorExtension();
});