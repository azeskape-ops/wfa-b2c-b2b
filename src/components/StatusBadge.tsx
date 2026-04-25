"use client";

const STATUS_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  "Таргет": { backgroundColor: "#28A745", color: "white" },
  "Таргет обнова": { backgroundColor: "#B75412", color: "white" },
  "Теплый": { backgroundColor: "#FFC107", color: "black" },
  "Тёплый": { backgroundColor: "#FFC107", color: "black" },
  "Поки що не для нас": { backgroundColor: "#D80F22", color: "white" },
  "Повідомлення": { backgroundColor: "#FD7E14", color: "white" },
  "Поведомление": { backgroundColor: "#FD7E14", color: "white" },
};

const DEFAULT_STYLE = { backgroundColor: "#6c757d", color: "white" };

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? DEFAULT_STYLE;
  return (
    <span
      className="px-3 py-1 rounded-full text-sm font-medium inline-block"
      style={{ backgroundColor: style.backgroundColor, color: style.color }}
    >
      {status || "—"}
    </span>
  );
}
