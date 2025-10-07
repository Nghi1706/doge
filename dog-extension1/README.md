# Dogecoin Profit Monitor Extens3. **Cấu hình Extension:**
   - Click vào icon extension trên toolbar
   - Nhập các giá trị Input 1, Input 2, Input 3
   - Click "Lưu tham số"

4. **Điều khiển monitoring:**
   - **▶️ Bắt đầu**: Bắt đầu theo dõi giá tự động
   - **⏹️ Dừng lại**: Dừng theo dõi 
   - **🔍 Test kết nối**: Kiểm tra kết nối và lấy giá thử

5. **Theo dõi:**
   - Extension sẽ tự động theo dõi giá trị từ element có `id="b-price"`
   - Dữ liệu được cập nhật mỗi 60 giây khi đang chạy
   - Xem bảng dữ liệu real-time trong popup
   - Theo dõi trạng thái và lỗi (nếu có)

6. **Xuất dữ liệu:**
   - Chọn khoảng thời gian (tùy chọn)
   - Click "Xuất CSV" hoặc "Xuất Excel"ion Chrome để theo dõi giá Dogecoin và tính toán lợi nhuận tự động.

## Tính năng chính

- ✅ **Tự động lấy giá**: Từ element `id="b-price"` mỗi 60 giây
- ✅ **Tính toán Profit**: `profit = giá_lấy_được * 100,000,000`
- ✅ **Tính toán Cal**: `((((profit * input1 + input2) / input3) - 0.04) - 1) * 100`
- ✅ **Quản lý trạng thái**: Start/Stop/Test monitoring
- ✅ **Lưu trữ dữ liệu**: Tất cả records được lưu tự động
- ✅ **Hiển thị Table**: 50 records mới nhất, sắp xếp theo thời gian
- ✅ **Xuất dữ liệu**: CSV/Excel với filter theo thời gian
- ✅ **Chạy background**: Chỉ hoạt động trên URL yêu cầu
- ✅ **Báo lỗi real-time**: Hiển thị lỗi kết nối và trạng thái

## Cài đặt Extension

1. **Mở Chrome Extension Manager:**
   - Gõ `chrome://extensions/` trên thanh địa chỉ
   - Bật "Developer mode" ở góc trên bên phải

2. **Load Extension:**
   - Click "Load unpacked"
   - Chọn thư mục `dog-extension1`
   - Extension sẽ được cài đặt và hiển thị icon trên toolbar

## Sử dụng

1. **Mở trang web:**
   - Truy cập: `https://www.mining-dutch.nl/pools/dogecoin.php?page=dashboard#`

2. **Cấu hình Extension:**
   - Click vào icon extension trên toolbar
   - Nhập các giá trị Input 1, Input 2, Input 3
   - Click "Lưu tham số"

3. **Theo dõi:**
   - Extension sẽ tự động theo dõi giá trị từ element có `id="b-price"`
   - Dữ liệu được cập nhật mỗi 60 giây
   - Xem bảng dữ liệu real-time trong popup

4. **Xuất dữ liệu:**
   - Chọn khoảng thời gian (tùy chọn)
   - Click "Xuất CSV" hoặc "Xuất Excel"

## Cấu trúc Files

- `manifest.json` - Cấu hình extension
- `background.js` - Service worker chạy background
- `content.js` - Script inject vào trang web
- `popup.html` - Giao diện popup
- `popup.js` - Logic popup

## Yêu cầu

- Chrome Browser với Extension API v3
- Quyền truy cập `https://www.mining-dutch.nl/*`
- Quyền storage và scripting

## Lưu ý

- Extension chỉ hoạt động khi có tab mở trang mining-dutch.nl
- Dữ liệu được lưu trữ local trên máy tính
- Tối đa 10,000 records được lưu trữ