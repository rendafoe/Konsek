import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";
import { storage } from "@/lib/storage";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ stravaAthleteId: string }> }
) {
  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  try {
    const { stravaAthleteId } = await params;
    await storage.removeFriend(userId, stravaAthleteId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove friend error:", error);
    return NextResponse.json({ message: "Failed to remove friend" }, { status: 500 });
  }
}
