"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface ExpenseItem {
  name: string;
  amount: string;
}

interface SaldoTooltipProps {
  total: string;
  expenses: ExpenseItem[];
  children: React.ReactNode;
}

export function SaldoTooltip({ total, expenses, children }: SaldoTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isHovered && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        top: rect.top + window.scrollY,
        left: rect.left + rect.width / 2,
      });
    }
  }, [isHovered]);

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {isHovered && expenses.length > 0 &&
        createPortal(
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{
              top: pos.top,
              left: pos.left,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="mb-2 pointer-events-auto">
              <div className="bg-white text-[#1a1a1a] rounded px-2.5 py-1.5 shadow-lg border border-gray-200 max-h-[200px] overflow-y-auto min-w-[200px]">
                <div className="text-[9px] leading-tight space-y-0.5">
                  {expenses.map((expense, index) => (
                    <div key={index} className="flex justify-between gap-1.5 whitespace-nowrap">
                      <span className="truncate">{expense.name}</span>
                      <span className="flex-shrink-0">{expense.amount}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 mt-0.5 pt-0.5 flex justify-between gap-1.5 font-bold whitespace-nowrap">
                    <span>Total</span>
                    <span>{total}</span>
                  </div>
                </div>
              </div>
              {/* Arrow */}
              <div className="flex justify-center -mt-1">
                <div className="border-4 border-transparent border-t-white"></div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
