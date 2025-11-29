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
import {
  MoreHorizontal,
  Eye,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
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

interface Transaction {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  productId?: {
    _id: string;
    name: string;
    description?: string;
    sellingPrice?: number;
  };
  fromUserId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  amount: number;
  type: 'purchase' | 'commission' | 'withdrawal' | 'maintenance';
  status: 'pending' | 'completed' | 'failed';
  commissionLevel?: number;
  commissionAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [newStatus, setNewStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
  const [updating, setUpdating] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    const newPage = 1;
    setPagination((prev) => ({ ...prev, page: newPage }));
    fetchTransactions(newPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, typeFilter, statusFilter]);

  const fetchTransactions = async (pageNum?: number) => {
    setLoading(true);
    setError('');
    try {
      const currentPage = pageNum !== undefined ? pageNum : pagination.page;
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pagination.limit.toString(),
      });
      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`/api/admin/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setPagination(data.pagination || pagination);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to fetch transactions');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('An error occurred while fetching transactions');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
    fetchTransactions(newPage);
  };

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const { page, pages } = pagination;
    const pageNumbers: (number | 'ellipsis')[] = [];
    
    if (pages <= 7) {
      for (let i = 1; i <= pages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      
      if (page <= 4) {
        for (let i = 2; i <= 5; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('ellipsis');
        pageNumbers.push(pages);
      } else if (page >= pages - 3) {
        pageNumbers.push('ellipsis');
        for (let i = pages - 4; i <= pages; i++) {
          pageNumbers.push(i);
        }
      } else {
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

  const handleViewTransaction = async (transactionId: string) => {
    try {
      const res = await fetch(`/api/admin/transactions/${transactionId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTransaction(data.transaction);
        setViewDialogOpen(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to fetch transaction details');
      }
    } catch {
      setError('An error occurred while fetching transaction details');
    }
  };

  const handleUpdateStatus = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setNewStatus(transaction.status);
    setStatusDialogOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedTransaction) return;
    setUpdating(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/transactions/${selectedTransaction._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setSuccess('Transaction status updated successfully');
        setTimeout(() => setSuccess(''), 3000);
        fetchTransactions();
        setStatusDialogOpen(false);
        setSelectedTransaction(null);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update transaction status');
      }
    } catch {
      setError('An error occurred while updating the transaction');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Badge variant="outline">Purchase</Badge>;
      case 'commission':
        return <Badge variant="default">Commission</Badge>;
      case 'withdrawal':
        return <Badge variant="secondary">Withdrawal</Badge>;
      case 'maintenance':
        return <Badge>Maintenance</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const sign = type === 'withdrawal' ? '-' : '+';
    return `${sign}₱${Math.abs(amount).toLocaleString()}`;
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
            <BreadcrumbPage>Transactions</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          Monitor and manage all transactions in the system.
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
            Total: {pagination.total} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, product, or transaction ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="commission">Commission</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Product/Details</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-8 w-8 ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => (
                      <TableRow key={transaction._id}>
                        <TableCell>
                          {new Date(transaction.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {transaction.userId?.firstName} {transaction.userId?.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {transaction.userId?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getTypeBadge(transaction.type)}
                          {transaction.commissionLevel !== undefined && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Level {transaction.commissionLevel}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {transaction.productId ? (
                            <div>
                              <div className="font-medium">{transaction.productId.name}</div>
                              {transaction.fromUserId && (
                                <div className="text-sm text-muted-foreground">
                                  From: {transaction.fromUserId.firstName} {transaction.fromUserId.lastName}
                                </div>
                              )}
                            </div>
                          ) : transaction.type === 'withdrawal' ? (
                            <span className="text-muted-foreground">Withdrawal Request</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatAmount(transaction.amount, transaction.type)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
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
                              <DropdownMenuItem onClick={() => handleViewTransaction(transaction._id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleUpdateStatus(transaction)}>
                                <Clock className="mr-2 h-4 w-4" />
                                Update Status
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

      {/* View Transaction Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Complete information about the transaction.
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Transaction ID</Label>
                  <p className="font-mono text-sm">{selectedTransaction._id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <div className="mt-1">{getTypeBadge(selectedTransaction.type)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="font-medium text-lg">
                    {formatAmount(selectedTransaction.amount, selectedTransaction.type)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">User</Label>
                  <p className="font-medium">
                    {selectedTransaction.userId?.firstName} {selectedTransaction.userId?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedTransaction.userId?.email}
                  </p>
                </div>
                {selectedTransaction.productId && (
                  <div>
                    <Label className="text-muted-foreground">Product</Label>
                    <p className="font-medium">{selectedTransaction.productId.name}</p>
                    {selectedTransaction.productId.sellingPrice && (
                      <p className="text-sm text-muted-foreground">
                        Price: ₱{selectedTransaction.productId.sellingPrice.toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
                {selectedTransaction.fromUserId && (
                  <div>
                    <Label className="text-muted-foreground">From User</Label>
                    <p className="font-medium">
                      {selectedTransaction.fromUserId.firstName} {selectedTransaction.fromUserId.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedTransaction.fromUserId.email}
                    </p>
                  </div>
                )}
                {selectedTransaction.commissionLevel !== undefined && (
                  <div>
                    <Label className="text-muted-foreground">Commission Level</Label>
                    <p className="font-medium">Level {selectedTransaction.commissionLevel}</p>
                  </div>
                )}
                {selectedTransaction.commissionAmount && (
                  <div>
                    <Label className="text-muted-foreground">Commission Amount</Label>
                    <p className="font-medium">₱{selectedTransaction.commissionAmount.toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Created At</Label>
                  <p className="font-medium">
                    {new Date(selectedTransaction.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Updated At</Label>
                  <p className="font-medium">
                    {new Date(selectedTransaction.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            {selectedTransaction && (
              <Button onClick={() => {
                setViewDialogOpen(false);
                handleUpdateStatus(selectedTransaction);
              }}>
                Update Status
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Transaction Status</DialogTitle>
            <DialogDescription>
              Change the status of this transaction.
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Current Status</Label>
                <div>{getStatusBadge(selectedTransaction.status)}</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">New Status</Label>
                <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedTransaction.type === 'withdrawal' && (
                <Alert>
                  <AlertDescription>
                    {newStatus === 'completed' && selectedTransaction.status === 'pending' && (
                      <span>This will finalize the withdrawal. The balance has already been deducted.</span>
                    )}
                    {newStatus === 'failed' && selectedTransaction.status === 'pending' && (
                      <span>This will reject the withdrawal and refund the amount to the user's wallet.</span>
                    )}
                    {newStatus === 'completed' && selectedTransaction.status === 'failed' && (
                      <span>This will re-approve the withdrawal and deduct the amount from the user's wallet again.</span>
                    )}
                    {newStatus === 'failed' && selectedTransaction.status === 'completed' && (
                      <span>This will reverse the withdrawal and refund the amount to the user's wallet.</span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStatusDialogOpen(false);
                setSelectedTransaction(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveStatus} disabled={updating}>
              {updating ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
