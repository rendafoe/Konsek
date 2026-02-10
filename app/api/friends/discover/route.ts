import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";
import { storage } from "@/lib/storage";
import { api } from "@/shared/routes";

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = api.friends.discover.query.parse(params);

    const result = await storage.getDiscoverableUsers(
      userId,
      parsed.page,
      parsed.limit,
      parsed.search,
      parsed.sort,
    );

    return NextResponse.json({
      users: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error("Get discoverable users error:", error);
    return NextResponse.json({ message: "Failed to fetch discoverable users" }, { status: 500 });
  }
}
