import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";
import { api } from "@/shared/routes";
import { claimReferral } from "@/lib/services/referralService";

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  try {
    const body = await req.json();
    const parsed = api.referrals.claim.input.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid referral code" }, { status: 400 });
    }

    const result = await claimReferral(userId, parsed.data.referralCode);

    return NextResponse.json({
      success: true,
      referrerName: result.referrerName,
      welcomeBonus: result.welcomeBonus,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to claim referral" }, { status: 400 });
  }
}
