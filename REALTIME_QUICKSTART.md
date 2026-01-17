# 🚀 Quick Start - Test Real-time Ngay

## ⚡ Bước 1: Start Backend & Frontend (2 phút)

```bash
# Terminal 1 - Backend
cd job-portal
npm run dev

# Đợi thấy: "✅ Socket.IO server initialized"
```

```bash
# Terminal 2 - Frontend
cd fe-job-portal
npm run dev

# Mở browser: http://localhost:5173 (hoặc port Vite chỉ định)
```

## 🔍 Bước 2: Kiểm tra Kết nối (1 phút)

### Mở Browser Console (F12)

1. **Login vào hệ thống** (recruiter hoặc candidate)

2. **Xem Console Logs:**

Phải thấy:

```
🔌 Socket.IO connecting to: http://localhost:4000
🔌 Attempting to connect to Socket.IO server: http://localhost:4000
✅ Connected to Socket.IO server
   Socket ID: abc123xyz...
📬 Subscribed to notifications
```

### ✅ Nếu thấy logs trên → Đã kết nối thành công!

### ❌ Nếu KHÔNG thấy logs hoặc có lỗi:

**Lỗi 1: Không có log gì cả**

```javascript
// Nghĩa là: App.jsx chưa gọi socketService.connect()
// Solution: Check file App.jsx đã import socketService chưa
```

**Lỗi 2: "No auth token available"**

```javascript
// Nghĩa là: User chưa login hoặc token hết hạn
// Solution: Logout và login lại
```

**Lỗi 3: "Socket connection error: ..."**

```javascript
// Nghĩa là: Backend chưa chạy hoặc URL sai
// Solution:
// 1. Check backend đang chạy
// 2. Check .env có VITE_API_URL=http://localhost:4000/api
```

**Lỗi 4: CORS error**

```
Access to XMLHttpRequest blocked by CORS policy
// Solution: Check backend .env có CORS_ORIGIN=http://localhost:5173
```

## 🧪 Bước 3: Test Real-time (2 phút)

### Chuẩn bị 2 Browsers:

- **Browser 1 (Chrome)**: Login như **Recruiter**
- **Browser 2 (Firefox/Incognito)**: Login như **Candidate**

### Test Scenario:

#### 📝 Test 1: Ứng viên nộp đơn

**Browser 2 (Candidate):**

1. Vào trang `/search` hoặc `/jobs`
2. Tìm một job bất kỳ
3. Click "Ứng tuyển"
4. Điền form và Submit

**Browser 1 (Recruiter):**

1. Vào trang `/recruiter/jobs` → Click vào job vừa có người nộp đơn
2. Click "Xem ứng viên" hoặc vào `/recruiter/applications/by-job/:jobId`

**Kết quả mong đợi:**

- ✅ Browser 1 console hiện: `🔔 Ứng viên mới: [Tên candidate]...`
- ✅ Danh sách ứng viên tự động refresh (KHÔNG F5)
- ✅ Stats tăng (từ "0 ứng viên" → "1 ứng viên")

**Backend terminal phải hiện:**

```
📩 Notification sent to user [recruiterId]: application_received
```

#### 📝 Test 2: Recruiter thay đổi trạng thái

**Browser 1 (Recruiter):**

1. Vào chi tiết một ứng viên
2. Đổi status từ "Pending" → "Reviewed"
3. Click Save

**Browser 2 (Candidate):**

1. Vào trang `/applications` (My Applications)

**Kết quả mong đợi:**

- ✅ Browser 2 console hiện: `🔔 Real-time update: ...`
- ✅ Trạng thái đơn tự động đổi (KHÔNG F5)
- ✅ Notification count tăng

**Backend terminal phải hiện:**

```
📩 Notification sent to user [candidateId]: application_status_changed
```

## 🎯 Nếu Real-time KHÔNG Hoạt Động

### Debug Checklist:

```javascript
// 1. Mở Browser Console (F12)
// 2. Paste đoạn code này:

console.group("🔍 Socket Debug");
console.log("Window location:", window.location.href);
console.log("Env VITE_API_URL:", import.meta.env.VITE_API_URL);
console.log("Env VITE_API_BASE_URL:", import.meta.env.VITE_API_BASE_URL);

// Check if socketService exists
if (window.socketService) {
  console.log("socketService exists:", true);
  console.log("isConnected:", window.socketService.isConnected);
  console.log("socket:", window.socketService.socket);
} else {
  console.log("socketService NOT found on window");
}

// Check auth
const token =
  localStorage.getItem("accessToken") || localStorage.getItem("token");
console.log("Has token:", !!token);
console.log("Token length:", token?.length);

console.groupEnd();
```

