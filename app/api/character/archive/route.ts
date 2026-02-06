import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";
import { storage } from "@/lib/storage";

export async function GET() {
  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  const archive = await storage.getCharacterArchive(userId);
  return NextResponse.json(archive);
}
