import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogIn, UserPlus, Sparkles } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 text-lg">Your journey starts here</p>
        </div>

        <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-800">Get Started</CardTitle>
            <CardDescription className="text-gray-600">Choose an option to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              asChild
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Link href="/login" className="flex items-center justify-center gap-2">
                <LogIn className="w-5 h-5" />
                Sign In to Account
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full h-12 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 transform hover:scale-105 bg-transparent"
            >
              <Link
                href="/signup"
                className="flex items-center justify-center gap-2 text-purple-700 hover:text-purple-800"
              >
                <UserPlus className="w-5 h-5" />
                Create New Account
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Secure • Fast • Reliable</p>
        </div>
      </div>
    </div>
  )
}
