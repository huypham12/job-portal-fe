export default function StepIndicator({ currentStep, totalSteps, stepNames, onStepClick, completedSteps = [] }) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1)

  const getStepStatus = (step) => {
    if (step < currentStep || completedSteps.includes(step)) {
      return 'completed'
    }
    if (step === currentStep) {
      return 'active'
    }
    return 'pending'
  }

  const canClickStep = (step) => {
    return step <= currentStep || completedSteps.includes(step)
  }

  return (
    <div className="resume-step-indicator">
      <div className="resume-step-indicator__progress">
        <div 
          className="resume-step-indicator__progress-bar"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>
      <div className="resume-step-indicator__steps">
        {steps.map((step) => {
          const status = getStepStatus(step)
          const stepName = stepNames[step] || `Bước ${step}`
          const clickable = canClickStep(step)

          return (
            <div
              key={step}
              className={`resume-step-indicator__step resume-step-indicator__step--${status} ${clickable ? 'resume-step-indicator__step--clickable' : ''}`}
              onClick={() => clickable && onStepClick && onStepClick(step)}
              title={stepName}
            >
              <div className="resume-step-indicator__step-number">
                {status === 'completed' ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M16.667 5L7.5 14.167 3.333 10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  step
                )}
              </div>
              <div className="resume-step-indicator__step-label">{stepName}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
