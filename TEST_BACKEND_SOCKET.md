# 🔍 Test Backend Socket Emission

## Vấn đề hiện tại

Frontend socket đã connected nhưng KHÔNG nhận được notifications.
Console logs cho thấy:

- ✅ `✅ Connected to Socket.IO server`
- ✅ `🎧 Listener registered for 'notification:new'`
- ❌ KHÔNG CÓ `📩 New notification received` khi trigger action

→ **Backend không emit hoặc room subscription sai**

## Test 1: Kiểm tra Backend có emit không

### Bước 1: Mở backend terminal

Chạy backend với logs:

```bash
cd job-portal
npm run dev
```

### Bước 2: Trigger một action

Ví dụ: **Candidate nộp đơn ứng tuyển**

1. Browser 2: Login as Candidate
2. Nộp đơn cho một job
3. **XEM BACKEND TERMINAL**

### Bước 3: Kiểm tra backend logs

**PHẢI THẤY trong backend terminal:**

```
📩 Notification sent to user <recruiterId>: application_received
```

**Nếu KHÔNG THẤY log này:**

#### Trường hợp A: Có lỗi trong backend

```
Failed to send notification: Error: ...
```

→ Check lỗi gì và fix

#### Trường hợp B: Không có log gì cả

→ Backend KHÔNG GỌI `NotificationHelper`

**Kiểm tra file: `job-portal/src/api/applications/application.service.ts`**

Tìm dòng này trong hàm `createApplication`:

```typescript
await NotificationHelper.notifyApplicationReceived({
  recruiterId: job.companies.recruiter_id,
  candidateName: profile.full_name,
  jobTitle: job.title,
  applicationId: application.id,
  jobId: job_id,
});
```

**Nếu code này bị comment hoặc trong try-catch mà không log:**
→ Đây là nguyên nhân!

## Test 2: Kiểm tra Room Subscription

### Thêm log vào backend

File: `job-portal/src/socket/socket.service.ts`

Trong hàm `sendNotification`, thêm log:

```typescript
async sendNotification(
  userId: string,
  type: NotificationType,
  content: string,
  options?: { ... }
) {
  if (!this.io) {
    console.error('Socket.IO not initialized')
    return
  }

  // 🔍 ADD THIS LOG
  const room = `user:${userId}:notifications`
  console.log('📤 [Socket] Sending notification:', {
    room,
    type,
    userId,
    connectedSockets: this.userSockets.get(userId)?.size || 0
  })

  // Create notification in database
  const notification = await notificationService.createNotification({ ... })

  // 🔍 ADD THIS LOG
  console.log('📤 [Socket] Emitting to room:', room)

  // Send to all connected sockets of the user
  this.io.to(room).emit('notification:new', {
    id: notification.id,
    type: notification.type,
    content: notification.content,
    // ...
  })

  // 🔍 ADD THIS LOG
  console.log('✅ [Socket] Notification emitted successfully')

  // Update unread count
  this.sendUnreadCount(userId)
}
```

### Restart backend và test lại

**Backend logs phải thấy:**

```
📤 [Socket] Sending notification: {
  room: 'user:abc-123:notifications',
  type: 'application_received',
  userId: 'abc-123',
  connectedSockets: 1
}
📤 [Socket] Emitting to room: user:abc-123:notifications
✅ [Socket] Notification emitted successfully
```

**Nếu `connectedSockets: 0`:**
→ User chưa subscribe vào room hoặc userId sai!

## Test 3: Kiểm tra Frontend có subscribe đúng room không

### Thêm log vào frontend

File: `fe-job-portal/src/services/socketService.js`

```javascript
subscribeToNotifications() {
  if (!this.socket) {
    console.warn('Socket not connected, cannot subscribe to notifications');
    return;
  }

  // 🔍 ADD THIS
  console.log('📬 [Frontend] Subscribing to notifications');
  console.log('📬 [Frontend] Socket ID:', this.socket.id);

  this.socket.emit('subscribe:notifications');
  console.log('📬 Subscribed to notifications');
}
```

