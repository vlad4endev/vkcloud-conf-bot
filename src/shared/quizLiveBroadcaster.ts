import type { QuizLiveState } from './quizLiveState';
import { serializeQuizLiveState } from './quizLiveState';

export const QUIZ_LIVE_POLL_MS = 5_000;

type FetchLiveStateFn = (nowMs?: number) => Promise<QuizLiveState>;

async function defaultFetchQuizLiveState(nowMs?: number): Promise<QuizLiveState> {
  const { fetchQuizLiveStateFromDb } = await import('./quizLiveState.server');
  return fetchQuizLiveStateFromDb(nowMs);
}

type SseSubscriber = {
  id: number;
  write: (chunk: string) => void;
};

let nextSubscriberId = 1;
const subscribers = new Map<number, SseSubscriber>();
let cachedState: QuizLiveState | null = null;
let cachedPayload = '';
let pollTimer: ReturnType<typeof setInterval> | null = null;
let refreshInFlight: Promise<void> | null = null;
let forceBroadcast = false;
let fetchLiveStateImpl: FetchLiveStateFn = defaultFetchQuizLiveState;

export function startQuizLiveBroadcaster(): void {
  if (pollTimer) {
    return;
  }

  void refreshQuizLiveState();
  pollTimer = setInterval(() => {
    void refreshQuizLiveState();
  }, QUIZ_LIVE_POLL_MS);
}

export function subscribe(write: (chunk: string) => void): () => void {
  const id = nextSubscriberId++;
  subscribers.set(id, { id, write });

  if (cachedPayload) {
    write(`data: ${cachedPayload}\n\n`);
  }

  return () => {
    subscribers.delete(id);
  };
}

export function getCachedQuizLiveState(): QuizLiveState | null {
  return cachedState;
}

export async function getQuizLiveState(): Promise<QuizLiveState> {
  if (cachedState) {
    return cachedState;
  }

  await refreshQuizLiveState();
  if (!cachedState) {
    return fetchLiveStateImpl();
  }

  return cachedState;
}

export function invalidateQuizLiveCache(): void {
  forceBroadcast = true;
  void refreshQuizLiveState();
}

export async function refreshQuizLiveState(): Promise<void> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      const state = await fetchLiveStateImpl();
      const payload = serializeQuizLiveState(state);
      const changed = payload !== cachedPayload || forceBroadcast;
      cachedState = state;
      cachedPayload = payload;
      forceBroadcast = false;

      if (changed) {
        const message = `data: ${payload}\n\n`;
        for (const subscriber of subscribers.values()) {
          try {
            subscriber.write(message);
          } catch {
            subscribers.delete(subscriber.id);
          }
        }
      }
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export function setQuizLiveStateFetcherForTests(impl: FetchLiveStateFn): void {
  fetchLiveStateImpl = impl;
}

/** Test helper */
export function resetQuizLiveBroadcasterForTests(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }

  subscribers.clear();
  cachedState = null;
  cachedPayload = '';
  refreshInFlight = null;
  forceBroadcast = false;
  fetchLiveStateImpl = defaultFetchQuizLiveState;
  nextSubscriberId = 1;
}
