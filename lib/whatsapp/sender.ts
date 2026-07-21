export interface SendResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface WhatsappSender {
  send(to: string, body: string): Promise<SendResult>;
}

/**
 * Default sender when no real WhatsApp Business API credentials are
 * configured. Logs the message and always "succeeds" — lets the whole
 * queue → cron → history pipeline be built and demoed without a live
 * Meta/Twilio/360dialog account. Swap the provider by implementing
 * WhatsappSender against the real API and wiring it in getSender() below;
 * nothing else in the module needs to change.
 */
class SimulatedSender implements WhatsappSender {
  async send(to: string, body: string): Promise<SendResult> {
    console.log(`[WhatsApp SIMULADO] → ${to}\n${body}`);
    return { success: true, providerMessageId: `sim-${Date.now()}` };
  }
}

export function getSender(): WhatsappSender {
  const provider = process.env.WHATSAPP_PROVIDER || "simulated";

  switch (provider) {
    case "simulated":
      return new SimulatedSender();
    default:
      throw new Error(
        `Proveedor de WhatsApp "${provider}" no soportado todavía. ` +
          `Implementa WhatsappSender contra su API e inclúyelo en getSender(), ` +
          `o usa WHATSAPP_PROVIDER=simulated mientras tanto.`
      );
  }
}
