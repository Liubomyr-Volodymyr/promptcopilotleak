'use client';

import {useState, memo, useEffect} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { navigationList } from '@/constants/navigation-list';
import { LogOut } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {useGetMeQuery, useGetServerInfoQuery} from '@/store/api/auth.api';
import Link from "next/link";

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user } = useGetMeQuery();
  const { data: serverInfo } = useGetServerInfoQuery();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('accessToken');
    router.replace('/');
  };

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'production': return 'bg-red-100 text-red-800 border-red-300';
      case 'staging': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'local': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getEnvironmentLabel = (env: string) => {
    switch (env) {
      case 'production': return 'PRODUCTION';
      case 'staging': return 'STAGING';
      case 'local': return 'LOCAL';
      default: return env.toUpperCase();
    }
  };

  const SidebarItem = memo(({ item }: { item: typeof navigationList[0] }) => {
    return (
        <SidebarMenuItem className="md:ml-2">
          <SidebarMenuButton asChild>
            <Link
                href={item.url}
                className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 ${
                    pathname === item.url ? 'bg-gray-200 font-semibold' : ''
                }`}
                aria-current={pathname === item.url ? 'page' : undefined}
            >
              <item.icon />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
    );
  });

  return (
      <Sidebar>
        <SidebarContent className="py-4 px-2">
          <SidebarHeader className="px-2 mb-2">
            <div className="flex flex-col gap-2">
              <Label className="text-sm text-gray-600">
                {user?.email ?? 'Admin Panel'}
              </Label>
              {serverInfo?.environment && (
                  <div
                      className={`inline-flex items-center justify-center px-2 py-1 text-xs font-semibold rounded border ${getEnvironmentColor(
                          serverInfo.environment
                      )}`}
                  >
                    {getEnvironmentLabel(serverInfo.environment)}
                  </div>
              )}
            </div>
          </SidebarHeader>

          <Separator />

          <SidebarMenu>
            {navigationList.map(item => (
                <SidebarItem key={item.title} item={item} />
            ))}
          </SidebarMenu>

          <Separator />

          <SidebarMenuButton
              className="text-[#BB5555] flex items-center gap-2"
              onClick={handleLogout}
          >
            <LogOut color="#BB5555" />
            Logout
          </SidebarMenuButton>
        </SidebarContent>
      </Sidebar>
  );
}
