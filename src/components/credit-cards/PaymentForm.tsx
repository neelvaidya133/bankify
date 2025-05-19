"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/utils/format";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import EMIPaymentForm from "./EMIPaymentForm";

interface PaymentFormProps {
  productId: string;
  amount: number;
  onSuccess: () => void;
}

export default function PaymentForm({
  productId,
  amount,
  onSuccess,
}: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [paymentType, setPaymentType] = useState<"full" | "emi">("full");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate card number (16 digits)
    if (!/^\d{16}$/.test(cardNumber)) {
      toast.error("Please enter a valid 16-digit card number");
      return;
    }

    // Validate expiry date (MM/YY format)
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
      toast.error("Please enter a valid expiry date (MM/YY)");
      return;
    }

    // Validate CVV (3 digits)
    if (!/^\d{3}$/.test(cvv)) {
      toast.error("Please enter a valid 3-digit CVV");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          cardNumber,
          expiryDate,
          cvv,
          amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process payment");
      }

      toast.success("Payment successful");
      onSuccess();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <RadioGroup
          value={paymentType}
          onValueChange={(value) => setPaymentType(value as "full" | "emi")}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="full" id="full" />
            <Label htmlFor="full">Full Payment</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="emi" id="emi" />
            <Label htmlFor="emi">EMI Payment</Label>
          </div>
        </RadioGroup>
      </div>

      {paymentType === "full" ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Card Number</label>
            <Input
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) =>
                setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))
              }
              className="font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Expiry Date</label>
              <Input
                type="text"
                placeholder="MM/YY"
                value={expiryDate}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  if (value.length <= 2) {
                    setExpiryDate(value);
                  } else {
                    setExpiryDate(`${value.slice(0, 2)}/${value.slice(2, 4)}`);
                  }
                }}
                className="font-mono"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">CVV</label>
              <Input
                type="text"
                placeholder="123"
                value={cvv}
                onChange={(e) =>
                  setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))
                }
                className="font-mono"
                required
              />
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Processing..." : `Pay ${formatCurrency(amount)}`}
            </Button>
          </div>
        </form>
      ) : (
        <EMIPaymentForm
          productId={productId}
          amount={amount}
          onSuccess={onSuccess}
        />
      )}
    </div>
  );
}
