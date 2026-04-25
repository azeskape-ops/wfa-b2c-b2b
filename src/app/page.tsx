"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import intlTelInput from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";

const MAIN = "#0056b3";
const BG = "#f8fafc";

type OptionItem = { label: string; value: string };

const QUESTIONS: { k: keyof QuestionAnswers; q: string; o: OptionItem[] }[] = [
  {
    k: "status",
    q: "Ваш поточний статус?",
    o: [
      { label: "У мене вже є тимчасовий захист (odídenec)", value: "status_odi" },
      { label: "Тільки паспорт / біометричний документ", value: "status_bio" },
      { label: "Карта ВНЖ іншої країни", value: "status_other_vnj" },
      { label: "ВНЖ Словаччини", value: "status_sk_vnj" },
    ],
  },
  {
    k: "address",
    q: "Чи маєте ви офіційну адресу реєстрації у Словаччині?",
    o: [
      { label: "Так, є", value: "addr_yes" },
      { label: "Ні", value: "addr_no" },
      { label: "В процесі оформлення", value: "addr_process" },
      { label: "Не знаю / потрібна консультація", value: "addr_idk" },
    ],
  },
  {
    k: "work",
    q: "Чи маєте ви офіційну роботу у Словаччині?",
    o: [
      { label: "Так, офіційно працюю", value: "work_yes" },
      { label: "В пошуку роботи", value: "work_search" },
      { label: "Наразі не працюю", value: "work_no" },
      { label: "Інше", value: "work_other" },
    ],
  },
  {
    k: "exp",
    q: "Чи зверталися ви раніше щодо легалізації (ВНЖ)?",
    o: [
      { label: "Так, звертався(лась)", value: "exp_yes" },
      { label: "Ні, звертаюся вперше", value: "exp_no" },
      { label: "Частково консультувався(лась)", value: "exp_part" },
      { label: "Звертався(лась), але процес зупинився", value: "exp_stop" },
    ],
  },
  {
    k: "goal",
    q: "З якою метою ви звертаєтеся?",
    o: [
      { label: "Отримання ВНЖ", value: "goal_new" },
      { label: "Продовження ВНЖ", value: "goal_renew" },
      { label: "Консультація щодо легалізації", value: "goal_consult" },
    ],
  },
  {
    k: "channel",
    q: "Канал зв'язку",
    o: [
      { label: "WhatsApp", value: "WhatsApp" },
      { label: "Telegram", value: "Telegram" },
      { label: "Viber", value: "Viber" },
      { label: "Мобільний дзвінок", value: "Мобільний дзвінок" },
    ],
  },
];

type QuestionAnswers = {
  status?: string;
  address?: string;
  work?: string;
  exp?: string;
  goal?: string;
  channel?: string;
};

function onlyDigits(s: string): string {
  return s.replace(/\D/g, "");
}

function isLocalNumber9Digits(localValue: string): boolean {
  return onlyDigits(localValue).length === 9;
}

/** After successful submit, send straight to booking (matches check-client whitelist). */
const REDIRECT_TO_BOOKING_STAGES = new Set([
  "Таргет",
  "Теплый",
  "Тёплый",
  "Таргет обнова",
]);

function phoneForSubmitApi(
  iti: ReturnType<typeof intlTelInput> | null,
  fallbackInputValue: string
): string {
  if (iti) {
    try {
      const n = iti.getNumber?.();
      if (typeof n === "string" && onlyDigits(n).length >= 9) return n;
    } catch {
      /* ignore */
    }
    try {
      const data = iti.getSelectedCountryData?.();
      const dial = data?.dialCode ? `+${data.dialCode}` : "+421";
      const local = onlyDigits(fallbackInputValue).replace(/^0+/, "");
      if (local.length >= 9) return `${dial}${local}`;
    } catch {
      /* ignore */
    }
  }
  return fallbackInputValue.trim();
}

