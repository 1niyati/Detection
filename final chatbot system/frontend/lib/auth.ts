export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "analyst" | "viewer"
  department: string
  lastLogin?: Date
  isApproved: boolean
  createdAt: Date
  token?: string; // Add token to User interface
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  user?: User
  error?: string
  message?: string
  anomalyDetails?: {
    message: string
    reasons: string[]
  }
}

// Only admin has fixed credentials
const adminUser: User & { password: string } = {
  id: "admin_1",
  email: "admin@sentinelsoc.com",
  password: "admin123",
  name: "System Administrator",
  role: "admin",
  department: "SENTINEL SOC Administration",
  lastLogin: new Date(),
  isApproved: true,
  createdAt: new Date("2024-01-01"),
}

// Store for new signups (in real app, this would be a database)
const signupDatabase: (User & { password: string })[] = []

// Default role for new signups
const DEFAULT_ROLE = "analyst"
const DEFAULT_DEPARTMENT = "General"

export async function authenticateUser(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      // Check if the detailed anomaly object was passed from our API route
      if (data.anomalyDetails) {
        return {
          success: false,
          anomalyDetails: data.anomalyDetails,
        }
      }
      return {
        success: false,
        error: data.error || 'Login failed',
      };
    }

    return data;
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

export async function signupUser(signupData: SignupData): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signupData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Signup failed',
      };
    }

    return data;
  } catch (error) {
    console.error('Signup error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }
  return { isValid: true };
}

export function validateName(name: string): boolean {
  return name.trim().length >= 2
}

// Role-based access control - Only admin can access dashboard
export function canAccessDashboard(user: User): boolean {
  return user.role === "admin"
}

// SOC Team access control - Admin and Analyst can access SOC dashboard
export function canAccessSocDashboard(user: User): boolean {
  return user.role === "analyst"
}

// All authenticated users can access AI assistant
export function canAccessAIAnalyst(user: User): boolean {
  return ["admin", "analyst", "viewer"].includes(user.role)
}

export function canAccessProfile(user: User): boolean {
  return true // All authenticated users can access their profile
}

// Session management with improved security
export function saveUserSession(user: User): void {
  const sessionData = {
    user,
    timestamp: Date.now(),
    sessionId: generateSessionId(),
  }

  // Store in sessionStorage instead of localStorage for better security
  sessionStorage.setItem("sentinel_user", JSON.stringify(sessionData))

  // Also store the token separately for easy retrieval
  if (user.token) {
    sessionStorage.setItem("sentinel_token", user.token);
  }

  // Also set a shorter expiration time (2 hours instead of 24)
  const expirationTime = Date.now() + 2 * 60 * 60 * 1000 // 2 hours
  sessionStorage.setItem("sentinel_session_expires", expirationTime.toString())
}

export function getUserSession(): User | null {
  try {
    const userStr = sessionStorage.getItem("sentinel_user")
    const expirationStr = sessionStorage.getItem("sentinel_session_expires")

    if (!userStr || !expirationStr) return null

    // Check if session is expired
    const expirationTime = Number.parseInt(expirationStr)
    const now = Date.now()

    if (now > expirationTime) {
      clearUserSession()
      return null
    }

    const sessionData = JSON.parse(userStr)
    return sessionData.user
  } catch {
    clearUserSession()
    return null
  }
}

export function clearUserSession(): void {
  sessionStorage.removeItem("sentinel_user")
  sessionStorage.removeItem("sentinel_session_expires")
  localStorage.removeItem("sentinel_user") // Clean up any old localStorage data
  localStorage.removeItem("sentinel_session")
}

// Generate a unique session ID for better security
function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function getToken(): string | null {
  return sessionStorage.getItem("sentinel_token");
}

// Add function to check if session is still valid
export function isSessionValid(): boolean {
  const expirationStr = sessionStorage.getItem("sentinel_session_expires")
  if (!expirationStr) return false

  const expirationTime = Number.parseInt(expirationStr)
  return Date.now() < expirationTime
}

// Add function to extend session (optional - for active users)
export function extendSession(): void {
  const userStr = sessionStorage.getItem("sentinel_user")
  if (userStr && isSessionValid()) {
    const expirationTime = Date.now() + 2 * 60 * 60 * 1000 // Extend by 2 hours
    sessionStorage.setItem("sentinel_session_expires", expirationTime.toString())
  }
}
