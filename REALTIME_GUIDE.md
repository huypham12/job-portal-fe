# 🔄 Hướng dẫn Real-time Updates với Socket.IO

Hệ thống đã được cấu hình để tự động cập nhật dữ liệu real-time **không cần reload trang** khi có thay đổi.

## 📋 Tổng quan

### ✅ Đã Triển khai

#### Backend (Node.js)

- **Socket.IO Server**: [`job-portal/src/socket/socket.service.ts`](job-portal/src/socket/socket.service.ts)
- **Authentication Middleware**: [`job-portal/src/socket/socket.middleware.ts`](job-portal/src/socket/socket.middleware.ts)
- **Notification Helper**: [`job-portal/src/shared/helpers/notification.helper.ts`](job-portal/src/shared/helpers/notification.helper.ts)

#### Frontend (React)

- **Socket Client Service**: [`fe-job-portal/src/services/socketService.js`](fe-job-portal/src/services/socketService.js)
- **useSocket Hook**: [`fe-job-portal/src/hooks/useSocket.js`](fe-job-portal/src/hooks/useSocket.js)

## 🎯 Các Trang Đã Tích hợp Real-time

### 1. **App.jsx** - Khởi động Socket

✅ Tự động kết nối khi user đăng nhập
✅ Tự động ngắt kết nối khi logout
✅ Subscribe vào notifications channel

### 2. **MyApplications.jsx** (Candidate)

**Cập nhật khi:**

- ✅ Trạng thái đơn ứng tuyển thay đổi
- ✅ Nhận được offer
- ✅ Lịch phỏng vấn được xếp/hủy

**Events lắng nghe:**

- `application_status_changed`
- `offer_received`
- `interview_scheduled`
- `interview_cancelled`

### 3. **MyApplicationDetail.jsx** (Candidate)

**Cập nhật khi:**

- ✅ Trạng thái thay đổi
- ✅ Stage phỏng vấn được cập nhật
- ✅ Nhận được lịch phỏng vấn mới

**Events lắng nghe:**

- `application_status_changed`
- `interview_scheduled`
- `interview_cancelled`
- `interview_reminder`

### 4. **ApplicationsList.jsx** (Recruiter)

**Cập nhật khi:**

- ✅ Có ứng viên mới nộp đơn
- ✅ Trạng thái ứng viên thay đổi

**Events lắng nghe:**

- `application_received` (check job_id)
- `application_status_changed` (check job_id)

**Tự động refresh:**

- Danh sách ứng viên
- Thống kê (stats)

### 5. **ApplicationDetail.jsx** (Recruiter)

**Cập nhật khi:**

- ✅ Trạng thái ứng viên thay đổi
- ✅ Lịch phỏng vấn được xếp/cập nhật

**Events lắng nghe:**

- `application_status_changed`
- `interview_scheduled`
- `interview_cancelled`
- `interview_reminder`

### 6. **RecruiterDashboard.jsx**

**Cập nhật khi:**

- ✅ Có ứng viên mới
- ✅ Trạng thái ứng viên thay đổi

**Tự động refresh:**

- Danh sách jobs (với số lượng ứng viên)
- Pipeline stats
- Applications list (nếu đang xem job cụ thể)

### 7. **MyJobs.jsx** (Recruiter)

**Cập nhật khi:**

- ✅ Có ứng viên nộp đơn cho job của mình

**Tự động refresh:**

- Danh sách jobs (để cập nhật số lượng ứng viên)

### 8. **JobManage.jsx** (Recruiter)

**Cập nhật khi:**

- ✅ Có ứng viên nộp đơn cho job này
- ✅ Trạng thái ứng viên thay đổi

**Tự động refresh:**

- Thống kê job (số lượng ứng viên)

## 🔧 Cách hoạt động

### Flow Backend → Frontend

```
1. Sự kiện xảy ra (ví dụ: ứng viên nộp đơn)
   ↓
2. Backend tạo notification trong database
   ↓
3. Backend emit event qua Socket.IO:
   socketService.sendNotification(userId, type, content, options)
   ↓
4. Socket.IO gửi đến client (theo room: user:${userId}:notifications)
   ↓
5. Frontend socketService nhận event 'notification:new'
   ↓
6. useSocket hook trigger callbacks đã đăng ký
   ↓
7. Component nhận notification và reload data
   ↓
8. UI tự động cập nhật (không reload trang)
```

