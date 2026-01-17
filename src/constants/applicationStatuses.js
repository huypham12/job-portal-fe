/**
 * Application Status Constants
 * Maps to backend ApplicationWorkflowState enum
 */

export const APPLICATION_STATUSES = {
  APPLIED: 'applied',
  REVIEWED: 'reviewed',
  INTERVIEWING: 'interviewing',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn'
}

export const STATUS_LABELS = {
  [APPLICATION_STATUSES.APPLIED]: 'Đơn mới nộp',
  [APPLICATION_STATUSES.REVIEWED]: 'Đã xem',
  [APPLICATION_STATUSES.INTERVIEWING]: 'Đang phỏng vấn',
  [APPLICATION_STATUSES.ACCEPTED]: 'Được chấp nhận',
  [APPLICATION_STATUSES.REJECTED]: 'Bị từ chối',
  [APPLICATION_STATUSES.WITHDRAWN]: 'Đã rút đơn'
}

export const STATUS_COLORS = {
  [APPLICATION_STATUSES.APPLIED]: 'default',
  [APPLICATION_STATUSES.REVIEWED]: 'info',
  [APPLICATION_STATUSES.INTERVIEWING]: 'warning',
  [APPLICATION_STATUSES.ACCEPTED]: 'success',
  [APPLICATION_STATUSES.REJECTED]: 'danger',
  [APPLICATION_STATUSES.WITHDRAWN]: 'default'
}

export const STATUS_CLASS = {
  [APPLICATION_STATUSES.APPLIED]: 'status-pill',
  [APPLICATION_STATUSES.REVIEWED]: 'status-pill info',
  [APPLICATION_STATUSES.INTERVIEWING]: 'status-pill interviewing',
  [APPLICATION_STATUSES.ACCEPTED]: 'status-pill success',
  [APPLICATION_STATUSES.REJECTED]: 'status-pill danger',
  [APPLICATION_STATUSES.WITHDRAWN]: 'status-pill'
}

/**
 * Allowed status transitions based on workflow state machine
 * Quy trình mới: APPLIED → REVIEWED → INTERVIEWING → ACCEPTED/REJECTED
 */
export const ALLOWED_TRANSITIONS = {
  [APPLICATION_STATUSES.APPLIED]: [APPLICATION_STATUSES.REVIEWED, APPLICATION_STATUSES.INTERVIEWING, APPLICATION_STATUSES.REJECTED],
  [APPLICATION_STATUSES.REVIEWED]: [APPLICATION_STATUSES.INTERVIEWING, APPLICATION_STATUSES.REJECTED],
  [APPLICATION_STATUSES.INTERVIEWING]: [APPLICATION_STATUSES.ACCEPTED, APPLICATION_STATUSES.REJECTED],
  [APPLICATION_STATUSES.ACCEPTED]: [], // Final state
  [APPLICATION_STATUSES.REJECTED]: [], // Final state
  [APPLICATION_STATUSES.WITHDRAWN]: [] // Final state (candidate action)
}

/**
 * Check if a status transition is allowed
 * @param {string} currentStatus - Current application status
 * @param {string} targetStatus - Target application status
 * @returns {boolean} - Whether the transition is allowed
 */
export function canTransition(currentStatus, targetStatus) {
  const allowedTargets = ALLOWED_TRANSITIONS[currentStatus] || []
  return allowedTargets.includes(targetStatus)
}

/**
 * Legacy status mapping for backward compatibility
 * Maps old status values to new workflow states
 */
export const LEGACY_STATUS_MAPPING = {
  'pending': APPLICATION_STATUSES.APPLIED,
  'reviewed': APPLICATION_STATUSES.REVIEWED,
  'under_review': APPLICATION_STATUSES.REVIEWED, // Map old under_review to new reviewed
  'interviewing': APPLICATION_STATUSES.INTERVIEWING,
  'offered': APPLICATION_STATUSES.ACCEPTED, // Legacy 'offered' maps to accepted
  'final_decision': APPLICATION_STATUSES.INTERVIEWING, // Map old final_decision to interviewing
  'accepted': APPLICATION_STATUSES.ACCEPTED,
  'rejected': APPLICATION_STATUSES.REJECTED,
  'withdrawn': APPLICATION_STATUSES.WITHDRAWN
}

/**
 * Normalize status value to ensure compatibility
 * @param {string} status - Status value from backend or frontend
 * @returns {string} - Normalized status value
 */
export function normalizeStatus(status) {
  if (!status) return APPLICATION_STATUSES.APPLIED

  // If it's already a new status, return as-is
  if (Object.values(APPLICATION_STATUSES).includes(status)) {
    return status
  }

  // If it's a legacy status, map it
  if (LEGACY_STATUS_MAPPING[status]) {
    console.warn(`Legacy status '${status}' detected, mapping to '${LEGACY_STATUS_MAPPING[status]}'`)
    return LEGACY_STATUS_MAPPING[status]
  }

  // Default fallback
  console.warn(`Unknown status '${status}', defaulting to 'applied'`)
  return APPLICATION_STATUSES.APPLIED
}

/**
 * Get user-friendly status messages for different contexts
 */
export const STATUS_MESSAGES = {
  [APPLICATION_STATUSES.APPLIED]: {
    candidate: "🔄 Đang chờ nhà tuyển dụng xem hồ sơ của bạn",
    recruiter: "Đơn ứng tuyển mới, cần xem xét"
  },
  [APPLICATION_STATUSES.REVIEWED]: {
    candidate: "👀 Hồ sơ đã được xem, chờ phản hồi tiếp theo",
    recruiter: "Đã xem xét đơn ứng tuyển"
  },
  [APPLICATION_STATUSES.INTERVIEWING]: {
    candidate: "🎯 Bạn đang trong quá trình phỏng vấn",
    recruiter: "Ứng viên đang trong giai đoạn phỏng vấn"
  },
  [APPLICATION_STATUSES.ACCEPTED]: {
    candidate: "✅ Chúc mừng! Bạn đã được chấp nhận.",
    recruiter: "Đơn ứng tuyển đã được chấp nhận"
  },
  [APPLICATION_STATUSES.REJECTED]: {
    candidate: "😔 Rất tiếc, hồ sơ của bạn chưa phù hợp. Đừng nản lòng!",
    recruiter: "Đơn ứng tuyển đã bị từ chối"
  },
  [APPLICATION_STATUSES.WITHDRAWN]: {
    candidate: "📝 Bạn đã rút đơn ứng tuyển này.",
    recruiter: "Ứng viên đã rút đơn"
  }
}
