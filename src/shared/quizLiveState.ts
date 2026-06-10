export type QuizLiveState = {
  revision: string;
  sectionVisible: boolean;
  questionsCount: number;
  awaitingSchedule: boolean;
  startsAtMs: number | null;
};

export function serializeQuizLiveState(state: QuizLiveState): string {
  return JSON.stringify(state);
}

export function parseQuizLiveState(payload: string): QuizLiveState | null {
  try {
    const parsed = JSON.parse(payload) as QuizLiveState;
    if (
      typeof parsed.revision !== 'string' ||
      typeof parsed.sectionVisible !== 'boolean' ||
      typeof parsed.questionsCount !== 'number'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
