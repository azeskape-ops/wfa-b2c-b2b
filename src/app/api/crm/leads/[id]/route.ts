import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ status: "error", message: "Missing id" }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data: lead, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();

    if (error) {
      console.error("[leads/[id]]", error);
      return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
    if (!lead) {
      return NextResponse.json({ status: "error", message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ status: "ok", lead });
  } catch (e) {
    console.error("[leads/[id]]", e);
    return NextResponse.json({ status: "error", message: "Server error" }, { status: 500 });
  }
}
