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
import { Plus, MoreHorizontal, Pencil, Trash2, Power, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSettings, formatCurrency } from '@/hooks/use-settings';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface Product {
  _id: string;
  name: string;
  description?: string;
  cost: number;
  sellingPrice: number;
  adminFee?: number;
  companyProfit?: number;
  image?: string;
  isActive?: boolean;
}

export default function AdminProductsPage() {
  const { settings } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  
  const currency = settings?.currency || 'PHP';
  const [deleting, setDeleting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (pageNum?: number) => {
    try {
      const currentPage = pageNum !== undefined ? pageNum : pagination.page;
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pagination.limit.toString(),
      });

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const productsData = data.products || [];
        // Debug: log products to see if image field exists
        console.log('Products fetched:', productsData.map((p: Product) => ({ 
          id: p._id, 
          name: p.name, 
          hasImage: !!p.image,
          imageLength: p.image?.length || 0,
          imagePreview: p.image?.substring(0, 50) || 'none'
        })));
        setProducts(productsData);
        setPagination(data.pagination || pagination);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
    fetchProducts(newPage);
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
    if (!productToDelete) return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/products/${productToDelete}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSuccess('Product deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
        // If we're on the last page and it becomes empty, go to previous page
        const currentPage = pagination.page;
        const willBeEmpty = products.length === 1 && currentPage > 1;
        if (willBeEmpty) {
          handlePageChange(currentPage - 1);
        } else {
          fetchProducts(currentPage);
        }
        setDeleteDialogOpen(false);
        setProductToDelete(null);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete product');
      }
    } catch {
      setError('An error occurred while deleting the product');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      const product = products.find((p) => p._id === productId);
      if (!product) return;

      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          cost: product.cost,
          sellingPrice: product.sellingPrice,
          image: product.image,
          isActive: !currentStatus,
        }),
      });

      if (res.ok) {
        setSuccess(`Product ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        setTimeout(() => setSuccess(''), 3000);
        fetchProducts(pagination.page);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update product status');
      }
    } catch {
      setError('An error occurred while updating the product');
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
            <BreadcrumbPage>Products</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage products available for purchase.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Product
          </Link>
        </Button>
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
            Total: {pagination.total} products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-12 w-12 rounded" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
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
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No products found. Create your first product to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell>
                        {p.image && p.image.trim() ? (
                          <div className="relative h-12 w-12">
                            <img
                              src={
                                p.image.startsWith('data:') 
                                  ? p.image 
                                  : p.image.startsWith('http://') || p.image.startsWith('https://')
                                  ? p.image
                                  : `data:image/jpeg;base64,${p.image}`
                              }
                              alt={p.name}
                              className="h-12 w-12 object-cover rounded border"
                              loading="lazy"
                              onError={(e) => {
                                console.error('Image failed to load for product:', p.name);
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector('.image-error-fallback')) {
                                  const fallback = document.createElement('div');
                                  fallback.className = 'h-12 w-12 bg-muted rounded flex items-center justify-center image-error-fallback';
                                  fallback.innerHTML = '<svg class="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                                  parent.appendChild(fallback);
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{formatCurrency(p.cost, currency)}</TableCell>
                      <TableCell>{formatCurrency(p.sellingPrice, currency)}</TableCell>
                      <TableCell>
                        <Badge variant={p.isActive ? 'default' : 'secondary'}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </Badge>
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
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/products/${p._id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(p._id, p.isActive || false)}
                            >
                              <Power className="mr-2 h-4 w-4" />
                              {p.isActive ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setProductToDelete(p._id);
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
            <div className="flex items-center justify-between mt-4">
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
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              from the system.
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


