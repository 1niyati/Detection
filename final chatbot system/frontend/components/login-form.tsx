"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Shield, Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle } from "lucide-react"
import { authenticateUser, validateEmail, validatePassword, type LoginCredentials, type User } from "@/lib/auth"

interface LoginFormProps {
  onLoginSuccess: (user: User) => void
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
  }>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCredentials((prev) => ({ ...prev, [name]: value }))

    // Clear field-specific errors when user starts typing
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    }

    // Clear general error
    if (error) setError("")
  }

  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {}

    if (!credentials.email) {
      errors.email = "Email is required"
    } else if (!validateEmail(credentials.email)) {
      errors.email = "Please enter a valid email address"
    }

    if (!credentials.password) {
      errors.password = "Password is required"
    } else if (!validatePassword(credentials.password)) {
      errors.password = "Password must be at least 6 characters"
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setError("")

    try {
      const response = await authenticateUser(credentials)

      if (response.success && response.user) {
        onLoginSuccess(response.user)
      } else {
        setError(response.error || "Login failed")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const demoCredentials = [
    { email: "admin@sentinelsoc.com", password: "admin123", role: "Administrator" },
    { email: "analyst@sentinelsoc.com", password: "analyst123", role: "Security Analyst" },
    { email: "viewer@sentinelsoc.com", password: "viewer123", role: "Security Viewer" },
  ]

  const fillDemoCredentials = (email: string, password: string) => {
    setCredentials({ email, password })
    setFieldErrors({})
    setError("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">SENTINEL SOC</h1>
          <p className="text-slate-400">Secure Access Portal</p>
        </div>

        {/* Login Card */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-white text-center">Sign In</CardTitle>
            <CardDescription className="text-slate-400 text-center">
              Enter your credentials to access the security dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert className="border-red-500/50 bg-red-900/20">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={credentials.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className={`pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-cyan-500 ${
                      fieldErrors.email ? "border-red-500 focus:border-red-500" : ""
                    }`}
                    disabled={isLoading}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-sm text-red-400 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={credentials.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className={`pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-cyan-500 ${
                      fieldErrors.password ? "border-red-500 focus:border-red-500" : ""
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-sm text-red-400 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2.5"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Sign In
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-lg text-white">Demo Credentials</CardTitle>
            <CardDescription className="text-slate-400">Click any credential set to auto-fill the form</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoCredentials.map((cred, index) => (
              <div
                key={index}
                onClick={() => fillDemoCredentials(cred.email, cred.password)}
                className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600 hover:border-cyan-500/50 cursor-pointer transition-all group"
              >
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{cred.role}</p>
                  <p className="text-slate-400 text-xs">{cred.email}</p>
                </div>
                <Badge
                  variant="outline"
                  className="border-slate-500 text-slate-300 group-hover:border-cyan-400 group-hover:text-cyan-400"
                >
                  Click to use
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-slate-500 text-sm">
          <p>© 2024 SENTINEL SOC. All rights reserved.</p>
          <p className="mt-1">Secure • Reliable • Advanced</p>
        </div>
      </div>
    </div>
  )
}
