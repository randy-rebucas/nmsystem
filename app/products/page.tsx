'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Image as ImageIcon } from 'lucide-react';
import { useSettings, formatCurrency } from '@/hooks/use-settings';

interface Product {
  _id: string;
  name: string;
  description: string;
  cost: number;
  sellingPrice: number;
  adminFee: number;
  companyProfit: number;
  image?: string;
  isActive: boolean;
}

export default function ProductsPage() {
  const router = useRouter();
  const { settings } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  
  const currency = settings?.currency || 'PHP';

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?active=true');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [purchaseError, setPurchaseError] = useState('');

  const handlePurchaseClick = (product: Product) => {
    setSelectedProduct(product);
    setPurchaseDialogOpen(true);
    setPurchaseError('');
  };

  const handlePurchase = async () => {
    if (!selectedProduct) return;

    setPurchasing(selectedProduct._id);
    setPurchaseError('');
    try {
      const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: selectedProduct._id }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPurchaseError(data.error || 'Purchase failed');
        return;
      }

      setPurchaseDialogOpen(false);
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      setPurchaseError('An error occurred. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0 space-y-6">
      <h1 className="text-3xl font-bold">Products</h1>

      {products.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No products available at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product._id} className="overflow-hidden">
              {product.image && product.image.trim() ? (
                <div className="relative w-full h-48 overflow-hidden bg-muted">
                  <img
                    src={
                      product.image.startsWith('data:')
                        ? product.image
                        : product.image.startsWith('http://') || product.image.startsWith('https://')
                        ? product.image
                        : `data:image/jpeg;base64,${product.image}`
                    }
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.image-fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'w-full h-full flex items-center justify-center bg-muted image-fallback';
                        fallback.innerHTML = '<svg class="h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-muted flex items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                {product.description && (
                  <CardDescription>{product.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(product.sellingPrice, currency)}
                </div>
                <Button
                  onClick={() => handlePurchaseClick(product)}
                  disabled={purchasing === product._id}
                  className="w-full"
                >
                  {purchasing === product._id ? 'Processing...' : 'Purchase'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Alert>
        <AlertTitle>Commission Structure</AlertTitle>
        <AlertDescription>
          Each product purchase distributes commissions across 20
          levels in your genealogy tree. Only activated users receive
          commissions.
        </AlertDescription>
      </Alert>

      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              Are you sure you want to purchase {selectedProduct?.name} for {formatCurrency(selectedProduct?.sellingPrice || 0, currency)}?
            </DialogDescription>
          </DialogHeader>
          {selectedProduct?.image && selectedProduct.image.trim() && (
            <div className="relative w-full h-48 overflow-hidden rounded-md bg-muted my-4">
              <img
                src={
                  selectedProduct.image.startsWith('data:')
                    ? selectedProduct.image
                    : selectedProduct.image.startsWith('http://') || selectedProduct.image.startsWith('https://')
                    ? selectedProduct.image
                    : `data:image/jpeg;base64,${selectedProduct.image}`
                }
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          {purchaseError && (
            <Alert variant="destructive">
              <AlertDescription>{purchaseError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPurchaseDialogOpen(false)}
              disabled={!!purchasing}
            >
              Cancel
            </Button>
            <Button onClick={handlePurchase} disabled={!!purchasing}>
              {purchasing ? 'Processing...' : 'Confirm Purchase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

