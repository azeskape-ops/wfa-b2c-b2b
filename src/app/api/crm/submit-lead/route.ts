import { NextResponse } from "next/server";
import { getSupabase, normalizePhone } from "@/lib/supabase-server";
import { sendTelegramToUser } from "@/lib/telegram";
import {
  CODE_TO_LABEL,
  computeStatusStageFromQuiz,
  type QuizAnswers,
} from "@/lib/quiz-lead";

const LEADS_TABLE = "leads";
const PROFILES_TABLE = "profiles";
const NOTIFICATIONS_TABLE = "notifications";

function decodeAnswer(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return CODE_TO_LABEL[trimmed] || trimmed;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const rawPhone = typeof body?.phone === "string" ? body.phone : "";
    const city = typeof body?.city === "string" ? body.city.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const answers = (body?.answers && typeof body.answers === "object"
      ? body.answers
      : {}) as QuizAnswers;

    if (!name) {
      return NextResponse.json(
        { status: "error", message: "Ім'я обов'язкове" },
        { status: 400 }
      );
    }

    const phoneDigits = normalizePhone(rawPhone);
    if (!phoneDigits || phoneDigits.length < 9) {
      return NextResponse.json(
        { status: "error", message: "Некоректний номер телефону" },
        { status: 400 }
      );
    }

    const status_stage = computeStatusStageFromQuiz(answers);
    const visa_status = decodeAnswer(answers.status);
    const official_address = decodeAnswer(answers.address);
    const work_status = decodeAnswer(answers.work);
    const goal = decodeAnswer(answers.goal);
    const source = decodeAnswer(answers.channel);

    const insertRow: Record<string, unknown> = {
      phone: phoneDigits,
      name,
      city: city || null,
      visa_status,
      official_address,
      work_status,
      goal,
      source,
      status_stage,
    };

    const supabase = getSupabase();

    console.log("[submit-lead] insert payload", JSON.stringify(insertRow, null, 2));

    const { data, error } = await supabase
      .from(LEADS_TABLE)
      .insert(insertRow)
      .select("id")
      .single();

    console.log("[submit-lead] insert result", { data, error: error ?? null });

    if (error) {
      console.error("[submit-lead] Supabase insert error (full)", error);
      return NextResponse.json(
        {
          status: "error",
          message: error.message || "Не вдалося зберегти заявку",
          details: error,
        },
        { status: 500 }
      );
    }

    try {
      const { data: admins, error: adminsError } = await supabase
        .from(PROFILES_TABLE)
        .select("id, telegram_chat_id")
        .eq("role", "ADMIN");

      if (adminsError) {
        console.error("[submit-lead] Failed to fetch admins", adminsError);
      } else if (admins?.length) {
        const notificationRows = admins.map((admin) => ({
          user_id: admin.id,
          title: "Новая анкета",
          message: `Поступил новый лид: ${name}. Телефон: ${phoneDigits}`,
          url: "/leads",
        }));

        const { error: notificationsError } = await supabase
          .from(NOTIFICATIONS_TABLE)
          .insert(notificationRows);

        if (notificationsError) {
          console.error(
            "[submit-lead] Failed to insert notifications",
            notificationsError
          );
        }

        const telegramMessage = `🔔 <b>Новая заявка с анкеты!</b>\n\n<b>Имя:</b> ${name}\n<b>Телефон:</b> ${rawPhone}\n<b>Город:</b> ${city}\n<b>Цель:</b> ${goal}`;
        const telegramTasks = admins
          .map((admin) => admin.telegram_chat_id)
          .filter((chatId): chatId is string => typeof chatId === "string" && !!chatId)
          .map((chatId) => sendTelegramToUser(chatId, telegramMessage));

        if (telegramTasks.length) {
          await Promise.allSettled(telegramTasks);
        }
      }
    } catch (notifyError) {
      console.error("[submit-lead] Notification flow failed", notifyError);
    }

    return NextResponse.json({
      status: "ok",
      id: data?.id ?? null,
      status_stage,
      phone: phoneDigits,
    });
  } catch (e) {
    console.error("[submit-lead]", e);
    return NextResponse.json(
      { status: "error", message: "Server error" },
      { status: 500 }
    );
  }
}
