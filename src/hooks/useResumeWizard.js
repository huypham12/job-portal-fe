import { useState, useCallback, useEffect, useMemo } from 'react'

const STEPS = {
  METHOD: 1,
  TITLE: 2,
  TEMPLATE: 3,
  ADDITIONAL_INFO: 4,
  PREVIEW: 5,
  SETTINGS: 6,
}

const STEP_NAMES = {
  [STEPS.METHOD]: 'Từ hồ sơ',
  [STEPS.TITLE]: 'Đặt tên CV',
  [STEPS.TEMPLATE]: 'Chọn template',
  [STEPS.ADDITIONAL_INFO]: 'Thông tin bổ sung',
  [STEPS.PREVIEW]: 'Xem trước',
  [STEPS.SETTINGS]: 'Cài đặt',
}

export function useResumeWizard(initialStep = STEPS.METHOD) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [formData, setFormData] = useState({
    method: 'profile', // hiện chỉ hỗ trợ tạo từ profile
    title: '',
    theme: 'default',
    isDefault: false,
    isPublic: false,
    projects: [],
    languages: [],
    summary: '',
    references: [],
  })
  const [validation, setValidation] = useState({})
  const [draftSaved, setDraftSaved] = useState(false)
  const [isLoadingDraft, setIsLoadingDraft] = useState(true)

  // Load draft from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem('resume-create-draft')
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft)
        if (parsed.formData) {
          setFormData((prev) => ({
            ...prev,
            ...parsed.formData,
            // Ép về chế độ tạo từ hồ sơ, loại bỏ tạo thủ công
            method: 'profile',
          }))
        }
        if (parsed.step && parsed.step >= STEPS.METHOD && parsed.step <= STEPS.SETTINGS) {
          setCurrentStep(parsed.step)
        }
        setDraftSaved(true)
      } catch (e) {
        console.error('Failed to load draft:', e)
      }
    }
    setIsLoadingDraft(false)
  }, [])

  // Auto-save draft (chỉ khi không đang load draft)
  useEffect(() => {
    if (!isLoadingDraft) {
      const draft = {
        step: currentStep,
        formData,
      }
      localStorage.setItem('resume-create-draft', JSON.stringify(draft))
      setDraftSaved(true)
    }
  }, [currentStep, formData, isLoadingDraft])

  const updateFormData = useCallback((updates) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }, [])

  const setValidationError = useCallback((field, error) => {
    setValidation(prev => ({ ...prev, [field]: error }))
  }, [])

  const clearValidation = useCallback((field) => {
    if (field) {
      setValidation(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    } else {
      setValidation({})
    }
  }, [])

  const validateStep = useCallback((step) => {
    switch (step) {
      case STEPS.METHOD:
        return formData.method !== ''
      case STEPS.TITLE:
        if (!formData.title?.trim()) {
          setValidationError('title', 'Tên CV là bắt buộc')
          return false
        }
        if (formData.title.trim().length < 3) {
          setValidationError('title', 'Tên CV phải có ít nhất 3 ký tự')
          return false
        }
        clearValidation('title')
        return true
      case STEPS.TEMPLATE:
        return formData.theme !== ''
      case STEPS.PREVIEW:
        return true // Preview step không cần validation
      case STEPS.ADDITIONAL_INFO:
        return true // Additional info step không cần validation (tùy chọn)
      case STEPS.SETTINGS:
        return true // Settings step không cần validation
      default:
        return true
    }
  }, [formData, setValidationError, clearValidation])

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.SETTINGS) {
        setCurrentStep(prev => prev + 1)
      }
      return true
    }
    return false
  }, [currentStep, validateStep])

  const prevStep = useCallback(() => {
    if (currentStep > STEPS.METHOD) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const goToStep = useCallback((step) => {
    // Chỉ cho phép jump đến step đã complete hoặc step tiếp theo
    if (step <= currentStep + 1) {
      setCurrentStep(step)
    }
  }, [currentStep])

  const clearDraft = useCallback(() => {
    localStorage.removeItem('resume-create-draft')
    setDraftSaved(false)
  }, [])

  const getProgress = useCallback(() => {
    return ((currentStep - 1) / (STEPS.SETTINGS - 1)) * 100
  }, [currentStep])

  const isFirstStep = currentStep === STEPS.METHOD
  const isLastStep = currentStep === STEPS.SETTINGS
  // Use useMemo để tránh gọi validateStep mỗi lần render (vì nó có thể gây side effects)
  const canGoNext = useMemo(() => {
    switch (currentStep) {
      case STEPS.METHOD:
        return formData.method !== ''
      case STEPS.TITLE:
        return formData.title?.trim() && formData.title.trim().length >= 3
      case STEPS.TEMPLATE:
        return formData.theme !== ''
      case STEPS.PREVIEW:
        return true
      case STEPS.ADDITIONAL_INFO:
        return true
      case STEPS.SETTINGS:
        return true
      default:
        return true
    }
  }, [currentStep, formData.method, formData.title, formData.theme])
  const canGoPrev = !isFirstStep
  const totalSteps = STEPS.SETTINGS

  return {
    currentStep,
    formData,
    validation,
    draftSaved,
    STEPS,
    STEP_NAMES,
    totalSteps,
    updateFormData,
    setValidationError,
    clearValidation,
    nextStep,
    prevStep: prevStep,
    previousStep: prevStep,
    goToStep,
    validateStep,
    clearDraft,
    getProgress,
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoPrev,
  }
}
