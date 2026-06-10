import type { SessionTrack } from '../../lib/scheduleTrack';
import { PARALLEL_TRACKS } from '../../lib/scheduleTrack';

type ParallelTrack = Exclude<SessionTrack, 'all'>;

type TrackSwitcherProps = {
  activeTrack: ParallelTrack;
  onChange: (track: ParallelTrack) => void;
};

export default function TrackSwitcher({ activeTrack, onChange }: TrackSwitcherProps) {
  return (
    <div className="mt-10 text-center">
      <h3 className="text-base font-semibold text-white/80 sm:text-lg">Выберите трек</h3>

      <div
        className="mt-4 border-b border-white/12"
        role="tablist"
        aria-label="Треки конференции"
      >
        <div className="mx-auto inline-flex max-w-full">
          {PARALLEL_TRACKS.map((tab) => {
            const isActive = activeTrack === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`${tab.title}, ${tab.hall}`}
                onClick={() => onChange(tab.id)}
                className={`relative min-w-[9.5rem] px-4 pb-3 transition-colors sm:min-w-[11rem] sm:px-6 ${
                  isActive ? 'text-white' : 'text-white/45 hover:text-white/70'
                }`}
              >
                <span className="flex flex-col items-center gap-0.5">
                  <span
                    className={`text-sm leading-tight sm:text-base ${
                      isActive ? 'font-semibold' : 'font-medium'
                    }`}
                  >
                    {tab.title}
                  </span>
                  <span
                    className={`text-[11px] leading-tight sm:text-xs ${
                      isActive ? 'text-white/55' : 'text-white/35'
                    }`}
                  >
                    {tab.hall}
                  </span>
                </span>
                <span
                  className={`absolute bottom-0 left-3 right-3 rounded-full transition-all sm:left-4 sm:right-4 ${
                    isActive ? 'h-[2px] bg-[#0077ff]' : 'h-px bg-transparent'
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
