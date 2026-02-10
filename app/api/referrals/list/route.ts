import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";
import { storage } from "@/lib/storage";

const MAX_MEDALS_PER_REFERRAL = 25;

export async function GET() {
  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  try {
    const referrals = await storage.getReferralsByReferrer(userId);

    const referralList = await Promise.all(
      referrals.map(async (r) => {
        const account = await storage.getStravaAccount(r.referredUserId);
        const name = account
          ? [account.athleteFirstName, account.athleteLastName].filter(Boolean).join(" ") || "Unknown"
          : "Unknown";
        return {
          referredUserName: name,
          referredUserProfilePicture: account?.athleteProfilePicture ?? null,
          medalsEarned: r.medalsEarnedFromReferral,
          maxMedals: MAX_MEDALS_PER_REFERRAL,
          createdAt: r.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json({ referrals: referralList });
  } catch (error) {
    console.error("Referral list error:", error);
    return NextResponse.json({ message: "Failed to fetch referral list" }, { status: 500 });
  }
}
