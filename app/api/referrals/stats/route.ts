import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";
import { storage } from "@/lib/storage";

export async function GET() {
  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  try {
    const totalReferrals = await storage.getReferralCount(userId);
    const referrals = await storage.getReferralsByReferrer(userId);
    const totalMedalsEarned = referrals.reduce((sum, r) => sum + r.medalsEarnedFromReferral, 0);

    // Check if this user was referred by someone
    const referredBy = await storage.getReferralByReferredUser(userId);
    let referredByInfo: { name: string; date: string } | null = null;

    if (referredBy) {
      const referrerAccount = await storage.getStravaAccount(referredBy.referrerId);
      const name = referrerAccount
        ? [referrerAccount.athleteFirstName, referrerAccount.athleteLastName].filter(Boolean).join(" ") || "Unknown"
        : "Unknown";
      referredByInfo = { name, date: referredBy.createdAt.toISOString() };
    }

    return NextResponse.json({
      totalReferrals,
      totalMedalsEarned,
      referredBy: referredByInfo,
    });
  } catch (error) {
    console.error("Referral stats error:", error);
    return NextResponse.json({ message: "Failed to fetch referral stats" }, { status: 500 });
  }
}
