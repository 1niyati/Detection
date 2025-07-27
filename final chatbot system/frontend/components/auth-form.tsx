"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle, User, Building, ArrowLeft } from "lucide-react"
import {
  authenticateUser,
  signupUser,
  validateEmail,
  validatePassword,
  validateName,
  type LoginCredentials,
  type SignupData,
  type User as UserType,
} from "@/lib/auth"

interface AuthFormProps {
  onAuthSuccess: (user: UserType) => void
  onBackToHome: () => void
}

export function AuthForm({ onAuthSuccess, onBackToHome }: AuthFormProps) {
  const [activeTab, setActiveTab] = useState("login")
  const [loginCredentials, setLoginCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  })
  const [signupData, setSignupData] = useState<SignupData>({
    name: "",
    email: "",
    password: ""
  } as SignupData)
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<{score: number; message: string} | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{
    [key: string]: string
  }>({})

  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLoginCredentials((prev) => ({ ...prev, [name]: value }))
    clearFieldError(name)
  }

  const handleSignupInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSignupData((prev) => ({ ...prev, [name]: value }))
    clearFieldError(name)
    
    // Check password strength in real-time
    if (name === 'password') {
      const result = validatePassword(value)
      if (!result.isValid) {
        setPasswordStrength({
          score: 0,
          message: result.message || 'Weak password'
        })
      } else {
        // Calculate password strength score (0-4)
        let score = 0
        if (value.length >= 10) score++
        if (/[A-Z]/.test(value)) score++
        if (/[a-z]/.test(value)) score++
        if (/[0-9]/.test(value)) score++
        if (/[^A-Za-z0-9]/.test(value)) score++
        
        const strengthMessages = [
          'Very Weak',
          'Weak',
          'Fair',
          'Good',
          'Strong',
          'Very Strong'
        ]
        
        setPasswordStrength({
          score,
          message: strengthMessages[Math.min(score, strengthMessages.length - 1)]
        })
      }
    }
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value)
    clearFieldError("confirmPassword")
  }



  const clearFieldError = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
    if (error) setError("")
    if (success) setSuccess("")
  }

  const validateLoginForm = (): boolean => {
    const errors: { [key: string]: string } = {}

    if (!loginCredentials.email) {
      errors.email = "Email is required"
    } else if (!validateEmail(loginCredentials.email)) {
      errors.email = "Please enter a valid email address"
    }

    if (!loginCredentials.password) {
      errors.password = "Password is required"
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateSignupForm = (): boolean => {
    const errors: { [key: string]: string } = {}

    if (!signupData.name) {
      errors.name = "Full name is required"
    } else if (!validateName(signupData.name)) {
      errors.name = "Name must be at least 2 characters"
    }

    if (!signupData.email) {
      errors.email = "Email is required"
    } else if (!validateEmail(signupData.email)) {
      errors.email = "Please enter a valid email address"
    }

    if (!signupData.password) {
      errors.password = "Password is required"
    } else {
      const passwordValidation = validatePassword(signupData.password)
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.message || "Password is not strong enough"
      }
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password"
    } else if (signupData.password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateLoginForm()) return

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await authenticateUser(loginCredentials)

      if (response.success && response.user) {
        onAuthSuccess(response.user)
      } else {
        setError(response.error || "Login failed")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateSignupForm()) return

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await signupUser(signupData)

      if (response.success) {
        setSuccess(response.message || "Account created successfully!")
        // Reset form
        setSignupData({ name: "", email: "", password: "" } as SignupData)
        setConfirmPassword("")
        // Switch to login tab after successful signup
        setTimeout(() => {
          setActiveTab("login")
          setSuccess("")
        }, 2000)
      } else {
        setError(response.error || "Signup failed")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back to Home Button */}
        <div className="flex justify-center">
          <Button
            onClick={onBackToHome}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-cyan-500 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Auth Card */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-700">
                <TabsTrigger value="login" className="data-[state=active]:bg-cyan-600">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-cyan-600">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {/* Info message about signup requirement */}
              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-blue-400 font-medium mb-1">New to SENTINEL SOC?</p>
                    <p className="text-slate-300 text-xs">
                      Security Analysts and Viewers must create an account first to access CyberBot AI Assistant. Only
                      administrators have pre-configured access.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                {error && (
                  <Alert className="border-red-500/50 bg-red-900/20 mb-4">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-400">{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-500/50 bg-green-900/20 mb-4">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-400">{success}</AlertDescription>
                  </Alert>
                )}
              </div>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="login-email" className="text-sm font-medium text-slate-300">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        id="login-email"
                        name="email"
                        type="email"
                        value={loginCredentials.email}
                        onChange={handleLoginInputChange}
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
                    <label htmlFor="login-password" className="text-sm font-medium text-slate-300">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        id="login-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={loginCredentials.password}
                        onChange={handleLoginInputChange}
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
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="signup-name" className="text-sm font-medium text-slate-300">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        id="signup-name"
                        name="name"
                        type="text"
                        value={signupData.name}
                        onChange={handleSignupInputChange}
                        placeholder="Enter your full name"
                        className={`pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-cyan-500 ${
                          fieldErrors.name ? "border-red-500 focus:border-red-500" : ""
                        }`}
                        disabled={isLoading}
                      />
                    </div>
                    {fieldErrors.name && (
                      <p className="text-sm text-red-400 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="signup-email" className="text-sm font-medium text-slate-300">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        value={signupData.email}
                        onChange={handleSignupInputChange}
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
                    <label htmlFor="signup-password" className="text-sm font-medium text-slate-300">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        id="signup-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={signupData.password}
                        onChange={handleSignupInputChange}
                        placeholder="Create a password"
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

                  <div className="space-y-2">
                    <label htmlFor="confirm-password" className="text-sm font-medium text-slate-300">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        id="confirm-password"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        placeholder="Confirm your password"
                        className={`pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-cyan-500 ${
                          fieldErrors.confirmPassword ? "border-red-500 focus:border-red-500" : ""
                        }`}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="text-sm text-red-400 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {fieldErrors.confirmPassword}
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
                        Creating Account...
                      </div>
                    ) : (
                      "Sign Up"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
