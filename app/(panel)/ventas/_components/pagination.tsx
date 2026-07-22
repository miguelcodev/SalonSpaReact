"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
}

export function Pagination({ page, pageSize, totalCount }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`${pathname}?${params.toString()}`);
  }

  if (totalCount === 0) return null;

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <p className="text-xs text-color-ink-soft">
        {rangeStart}–{rangeEnd} de {totalCount} venta{totalCount !== 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 rounded-full border border-color-line bg-color-surface flex items-center justify-center text-color-ink-soft hover:bg-color-line-soft disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-semibold text-color-ink-soft px-1">
          Página {page} de {totalPages}
        </span>
        <button
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
          className="w-8 h-8 rounded-full border border-color-line bg-color-surface flex items-center justify-center text-color-ink-soft hover:bg-color-line-soft disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
