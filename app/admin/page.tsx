'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LineChart as LineChartIcon, Package, Users as UsersIcon, ReceiptText } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Product {
  _id: string;
  name: string;
  sellingPrice: number;
  isActive: boolean;
}

interface ActivityData {
  month: string;
  activity: number;
}

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchActivityData();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityData = async () => {
    try {
      const response = await fetch('/api/admin/stats/activity');
      if (response.ok) {
        const data = await response.json();
        setActivityData(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setActivityLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-0 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.isActive).length;

  return (
    <div className="px-4 sm:px-0 space-y-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin">Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Overview</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          High-level view of products, users, and transactions.
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Total Products</CardDescription>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalProducts}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {activeProducts} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Users</CardDescription>
            <UsersIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">—</p>
            <p className="mt-1 text-xs text-muted-foreground">Wire to admin users API</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Transactions</CardDescription>
            <ReceiptText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">—</p>
            <p className="mt-1 text-xs text-muted-foreground">Wire to admin transactions API</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Store activity
                <LineChartIcon className="h-4 w-4 text-primary" />
              </CardTitle>
              <CardDescription>Last 6 periods</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              {activityLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={activityData.length > 0 ? activityData : [
                      { month: 'Jan', activity: 0 },
                      { month: 'Feb', activity: 0 },
                      { month: 'Mar', activity: 0 },
                      { month: 'Apr', activity: 0 },
                      { month: 'May', activity: 0 },
                      { month: 'Jun', activity: 0 },
                    ]}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                  <defs>
                    <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
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
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'calc(var(--radius) - 2px)',
                    }}
                    formatter={(value: number) => [value, 'Activity']}
                  />
                  <Area
                    type="monotone"
                    dataKey="activity"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorActivity)"
                  />
                </AreaChart>
              </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Products</CardTitle>
            <CardDescription>Latest items in the catalog.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.slice(0, 5).map((p) => (
                    <TableRow key={p._id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>₱{p.sellingPrice.toLocaleString()}</TableCell>
                      <TableCell>{p.isActive ? 'Active' : 'Inactive'}</TableCell>
                    </TableRow>
                  ))}
                  {products.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-muted-foreground">
                        No products found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

