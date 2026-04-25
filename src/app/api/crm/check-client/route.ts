import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";

const LEADS_TABLE = "leads";
const PHONE_COLUMN = "phone";

/** Allowed funnel stages (exact strings, incl. Тёплый with ё). */
const ALLOWED_STATUS_STAGES = new Set([
  "Таргет",
  "Теплый",
  "Тёплый",
  "Таргет обнова",
]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPhone = body?.phone;
    if (typeof rawPhone !== "string" || !rawPhone.trim()) {
      return NextResponse.json({ status: "error", message: "Phone required" }, { status: 400 });
    }

    const cleanPhone = rawPhone.replace(/\D/g, "");
    if (!cleanPhone) {
      return NextResponse.json({ status: "error", message: "Invalid phone" }, { status: 400 });
    }

    const supabase = getSupabase();
    const pattern = `%${cleanPhone}%`;

    const { data: rows, error } = await supabase
      .from(LEADS_TABLE)
      .select("id, status_stage, name, consultation_time")
      .ilike(PHONE_COLUMN, pattern)
      .limit(1);

    if (error) {
      console.error("[check-client]", error);
      return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }

    const lead = Array.isArray(rows) ? rows[0] : null;

    if (!lead) {
      return NextResponse.json({ status: "error", message: "Client not found" }, { status: 404 });
    }

    const row = lead as {
      id: string;
      status_stage: string | null;
      name: string | null;
      consultation_time: string | null;
    };

    const stage = row.status_stage != null ? String(row.status_stage).trim() : "";

    if (!ALLOWED_STATUS_STAGES.has(stage)) {
      return NextResponse.json(
        {
          status: "error",
          message: "Booking not available for this lead status",
          lead: {
            id: row.id,
            name: row.name ?? null,
            status: stage || null,
            status_stage: row.status_stage,
          },
        },
        { status: 404 }
      );
    }

    const ct = row.consultation_time;
    const hasConsultation =
      ct != null && String(ct).trim() !== "" && String(ct).toLowerCase() !== "null";

    if (hasConsultation) {
      return NextResponse.json(
        {
          status: "already_booked",
          lead: {
            name: row.name ?? null,
            consultation_time: row.consultation_time,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      status: "ok",
      lead: {
        id: row.id,
        name: row.name ?? null,
        status: stage,
        status_stage: stage,
      },
    });
  } catch (e) {
    console.error("[check-client]", e);
    return NextResponse.json({ status: "error", message: "Server error" }, { status: 500 });
  }
}
