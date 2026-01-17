# 🧪 Test Real-time Step-by-Step

## Test 1: Kiểm tra Backend có emit không

### Mở terminal backend và chạy:

```bash
cd job-portal
npm run dev
```

### Trigger một action (ví dụ: candidate nộp đơn)

**Backend terminal phải thấy:**

```
📩 Notification sent to user <recruiterId>: application_received
```

**Nếu KHÔNG thấy:**

- Backend chưa gọi NotificationHelper
- Hoặc có lỗi trong NotificationHelper

---

## Test 2: Kiểm tra Frontend có nhận event từ Socket không

### Mở Browser Console (F12) và paste đoạn code này:

```javascript
// Test manual socket listener
window.testSocket = () => {
  console.group("🧪 Manual Socket Test");

  // Get socketService
  const socketService =
    window.socketService ||
    (window.socketServiceGlobal ? window.socketServiceGlobal : null);

  if (!socketService) {
    console.error("❌ socketService not found on window");
    console.log("Try importing it manually");
    console.groupEnd();
    return;
  }

  console.log("✅ socketService found");
  console.log("Connected:", socketService.isConnected);
  console.log("Socket:", socketService.socket);

  // Add a test listener
  let testListenerCalled = false;
  socketService.on("notification:new", (data) => {
    testListenerCalled = true;
    console.log("🎉 TEST LISTENER RECEIVED NOTIFICATION:", data);
  });

  console.log("✅ Test listener added");
  console.log("Now trigger a notification from backend...");
  console.log(
    'If you see "🎉 TEST LISTENER RECEIVED NOTIFICATION", socket is working!'
  );
  console.groupEnd();

  // Check after 5 seconds
  setTimeout(() => {
    if (!testListenerCalled) {
      console.warn("⚠️ No notification received after 5s");
      console.log("Either backend did not emit, or socket connection broken");
    }
  }, 5000);
};

// Run test
window.testSocket();
```

### Sau đó trigger một notification (ví dụ: nộp đơn)

**Nếu thấy:**

```
🎉 TEST LISTENER RECEIVED NOTIFICATION: {...}
```

→ Socket đang hoạt động! Vấn đề là ở component listeners

**Nếu KHÔNG thấy:**
→ Socket không nhận được event từ backend

---

## Test 3: Kiểm tra Component Listeners

### Thêm debug vào component của bạn:

**File: ApplicationsList.jsx (hoặc bất kỳ component nào)**

```javascript
// Thêm vào component
useEffect(() => {
  console.group("🔍 [ApplicationsList] Setup Debug");
  console.log("isConnected:", isConnected);
  console.log("jobId:", jobId);
  console.log("onNotification:", !!onNotification);
  console.groupEnd();

  if (!isConnected || !jobId) {
    console.warn("⚠️ [ApplicationsList] Not setting up listener:", {
      isConnected,
      jobId,
    });
    return;
  }

  console.log("✅ [ApplicationsList] Setting up listener...");

  // QUAN TRỌNG: Call onNotification để register callback
  onNotification((notification) => {
    console.group("📩 [ApplicationsList] NOTIFICATION RECEIVED");
    console.log("Full notification:", notification);
    console.log("Type:", notification.type);
    console.log("Expected types:", [
      "application_received",
      "application_status_changed",
    ]);
    console.log("Metadata:", notification.metadata);
    console.log("Current job_id:", jobId);
    console.log("Notification job_id:", notification.metadata?.job_id);
    console.log("Match:", notification.metadata?.job_id === jobId);
    console.groupEnd();

    // Check type and job_id
    if (
      (notification.type === "application_received" ||
        notification.type === "application_status_changed") &&
      notification.metadata?.job_id === jobId
    ) {
      console.log("✅ [ApplicationsList] Conditions matched! Refreshing...");
      fetchApplications();
      fetchStats();
    } else {
      console.log(
        "⏭️ [ApplicationsList] Conditions not matched, skipping refresh"
      );
    }
  });

  console.log("✅ [ApplicationsList] Listener registered");
}, [isConnected, jobId, onNotification, fetchApplications, fetchStats]);
```

---

## Test 4: Full Flow Test

### Setup:

1. **Browser 1**: Login as Recruiter
2. **Browser 2**: Login as Candidate
3. **Backend Terminal**: Watching logs

### Action:

**Browser 2**: Nộp đơn ứng tuyển

### Expected Logs:

#### Backend Terminal:

```
📩 Notification sent to user abc-123: application_received
```

#### Browser 1 Console:

```
📩 New notification received: {
  type: 'application_received',
  metadata: { job_id: 'xyz', ... }
}
🎧 [useSocket] handleNewNotification called: {...}
🎧 [useSocket] notificationCallbackRef.current: true
🎧 [useSocket] Calling callback...
📢 Emitting 'notification:new' to 1 listener(s)
📩 [ApplicationsList] NOTIFICATION RECEIVED
   Type: application_received
   Notification job_id: xyz
   Current job_id: xyz
   Match: true
✅ [ApplicationsList] Conditions matched! Refreshing...
```

#### Browser 1 UI:

- Danh sách tự động refresh
- Không cần F5

---

## Debugging Flow

### Nếu không có log "📩 New notification received":

→ **Backend không emit** hoặc **Socket không connected đúng room**

**Check:**

1. Backend có log "Notification sent"?
2. Backend có đúng userId không?
3. Socket có subscribed vào room `user:${userId}:notifications` không?

### Nếu có log "📩 New notification received" nhưng không có "🎧 [useSocket] handleNewNotification":

→ **Socket listener chưa được setup**

**Check:**

1. useSocket có được call không?
2. socketService.on('notification:new', handler) có được gọi không?

### Nếu có log "🎧 [useSocket] handleNewNotification" nhưng không có "📩 [ApplicationsList] NOTIFICATION RECEIVED":

→ **Component chưa register callback** hoặc **callback bị overwrite**

**Check:**

1. Component có call `onNotification(callback)` không?
2. Component có re-render và call lại onNotification nhiều lần không?

### Nếu có log "📩 [ApplicationsList] NOTIFICATION RECEIVED" nhưng "Match: false":

→ **Điều kiện filter không đúng**

**Check:**

1. notification.type có đúng không?
2. notification.metadata.job_id có match với jobId hiện tại không?
3. jobId có undefined không?

---

## Quick Commands

### Export socketService to window (for debugging):

Thêm vào `socketService.js`:

```javascript
// At the bottom of file
if (typeof window !== "undefined") {
  window.socketServiceGlobal = socketService;
}
```

### Force refresh connection:

```javascript
// In browser console
window.socketServiceGlobal.disconnect();
setTimeout(() => {
  window.socketServiceGlobal.connect();
  window.socketServiceGlobal.subscribeToNotifications();
}, 1000);
```

### Check current listeners:

```javascript
// In browser console
console.log("Event listeners:", window.socketServiceGlobal.eventListeners);
```

---

**Sau khi chạy các test trên, bạn sẽ biết chính xác đâu là vấn đề!** 🎯
