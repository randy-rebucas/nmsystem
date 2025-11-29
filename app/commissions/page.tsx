'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useSettings, formatCurrency } from '@/hooks/use-settings';

interface CommissionSummary {
  totalEarned: number;
  pending: number;
  balance: number;
  direct: { amount: number; count: number };
  indirect: { amount: number; count: number };
  byLevel: Array<{ level: number; amount: number; count: number; type: 'direct' | 'indirect' }>;
}

interface Commission {
  _id: string;
  level: number;
  type?: 'direct' | 'indirect';
  amount: number;
  status: string;
  createdAt: string;
  fromUserId: {
    firstName: string;
    lastName: string;
    email: string;
  };
  productId: {
    name: string;
  };
}

export default function CommissionsPage() {
  const { settings } = useSettings();
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  
  const currency = settings?.currency || 'PHP';

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    try {
      const [summaryRes, commissionsRes] = await Promise.all([
        fetch('/api/commissions?summary=true'),
        fetch('/api/commissions'),
      ]);

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary);
      }

      if (commissionsRes.ok) {
        const commissionsData = await commissionsRes.json();
        setCommissions(commissionsData.commissions || []);
      }
    } catch (error) {
      console.error('Error fetching commissions:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="px-4 py-6 sm:px-0 space-y-6">
      <h1 className="text-3xl font-bold">Commissions</h1>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader>
              <CardDescription>Total Earned</CardDescription>
              <CardTitle className="text-2xl text-blue-600">
                {formatCurrency(summary.totalEarned, currency)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Direct Commissions</CardDescription>
              <CardTitle className="text-2xl text-purple-600">
                {formatCurrency(summary.direct.amount, currency)}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {summary.direct.count} transactions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Indirect Commissions</CardDescription>
              <CardTitle className="text-2xl text-orange-600">
                {formatCurrency(summary.indirect.amount, currency)}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {summary.indirect.count} transactions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-2xl text-yellow-600">
                {formatCurrency(summary.pending, currency)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Available</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                {formatCurrency(summary.balance, currency)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {summary && summary.byLevel.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Commissions by Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.byLevel.map((item) => (
                    <TableRow key={item.level}>
                      <TableCell>
                        <Badge variant={item.type === 'direct' ? 'default' : 'secondary'}>
                          {item.type === 'direct' ? 'Direct' : 'Indirect'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.level === 0 ? 'Level 0' : `Level ${item.level}`}
                      </TableCell>
                      <TableCell>{item.count}</TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatCurrency(item.amount, currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Commissions</CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <p className="text-muted-foreground">No commissions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((commission) => {
                    const type = commission.type || (commission.level === 0 ? 'direct' : 'indirect');
                    return (
                      <TableRow key={commission._id}>
                        <TableCell>
                          {new Date(commission.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {commission.fromUserId.firstName}{' '}
                          {commission.fromUserId.lastName}
                        </TableCell>
                        <TableCell>{commission.productId.name}</TableCell>
                        <TableCell>
                          <Badge variant={type === 'direct' ? 'default' : 'secondary'}>
                            {type === 'direct' ? 'Direct' : 'Indirect'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          Level {commission.level}
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatCurrency(commission.amount, currency)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {commission.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

