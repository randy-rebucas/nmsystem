'use client';

import { useEffect, useState } from 'react';

interface RewardPoints {
  balance: number;
  totalEarned: number;
  totalRedeemed: number;
}

interface RewardHistory {
  _id: string;
  points: number;
  type: string;
  source: string;
  description: string;
  createdAt: string;
  relatedProductId?: {
    name: string;
  };
}

export default function RewardsPage() {
  const [rewardPoints, setRewardPoints] = useState<RewardPoints | null>(null);
  const [history, setHistory] = useState<RewardHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemPoints, setRedeemPoints] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const response = await fetch('/api/rewards');
      if (response.ok) {
        const data = await response.json();
        setRewardPoints(data.rewardPoints);
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    const points = parseInt(redeemPoints);

    if (!points || points <= 0) {
      alert('Please enter a valid number of points');
      return;
    }

    if (!rewardPoints || points > rewardPoints.balance) {
      alert('Insufficient reward points');
      return;
    }

    // Minimum redemption: 100 points (₱1)
    if (points < 100) {
      alert('Minimum redemption is 100 points (₱1)');
      return;
    }

    setRedeeming(true);
    try {
      const response = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Redemption failed');
        return;
      }

      alert(
        `Successfully redeemed ${points} points for ₱${data.pesoAmount.toFixed(2)}`
      );
      setRedeemPoints('');
      fetchRewards();
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading rewards...</div>;
  }

  if (!rewardPoints) {
    return <div className="text-center py-12">Reward points not found</div>;
  }

  const pesoValue = (rewardPoints.balance / 100).toFixed(2);

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Reward Points</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {rewardPoints.balance.toLocaleString()}
            </div>
            <div className="text-sm font-medium text-gray-500">
              Available Points
            </div>
            <div className="text-xs text-gray-400 mt-1">
              ≈ ₱{pesoValue}
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {rewardPoints.totalEarned.toLocaleString()}
            </div>
            <div className="text-sm font-medium text-gray-500">
              Total Earned
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="text-2xl font-bold text-orange-600 mb-2">
              {rewardPoints.totalRedeemed.toLocaleString()}
            </div>
            <div className="text-sm font-medium text-gray-500">
              Total Redeemed
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Redeem Points</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Conversion Rate:</strong> 100 points = ₱1.00
          </p>
          <p className="text-sm text-blue-800 mt-1">
            <strong>Minimum Redemption:</strong> 100 points
          </p>
        </div>
        <form onSubmit={handleRedeem} className="space-y-4">
          <div>
            <label
              htmlFor="points"
              className="block text-sm font-medium text-gray-700"
            >
              Points to Redeem
            </label>
            <input
              type="number"
              id="points"
              min="100"
              max={rewardPoints.balance}
              step="100"
              value={redeemPoints}
              onChange={(e) => setRedeemPoints(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Maximum: {rewardPoints.balance.toLocaleString()} points
            </p>
            {redeemPoints && !isNaN(parseInt(redeemPoints)) && (
              <p className="mt-1 text-sm text-green-600">
                You will receive: ₱
                {(parseInt(redeemPoints) / 100).toFixed(2)}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={
              redeeming ||
              rewardPoints.balance < 100 ||
              !redeemPoints ||
              parseInt(redeemPoints) < 100
            }
            className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {redeeming ? 'Processing...' : 'Redeem Points'}
          </button>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Reward Points History</h2>
        {history.length === 0 ? (
          <p className="text-gray-600">No reward point transactions yet.</p>
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
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((item) => (
                  <tr key={item._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.type === 'earned'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        item.points >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {item.points >= 0 ? '+' : ''}
                      {item.points.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.description}
                      {item.relatedProductId && (
                        <span className="text-gray-500 ml-1">
                          ({item.relatedProductId.name})
                        </span>
                      )}
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

