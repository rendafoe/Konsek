import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";
import { storage } from "@/lib/storage";

export async function GET() {
  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  const [notificationList, unreadCount] = await Promise.all([
    storage.getNotifications(userId),
    storage.getUnreadCount(userId),
  ]);

  return NextResponse.json({ notifications: notificationList, unreadCount });
}
