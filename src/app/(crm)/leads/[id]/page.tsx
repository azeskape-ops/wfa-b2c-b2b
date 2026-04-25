"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import {
  buildQuestionnaireRows,
  formatConsultationTimeDisplay,
  type QuestionnaireRow,
} from "@/lib/crm-questionnaire";

type LeadRecord = {
  id: string;
  phone?: string | null;
  name?: string | null;
  status?: string | null;
  status_stage?: string | null;
  consultation_time?: string | null;
  raw_answers?: unknown;
  created_at?: string | null;
  [key: string]: unknown;
};

export default function LeadDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const [lead, setLead] = useState<LeadRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Невірне посилання");
      return;
    }
    fetch(`/api/crm/leads/${id}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data) => {
        if (data?.status === "ok" && data.lead) {
          setLead(data.lead as LeadRecord);
        } else {
          setError("Лід не знайдено");
        }
      })
      .catch(() => setError("Помилка завантаження"))
      .finally(() => setLoading(false));
  }, [id]);

  const questionnaireRows: QuestionnaireRow[] = lead
    ? buildQuestionnaireRows(lead.raw_answers, lead.consultation_time ?? null)
    : [];

  const statusForBadge = lead?.status_stage ?? lead?.status ?? "";

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-gray-500">Завантаження...</p>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{error || "Не знайдено"}</p>
        <Link href="/leads" className="text-[#201A8E] font-semibold hover:underline">
          ← До списку лідів
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/leads" className="text-sm font-semibold text-[#201A8E] hover:underline">
          ← До списку лідів
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Картка ліда</h1>
        <p className="mt-1 font-mono text-sm text-gray-500">{lead.id}</p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Телефон</dt>
            <dd className="mt-1 text-gray-900">{lead.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Імʼя</dt>
            <dd className="mt-1 text-gray-900">{lead.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Статус</dt>
            <dd className="mt-1">
              {statusForBadge ? <StatusBadge status={statusForBadge} /> : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Консультація (запис)
            </dt>
            <dd className="mt-1 text-gray-900">
              {lead.consultation_time
                ? formatConsultationTimeDisplay(lead.consultation_time)
                : "—"}
            </dd>
          </div>
        </dl>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Анкета</h2>
        <p className="mt-1 text-sm text-gray-500">Поля анкети та дата консультації</p>

        <div className="mt-6 space-y-4">
          {questionnaireRows.length === 0 ? (
            <p className="text-sm text-gray-400">Немає даних анкети</p>
          ) : (
            questionnaireRows.map((row) => (
              <div
                key={row.num}
                className={`rounded-xl border px-4 py-3 ${
                  row.num === 10
                    ? "border-[#201A8E]/30 bg-[#201A8E]/[0.06]"
                    : "border-gray-100 bg-gray-50/50"
                }`}
              >
                <p className="text-xs font-semibold text-gray-500">{row.label}</p>
                <p
                  className={`mt-1 text-sm ${
                    row.num === 10 ? "font-semibold text-gray-900" : "text-gray-800"
                  }`}
                >
                  {row.value}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
