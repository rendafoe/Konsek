import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";
import { storage } from "@/lib/storage";

export async function POST() {
  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  await storage.markAllNotificationsRead(userId);

  return NextResponse.json({ success: true });
}
