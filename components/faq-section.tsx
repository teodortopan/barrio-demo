"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

interface FAQSectionProps {
  faqs: FAQItem[];
}

export function FAQSection({ faqs }: FAQSectionProps) {
  const [openIndex] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
          <HelpCircle className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
        </div>
        <h2 className="text-lg font-bold text-[#1a1a1a] leading-tight uppercase">
          Preguntas frecuentes
        </h2>
      </div>
      <div className="flex-1 flex flex-col rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 overflow-hidden">
        <div className="flex-1 p-2 flex flex-col gap-2 overflow-y-auto">
          {faqs.map((faq, index) => (
            <div key={index} className="relative flex-1 flex min-h-[44px]">
              <button
                disabled
                aria-disabled="true"
                className="w-full h-full flex items-center gap-2 px-3 py-2.5 bg-white border border-[#E9E2CE] rounded-[14px] text-left cursor-default"
              >
                <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-[14px] bg-[#2d5016]/10 text-[#2d5016] text-[10px] font-bold">
                  ?
                </span>
                <span className="flex-1 text-[13px] text-[#1a2617]">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="shrink-0 w-4 h-4 text-[#2d5016]" />
                ) : (
                  <ChevronDown className="shrink-0 w-4 h-4 text-[#4d6547]" />
                )}
              </button>
              {openIndex === index && (
                <div className="absolute top-full left-0 right-0 mt-1 p-4 bg-white border border-[#E9E2CE] rounded-[14px] shadow-lg z-20 max-h-48 overflow-y-auto">
                  <div className="text-sm text-[#1a2617]">{faq.answer}</div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="shrink-0 px-4 py-2.5 border-t border-dashed border-[#E9E2CE] bg-white">
          <p className="text-[11px] text-[#4d6547] italic text-center">
            Ante cualquier duda, consultá en la biblioteca o con administración
          </p>
        </div>
      </div>
    </div>
  );
}
