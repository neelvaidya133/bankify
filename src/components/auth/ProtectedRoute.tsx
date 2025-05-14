'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
// import { supabase } from '@/lib/supabase/client';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
    const session = "sasa"
      if (!session) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  return <>{children}</>;
}
