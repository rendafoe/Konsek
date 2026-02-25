"use client";

import { useEffect, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications, useMarkNotificationsRead, type AppNotification } from "@/hooks/use-notifications";
import { Bell, Flame, Star, Trophy, Users, Medal, Gift } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function notificationIcon(type: string) {
  switch (type) {
    case "check_in":
    case "check_in_streak":
      return <Flame size={16} className="text-orange-500 shrink-0" />;
    case "item_received":
      return <Gift size={16} className="text-purple-500 shrink-0" />;
    case "evolution":
      return <Star size={16} className="text-yellow-500 shrink-0" />;
    case "friend_added":
      return <Users size={16} className="text-blue-500 shrink-0" />;
    case "referral_signup":
    case "referral_first_run":
      return <Medal size={16} className="text-green-500 shrink-0" />;
    case "developer_message":
      return <Trophy size={16} className="text-primary shrink-0" />;
    default:
      return <Bell size={16} className="text-muted-foreground shrink-0" />;
  }
}

function NotificationItem({ notification }: { notification: AppNotification }) {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  return (
    <div
      className={`flex gap-3 px-4 py-3 border-b border-border last:border-0 ${
        !notification.isRead ? "bg-orange-50/60 dark:bg-orange-900/10" : ""
      }`}
    >
      <div className="mt-0.5">{notificationIcon(notification.type)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-tight">{notification.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{notification.message}</p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo}</p>
      </div>
    </div>
  );
}

interface NotificationPanelProps {
  children: React.ReactNode;
}

export function NotificationPanel({ children }: NotificationPanelProps) {
  const [open, setOpen] = useState(false);
  const { data } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const hasFired = useRef(false);

  useEffect(() => {
    if (open && !hasFired.current) {
      hasFired.current = true;
      markRead.mutate();
    }
    if (!open) {
      hasFired.current = false;
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const notifications = data?.notifications ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Bell size={28} className="mb-2 opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
