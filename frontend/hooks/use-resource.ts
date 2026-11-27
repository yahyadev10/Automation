'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

export function useResource<T>(
  loader: () => Promise<T>,
  key: string,
  onUnauthorized?: () => void,
) {
  const { t } = useI18n();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const loaderRef = useRef(loader);
  const unauthorizedRef = useRef(onUnauthorized);
  loaderRef.current = loader;
  unauthorizedRef.current = onUnauthorized;

  const reload = useCallback(() => setVersion((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    loaderRef
      .current()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        if (cause instanceof ApiError && cause.status === 401) {
          unauthorizedRef.current?.();
          return;
        }
        setError(cause instanceof Error ? cause.message : t('unknownError'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [key, version, t]);

  return { data, error, loading, reload, setData };
}
