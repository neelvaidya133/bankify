"use client";
import React, { useEffect } from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { signout } from "@/lib/auth-actions";

interface User {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
  }
}

interface LoginLogoutButtonProps {
  user: User | null
}

const LoginButton = ({ user }: LoginLogoutButtonProps) => {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, router]);

  const handleLogout = async () => {
    await signout();
  };

  if (user) {
    return (
      <Button
        onClick={handleLogout}
        className="text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        Logout
      </Button>
    );
  }

  return (
    <Button
      onClick={() => router.push('/login')}
      className="text-sm font-medium text-gray-700 hover:text-gray-900"
    >
      Login
    </Button>
  );
};

export default LoginButton;