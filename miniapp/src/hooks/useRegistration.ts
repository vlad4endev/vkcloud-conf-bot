import { useEffect, useState } from 'react';
import { getMe, type MeResponse } from '../api/client';
import { isMaxWebApp } from '../lib/maxClient';
import { useUserContext } from '../context/UserContext';

export type RegistrationStatus =
  | 'loading'
  | 'registered'
  | 'unregistered'
  | 'skipped';

export function useRegistration(): {
  status: RegistrationStatus;
  me: MeResponse | null;
  close: () => void;
  isInMax: boolean;
} {
  const { isReady, close } = useUserContext();
  const isInMax = isMaxWebApp();
  const [status, setStatus] = useState<RegistrationStatus>(
    isInMax ? 'loading' : 'skipped',
  );
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    if (!isInMax) {
      setStatus('skipped');
      return;
    }

    setStatus('loading');

    if (!isReady) {
      return;
    }

    let cancelled = false;

    void getMe()
      .then((response) => {
        if (cancelled) {
          return;
        }
        setMe(response);
        setStatus(response.isVerified ? 'registered' : 'unregistered');
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setMe(null);
        setStatus('unregistered');
      });

    return () => {
      cancelled = true;
    };
  }, [isInMax, isReady]);

  return { status, me, close, isInMax };
}
