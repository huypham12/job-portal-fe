import React, { useState, useEffect, useRef, useCallback } from "react";

const SALARY_RANGE = {
  min: 0,
  max: 200000000, // 200 triệu
  step: 1000000, // 1 triệu
  displayFormat: (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)}M`;
    }
    return value.toLocaleString("vi-VN");
  },
};

export const SalaryRangeSlider = ({
  value = { min: null, max: null },
  onChange,
  className = "",
  disabled = false,
}) => {
  // Allow setting initial range in the middle if no value provided
  const defaultMin = 10000000; // 10 triệu
  const defaultMax = 15000000; // 15 triệu

  const [localValue, setLocalValue] = useState({
    min: value.min !== null ? value.min : defaultMin,
    max: value.max !== null ? value.max : defaultMax,
  });
  const [isDragging, setIsDragging] = useState(null); // 'min' or 'max'
  const debounceTimeoutRef = useRef(null);

  useEffect(() => {
    setLocalValue({
      min: value.min !== null ? value.min : defaultMin,
      max: value.max !== null ? value.max : defaultMax,
    });
  }, [value, defaultMin, defaultMax]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Debounced onChange to prevent excessive re-renders
  const debouncedOnChange = useCallback(
    (newValue) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        onChange(newValue);
      }, 100); // 100ms debounce
    },
    [onChange]
  );

  const sliderMin = SALARY_RANGE.min;
  const sliderMax = SALARY_RANGE.max;

  const handleSliderChange = (e) => {
    const sliderValue = parseInt(e.target.value);
    const isMinSlider = e.target.classList.contains("min-slider");

    let newValue = { ...localValue };

    if (isMinSlider) {
      // Min slider - allow free movement, then validate
      newValue.min = sliderValue;

      // Ensure min doesn't exceed max after change
      if (newValue.min > newValue.max) {
        newValue.max = newValue.min;
      }
    } else {
      // Max slider - allow free movement, then validate
      newValue.max = sliderValue;

      // Ensure max doesn't go below min after change
      if (newValue.max < newValue.min) {
        newValue.min = newValue.max;
      }
    }

    // Update local state immediately for smooth UI
    setLocalValue(newValue);
    // Debounce parent updates to prevent excessive re-renders
    debouncedOnChange(newValue);
  };

  const formatDisplayValue = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(0)}M`;
    }
    return num.toLocaleString("vi-VN");
  };

  const getSliderValue = (val) => {
    return Math.max(sliderMin, Math.min(sliderMax, val || sliderMin));
  };

  // Allow full range for both sliders, validation happens in onChange handler
  const sliderMinRange = sliderMin;
  const sliderMaxRange = sliderMax;

  const minSliderValue = getSliderValue(localValue.min);
  const maxSliderValue = getSliderValue(localValue.max);

  return (
    <div className={`salary-range-slider ${className}`}>
      {/* Range display */}
      <div className="range-display-simple">
        <div className="range-header">
          <div className="range-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" />
              <path d="M3 6l9 9 9-9" />
            </svg>
          </div>
          <span className="range-label">Khoảng lương</span>
        </div>
        <div className="range-values-display">
          <span className="range-text">
            {formatDisplayValue(minSliderValue)} -{" "}
            {formatDisplayValue(maxSliderValue)}
          </span>
        </div>
      </div>

      {/* Dual range slider */}
      <div className="slider-container">
        <div
          className="slider-wrapper"
          onClick={(e) => {
            if (disabled) return;

            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            const clickValue = Math.round(
              sliderMin + percentage * (sliderMax - sliderMin)
            );

            // Determine which slider to move based on distance to click point
            const distanceToMin = Math.abs(clickValue - minSliderValue);
            const distanceToMax = Math.abs(clickValue - maxSliderValue);

            const isMinSlider = distanceToMin <= distanceToMax;
            const targetValue = isMinSlider ? clickValue : clickValue;

            let newValue = { ...localValue };

            if (isMinSlider) {
              newValue.min = Math.max(
                sliderMin,
                Math.min(sliderMax, targetValue)
              );
              if (newValue.min > newValue.max) {
                newValue.max = newValue.min;
              }
            } else {
              newValue.max = Math.max(
                sliderMin,
                Math.min(sliderMax, targetValue)
              );
              if (newValue.max < newValue.min) {
                newValue.min = newValue.max;
              }
            }

            setLocalValue(newValue);
            debouncedOnChange(newValue);
          }}
        >
          {/* Track background */}
          <div className="slider-track-bg"></div>

          {/* Selected range */}
          <div
            className="slider-track-active"
            style={{
              left: `${
                ((minSliderValue - sliderMin) / (sliderMax - sliderMin)) * 100
              }%`,
              width: `${
                ((maxSliderValue - minSliderValue) / (sliderMax - sliderMin)) *
                100
              }%`,
            }}
          ></div>

          {/* Min slider */}
          <input
            type="range"
            min={sliderMinRange}
            max={sliderMaxRange}
            step={SALARY_RANGE.step}
            value={minSliderValue}
            onChange={handleSliderChange}
            disabled={disabled || isDragging === "max"}
            className="slider-input min-slider"
            style={{
              zIndex: isDragging === "min" ? 10 : isDragging === "max" ? 4 : 5,
            }}
            onMouseDown={(e) => {
              setIsDragging("min");
              e.target.focus();
            }}
            onMouseUp={() => setIsDragging(null)}
            onTouchStart={(e) => {
              setIsDragging("min");
              e.target.focus();
            }}
            onTouchEnd={() => setIsDragging(null)}
          />

          {/* Max slider */}
          <input
            type="range"
            min={sliderMinRange}
            max={sliderMaxRange}
            step={SALARY_RANGE.step}
            value={maxSliderValue}
            onChange={handleSliderChange}
            disabled={disabled || isDragging === "min"}
            className="slider-input max-slider"
            style={{
              zIndex: isDragging === "max" ? 10 : isDragging === "min" ? 4 : 6,
            }}
            onMouseDown={(e) => {
              setIsDragging("max");
              e.target.focus();
            }}
            onMouseUp={() => setIsDragging(null)}
            onTouchStart={(e) => {
              setIsDragging("max");
              e.target.focus();
            }}
            onTouchEnd={() => setIsDragging(null)}
          />
        </div>

        {/* Slider labels */}
        <div className="slider-labels">
          <span className="slider-label min-label">
            {SALARY_RANGE.displayFormat(sliderMin)}
          </span>
          <span className="slider-label max-label">
            {SALARY_RANGE.displayFormat(sliderMax)}
          </span>
        </div>
      </div>

      {/* Custom styles will be added to CSS file */}
    </div>
  );
};

export default SalaryRangeSlider;
