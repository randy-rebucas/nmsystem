'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminSidebar } from '@/components/admin-sidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    fetchAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAdmin = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user && data.user.isAdmin) {
          setUser(data.user);
        } else {
          setRedirecting(true);
          router.push('/dashboard');
        }
      } else {
        setRedirecting(true);
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching admin user:', error);
      setRedirecting(true);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

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

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <AdminSidebar
        userName={`${user.firstName} ${user.lastName}`}
        email={user.email}
        onLogout={handleLogout}
      />
      <SidebarInset>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

