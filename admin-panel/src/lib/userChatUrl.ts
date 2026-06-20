import type { User } from '../api/types';

export type UserPlatform = 'telegram' | 'max';

export type BotUserChatFields = {
  platform: UserPlatform;
  platformUserId: string;
  username?: string | null;
};

export function getUserChatUrl(user: BotUserChatFields): string | null {
  const platformUserId = user.platformUserId.trim();
  if (!platformUserId) {
    return null;
  }

  if (user.platform === 'telegram') {
    const username = user.username?.replace(/^@/, '').trim();
    if (username) {
      return `https://t.me/${username}`;
    }
    return `tg://user?id=${platformUserId}`;
  }

  if (user.platform === 'max') {
    return `https://max.ru/chat/${platformUserId}`;
  }

  return null;
}

export function getChatUrlForUser(user: User): string | null {
  return getUserChatUrl({
    platform: user.platform ?? 'max',
    platformUserId: user.platformUserId ?? user.maxUserId,
    username: user.username,
  });
}
