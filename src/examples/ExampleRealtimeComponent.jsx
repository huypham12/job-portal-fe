// Example: How to add real-time updates to a new component

import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { SomeService } from "../lib/api";

/**
 * Example Component với Real-time Updates
 *
 * Component này demo cách tích hợp real-time updates
 * cho một trang mới trong hệ thống
 */
export default function ExampleRealtimeComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Sử dụng useSocket hook để kết nối
  const { isConnected, onNotification, notificationCount } = useSocket();

  // 2. Hàm fetch data từ API
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await SomeService.getData();
      setData(response.data || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Load data lần đầu
  useEffect(() => {
    fetchData();
  }, []);

  // 4. Listen real-time updates
  useEffect(() => {
    // Chỉ listen khi socket đã connected
    if (!isConnected) return;

    // Đăng ký callback để nhận notifications
    onNotification((notification) => {
      console.log("📩 Received notification:", notification);

      // Filter notifications theo type
      if (notification.type === "application_received") {
        console.log("🔔 Ứng viên mới:", notification.content);

        // Có thể check thêm metadata để filter chính xác hơn
        const jobId = notification.metadata?.job_id;
        if (jobId) {
          console.log("  → Job ID:", jobId);
        }

        // Reload data khi có update
        fetchData();
      }

      if (notification.type === "application_status_changed") {
        console.log("🔔 Trạng thái thay đổi:", notification.content);
        fetchData();
      }

      // Thêm các notification types khác nếu cần
      if (notification.type === "interview_scheduled") {
        console.log("🔔 Lịch phỏng vấn mới:", notification.content);
        fetchData();
      }
    });

    // Cleanup sẽ tự động được xử lý bởi useSocket hook
  }, [isConnected, onNotification]);

  // 5. Hiển thị connection status (optional - for debugging)
  useEffect(() => {
    console.log(
      "Socket connection status:",
      isConnected ? "Connected ✅" : "Disconnected ❌"
    );
  }, [isConnected]);

  return (
    <div>
      {/* Connection indicator (optional) */}
      {isConnected && (
        <div
          style={{
            position: "fixed",
            top: 10,
            right: 10,
            background: "#10b981",
            color: "white",
            padding: "4px 8px",
            borderRadius: 4,
            fontSize: 12,
          }}
        >
          🟢 Real-time connected
        </div>
      )}

      {/* Notification count (optional) */}
      {notificationCount > 0 && (
        <div style={{ marginBottom: 16 }}>
          Bạn có {notificationCount} thông báo chưa đọc
        </div>
      )}

      {/* Your content */}
      <h1>Example Page</h1>

      {loading && <p>Đang tải...</p>}

      {!loading && data.length === 0 && <p>Không có dữ liệu</p>}

      {!loading && data.length > 0 && (
        <div>
          {data.map((item) => (
            <div key={item.id}>{/* Render your data */}</div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * ADVANCED: Custom Hook cho Specific Use Case
 *
 * Tạo custom hook riêng nếu muốn tái sử dụng logic
 */
export function useRealtimeApplications(jobId) {
  const [applications, setApplications] = useState([]);
  const { isConnected, onNotification } = useSocket();

  const fetchApplications = async () => {
    // Fetch logic here
  };

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  useEffect(() => {
    if (!isConnected || !jobId) return;

    onNotification((notification) => {
      const notificationJobId = notification.metadata?.job_id;

      if (
        (notification.type === "application_received" ||
          notification.type === "application_status_changed") &&
        notificationJobId === jobId
      ) {
        fetchApplications();
      }
    });
  }, [isConnected, jobId, onNotification]);

  return { applications, refetch: fetchApplications };
}

// Sử dụng:
// const { applications } = useRealtimeApplications(jobId)
