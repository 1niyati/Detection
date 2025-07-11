"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  AlertTriangle,
  Activity,
  UserCheck,
  ShieldCheck,
  BarChart,
  PieChartIcon,
  MessageSquare,
} from "lucide-react";
import {
  getDashboardStats,
  getSecurityAlerts,
  getLoginActivity,
  getUserRoles,
  getRecentActivity,
  getAllUsers,
} from "@/lib/dashboard";
import {
  Bar,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Pie,
  PieChart as RechartsPieChart,
  Cell,
} from "recharts";

// Define types for our data
interface Stats {
  totalUsers: number;
  suspiciousActivities: number;
  userRoles: { role: string; count: number }[];
}
interface Alert {
  email: string;
  timestamp: string;
  risk_level: "Low" | "Medium" | "High";
  reason: string;
}
interface LoginActivity {
  date: string;
  count: number;
}
interface UserRole {
  role: string;
  count: number;
}
interface RecentActivity {
  id: number;
  content: string;
  createdAt: string;
  session: {
    user: {
      name: string;
      email: string;
    }
  }
}
interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    lastLogin: string | null;
    createdAt: string;
}

const PIE_COLORS = ["#8884d8", "#82ca9d", "#ffc658"];

export function SecurityDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loginActivity, setLoginActivity] = useState<LoginActivity[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [statsData, alertsData, activityData, rolesData, recentActivityData, allUsersData] = await Promise.all([
          getDashboardStats(),
          getSecurityAlerts(),
          getLoginActivity(),
          getUserRoles(),
          getRecentActivity(),
          getAllUsers(),
        ]);
        setStats(statsData);
        setAlerts(alertsData);
        setLoginActivity(activityData);
        setUserRoles(rolesData);
        setRecentActivity(recentActivityData);
        setAllUsers(allUsersData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading || !stats) {
    return (
        <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
            <div className="flex items-center space-x-2">
                <Activity className="animate-spin h-8 w-8 text-cyan-400" />
                <span className="text-xl">Loading Dashboard Data...</span>
            </div>
        </div>
    );
  }

  const getRoleCount = (role: string) =>
    stats.userRoles.find((r) => r.role === role)?.count || 0;
  
  const adminCount = getRoleCount("admin");
  const analystCount = getRoleCount("analyst");

  return (
    <div className="p-6 space-y-6 bg-slate-900 text-white min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          SOC Activity Dashboard
        </h1>
        <p className="text-slate-400">
          Live monitoring of analyst activity, system users, and security alerts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-slate-500">
              {adminCount} Admins, {analystCount} Analysts
            </p>
          </CardContent>
        </Card>
        {/* Suspicious Activities */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Suspicious Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.suspiciousActivities}</div>
            <p className="text-xs text-slate-500">From detection system</p>
          </CardContent>
        </Card>
        {/* Admins */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Administrators</CardTitle>
            <UserCheck className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
            <p className="text-xs text-slate-500">Have full system access</p>
          </CardContent>
        </Card>
        {/* Analysts */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Security Analysts</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analystCount}</div>
            <p className="text-xs text-slate-500">Monitor and investigate alerts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent SOC Activity */}
        <Card className="lg:col-span-1 bg-slate-800/50 border-slate-700">
            <CardHeader>
                <CardTitle className="flex items-center">
                    <MessageSquare className="w-5 h-5 text-blue-400 mr-2" />
                    Recent SOC Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {recentActivity.map(activity => (
                        <div key={activity.id} className="text-sm">
                            <p className="truncate">"{activity.content}"</p>
                            <p className="text-xs text-slate-400">
                                by {activity.session.user.name} - {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                            </p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

        {/* Recent Alerts Table */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
              Recent Security Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">User</TableHead>
                  <TableHead className="text-white">Risk Level</TableHead>
                  <TableHead className="text-white">Time</TableHead>
                  <TableHead className="text-white">Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.slice(0, 5).map((alert, index) => (
                  <TableRow key={index}>
                    <TableCell>{alert.email}</TableCell>
                    <TableCell>
                        <Badge variant={alert.risk_level === 'High' ? 'destructive' : 'default'}>
                            {alert.risk_level}
                        </Badge>
                    </TableCell>
                    <TableCell>{new Date(alert.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{alert.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* User Management Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
            <CardTitle className="flex items-center">
                <Users className="w-5 h-5 text-cyan-400 mr-2" />
                User Management
            </CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Name</TableHead>
                  <TableHead className="text-white">Email</TableHead>
                  <TableHead className="text-white">Role</TableHead>
                  <TableHead className="text-white">Last Login</TableHead>
                  <TableHead className="text-white">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                    <TableCell>{user.lastLogin ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true }) : 'Never'}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Roles Chart */}
        <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
                <CardTitle className="flex items-center">
                    <PieChartIcon className="w-5 h-5 text-cyan-400 mr-2" />
                    User Role Distribution
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                    <Pie data={userRoles} dataKey="count" nameKey="role" cx="50%" cy="50%" outerRadius={80} label>
                        {userRoles.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip wrapperClassName="!bg-slate-700 !border-slate-600" />
                </RechartsPieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        {/* Login Activity Chart */}
        <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
                <CardTitle className="flex items-center">
                    <BarChart className="w-5 h-5 text-green-400 mr-2" />
                    Login Activity (Last 7 Days)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={loginActivity}>
                        <XAxis dataKey="date" stroke="#888888" fontSize={12} />
                        <YAxis stroke="#888888" fontSize={12} />
                        <Tooltip wrapperClassName="!bg-slate-700 !border-slate-600" />
                        <Bar dataKey="count" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
