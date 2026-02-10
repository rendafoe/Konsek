import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";
import { storage } from "@/lib/storage";

export async function GET() {
  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  try {
    const friendCode = await storage.getOrCreateFriendCode(userId);
    return NextResponse.json({ friendCode });
  } catch (error: any) {
    console.error("Get friend code error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to get friend code" },
      { status: 400 }
    );
  }
}
