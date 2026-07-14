"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Bell } from "lucide-react";
import { roleDisplayName } from "@/lib/auth/permissions";

interface Reminder {
  id: string;
  type: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author_role: string | null;
}

interface AnnouncementsDisplayProps {
  initialReminders?: Reminder[];
}

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const diffMs = Math.max(0, Date.now() - t);
  if (diffMs < 60_000) return "hace instantes";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `hace ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
  const days = Math.floor(hours / 24);
  return `hace ${days} ${days === 1 ? "día" : "días"}`;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div data-tour-id="recordatorios" className="relative bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 h-full w-full flex flex-col">
      {children}
    </div>
  );
}

export function AnnouncementsDisplay({ initialReminders }: AnnouncementsDisplayProps) {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders || []);
  const [loading, setLoading] = useState(!initialReminders);

  useEffect(() => {
    // With server-provided data, do not refetch on timers/focus. A 72h-expired
    // recordatorio should disappear only after a page refresh/navigation.
    if (initialReminders) return;
    async function fetchReminders() {
      try {
        const response = await fetch("/api/reminders?type=recordatorio");
        const result = await response.json();
        if (result.error) {
          console.error("Error fetching reminders:", result.error);
        } else {
          setReminders(result.reminders || []);
        }
      } catch (error) {
        console.error("Error fetching reminders:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchReminders();
  }, [initialReminders]);

  if (loading) {
    return (
      <Shell>
        <div className="flex-1 min-h-0 flex flex-col rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 overflow-hidden">
          <div className="flex-1 p-4 space-y-2">
            <div className="h-3 w-2/3 rounded bg-gray-200 animate-pulse" />
            <div className="h-3 w-full rounded bg-gray-200 animate-pulse" />
            <div className="h-3 w-5/6 rounded bg-gray-200 animate-pulse" />
          </div>
        </div>
      </Shell>
    );
  }

  if (reminders.length === 0) {
    return (
      <Shell>
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 p-6 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-[14px] bg-[#2d5016]/10 mb-3">
            <Bell className="w-5 h-5 text-[#2d5016]" strokeWidth={2} />
          </div>
          <p className="text-sm font-medium text-[#1a1a1a]">No hay recordatorios</p>
        </div>
      </Shell>
    );
  }

  const latest = reminders[0];
  const relative = formatRelative(latest.created_at);
  const role = roleDisplayName(latest.author_role);

  return (
    <Shell>
      {/* Latest recordatorio card. Body scrolls; title + footer stay pinned. */}
      <div className="flex-1 min-h-0 flex flex-col rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 overflow-hidden">
        <div className="flex flex-1 min-h-0">
          {/* Forest accent stripe */}
          <div className="w-[3px] shrink-0 bg-[#2d5016] rounded-l-[14px]" />
          <div className="flex-1 min-w-0 flex flex-col p-4">
            <h3 className="text-base font-semibold text-[#1a1a1a] leading-snug shrink-0">
              {latest.title}
            </h3>
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 mt-2">
              <p className="text-sm text-[#3c3c3c] leading-relaxed whitespace-pre-wrap break-words">
                {latest.content}
              </p>
              {latest.image_url && (
                <Image
                  src={latest.image_url}
                  alt=""
                  width={640}
                  height={256}
                  unoptimized
                  className="mt-3 max-h-32 w-full object-cover rounded-[14px] border border-[#E9E2CE]"
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer: role pill + relative time */}
        <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-2.5 border-t border-dashed border-[#E9E2CE]">
          <div className="flex items-center gap-1.5 text-xs text-gray-600 min-w-0">
            <span className="shrink-0">De parte de</span>
            <span className="px-2 py-0.5 rounded-[14px] bg-[#2d5016]/10 text-[#2d5016] text-xs font-medium truncate">
              {role}
            </span>
          </div>
          <span className="shrink-0 text-xs text-gray-500">{relative}</span>
        </div>
      </div>
    </Shell>
  );
}
