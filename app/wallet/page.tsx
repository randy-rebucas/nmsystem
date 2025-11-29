'use client';

import { useEffect, useState } from 'react';

interface Wallet {
  balance: number;
  pending: number;
  totalEarned: number;
}

interface Transaction {
  _id: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
  productId?: {
    name: string;
  };
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const response = await fetch('/api/wallet');
      if (response.ok) {
        const data = await response.json();
        setWallet(data.wallet);
        setTransactions(data.recentTransactions || []);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);

    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!wallet || amount > wallet.balance) {
      alert('Insufficient balance');
      return;
    }

    setWithdrawing(true);
    try {
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Withdrawal failed');
        return;
      }

      alert('Withdrawal request submitted successfully');
      setWithdrawAmount('');
      fetchWallet();
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading wallet...</div>;
  }

  if (!wallet) {
    return <div className="text-center py-12">Wallet not found</div>;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Wallet</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="text-2xl font-bold text-green-600 mb-2">
              ₱{wallet.balance.toLocaleString()}
            </div>
            <div className="text-sm font-medium text-gray-500">
              Available Balance
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="text-2xl font-bold text-yellow-600 mb-2">
              ₱{wallet.pending.toLocaleString()}
            </div>
            <div className="text-sm font-medium text-gray-500">
              Pending Commissions
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              ₱{wallet.totalEarned.toLocaleString()}
            </div>
            <div className="text-sm font-medium text-gray-500">
              Total Earned
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Withdraw Funds</h2>
        <form onSubmit={handleWithdraw} className="space-y-4">
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700"
            >
              Amount
            </label>
            <input
              type="number"
              id="amount"
              min="1"
              max={wallet.balance}
              step="0.01"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Maximum: ₱{wallet.balance.toLocaleString()}
            </p>
          </div>
          <button
            type="submit"
            disabled={withdrawing || wallet.balance === 0}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {withdrawing ? 'Processing...' : 'Request Withdrawal'}
          </button>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-600">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {transaction.type}
                      {transaction.productId && (
                        <span className="text-gray-500">
                          {' '}
                          - {transaction.productId.name}
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        transaction.amount >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {transaction.amount >= 0 ? '+' : ''}
                      ₱{Math.abs(transaction.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {transaction.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