export default function QuizPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [phoneError, setPhoneError] = useState(false);

  const [name, setName] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);

  const phoneInputRef = useRef<HTMLInputElement>(null);
  const [itiInstance, setItiInstance] = useState<ReturnType<typeof intlTelInput> | null>(null);

  useEffect(() => {
    const inputEl = phoneInputRef.current;
    if (!inputEl) return;
    const instance = intlTelInput(
      inputEl,
      {
        initialCountry: "sk",
        countryOrder: ["sk", "ua", "az"],
        separateDialCode: true,
        showSelectedDialCode: true,
        preferredCountries: ["sk", "ua", "az"],
        countrySearch: false,
        dropdownContainer: document.body,
        utilsScript:
          "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js",
      } as any
    );
    setItiInstance(instance);
    const syncPhone = () => setPhoneValue(inputEl.value ?? "");
    inputEl.addEventListener("input", syncPhone);
    return () => {
      inputEl.removeEventListener("input", syncPhone);
      instance.destroy();
    };
  }, []);

  const [answers, setAnswers] = useState<QuestionAnswers>({});

  const progressWidth =
    currentStep === 0 ? 0 : (currentStep / QUESTIONS.length) * 100;

  const isPhoneValid = isLocalNumber9Digits(phoneValue);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPhoneError(false);

    if (!name.trim()) {
      setError("Перевірте номер (має бути 9 цифр) та заповніть всі поля");
      return;
    }
    if (!city.trim()) {
      setError("Перевірте номер (має бути 9 цифр) та заповніть всі поля");
      return;
    }
    if (!consent) {
      setError("Будь ласка, підтвердіть згоду на обробку даних");
      return;
    }
    if (!isPhoneValid) {
      setError("Перевірте номер (має бути 9 цифр) та заповніть всі поля");
      setPhoneError(true);
      return;
    }
    setCurrentStep(1);
  };

  const handleOptionClick = async (key: keyof QuestionAnswers, value: string) => {
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);
    const nextStep = currentStep + 1;
    if (nextStep > QUESTIONS.length) {
      setLoading(true);
      setSubmitError("");
      try {
        const phonePayload = phoneForSubmitApi(itiInstance, phoneValue);
        const res = await fetch("/api/crm/submit-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            phone: phonePayload,
            city: city.trim(),
            email: email.trim(),
            answers: newAnswers,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          status?: string;
          message?: string;
          status_stage?: string;
          phone?: string;
        };

        if (!res.ok || data.status !== "ok") {
          setSubmitError(
            typeof data.message === "string" && data.message
              ? data.message
              : "Не вдалося надіслати заявку. Спробуйте ще раз."
          );
          setLoading(false);
          return;
        }

        const stage =
          typeof data.status_stage === "string" ? data.status_stage.trim() : "";
        const phoneForUrl =
          typeof data.phone === "string" && data.phone
            ? data.phone
            : onlyDigits(phonePayload);

        if (REDIRECT_TO_BOOKING_STAGES.has(stage)) {
          router.push(`/booking?phone=${encodeURIComponent(phoneForUrl)}`);
          return;
        }

        setLoading(false);
        setSuccess(true);
      } catch {
        setSubmitError("Помилка мережі. Перевірте з'єднання та спробуйте знову.");
        setLoading(false);
      }
    } else {
      setCurrentStep(nextStep);
    }
  };

  if (success) {
    return (
      <div
        className="min-h-screen flex justify-center items-center p-2.5"
        style={{
          background: BG,
          color: "#1e293b",
          fontFamily: "var(--font-inter), 'Inter', sans-serif",
        }}
      >
        <div
          className="w-full max-w-[460px] rounded-[28px] overflow-hidden relative bg-white"
          style={{ boxShadow: "0 15px 40px rgba(0,86,179,0.1)" }}
        >
          <div className="p-5 text-center animate-fade-in-slow">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-5"
              style={{
                background: "#e6f7ef",
                color: "#10b981",
                boxShadow: "0 10px 20px rgba(16,185,129,0.2)",
              }}
            >
              ✓
            </div>
            <div className="text-2xl font-bold mb-4">Заявка прийнята!</div>
            <div className="text-[15px] text-[#64748b] mb-8 leading-relaxed">
              Дякуємо! Ваша заявка успішно надіслана. Натисніть на кнопку нижче,
              щоб написати нам у зручний месенджер.
            </div>
            <p className="text-xs text-[#94a3b8] font-bold mb-4 uppercase">
              Напишіть нам:
            </p>
            <div className="flex gap-2.5 justify-center flex-wrap mb-6">
              <a
                href="https://wa.me/421951854505"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 rounded-xl text-white font-semibold text-sm flex items-center gap-2 min-w-[110px] justify-center transition-[transform_0.2s] hover:opacity-90 hover:-translate-y-0.5"
                style={{ background: "#25D366" }}
              >
                WhatsApp
              </a>
              <a
                href="https://t.me/wfa_chat_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 rounded-xl text-white font-semibold text-sm flex items-center gap-2 min-w-[110px] justify-center transition-[transform_0.2s] hover:opacity-90 hover:-translate-y-0.5"
                style={{ background: "#0088cc" }}
              >
                Telegram
              </a>
              <a
                href="viber://chat?number=421951854505"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 rounded-xl text-white font-semibold text-sm flex items-center gap-2 min-w-[110px] justify-center transition-[transform_0.2s] hover:opacity-90 hover:-translate-y-0.5"
                style={{ background: "#7360f2" }}
              >
                Viber
              </a>
            </div>
            <a
              href="https://www.workforall.sk/"
              className="block w-full py-4 rounded-xl font-semibold text-center transition-colors hover:bg-[#e2e8f0]"
              style={{ background: "#f1f5f9", color: "#475569" }}
            >
              Зрозуміло
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex justify-center items-center p-2.5 box-border"
      style={{
        background: BG,
        color: "#1e293b",
        fontFamily: "var(--font-inter), 'Inter', sans-serif",
      }}
    >
      <div
        className="w-full max-w-[460px] bg-white rounded-[28px] overflow-hidden relative"
        style={{ boxShadow: "0 15px 40px rgba(0,86,179,0.1)" }}
      >
        {!loading && (
          <header className="pt-8 px-5 pb-4 text-center">
            <img
              src="https://i.ibb.co/PvRd3TkP/logo-blue.png"
              alt="Work For All"
              className="w-[180px] mx-auto mb-5 object-contain"
            />
            <h1 className="text-xl font-bold mb-2 leading-snug">
              Анкета для запису на консультацію — Work For All
            </h1>
            <p className="text-sm text-[#64748b] leading-relaxed">
              Будь ласка, заповніть дані. Це займе близько 1 хвилини.
            </p>
          </header>
        )}

        {!loading && (
          <div className="h-1.5 w-full bg-[#e2e8f0]">
            <div
              className="h-full transition-[width_0.5s_ease]"
              style={{ width: `${progressWidth}%`, background: MAIN }}
            />
          </div>
        )}

        <div className="p-6 min-h-[400px] flex flex-col">
          {loading ? (
            <div className="text-center py-16 px-5">
              <div className="w-12 h-12 rounded-full border-4 border-[#f3f3f3] border-t-[#0056b3] mx-auto mb-5 animate-spin" />
              <h3 className="font-semibold text-[#1e293b]">Обробка даних...</h3>
            </div>
          ) : currentStep === 0 ? (
            <form
              onSubmit={handleContinue}
              className="flex flex-col flex-1"
            >
              <div className="mb-4 text-left">
                <label className="text-[13px] font-bold text-[#475569] block mb-2">
                  Прізвище та ім&apos;я
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Олександр Іванов"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-[56px] px-4 border-2 rounded-[14px] text-base transition-colors focus:outline-none focus:border-[#0056b3]"
                  style={{ borderColor: "#e2e8f0", background: "#fcfdfe" }}
                />
              </div>

              <div
                className={`input-group mb-[18px] text-left ${phoneError ? "custom-phone-container-error" : ""}`}
              >
                <label className="text-[13px] font-bold text-[#475569] block mb-2">
                  Номер телефону
                </label>
                <input
                  ref={phoneInputRef}
                  type="tel"
                  autoComplete="tel"
                  className="w-full py-[15px] pr-[15px] border-2 border-[#e2e8f0] rounded-[14px] text-[16px] bg-[#fcfdfe] outline-none focus:border-[#0056b3] transition-colors"
                  style={{ borderColor: "#e2e8f0", background: "#fcfdfe" }}
                />
              </div>

              <div className="mb-4 text-left">
                <label className="text-[13px] font-bold text-[#475569] block mb-2">
                  Місто проживання
                </label>
                <input
                  type="text"
                  autoComplete="address-level2"
                  placeholder="Братислава"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-[56px] px-4 border-2 rounded-[14px] text-base transition-colors focus:outline-none focus:border-[#0056b3]"
                  style={{ borderColor: "#e2e8f0", background: "#fcfdfe" }}
                />
              </div>
              <div className="mb-4 text-left">
                <label className="text-[13px] font-bold text-[#475569] block mb-2">
                  Email (Опціонально)
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="mail@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[56px] px-4 border-2 rounded-[14px] text-base transition-colors focus:outline-none focus:border-[#0056b3]"
                  style={{ borderColor: "#e2e8f0", background: "#fcfdfe" }}
                />
              </div>
              <div className="flex items-start gap-2.5 mb-5">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="w-5 h-5 mt-0.5 flex-shrink-0 cursor-pointer rounded border-gray-300 text-[#0056b3] focus:ring-[#0056b3]"
                />
                <label
                  htmlFor="consent"
                  className="text-xs font-normal text-[#64748b] leading-snug cursor-pointer m-0"
                >
                  Я погоджуюся з{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[#0056b3] underline"
                  >
                    Політикою конфіденційності
                  </a>{" "}
                  та даю згоду na spracovanie osobných údajov (GDPR).
                </label>
              </div>
              {error && (
                <p className="text-red-500 text-[13px] mb-4 text-center">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="w-full py-4 rounded-2xl text-base font-bold text-white mt-auto transition-colors hover:opacity-95"
                style={{ background: MAIN }}
              >
                Продовжити
              </button>
            </form>
          ) : (
            <div className="flex flex-col flex-1 animate-fade-in">
              <h2 className="text-xl font-bold text-[#1e293b] mb-4">
                {QUESTIONS[currentStep - 1].q}
              </h2>
              {submitError && (
                <p className="text-red-500 text-[13px] mb-4 text-center">{submitError}</p>
              )}
              <div className="space-y-2.5">
                {QUESTIONS[currentStep - 1].o.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    disabled={loading}
                    onClick={() => handleOptionClick(QUESTIONS[currentStep - 1].k, opt.value)}
                    className="w-full text-left py-4 px-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 font-semibold text-[15px] bg-white border-[#e2e8f0] hover:border-[#0056b3] hover:bg-[#f0f7ff] hover:-translate-y-0.5 opt-card"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
