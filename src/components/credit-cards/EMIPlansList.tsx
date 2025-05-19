"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { formatCurrency } from "@/utils/card-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface EMIPlan {
  id: string;
  product_name: string;
  total_amount: number;
  emi_amount: number;
  total_installments: number;
  remaining_installments: number;
  next_payment_date: string;
  status: "active" | "completed" | "defaulted";
}

export default function EMIPlansList() {
  const [emiPlans, setEmiPlans] = useState<EMIPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchEMIPlans = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("emi_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEmiPlans(data || []);
    } catch (error) {
      console.error("Error fetching EMI plans:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchEMIPlans();
  }, [fetchEMIPlans]);

  if (loading) {
    return <div>Loading EMI plans...</div>;
  }

  if (emiPlans.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No EMI plans found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {emiPlans.map((plan) => (
        <Card key={plan.id}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{plan.product_name}</span>
              <span
                className={`text-sm font-medium ${
                  plan.status === "active"
                    ? "text-green-600"
                    : plan.status === "completed"
                      ? "text-blue-600"
                      : "text-red-600"
                }`}
              >
                {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-medium">
                    {formatCurrency(plan.total_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monthly EMI</p>
                  <p className="font-medium">
                    {formatCurrency(plan.emi_amount)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Payment Progress</p>
                <Progress
                  value={
                    ((plan.total_installments - plan.remaining_installments) /
                      plan.total_installments) *
                    100
                  }
                  className="h-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {plan.total_installments - plan.remaining_installments} of{" "}
                  {plan.total_installments} installments paid
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Next Payment Date</p>
                <p className="font-medium">
                  {new Date(plan.next_payment_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
