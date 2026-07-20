"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AgendaDateNav() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");

  // Parse current date from query param, default to today
  const today = new Date(2026, 6, 16); // Fixed to match seed data date
  const currentDate = dateParam
    ? new Date(`${dateParam}T00:00:00`)
    : today;

  function formatDate(date: Date): string {
    const opts: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
    };
    const str = date.toLocaleDateString("es-PE", opts);
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function toISO(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  function navigate(days: number) {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    router.push(`/agenda?date=${toISO(newDate)}`);
  }

  function goToday() {
    router.push(`/agenda?date=${toISO(today)}`);
  }

  return (
    <div className="flex items-center gap-3 bg-color-surface border border-color-line rounded-full px-3 py-2 w-fit">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="px-2"
      >
        <ChevronLeft size={18} />
      </Button>

      <div className="min-w-40 text-center text-sm font-serif font-semibold text-color-ink">
        {formatDate(currentDate)}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(1)}
        className="px-2"
      >
        <ChevronRight size={18} />
      </Button>

      {toISO(currentDate) !== toISO(today) && (
        <>
          <div className="border-l border-color-line-soft mx-1"></div>
          <button
            onClick={goToday}
            className="px-3 py-1 text-xs font-bold text-color-accent-rose hover:bg-red-50 rounded-full transition-colors"
          >
            Hoy
          </button>
        </>
      )}
    </div>
  );
}
