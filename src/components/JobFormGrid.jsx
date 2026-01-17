import React from 'react';

/**
 * JobFormGrid - Responsive grid container for job posting form
 * Provides consistent spacing and layout for form sections
 */
export function JobFormGrid({ children, className = '' }) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 ${className}`}>
      {children}
    </div>
  );
}

/**
 * JobFormSection - Container for each tab/section content
 * Handles responsive layout and consistent spacing
 */
export function JobFormSection({ children, className = '' }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {children}
    </div>
  );
}

/**
 * JobFormColumn - Left/right column container within the grid
 */
export function JobFormColumn({ children, className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {children}
    </div>
  );
}
