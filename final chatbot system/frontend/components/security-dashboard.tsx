"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Key,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  UserCheck,
  UserX,
  Download,
  RefreshCw,
  Activity,
  Calendar as CalendarIcon,
} from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { getUserSession } from "@/lib/auth"


interface AdminUser {
  id: string
  username?: string // Make username optional as it doesn't exist on the backend
  fullName: string
  email: string
  role: "admin" | "analyst" | "viewer"
  status: "active" | "pending" | "deactivated" | "suspended"
  lastLogin?: Date
  signupDate: Date
  anomaliesDetected: number
  twoFactorEnabled: boolean
  createdBy?: string
  department: string
  loginAttempts: number
}

interface Activity {
  user: string;
  action: string;
  time: string;
  type: string;
}

interface SocStats {
  loginAttempts24h: number;
  highRiskEvents: number;
  activeSessions: number;
  alertsPending: number;
}

export function SecurityDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    suspendedUsers: 0,
  })
  const [socStats, setSocStats] = useState<SocStats>({
    loginAttempts24h: 0,
    highRiskEvents: 0,
    activeSessions: 0,
    alertsPending: 0,
  });
  const [socDate, setSocDate] = useState<Date>(new Date())
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null)
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer",
  })

  const fetchUsers = async () => {
    // This is split out to be reusable
    const session = getUserSession()
    if (!session?.token) return
    const usersResponse = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${session.token}` },
    })
    if (usersResponse.ok) {
      const usersData = await usersResponse.json()
      const transformedUsers = usersData.map((user: any) => ({
        ...user,
        fullName: user.name, // Map `name` to `fullName`
        status: user.isApproved ? "active" : "pending", // Transform `isApproved` to `status`
      }))
      setUsers(transformedUsers)
    }
  }

  const fetchActivities = async () => {
    const session = getUserSession()
    if (!session?.token) return
    try {
      const response = await fetch("/api/admin/activities", {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }
      const data = await response.json();
      setRecentActivities(data);
    } catch (err) {
      // Not showing this error in the main error state to avoid blocking the whole dashboard
      console.error("Failed to fetch recent activities:", err);
    }
  };

  const fetchSocStats = async (date: Date) => {
    const session = getUserSession()
    if (!session?.token) return
    try {
      const dateString = date.toISOString().split("T")[0]
      const response = await fetch(`/api/admin/soc-stats?date=${dateString}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch SOC stats");
      }
      const data = await response.json();
      setSocStats(data);
    } catch (err) {
      console.error("Failed to fetch SOC stats:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      const session = getUserSession()
      if (!session?.token) {
        setError("Authentication token not found. Please log in again.")
        setIsLoading(false)
        return
      }

      try {
        // Fetch stats and users together initially
        const statsResponse = await fetch("/api/admin/dashboard-stats", {
          headers: { Authorization: `Bearer ${session.token}` },
        })

        if (!statsResponse.ok) {
          throw new Error("Failed to fetch dashboard stats.")
        }
        const statsData = await statsResponse.json()
        setStats(statsData)
        await fetchUsers() // fetch users
        await fetchActivities() // fetch activities
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    fetchSocStats(socDate)
  }, [socDate])

  const handleCreateUser = async () => {
    const session = getUserSession()
    if (!session?.token) {
      setError("Authentication token not found.")
      return
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(newUser),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create user.")
      }

      setIsNewUserDialogOpen(false)
      setNewUser({ name: "", email: "", password: "", role: "viewer" }) // Reset form
      await fetchUsers() // Refresh the user list
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          (user.fullName && user.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => user.status === statusFilter)
    }

    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    // Apply tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter((user) => user.status === activeTab)
    }

    setFilteredUsers(filtered)
  }, [users, searchQuery, statusFilter, roleFilter, activeTab])

  // Update bulk actions visibility
  useEffect(() => {
    setShowBulkActions(selectedUsers.length > 0)
  }, [selectedUsers])

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId])
    } else {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map((user) => user.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleUserAction = (user: AdminUser, action: string) => {
    switch (action) {
      case "view":
        setSelectedUser(user)
        setShowUserDetails(true)
        break
      case "edit":
        // TODO: Implement edit functionality
        console.log("Edit user:", user.id)
        break
      case "delete":
        setUserToDelete(user)
        setShowDeleteDialog(true)
        break
      case "reset-password":
        // TODO: Implement password reset
        console.log("Reset password for:", user.id)
        break
      case "approve":
        updateUserStatus(user.id, "active")
        break
      case "suspend":
        updateUserStatus(user.id, "suspended")
        break
      case "activate":
        updateUserStatus(user.id, "active")
        break
    }
  }

  const updateUserStatus = (userId: string, newStatus: AdminUser["status"]) => {
    setUsers(users.map((user) => (user.id === userId ? { ...user, status: newStatus } : user)))
  }

  const handleDeleteUser = () => {
    if (userToDelete) {
      setUsers(users.filter((user) => user.id !== userToDelete.id))
      setShowDeleteDialog(false)
      setUserToDelete(null)
    }
  }

  const handleBulkAction = (action: string) => {
    switch (action) {
      case "approve":
        selectedUsers.forEach((userId) => updateUserStatus(userId, "active"))
        break
      case "suspend":
        selectedUsers.forEach((userId) => updateUserStatus(userId, "suspended"))
        break
      case "delete":
        setUsers(users.filter((user) => !selectedUsers.includes(user.id)))
        break
    }
    setSelectedUsers([])
  }

  const getStatusBadge = (status: AdminUser["status"]) => {
    if (!status) {
      return <Badge>N/A</Badge>
    }
    const variants = {
      active: "bg-green-600",
      pending: "bg-yellow-600",
      deactivated: "bg-gray-600",
      suspended: "bg-red-600",
    }
    return (
      <Badge className={`${variants[status]} text-white`}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
    )
  }

  const getRoleBadge = (role: AdminUser["role"]) => {
    const variants = {
      admin: "bg-red-600",
      analyst: "bg-blue-600",
      viewer: "bg-green-600",
    }
    return <Badge className={`${variants[role]} text-white`}>{role.charAt(0).toUpperCase() + role.slice(1)}</Badge>
  }

  const getInitials = (name: string) => {
    if (!name) return ""
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const formatLastLogin = (date?: Date) => {
    if (!date) return "Never"
    const dateObj = typeof date === "string" ? new Date(date) : date
    const now = new Date()
    const diff = now.getTime() - dateObj.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const formatActivityTime = (date?: string | Date) => {
    if (!date) return "Never";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const pendingCount = stats.pendingUsers
  const activeCount = stats.activeUsers
  const suspendedCount = stats.suspendedUsers

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="ml-4 text-white">Loading Dashboard...</span>
                </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96">
        <AlertTriangle className="w-8 h-8 text-red-400" />
        <span className="ml-4 text-white">{error}</span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-slate-400">Manage SOC users, roles, and permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 bg-transparent">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={() => setIsNewUserDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-cyan-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active Users</p>
                <p className="text-2xl font-bold text-white">{stats.activeUsers}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Pending Approval</p>
                <p className="text-2xl font-bold text-white">{stats.pendingUsers}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Suspended</p>
                <p className="text-2xl font-bold text-white">{stats.suspendedUsers}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SOC Activity Overview for Admin */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-white flex items-center">
                <Activity className="w-5 h-5 text-cyan-400 mr-2" />
                SOC Activity Overview
              </CardTitle>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700 hover:text-white",
                      !socDate && "text-slate-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {socDate ? format(socDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-600 text-white" align="end">
                  <Calendar
                    mode="single"
                    selected={socDate}
                    onSelect={(date) => setSocDate(date || new Date())}
                    initialFocus
                    className="bg-slate-800"
                    classNames={{
                      day_selected: "bg-cyan-600 text-white hover:bg-cyan-700",
                      day_today: "bg-slate-700",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <CardDescription className="text-slate-400">Security operations center metrics for the selected day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                <div className="text-2xl font-bold text-cyan-400 mb-1">{socStats.loginAttempts24h}</div>
                <div className="text-slate-400 text-sm">Login Attempts</div>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                <div className="text-2xl font-bold text-red-400 mb-1">{socStats.highRiskEvents}</div>
                <div className="text-slate-400 text-sm">High Risk Events</div>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                <div className="text-2xl font-bold text-green-400 mb-1">{socStats.activeSessions}</div>
                <div className="text-slate-400 text-sm">Active Sessions</div>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400 mb-1">{socStats.alertsPending}</div>
                <div className="text-slate-400 text-sm">Alerts Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Users className="w-5 h-5 text-cyan-400 mr-2" />
              Recent User Activities
            </CardTitle>
            <CardDescription className="text-slate-400">Latest user actions and system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-slate-700/20 rounded">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          activity.type === "analyst_query"
                            ? "bg-blue-400"
                            : "bg-gray-400"
                        }`}
                      ></div>
                      <div>
                        <div className="text-white text-sm font-medium">{activity.user}</div>
                        <div className="text-slate-400 text-xs truncate max-w-xs">{activity.action}</div>
                      </div>
                    </div>
                    <div className="text-slate-500 text-xs flex-shrink-0">{formatActivityTime(activity.time)}</div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-400 py-8">No recent analyst activity.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, email, or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="deactivated">Deactivated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <Alert className="border-cyan-500/50 bg-cyan-900/20">
          <AlertTriangle className="h-4 w-4 text-cyan-400" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-cyan-400">
              {selectedUsers.length} user{selectedUsers.length > 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleBulkAction("approve")}>
                <UserCheck className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction("suspend")}>
                <UserX className="w-4 h-4 mr-1" />
                Suspend
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleBulkAction("delete")}>
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="all">All Users ({users.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
          <TabsTrigger value="suspended">Suspended ({suspendedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="text-slate-300">User</TableHead>
                      <TableHead className="text-slate-300">Role</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Last Login</TableHead>
                      <TableHead className="text-slate-300">Anomalies</TableHead>
                      <TableHead className="text-slate-300">2FA</TableHead>
                      <TableHead className="text-slate-300">Department</TableHead>
                      <TableHead className="text-slate-300 w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-slate-700 hover:bg-slate-700/30">
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8 bg-cyan-600">
                              <AvatarFallback className="bg-cyan-600 text-white text-xs">
                                {getInitials(user.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-white font-medium">{user.fullName}</div>
                              <div className="text-slate-400 text-sm">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell className="text-slate-300">{formatLastLogin(user.lastLogin)}</TableCell>
                        <TableCell>
                          {user.anomaliesDetected > 0 ? (
                            <Badge variant="destructive" className="bg-red-600">
                              {user.anomaliesDetected}
                            </Badge>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.twoFactorEnabled ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                        </TableCell>
                        <TableCell className="text-slate-300">{user.department}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-600">
                              <DropdownMenuItem onClick={() => handleUserAction(user, "view")}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUserAction(user, "edit")}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUserAction(user, "reset-password")}>
                                <Key className="mr-2 h-4 w-4" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-slate-600" />
                              {user.status === "pending" && (
                                <DropdownMenuItem onClick={() => handleUserAction(user, "approve")}>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Approve User
                                </DropdownMenuItem>
                              )}
                              {user.status === "active" && (
                                <DropdownMenuItem onClick={() => handleUserAction(user, "suspend")}>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Suspend User
                                </DropdownMenuItem>
                              )}
                              {user.status === "suspended" && (
                                <DropdownMenuItem onClick={() => handleUserAction(user, "activate")}>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Activate User
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator className="bg-slate-600" />
                              <DropdownMenuItem
                                onClick={() => handleUserAction(user, "delete")}
                                className="text-red-400"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">User Details</DialogTitle>
            <DialogDescription className="text-slate-400">
              Detailed information about the selected user
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16 bg-cyan-600">
                  <AvatarFallback className="bg-cyan-600 text-white text-lg">
                    {getInitials(selectedUser.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold text-white">{selectedUser.fullName}</h3>
                  <p className="text-slate-400">{selectedUser.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300">Username</label>
                  <p className="text-white">{selectedUser.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Department</label>
                  <p className="text-white">{selectedUser.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Signup Date</label>
                  <p className="text-white">{selectedUser.signupDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Last Login</label>
                  <p className="text-white">{formatLastLogin(selectedUser.lastLogin)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Anomalies Detected</label>
                  <p className="text-white">{selectedUser.anomaliesDetected}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">2FA Enabled</label>
                  <p className="text-white">{selectedUser.twoFactorEnabled ? "Yes" : "No"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Failed Login Attempts</label>
                  <p className="text-white">{selectedUser.loginAttempts}</p>
                </div>
                {selectedUser.createdBy && (
                  <div>
                    <label className="text-sm font-medium text-slate-300">Created By</label>
                    <p className="text-white">{selectedUser.createdBy}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Delete User</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {userToDelete && (
            <div className="py-4">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10 bg-cyan-600">
                  <AvatarFallback className="bg-cyan-600 text-white">
                    {getInitials(userToDelete.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-medium">{userToDelete.fullName}</p>
                  <p className="text-slate-400 text-sm">{userToDelete.email}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New User Dialog */}
      <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Create New User</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter the details for the new user account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Full Name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="bg-slate-700/50 border-slate-600 text-white"
            />
            <Input
              placeholder="Email Address"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="bg-slate-700/50 border-slate-600 text-white"
            />
            <Input
              placeholder="Temporary Password"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="bg-slate-700/50 border-slate-600 text-white"
            />
            <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="analyst">Analyst</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} className="bg-cyan-600 hover:bg-cyan-700">
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
