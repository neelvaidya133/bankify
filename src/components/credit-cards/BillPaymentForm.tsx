"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/utils/card-utils";
import { makePayment } from "@/app/(dashboard)/credit-cards/payments/actions";

interface BillPaymentFormProps {
  cardId: string;
  billId: string;
  amount: number;
  paidAmount: number;
}

export default function BillPaymentForm({
  cardId,
  billId,
  amount,
  paidAmount,
}: BillPaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const remainingBalance = Number((amount - paidAmount).toFixed(2));
  const [paymentAmount, setPaymentAmount] = useState(remainingBalance);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const roundedAmount = Number(paymentAmount.toFixed(2));

    if (roundedAmount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    if (roundedAmount > remainingBalance) {
      toast.error("Payment amount cannot exceed the remaining balance");
      return;
    }

    setLoading(true);
    try {
      const result = await makePayment({
        cardId,
        billId,
        amount: roundedAmount,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to process payment");
      }

      toast.success("Payment successful");
      // The page will be automatically revalidated by the server action
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Payment Amount</label>
        <Input
          type="number"
          min="0.01"
          max={remainingBalance}
          step="0.01"
          value={paymentAmount}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (value <= remainingBalance) {
              setPaymentAmount(value);
            }
          }}
          className="font-mono"
          required
        />
        <p className="text-sm text-gray-500">
          Remaining balance: {formatCurrency(remainingBalance)}
        </p>
      </div>

      <div className="pt-4">
        <Button
          type="submit"
          className="w-full"
          disabled={
            loading || paymentAmount <= 0 || paymentAmount > remainingBalance
          }
        >
          {loading ? "Processing..." : `Pay ${formatCurrency(paymentAmount)}`}
        </Button>
      </div>
    </form>
  );
}
