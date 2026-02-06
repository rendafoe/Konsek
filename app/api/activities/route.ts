import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";
import { storage } from "@/lib/storage";
import { api } from "@/shared/routes";

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  try {
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const queryResult = api.activities.list.query.safeParse(searchParams);
    if (!queryResult.success) {
      return NextResponse.json({ message: "Invalid query parameters" }, { status: 400 });
    }

    const { page, limit } = queryResult.data;
    const result = await storage.getActivitiesPaginated(userId, page, limit);

    return NextResponse.json({
      activities: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error("Activities fetch error:", error);
    return NextResponse.json({ message: "Failed to fetch activities" }, { status: 500 });
  }
}
