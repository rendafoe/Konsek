import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";
import { storage } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  try {
    const body = await req.json();
    const { targetUserId, friendCode } = body;

    if (!targetUserId && !friendCode) {
      return NextResponse.json(
        { message: "Provide either targetUserId or friendCode" },
        { status: 400 }
      );
    }

    if (friendCode) {
      await storage.addFriendByCode(userId, friendCode);
    } else {
      await storage.addFriendFromDiscover(userId, targetUserId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Add friend error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to add friend" },
      { status: 400 }
    );
  }
}
