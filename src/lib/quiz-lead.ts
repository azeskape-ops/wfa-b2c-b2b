/**
 * Quiz → CRM `status_stage` and questionnaire payload for `leads.raw_answers`.
 */

export type QuizAnswers = {
  status?: string;
  address?: string;
  work?: string;
  exp?: string;
  goal?: string;
  channel?: string;
};

/** Short codes (frontend) → human-readable labels for CRM display. */
export const CODE_TO_LABEL: Record<string, string> = {
  status_odi: "У мене вже є тимчасовий захист (odídenec)",
  status_bio: "Тільки паспорт / біометричний документ",
  status_other_vnj: "Карта ВНЖ іншої країни",
  status_sk_vnj: "ВНЖ Словаччини",
  addr_yes: "Так, є",
  addr_no: "Ні",
  addr_process: "В процесі оформлення",
  addr_idk: "Не знаю / потрібна консультація",
  work_yes: "Так, працюю (офіційно або ні)",
  work_search: "В пошуку роботи",
  work_no: "Наразі не працюю",
  work_other: "Інше",
  exp_yes: "Так, звертався(лась)",
  exp_no: "Ні, звертаюся вперше",
  exp_part: "Частково консультувався(лась)",
  exp_stop: "Звертався(лась), але процес зупинився",
  goal_new: "Отримання ВНЖ",
  goal_renew: "Продовження ВНЖ",
  goal_consult: "Консультація щодо легалізації",
};

const QUESTION_LABELS: { key: keyof QuizAnswers; label: string }[] = [
  { key: "status", label: "Ваш поточний статус?" },
  {
    key: "address",
    label: "Чи маєте ви офіційну адресу реєстрації у Словаччині?",
  },
  { key: "work", label: "Чи маєте ви офіційну роботу у Словаччині?" },
  { key: "exp", label: "Чи зверталися ви раніше щодо легалізації (ВНЖ)?" },
  { key: "goal", label: "З якою метою ви звертаєтеся?" },
  { key: "channel", label: "Канал зв'язку" },
];

/**
 * Singular source of truth for `status_stage` on quiz submission (short-code based).
 */
export function computeStatusStageFromQuiz(answers: QuizAnswers): string {
  const work = answers.work || "";
  const address = answers.address || "";
  const status = answers.status || "";

  // 1. Priority Reject
  if (work === "work_no" || work === "work_search") {
    return "Поки що не для нас";
  }

  // 2. Priority Other
  if (work === "work_other") {
    return "Повідомлення";
  }

  // 3. Main Target Logic (Must be working)
  if (work === "work_yes") {
    const hasAddress = address === "addr_yes";

    // Check VNJ documents
    if (hasAddress && (status === "status_sk_vnj" || status === "status_other_vnj")) {
      return "Таргет обнова";
    }

    // Check ODI / Bio documents
    if (hasAddress && (status === "status_odi" || status === "status_bio")) {
      return "Таргет";
    }

    // Working, but no address or different docs
    return "Теплый";
  }

  // Fallback
  return "Повідомлення";
}

export type RawAnswerRow = { num: number; question: string; answer: string };

export function buildRawAnswersPayload(
  name: string,
  city: string,
  email: string,
  answers: QuizAnswers
): RawAnswerRow[] {
  const rows: RawAnswerRow[] = [
    { num: 1, question: "Прізвище та ім'я", answer: name.trim() || "—" },
    { num: 2, question: "Місто проживання", answer: city.trim() || "—" },
    { num: 3, question: "Email", answer: email.trim() || "—" },
  ];
  let n = 4;
  for (const { key, label } of QUESTION_LABELS) {
    const v = answers[key];
    const strValue = typeof v === "string" ? v.trim() : "";
    const finalAnswer = CODE_TO_LABEL[strValue] || strValue || "—";

    rows.push({
      num: n++,
      question: label,
      answer: finalAnswer,
    });
  }
  return rows;
}
