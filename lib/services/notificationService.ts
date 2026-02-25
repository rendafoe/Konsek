import { db } from "@/lib/db";
import { notifications } from "@/shared/schema";

/**
 * Create a persistent in-app notification for a user.
 */
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await db.insert(notifications).values({
      userId,
      type,
      title,
      message,
      metadata: metadata ?? null,
      isRead: false,
    });
  } catch (error) {
    // Never let notification failures break the main flow
    console.error("[Notifications] Failed to create notification:", error);
  }
}
