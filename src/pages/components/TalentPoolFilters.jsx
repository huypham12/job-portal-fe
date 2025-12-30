import { useState } from "react"
import { Button, Card, CardHeader, CardBody, Input, Select } from '../../components/shared'

function TalentPoolFilters({ onMatch, loading, disabled }) {
  const [filters, setFilters] = useState({
    size: 50,
    minScore: 70,
    location: '',
    experienceMin: '',
    experienceMax: '',
    skills: [],
    education: ''
  })

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleMatch = () => {
    // Validate and clean filters
    const cleanFilters = {
      size: filters.size,
      minScore: filters.minScore,
      location: filters.location.trim(),
      experienceMin: filters.experienceMin ? parseInt(filters.experienceMin) : undefined,
      experienceMax: filters.experienceMax ? parseInt(filters.experienceMax) : undefined,
      education: filters.education
    }

    // Remove undefined values
    Object.keys(cleanFilters).forEach(key => {
      if (cleanFilters[key] === undefined || cleanFilters[key] === '') {
        delete cleanFilters[key]
      }
    })

    onMatch(cleanFilters)
  }

  const resetFilters = () => {
    setFilters({
      size: 50,
      minScore: 70,
      location: '',
      experienceMin: '',
      experienceMax: '',
      skills: [],
      education: ''
    })
  }

  return (
    <Card className="talent-pool-filters">
      <CardHeader>
        <h3>Bộ lọc tìm kiếm</h3>
        <p className="rd-muted">Tinh chỉnh tiêu chí để tìm ứng viên phù hợp nhất</p>
      </CardHeader>

      <CardBody>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Số lượng kết quả</label>
            <Select
              value={filters.size}
              onChange={(e) => handleFilterChange('size', parseInt(e.target.value))}
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
                value={filters.minScore}
                onChange={(e) => handleFilterChange('minScore', parseInt(e.target.value))}
                disabled={disabled}
                className="rd-slider"
              />
              <span className="slider-value">{filters.minScore}%</span>
            </div>
          </div>

          <div className="filter-group">
            <label>Địa điểm</label>
            <Input
              type="text"
              placeholder="Nhập địa điểm..."
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="filter-group">
            <label>Kinh nghiệm (năm)</label>
            <div className="experience-range">
              <Input
                type="number"
                placeholder="Từ"
                min="0"
                max="50"
                value={filters.experienceMin}
                onChange={(e) => handleFilterChange('experienceMin', e.target.value)}
                disabled={disabled}
              />
              <span>-</span>
              <Input
                type="number"
                placeholder="Đến"
                min="0"
                max="50"
                value={filters.experienceMax}
                onChange={(e) => handleFilterChange('experienceMax', e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Trình độ học vấn</label>
            <Select
              value={filters.education}
              onChange={(e) => handleFilterChange('education', e.target.value)}
              disabled={disabled}
            >
              <option value="">Tất cả</option>
              <option value="high_school">Trung học</option>
              <option value="associate">Cao đẳng</option>
              <option value="bachelor">Đại học</option>
              <option value="master">Thạc sĩ</option>
              <option value="phd">Tiến sĩ</option>
            </Select>
          </div>
        </div>

        <div className="filter-actions">
          <Button
            variant="outline"
            onClick={resetFilters}
            disabled={loading}
          >
            Đặt lại
          </Button>
          <Button
            variant="primary"
            onClick={handleMatch}
            disabled={disabled || loading}
            loading={loading}
          >
            {loading ? 'Đang tìm kiếm...' : 'Tìm ứng viên phù hợp'}
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

export default TalentPoolFilters
