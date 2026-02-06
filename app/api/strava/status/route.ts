import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";
import { storage } from "@/lib/storage";

export async function GET() {
  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  const account = await storage.getStravaAccount(userId);
  return NextResponse.json({
    isConnected: !!account,
    lastSync: account?.lastFetchAt ? account.lastFetchAt.toISOString() : null,
    athleteName: account
      ? `${account.athleteFirstName || ""} ${account.athleteLastName || ""}`.trim() || null
      : null,
    athleteProfilePicture: account?.athleteProfilePicture || null,
  });
}
