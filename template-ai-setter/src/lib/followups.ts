/**
 * FOLLOW-UP ENGINE — proactive re-engagement of leads who went quiet. Reuses
 * the proven proactive-send pattern (claim-lock via a unique insert, gated by a
 * flag, enable boundary, guards) so it can't double-send or talk over a live
 * chat. Timing is 100% code-controlled (the AI only writes the words, never
 * decides when). Two buckets, two cadences, all measured from the stall anchor
 * (the lead's last inbound):
 *
 *   Bucket A — ghosted mid-conversation (pre-pitch): 24h, 3d, 7d
 *   Bucket B — cold feet (pitched / sent link, didn't book): 30min, 24h, 3d
 *
 * The asking is proactive (here); the lead's REPLIES flow back through the
 * normal reply pipeline at their existing stage — so follow-ups only ever act
 * in the silence, never alongside a live exchange.
 *
 * SAFETY: dormant unless clients.followup_enabled = true, and it only acts on
 * stalls that happen AFTER followup_enabled_at (no retroactive blasts).
 */
import Anthropic from "@anthropic-ai/sdk";
import { supabase, logEvent, saveMessage, eventExists, type Lead } from "./supabase";
import { sendGHLMessage } from "./ghl";

const ACTIVE_STAGES = ["opener_sequence", "demo_response", "book", "post_book", "proof"];
const OFFSETS_H = [24, 72, 168]; // 24h → 3d → 7d
const MIN_GAP_H = 20;
const MAX_PER_RUN = 25; // global cap per tick — a surge drips over ticks, never blasts

interface FUClient { id: string; enabledAt: number; ghl_api_key: string | null; ghl_location_id: string | null; voice_samples: string | null; business_context: string | null }

async function enabledFollowupClients(): Promise<FUClient[]> {
  const { data } = await supabase.from("clients")
    .select("id, followup_enabled_at, ghl_api_key, ghl_location_id, voice_samples, business_context")
    .eq("followup_enabled", true);
  return (data ?? []).map((c) => {
    const r = c as Record<string, unknown>;
    return {
      id: String(r.id), enabledAt: r.followup_enabled_at ? new Date(String(r.followup_enabled_at)).getTime() : 0,
      ghl_api_key: (r.ghl_api_key as string) ?? null, ghl_location_id: (r.ghl_location_id as string) ?? null,
      voice_samples: (r.voice_samples as string) ?? null, business_context: (r.business_context as string) ?? null,
    };
  });
}


const TONE: Record<string, string> = {
  A1: "Avslappnat ping efter 24h tystnad. Referera naturligt till vad som sades senast. Kort, en mening.",
  A2: "Lite mer direkt efter 3 dagars tystnad. Fråga om tajmingen är fel eller om de har frågor. Kort.",
  A3: "Sista pingen efter 7 dagar. Ingen press. Lämna dörren öppen på ett avslappnat sätt. En-två meningar.",
};

const FALLBACK: Record<string, string> = {
  A1: "hej, hörde aldrig av er — fortfarande aktuellt?",
  A2: "bara ett snabbt ping — är tajmingen fel eller har ni frågor?",
  A3: "inga problem om det inte passar just nu, hör av er om det ändras 🙏",
};

async function generateFollowup(client: FUClient, leadId: string, slotKey: string): Promise<string> {
  const fallback = FALLBACK[slotKey] ?? "hej, fortfarande intresserade?";
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return fallback;
    const { data } = await supabase.from("messages").select("role, content").eq("lead_id", leadId).order("created_at", { ascending: false }).limit(10);
    const transcript = ((data ?? []) as { role: string; content: string }[]).reverse()
      .map((m) => `${m.role === "lead" ? "KLINIKEN" : "JACK"}: ${String(m.content || "").slice(0, 300)}`).join("\n");
    const anthropic = new Anthropic({ apiKey });
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001", max_tokens: 100,
      system: `Du skriver uppföljnings-DMs på Instagram åt Jack på Rekvo. Jack säljer AI-mötesbokare till skönhetskliniker i Sverige.\n\nJacks röst (matcha exakt):\n${(client.voice_samples || "").slice(0, 800)}\n\nSkriv BARA meddelandetexten — inga citattecken, ingen inledning. Kort och naturlig svenska.`,
      messages: [{ role: "user", content: `Konversation (äldst först):\n${transcript}\n\nTon för detta meddelande: ${TONE[slotKey]}\n\nSkriv uppföljningsmeddelandet.` }],
    });
    const txt = res.content.filter((b) => b.type === "text").map((b) => (b as { type: "text"; text: string }).text).join("").trim().replace(/^["']|["']$/g, "");
    return txt || fallback;
  } catch {
    return fallback;
  }
}

/** Mark revival when a lead replied after we'd sent follow-ups (idempotent). */
async function checkRevival(leadId: string, clientId: string, lastLeadAt: string): Promise<void> {
  const { data } = await supabase.from("follow_up_log")
    .update({ revived_at: new Date().toISOString() })
    .eq("lead_id", leadId).is("revived_at", null).lt("sent_at", lastLeadAt).eq("status", "sent")
    .select("id");
  if ((data ?? []).length > 0) {
    await logEvent({ client_id: clientId, lead_id: leadId, event_type: "lead_revived", metadata: { via: "follow_up", count: (data ?? []).length } });
  }
}

