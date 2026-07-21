"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { ProductCategory } from "@/lib/productos/types";

interface ProductosTabsProps {
  categories: ProductCategory[];
  activeCategoryId?: string;
  counts: Record<string, number>;
  totalCount: number;
}

export function ProductosTabs({
  categories,
  activeCategoryId,
  counts,
  totalCount,
}: ProductosTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setCategory(categoryId: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId) {
      params.set("cat", categoryId);
    } else {
      params.delete("cat");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => setCategory(undefined)}
        className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
          !activeCategoryId
            ? "bg-color-ink text-white border-color-ink"
            : "bg-color-surface text-color-ink-soft border-color-line hover:bg-color-line-soft"
        }`}
      >
        Todos ({totalCount})
      </button>

      {categories.map((cat) => {
        const isActive = activeCategoryId === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
              isActive
                ? "bg-color-ink text-white border-color-ink"
                : "bg-color-surface text-color-ink-soft border-color-line hover:bg-color-line-soft"
            }`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: cat.color_hex || "#B8697A" }}
            ></span>
            {cat.name} ({counts[cat.id] || 0})
          </button>
        );
      })}
    </div>
  );
}
