import React, { useState, useEffect, useCallback } from 'react'
import { LocationService } from '../lib/api.js'
import './LocationSelector.css'

export default function LocationSelector({
  selectedProvince,
  selectedDistrict,
  onProvinceChange,
  onDistrictChange,
  className = ''
}) {
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [error, setError] = useState(null)

  // Load provinces on component mount
  useEffect(() => {
    const loadProvinces = async () => {
      setLoadingProvinces(true)
      setError(null)
      try {
        const response = await LocationService.getProvinces()
        setProvinces(response.data || [])
      } catch (err) {
        console.error('Failed to load provinces:', err)
        setError('Không thể tải danh sách tỉnh')
      } finally {
        setLoadingProvinces(false)
      }
    }

    loadProvinces()
  }, [])

  // Load districts when province changes
  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([])
      return
    }

    const loadDistricts = async () => {
      setLoadingDistricts(true)
      setError(null)
      try {
        const response = await LocationService.getDistricts(selectedProvince.id)
        setDistricts(response.data || [])
      } catch (err) {
        console.error('Failed to load districts:', err)
        setError('Không thể tải danh sách huyện')
        setDistricts([])
      } finally {
        setLoadingDistricts(false)
      }
    }

    loadDistricts()
  }, [selectedProvince])

  const handleProvinceChange = useCallback((e) => {
    const provinceId = e.target.value
    const province = provinces.find(p => p.id === provinceId) || null

    onProvinceChange(province)

    // Clear district selection when province changes
    if (selectedDistrict && province?.id !== selectedProvince?.id) {
      onDistrictChange(null)
    }
  }, [provinces, selectedDistrict, selectedProvince, onProvinceChange, onDistrictChange])

  const handleDistrictChange = useCallback((e) => {
    const districtId = e.target.value
    const district = districts.find(d => d.id === districtId) || null
    onDistrictChange(district)
  }, [districts, onDistrictChange])

  return (
    <div className={`location-selector ${className}`}>
      {/* Province Selector */}
      <div className="location-field">
        <label htmlFor="province-select" className="location-label">
          Tỉnh/Thành phố
        </label>
        <select
          id="province-select"
          value={selectedProvince?.id || ''}
          onChange={handleProvinceChange}
          disabled={loadingProvinces}
          className="location-dropdown"
          aria-label="Chọn tỉnh/thành phố"
        >
          <option value="">
            {loadingProvinces ? 'Đang tải...' : 'Chọn tỉnh/thành phố'}
          </option>
          {provinces.map(province => (
            <option key={province.id} value={province.id}>
              {province.name}
            </option>
          ))}
        </select>
      </div>

      {/* District Selector */}
      <div className="location-field">
        <label htmlFor="district-select" className="location-label">
          Quận/Huyện
        </label>
        <select
          id="district-select"
          value={selectedDistrict?.id || ''}
          onChange={handleDistrictChange}
          disabled={!selectedProvince || loadingDistricts}
          className="location-dropdown"
          aria-label="Chọn quận/huyện"
        >
          <option value="">
            {!selectedProvince
              ? 'Chọn tỉnh trước'
              : loadingDistricts
                ? 'Đang tải...'
                : 'Tất cả quận/huyện'
            }
          </option>
          {districts.map(district => (
            <option key={district.id} value={district.id}>
              {district.name}
            </option>
          ))}
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="location-error">
          {error}
        </div>
      )}
    </div>
  )
}
