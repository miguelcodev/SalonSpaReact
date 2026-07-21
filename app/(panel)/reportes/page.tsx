import { Suspense } from "react";
import { getReportData } from "@/lib/reportes/queries";
import { formatMoney } from "@/lib/reportes/format";
import { RangeSelector } from "./_components/range-selector";
import { StatCard } from "./_components/stat-card";
import { RevenueChart } from "./_components/revenue-chart";
import { NewVsRecurringDonut } from "./_components/new-vs-recurring-donut";
import { TopServicesList } from "./_components/top-services-list";
import { StaffPerformanceTable } from "./_components/staff-performance-table";
import type { ReportRange } from "@/lib/reportes/types";

interface ReportesPageProps {
  searchParams: Promise<{ range?: string }>;
}

const VALID_RANGES: ReportRange[] = ["7d", "month", "quarter"];

export default async function ReportesPage({ searchParams }: ReportesPageProps) {
  const params = await searchParams;
  const range = VALID_RANGES.includes(params.range as ReportRange)
    ? (params.range as ReportRange)
    : "month";

  const data = await getReportData(range);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-color-ink">
            Reportes
          </h1>
          <p className="text-color-ink-soft mt-2">{data.rangeLabel}</p>
        </div>
        <Suspense fallback={null}>
          <RangeSelector activeRange={range} />
        </Suspense>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          value={formatMoney(data.totalRevenueCents)}
          label={`Ingresos · ${data.rangeLabel.toLowerCase()} · servicios ${formatMoney(data.serviceRevenueCents)} + productos ${formatMoney(data.productRevenueCents)}`}
          delta={data.deltas.revenue}
          upIsGood
        />
        <StatCard
          value={formatMoney(data.avgTicketCents)}
          label="Ticket promedio"
          delta={data.deltas.avgTicket}
          upIsGood
        />
        <StatCard
          value={`${data.occupancyPct}%`}
          label="Ocupación de agenda (aprox.)"
          delta={data.deltas.occupancy}
          upIsGood
        />
        <StatCard
          value={`${data.noShowRatePct}%`}
          label="Tasa de no-show"
          delta={data.deltas.noShowRate}
          upIsGood={false}
        />
      </div>

      {/* Revenue + New vs Recurring */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 items-start">
        <div className="bg-color-surface border border-color-line rounded-2xl shadow-card p-6">
          <h2 className="text-base font-serif font-semibold text-color-ink">
            Ingresos
          </h2>
          <p className="text-xs text-color-ink-soft mb-2">{data.rangeLabel}</p>
          <RevenueChart buckets={data.revenueByBucket} />
        </div>

        <div className="bg-color-surface border border-color-line rounded-2xl shadow-card p-6">
          <h2 className="text-base font-serif font-semibold text-color-ink">
            Clientas: nuevas vs. recurrentes
          </h2>
          <p className="text-xs text-color-ink-soft mb-4">{data.rangeLabel}</p>
          <NewVsRecurringDonut
            newCount={data.newClientCount}
            recurringCount={data.recurringClientCount}
          />
        </div>
      </div>

      {/* Top services + top products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="bg-color-surface border border-color-line rounded-2xl shadow-card p-6">
          <h2 className="text-base font-serif font-semibold text-color-ink">
            Servicios más vendidos
          </h2>
          <p className="text-xs text-color-ink-soft mb-2">
            Por ingresos generados · {data.rangeLabel.toLowerCase()}
          </p>
          <TopServicesList services={data.topServices} />
        </div>

        <div className="bg-color-surface border border-color-line rounded-2xl shadow-card p-6">
          <h2 className="text-base font-serif font-semibold text-color-ink">
            Productos más vendidos
          </h2>
          <p className="text-xs text-color-ink-soft mb-2">
            Por ingresos generados · {data.rangeLabel.toLowerCase()}
          </p>
          <TopServicesList
            services={data.topProducts}
            emptyMessage="Sin productos vendidos en este período."
          />
        </div>
      </div>

      {/* Staff performance */}
      <div className="bg-color-surface border border-color-line rounded-2xl shadow-card p-6">
        <h2 className="text-base font-serif font-semibold text-color-ink">
          Desempeño por especialista
        </h2>
        <p className="text-xs text-color-ink-soft mb-3">
          Ocupación (aprox.) e ingresos generados por servicios
        </p>
        <StaffPerformanceTable staff={data.staffPerformance} />
      </div>
    </div>
  );
}
