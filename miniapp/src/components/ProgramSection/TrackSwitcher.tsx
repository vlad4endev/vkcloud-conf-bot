import type { SessionTrack } from '../../lib/scheduleTrack';
import { PARALLEL_TRACK_TABS } from '../../lib/scheduleTrack';

type ParallelTrack = Exclude<SessionTrack, 'all'>;

type TrackSwitcherProps = {
  activeTrack: ParallelTrack;
  onChange: (track: ParallelTrack) => void;
};

export default function TrackSwitcher({ activeTrack, onChange }: TrackSwitcherProps) {
  return (
    <div className="mt-10 text-center">
      <h3 className="text-xl font-bold text-white sm:text-2xl">Выберите трек</h3>

      <div
        className="mt-6 border-b border-[#2a3548]"
        role="tablist"
        aria-label="Треки конференции"
      >
        <div className="mx-auto flex max-w-lg">
          {PARALLEL_TRACK_TABS.map((tab) => {
            const isActive = activeTrack === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(tab.id)}
                className={`relative flex-1 px-2 pb-3 text-sm font-medium transition-colors sm:text-base ${
                  isActive ? 'text-white' : 'text-[#6b7a94] hover:text-[#9aa8bc]'
                }`}
              >
                {tab.label}
                <span
                  className={`absolute bottom-0 left-0 right-0 rounded-full transition-all ${
                    isActive
                      ? 'h-[3px] bg-[#007bff]'
                      : 'h-px bg-transparent'
                  }`}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
