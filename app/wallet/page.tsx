'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSettings, formatCurrency, getCurrencySymbol } from '@/hooks/use-settings';

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
  const { settings } = useSettings();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  
  const currencySymbol = settings ? getCurrencySymbol(settings.currency) : '₱';

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

  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    setWithdrawError('');
    setWithdrawSuccess(false);

    if (!amount || amount <= 0) {
      setWithdrawError('Please enter a valid amount');
      return;
    }

    if (!wallet || amount > wallet.balance) {
      setWithdrawError('Insufficient balance');
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
        setWithdrawError(data.error || 'Withdrawal failed');
        return;
      }

      setWithdrawSuccess(true);
      setWithdrawAmount('');
      fetchWallet();
    } catch (error) {
      setWithdrawError('An error occurred. Please try again.');
    } finally {
      setWithdrawing(false);
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

  if (!wallet) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <Alert variant="destructive">
          <AlertDescription>Wallet not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0 space-y-6">
      <h1 className="text-3xl font-bold">My Wallet</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardDescription>Available Balance</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {formatCurrency(wallet.balance, settings?.currency || 'PHP')}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Pending Commissions</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">
              {formatCurrency(wallet.pending, settings?.currency || 'PHP')}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Total Earned</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {formatCurrency(wallet.totalEarned, settings?.currency || 'PHP')}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Withdraw Funds</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleWithdraw} className="space-y-4">
            {withdrawError && (
              <Alert variant="destructive">
                <AlertDescription>{withdrawError}</AlertDescription>
              </Alert>
            )}
            {withdrawSuccess && (
              <Alert>
                <AlertDescription>Withdrawal request submitted successfully</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                type="number"
                id="amount"
                min="1"
                max={wallet.balance}
                step="0.01"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                Maximum: {formatCurrency(wallet.balance, settings?.currency || 'PHP')}
                {settings && (
                  <span className="block mt-1">
                    Min: {formatCurrency(settings.minWithdraw, settings.currency)} | 
                    Max: {formatCurrency(settings.maxWithdraw, settings.currency)}
                  </span>
                )}
              </p>
            </div>
            <Button
              type="submit"
              disabled={withdrawing || wallet.balance === 0}
            >
              {withdrawing ? 'Processing...' : 'Request Withdrawal'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground">No transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell>
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="capitalize">
                        {transaction.type}
                        {transaction.productId && (
                          <span className="text-muted-foreground">
                            {' '}
                            - {transaction.productId.name}
                          </span>
                        )}
                      </TableCell>
                      <TableCell
                        className={`font-medium ${
                          transaction.amount >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {transaction.amount >= 0 ? '+' : ''}
                        {formatCurrency(Math.abs(transaction.amount), settings?.currency || 'PHP')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {transaction.status}
                        </Badge>
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

