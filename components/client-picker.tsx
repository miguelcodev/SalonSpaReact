"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { getClientsForSearch } from "@/lib/crm/queries";
import type { ClientSearchResult } from "@/lib/crm/types";

interface ClientPickerProps {
  onSelect: (client: ClientSearchResult) => void;
  disabled?: boolean;
  error?: string;
}

/**
 * Type-to-search client picker. Replaces a plain text input for "clienta"
 * so the appointment form always resolves to a real clients.id (uuid) —
 * newAppointmentSchema requires clientId to be a valid uuid, so a free-text
 * name field can never pass validation.
 */
export function ClientPicker({ onSelect, disabled, error }: ClientPickerProps) {
  const [query, setQuery] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<ClientSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(() => {
      setLoading(true);
      getClientsForSearch(query).then((r) => {
        setResults(r);
        setLoading(false);
      });
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, open]);

  function handleSelect(client: ClientSearchResult) {
    setSelectedName(client.name);
    setQuery("");
    setOpen(false);
    onSelect(client);
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-color-ink-faint"
        />
        <input
          value={open ? query : selectedName}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedName("");
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar clienta por nombre..."
          disabled={disabled}
          className="w-full pl-8 pr-3 py-2 rounded-lg border border-color-line text-sm focus:border-color-accent-rose focus:outline-none disabled:opacity-50"
        />
      </div>

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

      {open && (
        <>
          {/* Click-outside catcher */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-color-surface border border-color-line rounded-lg shadow-modal max-h-56 overflow-y-auto">
            {loading && (
              <div className="px-3 py-3 text-xs text-color-ink-soft text-center">
                Buscando...
              </div>
            )}

            {!loading && results.length === 0 && (
              <div className="px-3 py-3 text-xs text-color-ink-soft text-center space-y-2">
                <p>No se encontraron clientas.</p>
                <Link
                  href="/crm"
                  className="text-color-accent-rose font-semibold hover:underline"
                >
                  Crear clienta en el módulo Clientes →
                </Link>
              </div>
            )}

            {!loading &&
              results.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => handleSelect(client)}
                  className="w-full text-left px-3 py-2 hover:bg-color-line-soft text-sm border-b border-color-line-soft last:border-b-0"
                >
                  <div className="font-semibold text-color-ink">{client.name}</div>
                  {client.phone && (
                    <div className="text-xs text-color-ink-soft">{client.phone}</div>
                  )}
                </button>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
