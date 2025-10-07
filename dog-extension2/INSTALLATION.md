# 🚀 Hướng dẫn cài đặt Extension

## Bước 1: Chuẩn bị files

Đảm bảo bạn có đầy đủ các files sau:

```
dog-extension2/
├── manifest.json
├── popup.html
├── popup.js
├── background.js
├── content.js
├── icon16.png
├── icon48.png
├── icon128.png
├── README.md
└── create_icons.html
```

## Bước 2: Tạo icons

1. Mở file `create_icons.html` trong trình duyệt
2. Click vào từng canvas để tải icon
3. Lưu các file icon vào thư mục extension:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels) 
   - `icon128.png` (128x128 pixels)

## Bước 3: Load extension vào Chrome

### 3.1. Mở Chrome Extensions
- Mở Chrome
- Vào `chrome://extensions/`
- Hoặc: Menu → More tools → Extensions

### 3.2. Bật Developer Mode
- Tìm toggle "Developer mode" ở góc trên bên phải
- Bật nó lên (màu xanh)

### 3.3. Load Extension
- Click nút "Load unpacked"
- Chọn thư mục `dog-extension2`
- Click "Select Folder"

### 3.3. Kiểm tra Extension
- Extension sẽ xuất hiện trong danh sách
- Icon 🐕 sẽ hiện trên thanh toolbar
- Status: "Enabled"

## Bước 4: Pin Extension

1. Click vào icon puzzle piece (🧩) trên thanh toolbar
2. Tìm "Dogecoin Profit Calculator"
3. Click vào icon pin (📌) để pin extension
4. Extension sẽ xuất hiện trực tiếp trên toolbar

## Bước 5: Test Extension

### 5.1. Mở trang target
- Mở tab mới
- Vào URL: `https://www.mining-dutch.nl/pools/dogecoin.php?page=dashboard#`
- Đợi trang load hoàn toàn

### 5.2. Test extension
- Click vào icon extension trên toolbar
- Popup sẽ mở ra
- Click nút "Test" để kiểm tra kết nối
- Nếu thành công, sẽ hiển thị giá hiện tại

## Bước 6: Cấu hình và sử dụng

### 6.1. Nhập dữ liệu
- **Input 1**: Nhập giá trị đầu vào 1
- **Input 2**: Nhập giá trị đầu vào 2
- **Input 3**: Nhập giá trị đầu vào 3

### 6.2. Bắt đầu monitoring
- Click nút "Start"
- Status sẽ chuyển thành "Running"
- Extension sẽ tự động lấy giá mỗi 60 giây
- Dữ liệu sẽ được thu thập mỗi 1 phút

### 6.3. Xem dữ liệu
- Bảng sẽ hiển thị 10 records gần nhất
- Các cột: Input 1, Input 2, Input 3, Profit, Cal (%), Time
- Dữ liệu mới nhất ở trên cùng

### 6.4. Xuất dữ liệu
- Chọn thời gian bắt đầu và kết thúc
- Click "Export CSV"
- File sẽ được tải xuống

## 🔧 Troubleshooting

### Extension không xuất hiện
- Kiểm tra Developer mode đã bật chưa
- Refresh trang extensions
- Kiểm tra console log

### Không lấy được giá
- Đảm bảo URL đúng: `https://www.mining-dutch.nl/pools/dogecoin.php?page=dashboard#`
- Kiểm tra element `id="b-price"` có tồn tại không
- Dùng nút "Test" để debug

### Dữ liệu không lưu
- Kiểm tra quyền storage
- Restart extension
- Xóa cache và thử lại

### Extension bị lỗi
- Vào `chrome://extensions/`
- Click "Reload" trên extension
- Kiểm tra console log
- Restart Chrome nếu cần

## 📱 Sử dụng trên các trang khác

Extension chỉ hoạt động trên URL cụ thể:
- ✅ `https://www.mining-dutch.nl/pools/dogecoin.php?page=dashboard#`
- ❌ Các URL khác sẽ không hoạt động

## 🔄 Cập nhật Extension

Khi có cập nhật:
1. Thay thế files cũ bằng files mới
2. Vào `chrome://extensions/`
3. Click "Reload" trên extension
4. Extension sẽ cập nhật

## 🗑️ Gỡ Extension

1. Vào `chrome://extensions/`
2. Tìm "Dogecoin Profit Calculator"
3. Click "Remove"
4. Xác nhận gỡ bỏ

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra console log (F12)
2. Restart extension
3. Kiểm tra quyền
4. Đảm bảo URL target đúng
5. Kiểm tra element `b-price` có tồn tại không

