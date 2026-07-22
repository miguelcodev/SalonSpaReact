"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";

export function SalesSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") || "");

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-color-ink-faint"
      />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar por clienta..."
        className="w-56 pl-8 pr-3 py-2 rounded-full border border-color-line bg-color-surface text-sm focus:border-color-accent-rose focus:outline-none"
      />
    </div>
  );
}
