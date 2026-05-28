"use client";

import { motion } from "framer-motion";
import { ParticleField } from "@/components/canvas/ParticleField";

const TAGS = [
  "Генеральные директора",
  "Технические и операционные директора",
  "ИТ директора",
  "Руководители цифровой трансформации",
  "Директора по данным и инфраструктуре",
  "ИБ-специалисты",
  "Дата-инженеры",
  "Аналитики данных",
];

export function ForWhomSection() {
  return (
    <section id="for-whom" className="py-16 md:py-24">
      <motion.div
        className="for-whom-card relative mx-auto max-w-[1240px]"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65, ease: "easeOut" }}
      >
        <ParticleField side="left" />
        <ParticleField side="right" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="mb-12 font-[family-name:var(--font-unbounded)] text-3xl font-extrabold text-white md:text-[42px]">
            Для кого
          </h2>

          <div className="flex flex-wrap justify-center gap-3">
            {TAGS.map((tag, i) => (
              <motion.span
                key={tag}
                className="rounded-full border border-white/18 bg-white/5 px-6 py-3 text-base text-white backdrop-blur-sm transition hover:border-[#1e6dff]/50 hover:bg-[#1e6dff]/15"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                {tag}
              </motion.span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
