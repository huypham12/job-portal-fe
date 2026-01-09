# ✅ Checklist Real-time Implementation

## 🔧 Cài đặt

- [x] Cài đặt `socket.io-client` package
  ```bash
  cd fe-job-portal
  npm install socket.io-client
  ```

## 📁 Files Đã Cập nhật

### Core Services

- [x] [`fe-job-portal/src/services/socketService.js`](fe-job-portal/src/services/socketService.js) - Socket client service
- [x] [`fe-job-portal/src/hooks/useSocket.js`](fe-job-portal/src/hooks/useSocket.js) - React hook cho socket

### Main App

- [x] [`fe-job-portal/src/App.jsx`](fe-job-portal/src/App.jsx) - Khởi động socket connection khi authenticated

### Candidate Pages

- [x] [`fe-job-portal/src/pages/MyApplications.jsx`](fe-job-portal/src/pages/MyApplications.jsx) - Real-time cho danh sách đơn
- [x] [`fe-job-portal/src/pages/MyApplicationDetail.jsx`](fe-job-portal/src/pages/MyApplicationDetail.jsx) - Real-time cho chi tiết đơn

### Recruiter Pages

- [x] [`fe-job-portal/src/pages/ApplicationsList.jsx`](fe-job-portal/src/pages/ApplicationsList.jsx) - Real-time cho danh sách ứng viên
- [x] [`fe-job-portal/src/pages/ApplicationDetail.jsx`](fe-job-portal/src/pages/ApplicationDetail.jsx) - Real-time cho chi tiết ứng viên
- [x] [`fe-job-portal/src/pages/RecruiterDashboard.jsx`](fe-job-portal/src/pages/RecruiterDashboard.jsx) - Real-time cho dashboard
- [x] [`fe-job-portal/src/pages/MyJobs.jsx`](fe-job-portal/src/pages/MyJobs.jsx) - Real-time cho danh sách jobs
- [x] [`fe-job-portal/src/pages/JobManage.jsx`](fe-job-portal/src/pages/JobManage.jsx) - Real-time cho quản lý job

### Documentation

- [x] [`fe-job-portal/REALTIME_GUIDE.md`](fe-job-portal/REALTIME_GUIDE.md) - Hướng dẫn đầy đủ
- [x] [`fe-job-portal/src/examples/ExampleRealtimeComponent.jsx`](fe-job-portal/src/examples/ExampleRealtimeComponent.jsx) - Example code

## 🧪 Testing Checklist

### 1. Kiểm tra Socket Connection

```bash
# Terminal 1: Start backend
cd job-portal
npm run dev

# Terminal 2: Start frontend
cd fe-job-portal
npm run dev
```

- [ ] Mở browser console (F12)
- [ ] Login vào hệ thống
- [ ] Kiểm tra log: `🔌 Connected to Socket.IO server`
- [ ] Kiểm tra log: `📬 Subscribed to notifications`

### 2. Test Candidate Flow (Real-time)

**Cần 2 browsers:**

- Browser 1: Đăng nhập như **Recruiter**
- Browser 2: Đăng nhập như **Candidate**

**Test Cases:**

#### TC1: Ứng viên nộp đơn

- [ ] Browser 2 (Candidate): Nộp đơn ứng tuyển cho một job
- [ ] Browser 1 (Recruiter): Kiểm tra trang ApplicationsList
  - [ ] Danh sách ứng viên tự động cập nhật (không reload)
  - [ ] Stats tự động tăng
  - [ ] Console log: `🔔 Ứng viên mới: ...`

#### TC2: Recruiter thay đổi trạng thái đơn

- [ ] Browser 1 (Recruiter): Chuyển đơn từ "Pending" → "Reviewed"
- [ ] Browser 2 (Candidate): Kiểm tra trang MyApplications
  - [ ] Trạng thái tự động cập nhật (không reload)
  - [ ] Console log: `🔔 Real-time update: ...`

#### TC3: Recruiter chấp nhận đơn

- [ ] Browser 1 (Recruiter): Chuyển đơn sang "Accepted"
- [ ] Browser 2 (Candidate):
  - [ ] MyApplications tự động cập nhật
  - [ ] Notification count tăng
  - [ ] Console log: `🔔 Real-time update: ...`

