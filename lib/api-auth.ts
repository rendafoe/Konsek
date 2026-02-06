import { auth } from "./auth";
import { NextResponse } from "next/server";

/**
 * Get the authenticated user's ID from the session.
 * Returns null if not authenticated.
 */
export async function getAuthenticatedUser(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * Return a 401 Unauthorized JSON response.
 */
export function unauthorized() {
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}
