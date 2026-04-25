import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";

/**
 * Schema: schedule_slots — id, date, time, is_available, client_id.
 */
const SCHEDULE_TABLE = "schedule_slots";
const LEADS_TABLE = "leads";
const DATE_COLUMN = "date";
const TIME_COLUMN = "time";
const IS_AVAILABLE_COLUMN = "is_available";
const CLIENT_ID_COLUMN = "client_id";
const PHONE_COLUMN = "phone";
/** Lead field for CRM: дата/час консультації — DB column `consultation_time`. */
const LEAD_CONSULTATION_TIME = "consultation_time";

/** ISO 8601 local datetime string (works with Postgres `timestamptz` / `timestamp` and text storage). */
function toConsultationTimeValue(dateYmd: string, timeRaw: string): string {
  const m = timeRaw.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return `${dateYmd}T00:00:00`;
  const hh = m[1].padStart(2, "0");
  const mm = m[2].padStart(2, "0");
  const ss = (m[3] ?? "00").padStart(2, "0");
  return `${dateYmd}T${hh}:${mm}:${ss}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPhone = body?.phone;
    const date = body?.date;
    const time = body?.time;

    if (typeof rawPhone !== "string" || !rawPhone.trim()) {
      return NextResponse.json({ status: "error", message: "Phone required" }, { status: 400 });
    }
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ status: "error", message: "Valid date required" }, { status: 400 });
    }
    if (typeof time !== "string" || !time.trim()) {
      return NextResponse.json({ status: "error", message: "Time required" }, { status: 400 });
    }

    const cleanPhone = rawPhone.replace(/\D/g, "");
    if (!cleanPhone) {
      return NextResponse.json({ status: "error", message: "Invalid phone" }, { status: 400 });
    }

    const supabase = getSupabase();
    const phonePattern = `%${cleanPhone}%`;

    const { data: leadRows, error: leadErr } = await supabase
      .from(LEADS_TABLE)
      .select("id")
      .ilike(PHONE_COLUMN, phonePattern)
      .limit(1);

    if (leadErr) {
      console.error("[book-slot] lead lookup", leadErr);
      return NextResponse.json({ status: "error", message: leadErr.message }, { status: 500 });
    }

    const leadId = Array.isArray(leadRows) && leadRows[0]?.id ? leadRows[0].id : null;
    if (!leadId) {
      return NextResponse.json({ status: "error", message: "Client not found" }, { status: 404 });
    }

    const { data: existing, error: findError } = await supabase
      .from(SCHEDULE_TABLE)
      .select("id")
      .eq(DATE_COLUMN, date)
      .eq(TIME_COLUMN, time.trim())
      .eq(IS_AVAILABLE_COLUMN, true)
      .is(CLIENT_ID_COLUMN, null)
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error("[book-slot] find", findError);
      return NextResponse.json({ status: "error", message: findError.message }, { status: 500 });
    }
    if (!existing?.id) {
      return NextResponse.json({ status: "error", message: "Slot not available" }, { status: 409 });
    }

    const { error: updateError } = await supabase
      .from(SCHEDULE_TABLE)
      .update({ [CLIENT_ID_COLUMN]: leadId, [IS_AVAILABLE_COLUMN]: false })
      .eq("id", existing.id);

    if (updateError) {
      console.error("[book-slot] update slot", updateError);
      return NextResponse.json({ status: "error", message: updateError.message }, { status: 500 });
    }

    const consultationTime = toConsultationTimeValue(date, time);
    const { error: leadUpdateError } = await supabase
      .from(LEADS_TABLE)
      .update({ [LEAD_CONSULTATION_TIME]: consultationTime })
      .eq("id", leadId);

    if (leadUpdateError) {
      console.error("[book-slot] update lead", leadUpdateError);
      await supabase
        .from(SCHEDULE_TABLE)
        .update({ [CLIENT_ID_COLUMN]: null, [IS_AVAILABLE_COLUMN]: true })
        .eq("id", existing.id);
      return NextResponse.json(
        { status: "error", message: leadUpdateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: "ok", message: "Booked" });
  } catch (e) {
    console.error("[book-slot]", e);
    return NextResponse.json({ status: "error", message: "Server error" }, { status: 500 });
  }
}