#### TC4: Xếp lịch phỏng vấn

- [ ] Browser 1 (Recruiter): Tạo interview stage mới
- [ ] Browser 2 (Candidate):
  - [ ] MyApplicationDetail tự động hiện stage mới
  - [ ] Nhận notification

### 3. Test Recruiter Dashboard (Real-time)

**Cần 2 browsers:**

- Browser 1: Recruiter đang xem Dashboard
- Browser 2: Candidate nộp đơn

**Test Cases:**

#### TC5: Cập nhật Dashboard khi có ứng viên mới

- [ ] Browser 1 (Recruiter): Mở RecruiterDashboard
- [ ] Browser 2 (Candidate): Nộp đơn cho một job
- [ ] Browser 1 (Recruiter): Kiểm tra
  - [ ] Stats tự động tăng
  - [ ] Pipeline tự động cập nhật
  - [ ] Recent applications hiện ứng viên mới
  - [ ] Console log: `🔔 Real-time update: ...`

#### TC6: JobManage tự động cập nhật

- [ ] Browser 1 (Recruiter): Mở JobManage của một job
- [ ] Browser 2 (Candidate): Nộp đơn cho job đó
- [ ] Browser 1 (Recruiter):
  - [ ] Application count tự động tăng
  - [ ] Console log: `🔔 Ứng viên mới: ...`

### 4. Test Multi-device Sync

**Cần 2 tabs cùng user:**

- Tab 1: Trang A
- Tab 2: Trang B

#### TC7: Đồng bộ giữa các tab

- [ ] Tab 1: Mark notification as read
- [ ] Tab 2: Notification count tự động giảm
- [ ] Cả 2 tabs đều connected (check console)

### 5. Test Connection Recovery

#### TC8: Reconnect sau khi mất kết nối

- [ ] Mở DevTools → Network tab
- [ ] Offline: Disconnect internet
- [ ] Console log: `🔌 Disconnected from Socket.IO server`
- [ ] Online: Reconnect internet
- [ ] Console log: `🔌 Connected to Socket.IO server`
- [ ] Console log: `📬 Subscribed to notifications`

## 🐛 Common Issues & Solutions

### Issue 1: Socket không kết nối

**Symptoms:** Không thấy log "Connected to Socket.IO server"
**Solutions:**

- [ ] Check backend đang chạy: `http://localhost:4000`
- [ ] Check VITE_API_BASE_URL trong `.env`
- [ ] Check token còn valid không (logout/login lại)
- [ ] Check browser console có lỗi không

### Issue 2: Không nhận được notifications

**Symptoms:** Socket connected nhưng không có real-time updates
**Solutions:**

- [ ] Check subscribe: xem có log "📬 Subscribed to notifications"
- [ ] Check backend có emit notifications không (xem backend logs)
- [ ] Check notification type có match không
- [ ] Check metadata.job_id / metadata.application_id

### Issue 3: Memory leak / duplicate listeners

**Symptoms:** Nhiều requests trùng lặp khi có notification
**Solutions:**

- [ ] Check useEffect có return cleanup function không
- [ ] Check dependencies array trong useEffect
- [ ] Reload trang và observe

### Issue 4: CORS errors

**Symptoms:** Socket connection bị reject
**Solutions:**

- [ ] Check backend CORS config: `job-portal/src/config/getEnvConfig.ts`
- [ ] Check `CORS_ORIGIN` trong `.env`
- [ ] Restart backend sau khi thay đổi config

## 📊 Performance Check

- [ ] Network tab: WebSocket connection established
- [ ] No memory leaks (check Chrome DevTools → Memory)
- [ ] Notifications arrive within 1-2 seconds
- [ ] UI updates smoothly (không bị lag)
- [ ] No duplicate API calls

## 🎉 Done!

Khi tất cả checkboxes đều ✅:

- Hệ thống real-time hoạt động hoàn hảo
- Không cần reload trang để xem updates
- Multi-device sync hoạt động
- Connection recovery tự động

## 📞 Support

Nếu gặp vấn đề:

1. Check console logs (cả frontend lẫn backend)
2. Verify socket connection status
3. Check notification types và metadata
4. Review documentation: [REALTIME_GUIDE.md](REALTIME_GUIDE.md)
