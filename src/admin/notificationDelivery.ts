import type { FastifyBaseLogger } from 'fastify';
import { deliverNotification } from '../bot/notifications';
import { env } from '../shared/env';

function getBotInternalUrl(): string | undefined {
  const configured = process.env.BOT_INTERNAL_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  if (env.NODE_ENV === 'production') {
    return 'http://bot:3000';
  }
  return undefined;
}

function logDeliveryResult(
  log: FastifyBaseLogger,
  notificationId: string,
  success: boolean,
): void {
  if (success) {
    log.info({ notificationId }, 'Immediate broadcast completed');
    return;
  }
  log.error(
    { notificationId },
    'Immediate broadcast failed, bot scheduler will retry',
  );
}

export function scheduleImmediateBroadcast(
  notificationId: string,
  text: string,
  log: FastifyBaseLogger,
): void {
  const botUrl = getBotInternalUrl();
  if (botUrl) {
    void fetch(`${botUrl}/internal/notifications/${notificationId}/deliver`, {
      method: 'POST',
      headers: {
        'X-Notification-Secret': env.ADMIN_JWT_SECRET,
      },
    })
      .then(async (response) => {
        if (response.ok) {
          log.info({ notificationId }, 'Immediate broadcast delegated to bot');
          return;
        }

        const body = await response.text();
        log.error(
          { notificationId, status: response.status, body },
          'Bot deliver trigger failed, falling back to local delivery',
        );
        return deliverNotification(notificationId, text);
      })
      .then((success) => {
        if (typeof success === 'boolean') {
          logDeliveryResult(log, notificationId, success);
        }
      })
      .catch((error) => {
        log.error(
          { err: error, notificationId },
          'Bot deliver trigger unreachable, falling back to local delivery',
        );
        void deliverNotification(notificationId, text)
          .then((success) => logDeliveryResult(log, notificationId, success))
          .catch((fallbackError) => {
            log.error(
              { err: fallbackError, notificationId },
              'Immediate broadcast failed',
            );
          });
      });
    return;
  }

  void deliverNotification(notificationId, text)
    .then((success) => logDeliveryResult(log, notificationId, success))
    .catch((error) => {
      log.error({ err: error, notificationId }, 'Immediate broadcast failed');
    });
}
