'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');

    if (!token) {
      router.replace('/');
      setIsAuthorized(false);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        sessionStorage.removeItem('accessToken');
        router.replace('/');
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
      }
    } catch {
      sessionStorage.removeItem('accessToken');
      router.replace('/');
      setIsAuthorized(false);
    }
  }, [router]);

  if (isAuthorized === null) return;
  if (!isAuthorized) return null;
  return <>{children}</>;
}
