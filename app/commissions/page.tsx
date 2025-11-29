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

interface CommissionSummary {
  totalEarned: number;
  pending: number;
  balance: number;
  byLevel: Array<{ level: number; amount: number; count: number }>;
}

interface Commission {
  _id: string;
  level: number;
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
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardDescription>Total Earned</CardDescription>
              <CardTitle className="text-2xl text-blue-600">
                ₱{summary.totalEarned.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-2xl text-yellow-600">
                ₱{summary.pending.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Available</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                ₱{summary.balance.toLocaleString()}
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
                    <TableHead>Level</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.byLevel.map((item) => (
                    <TableRow key={item.level}>
                      <TableCell className="font-medium">
                        {item.level === 0 ? 'Direct (Level 0)' : `Level ${item.level}`}
                      </TableCell>
                      <TableCell>{item.count}</TableCell>
                      <TableCell className="font-medium text-green-600">
                        ₱{item.amount.toLocaleString()}
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
                    <TableHead>Level</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((commission) => (
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
                        {commission.level === 0
                          ? 'Direct'
                          : `Level ${commission.level}`}
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        ₱{commission.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {commission.status}
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

