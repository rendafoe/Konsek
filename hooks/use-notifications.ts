"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const NOTIFICATIONS_KEY = "/api/notifications";

export interface AppNotification {
  id: number;
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications() {
  return useQuery({
    queryKey: [NOTIFICATIONS_KEY],
    queryFn: async () => {
      const res = await fetch(NOTIFICATIONS_KEY, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const json = await res.json() as { notifications: AppNotification[]; unreadCount: number };
      return json;
    },
    staleTime: 30_000,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark notifications read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
    },
  });
}
