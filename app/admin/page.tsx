'use client';

import { useEffect, useState } from 'react';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActivated: boolean;
  isAdmin: boolean;
  wallet: {
    balance: number;
    pending: number;
    totalEarned: number;
  };
}

interface Product {
  _id: string;
  name: string;
  sellingPrice: number;
  isActive: boolean;
}

interface Transaction {
  _id: string;
  userId: {
    firstName: string;
    lastName: string;
  };
  amount: number;
  type: string;
  status: string;
  createdAt: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'products' | 'transactions'>('users');
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    cost: '',
    sellingPrice: '',
    adminFee: '',
    companyProfit: '',
  });
  const [creatingProduct, setCreatingProduct] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'products') {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      } else if (activeTab === 'transactions') {
        // You would need to create an admin transactions endpoint
        // For now, we'll skip this
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingProduct(true);

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProduct.name,
          description: newProduct.description,
          cost: parseFloat(newProduct.cost),
          sellingPrice: parseFloat(newProduct.sellingPrice),
          adminFee: parseFloat(newProduct.adminFee) || 0,
          companyProfit: parseFloat(newProduct.companyProfit) || 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to create product');
        return;
      }

      alert('Product created successfully');
      setNewProduct({
        name: '',
        description: '',
        cost: '',
        sellingPrice: '',
        adminFee: '',
        companyProfit: '',
      });
      fetchData();
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setCreatingProduct(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Panel</h1>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'products'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'transactions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Transactions
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Product</h2>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Product Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        description: e.target.value,
                      })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Cost (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProduct.cost}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, cost: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Selling Price (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProduct.sellingPrice}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        sellingPrice: e.target.value,
                      })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Admin Fee (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.adminFee}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, adminFee: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Company Profit (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.companyProfit}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        companyProfit: e.target.value,
                      })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={creatingProduct}
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {creatingProduct ? 'Creating...' : 'Create Product'}
              </button>
            </form>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">All Products</h2>
            {products.length === 0 ? (
              <p className="text-gray-600">No products found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Selling Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₱{product.sellingPrice.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {product.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Transactions</h2>
          <p className="text-gray-600">
            Transaction management feature coming soon.
          </p>
        </div>
      )}
    </div>
  );
}

