'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

  const [redeemError, setRedeemError] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    const points = parseInt(redeemPoints);
    setRedeemError('');
    setRedeemSuccess(false);

    if (!points || points <= 0) {
      setRedeemError('Please enter a valid number of points');
      return;
    }

    if (!rewardPoints || points > rewardPoints.balance) {
      setRedeemError('Insufficient reward points');
      return;
    }

    // Minimum redemption: 100 points (₱1)
    if (points < 100) {
      setRedeemError('Minimum redemption is 100 points (₱1)');
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
        setRedeemError(data.error || 'Redemption failed');
        return;
      }

      setRedeemSuccess(true);
      setRedeemPoints('');
      fetchRewards();
    } catch (error) {
      setRedeemError('An error occurred. Please try again.');
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!rewardPoints) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <Alert variant="destructive">
          <AlertDescription>Reward points not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const pesoValue = (rewardPoints.balance / 100).toFixed(2);

  return (
    <div className="px-4 py-6 sm:px-0 space-y-6">
      <h1 className="text-3xl font-bold">Reward Points</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardDescription>Available Points</CardDescription>
            <CardTitle className="text-2xl text-purple-600">
              {rewardPoints.balance.toLocaleString()}
            </CardTitle>
            <CardDescription className="text-xs">
              ≈ ₱{pesoValue}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Total Earned</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {rewardPoints.totalEarned.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Total Redeemed</CardDescription>
            <CardTitle className="text-2xl text-orange-600">
              {rewardPoints.totalRedeemed.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Redeem Points</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTitle>Conversion Rate</AlertTitle>
            <AlertDescription>
              <strong>Conversion Rate:</strong> 100 points = ₱1.00<br />
              <strong>Minimum Redemption:</strong> 100 points
            </AlertDescription>
          </Alert>
          <form onSubmit={handleRedeem} className="space-y-4">
            {redeemError && (
              <Alert variant="destructive">
                <AlertDescription>{redeemError}</AlertDescription>
              </Alert>
            )}
            {redeemSuccess && (
              <Alert>
                <AlertDescription>Successfully redeemed points!</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="points">Points to Redeem</Label>
              <Input
                type="number"
                id="points"
                min="100"
                max={rewardPoints.balance}
                step="100"
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                Maximum: {rewardPoints.balance.toLocaleString()} points
              </p>
              {redeemPoints && !isNaN(parseInt(redeemPoints)) && (
                <p className="text-sm text-green-600">
                  You will receive: ₱
                  {(parseInt(redeemPoints) / 100).toFixed(2)}
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={
                redeeming ||
                rewardPoints.balance < 100 ||
                !redeemPoints ||
                parseInt(redeemPoints) < 100
              }
            >
              {redeeming ? 'Processing...' : 'Redeem Points'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reward Points History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-muted-foreground">No reward point transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.type === 'earned' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`font-medium ${
                          item.points >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {item.points >= 0 ? '+' : ''}
                        {item.points.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {item.description}
                        {item.relatedProductId && (
                          <span className="text-muted-foreground ml-1">
                            ({item.relatedProductId.name})
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

