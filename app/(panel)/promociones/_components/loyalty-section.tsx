import { getLoyaltyProgram, getLoyaltyProgress } from "@/lib/promociones/queries";
import { formatRelativeDays } from "@/lib/crm/filters";
import { LoyaltyConfigModal } from "./loyalty-config-modal";

export async function LoyaltySection() {
  const program = await getLoyaltyProgram();
  const progress = program ? await getLoyaltyProgress(program.id) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-serif font-semibold text-color-ink">
          Programa de fidelidad
        </h2>
        {program && (
          <span className="text-xs text-color-ink-soft">
            Se activa automáticamente al alcanzar el sello {program.visits_required}
          </span>
        )}
      </div>

      {!program ? (
        <div className="bg-color-surface border-2 border-dashed border-color-line rounded-2xl p-8 text-center">
          <p className="text-sm text-color-ink-soft mb-3">
            Todavía no configuras un programa de fidelidad.
          </p>
          <LoyaltyConfigModal existingProgram={null} />
        </div>
      ) : (
        <div className="bg-color-surface border border-color-line rounded-2xl shadow-card p-6 space-y-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-color-ink-soft flex-1 min-w-64">
              Al completar <b className="text-color-ink">{program.visits_required} visitas</b>,
              la clienta recibe: <b className="text-color-ink">{program.reward_description}</b>
            </p>
            <LoyaltyConfigModal existingProgram={program} />
          </div>

          {progress.length === 0 ? (
            <p className="text-sm text-color-ink-faint">
              Ninguna clienta tiene sellos registrados todavía.
            </p>
          ) : (
            <div className="space-y-3">
              {progress.map((entry) => (
                <div
                  key={entry.client_id}
                  className="flex items-center gap-4 flex-wrap border-t border-color-line-soft pt-3 first:border-t-0 first:pt-0"
                >
                  <div className="min-w-40">
                    <div className="text-sm font-bold text-color-ink">
                      {entry.client_name}
                    </div>
                    <div className="text-xs text-color-ink-soft">
                      {entry.stamps} de {program.visits_required} visitas · última{" "}
                      {formatRelativeDays(entry.last_stamp_at)}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {Array.from({ length: program.visits_required }, (_, i) => {
                      const filled = i < entry.stamps;
                      return (
                        <div
                          key={i}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            filled
                              ? "bg-gradient-to-br from-color-accent-rose to-color-accent-gold text-white"
                              : "border-2 border-dashed border-color-line text-color-ink-faint"
                          }`}
                        >
                          {filled ? "✓" : i + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
