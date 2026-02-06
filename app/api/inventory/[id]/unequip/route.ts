import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";
import { storage } from "@/lib/storage";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  const { id } = await params;
  await storage.unequipItem(userId, parseInt(id));
  return NextResponse.json({ success: true });
}
