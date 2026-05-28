"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { CrossDecor } from "@/components/ui/CrossDecor";
import { LaserLine } from "@/components/ui/LaserLine";

const STATS = [
  {
    value: 1000,
    suffix: "+",
    label: "участников",
    caption: "Самая масштабная отраслевая конференция",
    numeric: true,
  },
  {
    value: 20,
    suffix: "+",
    label: "докладов",
    caption:
      "От экспертов отрасли. В двух треках: технологии и бизнес-кейсы",
    numeric: true,
  },
  {
    label: "Презентация исследования",
    caption: "Рынка ИИ России и прогноз развития на 2026–2030",
    numeric: false,
  },
  {
    label: "Кейсы крупных компаний",
    caption:
      "Наши партнёры из ритейла, финтеха и промышленности",
    numeric: false,
  },
  {
    label: "Нетворкинг и афтерпати",
    caption: "Фуршет, диджей, развлекательная программа",
    numeric: false,
  },
] as const;

function StatHeadline({
  stat,
}: {
  stat: (typeof STATS)[number];
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView || !stat.numeric || !("value" in stat)) return;
    const duration = 1500;
    const target = stat.value;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, stat]);

  const className =
    "font-[family-name:var(--font-unbounded)] text-xl font-bold leading-snug text-white md:text-[22px]";

  if (!stat.numeric) {
    return (
      <p ref={ref} className={className}>
        {stat.label}
      </p>
    );
  }

  return (
    <p ref={ref} className={className}>
      {display}
      {stat.suffix} {stat.label}
    </p>
  );
}

export function WhyAttendSection() {
  return (
    <section id="why" className="relative mx-auto max-w-[1320px] px-4 py-20 md:px-8 md:py-28">
      <CrossDecor className="absolute left-8 top-12" />
      <CrossDecor className="absolute right-12 top-32" />

      <motion.h2
        className="section-title"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65, ease: "easeOut" }}
      >
        Почему вы должны прийти:
      </motion.h2>

      <LaserLine />

      <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5 lg:gap-0">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            className={`relative px-4 py-2 ${
              i > 0
                ? "lg:border-l lg:border-white/15"
                : ""
            } ${i === 4 ? "col-span-2 mx-auto max-w-xs lg:col-span-1 lg:mx-0" : ""}`}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
          >
            <div className="mb-4 hidden h-10 w-px bg-white/15 lg:block" />
            <StatHeadline stat={stat} />
            <p className="mt-2 max-w-[160px] text-sm leading-snug text-white/55">
              {stat.caption}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
