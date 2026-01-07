import React from 'react';

/**
 * ProgressStepperPresentational - Presentational progress stepper
 * Shows completion progress across form steps
 */
export function ProgressStepperPresentational({
  steps = [],
  currentStep = 0,
  overallPercentage = undefined,
  className = ''
}) {
  // derive per-step progress from overallPercentage
  const perStepProgress = (() => {
    if (typeof overallPercentage !== 'number') {
      return steps.map((_, idx) => (idx < currentStep ? 100 : idx === currentStep ? 0 : 0));
    }
    const total = (overallPercentage / 100) * steps.length;
    const completed = Math.floor(total);
    const fraction = total - completed;
    return steps.map((_, idx) => {
      if (idx < completed) return 100;
      if (idx === completed) return Math.round(fraction * 100);
      return 0;
    });
  })();

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-3 ${className}`}>
      <div className="flex flex-col items-center">
        <div className="w-full mb-2 text-center">
          <h3 className="text-sm font-semibold text-gray-900">Tiến độ hoàn thành</h3>
          <div className="text-xs text-gray-600">Bước {currentStep + 1} / {steps.length}</div>
        </div>

        <div className="w-full overflow-x-auto">
          <div className="flex items-start gap-4">
            {steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              const prog = perStepProgress[index] || 0;

              return (
            <div key={index} className="flex flex-col items-center min-w-[110px]">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium mb-1
                  ${isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-sm">{index + 1}</span>
                )}
              </div>

              <div className="text-center">
                <div className={`text-sm font-medium ${isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-700'}`}>
                  {step.title}
                </div>
                {step.description && (
                  <div className="text-xs text-gray-500 mt-1 hidden md:block">
                    {step.description}
                  </div>
                )}
              </div>
            </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ProgressBar - Simple progress bar component
 */
export function ProgressBar({ percentage, className = '', showLabel = true }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600">
          <span>Completion</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
