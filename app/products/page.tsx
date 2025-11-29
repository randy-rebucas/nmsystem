'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Product {
  _id: string;
  name: string;
  description: string;
  cost: number;
  sellingPrice: number;
  adminFee: number;
  companyProfit: number;
  isActive: boolean;
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

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

  const handlePurchase = async (productId: string) => {
    if (!confirm('Are you sure you want to purchase this product?')) {
      return;
    }

    setPurchasing(productId);
    try {
      const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Purchase failed');
        return;
      }

      alert('Purchase completed successfully!');
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading products...</div>;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Products</h1>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No products available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product._id}
              className="bg-white shadow rounded-lg overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {product.name}
                </h3>
                {product.description && (
                  <p className="text-gray-600 mb-4">{product.description}</p>
                )}
                <div className="mb-4">
                  <div className="text-3xl font-bold text-blue-600">
                    ₱{product.sellingPrice.toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => handlePurchase(product._id)}
                  disabled={purchasing === product._id}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchasing === product._id ? 'Processing...' : 'Purchase'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">
          Commission Structure
        </h3>
        <p className="text-blue-800 text-sm">
          Each product purchase distributes ₱1,170 in commissions across 20
          levels in your genealogy tree. Only activated users receive
          commissions.
        </p>
      </div>
    </div>
  );
}

