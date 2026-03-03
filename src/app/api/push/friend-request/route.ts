import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  // Nutzer-Session per Cookie authentifizieren
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) =>
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { receiverId } = await req.json();
  if (!receiverId) return NextResponse.json({ error: "Missing receiverId" }, { status: 400 });

  // Service-Client für RLS-freien Zugriff
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Absender-Username und Empfänger-Subscriptions parallel laden
  const [{ data: sender }, { data: subs }] = await Promise.all([
    service.from("profiles").select("username").eq("id", user.id).single(),
    service
      .from("push_subscriptions")
      .select("id, subscription")
      .eq("user_id", receiverId),
  ]);

  if (!subs?.length) return NextResponse.json({ ok: true });

  webpush.setVapidDetails(
    "mailto:" + process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const senderName = sender?.username ? `@${sender.username}` : "Jemand";
  const payload = JSON.stringify({
    title: "Neue Freundschaftsanfrage",
    body: `${senderName} möchte mit dir befreundet sein.`,
    url: "/friends",
    tag: "friend-request",
  });

  const results = await Promise.allSettled(
    subs.map((row) =>
      webpush.sendNotification(row.subscription as webpush.PushSubscription, payload)
    )
  );

  // Abgelaufene Subscriptions aufräumen (410 = Gone, 404 = Not Found)
  const toDelete: string[] = [];
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      const err = result.reason as { statusCode?: number };
      if (err.statusCode === 410 || err.statusCode === 404) {
        toDelete.push(subs[i].id);
      }
    }
  });
  if (toDelete.length > 0) {
    await service.from("push_subscriptions").delete().in("id", toDelete);
  }

  return NextResponse.json({ ok: true });
}
