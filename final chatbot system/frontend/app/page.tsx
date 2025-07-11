"use client"

import { useState, useEffect } from "react"
import { LandingPage } from "@/components/landing-page"
import { AboutPage } from "@/components/about-page"
import { AuthForm } from "@/components/auth-form"
import { SecurityDashboard } from "@/components/security-dashboard"
import { AIChatbot } from "@/components/ai-chatbot"
import { UserProfile } from "@/components/user-profile"
import UsersPage from "@/components/users-page" // Corrected import
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, BarChart3, MessageSquare, User, Users as UsersIcon, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  getUserSession,
  saveUserSession,
  clearUserSession,
  canAccessDashboard,
  canAccessAIAnalyst,
  isSessionValid,
  type User as UserType,
} from "@/lib/auth"

export default function SentinelSOC() {
  const [user, setUser] = useState<UserType | null>(null)
  const [showLanding, setShowLanding] = useState(true)
  const [showAbout, setShowAbout] = useState(false)
  const [activeTab, setActiveTab] = useState("chat") // Default to chat for all users
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const existingUser = getUserSession()
    if (existingUser) {
      setUser(existingUser)
      setShowLanding(false)
      setShowAbout(false)
      // Set default tab based on user role - only admin gets dashboard
      setActiveTab(canAccessDashboard(existingUser) ? "dashboard" : "chat")
    }
    setIsLoading(false)
  }, [])

  // Add session validation effect after the existing useEffect
  useEffect(() => {
    // Check session validity every minute
    const sessionCheckInterval = setInterval(() => {
      if (user && !isSessionValid()) {
        // Session expired, log out user
        handleLogout()
        alert("Your session has expired. Please sign in again.")
      }
    }, 60000) // Check every minute

    // Cleanup interval on unmount
    return () => clearInterval(sessionCheckInterval)
  }, [user])

  // Add beforeunload event to clear session on browser close (optional)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Optionally clear session when browser is closed
      // Uncomment the line below if you want to force re-login on browser restart
      // clearUserSession()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  const handleAuthSuccess = (loggedInUser: UserType) => {
    setUser(loggedInUser)
    saveUserSession(loggedInUser)
    setShowLanding(false)
    setShowAbout(false)
    // Set default tab based on user role - only admin gets dashboard
    setActiveTab(canAccessDashboard(loggedInUser) ? "dashboard" : "chat")
  }

  const handleLogout = () => {
    setUser(null)
    clearUserSession()
    setShowLanding(true)
    setShowAbout(false)
    setActiveTab("chat")
  }

  const handleGetStarted = () => {
    setShowLanding(false)
    setShowAbout(false)
  }

  const handleLearnMore = () => {
    setShowAbout(true)
    setShowLanding(false)
  }

  const handleBackToHome = () => {
    setShowLanding(true)
    setShowAbout(false)
  }

  // Show loading spinner while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-cyan-400 mx-auto mb-4 animate-pulse" />
          <p className="text-white">Loading SENTINEL SOC...</p>
        </div>
      </div>
    )
  }

  // Show about page
  if (showAbout) {
    return <AboutPage onBack={handleBackToHome} />
  }

  // Show landing page
  if (showLanding) {
    return <LandingPage onGetStarted={handleGetStarted} onLearnMore={handleLearnMore} />
  }

  // Show auth form if not authenticated
  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} onBackToHome={handleBackToHome} />
  }

  // Get available tabs based on user role - only admin gets dashboard
  const availableTabs = [
    ...(canAccessDashboard(user) ? [{ id: "dashboard", label: "Dashboard", icon: BarChart3 }] : []),
    ...(canAccessDashboard(user) ? [{ id: "users", label: "User Management", icon: UsersIcon }] : []), // Add users tab for admin
    { id: "chat", label: "CyberBot", icon: MessageSquare },
    { id: "profile", label: "Profile", icon: User },
  ]

  // Show authenticated interface
  return (
    <div className="min-h-screen bg-slate-800 text-slate-100 flex flex-col font-sans">
      <header className="sticky top-0 z-50 border-b border-slate-700/60 bg-slate-800/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-500" />
            <span className="text-2xl font-bold text-slate-100">SENTINEL SOC</span>
            <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 text-xs hidden md:block">
              AI-Powered
            </Badge>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList className="bg-slate-700 border-slate-600">
                {availableTabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <tab.icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex items-center space-x-2 text-slate-300">
              <span className="text-sm">Welcome, {user.name.split(" ")[0]}</span>
              <Badge className="text-xs bg-slate-700 px-2 py-1 rounded capitalize">{user.role}</Badge>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="border-slate-600 bg-transparent">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-slate-900 border-slate-700">
                <div className="flex flex-col space-y-4 mt-8">
                  {availableTabs.map((tab) => (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? "default" : "ghost"}
                      onClick={() => setActiveTab(tab.id)}
                      className="justify-start"
                    >
                      <tab.icon className="w-4 h-4 mr-2" />
                      {tab.label}
                    </Button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto w-full h-full min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
          {canAccessDashboard(user) && (
            <TabsContent value="dashboard" className="mt-0 flex-1">
              <SecurityDashboard />
            </TabsContent>
          )}

          {canAccessDashboard(user) && (
            <TabsContent value="users" className="mt-0 flex-1">
              <UsersPage />
            </TabsContent>
          )}

          {canAccessAIAnalyst(user) && (
            <TabsContent value="chat" className="mt-0 flex-1 min-h-0 p-0">
              <div className="h-full w-full rounded-lg border border-slate-700/60 overflow-hidden">
                <AIChatbot />
              </div>
            </TabsContent>
          )}

          <TabsContent value="profile" className="mt-0 flex-1">
            <div className="max-w-md mx-auto">
              <UserProfile user={user} onLogout={handleLogout} />
            </div>
          </TabsContent>
        </Tabs>

        {/* Access Notice for Non-Admin Users */}
        {!canAccessDashboard(user) && (
          <div className="fixed bottom-4 right-4 max-w-sm">
            <Alert className="border-cyan-500/50 bg-cyan-900/20">
              <MessageSquare className="h-4 w-4 text-cyan-400" />
              <AlertDescription className="text-cyan-400 text-sm">
                Welcome {user.name.split(" ")[0]}! As a{" "}
                {user.role === "analyst" ? "Security Analyst" : "Security Viewer"}, you have full access to CyberBot AI
                Assistant for security analysis and support.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
