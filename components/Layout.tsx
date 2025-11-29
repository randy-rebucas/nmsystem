'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActivated: boolean;
  isAdmin?: boolean;
  wallet?: {
    balance: number;
    pending: number;
    totalEarned: number;
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const isAuthFreeRoute =
    pathname === '/login' || pathname === '/register' || pathname === '/setup';
  const isAdminRoute = pathname?.startsWith('/admin');

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  const fetchUser = async () => {
    // Skip auth check for public pages
    if (isAuthFreeRoute || isAdminRoute) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Ensure cookies are sent
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
        } else {
          // No user in response, redirect to login
          setRedirecting(true);
          router.push('/login');
        }
      } else {
        // Unauthorized or other error, redirect to login
        setRedirecting(true);
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      // Network error or other issue, redirect to login
      setRedirecting(true);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  if (isAuthFreeRoute || isAdminRoute) {
    return <>{children}</>;
  }

  if (loading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  if (!user && !isAuthFreeRoute && !isAdminRoute) {
    // Should not reach here if redirect is working, but as fallback
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard" className="text-xl font-bold text-primary">
                  NMSystem
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/dashboard"
                  className={cn(
                    "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors",
                    pathname === '/dashboard'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                  )}
                >
                  Dashboard
                </Link>
                <Link
                  href="/products"
                  className={cn(
                    "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors",
                    pathname === '/products'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                  )}
                >
                  Products
                </Link>
                <Link
                  href="/wallet"
                  className={cn(
                    "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors",
                    pathname === '/wallet'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                  )}
                >
                  Wallet
                </Link>
                <Link
                  href="/genealogy"
                  className={cn(
                    "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors",
                    pathname === '/genealogy'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                  )}
                >
                  Genealogy
                </Link>
                <Link
                  href="/commissions"
                  className={cn(
                    "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors",
                    pathname === '/commissions'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                  )}
                >
                  Commissions
                </Link>
                <Link
                  href="/rewards"
                  className={cn(
                    "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors",
                    pathname === '/rewards'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                  )}
                >
                  Rewards
                </Link>
                {user?.isAdmin && (
                  <Link
                    href="/admin"
                    className={cn(
                      "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors",
                      pathname === '/admin'
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                    )}
                  >
                    Admin
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <span className="text-sm text-muted-foreground">
                  {user.firstName} {user.lastName}
                </span>
              )}
              <Button onClick={handleLogout} variant="default">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

