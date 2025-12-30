import React from 'react'
import './Input.css'

export function Input({
  label,
  error,
  helperText,
  required,
  icon,
  iconPosition = 'left',
  className = '',
  maxLength,
  showCounter = false,
  ...props
}) {
  const hasError = !!error
  const currentLength = props.value?.toString().length || 0
  
  const inputClasses = [
    'input-shared',
    hasError && 'input-error',
    icon && `input-with-icon input-icon-${iconPosition}`,
    className
  ].filter(Boolean).join(' ')

  const iconElement = icon && (
    <span className={`input-icon-wrapper input-icon-${iconPosition}`}>
      {icon}
    </span>
  )

  return (
    <div className="input-field">
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      <div className="input-wrapper">
        {iconPosition === 'left' && iconElement}
        <input
          className={inputClasses}
          maxLength={maxLength}
          {...props}
        />
        {iconPosition === 'right' && iconElement}
        {showCounter && maxLength && (
          <span className="input-counter">
            {currentLength} / {maxLength}
          </span>
        )}
      </div>
      {error && (
        <span className="input-error-text">{error}</span>
      )}
      {helperText && !error && (
        <span className="input-helper">{helperText}</span>
      )}
    </div>
  )
}

export function Textarea({
  label,
  error,
  helperText,
  required,
  className = '',
  maxLength,
  showCounter = false,
  ...props
}) {
  const hasError = !!error
  const currentLength = props.value?.toString().length || 0
  
  const textareaClasses = [
    'textarea-shared',
    hasError && 'textarea-error',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className="input-field">
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      <div className="input-wrapper">
        <textarea
          className={textareaClasses}
          maxLength={maxLength}
          {...props}
        />
        {showCounter && maxLength && (
          <span className="input-counter">
            {currentLength} / {maxLength}
          </span>
        )}
      </div>
      {error && (
        <span className="input-error-text">{error}</span>
      )}
      {helperText && !error && (
        <span className="input-helper">{helperText}</span>
      )}
    </div>
  )
}

export function Select({
  label,
  error,
  helperText,
  required,
  options = [],
  className = '',
  ...props
}) {
  const hasError = !!error
  
  const selectClasses = [
    'select-shared',
    hasError && 'select-error',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className="input-field">
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      <div className="input-wrapper">
        <select className={selectClasses} {...props}>
          {(options && options.length > 0)
            ? options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            : props.children}
        </select>
      </div>
      {error && (
        <span className="input-error-text">{error}</span>
      )}
      {helperText && !error && (
        <span className="input-helper">{helperText}</span>
      )}
    </div>
  )
}

