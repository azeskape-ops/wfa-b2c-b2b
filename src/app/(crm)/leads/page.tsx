"use client";

import { useEffect, useMemo, useState, Fragment } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { formatConsultationTimeDisplay } from "@/lib/crm-questionnaire";

type Lead = {
  id: string;
  phone: string;
  name?: string | null;
  status?: string | null;
  status_stage?: string | null;
  consultation_time?: string | null;
  created_at?: string;
};

/** Local calendar YYYY-MM-DD (no UTC shift). */
function toLocalYmd(iso: string | undefined | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** e.g. "8 Mar 2026" */
function formatDaySeparatorLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function createdSortTs(lead: Lead): number {
  if (!lead.created_at) return Number.NEGATIVE_INFINITY;
  const t = new Date(lead.created_at).getTime();
  return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
}

function groupLeadsByDay(sorted: Lead[]): { key: string; label: string; leads: Lead[] }[] {
  const out: { key: string; label: string; leads: Lead[] }[] = [];
  for (const lead of sorted) {
    const ymd = toLocalYmd(lead.created_at);
    const key = ymd ?? "__no_date__";
    const label =
      ymd && lead.created_at
        ? formatDaySeparatorLabel(lead.created_at)
        : "Без дати";
    const last = out[out.length - 1];
    if (last && last.key === key) {
      last.leads.push(lead);
    } else {
      out.push({ key, label, leads: [lead] });
    }
  }
  return out;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetch("/api/crm/leads")
      .then((res) => res.json())
      .then((data) => {
        if (data?.status === "ok" && Array.isArray(data.leads)) {
          setLeads(data.leads);
        }
      })
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, []);

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    for (const l of leads) {
      const s = (l.status_stage ?? l.status ?? "").trim();
      if (s) set.add(s);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "uk"));
  }, [leads]);

  const { fromBound, toBound } = useMemo(() => {
    let from = dateFrom;
    let to = dateTo;
    if (from && to && from > to) {
      [from, to] = [to, from];
    }
    return { fromBound: from, toBound: to };
  }, [dateFrom, dateTo]);

  const filteredGrouped = useMemo(() => {
    const hasDateFilter = fromBound !== "" || toBound !== "";

    const filtered = leads.filter((lead) => {
      if (statusFilter) {
        const stage = (lead.status_stage ?? lead.status ?? "").trim();
        if (stage !== statusFilter) return false;
      }

      if (hasDateFilter) {
        const ymd = toLocalYmd(lead.created_at);
        if (!ymd) return false;
        if (fromBound && ymd < fromBound) return false;
        if (toBound && ymd > toBound) return false;
      }

      return true;
    });

    const sorted = [...filtered].sort((a, b) => createdSortTs(b) - createdSortTs(a));
    return groupLeadsByDay(sorted);
  }, [leads, statusFilter, fromBound, toBound]);

  const clearFilters = () => {
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters = Boolean(statusFilter || dateFrom || dateTo);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-gray-500">Завантаження...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ліди</h1>

      <div className="mb-4 flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex min-w-[180px] flex-1 flex-col gap-1.5">
          <label
            htmlFor="leads-filter-status"
            className="text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            Статус
          </label>
          <select
            id="leads-filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 focus:border-[#201A8E] focus:outline-none focus:ring-2 focus:ring-[#201A8E]/20"
          >
            <option value="">Усі статуси</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex min-w-[140px] flex-col gap-1.5">
          <label
            htmlFor="leads-filter-from"
            className="text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            Дата від
          </label>
          <input
            id="leads-filter-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 focus:border-[#201A8E] focus:outline-none focus:ring-2 focus:ring-[#201A8E]/20"
          />
        </div>
        <div className="flex min-w-[140px] flex-col gap-1.5">
          <label
            htmlFor="leads-filter-to"
            className="text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            Дата до
          </label>
          <input
            id="leads-filter-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 focus:border-[#201A8E] focus:outline-none focus:ring-2 focus:ring-[#201A8E]/20"
          />
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="h-10 shrink-0 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Скинути фільтри
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Телефон
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Консультація
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Статус
              </th>
              <th className="w-[100px] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Дії
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredGrouped.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  {leads.length === 0 ? "Немає лідів" : "Немає лідів за обраними фільтрами"}
                </td>
              </tr>
            ) : (
              filteredGrouped.map((group) => (
                <Fragment key={group.key}>
                  <tr className="bg-gray-50/80">
                    <td colSpan={4} className="p-0">
                      <div className="flex items-center px-2 py-3">
                        <div className="flex-1 border-t border-gray-200" />
                        <span className="px-4 text-sm text-gray-500">{group.label}</span>
                        <div className="flex-1 border-t border-gray-200" />
                      </div>
                    </td>
                  </tr>
                  {group.leads.map((lead) => {
                    const badgeStatus = lead.status_stage ?? lead.status ?? "";
                    return (
                      <tr key={lead.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-sm text-gray-900">{lead.phone}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {lead.consultation_time
                            ? formatConsultationTimeDisplay(lead.consultation_time)
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {badgeStatus ? <StatusBadge status={badgeStatus} /> : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="text-sm font-semibold text-[#201A8E] hover:underline"
                          >
                            Картка
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
