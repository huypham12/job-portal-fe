import React from 'react';

/**
 * FieldCard - Card container for grouped form fields
 * Provides visual separation, consistent spacing, and optional header
 */
export function FieldCard({
  title,
  subtitle,
  children,
  className = '',
  icon,
  variant = 'default', // default, primary, secondary
  collapsible = false,
  collapsed = false,
  onToggleCollapse
}) {
  const [isCollapsed, setIsCollapsed] = React.useState(collapsed);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
    onToggleCollapse?.(!isCollapsed);
  };

  const cardClasses = {
    default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    primary: 'bg-blue-50 border border-blue-200 rounded-lg shadow-sm',
    secondary: 'bg-gray-50 border border-gray-200 rounded-lg shadow-sm'
  };

  const headerClasses = {
    default: 'text-gray-900',
    primary: 'text-blue-900',
    secondary: 'text-gray-900'
  };

  return (
    <div className={`${cardClasses[variant]} overflow-hidden ${className}`}>
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {icon && (
                <div className="flex-shrink-0 w-6 h-6 text-gray-400">
                  {icon}
                </div>
              )}
              <div>
                {title && (
                  <h3 className={`text-lg font-semibold ${headerClasses[variant]}`}>
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-sm text-gray-600 mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            {collapsible && (
              <button
                type="button"
                onClick={handleToggle}
                className="flex-shrink-0 w-6 h-6 text-gray-400 hover:text-gray-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
                aria-expanded={!isCollapsed}
              >
                <svg
                  className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      <div className={`px-6 py-4 ${isCollapsed ? 'hidden' : ''}`}>
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * FieldGroup - Groups related fields within a card
 */
export function FieldGroup({ title, children, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {title && (
        <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wider">
          {title}
        </h4>
      )}
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

/**
 * FieldRow - Horizontal layout for related fields
 */
export function FieldRow({ children, className = '' }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {children}
    </div>
  );
}
