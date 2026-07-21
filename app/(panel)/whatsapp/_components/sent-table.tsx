import { ruleTypeLabel } from "@/lib/whatsapp/labels";
import type { SentMessage } from "@/lib/whatsapp/types";

export function SentTable({ messages }: { messages: SentMessage[] }) {
  if (messages.length === 0) {
    return (
      <div className="bg-color-surface border border-color-line rounded-2xl shadow-card p-8 text-center text-sm text-color-ink-faint">
        Todavía no se ha enviado ningún mensaje.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-color-surface border border-color-line rounded-2xl shadow-card px-5">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-color-line">
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft py-3 pr-3">
              Clienta / Tipo
            </th>
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft py-3 pr-3">
              Mensaje
            </th>
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft py-3">
              Enviado
            </th>
          </tr>
        </thead>
        <tbody>
          {messages.map((m) => (
            <tr key={m.id} className="border-b border-color-line-soft last:border-b-0">
              <td className="py-3 pr-3">
                <div className="text-sm font-bold text-color-ink">{m.client_name}</div>
                <div className="text-xs text-color-ink-soft">{ruleTypeLabel(m.rule_type)}</div>
              </td>
              <td className="py-3 pr-3 text-xs text-color-ink-soft max-w-md">
                <p className="line-clamp-2">{m.body}</p>
              </td>
              <td className="py-3 text-xs font-mono text-color-ink-soft whitespace-nowrap">
                {new Date(m.sent_at).toLocaleString("es-PE", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
