import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";
import { getMedalBalance, getCheckInStatus } from "@/lib/services/medalService";

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  try {
    const timezone = req.nextUrl.searchParams.get("timezone") || "UTC";
    const balance = await getMedalBalance(userId);
    const status = await getCheckInStatus(userId, timezone);

    return NextResponse.json({
      balance: Number(balance),
      canCheckIn: Boolean(status.canCheckIn),
      currentStreak: Number(status.currentStreak),
      daysUntilBonus: Number(status.daysUntilBonus),
      lastCheckIn: status.lastCheckIn ? String(status.lastCheckIn) : null,
    });
  } catch (error) {
    console.error("Medal status error:", error);
    return NextResponse.json({ message: "Failed to fetch medal status" }, { status: 500 });
  }
}
