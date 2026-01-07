import React from 'react';

/**
 * QuickActionsBar - Top/bottom action bar with shortcuts and status
 * Provides quick access to common actions and keyboard shortcuts
 */
export function QuickActionsBar({
  actions = [],
  shortcuts = [],
  lastSaved,
  isSaving = false,
  className = '',
  position = 'top' // 'top' or 'bottom'
}) {
  return (
    <div className={`flex items-center justify-between py-3 px-4 bg-gray-50 border-b border-gray-200 ${className}`}>
      {/* Left side - Status */}
      <div className="flex items-center space-x-4">
        {lastSaved && (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Saved {lastSaved.toLocaleTimeString('vi-VN')}
          </div>
        )}
        {isSaving && (
          <div className="flex items-center text-sm text-gray-600">
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 mr-1"></div>
            Saving...
          </div>
        )}
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center space-x-2">
        {/* Keyboard shortcuts hint */}
        {shortcuts.length > 0 && (
          <div className="hidden md:flex items-center space-x-1 mr-4">
            {shortcuts.map((shortcut, index) => (
              <React.Fragment key={shortcut.key}>
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 border border-gray-300 rounded">
                  {shortcut.key}
                </kbd>
                <span className="text-xs text-gray-600">{shortcut.label}</span>
                {index < shortcuts.length - 1 && (
                  <span className="text-xs text-gray-400 mx-1">•</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {actions.map((action, index) => (
          <button
            key={index}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className={`
              inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
              ${action.variant === 'primary'
                ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
                : action.variant === 'outline'
                ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 disabled:text-gray-400'
              }
            `}
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * KeyboardShortcutHint - Individual keyboard shortcut display
 */
export function KeyboardShortcutHint({ shortcut, label, className = '' }) {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 border border-gray-300 rounded">
        {shortcut}
      </kbd>
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
}
