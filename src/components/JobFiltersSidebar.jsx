import React, { useState, useEffect } from "react";
import { LocationService } from "../lib/api.js";
import LocationSelector from "./LocationSelector.jsx";
import "./JobFiltersSidebar.css";

// Icons as SVG components for better performance
const LocationIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const JobTypeIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const ExperienceIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

const SalaryIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const JOB_TYPES = [
  { value: "full_time", label: "Toàn thời gian" },
  { value: "part_time", label: "Bán thời gian" },
  { value: "contract", label: "Hợp đồng" },
];

const EXPERIENCE_LEVELS = [
  { value: null, label: "Tất cả" },
  { value: 0, label: "Không yêu cầu kinh nghiệm" },
  { value: 1, label: "1 năm" },
  { value: 2, label: "2 năm" },
  { value: 3, label: "3 năm" },
  { value: 4, label: "4 năm" },
  { value: 5, label: "5+ năm" },
];

export default function JobFiltersSidebar({
  filters,
  onFilterChange,
  showAdvancedFilters = true,
}) {
  // Location state - parse current location filter
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  // Initialize selectedProvince/selectedDistrict from filters (locationId or location text)
  React.useEffect(() => {
    let mounted = true;

    const initFromFilters = async () => {
      try {
        // Prefer explicit locationId (UUID) for exact mapping
        if (filters.locationId) {
          const res = await LocationService.getById(filters.locationId);
          const locWrapper = res || {};
          // Controller returns { success, message, data: location }
          const loc = locWrapper.data || locWrapper;
          if (!mounted || !loc) return;

          if (loc.type === "province") {
            setSelectedProvince({ id: loc.id, name: loc.name });
            setSelectedDistrict(null);
          } else if (loc.type === "district") {
            setSelectedDistrict({ id: loc.id, name: loc.name });
            if (loc.parent)
              setSelectedProvince({ id: loc.parent.id, name: loc.parent.name });
          } else {
            setSelectedProvince(null);
            setSelectedDistrict(null);
          }
          return;
        }

        // Fallback: try to search by human-readable location text
        if (filters.location) {
          try {
            const res = await LocationService.search({
              search: filters.location,
              limit: 1,
            });
            const hits = res?.data || [];
            const loc = Array.isArray(hits) && hits.length ? hits[0] : null;
            if (!mounted) return;
            if (!loc) {
              setSelectedProvince(null);
              setSelectedDistrict(null);
              return;
            }
            if (loc.type === "province") {
              setSelectedProvince({ id: loc.id, name: loc.name });
              setSelectedDistrict(null);
            } else if (loc.type === "district") {
              setSelectedDistrict({ id: loc.id, name: loc.name });
              if (loc.parent)
                setSelectedProvince({
                  id: loc.parent.id,
                  name: loc.parent.name,
                });
            }
            return;
          } catch (e) {
            // If search fails, clear selection safely
            console.warn(
              "Location search failed while initializing filters",
              e
            );
            setSelectedProvince(null);
            setSelectedDistrict(null);
            return;
          }
        }

        // No location provided - clear selection
        setSelectedProvince(null);
        setSelectedDistrict(null);
      } catch (err) {
        console.error("Failed to initialize location from filters", err);
      }
    };

    initFromFilters();
    return () => {
      mounted = false;
    };
  }, [filters.locationId, filters.location]);

  // Salary presets (shared with other components)
  const SALARY_PRESETS = [
    { label: "Dưới 10M", min: 0, max: 10000000 },
    { label: "10M - 20M", min: 10000000, max: 20000000 },
    { label: "20M - 30M", min: 20000000, max: 30000000 },
    { label: "30M - 50M", min: 30000000, max: 50000000 },
    { label: "50M - 100M", min: 50000000, max: 100000000 },
    { label: "Trên 100M", min: 100000000, max: 200000000 },
  ];

  return (
    <aside className="job-filters-sidebar" aria-label="Job filters">
      <div className="sidebar-header">
        <div className="header-icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" />
            <path d="M3 6l9 9 9-9" />
          </svg>
        </div>
        <div className="header-content">
          <h3>Lọc công việc</h3>
          <p>Tìm công việc phù hợp nhất với bạn.</p>
        </div>
      </div>

      {/* Location */}
      <div className="filter-section">
        <div className="section-header">
          <div className="section-icon">
            <LocationIcon />
          </div>
          <div className="section-label">Địa điểm</div>
          {(selectedProvince || selectedDistrict) && (
            <div className="section-indicator active"></div>
          )}
        </div>
        <div className="section-content">
          <LocationSelector
            selectedProvince={selectedProvince}
            selectedDistrict={selectedDistrict}
            onProvinceChange={(province) => {
              setSelectedProvince(province);
              // Update location filter with province name or ID
              onFilterChange("location", province ? province.name : "");
              // Also update locationId if you want to use ID-based filtering
              onFilterChange("locationId", province ? province.id : null);
            }}
            onDistrictChange={(district) => {
              setSelectedDistrict(district);
              // Update location filter with district name for display/UI purposes
              // Location is now handled via locationId filter only (not text search)
              const locationText = district
                ? `${selectedProvince?.name || ""}, ${district.name}`.trim()
                : selectedProvince?.name || "";
              onFilterChange("location", locationText);
              // Prefer exact district id filtering when available; fall back to province id when district cleared
              if (district && district.id) {
                onFilterChange("locationId", district.id);
              } else {
                onFilterChange(
                  "locationId",
                  selectedProvince ? selectedProvince.id : null
                );
              }
            }}
          />
        </div>
      </div>

      {/* Job Type */}
      <div className="filter-section">
        <div className="section-header">
          <div className="section-icon">
            <JobTypeIcon />
          </div>
          <div className="section-label">Loại công việc</div>
          {filters.jobType && <div className="section-indicator active"></div>}
        </div>
        <div className="section-content">
          <div className="pill-grid" role="group" aria-label="Loại công việc">
            {JOB_TYPES.map((type) => {
              const active = filters.jobType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  className={`pill${active ? " pill--active" : ""}`}
                  onClick={() =>
                    onFilterChange("jobType", active ? "" : type.value)
                  }
                  aria-pressed={active}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Experience Level */}
      <div className="filter-section">
        <div className="section-header">
          <div className="section-icon">
            <ExperienceIcon />
          </div>
          <div className="section-label">Kinh nghiệm</div>
          {filters.experienceLevel !== null &&
            filters.experienceLevel !== undefined && (
              <div className="section-indicator active"></div>
            )}
        </div>
        <div className="section-content">
          <div className="select-wrapper">
            <select
              value={filters.experienceLevel || ""}
              onChange={(e) =>
                onFilterChange(
                  "experienceLevel",
                  e.target.value === "" ? null : parseInt(e.target.value, 10)
                )
              }
              className="filter-select"
              aria-label="Mức kinh nghiệm"
            >
              {EXPERIENCE_LEVELS.map((level) => (
                <option key={level.value} value={level.value || ""}>
                  {level.label}
                </option>
              ))}
            </select>
            <div className="select-arrow">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Salary Range */}
      <div className="filter-section">
        <div className="section-header">
          <div className="section-icon">
            <SalaryIcon />
          </div>
          <div className="section-label">Mức lương</div>
          {(filters.salaryMin || filters.salaryMax) && (
            <div className="section-indicator active"></div>
          )}
        </div>
        <div className="section-content">
          <div className="salary-wrapper">
            <div
              className="preset-buttons"
              role="list"
              aria-label="Khoảng lương nhanh"
            >
              <button
                type="button"
                className={`preset-btn ${
                  !filters.salaryMin && !filters.salaryMax ? "active" : ""
                }`}
                onClick={() => {
                  onFilterChange("salaryMin", null);
                  onFilterChange("salaryMax", null);
                }}
                aria-pressed={!filters.salaryMin && !filters.salaryMax}
              >
                Tất cả
              </button>
              {SALARY_PRESETS.map((p, i) => {
                const active =
                  (filters.salaryMin || 0) === p.min &&
                  (filters.salaryMax || 0) === p.max;
                return (
                  <button
                    key={i}
                    type="button"
                    className={`preset-btn ${active ? "active" : ""}`}
                    onClick={() => {
                      onFilterChange("salaryMin", p.min);
                      onFilterChange("salaryMax", p.max);
                    }}
                    aria-pressed={active}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
