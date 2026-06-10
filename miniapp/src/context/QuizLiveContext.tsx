import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getQuizLive, type QuizLiveState } from '../api/client';
import { parseQuizLiveState } from '../../../src/shared/quizLiveState';

const FALLBACK_POLL_INITIAL_MS = 3_000;
const FALLBACK_POLL_MAX_MS = 60_000;
const FALLBACK_JITTER_MS = 3_000;
const SCHEDULE_BUFFER_MS = 200;
const VISIBILITY_REFRESH_DEBOUNCE_MS = 10_000;

type QuizLiveContextValue = {
  liveState: QuizLiveState | null;
  quizVisible: boolean;
  refreshLiveState: () => Promise<void>;
};

const QuizLiveContext = createContext<QuizLiveContextValue | null>(null);

function applyLiveState(
  current: QuizLiveState | null,
  next: QuizLiveState,
): QuizLiveState {
  if (!current || current.revision !== next.revision) {
    return next;
  }
  if (
    current.sectionVisible !== next.sectionVisible ||
    current.questionsCount !== next.questionsCount ||
    current.awaitingSchedule !== next.awaitingSchedule ||
    current.startsAtMs !== next.startsAtMs
  ) {
    return next;
  }
  return current;
}

export function QuizLiveProvider({ children }: { children: ReactNode }) {
  const [liveState, setLiveState] = useState<QuizLiveState | null>(null);
  const liveStateRef = useRef<QuizLiveState | null>(null);
  const scheduleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastVisibilityRefreshRef = useRef(0);

  const refreshLiveState = useCallback(async () => {
    try {
      const next = await getQuizLive();
      setLiveState((current) => {
        const merged = applyLiveState(current, next);
        liveStateRef.current = merged;
        return merged;
      });
    } catch {
      setLiveState((current) => {
        if (current) {
          return current;
        }
        const fallback: QuizLiveState = {
          revision: 'offline',
          sectionVisible: true,
          questionsCount: 0,
          awaitingSchedule: false,
          startsAtMs: null,
        };
        liveStateRef.current = fallback;
        return fallback;
      });
    }
  }, []);

  const handleIncomingState = useCallback((next: QuizLiveState) => {
    setLiveState((current) => {
      const merged = applyLiveState(current, next);
      liveStateRef.current = merged;
      return merged;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    let eventSource: EventSource | null = null;
    let fallbackTimer: number | null = null;
    let fallbackDelayMs = FALLBACK_POLL_INITIAL_MS;
    let reconnectTimer: number | null = null;

    const clearFallback = () => {
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
    };

    const scheduleFallbackPoll = () => {
      if (cancelled || fallbackTimer) {
        return;
      }

      fallbackTimer = window.setTimeout(() => {
        fallbackTimer = null;
        if (cancelled) {
          return;
        }

        void refreshLiveState().finally(() => {
          if (cancelled) {
            return;
          }
          fallbackDelayMs = Math.min(fallbackDelayMs * 2, FALLBACK_POLL_MAX_MS);
          scheduleFallbackPoll();
        });
      }, fallbackDelayMs);
    };

    const startFallbackPolling = () => {
      if (cancelled) {
        return;
      }

      clearFallback();
      fallbackDelayMs = FALLBACK_POLL_INITIAL_MS;
      const jitter = Math.floor(Math.random() * FALLBACK_JITTER_MS);
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        if (cancelled) {
          return;
        }
        void refreshLiveState().finally(() => {
          scheduleFallbackPoll();
        });
      }, jitter);
    };

    const connect = () => {
      if (cancelled || typeof EventSource === 'undefined') {
        startFallbackPolling();
        return;
      }

      eventSource = new EventSource('/api/quiz/events');

      eventSource.onopen = () => {
        clearFallback();
        fallbackDelayMs = FALLBACK_POLL_INITIAL_MS;
      };

      eventSource.onmessage = (event) => {
        const parsed = parseQuizLiveState(event.data);
        if (parsed) {
          handleIncomingState(parsed);
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        startFallbackPolling();
      };
    };

    void refreshLiveState();
    connect();

    return () => {
      cancelled = true;
      eventSource?.close();
      clearFallback();
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
    };
  }, [handleIncomingState, refreshLiveState]);

  useEffect(() => {
    if (scheduleTimerRef.current) {
      clearTimeout(scheduleTimerRef.current);
      scheduleTimerRef.current = null;
    }

    const startsAtMs = liveState?.startsAtMs;
    if (!startsAtMs || liveState?.sectionVisible) {
      return;
    }

    const delay = startsAtMs - Date.now() + SCHEDULE_BUFFER_MS;
    if (delay <= 0 || delay > 24 * 60 * 60 * 1000) {
      return;
    }

    scheduleTimerRef.current = setTimeout(() => {
      void refreshLiveState();
    }, delay);

    return () => {
      if (scheduleTimerRef.current) {
        clearTimeout(scheduleTimerRef.current);
        scheduleTimerRef.current = null;
      }
    };
  }, [liveState?.sectionVisible, liveState?.startsAtMs, refreshLiveState]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      const now = Date.now();
      if (now - lastVisibilityRefreshRef.current < VISIBILITY_REFRESH_DEBOUNCE_MS) {
        return;
      }

      lastVisibilityRefreshRef.current = now;
      void refreshLiveState();
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refreshLiveState]);

  const quizVisible = liveState?.sectionVisible ?? true;

  return (
    <QuizLiveContext.Provider value={{ liveState, quizVisible, refreshLiveState }}>
      {children}
    </QuizLiveContext.Provider>
  );
}

export function useQuizLive(): QuizLiveContextValue {
  const value = useContext(QuizLiveContext);
  if (!value) {
    throw new Error('useQuizLive must be used within QuizLiveProvider');
  }
  return value;
}
