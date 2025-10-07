# 🐕 Dogecoin Profit Calculator Extension

Chrome extension để tính toán profit từ giá Dogecoin tự động với giao diện đẹp và tính năng xuất dữ liệu.

## ✨ Tính năng

- **Tự động lấy giá**: Lấy giá từ element `id="b-price"` mỗi 60 giây
- **Tính toán profit**: Profit = giá * 100,000,000
- **Công thức tính Cal**: `((((profit * input1 + input2) / input3) - 0.04) - 1) * 100`
- **Giao diện đẹp**: UI hiện đại với gradient và animation
- **Lưu trữ dữ liệu**: Tự động lưu tất cả records
- **Xuất CSV**: Xuất dữ liệu theo khoảng thời gian
- **Điều khiển**: Start/Stop/Test với status indicator
- **Background service**: Chạy ngầm với tab cụ thể

## 🚀 Cài đặt

### Bước 1: Tải extension
1. Tải tất cả files vào một thư mục
2. Đảm bảo có đầy đủ các files:
   - `manifest.json`
   - `popup.html`
   - `popup.js`
   - `background.js`
   - `content.js`
   - `icon16.png`, `icon48.png`, `icon128.png`

### Bước 2: Load extension vào Chrome
1. Mở Chrome và vào `chrome://extensions/`
2. Bật "Developer mode" ở góc trên bên phải
3. Click "Load unpacked"
4. Chọn thư mục chứa extension
5. Extension sẽ xuất hiện trong danh sách

### Bước 3: Pin extension
1. Click vào icon puzzle piece ở thanh toolbar
2. Tìm "Dogecoin Profit Calculator" và click pin icon
3. Extension sẽ xuất hiện trên thanh toolbar

## 📖 Hướng dẫn sử dụng

### 1. Mở trang target
- Mở tab với URL: `https://www.mining-dutch.nl/pools/dogecoin.php?page=dashboard#`
- Extension chỉ hoạt động trên trang này

### 2. Cấu hình inputs
- **Input 1**: Giá trị đầu vào 1
- **Input 2**: Giá trị đầu vào 2  
- **Input 3**: Giá trị đầu vào 3
- Các giá trị này sẽ được lưu tự động

### 3. Điều khiển extension
- **Start**: Bắt đầu monitoring giá và thu thập dữ liệu
- **Stop**: Dừng tất cả hoạt động
- **Test**: Kiểm tra kết nối và lấy giá hiện tại
- **Open Target Page**: Mở trang target trong tab mới
- **Status**: Hiển thị trạng thái Running/Stopped

### 4. Xem dữ liệu
- Bảng hiển thị 10 records gần nhất
- Cột: Input 1, Input 2, Input 3, Profit, Cal (%), Time
- Dữ liệu được cập nhật mỗi 1 phút

### 5. Xuất dữ liệu
- Chọn thời gian bắt đầu và kết thúc
- Click "Export CSV" để tải file
- File sẽ có tên: `dogecoin_data_YYYY-MM-DD.csv`

## 🔧 Cấu trúc dự án

```
dog-extension2/
├── manifest.json          # Manifest file
├── popup.html            # UI popup
├── popup.js              # Popup logic
├── background.js         # Background service
├── content.js            # Content script
├── icon16.png           # Icon 16x16
├── icon48.png           # Icon 48x48
├── icon128.png          # Icon 128x128
└── README.md            # Hướng dẫn này
```

## 🎯 Công thức tính toán

```
profit = giá_từ_b_price * 100,000,000
cal = ((((profit * input1 + input2) / input3) - 0.04) - 1) * 100
```

## 🔍 Troubleshooting

### Extension không hoạt động
1. Kiểm tra URL có đúng không
2. Kiểm tra element `id="b-price"` có tồn tại không
3. Dùng nút "Test" để kiểm tra kết nối

### Không lấy được giá
1. Đảm bảo trang đã load hoàn toàn
2. Kiểm tra console để xem lỗi
3. Refresh trang và thử lại

### Dữ liệu không lưu
1. Kiểm tra quyền storage của extension
2. Xóa cache và thử lại
3. Restart extension

## 📝 Lưu ý

- Extension chỉ hoạt động trên URL cụ thể
- Dữ liệu được lưu trong Chrome storage
- Cần mở tab target để extension hoạt động
- Background service chạy liên tục khi extension được bật

## 🆘 Hỗ trợ

Nếu gặp vấn đề, hãy:
1. Kiểm tra console log
2. Restart extension
3. Kiểm tra quyền của extension
4. Đảm bảo URL target đúng
