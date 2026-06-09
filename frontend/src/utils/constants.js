export const statusMap = {
  applied: { label: '已投递', class: 'badge-blue' },
  screening: { label: '初筛中', class: 'badge-yellow' },
  screening_pass: { label: '初筛通过', class: 'badge-green' },
  screening_fail: { label: '初筛不通过', class: 'badge-red' },
  screening_pending: { label: '初筛待定', class: 'badge-yellow' },
  interview_first: { label: '一面中', class: 'badge-blue' },
  interview_second: { label: '二面中', class: 'badge-blue' },
  interview_third: { label: '三面中', class: 'badge-blue' },
  interview_hr: { label: 'HR面中', class: 'badge-blue' },
  interview_pass: { label: '面试通过', class: 'badge-green' },
  interview_fail: { label: '面试不通过', class: 'badge-red' },
  offer: { label: 'Offer阶段', class: 'badge-yellow' },
  offer_accepted: { label: 'Offer已接受', class: 'badge-green' },
  offer_declined: { label: 'Offer已拒绝', class: 'badge-red' },
  offer_negotiating: { label: 'Offer谈判中', class: 'badge-yellow' },
  hired: { label: '已入职', class: 'badge-green' },
}

export const interviewRoundMap = {
  first_tech: '一面（技术）',
  second_tech: '二面（技术）',
  third_tech: '三面（技术）',
  hr: 'HR面',
}

export const offerStatusMap = {
  draft: { label: '草稿', class: 'badge-gray' },
  sent: { label: '已发送', class: 'badge-blue' },
  accepted: { label: '已接受', class: 'badge-green' },
  declined: { label: '已拒绝', class: 'badge-red' },
  counter_offer: { label: '还价中', class: 'badge-yellow' },
  locked: { label: '已锁定', class: 'badge-green' },
}

export const sourceChannelMap = {
  email: '邮箱投递',
  recruitment_platform: '招聘平台',
  referral: '内推',
}
