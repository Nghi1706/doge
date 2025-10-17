# 📋 Dogecoin Mining Tracker - Changelog

## 🚀 Phiên bản mới - Các cải tiến được implement

### ✅ 1. Tránh lưu trùng lặp trong cùng phút
- **Mô tả**: Hệ thống sẽ kiểm tra xem trong phút hiện tại đã có dữ liệu chưa
- **Logic**: So sánh timestamp theo định dạng YYYY-MM-DD HH:MM
- **Kết quả**: Tránh spam dữ liệu, đảm bảo mỗi phút chỉ có 1 record

```javascript
const currentMinute = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
```

### ✅ 2. Thêm cột "Chênh lệch" 
- **Công thức**: `(profit - input3) / 10`
- **Giá trị mặc định**: `[-45, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60]`
- **Logic**: Tìm giá trị gần nhất trong mảng mặc định
- **Hiển thị**: Màu xanh cho giá trị dương, đỏ cho giá trị âm

### ✅ 3. Thêm Input 4 và cột "Lợi nhuận"
- **Input 4**: Trường nhập vốn (capital)
- **Công thức lợi nhuận**: `input4 * (cal / 100)`
- **Hiển thị**: Tính toán lợi nhuận thực tế dựa trên % cal và số vốn

### ✅ 4. Đóng/mở tab mỗi 30 phút
- **Mục đích**: Tránh lag website, refresh hoàn toàn trang
- **Logic**: 
  - Đóng tab hiện tại 
  - Đợi 2 giây
  - Mở tab mới với cùng URL
  - Đợi 5 giây để trang load
  - Tiếp tục crawl dữ liệu
- **Alarm**: Sử dụng `chrome.alarms` để thực hiện định kỳ

## 🔧 Các thay đổi kỹ thuật

### Background.js
1. Thêm alarm `pageReopen` (30 phút)
2. Thêm method `reopenTargetPage()`
3. Cập nhật `collectData()` với logic kiểm tra trùng lặp
4. Thêm support cho input4, difference, profit_amount

### Popup.html
1. Mở rộng width từ 600px → 800px
2. Thêm input4 trong form
3. Thêm 2 cột mới trong table
4. Cải thiện CSS cho responsive table

### Popup.js
1. Thêm support cho input4 trong tất cả methods
2. Cập nhật `updateDataTable()` với 2 cột mới
3. Cập nhật export CSV/Excel với đầy đủ cột
4. Thêm color coding cho difference và profit_amount

## 📊 Cấu trúc dữ liệu mới

```javascript
const record = {
    input1: number,
    input2: number, 
    input3: number,
    input4: number,        // ✅ MỚI
    profit: number,
    cal: number,
    difference: number,    // ✅ MỚI  
    profit_amount: number, // ✅ MỚI
    timestamp: string,
    time: string
};
```

## 🎯 Lợi ích

1. **Hiệu suất cao**: Không lưu trùng lặp, tự động refresh tab
2. **Thông tin đầy đủ**: Thêm thông tin chênh lệch và lợi nhuận thực tế
3. **Tự động hóa**: Đóng/mở tab tự động để duy trì hiệu suất
4. **UI thân thiện**: Màu sắc phân biệt rõ ràng, responsive design

## 🚀 Cách sử dụng

1. Nhập đầy đủ Input 1, 2, 3, 4
2. Click "Start" để bắt đầu monitor
3. Hệ thống sẽ tự động:
   - Crawl dữ liệu mỗi phút
   - Tránh lưu trùng lặp
   - Đóng/mở tab mỗi 30 phút
   - Tính toán chênh lệch và lợi nhuận

## ⚠️ Lưu ý

- Input 1 và Input 3 phải khác 0
- Input 4 dùng để tính lợi nhuận thực tế
- Tab sẽ được đóng/mở tự động, không làm gián đoạn việc sử dụng
