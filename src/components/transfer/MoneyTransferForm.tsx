"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/utils/card-utils";

export default function MoneyTransferForm() {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientEmail,
          amount: parseFloat(amount),
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process transfer");
      }

      toast.success("Transfer completed successfully");
      // Reset form
      setAmount("");
      setRecipientEmail("");
      setDescription("");
    } catch (error) {
      console.error("Transfer error:", error);
      toast.error(error instanceof Error ? error.message : "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Recipient Email</label>
        <Input
          type="email"
          value={recipientEmail}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setRecipientEmail(e.target.value)
          }
          placeholder="Enter recipient's email"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Amount</label>
        <Input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setAmount(e.target.value)
          }
          placeholder="Enter amount"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description (Optional)</label>
        <Textarea
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setDescription(e.target.value)
          }
          placeholder="Add a note for this transfer"
          rows={3}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !amount || !recipientEmail}
      >
        {loading
          ? "Processing..."
          : `Send ${formatCurrency(parseFloat(amount) || 0)}`}
      </Button>
    </form>
  );
}
