import { useMemo, useState } from 'react';
import {
  filterByTrack,
  getTagStyleKey,
  trackTabs,
  type ScheduleItem,
  type Speaker,
  type TrackId,
} from '../../data/scheduleData';
import styles from './ProgramSection.module.css';

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
      width="16"
      height="16"
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
      className={`${styles.clockIcon} ${styles.clockIconMobile}`}
      width="16"
      height="16"
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
    <article className={styles.card}>
      <div className={styles.tags}>
        {item.tags.map((tag) => (
          <span
            key={tag}
            className={`${styles.tag} ${styles[getTagStyleKey(tag)]}`}
          >
            {tag}
          </span>
        ))}
      </div>

      <h3 className={styles.cardTitle}>
        {isSecret && (
          <span className={styles.secretMark} aria-hidden>
            ✦
          </span>
        )}
        {item.title}
      </h3>

      {item.speakers.length > 0 && (
        <ul className={styles.speakers}>
          {item.speakers.map((speaker) => (
            <SpeakerRow key={speaker.name} speaker={speaker} />
          ))}
        </ul>
      )}

      {hasDescription && (
        <div className={styles.moreWrap}>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={styles.moreBtn}
            aria-expanded={expanded}
          >
            Подробнее
            <ChevronIcon open={expanded} />
          </button>

          <div
            className={`${styles.descWrap} ${
              expanded ? styles.descWrapOpen : styles.descWrapClosed
            }`}
          >
            <div className={styles.descInner}>
              <p className={styles.desc}>{item.description}</p>
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
    <li className={styles.speaker}>
      {showPhoto && speaker.avatar ? (
        <img
          src={speaker.avatar}
          alt=""
          className={styles.avatar}
          loading="lazy"
          onError={() => setShowPhoto(false)}
        />
      ) : (
        <span className={styles.avatarFallback} aria-hidden>
          {initials}
        </span>
      )}
      <div className={styles.speakerInfo}>
        <p className={styles.speakerName}>{speaker.name}</p>
        <p className={styles.speakerMeta}>
          {speaker.role}
          {speaker.company ? ` · ${speaker.company}` : ''}
        </p>
      </div>
    </li>
  );
}

function TimelineRow({ item }: { item: ScheduleItem }) {
  return (
    <li className={styles.timelineRow}>
      <div className={styles.timeCol}>
        <ClockIcon />
        <time dateTime={`2026-06-17T${item.time}`} className={styles.time}>
          {item.time}
        </time>
        <span className={styles.timeEnd}>{item.endTime}</span>
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
    <section className={styles.section}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>VK Cloud Conf 2026 · 17 июня</p>
        <h2 className={styles.title}>Детальная программа</h2>
        <p className={styles.subtitle}>
          20+ докладов в технологическом и бизнес-треках. Выберите зал, чтобы
          увидеть расписание.
        </p>
      </header>

      <div className={styles.tabs} role="tablist" aria-label="Треки конференции">
        {trackTabs.map((tab) => {
          const isActive = activeTrack === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTrack(tab.id)}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            >
              <span className={styles.tabLabelFull}>{tab.label}</span>
              <span className={styles.tabLabelShort}>{tab.shortLabel}</span>
            </button>
          );
        })}
      </div>

      <ul key={activeTrack} role="tabpanel" className={styles.list}>
        {sessions.length === 0 ? (
          <li className={styles.empty}>В этом треке пока нет сессий</li>
        ) : (
          sessions.map((item) => <TimelineRow key={item.id} item={item} />)
        )}
      </ul>
    </section>
  );
}
