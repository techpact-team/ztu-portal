import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

type AuditEvent = {
  actorProfileId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValues?: Json | null;
  newValues?: Json | null;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function recordAuditEvent(
  supabase: SupabaseClient<Database>,
  event: AuditEvent,
) {
  await supabase.from("audit_logs").insert({
    actor_profile_id: event.actorProfileId ?? null,
    action: event.action,
    entity_type: event.entityType,
    entity_id: event.entityId ?? null,
    old_values: event.oldValues ?? null,
    new_values: event.newValues ?? null,
    reason: event.reason ?? null,
    ip_address: event.ipAddress ?? null,
    user_agent: event.userAgent ?? null,
  });
}
