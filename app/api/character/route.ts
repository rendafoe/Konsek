import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";
import { storage } from "@/lib/storage";
import { api } from "@/shared/routes";
import { z } from "zod";

// GET /api/character — returns most recent character (alive or dead)
export async function GET() {
  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  const character = await storage.getMostRecentCharacter(userId);
  if (!character) {
    return NextResponse.json({ message: "No character found" }, { status: 404 });
  }
  return NextResponse.json(character);
}

// POST /api/character — create a new character
export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  try {
    const active = await storage.getActiveCharacter(userId);
    if (active) {
      return NextResponse.json(
        { message: "Active character already exists" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const input = api.character.create.input.parse(body);
    const character = await storage.createCharacter({
      ...input,
      userId,
    });
    return NextResponse.json(character, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.errors[0].message }, { status: 400 });
    }
    throw err;
  }
}
