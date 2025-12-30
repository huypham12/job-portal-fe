# JobFinder (Vite + React)

Giao diện trang chủ website tuyển dụng, kèm router và trang mẫu với tính năng tìm kiếm nâng cao.

## Chạy dự án

1. Mở Terminal tại thư mục `jobfinder/`.
2. Cài đặt:
   - `npm install`
3. Chạy dev:
   - `npm run dev`
4. Mở URL hiển thị trong terminal (thường là `http://localhost:5173`).

## Tính năng tìm kiếm nâng cao

JobFinder hỗ trợ đầy đủ các tính năng tìm kiếm từ backend, bao gồm:

### Bộ lọc cơ bản
- **Từ khóa**: Tìm kiếm tự do trong tiêu đề, mô tả, công ty
- **Địa điểm**: Tìm theo tỉnh/thành phố, quận/huyện
- **Loại công việc**: Toàn thời gian, Bán thời gian, Hợp đồng
- **Kinh nghiệm**: Từ 0-5+ năm

### Bộ lọc nâng cao
- **Kỹ năng**: Chọn nhiều kỹ năng với autocomplete từ API
- **Mức lương**: Khoảng lương tối thiểu/tối đa (VND/tháng)
- **Lĩnh vực**: Công nghệ, Kinh doanh, Marketing, Thiết kế, v.v.
- **Phúc lợi**: Bảo hiểm sức khỏe, Làm việc từ xa, Giờ linh hoạt, v.v.
- **Làm việc từ xa**: Tỷ lệ remote tối thiểu (0-100%)
- **Giờ làm linh hoạt**: Có/không

### Sắp xếp kết quả
- **Liên quan nhất**: Sắp xếp theo độ phù hợp (mặc định)
- **Mới nhất**: Theo ngày đăng
- **Cũ nhất**: Theo ngày đăng (tăng dần)
- **Lương cao nhất**: Theo mức lương tối đa
- **Lương thấp nhất**: Theo mức lương tối thiểu
- **Kinh nghiệm nhiều nhất**: Theo cấp độ kinh nghiệm
- **Kinh nghiệm ít nhất**: Theo cấp độ kinh nghiệm

### Giao diện người dùng
- **SearchBar**: Ô tìm kiếm chính với gợi ý tự động
- **LocationSelector**: Component 2 cấp chọn địa điểm
  - Dropdown chọn Tỉnh/Thành phố (load từ API)
  - Dropdown chọn Quận/Huyện (load theo tỉnh đã chọn)
  - Gửi cả location text và locationId để filter chính xác
- **Bộ lọc sidebar**: Các bộ lọc nâng cao có thể thu gọn
- **Active filters**: Hiển thị các bộ lọc đang áp dụng với nút xóa nhanh
- **Sort dropdown**: Chọn cách sắp xếp kết quả
- **Responsive**: Tương thích mobile và desktop

## Cấu trúc code

### Hooks
- `useJobsSearch()` — Hook chính quản lý state tìm kiếm và API calls

### Components
- `SearchPage.jsx` — Trang tìm kiếm chính
- `SearchBar.jsx` — Ô tìm kiếm với suggestions
- `JobFiltersSidebar.jsx` — Sidebar bộ lọc nâng cao
- `SortSelect.jsx` — Dropdown sắp xếp
- `ActiveFilters.jsx` — Hiển thị bộ lọc đang active
- `JobList.jsx` — Danh sách kết quả với pagination
- `JobCard.jsx` — Card công việc với highlights và badges

### Services
- `searchService.js` — API calls cho tìm kiếm, đã cập nhật serialize arrays thành repeated params
- `apiClient.js` — HTTP client với debounce

## API Integration

### Query Parameters
Frontend gửi query params theo format:
```
GET /api/search/jobs?q=developer&location=hanoi&jobType=full_time&experienceLevel=2&skills=react&skills=typescript&salaryMin=1000000&salaryMax=3000000&jobCategories=technology&jobBenefits=remote_work&remotePercentageMin=50&flexibleHours=true&sort=salary_high&page=1&size=20
```

### Response Format
Backend trả về:
```json
{
  "total": 150,
  "took_ms": 45,
  "hits": [
    {
      "id": "job-123",
      "_source": {
        "title": "Frontend Developer",
        "company_name": "Tech Corp",
        "location_name": "Hanoi",
        "job_type": "full_time",
        "experience_level": 2,
        "skills": ["react", "typescript"],
        "salary_min": 15000000,
        "salary_max": 25000000,
        "is_remote_allowed": true,
        "flexible_hours": false
      },
      "_score": 0.85,
      "highlight": {
        "title": ["<mark>Frontend</mark> Developer"],
        "description": ["Experience with <mark>React</mark> and TypeScript"]
      }
    }
  ]
}
```

## Cấu trúc thư mục
- `src/pages/Home.jsx` — Trang chủ với hero, tìm kiếm, danh mục, việc nổi bật, đối tác.
- `src/pages/SearchPage.jsx` — Trang tìm kiếm với filters và results.
- `src/pages/Jobs.jsx` — Danh sách việc làm.
- `src/pages/JobDetail.jsx` — Chi tiết việc làm.
- `src/pages/PostJob.jsx` — Form đăng tin.
- `src/components/*` — Các component UI.
- `src/hooks/useJobs.js` — Custom hooks cho jobs management.
- `src/services/*` — API services.
- `src/data/mock.js` — Dữ liệu mẫu.

## Tùy chỉnh nhanh
- Màu sắc/kiểu dáng: `src/index.css`
- Dữ liệu: `src/data/mock.js`
- Cấu hình tìm kiếm: `src/hooks/useJobs.js`
- API endpoints: `src/services/searchService.js`

