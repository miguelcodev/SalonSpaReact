interface NewVsRecurringDonutProps {
  newCount: number;
  recurringCount: number;
}

// Validated pair (node scripts/validate_palette.js "#B8697A,#C9A227" --mode light
// → ALL CHECKS PASS). Gold has a contrast WARN against the surface, so its
// legend text stays in ink color — the swatch dot carries the color, never the text.
const RECURRING_COLOR = "#B8697A";
const NEW_COLOR = "#C9A227";

export function NewVsRecurringDonut({
  newCount,
  recurringCount,
}: NewVsRecurringDonutProps) {
  const total = newCount + recurringCount;

  if (total === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-sm text-color-ink-faint">
        Sin clientas activas en este período.
      </div>
    );
  }

  const recurringPct = Math.round((recurringCount / total) * 100);
  const newPct = 100 - recurringPct;

  const circumference = 2 * Math.PI * 15.9;
  const recurringLength = (recurringPct / 100) * circumference;
  const newLength = (newPct / 100) * circumference;

  return (
    <div className="flex items-center gap-5 flex-wrap">
      <svg width="130" height="130" viewBox="0 0 42 42" role="img" aria-label="Clientas nuevas versus recurrentes">
        <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#F3ECEE" strokeWidth="6" />
        <circle
          cx="21"
          cy="21"
          r="15.9"
          fill="transparent"
          stroke={RECURRING_COLOR}
          strokeWidth="6"
          strokeDasharray={`${recurringLength} ${circumference}`}
          strokeDashoffset="0"
          strokeLinecap="round"
          transform="rotate(-90 21 21)"
        />
        <circle
          cx="21"
          cy="21"
          r="15.9"
          fill="transparent"
          stroke={NEW_COLOR}
          strokeWidth="6"
          strokeDasharray={`${newLength} ${circumference}`}
          strokeDashoffset={-recurringLength}
          strokeLinecap="round"
          transform="rotate(-90 21 21)"
        />
        <text
          x="21"
          y="19"
          textAnchor="middle"
          fontFamily="Fraunces, serif"
          fontSize="7"
          fontWeight="600"
          fill="#2B2130"
        >
          {total}
        </text>
        <text x="21" y="26" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="3.4" fill="#7A6B76">
          clientas
        </text>
      </svg>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2 text-sm">
          <span
            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
            style={{ backgroundColor: RECURRING_COLOR }}
          ></span>
          <span className="text-color-ink">Recurrentes</span>
          <span className="ml-auto font-bold text-color-ink">{recurringPct}%</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span
            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
            style={{ backgroundColor: NEW_COLOR }}
          ></span>
          <span className="text-color-ink">Nuevas</span>
          <span className="ml-auto font-bold text-color-ink">{newPct}%</span>
        </div>
      </div>
    </div>
  );
}
