"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { signOut } from "@/lib/auth/actions";

const ACTIVE_MODULES = [
  { href: "/agenda", name: "Agenda de citas", color: "#C77B4B" },
  { href: "/crm", name: "Clientes (CRM)", color: "#B8697A" },
  { href: "/catalogo", name: "Catálogo de servicios", color: "#C9A227" },
  { href: "/promociones", name: "Promociones", color: "#C9A227" },
];

const COMING_SOON_MODULES = [
  { name: "Mensajería WhatsApp", color: "#4C7A5A" },
  { name: "Reportes", color: "#8D7B9E" },
];

export function Topbar() {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="bg-color-surface border-b border-color-line sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-color-accent-rose to-color-accent-gold">
              <span className="text-white font-serif font-bold text-sm">B</span>
            </div>
            <div>
              <div className="font-serif font-semibold text-color-ink">
                Bellamora
              </div>
              <div className="text-xs text-color-ink-soft uppercase tracking-widest">
                {ACTIVE_MODULES.find((m) => pathname.startsWith(m.href))?.name.split(
                  " ("
                )[0] || "Panel"}
              </div>
            </div>
          </Link>

          {/* Modules Dropdown */}
          <div className="relative">
            <button
              onClick={() => setNavOpen(!navOpen)}
              className="flex items-center gap-1 px-3 py-2 rounded-full border border-color-line hover:bg-color-line-soft text-sm font-semibold text-color-ink transition-colors"
            >
              Módulos
              <ChevronDown
                size={14}
                className={`transition-transform ${navOpen ? "rotate-180" : ""}`}
              />
            </button>

            {navOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-color-surface border border-color-line rounded-2xl shadow-modal z-20 overflow-hidden">
                <div className="py-2">
                  {ACTIVE_MODULES.map((module) => {
                    const isActive = pathname.startsWith(module.href);
                    return (
                      <Link
                        key={module.href}
                        href={module.href}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-red-50 ${
                          isActive ? "text-color-accent-rose" : "text-color-ink"
                        }`}
                        onClick={() => setNavOpen(false)}
                      >
                        <div
                          className="w-2 h-2 rounded"
                          style={{ backgroundColor: module.color }}
                        ></div>
                        <span>{module.name}</span>
                      </Link>
                    );
                  })}

                  <div className="border-t border-color-line-soft my-2"></div>

                  {COMING_SOON_MODULES.map((module) => (
                    <div
                      key={module.name}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-color-ink-faint opacity-50 cursor-not-allowed"
                    >
                      <div
                        className="w-2 h-2 rounded"
                        style={{ backgroundColor: module.color }}
                      ></div>
                      <span>{module.name}</span>
                      <span className="ml-auto text-xs uppercase tracking-wide bg-color-line-soft text-color-ink-soft px-2 py-1 rounded-full font-bold">
                        Próximamente
                      </span>
                    </div>
                  ))}

                  <div className="border-t border-color-line-soft my-2"></div>

                  <button
                    onClick={async () => {
                      setNavOpen(false);
                      await signOut();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 text-left"
                  >
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Close dropdown when clicking outside */}
          {navOpen && (
            <div
              className="fixed inset-0 z-10"
              onClick={() => setNavOpen(false)}
            />
          )}
        </div>
      </div>
    </header>
  );
}
