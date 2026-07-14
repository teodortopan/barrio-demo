"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AddVecinoForm } from "./add-vecino-form";

interface AddVecinoButtonProps {
  targetPeriod: {
    year: number;
    month: number;
    isCurrent: boolean;
  };
  onAdd: () => void;
}

export function AddVecinoButton({ targetPeriod, onAdd }: AddVecinoButtonProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsFormOpen(true)}
        className="inline-flex items-center gap-1.5 bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] rounded-[14px] px-3 py-1.5 text-xs font-semibold transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Añadir
      </button>
      <AddVecinoForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onAdd={onAdd}
        targetPeriod={targetPeriod}
      />
    </>
  );
}
