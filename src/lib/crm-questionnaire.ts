/** Label for questionnaire field #10 (CRM). */
export const FIELD_10_CONSULTATION_LABEL = "10. Дата и время консультации";

/** Format `consultation_time` (timestamptz) for managers — e.g. 26 марта 2026 г., 10:00 */
export function formatConsultationTimeDisplay(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export type QuestionnaireRow = { num: number; label: string; value: string };

/**
 * Build display rows from `raw_answers` (array or object) and inject field #10 from `consultation_time`.
 */
export function buildQuestionnaireRows(
  rawAnswers: unknown,
  consultationTime: string | null | undefined
): QuestionnaireRow[] {
  const rows: QuestionnaireRow[] = [];

  const normalizeLabel = (s: string) =>
    s
      .toLowerCase()
      .replace(/^\s*\d+\s*\.?\s*/, "")
      .replace(/[’'"`]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  if (Array.isArray(rawAnswers)) {
    rawAnswers.forEach((item, idx) => {
      const o = item as Record<string, unknown>;
      const num = Number(o.num ?? o.number ?? o.n ?? o.index ?? idx + 1);
      const rawLabel = o.question ?? o.label ?? o.q ?? `Поле ${num}`;
      let label = String(rawLabel);
      if (!/^\d+\./.test(label.trim())) {
        label = `${num}. ${label}`;
      }
      const value = String(o.answer ?? o.a ?? o.value ?? "—");
      rows.push({ num, label, value });
    });

    // Fuzzy remap: keep rows stable for the CRM lead-card fixed fields.
    // Row 7 must be “Goal” only, row 8 must be “Communication channel”.
    const goalIdx = rows.findIndex((r) => {
      const t = normalizeLabel(r.label);
      return (
        t.includes("з якою метою") ||
        t.includes("метою") ||
        t.includes("мета") ||
        t.includes("цель") ||
        t.includes("обращение")
      );
    });

    const channelIdx = rows.findIndex((r) => {
      const t = normalizeLabel(r.label);
      return (
        (t.includes("канал") && (t.includes("зв") || t.includes("связ"))) ||
        t.includes("як нам краще звязатися") ||
        t.includes("як нам краще зв'язатися")
      );
    });

    if (goalIdx >= 0) {
      rows[goalIdx] = { ...rows[goalIdx], num: 7, label: "7. Обращение / Цель" };
    }
    if (channelIdx >= 0) {
      rows[channelIdx] = { ...rows[channelIdx], num: 8, label: "8. Канал связи" };
    }
  } else if (rawAnswers && typeof rawAnswers === "object" && !Array.isArray(rawAnswers)) {
    const o = rawAnswers as Record<string, unknown>;
    for (const [k, v] of Object.entries(o)) {
      if (k === "consultation_time" || k === "consultation_at") continue;
      const num = Number(k);
      if (!Number.isNaN(num)) {
        rows.push({
          num,
          label: `${num}.`,
          value: typeof v === "object" ? JSON.stringify(v) : String(v ?? "—"),
        });
      }
    }
  }

  const consultationFormatted = consultationTime
    ? formatConsultationTimeDisplay(consultationTime)
    : null;
  const idx10 = rows.findIndex((r) => r.num === 10);

  if (consultationFormatted && consultationFormatted !== "—") {
    if (idx10 >= 0) {
      rows[idx10] = {
        ...rows[idx10],
        label: rows[idx10].label.includes("консультац")
          ? rows[idx10].label
          : FIELD_10_CONSULTATION_LABEL,
        value: consultationFormatted,
      };
    } else {
      rows.push({
        num: 10,
        label: FIELD_10_CONSULTATION_LABEL,
        value: consultationFormatted,
      });
    }
  } else if (idx10 < 0) {
    rows.push({
      num: 10,
      label: FIELD_10_CONSULTATION_LABEL,
      value: "—",
    });
  }

  rows.sort((a, b) => a.num - b.num);
  return rows;
}
