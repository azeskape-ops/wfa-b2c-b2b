import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data: rows, error } = await supabase
      .from("leads")
      .select("id, phone, name, status_stage, consultation_time, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[leads]", error);
      return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
    return NextResponse.json({ status: "ok", leads: rows ?? [] });
  } catch (e) {
    console.error("[leads]", e);
    return NextResponse.json({ status: "error", message: "Server error" }, { status: 500 });
  }
}
