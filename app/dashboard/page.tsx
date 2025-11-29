'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActivated: boolean;
  wallet: {
    balance: number;
    pending: number;
    totalEarned: number;
  };
  rewardPoints?: {
    balance: number;
    totalEarned: number;
    totalRedeemed: number;
  };
  activationDate?: string;
  lastPurchaseDate?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!user) {
    return <div className="text-center py-12">User not found</div>;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Welcome, {user.firstName} {user.lastName}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl font-bold text-green-600">
                    ₱{user.wallet.balance.toLocaleString()}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Available Balance
                    </dt>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl font-bold text-yellow-600">
                    ₱{user.wallet.pending.toLocaleString()}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Commissions
                    </dt>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl font-bold text-blue-600">
                    ₱{user.wallet.totalEarned.toLocaleString()}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Earned
                    </dt>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {user.rewardPoints && (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl font-bold text-purple-600">
                      {user.rewardPoints.balance.toLocaleString()}
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Reward Points
                      </dt>
                      <dd className="text-xs text-gray-400">
                        ≈ ₱{(user.rewardPoints.balance / 100).toFixed(2)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Account Status</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Activation Status:</span>
              <span
                className={`font-semibold ${
                  user.isActivated ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {user.isActivated ? 'Activated' : 'Not Activated'}
              </span>
            </div>
            {user.isActivated && user.activationDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Activated On:</span>
                <span className="text-gray-900">
                  {new Date(user.activationDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {user.lastPurchaseDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Last Purchase:</span>
                <span className="text-gray-900">
                  {new Date(user.lastPurchaseDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {!user.isActivated && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              <strong>Activate your account:</strong> Purchase a product to
              activate your account and start earning commissions.
            </p>
            <Link
              href="/products"
              className="mt-2 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Browse Products
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/products"
            className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition"
          >
            <h3 className="text-lg font-semibold mb-2">Browse Products</h3>
            <p className="text-gray-600">
              View and purchase products to activate your account or maintain
              your monthly activity.
            </p>
          </Link>

          <Link
            href="/rewards"
            className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition"
          >
            <h3 className="text-lg font-semibold mb-2">Reward Points</h3>
            <p className="text-gray-600">
              View your reward points balance and redeem them for cash.
            </p>
          </Link>

          <Link
            href="/genealogy"
            className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition"
          >
            <h3 className="text-lg font-semibold mb-2">Genealogy Tree</h3>
            <p className="text-gray-600">
              View your upline sponsors and downline referrals in the network.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

