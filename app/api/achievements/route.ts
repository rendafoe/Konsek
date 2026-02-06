import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";
import { storage } from "@/lib/storage";

export async function GET() {
  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  try {
    const achievements = await storage.getAchievements(userId);
    return NextResponse.json({
      items: achievements.map((item) => ({
        ...item,
        unlockedAt: item.unlockedAt ? item.unlockedAt.toISOString() : null,
      })),
    });
  } catch (error) {
    console.error("Achievements fetch error:", error);
    return NextResponse.json({ message: "Failed to fetch achievements" }, { status: 500 });
  }
}
