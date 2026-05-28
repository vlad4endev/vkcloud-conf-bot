"use client";

import { motion } from "framer-motion";
import { schedule } from "@/lib/scheduleData";
import { ScheduleCard } from "@/components/ui/ScheduleCard";
import { CrossDecor } from "@/components/ui/CrossDecor";

export function ScheduleSection() {
  return (
    <section id="program" className="relative mx-auto max-w-[1320px] px-4 py-20 md:px-8 md:py-28">
      <CrossDecor className="absolute right-6 top-8" />

      <motion.h2
        className="section-title"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65, ease: "easeOut" }}
      >
        Детальная программа
      </motion.h2>

      <p className="mx-auto mt-4 max-w-xl text-center text-sm text-white/50">
        17 июня 2026 · Москва · Loft 8 «Серп и Молот»
      </p>

      <div className="mt-12 space-y-4">
        {schedule.map((item, index) => (
          <ScheduleCard key={item.id} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}
