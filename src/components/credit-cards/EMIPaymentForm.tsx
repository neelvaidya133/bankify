"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/utils/card-utils";
import { Input } from "@/components/ui/input";

interface EMIPaymentFormProps {
  productId: string;
  amount: number;
  onSuccess: () => void;
}

const EMI_TENURES = [
  { value: "4", label: "4 months" },
  { value: "6", label: "6 months" },
  { value: "12", label: "12 months" },
  { value: "18", label: "18 months" },
  { value: "24", label: "24 months" },
];

export default function EMIPaymentForm({
  productId,
  amount,
  onSuccess,
}: EMIPaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedTenure, setSelectedTenure] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  const calculateEMIAmount = () => {
    if (!selectedTenure) return 0;
    const tenure = parseInt(selectedTenure);
    // Simple EMI calculation: Principal + 10% interest per annum
    const interestRate = 0.1; // 10% per annum
    const monthlyInterest = interestRate / 12;
    const emi =
      (amount * monthlyInterest * Math.pow(1 + monthlyInterest, tenure)) /
      (Math.pow(1 + monthlyInterest, tenure) - 1);
    return Number(emi.toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTenure) {
      toast.error("Please select an EMI tenure");
      return;
    }

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
      const response = await fetch("/api/purchase/emi", {
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
          tenure: parseInt(selectedTenure),
          emiAmount: calculateEMIAmount(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process EMI payment");
      }

      toast.success("EMI payment plan created successfully");
      onSuccess();
    } catch (error) {
      console.error("EMI payment error:", error);
      toast.error(
        error instanceof Error ? error.message : "EMI payment failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const emiAmount = calculateEMIAmount();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Select EMI Tenure</label>
        <Select value={selectedTenure} onValueChange={setSelectedTenure}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select tenure" />
          </SelectTrigger>
          <SelectContent>
            {EMI_TENURES.map((tenure) => (
              <SelectItem key={tenure.value} value={tenure.value}>
                {tenure.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedTenure && (
          <p className="text-sm text-gray-500">
            Monthly EMI: {formatCurrency(emiAmount)}
          </p>
        )}
      </div>

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
        <Button
          type="submit"
          className="w-full"
          disabled={loading || !selectedTenure}
        >
          {loading
            ? "Processing..."
            : `Pay EMI of ${formatCurrency(emiAmount)}`}
        </Button>
      </div>
    </form>
  );
}
