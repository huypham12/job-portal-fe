import React from 'react'
import './Card.css'

export function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'medium',
  hover = false,
  onClick,
  ...props
}) {
  const baseClass = 'card-shared'
  const variantClass = `card-${variant}`
  const paddingClass = `card-padding-${padding}`
  const hoverClass = hover ? 'card-hover' : ''
  const clickableClass = onClick ? 'card-clickable' : ''
  
  const classes = [baseClass, variantClass, paddingClass, hoverClass, clickableClass, className]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(e)
        }
      } : undefined}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`card-header ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '', ...props }) {
  return (
    <div className={`card-body ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`card-footer ${className}`} {...props}>
      {children}
    </div>
  )
}

