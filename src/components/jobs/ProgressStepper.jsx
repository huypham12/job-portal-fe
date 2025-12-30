import React from 'react'
import './ProgressStepper.css'

export function ProgressStepper({ steps, currentStep, className = '' }) {
  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentStep) return 'completed'
    if (stepIndex === currentStep) return 'active'
    return 'pending'
  }

  return (
    <div className={`progress-stepper ${className}`}>
      {steps.map((step, index) => {
        const status = getStepStatus(index)
        const isLast = index === steps.length - 1

        return (
          <React.Fragment key={index}>
            <div className={`step-item step-${status}`}>
              <div className="step-indicator">
                {status === 'completed' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <span className="step-number">{index + 1}</span>
                )}
              </div>
              <div className="step-content">
                <div className="step-title">{step.title}</div>
                {step.description && (
                  <div className="step-description">{step.description}</div>
                )}
              </div>
            </div>
            {!isLast && (
              <div className={`step-connector connector-${status}`}></div>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

