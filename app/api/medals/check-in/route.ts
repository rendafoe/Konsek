import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";
import { performCheckIn, getMedalBalance } from "@/lib/services/medalService";

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  try {
    const body = await req.json().catch(() => ({}));
    const timezone = body?.timezone || "UTC";

    const result = await performCheckIn(userId, timezone);
    const newBalance = await getMedalBalance(userId);

    return NextResponse.json({
      medalsAwarded: result.medalsAwarded,
      currentStreak: result.currentStreak,
      isStreakBonus: result.isStreakBonus,
      newBalance,
    });
  } catch (error: any) {
    console.error("Check-in error:", error);
    if (error.message === "Already checked in today") {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to check in" }, { status: 500 });
  }
}
