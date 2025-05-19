"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { formatCurrency } from "@/utils/card-utils";

interface BalanceDisplayProps {
  initialBalance: number;
  userId: string;
}

export default function BalanceDisplay({
  initialBalance,
  userId,
}: BalanceDisplayProps) {
  const [balance, setBalance] = useState(initialBalance);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to changes in the bank_accounts table
    const channel = supabase
      .channel("bank_account_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bank_accounts",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Update the balance when changes occur
          if (payload.new && "balance" in payload.new) {
            setBalance(payload.new.balance);
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  return <div className="text-3xl font-bold">{formatCurrency(balance)}</div>;
}
