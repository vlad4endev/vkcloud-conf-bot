"use client";

import { ExternalLink, Menu, X } from "lucide-react";
import { useState } from "react";
import { VkLogo } from "@/components/ui/VkLogo";

const NAV_LINKS = [
  "Продукты",
  "Калькулятор цен",
  "Кейсы",
  "Платформа",
  "Решения",
  "Компания",
  "Блог",
  "Документация",
  "Партнёрство",
  "Акции",
];

const PAGE_ANCHORS = [
  { label: "Почему прийти", href: "#why" },
  { label: "Для кого", href: "#for-whom" },
  { label: "Программа", href: "#program" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[100] border-b border-white/[0.08] bg-black/92 backdrop-blur-[16px] backdrop-saturate-[180%]">
      <div className="mx-auto max-w-[1320px] px-4 md:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <VkLogo size={28} />
            <span className="font-[family-name:var(--font-unbounded)] text-sm font-semibold text-white">
              tech
            </span>
            <span className="hidden h-4 w-px bg-white/20 sm:block" />
            <span className="hidden truncate text-sm text-white/70 sm:block">
              VK Cloud
            </span>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <span className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.07] px-4 py-2 text-sm text-white">
              Получить консультацию
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </span>
            <span className="px-4 py-2 text-sm text-white/85">Вход</span>
            <a
              href="#register"
              className="rounded-lg bg-[#1E6DFF] px-5 py-2 text-sm font-semibold text-white no-underline transition hover:bg-[#3D82FF]"
            >
              Регистрация
            </a>
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-white md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <nav className="hidden border-t border-white/[0.06] py-0 md:block">
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
            {PAGE_ANCHORS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm text-white/70 transition hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
            {NAV_LINKS.map((link) => (
              <li key={link}>
                <span className="cursor-default text-sm text-white/70">
                  {link}
                </span>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/[0.06] bg-black/95 px-4 py-4 md:hidden">
          <ul className="mb-4 space-y-3">
            {PAGE_ANCHORS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block text-sm text-white/70"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2">
            <span className="flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.07] px-4 py-2.5 text-sm text-white">
              Получить консультацию
              <ExternalLink className="h-3.5 w-3.5" />
            </span>
            <span className="px-4 py-2.5 text-sm text-white/85">Вход</span>
            <a
              href="#register"
              className="rounded-lg bg-[#1E6DFF] px-4 py-2.5 text-center text-sm font-semibold text-white no-underline"
              onClick={() => setMobileOpen(false)}
            >
              Регистрация
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
