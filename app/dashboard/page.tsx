'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Wallet, Clock, PiggyBank, Gift, LineChart as LineChartIcon } from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useSettings, formatCurrency } from '@/hooks/use-settings';

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

interface EarningsData {
  month: string;
  earnings: number;
}

export default function DashboardPage() {
  const { settings } = useSettings();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [earningsData, setEarningsData] = useState<EarningsData[]>([]);
  const [earningsLoading, setEarningsLoading] = useState(true);
  
  const currency = settings?.currency || 'PHP';

  useEffect(() => {
    fetchUser();
    fetchEarningsData();
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

  const fetchEarningsData = async () => {
    try {
      const response = await fetch('/api/stats/earnings');
      if (response.ok) {
        const data = await response.json();
        setEarningsData(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching earnings data:', error);
    } finally {
      setEarningsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0 space-y-6">
        <Skeleton className="h-10 w-64" />
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

  if (!user) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>User not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0 space-y-8">
      <div className="space-y-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Welcome, {user.firstName} {user.lastName}
            <Badge
              variant={user.isActivated ? 'default' : 'outline'}
              className={cn(
                'text-xs',
                user.isActivated ? 'bg-emerald-600 text-emerald-50' : ''
              )}
            >
              {user.isActivated ? 'Activated' : 'Not activated'}
            </Badge>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here’s a quick overview of your earnings, wallet balance, and rewards.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/wallet">View wallet</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/products">Make a purchase</Link>
          </Button>
        </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Overview
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>Available Balance</CardDescription>
              <Wallet className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-emerald-600">
                {formatCurrency(user.wallet.balance, currency)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Ready to withdraw or use for purchases.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>Pending Commissions</CardDescription>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-amber-600">
                {formatCurrency(user.wallet.pending, currency)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Commissions waiting to be released.
              </p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>Total Earned</CardDescription>
              <PiggyBank className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-blue-600">
                {formatCurrency(user.wallet.totalEarned, currency)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Lifetime commissions you’ve generated.
              </p>
            </CardContent>
          </Card>

          {user.rewardPoints && (
            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription>Reward Points</CardDescription>
                <Gift className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-purple-600">
                  {user.rewardPoints.balance.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  ≈ {formatCurrency(user.rewardPoints.balance / 100, currency)} available to redeem.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="md:col-span-2 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  Earnings trend
                  <LineChartIcon className="h-4 w-4 text-primary" />
                </CardTitle>
                <CardDescription>Last 6 periods</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-baseline gap-4">
                  <p className="text-2xl font-semibold">
                    {formatCurrency(user.wallet.totalEarned, currency)}
                  </p>
                  <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">
                    +18% vs previous
                  </Badge>
                </div>
                <div className="h-[200px] w-full">
                  {earningsLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <Skeleton className="h-full w-full" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={earningsData.length > 0 ? earningsData : [
                          { month: 'Jan', earnings: 0 },
                          { month: 'Feb', earnings: 0 },
                          { month: 'Mar', earnings: 0 },
                          { month: 'Apr', earnings: 0 },
                          { month: 'May', earnings: 0 },
                          { month: 'Jun', earnings: 0 },
                        ]}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                      <defs>
                        <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                        tickFormatter={(value) => `${formatCurrency(value, currency).replace(/[0-9,]/g, '')}${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 'calc(var(--radius) - 2px)',
                        }}
                        formatter={(value: number) => [formatCurrency(value, currency), 'Earnings']}
                      />
                      <Area
                        type="monotone"
                        dataKey="earnings"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#colorEarnings)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Account status
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Activation Status:</span>
              <Badge variant={user.isActivated ? 'default' : 'destructive'}>
                {user.isActivated ? 'Activated' : 'Not Activated'}
              </Badge>
            </div>
            {user.isActivated && user.activationDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Activated On:</span>
                <span className="font-medium">
                  {new Date(user.activationDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {user.lastPurchaseDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Purchase:</span>
                <span className="font-medium">
                  {new Date(user.lastPurchaseDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {!user.isActivated && (
        <Alert>
          <AlertTitle>Activate your account</AlertTitle>
          <AlertDescription className="mt-2">
            Purchase a product to activate your account and start earning commissions.
            <Button asChild className="mt-3">
              <Link href="/products">Browse Products</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Quick links
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <Link href="/products" className="block">
              <CardHeader>
                <CardTitle>Browse Products</CardTitle>
                <CardDescription>
                  View and purchase products to activate your account or maintain
                  your monthly activity.
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <Link href="/rewards" className="block">
              <CardHeader>
                <CardTitle>Reward Points</CardTitle>
                <CardDescription>
                  View your reward points balance and redeem them for cash.
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <Link href="/genealogy" className="block">
              <CardHeader>
                <CardTitle>Genealogy Tree</CardTitle>
                <CardDescription>
                  View your upline sponsors and downline referrals in the network.
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>
      </section>
    </div>
  );
}