### Check backend khi frontend subscribe

Backend `socket.service.ts`, trong handler `subscribe:notifications`:

```typescript
socket.on("subscribe:notifications", () => {
  const room = `user:${userId}:notifications`;
  socket.join(room);

  // 🔍 ADD THIS LOG
  console.log(`📬 [Backend] User ${userId} joined room: ${room}`);
  console.log(`📬 [Backend] Socket ${socket.id} subscribed`);
  console.log(
    `📊 [Backend] Room ${room} has ${
      this.io.sockets.adapter.rooms.get(room)?.size
    } members`
  );

  // Send initial unread count
  this.sendUnreadCount(userId);
});
```

**Backend phải log:**

```
📬 [Backend] User abc-123 joined room: user:abc-123:notifications
📬 [Backend] Socket nTMVLRwm1yfiNZbXAAAt subscribed
📊 [Backend] Room user:abc-123:notifications has 1 members
```

## Test 4: Kiểm tra userId có đúng không

### Frontend - Check userId

```javascript
// In browser console
const token =
  localStorage.getItem("accessToken") || localStorage.getItem("token");
const payload = JSON.parse(atob(token.split(".")[1]));
console.log("Frontend userId:", payload.userId || payload.sub || payload.id);
```

### Backend - Check userId

Trong `socket.middleware.ts`:

```typescript
const decoded = jwt.verify(token, envConfig.jwt.accessSecret);
const userId = decoded.userId || decoded.sub || decoded.id;

// 🔍 ADD THIS
console.log("🔐 [Socket Auth] User authenticated:", {
  userId,
  socketId: socket.id,
  decoded: decoded,
});

socket.data.userId = userId;
```

**Hai userId phải GIỐNG NHAU!**

## Test 5: Manual Test với Postman/Thunder Client

Nếu backend có expose REST endpoint để test:

### Create Test Endpoint

File: `job-portal/src/socket/socket.routes.ts` (tạo mới)

```typescript
import { Router } from "express";
import { socketService } from "./socket.service";
import { authenticateAccessToken } from "@/middleware/verify.middleware";
import { NotificationType } from "@/shared/constants/notification-types";

const router = Router();

router.use(authenticateAccessToken);

/**
 * POST /test/socket-notification
 * Test endpoint to manually trigger a notification
 */
router.post("/test/socket-notification", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { targetUserId, type, content } = req.body;

    await socketService.sendNotification(
      targetUserId || userId,
      type || NotificationType.SYSTEM_ANNOUNCEMENT,
      content || "Test notification from manual endpoint",
      {
        title: "Test Notification",
        metadata: { test: true },
      }
    );

    res.json({
      success: true,
      message: "Notification sent",
      targetUserId: targetUserId || userId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
```

Register route trong `app.ts`:

```typescript
import testSocketRoutes from "./socket/socket.routes";
app.use("/api/test", testSocketRoutes);
```

### Test với Postman

```
POST http://localhost:4000/api/test/socket-notification
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "targetUserId": "your-user-id",
  "type": "system_announcement",
  "content": "This is a manual test notification"
}
```

**Frontend console phải thấy:**

```
📩 New notification received: {
  type: 'system_announcement',
  content: 'This is a manual test notification',
  ...
}
```

## Kết luận

Sau khi chạy các test trên, bạn sẽ biết:

1. ✅ Backend có gọi NotificationHelper không?
2. ✅ Backend có emit socket event không?
3. ✅ Room subscription có đúng không?
4. ✅ userId có match không?
5. ✅ Socket connection có đúng room không?

**Nếu TẤT CẢ đều đúng mà vẫn không nhận được:**
→ Có thể do middleware hoặc CORS block

**Next step:** Gửi cho tôi:

- Backend terminal logs (khi nộp đơn)
- Frontend console logs (đầy đủ)
- Kết quả các test trên
