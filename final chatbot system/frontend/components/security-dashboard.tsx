"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@/lib/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Users,
  Shield,
  FileText,
  PlusCircle,
  Search,
  Mail,
  Clock,
} from "lucide-react";

const API_URL = "http://localhost:3001";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "analyst" | "viewer";
  isApproved: boolean;
  lastLogin?: string;
}

const UserInfoSidebar = ({ user }: { user: User | null }) => {
  if (!user) {
    return (
      <Card className="w-full lg:w-1/3 bg-slate-800/50 border-slate-700">
        <CardContent className="p-6 flex flex-col items-center justify-center h-full">
          <p className="text-slate-400">Select a user to see details</p>
        </CardContent>
      </Card>
    );
  }

  const getInitials = (name: string) => {
    const names = name.split(" ");
    return names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`
      : names[0][0];
  };

  return (
    <Card className="w-full lg:w-1/3 bg-slate-800/50 border-slate-700">
      <CardHeader className="p-6">
        <CardTitle className="text-white text-lg">User Information</CardTitle>
      </CardHeader>
      <CardContent className="p-6 text-center">
        <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-slate-600">
          <AvatarImage src={`https://i.pravatar.cc/150?u=${user.id}`} />
          <AvatarFallback className="bg-slate-700 text-slate-300 text-2xl">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <h3 className="text-xl font-bold text-white">{user.name}</h3>
        <Badge
          variant={user.isApproved ? "default" : "destructive"}
          className={`mt-2 ${
            user.isApproved ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
          }`}
        >
          {user.isApproved ? "Active" : "Not Active"}
        </Badge>

        <div className="text-left mt-6 space-y-4">
          <div className="flex items-center text-slate-300">
            <Mail className="w-4 h-4 mr-3 text-slate-400" />
            <span>{user.email}</span>
          </div>
          <div className="flex items-center text-slate-300">
            <Clock className="w-4 h-4 mr-3 text-slate-400" />
            <span>
              Last visited:{" "}
              {user.lastLogin
                ? new Date(user.lastLogin).toLocaleString()
                : "Never"}
            </span>
          </div>
          <div className="flex items-start text-slate-300">
            <Shield className="w-4 h-4 mr-3 mt-1 text-slate-400" />
            <div>
              <p className="font-semibold mb-1">Role</p>
              <Badge variant="outline" className="capitalize border-cyan-500/50 text-cyan-300">
                {user.role}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function SecurityDashboard() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const token = getToken();
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to view users.",
          variant: "destructive",
        });
        return;
      }
      try {
        const res = await fetch(`${API_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 403) {
           toast({
            title: "Permission Denied",
            description: "You do not have permission to view this page.",
            variant: "destructive",
          });
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await res.json();
        setUsers(data);
        if(data.length > 0) {
          setSelectedUser(data[0]);
        }
      } catch (err) {
        toast({
          title: "Error",
          description: "Could not fetch user data.",
          variant: "destructive",
        });
      }
    };
    fetchUsers();
  }, [toast]);

  return (
    <div className="h-screen w-full flex bg-slate-900 text-white font-sans">
      {/* Sidebar */}
      <nav className="w-64 bg-slate-950/80 border-r border-slate-800 flex flex-col">
        <div className="p-6 text-2xl font-bold">SOC-Admin</div>
        <div className="flex-1 p-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start text-lg bg-slate-700/50">
            <Users className="mr-3" /> Users
          </Button>
          <Button variant="ghost" className="w-full justify-start text-lg">
            <Shield className="mr-3" /> Roles
          </Button>
          <Button variant="ghost" className="w-full justify-start text-lg">
            <FileText className="mr-3" /> Rules
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-8 flex flex-col">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Users</h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="text-white border-slate-600 hover:bg-slate-800">
              <Search className="mr-2 h-4 w-4" /> Role Matrix
            </Button>
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
              <PlusCircle className="mr-2 h-4 w-4" /> New
            </Button>
          </div>
        </header>

        <div className="flex-1 flex gap-8">
          <Card className="w-full lg:w-2/3 bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-white">Full Name</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white">Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`cursor-pointer border-slate-800 hover:bg-slate-700/50 ${
                        selectedUser?.id === user.id ? "bg-slate-700" : ""
                      }`}
                    >
                      <TableCell className="flex items-center gap-4 py-3">
                        <Avatar className="w-9 h-9">
                           <AvatarImage src={`https://i.pravatar.cc/150?u=${user.id}`} />
                           <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{user.name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isApproved ? "default" : "destructive"}
                           className={
                            user.isApproved ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                          }
                        >
                          {user.isApproved ? "Active" : "Not Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <UserInfoSidebar user={selectedUser} />
        </div>
      </main>
    </div>
  );
}
