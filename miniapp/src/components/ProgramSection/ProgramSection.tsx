import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Clock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getSchedule, type ScheduleSession, type SessionTrack } from '../../api/client';
import { formatScheduleTime } from '../../lib/scheduleFormat';
import TrackSwitcher from './TrackSwitcher';

type ProgramItem = {
  id: string;
  time: string;
  endTime: string;
  title: string;
  description: string;
  location: string | null;
  track: SessionTrack;
  speakers: Array<{ id: string; name: string; profession?: string; avatar?: string }>;
};

type ParallelTrack = Exclude<SessionTrack, 'all'>;

function mapSession(session: ScheduleSession): ProgramItem {
  return {
    id: session.id,
    time: formatScheduleTime(session.startTime),
    endTime: formatScheduleTime(session.endTime),
    title: session.title,
    description: session.description ?? '',
    location: session.location,
    track: session.track ?? 'all',
    speakers: (session.speakers ?? []).map((speaker) => ({
      id: speaker.id,
      name: speaker.name,
      profession: speaker.profession ?? undefined,
      avatar: speaker.photoUrl ?? undefined,
    })),
  };
}

function SessionCard({ item }: { item: ProgramItem }) {
  const [expanded, setExpanded] = useState(false);
  const hasDescription = item.description.length > 0;

  return (
    <article className="group rounded-2xl border border-[#1e3a5f]/80 bg-[#111827]/90 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#005ff9]/50 hover:shadow-[0_12px_40px_-12px_rgba(0,95,249,0.35)] sm:p-5">
      <h3 className="text-lg font-bold leading-snug text-white sm:text-xl">
        {item.title}
      </h3>

      {item.location ? (
        <p className="mt-2 text-sm text-[#7b9cc0]">{item.location}</p>
      ) : null}

      {item.speakers.length > 0 && (
        <ul className="mt-4 flex flex-col gap-3">
          {item.speakers.map((speaker) => (
            <SpeakerRow key={speaker.id} speaker={speaker} />
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

function SpeakerRow({
  speaker,
}: {
  speaker: { name: string; profession?: string; avatar?: string };
}) {
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
        <p className="truncate text-sm font-semibold text-white">{speaker.name}</p>
        {speaker.profession ? (
          <p className="truncate text-xs text-[#7b9cc0]">{speaker.profession}</p>
        ) : null}
      </div>
    </li>
  );
}

function TimelineRow({ item }: { item: ProgramItem }) {
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
          <span className="font-mono text-xs text-[#7b9cc0]">{item.endTime}</span>
        </div>
      </div>
      <SessionCard item={item} />
    </li>
  );
}

function TimelineList({
  items,
  emptyMessage = 'Сессий в этом треке пока нет',
  hideWhenEmpty = false,
}: {
  items: ProgramItem[];
  emptyMessage?: string;
  hideWhenEmpty?: boolean;
}) {
  if (items.length === 0) {
    if (hideWhenEmpty) return null;
    return (
      <p className="rounded-2xl border border-dashed border-[#1e3a5f] bg-[#111827]/50 px-4 py-10 text-center text-sm text-[#7b9cc0]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="relative m-0 mt-6 list-none p-0">
      {items.map((item) => (
        <TimelineRow key={item.id} item={item} />
      ))}
    </ul>
  );
}

export default function ProgramSection() {
  const [sessions, setSessions] = useState<ScheduleSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTrack, setActiveTrack] = useState<ParallelTrack>('tech');

  useEffect(() => {
    let cancelled = false;

    void getSchedule()
      .then((data) => {
        if (!cancelled) {
          setSessions(data);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Не удалось загрузить программу. Попробуйте позже.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const programItems = useMemo(() => sessions.map(mapSession), [sessions]);

  const generalItems = useMemo(
    () => programItems.filter((item) => item.track === 'all'),
    [programItems],
  );

  const trackItems = useMemo(
    () => programItems.filter((item) => item.track === activeTrack),
    [programItems, activeTrack],
  );

  const isEmpty = !loading && !error && programItems.length === 0;

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
          Актуальное расписание конференции. Обновляется из админ-панели.
        </p>
      </header>

      {loading ? (
        <p className="py-10 text-center text-sm text-[#7b9cc0]">Загрузка программы…</p>
      ) : error ? (
        <p className="rounded-2xl border border-dashed border-red-900/60 bg-red-950/30 px-4 py-10 text-center text-sm text-red-300">
          {error}
        </p>
      ) : isEmpty ? (
        <p className="rounded-2xl border border-dashed border-[#1e3a5f] bg-[#111827]/50 px-4 py-10 text-center text-sm text-[#7b9cc0]">
          Программа скоро появится
        </p>
      ) : (
        <>
          <TimelineList items={generalItems} hideWhenEmpty />

          <div role="tabpanel">
            <TrackSwitcher activeTrack={activeTrack} onChange={setActiveTrack} />
            <TimelineList items={trackItems} />
          </div>
        </>
      )}
    </section>
  );
}