### Common Fixes:

**Fix 1: Sửa .env file**

```bash
cd fe-job-portal
cat > .env << EOF
VITE_API_URL=http://localhost:4000/api
EOF
```

Sau đó restart frontend:

```bash
# Ctrl+C để stop
npm run dev
```

**Fix 2: Hard refresh browser**

```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

**Fix 3: Clear browser cache**

```
F12 → Application tab → Clear storage → Clear site data
```

**Fix 4: Check backend CORS**
File `job-portal/.env`:

```env
CORS_ORIGIN=http://localhost:5173
# HOẶC nếu frontend chạy port khác:
# CORS_ORIGIN=http://localhost:3000
```

Restart backend sau khi sửa.

## 📊 Success Criteria

Khi mọi thứ hoạt động đúng, bạn sẽ thấy:

### Backend Terminal:

```
✅ Socket.IO server initialized
🔌 User abc-123 connected with socket def-456
📬 User abc-123 subscribed to notifications
📩 Notification sent to user abc-123: application_received
```

### Browser 1 Console (Recruiter):

```
🔌 Socket.IO connecting to: http://localhost:4000
✅ Connected to Socket.IO server
   Socket ID: def-456
📬 Subscribed to notifications
📩 New notification received: {...}
🔔 Ứng viên mới: John Doe đã ứng tuyển vị trí Senior Developer
```

### Browser 2 Console (Candidate):

```
🔌 Socket.IO connecting to: http://localhost:4000
✅ Connected to Socket.IO server
   Socket ID: ghi-789
📬 Subscribed to notifications
📩 New notification received: {...}
🔔 Real-time update: Trạng thái đơn ứng tuyển đã thay đổi
```

### UI Changes (KHÔNG CẦN F5):

- ✅ Danh sách tự động cập nhật
- ✅ Stats tự động thay đổi
- ✅ Notification badge tăng
- ✅ Real-time trong vòng 1-2 giây

## 🆘 Still Not Working?

### Method 1: Enable More Debug Logs

**File:** `fe-job-portal/src/pages/ApplicationsList.jsx`

Thêm vào component:

```javascript
// Temporary debug
useEffect(() => {
  console.log("🎧 [ApplicationsList] Debug:", {
    isConnected,
    jobId,
    hasOnNotification: !!onNotification,
  });
}, [isConnected, jobId, onNotification]);

// Listen với full logs
useEffect(() => {
  if (!isConnected || !jobId) {
    console.log("⚠️ [ApplicationsList] Skipping listener:", {
      isConnected,
      jobId,
    });
    return;
  }

  console.log("✅ [ApplicationsList] Registering listener for job:", jobId);

  onNotification((notification) => {
    console.group("📩 [ApplicationsList] Notification received");
    console.log("Full notification:", notification);
    console.log("Type:", notification.type);
    console.log("Metadata:", notification.metadata);
    console.log("Expected job_id:", jobId);
    console.log("Notification job_id:", notification.metadata?.job_id);
    console.log("Match:", notification.metadata?.job_id === jobId);
    console.groupEnd();

    if (
      notification.type === "application_received" &&
      notification.metadata?.job_id === jobId
    ) {
      console.log("🔄 [ApplicationsList] Refreshing data...");
      fetchApplications();
      fetchStats();
    }
  });
}, [isConnected, jobId, onNotification, fetchApplications, fetchStats]);
```

### Method 2: Test Socket Manually

Mở Console và chạy:

```javascript
// Import socket service
import("./src/services/socketService.js").then((module) => {
  const socketService = module.socketService;
  window.testSocket = socketService;

  // Connect
  socketService.connect();

  // Listen to ALL events
  socketService.on("notification:new", (data) => {
    console.log("🔔 MANUAL TEST - Notification:", data);
  });

  console.log("✅ Manual test setup complete. Try triggering a notification.");
});
```

### Method 3: Contact Developer

Nếu sau tất cả các bước trên vẫn không hoạt động, vui lòng:

1. Copy tất cả logs từ:

   - Backend terminal
   - Browser console (cả 2 browsers)
   - Network tab → WebSocket frames

2. Check file [REALTIME_DEBUG.md](./REALTIME_DEBUG.md) để biết thêm chi tiết

3. Mô tả chính xác bước nào bị lỗi

---

**Expected time:** 5-10 phút để setup và test thành công! 🚀
