import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireApiPermission } from "@/lib/auth/api";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { recordAuditEvent } from "@/lib/services/audit-service";

const schema = z.object({ periodId: z.string().uuid(), action: z.enum(["open", "close", "reopen"]), deadline: z.string().date().nullable().optional() });

export async function POST(request: NextRequest) {
  const auth = await requireApiPermission("academic_periods.manage");
  if (!auth.ok) return auth.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid registration configuration." }, { status: 422 });
  if (parsed.data.action !== "close" && !parsed.data.deadline) return NextResponse.json({ error: "A registration deadline is required." }, { status: 422 });

  const admin = createSupabaseAdminClient();
  const registrationOpen = parsed.data.action !== "close";
  const { data, error } = await admin.from("academic_periods").update({ registration_open: registrationOpen, registration_deadline: parsed.data.deadline ?? null, status: registrationOpen ? "active" : "closed" }).eq("id", parsed.data.periodId).select("id").single();
  if (error || !data) return NextResponse.json({ error: error?.message ?? "Unable to update registration." }, { status: 409 });

  await recordAuditEvent(auth.context.supabase, { actorProfileId: auth.context.profile.id, action: `registration.${parsed.data.action}`, entityType: "academic_period", entityId: data.id, newValues: parsed.data, userAgent: request.headers.get("user-agent") });
  return NextResponse.json({ message: `Registration ${parsed.data.action === "close" ? "closed" : "opened"}.` });
}
