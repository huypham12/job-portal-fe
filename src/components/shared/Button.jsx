import React from 'react'
import './Button.css'

export function Button({
  children,
  variant = 'default',
  size = 'medium',
  className = '',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  ...props
}) {
  const baseClass = 'btn-shared'
  const variantClass = `btn-${variant}`
  const sizeClass = `btn-${size}`
  const loadingClass = loading ? 'btn-loading' : ''
  
  const classes = [baseClass, variantClass, sizeClass, loadingClass, className]
    .filter(Boolean)
    .join(' ')

  const iconElement = icon && (
    <span className={`btn-icon btn-icon-${iconPosition}`}>
      {icon}
    </span>
  )

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {iconPosition === 'left' && iconElement}
      {loading ? (
        <span className="btn-spinner">
          <svg className="spinner" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="32" strokeDashoffset="32">
              <animate attributeName="stroke-dasharray" dur="1.5s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite"/>
              <animate attributeName="stroke-dashoffset" dur="1.5s" values="0;-16;-32;-32" repeatCount="indefinite"/>
            </circle>
          </svg>
        </span>
      ) : (
        children
      )}
      {iconPosition === 'right' && iconElement}
    </button>
  )
}

