"use client";

import { motion } from "framer-motion";
import type { ScheduleItem } from "@/lib/scheduleData";
import { BadgePill } from "./BadgePill";
import { SpeakerInfo } from "./SpeakerInfo";

export function ScheduleCard({
  item,
  index,
}: {
  item: ScheduleItem;
  index: number;
}) {
  const hasSpeaker = Boolean(item.speaker);
  const cardClass = hasSpeaker
    ? "schedule-card schedule-card--speaker"
    : "schedule-card";

  return (
    <motion.article
      className={cardClass}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.55,
        delay: index * 0.07,
        ease: "easeOut",
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <BadgePill label={item.time} type="time" />
        {item.badges?.map((badge) => (
          <BadgePill key={badge.label} label={badge.label} type={badge.type} />
        ))}
      </div>

      <h3
        className={`card-title mt-5 ${hasSpeaker ? "text-2xl md:text-[26px]" : "text-xl md:text-[22px]"}`}
      >
        {item.title}
      </h3>

      {item.speaker && <SpeakerInfo speaker={item.speaker} />}

      {item.description && (
        <p className="body-text mt-5">{item.description}</p>
      )}

      {item.bullets && item.bullets.length > 0 && (
        <div className="mt-4">
          <p className="text-[13px] text-white/45">В докладе:</p>
          <ul className="mt-2 space-y-2">
            {item.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3">
                <span
                  className="mt-2 h-1 w-1 shrink-0 bg-[#1e6dff]/80"
                  style={{ minWidth: 4, minHeight: 4 }}
                />
                <span className="text-[15px] text-white/78">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.article>
  );
}
