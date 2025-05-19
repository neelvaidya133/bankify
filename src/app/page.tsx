"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { LoginForm } from "./(auth)/login/components/loginForm";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error checking user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();
  }, [router, supabase.auth]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  );
}