/** The whole engine: sweep stalled leads and send any due follow-up. Safe no-op
 *  unless a client has followup_enabled = true. */
export async function runFollowups(): Promise<{ enabled: number; sent: number }> {
  let sent = 0;
  try {
    const clients = await enabledFollowupClients();
    if (!clients.length) return { enabled: 0, sent: 0 };
    const minQuietMs = 23 * 3_600_000; // first follow-up at 24h — skip leads quieter than 23h
    const now = Date.now();

    for (const client of clients) {
      if (!client.ghl_api_key || !client.ghl_location_id) continue;
      const { data: leads } = await supabase.from("leads").select("*")
        .eq("client_id", client.id).eq("status", "engaged")
        .eq("ai_paused", false).eq("followup_paused", false)
        .in("funnel_stage", ACTIVE_STAGES)
        .lt("last_message_at", new Date(now - minQuietMs).toISOString())
        .order("last_message_at", { ascending: true }).limit(60);

      for (const leadRow of (leads ?? []) as Lead[]) {
        try {
          if (sent >= MAX_PER_RUN) break; // global drip cap — never blast
          const lead = leadRow;
          if (!lead.ghl_contact_id) continue;
          const { data: msgs } = await supabase.from("messages").select("role, created_at").eq("lead_id", lead.id).order("created_at", { ascending: false }).limit(12);
          const m = (msgs ?? []) as { role: string; created_at: string }[];
          if (!m.length) continue;

          // Replied since? → revival (and not our job; the reply pipeline owns it).
          if (m[0].role === "lead") { await checkRevival(lead.id, client.id, m[0].created_at); continue; }
          // A HUMAN sent the last message → someone's handling this lead by hand. Stand down.
          if (m[0].role === "human") continue;

          const lastLead = m.find((x) => x.role === "lead");
          if (!lastLead) continue; // never replied to us → manual-outreach bucket (not ours)
          const anchorIso = lastLead.created_at;
          const anchorMs = new Date(anchorIso).getTime();
          if (anchorMs < client.enabledAt) continue; // enable boundary — only stalls after switch-on
          const quietH = (now - anchorMs) / 3_600_000;

          const stage = lead.funnel_stage || "";

          const { data: prior } = await supabase.from("follow_up_log").select("attempt, anchor, sent_at, status").eq("lead_id", lead.id);
          const rows = (prior ?? []) as { attempt: number; anchor: string; sent_at: string | null; status: string }[];
          const attemptsSent = rows.filter((r) => r.anchor === anchorIso).length;
          if (attemptsSent >= 3) continue; // exhausted this stall
          if (quietH < OFFSETS_H[attemptsSent]) continue; // not due yet
          // HARD anti-burst: never a 2nd follow-up to this lead within MIN_GAP_H,
          // no matter how "overdue" the math says they are. Spaces every touch.
          const lastSentMs = rows.filter((r) => r.status === "sent" && r.sent_at).map((r) => new Date(r.sent_at as string).getTime()).sort((a, b) => b - a)[0];
          if (lastSentMs && now - lastSentMs < MIN_GAP_H * 3_600_000) continue;
          if (await eventExists(lead.id, "appointment_booked")) continue; // already booked → nurture's job

          const attempt = attemptsSent + 1;
          // CLAIM atomically — unique (lead_id, anchor, attempt). Empty insert = another tick owns it.
          const { data: claimed } = await supabase.from("follow_up_log").upsert(
            { client_id: client.id, lead_id: lead.id, ghl_contact_id: lead.ghl_contact_id, bucket: "A", attempt, anchor: anchorIso, stage_at_stall: stage, status: "sending" },
            { onConflict: "lead_id,anchor,attempt", ignoreDuplicates: true }
          ).select("id");
          const row = (claimed ?? [])[0] as { id: string } | undefined;
          if (!row) continue;

          const slotKey = `A${attempt}`;
          const text = await generateFollowup(client, lead.id, slotKey);

          const res = await sendGHLMessage({ ghl_api_key: client.ghl_api_key, ghl_location_id: client.ghl_location_id, ghl_contact_id: lead.ghl_contact_id, message: text, type: "IG" });
          if (!res.success) {
            await supabase.from("follow_up_log").update({ status: "failed", message: text }).eq("id", row.id);
            continue;
          }
          await supabase.from("follow_up_log").update({ status: "sent", message: text, ghl_message_id: res.ghl_message_id, sent_at: new Date().toISOString() }).eq("id", row.id);
          await saveMessage({ lead_id: lead.id, client_id: client.id, role: "ai", content: text, channel: "instagram", ghl_message_id: res.ghl_message_id, model_used: "followup_engine" });
          await logEvent({ client_id: client.id, lead_id: lead.id, event_type: "follow_up_sent", metadata: { bucket: "A", attempt, stage } });
          sent++;
        } catch (e) {
          console.error("[followups] lead failed:", leadRow.id, e);
        }
      }
      if (sent >= MAX_PER_RUN) break; // cap hit — stop sweeping further clients this tick
    }
    return { enabled: clients.length, sent };
  } catch (err) {
    console.error("[followups] runFollowups failed:", err);
    return { enabled: 0, sent };
  }
}
