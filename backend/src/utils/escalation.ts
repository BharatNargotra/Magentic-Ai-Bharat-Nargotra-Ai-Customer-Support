interface EscalationRule {
  keyword: string
  priority: string
}

interface EscalationResult {
  shouldEscalate: boolean
  priority: string
  matchedKeyword?: string
}

const defaultRules: EscalationRule[] = [
  { keyword: 'refund', priority: 'HIGH' },
  { keyword: 'cancel', priority: 'MEDIUM' },
  { keyword: 'legal', priority: 'URGENT' },
  { keyword: 'lawsuit', priority: 'URGENT' },
  { keyword: 'fraud', priority: 'URGENT' },
  { keyword: 'payment failed', priority: 'HIGH' },
  { keyword: 'outage', priority: 'HIGH' },
  { keyword: 'speak to a human', priority: 'HIGH' },
  { keyword: 'speak to someone', priority: 'HIGH' },
  { keyword: 'real person', priority: 'HIGH' },
  { keyword: 'angry', priority: 'HIGH' },
  { keyword: 'unacceptable', priority: 'MEDIUM' },
]

export function detectEscalation(text: string, customRules: EscalationRule[] = []): EscalationResult {
  const allRules = [...defaultRules, ...customRules]
  const lower = text.toLowerCase()

  const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
  let highestPriority = 0
  let matchedKeyword: string | undefined
  let shouldEscalate = false

  for (const rule of allRules) {
    if (lower.includes(rule.keyword.toLowerCase())) {
      const priority = priorityOrder[rule.priority as keyof typeof priorityOrder] || 2
      if (priority > highestPriority) {
        highestPriority = priority
        matchedKeyword = rule.keyword
        shouldEscalate = true
      }
    }
  }

  const priorityLabels = ['LOW', 'LOW', 'MEDIUM', 'HIGH', 'URGENT']
  return {
    shouldEscalate,
    priority: shouldEscalate ? priorityLabels[highestPriority] : 'LOW',
    matchedKeyword,
  }
}
