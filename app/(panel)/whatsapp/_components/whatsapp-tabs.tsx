"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const TABS = [
  { key: "cola", label: "Cola" },
  { key: "enviados", label: "Enviados" },
  { key: "reglas", label: "Reglas de automatización" },
];

export function WhatsappTabs({ activeTab }: { activeTab: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {TABS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setTab(key)}
          className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
            activeTab === key
              ? "bg-color-ink text-white border-color-ink"
              : "bg-color-surface text-color-ink-soft border-color-line hover:bg-color-line-soft"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
