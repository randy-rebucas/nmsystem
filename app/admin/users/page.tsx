'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  Eye,
  Plus,
  X,
} from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface AdminUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActivated: boolean;
  isAdmin?: boolean;
  activationDate?: string;
  lastPurchaseDate?: string;
  level: number;
  wallet: {
    balance: number;
    pending: number;
    totalEarned: number;
  };
  rewardPoints: {
    balance: number;
    totalEarned: number;
    totalRedeemed: number;
  };
  sponsorId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    isActivated: false,
    isAdmin: false,
    password: '',
    sponsorId: '__none__',
  });
  
  // All users for sponsor selection
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);

  useEffect(() => {
    const newPage = 1;
    setPagination((prev) => ({ ...prev, page: newPage }));
    fetchUsers(newPage);
    fetchAllUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, roleFilter]);

  const fetchAllUsers = async () => {
    try {
      const res = await fetch('/api/admin/users?limit=1000');
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching all users:', err);
    }
  };

  const fetchUsers = async (pageNum?: number) => {
    setLoading(true);
    setError('');
    try {
      const currentPage = pageNum !== undefined ? pageNum : pagination.page;
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pagination.limit.toString(),
      });
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (roleFilter !== 'all') params.append('role', roleFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setPagination(data.pagination || pagination);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('An error occurred while fetching users');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
    fetchUsers(newPage);
  };

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const { page, pages } = pagination;
    const pageNumbers: (number | 'ellipsis')[] = [];
    
    if (pages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= pages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      if (page <= 4) {
        // Show pages 1-5, then ellipsis, then last
        for (let i = 2; i <= 5; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('ellipsis');
        pageNumbers.push(pages);
      } else if (page >= pages - 3) {
        // Show first, ellipsis, then last 5 pages
        pageNumbers.push('ellipsis');
        for (let i = pages - 4; i <= pages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // Show first, ellipsis, current-1, current, current+1, ellipsis, last
        pageNumbers.push('ellipsis');
        pageNumbers.push(page - 1);
        pageNumbers.push(page);
        pageNumbers.push(page + 1);
        pageNumbers.push('ellipsis');
        pageNumbers.push(pages);
      }
    }
    
    return pageNumbers;
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/users/${userToDelete}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSuccess('User deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
        fetchUsers();
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete user');
      }
    } catch {
      setError('An error occurred while deleting the user');
    } finally {
      setDeleting(false);
    }
  };

  const handleViewUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedUser(data.user);
        setViewDialogOpen(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to fetch user details');
      }
    } catch {
      setError('An error occurred while fetching user details');
    }
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setEditForm({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      isActivated: user.isActivated,
      isAdmin: user.isAdmin || false,
      password: '',
      sponsorId: user.sponsorId?._id || '__none__',
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    setSaving(true);
    setError('');
    try {
      // Prepare the update payload
      const updateData: any = {
        email: editForm.email,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone,
        isActivated: editForm.isActivated,
        isAdmin: editForm.isAdmin,
      };
      
      // Only include password if provided
      if (editForm.password) {
        updateData.password = editForm.password;
      }
      
      // Handle sponsorId - send null if "__none__", otherwise send the ID
      updateData.sponsorId = editForm.sponsorId === '__none__' ? null : editForm.sponsorId;
      
      const res = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (res.ok) {
        setSuccess('User updated successfully');
        setTimeout(() => setSuccess(''), 3000);
        fetchUsers();
        setEditDialogOpen(false);
        setSelectedUser(null);
        setEditForm({ email: '', firstName: '', lastName: '', phone: '', isActivated: false, isAdmin: false, password: '', sponsorId: '__none__' });
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update user');
      }
    } catch {
      setError('An error occurred while updating the user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActivation = async (user: AdminUser) => {
    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...user,
          isActivated: !user.isActivated,
        }),
      });
      if (res.ok) {
        setSuccess(`User ${!user.isActivated ? 'activated' : 'deactivated'} successfully`);
        setTimeout(() => setSuccess(''), 3000);
        fetchUsers();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update user status');
      }
    } catch {
      setError('An error occurred while updating the user');
    }
  };

  const handleToggleAdmin = async (user: AdminUser) => {
    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...user,
          isAdmin: !user.isAdmin,
        }),
      });
      if (res.ok) {
        setSuccess(`User ${!user.isAdmin ? 'promoted to admin' : 'removed from admin'} successfully`);
        setTimeout(() => setSuccess(''), 3000);
        fetchUsers();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update user role');
      }
    } catch {
      setError('An error occurred while updating the user');
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin">Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Users</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          View and manage user accounts in the system.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardDescription>
            Total: {pagination.total} users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="activated">Activated</SelectItem>
                  <SelectItem value="not-activated">Not Activated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-40" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-12" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-8 w-8 ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={user.isActivated ? 'default' : 'secondary'}>
                            {user.isActivated ? 'Activated' : 'Not Activated'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isAdmin ? 'default' : 'outline'}>
                            {user.isAdmin ? 'Admin' : 'User'}
                          </Badge>
                        </TableCell>
                        <TableCell>₱{user.wallet?.balance?.toLocaleString() || '0'}</TableCell>
                        <TableCell>{user.level}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewUser(user._id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleToggleActivation(user)}
                              >
                                {user.isActivated ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleAdmin(user)}
                              >
                                {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setUserToDelete(user._id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => {
                          if (pagination.page > 1) {
                            handlePageChange(pagination.page - 1);
                          }
                        }}
                        className={
                          pagination.page === 1
                            ? 'pointer-events-none opacity-50'
                            : 'cursor-pointer'
                        }
                      />
                    </PaginationItem>
                    {getPageNumbers().map((pageNum, index) => (
                      <PaginationItem key={index}>
                        {pageNum === 'ellipsis' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            onClick={() => handlePageChange(pageNum)}
                            isActive={pageNum === pagination.page}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => {
                          if (pagination.page < pagination.pages) {
                            handlePageChange(pagination.page + 1);
                          }
                        }}
                        className={
                          pagination.page === pagination.pages
                            ? 'pointer-events-none opacity-50'
                            : 'cursor-pointer'
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information about the user account.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedUser.phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div>
                    <Badge variant={selectedUser.isActivated ? 'default' : 'secondary'}>
                      {selectedUser.isActivated ? 'Activated' : 'Not Activated'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Role</Label>
                  <div>
                    <Badge variant={selectedUser.isAdmin ? 'default' : 'outline'}>
                      {selectedUser.isAdmin ? 'Admin' : 'User'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Level</Label>
                  <p className="font-medium">{selectedUser.level}</p>
                </div>
                {selectedUser.sponsorId && (
                  <div>
                    <Label className="text-muted-foreground">Sponsor</Label>
                    <p className="font-medium">
                      {selectedUser.sponsorId.firstName} {selectedUser.sponsorId.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.sponsorId.email}
                    </p>
                  </div>
                )}
                {selectedUser.activationDate && (
                  <div>
                    <Label className="text-muted-foreground">Activation Date</Label>
                    <p className="font-medium">
                      {new Date(selectedUser.activationDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedUser.lastPurchaseDate && (
                  <div>
                    <Label className="text-muted-foreground">Last Purchase</Label>
                    <p className="font-medium">
                      {new Date(selectedUser.lastPurchaseDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Wallet</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Balance</Label>
                    <p className="font-medium">₱{selectedUser.wallet?.balance?.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Pending</Label>
                    <p className="font-medium">₱{selectedUser.wallet?.pending?.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Total Earned</Label>
                    <p className="font-medium">₱{selectedUser.wallet?.totalEarned?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Reward Points</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Balance</Label>
                    <p className="font-medium">{selectedUser.rewardPoints?.balance?.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Total Earned</Label>
                    <p className="font-medium">{selectedUser.rewardPoints?.totalEarned?.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Total Redeemed</Label>
                    <p className="font-medium">{selectedUser.rewardPoints?.totalRedeemed?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Created At</Label>
                    <p className="font-medium">
                      {new Date(selectedUser.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Updated At</Label>
                    <p className="font-medium">
                      {new Date(selectedUser.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            {selectedUser && (
              <Button onClick={() => {
                setViewDialogOpen(false);
                handleEditUser(selectedUser);
              }}>
                Edit User
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Leave password blank to keep current password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New Password (leave blank to keep current)</Label>
              <Input
                id="password"
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sponsorId">Sponsor (Downline)</Label>
              <Select
                value={editForm.sponsorId}
                onValueChange={(value) => setEditForm({ ...editForm, sponsorId: value })}
              >
                <SelectTrigger id="sponsorId">
                  <SelectValue placeholder="Select a sponsor (or leave empty for no sponsor)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No Sponsor</SelectItem>
                  {allUsers
                    .filter((u) => u._id !== selectedUser?._id) // Don't allow user to be their own sponsor
                    .map((u) => (
                      <SelectItem key={u._id} value={u._id}>
                        {u.firstName} {u.lastName} ({u.email}) - Level {u.level}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Select a user to be this user's sponsor. This will make the selected user the sponsor and update the level accordingly.
              </p>
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div className="space-y-0.5">
                <Label htmlFor="isActivated">Activated</Label>
                <p className="text-sm text-muted-foreground">
                  User account activation status
                </p>
              </div>
              <Switch
                id="isActivated"
                checked={editForm.isActivated}
                onCheckedChange={(checked) =>
                  setEditForm({ ...editForm, isActivated: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div className="space-y-0.5">
                <Label htmlFor="isAdmin">Admin</Label>
                <p className="text-sm text-muted-foreground">
                  Grant admin privileges to this user
                </p>
              </div>
              <Switch
                id="isAdmin"
                checked={editForm.isAdmin}
                onCheckedChange={(checked) =>
                  setEditForm({ ...editForm, isAdmin: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setSelectedUser(null);
                setEditForm({ email: '', firstName: '', lastName: '', phone: '', isActivated: false, isAdmin: false, password: '', sponsorId: '__none__' });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              account and all associated data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
