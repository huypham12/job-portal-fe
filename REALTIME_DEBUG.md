# 🔍 Debug Checklist - Real-time Không Hoạt Động

## Bước 1: Kiểm tra Backend Socket Server

### 1.1 Xem Backend Logs

```bash
cd job-portal
npm run dev
```

**Kiểm tra log khi backend start:**

- [ ] `✅ Socket.IO server initialized`
- [ ] Backend đang chạy trên port 4000

### 1.2 Kiểm tra khi User Login (Frontend)

**Backend console phải hiện:**

```
🔌 User <userId> connected with socket <socketId>
📬 User <userId> subscribed to notifications
```

**Nếu KHÔNG thấy:**

- Token JWT có thể không hợp lệ
- CORS settings có thể chặn connection
- Frontend connect sai URL

## Bước 2: Kiểm tra Frontend Socket Connection

### 2.1 Mở Browser Console (F12)

Login vào hệ thống và xem console logs:

**Logs mong đợi:**

```
🔌 Connected to Socket.IO server
📬 Subscribed to notifications
```

**Nếu KHÔNG thấy:**

- Check `VITE_API_BASE_URL` trong `.env`
- Check browser Network tab → WebSocket connection
- Check token còn valid không

### 2.2 Kiểm tra Network Tab

1. Mở DevTools → Network tab
2. Filter: WS (WebSocket)
3. Phải thấy connection tới: `ws://localhost:4000/socket.io/`
4. Status: `101 Switching Protocols` (màu xanh)

**Nếu connection failed:**

- Backend chưa chạy
- CORS settings chưa đúng
- Port bị block

## Bước 3: Test Real-time Event Flow

### 3.1 Chuẩn bị 2 Browsers

- Browser 1: Login như **Recruiter** (ví dụ: Chrome)
- Browser 2: Login như **Candidate** (ví dụ: Firefox/Incognito)

### 3.2 Test Scenario: Ứng viên nộp đơn

**Browser 2 (Candidate):**

1. Nộp đơn ứng tuyển cho một job
2. Xem console log

**Browser 1 (Recruiter):**

1. Mở trang ApplicationsList của job đó
2. Xem console log

**Backend Terminal:**
Phải thấy:

```
📩 Notification sent to user <recruiterId>: application_received
```

**Browser 1 Console:**
Phải thấy:

```
📩 New notification received: {
  type: 'application_received',
  metadata: { job_id: '...', application_id: '...' }
}
🔔 Ứng viên mới: ...
```

**Browser 1 UI:**

- Danh sách ứng viên tự động refresh (KHÔNG reload trang)
- Stats counter tăng

## Bước 4: Common Issues & Solutions

### ❌ Issue 1: "Cannot read properties of null (socket)"

**Nguyên nhân:** Socket chưa connect hoặc user chưa authenticated

**Solution:**

```javascript
// Trong component, check isConnected trước khi listen
const { isConnected, onNotification } = useSocket();

useEffect(() => {
  if (!isConnected) return; // ← Quan trọng!

  onNotification((notification) => {
    // ...
  });
}, [isConnected, onNotification]);
```

### ❌ Issue 2: Socket connected nhưng không nhận notifications

**Nguyên nhân:**

- Chưa subscribe vào notifications channel
- Notification type không match
- metadata.job_id không đúng

**Debug:**

```javascript
// Trong component, log tất cả notifications
useEffect(() => {
  if (!isConnected) return;

  onNotification((notification) => {
    console.log("📩 RAW Notification:", notification);
    console.log("  - Type:", notification.type);
    console.log("  - Metadata:", notification.metadata);

    // Kiểm tra type
    if (notification.type === "application_received") {
      console.log("✅ Type matched!");

      // Kiểm tra job_id
      const notificationJobId = notification.metadata?.job_id;
      console.log("  - Notification job_id:", notificationJobId);
      console.log("  - Current job_id:", jobId);

      if (notificationJobId === jobId) {
        console.log("✅ Job ID matched! Should refresh now...");
        fetchData();
      }
    }
  });
}, [isConnected, onNotification, jobId]);
```

### ❌ Issue 3: Backend không emit notifications

**Kiểm tra:**

1. Backend có gọi NotificationHelper không?

```typescript
// Trong application.service.ts
await NotificationHelper.notifyApplicationReceived({
  recruiterId: job.companies.recruiter_id,
  candidateName: profile.full_name,
  jobTitle: job.title,
  applicationId: application.id,
  jobId: job_id,
});
```

2. Backend có log errors không?

```
Failed to send notification: Error: ...
```

**Solution:** Check xem có try-catch nuốt error không

### ❌ Issue 4: CORS Error

**Browser Console:**

