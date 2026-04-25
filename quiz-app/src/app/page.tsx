"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";

const TOTAL_STEPS = 8;

type FormData = {
  fullName: string;
  phone: string;
  phonePrefix: string;
  city: string;
  email: string;
  goal: string;
  experience: string;
  work: string;
  address: string;
  document: string;
  communication: string;
  finalCta: string;
};

const initialFormData: FormData = {
  fullName: "",
  phone: "",
  phonePrefix: "+421",
  city: "",
  email: "",
  goal: "",
  experience: "",
  work: "",
  address: "",
  document: "",
  communication: "",
  finalCta: "",
};

export default function QuizPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitted, setSubmitted] = useState(false);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleStep2Option = (value: string) => {
    updateField("goal", value);
    nextStep();
  };

  const handleOption = (field: keyof FormData, value: string) => {
    updateField(field, value);
    nextStep();
  };

  const handleFinalSubmit = (value: string) => {
    const finalData = { ...formData, finalCta: value };
    setFormData(finalData);
    console.log(finalData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-lg border border-gray-100 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Дякуємо!</h1>
          <p className="text-gray-600">
            Ваша анкета надіслана. Будь ласка, перейдіть за посиланням для вибору часу.
          </p>
        </div>
      </div>
    );
  }

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress bar */}
      <div className="sticky top-0 z-10 h-1.5 bg-gray-200">
        <div
          className="h-full bg-slate-700 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="mx-auto max-w-xl px-4 py-8 pb-24">
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-6 sm:p-8">
          {/* Step 1: Contact Info */}
          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Контактна інформація
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Прізвище та ім&apos;я
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-600/20"
                    placeholder="Іван Петренко"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Номер телефону
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.phonePrefix}
                      onChange={(e) => updateField("phonePrefix", e.target.value)}
                      className="rounded-xl border border-gray-300 bg-gray-50 px-3 py-3 text-gray-900 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-600/20"
                    >
                      <option value="+421">+421</option>
                      <option value="+380">+380</option>
                    </select>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className="flex-1 rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-600/20"
                      placeholder="912 345 678"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Місто
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-600/20"
                    placeholder="Братислава"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-600/20"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-6 py-3.5 font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2"
                >
                  Далі
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </>
          )}

          {/* Step 2: Goal */}
          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Яка мета вашого звернення?
              </h2>
              <p className="text-gray-500 text-sm mb-6">Оберіть один варіант</p>
              <div className="space-y-3">
                {[
                  "Отримання ВНЖ",
                  "Продовження ВНЖ",
                  "Консультація",
                ].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleStep2Option(option)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-5 py-4 text-left font-medium text-gray-900 transition hover:border-slate-400 hover:bg-gray-50 active:border-slate-600 active:bg-slate-50"
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-start">
                <button
                  type="button"
                  onClick={prevStep}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Назад
                </button>
              </div>
            </>
          )}

          {/* Step 3: Experience */}
          {step === 3 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Чи зверталися ви раніше щодо легалізації?
              </h2>
              <p className="text-gray-500 text-sm mb-6">Оберіть один варіант</p>
              <div className="space-y-3">
                {["Так", "Ні", "Частково", "Зупинився"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleOption("experience", option)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-5 py-4 text-left font-medium text-gray-900 transition hover:border-slate-400 hover:bg-gray-50 active:border-slate-600 active:bg-slate-50"
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-start">
                <button
                  type="button"
                  onClick={prevStep}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Назад
                </button>
              </div>
            </>
          )}

          {/* Step 4: Work */}
          {step === 4 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Чи маєте ви офіційну роботу у Словаччині?
              </h2>
              <p className="text-gray-500 text-sm mb-6">Оберіть один варіант</p>
              <div className="space-y-3">
                {[
                  "Офіційно працюю",
                  "В пошуку",
                  "Наразі не працюю",
                  "Інше",
                ].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleOption("work", option)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-5 py-4 text-left font-medium text-gray-900 transition hover:border-slate-400 hover:bg-gray-50 active:border-slate-600 active:bg-slate-50"
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-start">
                <button
                  type="button"
                  onClick={prevStep}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Назад
                </button>
              </div>
            </>
          )}

          {/* Step 5: Address */}
          {step === 5 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Чи маєте ви офіційну адресу реєстрації?
              </h2>
              <p className="text-gray-500 text-sm mb-6">Оберіть один варіант</p>
              <div className="space-y-3">
                {["Так, є", "Ні", "В процесі", "Не знаю"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleOption("address", option)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-5 py-4 text-left font-medium text-gray-900 transition hover:border-slate-400 hover:bg-gray-50 active:border-slate-600 active:bg-slate-50"
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-start">
                <button
                  type="button"
                  onClick={prevStep}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Назад
                </button>
              </div>
            </>
          )}

          {/* Step 6: Document */}
          {step === 6 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Ваш поточний статус/документ?
              </h2>
              <p className="text-gray-500 text-sm mb-6">Оберіть один варіант</p>
              <div className="space-y-3">
                {[
                  "Тимчасовий захист (odídenec)",
                  "Біометрія (Паспорт)",
                  "ВНЖ іншої країни",
                  "ВНЖ Словаччини",
                ].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleOption("document", option)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-5 py-4 text-left font-medium text-gray-900 transition hover:border-slate-400 hover:bg-gray-50 active:border-slate-600 active:bg-slate-50"
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-start">
                <button
                  type="button"
                  onClick={prevStep}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Назад
                </button>
              </div>
            </>
          )}

          {/* Step 7: Communication */}
          {step === 7 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                По якому каналу зв&apos;язку з вами зв&apos;язатися?
              </h2>
              <p className="text-gray-500 text-sm mb-6">Оберіть один варіант</p>
              <div className="space-y-3">
                {["WhatsApp", "Viber", "Telegram", "Дзвінок"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleOption("communication", option)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-5 py-4 text-left font-medium text-gray-900 transition hover:border-slate-400 hover:bg-gray-50 active:border-slate-600 active:bg-slate-50"
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-start">
                <button
                  type="button"
                  onClick={prevStep}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Назад
                </button>
              </div>
            </>
          )}

          {/* Step 8: Final CTA */}
          {step === 8 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Будь ласка, після заповнення анкети перейдіть за посиланням для
                вибору часу.
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Оберіть один варіант для підтвердження
              </p>
              <div className="space-y-3">
                {["Так", "Обов'язково перейду"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleFinalSubmit(option)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-5 py-4 text-left font-medium text-gray-900 transition hover:border-slate-400 hover:bg-gray-50 active:border-slate-600 active:bg-slate-50"
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-start">
                <button
                  type="button"
                  onClick={prevStep}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Назад
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
