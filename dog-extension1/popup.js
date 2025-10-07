class DogecoinExtension {
  constructor() {
    this.isRunning = false;
    this.init();
  }

  async init() {
    await this.loadSavedInputs();
    await this.loadStatus();
    this.setupEventListeners();
    this.updateDisplay();
    this.checkTabStatus();
    
    // Check if background script is ready
    await this.checkBackgroundScript();
    
    // Auto refresh every 5 seconds
    setInterval(() => {
      this.updateDisplay();
      this.updateStatus();
    }, 5000);
  }

  async sendMessageWithTimeout(message, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Timeout: Background script không phản hồi'));
      }, timeout);

      chrome.runtime.sendMessage(message, (response) => {
        clearTimeout(timer);
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  async checkBackgroundScript() {
    try {
      const response = await this.sendMessageWithTimeout({ action: 'getStatus' });
      if (response && response.success) {
        console.log('Background script is ready');
      } else {
        console.warn('Background script not responding properly');
      }
    } catch (error) {
      console.error('Background script error:', error);
      this.showMessage('⚠️ Extension đang khởi động, vui lòng chờ...', 'error');
    }
  }

  async loadSavedInputs() {
    const result = await chrome.storage.local.get(['input1', 'input2', 'input3']);
    if (result.input1 !== undefined) document.getElementById('input1').value = result.input1;
    if (result.input2 !== undefined) document.getElementById('input2').value = result.input2;
    if (result.input3 !== undefined) document.getElementById('input3').value = result.input3;
  }

  async loadStatus() {
    const result = await chrome.storage.local.get(['monitorStatus']);
    this.isRunning = result.monitorStatus === 'running';
    this.updateControlButtons();
  }

  setupEventListeners() {
    document.getElementById('saveInputs').addEventListener('click', () => this.saveInputs());
    document.getElementById('exportCsv').addEventListener('click', () => this.exportData('csv'));
    document.getElementById('exportExcel').addEventListener('click', () => this.exportData('excel'));
    document.getElementById('clearData').addEventListener('click', () => this.clearData());
    
    // Control buttons
    document.getElementById('startBtn').addEventListener('click', () => this.startMonitoring());
    document.getElementById('stopBtn').addEventListener('click', () => this.stopMonitoring());
    document.getElementById('testBtn').addEventListener('click', () => this.testConnection());
  }

  async startMonitoring() {
    try {
      const response = await this.sendMessageWithTimeout({ action: 'start' });
      if (response && response.success) {
        this.isRunning = true;
        this.updateControlButtons();
        this.showMessage('✅ Đã bắt đầu theo dõi!', 'success');
      } else {
        this.showMessage('❌ Không thể bắt đầu theo dõi', 'error');
      }
    } catch (error) {
      this.showMessage('❌ Lỗi khi bắt đầu: ' + error.message, 'error');
    }
  }

  async stopMonitoring() {
    try {
      const response = await this.sendMessageWithTimeout({ action: 'stop' });
      if (response && response.success) {
        this.isRunning = false;
        this.updateControlButtons();
        this.showMessage('✅ Đã dừng theo dõi!', 'success');
      } else {
        this.showMessage('❌ Không thể dừng theo dõi', 'error');
      }
    } catch (error) {
      this.showMessage('❌ Lỗi khi dừng: ' + error.message, 'error');
    }
  }

  async testConnection() {
    const testBtn = document.getElementById('testBtn');
    const testResult = document.getElementById('testResult');
    
    testBtn.disabled = true;
    testBtn.textContent = '🔄 Đang test...';
    
    try {
      const response = await this.sendMessageWithTimeout({ action: 'test' });
      if (response && response.success && response.testResult) {
        const result = response.testResult;
        
        testResult.className = 'test-result ' + (result.success ? 'test-success' : 'test-error');
        testResult.innerHTML = `
          <strong>${result.success ? '✅' : '❌'} ${result.message}</strong><br>
          ${result.price ? `Giá hiện tại: ${result.price}` : ''}
          ${result.url ? `<br>URL: ${result.url}` : ''}
        `;
        testResult.style.display = 'block';
      } else {
        testResult.className = 'test-result test-error';
        testResult.innerHTML = '<strong>❌ Không thể kết nối với background script</strong>';
        testResult.style.display = 'block';
      }
    } catch (error) {
      testResult.className = 'test-result test-error';
      testResult.innerHTML = `<strong>❌ Lỗi: ${error.message}</strong>`;
      testResult.style.display = 'block';
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = '🔍 Test kết nối';
      
      // Hide test result after 10 seconds
      setTimeout(() => {
        testResult.style.display = 'none';
      }, 10000);
    }
  }

  updateControlButtons() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    if (this.isRunning) {
      startBtn.disabled = true;
      stopBtn.disabled = false;
      startBtn.style.opacity = '0.6';
      stopBtn.style.opacity = '1';
    } else {
      startBtn.disabled = false;
      stopBtn.disabled = true;
      startBtn.style.opacity = '1';
      stopBtn.style.opacity = '0.6';
    }
  }

  showMessage(message, type) {
    const statusElement = document.getElementById('status');
    const originalText = statusElement.textContent;
    
    statusElement.textContent = message;
    statusElement.className = type === 'success' ? 'status-running' : 'status-stopped';
    
    setTimeout(() => {
      this.updateStatus();
    }, 3000);
  }

  async saveInputs() {
    const input1 = parseFloat(document.getElementById('input1').value) || 0;
    const input2 = parseFloat(document.getElementById('input2').value) || 0;
    const input3 = parseFloat(document.getElementById('input3').value) || 1;

    await chrome.storage.local.set({ input1, input2, input3 });
    this.showMessage('✅ Đã lưu tham số thành công!', 'success');
    
    // Update existing records with new calculation
    await this.recalculateRecords();
  }

  async recalculateRecords() {
    const result = await chrome.storage.local.get(['records', 'input1', 'input2', 'input3']);
    const records = result.records || [];
    const input1 = result.input1 || 0;
    const input2 = result.input2 || 0;
    const input3 = result.input3 || 1;

    records.forEach(record => {
      record.input1 = input1;
      record.input2 = input2;
      record.input3 = input3;
      record.cal = ((((record.profit * input1 + input2) / input3) - 0.04) - 1) * 100;
    });

    await chrome.storage.local.set({ records });
    this.updateDisplay();
  }

  async checkTabStatus() {
    try {
      const tabs = await chrome.tabs.query({
        url: "https://www.mining-dutch.nl/pools/dogecoin.php*"
      });

      if (tabs.length === 0) {
        // Don't override status if monitoring is running
        if (!this.isRunning) {
          document.getElementById('status').textContent = '⚠️ Cần mở tab: https://www.mining-dutch.nl/pools/dogecoin.php?page=dashboard#';
          document.getElementById('status').className = 'status-stopped';
        }
        
        // Add button to open the required tab
        const statusElement = document.getElementById('status');
        if (!document.getElementById('openTabBtn')) {
          const button = document.createElement('button');
          button.id = 'openTabBtn';
          button.textContent = '🔗 Mở trang cần thiết';
          button.onclick = () => {
            chrome.tabs.create({
              url: 'https://www.mining-dutch.nl/pools/dogecoin.php?page=dashboard#'
            });
          };
          statusElement.parentNode.appendChild(button);
        }
      } else {
        const openTabBtn = document.getElementById('openTabBtn');
        if (openTabBtn) {
          openTabBtn.remove();
        }
      }
    } catch (error) {
      console.error('Error checking tab status:', error);
    }
  }

  async updateDisplay() {
    const result = await chrome.storage.local.get(['lastPrice', 'lastUpdate', 'records']);
    
    // Update price display
    const rawPrice = result.lastPrice ? (result.lastPrice / 100000000).toFixed(8) : '--';
    const profitValue = result.lastPrice ? result.lastPrice.toFixed(0) : '--';
    
    document.getElementById('currentPrice').textContent = rawPrice;
    document.getElementById('profitValue').textContent = profitValue;
    document.getElementById('lastUpdate').textContent = result.lastUpdate || '--';

    // Update table
    await this.updateTable();
  }

  async updateTable() {
    const result = await chrome.storage.local.get(['records']);
    const records = result.records || [];
    const tbody = document.getElementById('tableBody');
    
    tbody.innerHTML = '';
    
    // Display latest 50 records
    const displayRecords = records.slice(0, 50);
    
    displayRecords.forEach((record, index) => {
      const row = tbody.insertRow();
      
      // Add row class for styling
      if (index === 0) row.classList.add('latest-record');
      
      row.insertCell(0).textContent = record.input1.toFixed(6);
      row.insertCell(1).textContent = record.input2.toFixed(6);
      row.insertCell(2).textContent = record.input3.toFixed(6);
      
      const profitCell = row.insertCell(3);
      profitCell.textContent = record.profit.toFixed(0);
      
      const calCell = row.insertCell(4);
      calCell.textContent = record.cal.toFixed(2);
      calCell.className = record.cal >= 0 ? 'positive' : 'negative';
      
      row.insertCell(5).textContent = record.time;
    });
  }

  async updateStatus() {
    const result = await chrome.storage.local.get(['monitorStatus', 'statusUpdate', 'lastError', 'lastErrorTime']);
    const statusElement = document.getElementById('status');
    const errorElement = document.getElementById('errorMessage');
    
    this.isRunning = result.monitorStatus === 'running';
    this.updateControlButtons();
    
    if (this.isRunning) {
      statusElement.textContent = '✅ Đang chạy - Cập nhật: ' + (result.statusUpdate || '--');
      statusElement.className = 'status-running';
    } else {
      statusElement.textContent = '⛔ Đã dừng - Cập nhật: ' + (result.statusUpdate || '--');
      statusElement.className = 'status-stopped';
    }
    
    // Show error if exists
    if (result.lastError) {
      errorElement.textContent = `Lỗi: ${result.lastError} (${result.lastErrorTime})`;
      errorElement.style.display = 'block';
    } else {
      errorElement.style.display = 'none';
    }
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
      alert('❌ Không có dữ liệu để xuất trong khoảng thời gian đã chọn');
      return;
    }

    if (format === 'csv') {
      this.exportToCsv(records);
    } else if (format === 'excel') {
      this.exportToExcel(records);
    }

    this.showMessage(`✅ Đã xuất ${records.length} bản ghi ra file ${format.toUpperCase()}`, 'success');
  }

  exportToCsv(records) {
    const headers = ['Input1', 'Input2', 'Input3', 'Profit', 'Cal', 'Timestamp', 'Time'];
    const csvContent = [
      headers.join(','),
      ...records.map(record => [
        record.input1,
        record.input2,
        record.input3,
        record.profit,
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
          <th>Input1</th>
          <th>Input2</th>
          <th>Input3</th>
          <th>Profit</th>
          <th>Cal</th>
          <th>Timestamp</th>
          <th>Time</th>
        </tr>
    `;

    records.forEach(record => {
      excelContent += `
        <tr>
          <td>${record.input1}</td>
          <td>${record.input2}</td>
          <td>${record.input3}</td>
          <td>${record.profit}</td>
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
      await chrome.storage.local.remove(['records', 'lastPrice', 'lastUpdate']);
      await this.updateDisplay();
      this.showMessage('✅ Đã xóa toàn bộ dữ liệu thành công', 'success');
    }
  }
}

// Initialize extension when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new DogecoinExtension();
});