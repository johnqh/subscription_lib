import type { NetworkClient } from '@sudobility/types';
import type { BackendSubscriptionResult } from './types';

interface BackendResponse {
  success: boolean;
  data?: BackendSubscriptionResult;
  error?: string;
}

export async function fetchBackendSubscription(
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  userId: string,
  testMode?: boolean
): Promise<BackendSubscriptionResult> {
  if (!userId || userId.length === 0 || userId.length > 128) {
    throw new Error(`Invalid userId: "${userId}". Expected 1-128 characters`);
  }

  const endpoint = `/api/v1/users/${encodeURIComponent(userId)}/subscriptions`;
  const url = testMode
    ? `${baseUrl}${endpoint}?testMode=true`
    : `${baseUrl}${endpoint}`;

  const response = await networkClient.get<BackendResponse>(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.data) {
    throw new Error('No data received from server');
  }

  const body = response.data;
  if (!body.success || !body.data) {
    throw new Error(body.error ?? 'Failed to fetch subscription status');
  }

  return body.data;
}
