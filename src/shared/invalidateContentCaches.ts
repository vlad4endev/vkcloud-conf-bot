import { invalidateMiniappCaches } from './miniappCache';
import { invalidateQuizLiveCache } from './quizLiveBroadcaster';

export function invalidateAllContentCaches(): void {
  invalidateMiniappCaches();
  invalidateQuizLiveCache();
}
