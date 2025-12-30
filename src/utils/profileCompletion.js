/**
 * Tính phần trăm hoàn thành profile dựa trên 8 trường cơ bản
 * @param {Object} profileData - Profile data (có thể là raw profile hoặc formatted data từ API)
 * @returns {Object} - { percentage: number, details: Object, missingItems: Array, isComplete: boolean }
 */
export function calculateProfileCompletion(profileData) {
  if (!profileData) {
    return {
      percentage: 0,
      details: {
        fullName: false,
        contact: false,
        bio: false,
        headline: false,
        location: false,
        desiredJobTitle: false,
        yearsOfExperience: false,
        avatar: false,
      },
      missingItems: [
        'Họ và tên',
        'Email hoặc số điện thoại',
        'Giới thiệu bản thân',
        'Tiêu đề nghề nghiệp',
        'Địa điểm',
        'Vị trí mong muốn',
        'Số năm kinh nghiệm',
        'Ảnh đại diện',
      ],
      isComplete: false,
    }
  }

  // Normalize dữ liệu từ API format (có sections) sang format chuẩn
  let profile = profileData
  if (profileData.sections) {
    const sections = profileData.sections
    profile = {
      full_name: sections.personal_info?.data?.full_name,
      email: sections.personal_info?.data?.email,
      phone_number: sections.personal_info?.data?.phone,
      bio: sections.personal_info?.data?.bio,
      headline: sections.personal_info?.data?.headline,
      location_id: sections.personal_info?.data?.location_id,
      desired_job_title: sections.personal_info?.data?.desired_job_title,
      years_of_experience: sections.personal_info?.data?.years_of_experience,
      avatar_url: sections.personal_info?.data?.avatar_url,
      users: profileData.users || (sections.personal_info?.data?.email ? { email: sections.personal_info.data.email } : null),
    }
  }

  let score = 0
  const details = {}
  const missingItems = []

  // Full name (15%)
  if (profile.full_name?.trim()) {
    score += 15
    details.fullName = true
  } else {
    details.fullName = false
    missingItems.push('Họ và tên')
  }

  // Email hoặc Phone (15%)
  const hasEmail = profile.email || profile.users?.email
  const hasPhone = profile.phone_number?.trim()
  if (hasEmail || hasPhone) {
    score += 15
    details.contact = true
  } else {
    details.contact = false
    missingItems.push('Email hoặc số điện thoại')
  }

  // Bio (10%)
  if (profile.bio?.trim()) {
    score += 10
    details.bio = true
  } else {
    details.bio = false
    missingItems.push('Giới thiệu bản thân')
  }

  // Headline (15%)
  if (profile.headline?.trim()) {
    score += 15
    details.headline = true
  } else {
    details.headline = false
    missingItems.push('Tiêu đề nghề nghiệp')
  }

  // Location (10%)
  if (profile.location_id?.trim()) {
    score += 10
    details.location = true
  } else {
    details.location = false
    missingItems.push('Địa điểm')
  }

  // Desired Job Title (10%)
  if (profile.desired_job_title?.trim()) {
    score += 10
    details.desiredJobTitle = true
  } else {
    details.desiredJobTitle = false
    missingItems.push('Vị trí mong muốn')
  }

  // Years of Experience (10%)
  // Chấp nhận giá trị 0 (người mới ra trường) là hợp lệ
  const yearsExp = profile.years_of_experience
  if (yearsExp !== null && yearsExp !== undefined && yearsExp !== '' && !isNaN(Number(yearsExp))) {
    score += 10
    details.yearsOfExperience = true
  } else {
    details.yearsOfExperience = false
    missingItems.push('Số năm kinh nghiệm')
  }

  // Avatar (15%)
  // Kiểm tra avatar_url từ profile hoặc từ users.profile.avatar_url
  const avatarUrl = profile.avatar_url || profile.users?.profile?.avatar_url
  if (avatarUrl?.trim()) {
    score += 15
    details.avatar = true
  } else {
    details.avatar = false
    missingItems.push('Ảnh đại diện')
  }

  return {
    percentage: score,
    details,
    missingItems,
    isComplete: score === 100,
  }
}
