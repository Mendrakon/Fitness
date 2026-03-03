import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

// Wird von einem Supabase Database Webhook aufgerufen wenn eine neue friendship entsteht
export async function POST(req: NextRequest) {
  // Webhook-Secret prüfen
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== process.env.PUSH_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  // Supabase Webhook schickt { type, table, record, old_record, schema }
  const record = body.record ?? body;

  if (record.status !== "pending") return NextResponse.json({ ok: true });

  const receiverId: string = record.receiver_id;

  webpush.setVapidDetails(
    "mailto:" + process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  // Service-Client ohne RLS für internes Lesen
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("subscription")
    .eq("user_id", receiverId);

  if (!subs?.length) return NextResponse.json({ ok: true });

  const payload = JSON.stringify({
    title: "Neue Freundschaftsanfrage",
    body: "Jemand möchte mit dir befreundet sein.",
    url: "/friends",
    tag: "friend-request",
  });

  await Promise.allSettled(
    subs.map((row) =>
      webpush.sendNotification(row.subscription as webpush.PushSubscription, payload)
    )
  );

  return NextResponse.json({ ok: true });
}
