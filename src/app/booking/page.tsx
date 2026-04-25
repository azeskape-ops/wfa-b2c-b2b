"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type ClientStatus = "idle" | "checking" | "slots" | "noSlots" | "error";

type BookingPhase = "login" | "slots";

type BookingResultType = "success" | "error" | "already_booked" | null;

const MAX_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 3000;

/** Local calendar date as YYYY-MM-DD (matches Supabase `date` column, no UTC shift). */
function toYYYYMMDDLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Strict YYYY-MM-DD for API (calendar-valid, no UTC drift). */
function toStrictYYYYMMDD(value: string): string | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const [y, mo, da] = trimmed.split("-").map(Number);
  const d = new Date(y, mo - 1, da);
  if (d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== da) {
    return null;
  }
  return `${String(y)}-${String(mo).padStart(2, "0")}-${String(da).padStart(2, "0")}`;
}

/** DD.MM.YYYY HH:mm for “already booked” copy */
function formatBookingDdMmYyyyHhMm(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
}

type DateOption = {
  value: string;
  weekday: string;
  dayMonth: string;
  label: string;
};

const generateDates = (days: number): DateOption[] => {
  const result: DateOption[] = [];
  const weekdayFmt = new Intl.DateTimeFormat("uk-UA", { weekday: "short" });
  const dayMonthFmt = new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "short",
  });
  const fullFmt = new Intl.DateTimeFormat("uk-UA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + i);
    result.push({
      value: toYYYYMMDDLocal(date),
      weekday: weekdayFmt.format(date),
      dayMonth: dayMonthFmt.format(date),
      label: fullFmt.format(date),
    });
  }

  return result;
};

function buildDateOptionForYMD(ymd: string): DateOption | null {
  const strict = toStrictYYYYMMDD(ymd);
  if (!strict) return null;
  const [y, mo, da] = strict.split("-").map(Number);
  const date = new Date(y, mo - 1, da);
  date.setHours(12, 0, 0, 0);
  const weekdayFmt = new Intl.DateTimeFormat("uk-UA", { weekday: "short" });
  const dayMonthFmt = new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "short",
  });
  const fullFmt = new Intl.DateTimeFormat("uk-UA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return {
    value: strict,
    weekday: weekdayFmt.format(date),
    dayMonth: dayMonthFmt.format(date),
    label: fullFmt.format(date),
  };
}

function mergeDateIntoOptions(
  base: DateOption[],
  extraYmd: string | null
): DateOption[] {
  if (!extraYmd) return base;
  const strict = toStrictYYYYMMDD(extraYmd);
  if (!strict || base.some((d) => d.value === strict)) return base;
  const opt = buildDateOptionForYMD(strict);
  if (!opt) return base;
  return [...base, opt].sort((a, b) => a.value.localeCompare(b.value));
}

const COUNTRY_OPTIONS: { dial: string; label: string }[] = [
  { dial: "+380", label: "🇺🇦 +380" },
  { dial: "+421", label: "🇸🇰 +421" },
  { dial: "+420", label: "🇨🇿 +420" },
  { dial: "+48", label: "🇵🇱 +48" },
  { dial: "+36", label: "🇭🇺 +36" },
  { dial: "+49", label: "🇩🇪 +49" },
];

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

/** Build full phone for API: country code + local digits (strip leading 0 from local). */
function buildFullPhone(countryDial: string, localRaw: string): string {
  let local = digitsOnly(localRaw);
  local = local.replace(/^0+/, "");
  return `${countryDial}${local}`;
}

/** Match URL ?phone=... to a known dial code + local part (with or without +). */
function parsePhoneFromParam(param: string): { dial: string; local: string } {
  const trimmed = param.trim().replace(/\s/g, "");
  const sorted = [...COUNTRY_OPTIONS].sort((a, b) => b.dial.length - a.dial.length);
  for (const { dial } of sorted) {
    if (trimmed.startsWith(dial)) {
      return { dial, local: digitsOnly(trimmed.slice(dial.length)) };
    }
  }
  const d = digitsOnly(trimmed);
  for (const { dial } of sorted) {
    const prefix = dial.replace("+", "");
    if (d.startsWith(prefix) && d.length > prefix.length) {
      return { dial, local: d.slice(prefix.length) };
    }
  }
  return { dial: "+421", local: d };
}

type SlotItem = { time: string; id?: string };

function splitIsoToDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return { date: `${dd}.${mm}.${yyyy}`, time: `${hh}:${min}` };
}

