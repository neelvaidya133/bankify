"use client";
import { createClient } from "@/utils/supabase/client";
import React, { useEffect } from "react";

interface User {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
  }
}

interface UserGreetTextProps {
  user?: User | null
}

const UserGreetText = ({ user }: UserGreetTextProps) => {
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        window.location.href = '/login'
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  if (!user) {
    return null;
  }

  const displayName = user.user_metadata?.full_name || user.email || 'User';

  return (
    <div className="text-sm text-gray-700">
      Welcome, {displayName}!
    </div>
  );
};

export default UserGreetText;