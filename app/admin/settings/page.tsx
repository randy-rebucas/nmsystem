'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

const DEFAULT_COMMISSION_STRUCTURE: { [key: number]: number } = {
  0: 165, // Direct (Level 0)
  1: 70,
  2: 70,
  3: 70,
  4: 70,
  5: 70,
  6: 60,
  7: 60,
  8: 60,
  9: 60,
  10: 60,
  11: 50,
  12: 50,
  13: 50,
  14: 50,
  15: 50,
  16: 40,
  17: 30,
  18: 20,
  19: 10,
  20: 5,
};

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [settings, setSettings] = useState({
    siteName: 'NMSystem',
    currency: 'PHP',
    minRedemptionPoints: '100',
    minWithdraw: '100',
    maxWithdraw: '50000',
    commissionStructure: { ...DEFAULT_COMMISSION_STRUCTURE },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings({
          siteName: data.siteName || 'NMSystem',
          currency: data.currency || 'PHP',
          minRedemptionPoints: String(data.minRedemptionPoints || 100),
          minWithdraw: String(data.minWithdraw || 100),
          maxWithdraw: String(data.maxWithdraw || 50000),
          commissionStructure: data.commissionStructure || { ...DEFAULT_COMMISSION_STRUCTURE },
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: settings.siteName,
          currency: settings.currency,
          minRedemptionPoints: parseInt(settings.minRedemptionPoints),
          minWithdraw: parseFloat(settings.minWithdraw),
          maxWithdraw: parseFloat(settings.maxWithdraw),
          commissionStructure: settings.commissionStructure,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save settings');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const updateCommissionLevel = (level: number, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setSettings({
        ...settings,
        commissionStructure: {
          ...settings.commissionStructure,
          [level]: numValue,
        },
      });
    } else if (value === '') {
      setSettings({
        ...settings,
        commissionStructure: {
          ...settings.commissionStructure,
          [level]: 0,
        },
      });
    }
  };

  const calculateTotalCommission = () => {
    return Object.values(settings.commissionStructure).reduce((sum, amount) => sum + amount, 0);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin">Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Control global application preferences and limits.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>Settings saved successfully.</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="app" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="app">App Settings</TabsTrigger>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
            <TabsTrigger value="commission">Commission</TabsTrigger>
          </TabsList>

          <TabsContent value="app" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>App Settings</CardTitle>
                <CardDescription>Configure general settings for the application.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="siteName">Site Name</Label>
                      <Input
                        id="siteName"
                        value={settings.siteName}
                        onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Input
                        id="currency"
                        value={settings.currency}
                        onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minRedemptionPoints">Minimum Redemption Points</Label>
                      <Input
                        id="minRedemptionPoints"
                        type="number"
                        value={settings.minRedemptionPoints}
                        onChange={(e) => setSettings({ ...settings, minRedemptionPoints: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallet" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Wallet Settings</CardTitle>
                <CardDescription>Configure withdrawal limits for user wallets.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minWithdraw">Minimum Withdrawal (₱)</Label>
                      <Input
                        id="minWithdraw"
                        type="number"
                        step="0.01"
                        min="0"
                        value={settings.minWithdraw}
                        onChange={(e) => setSettings({ ...settings, minWithdraw: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum amount users can withdraw from their wallet.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxWithdraw">Maximum Withdrawal (₱)</Label>
                      <Input
                        id="maxWithdraw"
                        type="number"
                        step="0.01"
                        min="0"
                        value={settings.maxWithdraw}
                        onChange={(e) => setSettings({ ...settings, maxWithdraw: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum amount users can withdraw per transaction.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Wallet Settings'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commission" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Commission Structure</CardTitle>
                <CardDescription>
                  Manage commission rates for each level. Total: ₱{calculateTotalCommission().toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-24">Level</TableHead>
                          <TableHead>Label</TableHead>
                          <TableHead>Amount (₱)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.from({ length: 21 }, (_, i) => i).map((level) => (
                          <TableRow key={level}>
                            <TableCell className="font-medium">{level}</TableCell>
                            <TableCell>{level === 0 ? 'Direct' : `Level ${level}`}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={settings.commissionStructure[level] || 0}
                                onChange={(e) => updateCommissionLevel(level, e.target.value)}
                                className="w-32"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="pt-4 border-t flex items-center justify-between">
                    <div className="text-sm font-medium">
                      Total Commission: ₱{calculateTotalCommission().toLocaleString()}
                    </div>
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Commission Structure'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}


