"use client";

import { useState, useTransition } from "react";
import { toggleAutomationRule, updateAutomationRuleTemplate } from "@/lib/whatsapp/actions";
import { ruleTypeLabel, OFFSET_DESCRIPTIONS } from "@/lib/whatsapp/labels";
import type { AutomationRuleData } from "@/lib/whatsapp/types";

export function RuleRow({ rule }: { rule: AutomationRuleData }) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [template, setTemplate] = useState(rule.template_text);
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    setError(null);
    startTransition(async () => {
      const result = await toggleAutomationRule(rule.id, rule.enabled);
      if (!result.ok) setError(result.error);
    });
  }

  function handleSaveTemplate() {
    setError(null);
    startTransition(async () => {
      const result = await updateAutomationRuleTemplate(rule.id, template);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditing(false);
    });
  }

  return (
    <div className="border-b border-color-line-soft last:border-b-0 py-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm font-bold text-color-ink">
            {ruleTypeLabel(rule.type)}
          </div>
          <div className="text-xs text-color-ink-soft mt-0.5">
            {OFFSET_DESCRIPTIONS[rule.type]}
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full disabled:opacity-50 ${
            rule.enabled
              ? "bg-green-50 text-color-accent-sage"
              : "bg-color-line-soft text-color-ink-faint"
          }`}
        >
          {rule.enabled ? "● Activa" : "○ Desactivada"}
        </button>
      </div>

      {editing ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-color-line text-sm focus:border-color-accent-rose focus:outline-none"
          />
          <p className="text-[11px] text-color-ink-faint">
            Placeholders: {"{nombre} {servicio} {fecha} {hora} {especialista}"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleSaveTemplate}
              disabled={isPending}
              className="text-xs font-bold text-white bg-color-accent-rose hover:bg-color-accent-rose-deep px-3 py-1.5 rounded-full disabled:opacity-50"
            >
              Guardar
            </button>
            <button
              onClick={() => {
                setTemplate(rule.template_text);
                setEditing(false);
              }}
              className="text-xs font-bold text-color-ink-soft px-3 py-1.5"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex items-start justify-between gap-3">
          <p className="text-sm text-color-ink-soft bg-color-bg rounded-lg p-3 flex-1">
            {rule.template_text}
          </p>
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-bold text-color-accent-rose hover:underline flex-shrink-0"
          >
            Editar
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
