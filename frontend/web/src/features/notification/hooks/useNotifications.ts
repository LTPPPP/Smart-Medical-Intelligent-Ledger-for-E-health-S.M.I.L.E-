'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { notificationApi } from '../api/notification.api';
import type { NotificationListParams } from '../types/notification.type';

const UNREAD_REFETCH_INTERVAL = 30_000;

export function useNotifications(
  userId: string | null,
  params?: NotificationListParams,
) {
  return useQuery({
    queryKey: ['notifications', 'user', userId, params],
    queryFn: () => notificationApi.getByUser(userId!, params),
    enabled: !!userId,
    select: (res) => res.data,
  });
}

export function useUnreadCount(userId: string | null) {
  return useQuery({
    queryKey: ['notifications', 'unread-count', userId],
    queryFn: () => notificationApi.getUnreadCount(userId!),
    enabled: !!userId,
    refetchInterval: UNREAD_REFETCH_INTERVAL,
    select: (res) => res.data,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
