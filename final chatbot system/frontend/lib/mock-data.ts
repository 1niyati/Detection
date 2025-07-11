export interface LoginRecord {
  id: string
  userId: string
  username: string
  timestamp: Date
  ipAddress: string
  location: string
  device: string
  userAgent: string
  success: boolean
  riskScore: number
  riskLevel: "Low" | "Medium" | "High"
  anomalyFlags: string[]
  bankName?: string
  accountType?: string
}

export interface SecurityMetrics {
  totalLogins: number
  suspiciousActivities: number
  highRiskUsers: number
  activeThreats: number
  successRate: number
  avgRiskScore: number
}

const locations = [
  "Kathmandu, Nepal",
  "Lalitpur, Nepal",
  "Bhaktapur, Nepal",
  "Pokhara, Nepal",
  "Chitwan, Nepal",
  "Biratnagar, Nepal",
  "New Delhi, India",
  "Mumbai, India",
  "Dubai, UAE",
  "Singapore",
  "Unknown Location",
]

const bankNames = [
  "Nepal Investment Bank",
  "Kumari Bank",
  "Prabhu Bank",
  "Nepal SBI Bank",
  "Standard Chartered Bank Nepal",
  "Himalayan Bank",
  "NIC Asia Bank",
  "Global IME Bank",
  "Rastriya Banijya Bank",
  "Nepal Bank Limited",
]

const accountTypes = [
  "Savings Account",
  "Current Account",
  "Fixed Deposit",
  "Credit Card",
  "Mobile Banking",
  "Internet Banking",
  "Corporate Account",
  "Staff Account",
]

const devices = ["Windows Desktop", "MacBook Pro", "iPhone 15", "Android Phone", "iPad", "Linux Server", "ATM Terminal"]
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
]

function generateRandomIP(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
}

function calculateRiskScore(record: Partial<LoginRecord>): {
  score: number
  level: "Low" | "Medium" | "High"
  flags: string[]
} {
  let score = 0
  const flags: string[] = []

  // Time-based risk (unusual hours for banking)
  const hour = new Date(record.timestamp!).getHours()
  if (hour < 6 || hour > 22) {
    score += 25
    flags.push("Unusual banking hours")
  }

  // Location-based risk for Nepal banking
  if (record.location?.includes("India") || record.location?.includes("Unknown")) {
    score += 30
    flags.push("High-risk location for Nepal banking")
  }

  // Failed login attempts
  if (!record.success) {
    score += 40
    flags.push("Failed authentication attempt")
  }

  // Device consistency
  if (Math.random() < 0.1) {
    score += 20
    flags.push("New device detected")
  }

  // Multiple rapid logins (common in financial fraud)
  if (Math.random() < 0.08) {
    score += 35
    flags.push("Rapid successive login attempts")
  }

  // ATM/Terminal access outside normal hours
  if (record.device?.includes("ATM") && (hour < 6 || hour > 23)) {
    score += 30
    flags.push("ATM access outside normal hours")
  }

  // Corporate account access from personal devices
  if (record.accountType?.includes("Corporate") && record.device?.includes("iPhone")) {
    score += 25
    flags.push("Corporate account accessed from personal device")
  }

  const level = score >= 60 ? "High" : score >= 30 ? "Medium" : "Low"
  return { score: Math.min(score, 100), level, flags }
}

export function generateMockLoginData(count = 1000): LoginRecord[] {
  const records: LoginRecord[] = []
  const usernames = [
    "rajesh.shrestha",
    "sita.pradhan",
    "amit.gurung",
    "priya.sharma",
    "deepak.thapa",
    "sunita.rai",
    "admin.user",
    "bank.manager",
    "cashier.01",
    "loan.officer",
    "it.support",
    "security.admin",
  ]

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Last 7 days
    const username = usernames[Math.floor(Math.random() * usernames.length)]
    const success = Math.random() > 0.12 // 88% success rate (slightly lower for banking security)
    const bankName = bankNames[Math.floor(Math.random() * bankNames.length)]
    const accountType = accountTypes[Math.floor(Math.random() * accountTypes.length)]

    const baseRecord = {
      id: `login_${i}`,
      userId: `user_${username}`,
      username,
      timestamp,
      ipAddress: generateRandomIP(),
      location: locations[Math.floor(Math.random() * locations.length)],
      device: devices[Math.floor(Math.random() * devices.length)],
      userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
      success,
      bankName,
      accountType,
    }

    const risk = calculateRiskScore(baseRecord)

    records.push({
      ...baseRecord,
      riskScore: risk.score,
      riskLevel: risk.level,
      anomalyFlags: risk.flags,
    })
  }

  return records.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

export function calculateSecurityMetrics(loginData: LoginRecord[]): SecurityMetrics {
  const totalLogins = loginData.length
  const suspiciousActivities = loginData.filter((record) => record.riskLevel === "High").length
  const highRiskUsers = new Set(
    loginData.filter((record) => record.riskLevel === "High").map((record) => record.username),
  ).size
  const activeThreats = loginData.filter((record) => record.anomalyFlags.length > 1).length
  const successfulLogins = loginData.filter((record) => record.success).length
  const successRate = (successfulLogins / totalLogins) * 100
  const avgRiskScore = loginData.reduce((sum, record) => sum + record.riskScore, 0) / totalLogins

  return {
    totalLogins,
    suspiciousActivities,
    highRiskUsers,
    activeThreats,
    successRate,
    avgRiskScore,
  }
}
