import { useMemo, useState } from 'react';
import {
  filterByTrack,
  getTagClass,
  trackTabs,
  type ScheduleItem,
  type Speaker,
  type TrackId,
} from '../../data/scheduleData';

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`size-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      className="size-4 shrink-0 text-[#00d1ff]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
}

function speakerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  return parts
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

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
        {isSecret && <span className="mr-1 text-[#00d1ff]" aria-hidden>✦</span>}
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
            <ChevronIcon open={expanded} />
          </button>

          <div
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
              expanded
                ? 'grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="overflow-hidden">
              <p className="pt-3 text-sm leading-relaxed text-[#7b9cc0]">
                {item.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function SpeakerRow({ speaker }: { speaker: Speaker }) {
  const initials = speakerInitials(speaker.name);
  const [showPhoto, setShowPhoto] = useState(Boolean(speaker.avatar));

  return (
    <li className="flex items-center gap-3">
      {showPhoto && speaker.avatar ? (
        <img
          src={speaker.avatar}
          alt=""
          className="size-10 shrink-0 rounded-full border border-[#1e3a5f] object-cover"
          loading="lazy"
          onError={() => setShowPhoto(false)}
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
          <span className="md:hidden">
            <ClockIcon />
          </span>
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
    <section className="w-full text-[#e8edf5]">
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
        className="program-tabs -mx-1 mb-8 flex gap-2 overflow-x-auto px-1 pb-1"
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

      <ul
        key={activeTrack}
        role="tabpanel"
        className="program-track-list relative m-0 list-none p-0"
      >
        {sessions.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-[#1e3a5f] bg-[#111827]/50 px-4 py-10 text-center text-sm text-[#7b9cc0]">
            В этом треке пока нет сессий
          </li>
        ) : (
          sessions.map((item) => <TimelineRow key={item.id} item={item} />)
        )}
      </ul>
    </section>
  );
}