```
Access to XMLHttpRequest at 'http://localhost:4000/socket.io/'
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
File `job-portal/src/socket/socket.service.ts`:

```typescript
this.io = new Server(httpServer, {
  cors: {
    origin: envConfig.cors.origin, // ← Check này
    credentials: true,
  },
});
```

File `job-portal/.env`:

```env
CORS_ORIGIN=http://localhost:3000
```

## Bước 5: Manual Testing Script

Thêm đoạn code này vào component để test thủ công:

```javascript
// Temporary debug component
useEffect(() => {
  console.group("🔍 Socket Debug Info");
  console.log("isConnected:", isConnected);
  console.log("socketService:", socketService.getConnectionStatus());
  console.log("User:", getAuthUser());
  console.groupEnd();

  // Manual test socket
  if (isConnected) {
    console.log("✅ Socket IS connected");

    // Test emit
    socketService.socket?.emit("test:ping", { message: "Hello from frontend" });
  } else {
    console.log("❌ Socket NOT connected");
  }
}, [isConnected]);
```

## Bước 6: Kiểm tra Code Flow

### Frontend Flow Check:

```
1. User login
   ↓
2. App.jsx useEffect → socketService.connect()
   ↓
3. socketService.connect() → io(BASE, { auth: { token } })
   ↓
4. Connection established → emit 'subscribe:notifications'
   ↓
5. Component mount → useSocket() → onNotification(callback)
   ↓
6. Backend emits 'notification:new'
   ↓
7. socketService receives → emit to local listeners
   ↓
8. Component callback triggered → fetchData()
   ↓
9. UI updates
```

### Backend Flow Check:

```
1. User creates application
   ↓
2. ApplicationService.createApplication()
   ↓
3. NotificationHelper.notifyApplicationReceived()
   ↓
4. socketService.sendNotification()
   ↓
5. Create notification in DB
   ↓
6. io.to(`user:${userId}:notifications`).emit('notification:new', data)
   ↓
7. Frontend receives event
```

## Quick Fix Commands

### Reset Everything:

```bash
# Terminal 1 - Restart Backend
cd job-portal
npm run dev

# Terminal 2 - Restart Frontend
cd fe-job-portal
npm run dev

# Browser - Hard Refresh
Ctrl + Shift + R (hoặc Cmd + Shift + R trên Mac)
```

### Check Environment Variables:

```bash
# Backend
cd job-portal
cat .env | grep CORS

# Frontend
cd fe-job-portal
cat .env | grep VITE_API
```

### Expected Output:

```
# Backend .env
CORS_ORIGIN=http://localhost:3000

# Frontend .env
VITE_API_BASE_URL=http://localhost:4000
```

## Working Configuration Checklist

- [ ] Backend running on port 4000
- [ ] Frontend running on port 3000 (hoặc 5173 với Vite)
- [ ] `CORS_ORIGIN` trong backend .env = frontend URL
- [ ] `VITE_API_BASE_URL` trong frontend .env = backend URL
- [ ] User đã login (có valid JWT token)
- [ ] Browser console thấy "Connected to Socket.IO server"
- [ ] Backend console thấy "User <id> connected"
- [ ] Backend console thấy "User <id> subscribed to notifications"
- [ ] Network tab thấy WebSocket connection (101 status)
- [ ] Không có CORS errors trong console

## Nếu vẫn không hoạt động...

### Verify bằng cách này:

**Test 1: Backend có emit không?**
Thêm log vào `job-portal/src/shared/helpers/notification.helper.ts`:

```typescript
static async notifyApplicationReceived(data) {
  console.log('🚀 [DEBUG] Sending notification:', {
    recruiterId: data.recruiterId,
    type: 'application_received',
    jobId: data.jobId
  })

  await socketService.sendNotification(...)

  console.log('✅ [DEBUG] Notification sent successfully')
}
```

**Test 2: Frontend có listen không?**
Thêm log vào component:

```javascript
useEffect(() => {
  console.log("🎧 [DEBUG] Setting up listener, isConnected:", isConnected);

  if (!isConnected) {
    console.log("⚠️ [DEBUG] Socket not connected, skipping listener");
    return;
  }

  console.log("✅ [DEBUG] Registering onNotification callback");

  onNotification((notification) => {
    console.log("🔔 [DEBUG] Notification received!", notification);
  });
}, [isConnected, onNotification]);
```

**Test 3: Room subscription đúng chưa?**
Backend log trong `socket.service.ts`:

```typescript
socket.on("subscribe:notifications", () => {
  const room = `user:${userId}:notifications`;
  socket.join(room);
  console.log(`📬 User ${userId} joined room: ${room}`);
  console.log(
    `📊 Room ${room} has ${io.sockets.adapter.rooms.get(room)?.size} members`
  );
});
```

Sau khi chạy các bước trên, bạn sẽ tìm ra được chính xác vấn đề ở đâu! 🎯
