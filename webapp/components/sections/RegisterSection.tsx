"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

export function RegisterSection() {
  return (
    <section
      id="register"
      className="mx-auto max-w-[1320px] px-4 py-20 md:px-8 md:py-28"
    >
      <motion.div
        className="relative overflow-hidden rounded-3xl border border-[#1e6dff]/25 bg-[#0f1117] p-8 md:p-14"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65 }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(30,109,255,0.2),transparent_55%)]" />

        <div className="relative z-10 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-[family-name:var(--font-unbounded)] text-3xl font-extrabold leading-tight text-white md:text-4xl">
              Проектируем будущее вместе
            </h2>
            <p className="body-text mt-4">
              Зарегистрируйтесь на VK Cloud Conf&apos;26 — 17 июня, Москва.
              Количество мест ограничено.
            </p>
            <div className="mt-6 flex items-center gap-1 text-[#1e6dff]">
              {Array.from({ length: 6 }).map((_, i) => (
                <ChevronRight key={i} className="h-5 w-5 opacity-80" />
              ))}
            </div>
          </div>

          <div className="flex flex-col items-start justify-center space-y-4 rounded-2xl border border-white/8 bg-black/20 p-6 md:p-8">
            <span className="rounded-lg bg-[#1E6DFF] px-10 py-3.5 text-sm font-semibold text-white md:inline-block">
              Зарегистрироваться на конференцию
            </span>
            <p className="text-xs text-white/35">
              Нажимая кнопку, вы соглашаетесь с политикой обработки персональных
              данных.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
