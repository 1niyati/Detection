"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, Shield, Clock, Building } from "lucide-react"
import type { User as UserType } from "@/lib/auth"

interface UserProfileProps {
  user: UserType
  onLogout: () => void
}

export function UserProfile({ user, onLogout }: UserProfileProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-600"
      case "analyst":
        return "bg-blue-600"
      case "viewer":
        return "bg-green-600"
      default:
        return "bg-gray-600"
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="w-4 h-4" />
      case "analyst":
        return <User className="w-4 h-4" />
      case "viewer":
        return <User className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  // Ensure lastLogin is a proper Date instance
  const lastLoginDate = typeof user.lastLogin === "string" ? new Date(user.lastLogin) : (user.lastLogin ?? null)

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <User className="w-5 h-5 text-cyan-400 mr-2" />
          User Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar className="w-12 h-12 bg-cyan-600">
            <AvatarFallback className="bg-cyan-600 text-white font-semibold">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-white font-medium">{user.name}</h3>
            <p className="text-slate-400 text-sm">{user.email}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 text-sm">Role</span>
            <Badge className={`${getRoleColor(user.role)} text-white`}>
              {getRoleIcon(user.role)}
              <span className="ml-1 capitalize">{user.role}</span>
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-300 text-sm">Department</span>
            <div className="flex items-center text-slate-300 text-sm">
              <Building className="w-3 h-3 mr-1" />
              {user.department}
            </div>
          </div>

          {lastLoginDate && !isNaN(lastLoginDate.valueOf()) && (
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-sm">Last Login</span>
              <div className="flex items-center text-slate-300 text-sm">
                <Clock className="w-3 h-3 mr-1" />
                {lastLoginDate.toLocaleDateString()}{" "}
                {lastLoginDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-600">
          <Button
            onClick={onLogout}
            variant="outline"
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-red-500 hover:text-red-400 bg-transparent"
          >
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