### Code Example - Lắng nghe Real-time trong Component

```javascript
import { useSocket } from "../hooks/useSocket";

export default function MyComponent() {
  const [data, setData] = useState([]);
  const { isConnected, onNotification } = useSocket();

  const fetchData = async () => {
    // Load data from API
    const response = await SomeService.getData();
    setData(response.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (!isConnected) return;

    onNotification((notification) => {
      // Check notification type
      if (notification.type === "something_changed") {
        console.log("🔔 Real-time update:", notification.content);

        // Optionally check metadata
        if (notification.metadata?.resource_id === myResourceId) {
          fetchData(); // Reload data
        }
      }
    });
  }, [isConnected, onNotification, fetchData]);

  return <div>{/* Your UI */}</div>;
}
```

## 📡 Các Notification Types Hiện có

Tham khảo: [`job-portal/src/shared/constants/notification-types.ts`](job-portal/src/shared/constants/notification-types.ts)

**Application Events:**

- `application_received` - Nhận được đơn ứng tuyển mới
- `application_status_changed` - Trạng thái đơn thay đổi
- `offer_received` - Nhận được offer

**Interview Events:**

- `interview_scheduled` - Lịch phỏng vấn được xếp
- `interview_cancelled` - Lịch phỏng vấn bị hủy
- `interview_reminder` - Nhắc nhở phỏng vấn

**System Events:**

- `system_announcement` - Thông báo hệ thống

## 🔍 Debugging

### Kiểm tra kết nối Socket

```javascript
// Trong component
const { isConnected } = useSocket();
console.log("Socket connected:", isConnected);
```

### Xem logs trong Console

Backend sẽ log:

```
✅ Socket.IO server initialized
🔌 User <userId> connected with socket <socketId>
📬 User <userId> subscribed to notifications
📩 Notification sent to user <userId>: <type>
```

Frontend sẽ log:

```
🔌 Connected to Socket.IO server
📬 Subscribed to notifications
📩 New notification received: {...}
🔔 Real-time update: <message>
```

## ⚙️ Cấu hình

### Environment Variables

Backend (`job-portal/.env`):

```env
# CORS cho Socket.IO
CORS_ORIGIN=http://localhost:3000
```

Frontend (`fe-job-portal/.env`):

```env
# API Base URL (cũng dùng cho Socket.IO)
VITE_API_BASE_URL=http://localhost:4000
```

## 🚀 Triển khai Production

### Backend

1. Đảm bảo CORS được cấu hình đúng
2. Sử dụng Redis Adapter nếu có nhiều server instances
3. Enable SSL/TLS cho WebSocket

### Frontend

1. Cập nhật `VITE_API_BASE_URL` đến production URL
2. Đảm bảo WebSocket port không bị firewall chặn

## 📝 Lưu ý

1. **Connection Management**: Socket tự động reconnect khi mất kết nối
2. **Memory Leaks**: Tất cả listeners đều được cleanup trong `useEffect` return
3. **Performance**: Chỉ reload data cần thiết (check metadata.job_id, metadata.application_id)
4. **Multi-device**: Hỗ trợ user đăng nhập nhiều thiết bị (broadcast to all sockets)

## 🎓 Best Practices

### ✅ DO

- Kiểm tra `isConnected` trước khi listen
- Kiểm tra metadata để filter notifications
- Cleanup listeners trong useEffect return
- Log notifications để debug

### ❌ DON'T

- Đừng gọi API quá nhiều lần (debounce nếu cần)
- Đừng subscribe cùng event nhiều lần
- Đừng quên cleanup listeners
- Đừng block UI khi reload data

## 📚 Tài liệu thêm

- [Socket.IO Client Documentation](https://socket.io/docs/v4/client-api/)
- [React Hooks Best Practices](https://react.dev/reference/react/hooks)
