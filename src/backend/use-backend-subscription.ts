import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type {
  BackendSubscriptionResult,
  NetworkClient,
} from '@sudobility/types';
import { fetchBackendSubscription } from './fetch-backend-subscription';

export interface UseBackendSubscriptionOptions extends Omit<
  UseQueryOptions<BackendSubscriptionResult>,
  'queryKey' | 'queryFn'
> {
  testMode?: boolean;
}

export function useBackendSubscription(
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  userId: string,
  options?: UseBackendSubscriptionOptions
): UseQueryResult<BackendSubscriptionResult> {
  const { testMode, ...queryOptions } = options ?? {};

  const isEnabled =
    !!userId &&
    !!token &&
    (queryOptions.enabled !== undefined ? queryOptions.enabled : true);

  return useQuery({
    queryKey: ['subscription', 'backend', userId] as const,
    queryFn: () =>
      fetchBackendSubscription(networkClient, baseUrl, token, userId, testMode),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...queryOptions,
    enabled: isEnabled,
  });
}
