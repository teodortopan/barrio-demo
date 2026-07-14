"use client";

import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";

interface PaymentCard {
  title: string;
  subtitle: string;
  amount: string;
  bgColor: string;
  id: string;
}

interface EditablePaymentCardsProps {
  initialPayments: PaymentCard[];
}

export function EditablePaymentCards({ initialPayments }: EditablePaymentCardsProps) {
  const [payments, setPayments] = useState<PaymentCard[]>(initialPayments);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [shouldIgnoreBlur, setShouldIgnoreBlur] = useState(false);

  // Fetch prices from API on mount and after updates
  const fetchPrices = async () => {
    try {
      const response = await fetch("/api/payments");
      const data = await response.json();
      if (data.allPrices) {
        // Helper function to ensure amount has $ sign
        const ensureDollarSign = (amount: string | undefined): string => {
          if (!amount) return "$0";
          return amount.startsWith('$') ? amount : `$${amount}`;
        };

        // Map API prices to payment cards
        setPayments(prevPayments => prevPayments.map(p => {
          if (p.id === "anticipado-efectivo" && data.allPrices.anticipadoEfectivo) {
            return { ...p, amount: ensureDollarSign(data.allPrices.anticipadoEfectivo) };
          } else if (p.id === "termino" && data.allPrices.termino) {
            return { ...p, amount: ensureDollarSign(data.allPrices.termino) };
          } else if (p.id === "recargo" && data.allPrices.recargo) {
            return { ...p, amount: ensureDollarSign(data.allPrices.recargo) };
          } else if (p.id === "vencido" && data.allPrices.vencido) {
            return { ...p, amount: ensureDollarSign(data.allPrices.vencido) };
          }
          return p;
        }));
      }
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  const handleEdit = (id: string, currentAmount: string) => {
    setEditingId(id);
    setEditValue(currentAmount);
  };

  const handleSave = async (id: string) => {
    if (isSaving || !editValue.trim()) {
      return;
    }

    setIsSaving(true);

    // Save to API first
    try {
      const response = await fetch("/api/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: id,
          amount: editValue.trim()
        })
      });

      const result = await response.json();

      if (result.error) {
        console.error("Error saving payment:", result.error);
        alert("Error al guardar el precio");
        setIsSaving(false);
        return;
      }

      // Refresh prices from database to ensure consistency
      await fetchPrices();

      // Close editing mode
      setEditingId(null);
      setEditValue("");
    } catch (error) {
      console.error("Error saving payment:", error);
      alert("Error al guardar el precio");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      setShouldIgnoreBlur(true); // Prevent blur from triggering
      handleSave(id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShouldIgnoreBlur(true); // Prevent blur from triggering
      handleCancel();
    }
  };

  const handleBlur = (id: string) => {
    // Only save on blur if we're not ignoring it (e.g., when Enter was pressed)
    if (!shouldIgnoreBlur && !isSaving && editingId === id) {
      handleSave(id);
    }
    // Reset the flag after a short delay to allow for next edit
    setTimeout(() => setShouldIgnoreBlur(false), 100);
  };

  // Tier styling — keeps tier semantics (better → worse) without clashing with
  // the cream/forest aesthetic. Each tile is cream with a colored eyebrow pill,
  // forest stripe accent, and dark forest amount.
  const TIER_STYLES: Record<string, {
    stripe: string;
    pillBg: string;
    pillText: string;
    pillBorder: string;
  }> = {
    "anticipado-efectivo": {
      stripe: "bg-green-500",
      pillBg: "bg-green-50",
      pillText: "text-green-700",
      pillBorder: "border-green-200",
    },
    termino: {
      stripe: "bg-amber-400",
      pillBg: "bg-amber-50",
      pillText: "text-amber-700",
      pillBorder: "border-amber-200",
    },
    recargo: {
      stripe: "bg-orange-500",
      pillBg: "bg-orange-50",
      pillText: "text-orange-700",
      pillBorder: "border-orange-200",
    },
    vencido: {
      stripe: "bg-red-500",
      pillBg: "bg-red-50",
      pillText: "text-red-700",
      pillBorder: "border-red-200",
    },
  };

  const formatAmount = (amount: string) =>
    amount && !amount.startsWith("$") ? `$${amount}` : amount || "$0";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {payments.map((payment) => {
        const tier = TIER_STYLES[payment.id] ?? TIER_STYLES.termino;
        const isEditing = editingId === payment.id;
        return (
          <div
            key={payment.id}
            className="relative rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 overflow-hidden flex"
          >
            <div className={`w-[3px] shrink-0 ${tier.stripe}`} />
            <div className="flex-1 min-w-0 p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded-[14px] text-[9px] font-bold uppercase tracking-wide border whitespace-nowrap ${tier.pillBg} ${tier.pillText} ${tier.pillBorder}`}
                >
                  {payment.title}
                </span>
                {!isEditing && (
                  <button
                    onClick={() => handleEdit(payment.id, payment.amount)}
                    className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-[14px] text-[#4d6547] hover:text-[#2d5016] hover:bg-[#2d5016]/10 transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>

              {isEditing ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, payment.id)}
                  onBlur={() => handleBlur(payment.id)}
                  className="w-full bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-1 text-lg font-bold font-mono text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors"
                  autoFocus
                  disabled={isSaving}
                />
              ) : (
                <div className="text-lg font-bold font-mono text-[#1a2617] leading-tight">
                  {formatAmount(payment.amount)}
                </div>
              )}

              <div className="text-[10px] text-[#4d6547] leading-tight mt-1">
                {payment.subtitle}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
