import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import EMIPlansList from "@/components/credit-cards/EMIPlansList";

export default async function EMIPlansPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">EMI Plans</h1>
      </div>

      <EMIPlansList />
    </div>
  );
}
