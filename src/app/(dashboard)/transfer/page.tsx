import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import MoneyTransferForm from "@/components/transfer/MoneyTransferForm";
import BalanceDisplay from "@/components/dashboard/BalanceDisplay";

export default async function TransferPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's bank account balance
  const { data: bankAccount } = await supabase
    .from("bank_accounts")
    .select("balance")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Send Money</h1>
        <p className="text-gray-600">
          Transfer money to other users using their email address
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Available Balance</h2>
          <BalanceDisplay
            initialBalance={bankAccount?.balance || 0}
            userId={user.id}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Transfer Money</h2>
          <MoneyTransferForm />
        </div>
      </div>
    </div>
  );
}
