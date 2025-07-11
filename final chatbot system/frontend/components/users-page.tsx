"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  User as UserIcon,
  MoreVertical,
  Search,
  CheckCircle,
  XCircle,
  Mail,
  Clock,
  Shield,
  Trash2,
  Edit,
} from "lucide-react";
import { getAllUsers } from "@/lib/dashboard"; // We can reuse this
import { getToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "analyst" | "viewer";
  isApproved: boolean;
  lastLogin: string | null;
}

// Edit User Form Component
const EditUserForm = ({ user, onSave, onCancel }: { user: User, onSave: (data: any) => void, onCancel: () => void }) => {
    const [role, setRole] = useState(user.role);
    const [isApproved, setIsApproved] = useState(user.isApproved);

    const handleSave = () => {
        onSave({ role, isApproved });
    };

    return (
        <div className="space-y-4 text-slate-200">
            <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select value={role} onChange={e => setRole(e.target.value as User['role'])} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2">
                    <option value="admin">Admin</option>
                    <option value="analyst">Analyst</option>
                    <option value="viewer">Viewer</option>
                </select>
            </div>
            <div className="flex items-center space-x-2">
                <input type="checkbox" checked={isApproved} onChange={e => setIsApproved(e.target.checked)} id="isApproved" className="rounded bg-slate-700 border-slate-600"/>
                <label htmlFor="isApproved">Is Approved</label>
            </div>
            <div className="flex justify-end space-x-2">
                <Button onClick={onCancel} variant="ghost">Cancel</Button>
                <Button onClick={handleSave}>Save Changes</Button>
            </div>
        </div>
    );
};


export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  
  // State for dialogs
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      if (allUsers.length > 0) {
        setSelectedUser(allUsers[0]);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch users.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateUser = async (data: any) => {
    if (!userToEdit) return;
    const token = getToken();

    try {
        const res = await fetch(`http://localhost:3001/users/${userToEdit.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update");

        toast({ title: "Success", description: "User updated successfully." });
        setUserToEdit(null);
        fetchUsers(); // Refresh user list
    } catch (err) {
        toast({ title: "Error", description: "Could not update user.", variant: "destructive" });
    }
  };
  
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    const token = getToken();

    try {
        const res = await fetch(`http://localhost:3001/users/${userToDelete.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to delete");

        toast({ title: "Success", description: "User has been deleted." });
        setUserToDelete(null);
        fetchUsers(); // Refresh user list
    } catch (err) {
        toast({ title: "Error", description: "Could not delete user.", variant: "destructive" });
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  if (loading) {
    return <div className="p-6 text-center">Loading users...</div>;
  }

  return (
    <div className="flex h-full bg-slate-900 text-white">
      {/* Main Content - User Table */}
      <div className="flex-1 p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">User Management</h1>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 bg-slate-800 border-slate-700"
            />
          </div>
        </div>
        <Card className="border-slate-700 bg-slate-800/50">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`cursor-pointer border-slate-800 hover:bg-slate-700/50 ${selectedUser?.id === user.id ? "bg-slate-700" : ""}`}
                >
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-slate-400" />
                      </div>
                      <span>{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isApproved ? "default" : "destructive"} className={user.isApproved ? "bg-green-600/80" : ""}>
                      {user.isApproved ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-white">
                        <DropdownMenuItem onClick={() => setUserToEdit(user)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setUserToDelete(user)} className="text-red-400">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Side Panel - User Details */}
      {selectedUser && (
        <aside className="w-80 border-l border-slate-700 p-6 bg-slate-800/50 space-y-6">
          <h2 className="text-xl font-semibold">User Information</h2>
          <div className="flex flex-col items-center space-y-3">
            <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center">
              <UserIcon className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold">{selectedUser.name}</h3>
            <Badge variant={selectedUser.isApproved ? "default" : "destructive"} className={selectedUser.isApproved ? "bg-green-600/80" : ""}>
              {selectedUser.isApproved ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-2 text-slate-400" />
              <span>{selectedUser.email}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-slate-400" />
              <span>Last seen: {selectedUser.lastLogin ? format(new Date(selectedUser.lastLogin), "MMM d, yyyy, h:mm a") : "Never"}</span>
            </div>
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-2 text-slate-400" />
              <span className="capitalize">Role: {selectedUser.role}</span>
            </div>
          </div>
        </aside>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This action cannot be undone. This will permanently delete the user account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild><Button variant="ghost">Cancel</Button></AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} asChild><Button variant="destructive">Delete</Button></AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Dialog */}
      <Dialog open={!!userToEdit} onOpenChange={() => setUserToEdit(null)}>
          <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                  <DialogTitle>Edit User: {userToEdit?.name}</DialogTitle>
              </DialogHeader>
              {userToEdit && <EditUserForm user={userToEdit} onSave={handleUpdateUser} onCancel={() => setUserToEdit(null)} />}
          </DialogContent>
      </Dialog>
    </div>
  );
} 