/** Map API slot rows to { time, id }; supports `time` or legacy `time_slot`. */
function normalizeSlotsFromResponse(data: unknown): SlotItem[] {
  if (!data || typeof data !== "object") return [];
  const d = data as { status?: string; slots?: unknown };
  if (d.status !== "ok" || !Array.isArray(d.slots)) return [];
  return d.slots
    .map((item): SlotItem | null => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const raw = row.time ?? row.time_slot;
      let timeStr = "";
      if (typeof raw === "string") timeStr = raw.trim();
      else if (raw != null) timeStr = String(raw).trim();
      if (!timeStr) return null;
      return {
        time: timeStr,
        id: row.id != null ? String(row.id) : undefined,
      };
    })
    .filter((x): x is SlotItem => x !== null);
}

function BookingContent() {
  const searchParams = useSearchParams();
  const urlPhoneAppliedRef = React.useRef(false);

  const [countryDial, setCountryDial] = useState("+421");
  const [localPhone, setLocalPhone] = useState("");
  const [phase, setPhase] = useState<BookingPhase>("login");
  const [clientStatus, setClientStatus] = useState<ClientStatus>("idle");
  const [attempt, setAttempt] = useState(0);
  const [showLoading, setShowLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultType, setResultType] = useState<BookingResultType>(null);
  const [resultMessage, setResultMessage] = useState("");
  const [clientName, setClientName] = useState("");
  const [modalMessageMeta, setModalMessageMeta] = useState<{
    name: string;
    date: string;
    time: string;
  }>({ name: "", date: "", time: "" });
  const [ensuredStripYmd, setEnsuredStripYmd] = useState<string | null>(null);
  const autoPickSlotsRef = React.useRef(false);
  const userPickedDateRef = React.useRef(false);

  const dates = React.useMemo(
    () => mergeDateIntoOptions(generateDates(21), ensuredStripYmd),
    [ensuredStripYmd]
  );

  useEffect(() => {
    if (phase === "login") {
      autoPickSlotsRef.current = false;
      userPickedDateRef.current = false;
      setEnsuredStripYmd(null);
      return;
    }
    if (phase !== "slots" || selectedDate !== null || autoPickSlotsRef.current) {
      return;
    }
    let cancelled = false;
    fetch("/api/crm/get-available-dates", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || userPickedDateRef.current) return;
        autoPickSlotsRef.current = true;
        const list = data?.dates;
        if (!Array.isArray(list) || list.length === 0) return;
        const first = list[0];
        const strict = toStrictYYYYMMDD(
          typeof first === "string" ? first : String(first)
        );
        if (!strict) return;
        setEnsuredStripYmd(strict);
        setSelectedDate(strict);
      })
      .catch(() => {
        autoPickSlotsRef.current = false;
      });
    return () => {
      cancelled = true;
    };
  }, [phase, selectedDate]);

  useEffect(() => {
    if (!selectedDate) {
      setSlots([]);
      return;
    }
    const strictDate = toStrictYYYYMMDD(selectedDate);
    if (!strictDate) {
      setSlots([]);
      setSlotsLoading(false);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    setSlots([]);
    fetch(`/api/crm/get-slots?date=${encodeURIComponent(strictDate)}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        console.log("SLOTS RECEIVED ON FRONTEND:", data);
        setSlots(normalizeSlotsFromResponse(data));
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  useEffect(() => {
    const paramPhone = searchParams.get("phone");
    if (paramPhone && !urlPhoneAppliedRef.current) {
      urlPhoneAppliedRef.current = true;
      const parsed = parsePhoneFromParam(paramPhone);
      setCountryDial(parsed.dial);
      setLocalPhone(parsed.local);
      checkClientStatus(buildFullPhone(parsed.dial, parsed.local), true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const checkClientStatus = async (phoneToCheck: string, autoStart = false) => {
    if (!phoneToCheck.trim()) return;

    setClientStatus("checking");
    setShowLoading(true);
    setAttempt(0);

    let outcome: "ok" | "already_booked" | "fail" = "fail";
    let verifiedName = "";
    let bookedConsultationTime: string | null = null;

    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
      setAttempt(i);

      try {
        const response = await fetch("/api/crm/check-client", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phone: phoneToCheck }),
        });

        if (response.ok) {
          const data = (await response.json().catch(() => ({}))) as {
            status?: string;
            lead?: {
              name?: string | null;
              consultation_time?: string | null;
            };
          };

          if (data?.status === "already_booked") {
            outcome = "already_booked";
            const n = data.lead?.name;
            verifiedName = typeof n === "string" ? n.trim() : "";
            const ct = data.lead?.consultation_time;
            bookedConsultationTime =
              ct != null && String(ct).trim() !== "" ? String(ct) : null;
            break;
          }

          if (data?.status === "ok") {
            outcome = "ok";
            const n = data.lead?.name;
            verifiedName = typeof n === "string" ? n.trim() : "";
            break;
          }
        }
      } catch (error) {
        // Placeholder: ignore network errors for now
      }

      if (i < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }
    }

    setShowLoading(false);

    if (outcome === "ok") {
      setClientName(verifiedName);
      setClientStatus("slots");
      setPhase("slots");
    } else if (outcome === "already_booked") {
      setClientName(verifiedName);
      setClientStatus("idle");
      setPhase("login");
      const fmt = bookedConsultationTime
        ? formatBookingDdMmYyyyHhMm(bookedConsultationTime)
        : "—";
      const greeting =
        verifiedName.trim().length > 0
          ? `Вітаємо, ${verifiedName.trim()}! Ви вже записані на консультацію: ${fmt}. У цей час наш співробітник зв'яжеться з вами.`
          : `Вітаємо! Ви вже записані на консультацію: ${fmt}. У цей час наш співробітник зв'яжеться з вами.`;
      const alreadyBookedDateTime = bookedConsultationTime
        ? splitIsoToDateTime(bookedConsultationTime)
        : { date: "", time: "" };
      setModalMessageMeta({
        name: verifiedName.trim(),
        date: alreadyBookedDateTime.date,
        time: alreadyBookedDateTime.time,
      });
      setResultType("already_booked");
      setResultMessage(greeting);
      setShowResultModal(true);
    } else {
      setClientName("");
      setClientStatus("noSlots");
      setPhase(autoStart ? "slots" : "login");
      setResultType("error");
      setResultMessage(
        "На жаль, на даний момент немає вільних слотів для запису на консультацію."
      );
      setShowResultModal(true);
    }
  };

  const fullPhoneForApi = buildFullPhone(countryDial, localPhone);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!digitsOnly(localPhone)) return;
    checkClientStatus(fullPhoneForApi);
  };

  const handleTimeClick = (time: string) => {
    if (!selectedDate) return;
    setSelectedTime(time);
    setShowConfirmModal(true);
  };

  const handleConfirmBooking = async () => {
    setShowConfirmModal(false);
    setShowLoading(true);
    setModalMessageMeta({
      name: clientName?.trim() ?? "",
      date: selectedDate?.trim() ?? "",
      time: selectedTime?.trim() ?? "",
    });

    try {
      const response = await fetch("/api/crm/book-slot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: fullPhoneForApi,
          date: toStrictYYYYMMDD(selectedDate!) ?? selectedDate,
          time: selectedTime,
        }),
      });

      setShowLoading(false);

      if (response.ok) {
        setResultType("success");
        setResultMessage("Ваш запис на консультацію успішно підтверджено!");
      } else {
        setResultType("error");
        setResultMessage(
          "Сталася помилка при підтвердженні запису. Спробуйте, будь ласка, ще раз."
        );
      }
    } catch (error) {
      setShowLoading(false);
      setResultType("error");
      setResultMessage(
        "Сталася помилка при з’єднанні з сервером. Спробуйте пізніше."
      );
    }

    setShowResultModal(true);
  };

  const loadingText =
    attempt <= 1
      ? "Шукаємо вашу анкету... Зачекайте."
      : `Синхронізація даних... (спроба ${Math.min(
          attempt,
          MAX_ATTEMPTS
        )} з ${MAX_ATTEMPTS})`;

  const isSuccess = resultType === "success";
  const isAlreadyBooked = resultType === "already_booked";
  const modalPositiveClose = isSuccess || isAlreadyBooked;
  const modalMessage = resultMessage;
  const generateMessage = () => {
    const activeName = modalMessageMeta.name;
    const activeDate = modalMessageMeta.date;
    const activeTime = modalMessageMeta.time;
    const normalizedClientName = activeName ? activeName : "клієнт";
    let msg = `Вітаю. Мене звати ${normalizedClientName}. `;

    if (activeDate && activeTime) {
      msg += `У мене призначена консультація на ${activeDate} о ${activeTime}.`;
    } else {
      msg += "У мене ще не призначена дата консультації.";
    }

    return encodeURIComponent(msg);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f7f6] p-5">
      <div
        className={`bg-white p-8 sm:p-9 rounded-[24px] shadow-xl shadow-gray-200/50 w-full text-center relative z-10 ${
          phase === "slots" ? "max-w-[440px]" : "max-w-[400px]"
        }`}
      >
        <div className="mx-auto mb-9 flex h-44 w-44 sm:h-52 sm:w-52 shrink-0 items-center justify-center rounded-full border-[3px] border-gray-200/90 bg-gradient-to-b from-white to-gray-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_28px_rgba(32,26,142,0.1)]">
          <img
            src="https://i.ibb.co/mrvnp4H0/Group-33.png"
            alt="Work For All"
            className="h-[5.25rem] w-auto max-w-[11rem] sm:h-28 sm:max-w-[12.5rem] object-contain drop-shadow-md"
          />
        </div>
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-[#201A8E] mb-2 tracking-tight">
            Запис на консультацію
          </h1>
          {phase === "slots" && (
            <h3 className="mb-2 font-semibold text-lg text-gray-800">
              {clientName ? `Вітаємо, ${clientName}!` : "Вітаємо!"}
            </h3>
          )}
          <p className="text-[15px] text-gray-500 leading-relaxed">
            {phase === "slots"
              ? "Оберіть підходящу для вас вільну дату та час."
              : "Оберіть код країни та введіть номер без «+». Далі оберіть дату та час."}
          </p>
        </div>

        {phase === "login" && (
          <form onSubmit={handleManualSubmit} className="space-y-5 text-left">
            <div>
              <label
                htmlFor="booking-local-phone"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Номер телефону
              </label>
              <div className="flex gap-2.5 items-stretch">
                <div className="relative shrink-0 w-[min(7.25rem,38%)]">
                  <select
                    id="booking-country"
                    aria-label="Код країни"
                    value={countryDial}
                    onChange={(e) => setCountryDial(e.target.value)}
                    className="h-14 w-full cursor-pointer appearance-none rounded-xl border-2 border-gray-200 bg-gray-50 py-0 pl-3 pr-9 text-[14px] font-semibold text-gray-800 shadow-sm outline-none transition-all hover:border-gray-300 focus:border-[#201A8E] focus:bg-white focus:ring-0"
                  >
                    {COUNTRY_OPTIONS.map(({ dial, label }) => (
                      <option key={dial} value={dial}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <span
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400"
                    aria-hidden
                  >
                    ▼
                  </span>
                </div>
                <input
                  id="booking-local-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="901 234 567"
                  value={localPhone}
                  onChange={(e) => setLocalPhone(e.target.value)}
                  className="min-w-0 flex-1 h-14 rounded-xl border-2 border-gray-200 bg-gray-50 px-4 text-[16px] shadow-sm outline-none transition-all hover:border-gray-300 focus:border-[#201A8E] focus:bg-white focus:ring-0"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-[#201A8E] hover:bg-[#151160] text-white font-bold rounded-xl text-[17px] transition-all shadow-lg shadow-[#201A8E]/30 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!digitsOnly(localPhone) || clientStatus === "checking"}
            >
              Продовжити
            </button>
          </form>
        )}

        {phase === "slots" && (
          <div className="space-y-7 text-left">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                Дата
              </p>
              <div className="flex gap-2.5 overflow-x-auto pb-2 pt-0.5 hide-scrollbar snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
                {dates.map((date) => (
                  <button
                    key={date.value}
                    type="button"
                    title={date.label}
                    aria-label={date.label}
                    aria-pressed={selectedDate === date.value}
                    onClick={() => {
                      userPickedDateRef.current = true;
                      setSelectedDate(
                        toStrictYYYYMMDD(date.value) ?? date.value
                      );
                    }}
                    className={`snap-center flex min-h-[5.25rem] w-[3.75rem] max-w-[3.9rem] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-1.5 py-3.5 transition shadow-sm ${
                      selectedDate === date.value
                        ? "border-[#201A8E] bg-[#201A8E] text-white shadow-md shadow-[#201A8E]/25"
                        : "border-gray-200 bg-white text-gray-800 hover:border-[#201A8E]/45 hover:bg-gray-50/90"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold uppercase leading-none tracking-wider ${
                        selectedDate === date.value ? "text-white/90" : "text-gray-500"
                      }`}
                    >
                      {date.weekday}
                    </span>
                    <span className="text-center text-[13px] font-extrabold leading-tight">
                      {date.dayMonth}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                Час
              </p>
              {!selectedDate ? (
                <p className="text-sm text-gray-400 leading-relaxed">
                  Спочатку оберіть дату зліва.
                </p>
              ) : slotsLoading ? (
                <p className="text-sm text-gray-500">Завантаження слотів...</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Немає вільних слотів на цю дату.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
                  {slots.map((slot) => (
                    <button
                      key={slot.id ?? slot.time}
                      type="button"
                      onClick={() => handleTimeClick(slot.time)}
                      className={`flex w-full items-center justify-center rounded-full border px-2 py-2 text-sm font-semibold transition ${
                        selectedTime === slot.time
                          ? "border-[#201A8E] bg-[#201A8E] text-white shadow-sm shadow-[#201A8E]/25"
                          : "border-gray-200 bg-gray-50/80 text-gray-800 hover:border-[#201A8E]/40 hover:bg-white"
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showLoading && (
        <div className="fixed inset-0 z-[99999] bg-white/85 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full border-4 border-[#e5e7eb] border-t-[#201A8E] animate-spin mb-4" />
          <p className="text-sm text-[#111827] animate-pulse text-center px-6">
            {loadingText}
          </p>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-[99999] bg-black/30 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-left">
            <h2 className="text-base font-semibold text-[#111827] mb-2">
              Підтвердити запис?
            </h2>
            <p className="text-sm text-[#4b5563] mb-4">
              Ви обрали консультацію{" "}
              <span className="font-semibold">
                {selectedDate} о {selectedTime}
              </span>
              . Підтвердити запис?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#4b5563] bg-[#f3f4f6] hover:bg-[#e5e7eb] transition"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={handleConfirmBooking}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#201A8E] hover:bg-[#16126a] shadow-sm transition"
              >
                Підтвердити
              </button>
            </div>
          </div>
        </div>
      )}

      {showResultModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex justify-center items-center p-5">
          <div className="bg-white w-full max-w-[400px] rounded-[24px] p-8 text-center shadow-2xl animate-in zoom-in duration-300">
            <div
              className={`w-[70px] h-[70px] mx-auto rounded-full flex items-center justify-center mb-5 shadow-lg ${
                isSuccess || isAlreadyBooked
                  ? "bg-gradient-to-br from-[#28a745] to-[#85e0a3] shadow-green-500/30"
                  : "bg-gradient-to-br from-[#dc3545] to-[#ff8a97] shadow-red-500/30"
              }`}
            >
              {isSuccess || isAlreadyBooked ? (
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              ) : (
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              )}
            </div>

            <h3 className="text-[22px] font-extrabold text-gray-900 mb-3">
              {isSuccess
                ? "Заявка прийнята!"
                : isAlreadyBooked
                  ? "Ви вже записані"
                  : "Увага"}
            </h3>
            <p className="text-[15px] text-gray-600 mb-6 leading-relaxed">
              {modalMessage ||
                "На жаль, на даний момент немає вільних слотів для запису на консультацію."}
            </p>

            <div className="mt-2 pt-6 border-t border-gray-100">
              <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider mb-4">
                Напишіть нам:
              </p>
              <div className="flex gap-2 justify-center mb-6">
                <a
                  href={"https://wa.me/421915909868?text=" + generateMessage()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center py-3 rounded-xl bg-[#25D366] text-white font-semibold text-[13px] hover:scale-105 transition-transform shadow-md shadow-[#25D366]/20"
                >
                  WhatsApp
                </a>
                <a
                  href={"https://t.me/wfa_chat_bot?text=" + generateMessage()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center py-3 rounded-xl bg-[#0088cc] text-white font-semibold text-[13px] hover:scale-105 transition-transform shadow-md shadow-[#0088cc]/20"
                >
                  Telegram
                </a>
                <a
                  href={
                    "viber://chat?number=%2B421915909868&draft=" + generateMessage()
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center py-3 rounded-xl bg-[#7360f2] text-white font-semibold text-[13px] hover:scale-105 transition-transform shadow-md shadow-[#7360f2]/20"
                >
                  Viber
                </a>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (modalPositiveClose) {
                  window.location.href = "https://www.workforall.sk/";
                } else {
                  setShowResultModal(false);
                }
              }}
              className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-[16px] transition-colors"
            >
              Зрозуміло
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={null}>
      <BookingContent />
    </Suspense>
  );
}

