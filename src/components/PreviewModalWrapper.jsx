import React from 'react';

/**
 * PreviewModalWrapper - Presentational wrapper for job preview modal
 * Provides consistent modal styling and animations
 */
export function PreviewModalWrapper({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  size = 'large' // 'small', 'medium', 'large', 'xl'
}) {
  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`
            relative w-full ${sizeClasses[size]} bg-white rounded-lg shadow-xl
            transform transition-all duration-300 ease-out
            ${className}
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {children}
          </div>

          {/* Footer */}
          <div className="flex justify-end px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * PreviewSection - Consistent section styling within preview modal
 */
export function PreviewSection({ title, children, icon, className = '' }) {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        {icon && <span className="text-gray-400">{icon}</span>}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

/**
 * PreviewItem - Individual item within a preview section
 */
export function PreviewItem({ children, icon, className = '' }) {
  return (
    <div className={`flex items-start space-x-3 ${className}`}>
      {icon && (
        <span className="flex-shrink-0 text-gray-400 mt-0.5">
          {icon}
        </span>
      )}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
