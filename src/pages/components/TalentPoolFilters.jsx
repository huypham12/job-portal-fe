import { useState, useMemo } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Select,
} from "../../components/shared";

function TalentPoolFilters({ onMatch, loading, disabled }) {
  const [filters, setFilters] = useState({
    size: 50,
    minScore: 70,
  });

  const handleFilterChange = (field, value) => {
    // Ensure value is valid
    let validValue = value;
    if (field === "size") {
      validValue = [20, 50, 100].includes(value) ? value : 50;
    } else if (field === "minScore") {
      validValue = Math.max(0, Math.min(100, value));
    }

    setFilters((prev) => ({
      ...prev,
      [field]: validValue,
    }));
  };

  const handleMatch = () => {
    // Backend chỉ chấp nhận size và minScore
    const cleanFilters = {
      size: safeFilters.size,
      minScore: safeFilters.minScore,
    };

    onMatch(cleanFilters);
  };

  const resetFilters = () => {
    setFilters({
      size: 50,
      minScore: 70,
    });
  };

  // Ensure values are always numbers
  const safeFilters = useMemo(
    () => ({
      size: Number(filters.size) || 50,
      minScore: Number(filters.minScore) || 70,
    }),
    [filters.size, filters.minScore]
  );

  return (
    <Card className="talent-pool-filters">
      <CardHeader>
        <h3>Thiết lập tìm kiếm</h3>
        <p className="rd-muted">
          Chọn số lượng ứng viên và điểm matching tối thiểu
        </p>
      </CardHeader>

      <CardBody>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Số lượng kết quả</label>
            <Select
              value={safeFilters.size}
              onChange={(e) =>
                handleFilterChange("size", parseInt(e.target.value))
              }
              disabled={disabled}
            >
              <option value={20}>20 ứng viên</option>
              <option value={50}>50 ứng viên</option>
              <option value={100}>100 ứng viên</option>
            </Select>
          </div>

          <div className="filter-group">
            <label>Điểm matching tối thiểu</label>
            <div className="slider-container">
              <input
                type="range"
                min={0}
                max={100}
                value={safeFilters.minScore}
                onChange={(e) =>
                  handleFilterChange("minScore", parseInt(e.target.value))
                }
                disabled={disabled}
                className="rd-slider"
              />
              <span className="slider-value">{safeFilters.minScore}%</span>
            </div>
          </div>
        </div>

        <div className="filter-actions">
          <Button variant="outline" onClick={resetFilters} disabled={loading}>
            Đặt lại
          </Button>
          <Button
            variant="primary"
            onClick={handleMatch}
            disabled={disabled || loading}
            loading={loading}
          >
            {loading ? "Đang tìm kiếm..." : "Tìm ứng viên phù hợp"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

export default TalentPoolFilters;
