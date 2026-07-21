import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { processPendingQueue } from "@/lib/whatsapp/queue";
import { enqueueBirthdayMessages, enqueueReactivationMessages } from "@/lib/whatsapp/scheduler";

/**
 * Runs every 15 min (see vercel.json). Vercel automatically sends
 * `Authorization: Bearer $CRON_SECRET` on scheduled invocations when the
 * CRON_SECRET env var is set on the project — this check rejects anyone
 * else who finds the URL.
 *
 * Order matters: enqueue the calendar-based rules (cumpleanos/reactivacion)
 * FIRST, then process the queue — so a message enqueued in this same tick
 * (scheduled_for = now) gets sent immediately instead of waiting 15 more
 * minutes for the next run.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const birthdayCount = await enqueueBirthdayMessages(supabase);
  const reactivationCount = await enqueueReactivationMessages(supabase);
  const { sent, failed } = await processPendingQueue(supabase);

  return NextResponse.json({
    ok: true,
    enqueued: { birthday: birthdayCount, reactivation: reactivationCount },
    processed: { sent, failed },
  });
}
