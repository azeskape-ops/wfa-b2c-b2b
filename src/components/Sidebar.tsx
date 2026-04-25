"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StatusBadge } from "./StatusBadge";

const STATUS_LABELS = [
  "Таргет",
  "Таргет обнова",
  "Теплый",
  "Поки що не для нас",
  "Повідомлення",
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <Link href="/" className="text-lg font-bold text-gray-900">
          CRM
        </Link>
      </div>
      <nav className="p-4 space-y-1">
        <Link
          href="/leads"
          className={`block px-3 py-2 rounded-lg text-sm font-medium ${
            pathname === "/leads" || pathname?.startsWith("/leads")
              ? "bg-[#201A8E] text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          Ліди
        </Link>
      </nav>
      <div className="mt-4 px-4 pt-4 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Статуси
        </p>
        <div className="flex flex-wrap gap-2">
          {STATUS_LABELS.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      </div>
    </aside>
  );
}
