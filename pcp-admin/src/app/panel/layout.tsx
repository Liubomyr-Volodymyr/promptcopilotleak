'use client';

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { useEffect } from 'react';
import { redirect } from 'next/navigation';
import { ProtectedRoute } from '@/components/protect-route';

export default function Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      redirect('/');
    }
  }, []);

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <main className='w-full'>{children}</main>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
