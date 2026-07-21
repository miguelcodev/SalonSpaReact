import { Suspense } from "react";
import { getQueuedMessages, getSentMessages, getAutomationRules } from "@/lib/whatsapp/queries";
import { WhatsappTabs } from "./_components/whatsapp-tabs";
import { QueueTable } from "./_components/queue-table";
import { SentTable } from "./_components/sent-table";
import { RuleRow } from "./_components/rule-row";

interface WhatsappPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function WhatsappPage({ searchParams }: WhatsappPageProps) {
  const params = await searchParams;
  const tab = params.tab === "enviados" || params.tab === "reglas" ? params.tab : "cola";

  const [queued, sent, rules] = await Promise.all([
    getQueuedMessages(),
    tab === "enviados" ? getSentMessages() : Promise.resolve([]),
    tab === "reglas" ? getAutomationRules() : Promise.resolve([]),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-semibold text-color-ink">
          Mensajería WhatsApp
        </h1>
        <p className="text-color-ink-soft mt-2">
          Envíos automatizados por cola — un cron revisa cada 15 minutos qué
          está pendiente y lo procesa. El envío real usa un sender simulado
          hasta que se conecten credenciales de WhatsApp Business API.
        </p>
      </div>

      <Suspense fallback={null}>
        <WhatsappTabs activeTab={tab} />
      </Suspense>

      {tab === "cola" && <QueueTable messages={queued} />}

      {tab === "enviados" && <SentTable messages={sent} />}

      {tab === "reglas" && (
        <div className="bg-color-surface border border-color-line rounded-2xl shadow-card px-6">
          {rules.length === 0 ? (
            <p className="text-sm text-color-ink-faint py-8 text-center">
              No hay reglas de automatización configuradas.
            </p>
          ) : (
            rules.map((rule) => <RuleRow key={rule.id} rule={rule} />)
          )}
        </div>
      )}
    </div>
  );
}
