import React from 'react';

/**
 * LoadingSkeleton - Animated skeleton loading component
 * Provides visual feedback during loading states
 */
export function LoadingSkeleton({
  width = '100%',
  height = '1rem',
  className = '',
  variant = 'default', // default, circle, rounded
  lines = 1,
  ...props
}) {
  const baseClasses = 'animate-pulse bg-gray-200';

  const variantClasses = {
    default: '',
    circle: 'rounded-full',
    rounded: 'rounded-md'
  };

  if (lines > 1) {
    return (
      <div className={`space-y-2 ${className}`} {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${variantClasses[variant]}`}
            style={{
              width: index === lines - 1 ? '60%' : width,
              height
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
      {...props}
    />
  );
}

/**
 * FormFieldSkeleton - Skeleton for form fields
 */
export function FormFieldSkeleton({ className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <LoadingSkeleton width="120px" height="14px" />
      <LoadingSkeleton height="42px" variant="rounded" />
    </div>
  );
}

/**
 * CardSkeleton - Skeleton for card components
 */
export function CardSkeleton({ className = '' }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 space-y-4 ${className}`}>
      <div className="flex items-center space-x-3">
        <LoadingSkeleton width="24px" height="24px" variant="circle" />
        <LoadingSkeleton width="150px" height="20px" />
      </div>
      <div className="space-y-3">
        <FormFieldSkeleton />
        <FormFieldSkeleton />
        <LoadingSkeleton width="80px" height="36px" variant="rounded" />
      </div>
    </div>
  );
}

/**
 * ListItemSkeleton - Skeleton for list items
 */
export function ListItemSkeleton({ className = '' }) {
  return (
    <div className={`border border-gray-200 rounded-lg p-4 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <LoadingSkeleton width="60px" height="20px" variant="rounded" />
          <LoadingSkeleton width="80px" height="20px" variant="rounded" />
        </div>
        <div className="flex space-x-2">
          <LoadingSkeleton width="32px" height="32px" variant="rounded" />
          <LoadingSkeleton width="32px" height="32px" variant="rounded" />
        </div>
      </div>
      <LoadingSkeleton width="200px" height="18px" />
      <LoadingSkeleton width="150px" height="14px" />
    </div>
  );
}

/**
 * JobFormSkeleton - Skeleton for the entire job posting form
 */
export function JobFormSkeleton({ className = '' }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header skeleton */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <LoadingSkeleton width="250px" height="28px" />
          <div className="flex space-x-2">
            <LoadingSkeleton width="80px" height="36px" variant="rounded" />
            <LoadingSkeleton width="90px" height="36px" variant="rounded" />
          </div>
        </div>
        <div className="flex space-x-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <LoadingSkeleton key={index} width="120px" height="40px" variant="rounded" />
          ))}
        </div>
      </div>

      {/* Progress skeleton */}
      <CardSkeleton />

      {/* Form content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="space-y-6">
          <CardSkeleton />
          <ListItemSkeleton />
          <ListItemSkeleton />
        </div>
      </div>
    </div>
  );
}
