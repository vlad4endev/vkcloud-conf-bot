import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Clock, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  filterByTrack,
  getTagClass,
  trackTabs,
  type ScheduleItem,
  type Speaker,
  type TrackId,
} from '../../data/scheduleData';

function SessionCard({ item }: { item: ScheduleItem }) {
  const [expanded, setExpanded] = useState(false);
  const hasDescription = item.description.length > 0;
  const isSecret = item.kind === 'secret';

  return (
    <article className="group rounded-2xl border border-[#1e3a5f]/80 bg-[#111827]/90 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#005ff9]/50 hover:shadow-[0_12px_40px_-12px_rgba(0,95,249,0.35)] sm:p-5">
      <div className="mb-3 flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <span
            key={tag}
            className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${getTagClass(tag)}`}
          >
            {tag}
          </span>
        ))}
      </div>

      <h3 className="text-lg font-bold leading-snug text-white sm:text-xl">
        {isSecret && (
          <Sparkles
            className="mr-1.5 inline-block size-4 text-[#00d1ff]"
            aria-hidden
          />
        )}
        {item.title}
      </h3>

      {item.speakers.length > 0 && (
        <ul className="mt-4 flex flex-col gap-3">
          {item.speakers.map((speaker) => (
            <SpeakerRow key={speaker.name} speaker={speaker} />
          ))}
        </ul>
      )}

      {hasDescription && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#00d1ff] transition-colors hover:text-[#5eb0ff]"
            aria-expanded={expanded}
          >
            Подробнее
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              className="inline-flex"
            >
              <ChevronDown className="size-4" aria-hidden />
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="description"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <p className="pt-3 text-sm leading-relaxed text-[#7b9cc0]">
                  {item.description}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </article>
  );
}

function SpeakerRow({ speaker }: { speaker: Speaker }) {
  const initials = speaker.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <li className="flex items-center gap-3">
      {speaker.avatar ? (
        <img
          src={speaker.avatar}
          alt=""
          className="size-10 shrink-0 rounded-full border border-[#1e3a5f] object-cover"
          loading="lazy"
        />
      ) : (
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#1e3a5f] bg-[#1c2539] text-xs font-semibold text-[#00d1ff]"
          aria-hidden
        >
          {initials}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">
          {speaker.name}
        </p>
        <p className="truncate text-xs text-[#7b9cc0]">
          {speaker.role}
          {speaker.company ? ` · ${speaker.company}` : ''}
        </p>
      </div>
    </li>
  );
}

function TimelineRow({ item }: { item: ScheduleItem }) {
  return (
    <li className="relative grid grid-cols-1 gap-3 pb-8 last:pb-0 md:grid-cols-[88px_1fr] md:gap-6">
      <div className="md:sticky md:top-4 md:self-start">
        <div className="flex items-center gap-2 md:flex-col md:items-start md:gap-1">
          <Clock className="size-4 shrink-0 text-[#00d1ff] md:hidden" aria-hidden />
          <time
            dateTime={`2026-06-17T${item.time}`}
            className="font-mono text-2xl font-bold tracking-tight text-[#00d1ff] sm:text-3xl"
          >
            {item.time}
          </time>
          <span className="font-mono text-xs text-[#7b9cc0]">
            {item.endTime}
          </span>
        </div>
      </div>
      <SessionCard item={item} />
    </li>
  );
}

export default function ProgramSection() {
  const [activeTrack, setActiveTrack] = useState<TrackId>('all');

  const sessions = useMemo(
    () => filterByTrack(activeTrack),
    [activeTrack],
  );

  return (
    <section className="w-full font-[Inter,system-ui,sans-serif]">
      <header className="mb-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#00d1ff]">
          VK Cloud Conf 2026 · 17 июня
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Детальная программа
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#7b9cc0]">
          20+ докладов в технологическом и бизнес-треках. Выберите зал, чтобы
          увидеть расписание.
        </p>
      </header>

      <div
        className="hide-scrollbar -mx-1 mb-8 flex gap-2 overflow-x-auto px-1 pb-1"
        role="tablist"
        aria-label="Треки конференции"
      >
        {trackTabs.map((tab) => {
          const isActive = activeTrack === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTrack(tab.id)}
              className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'border-[#005ff9] bg-[#005ff9] text-white shadow-[0_4px_20px_-4px_rgba(0,95,249,0.6)]'
                  : 'border-[#1e3a5f] bg-[#111827] text-[#7b9cc0] hover:border-[#005ff9]/60 hover:text-white'
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.ul
          key={activeTrack}
          role="tabpanel"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="relative m-0 list-none p-0"
        >
          {sessions.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-[#1e3a5f] bg-[#111827]/50 px-4 py-10 text-center text-sm text-[#7b9cc0]">
              В этом треке пока нет сессий
            </li>
          ) : (
            sessions.map((item) => <TimelineRow key={item.id} item={item} />)
          )}
        </motion.ul>
      </AnimatePresence>

      <style>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
