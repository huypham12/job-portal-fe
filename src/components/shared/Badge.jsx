import React from 'react'
import './Badge.css'

export function Badge({
  children,
  variant = 'default',
  size = 'medium',
  className = '',
  icon,
  iconPosition = 'left',
  ...props
}) {
  const baseClass = 'badge-shared'
  const variantClass = `badge-${variant}`
  const sizeClass = `badge-${size}`
  
  const classes = [baseClass, variantClass, sizeClass, className]
    .filter(Boolean)
    .join(' ')

  const iconElement = icon && (
    <span className={`badge-icon badge-icon-${iconPosition}`}>
      {icon}
    </span>
  )

  return (
    <span className={classes} {...props}>
      {iconPosition === 'left' && iconElement}
      {children}
      {iconPosition === 'right' && iconElement}
    </span>
  )
}

