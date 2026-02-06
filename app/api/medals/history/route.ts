import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";
import { getMedalHistory } from "@/lib/services/medalService";
import { api } from "@/shared/routes";

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  try {
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const queryResult = api.medals.history.query.safeParse(searchParams);
    const limit = queryResult.success ? queryResult.data.limit : 50;

    const transactions = await getMedalHistory(userId, limit);

    return NextResponse.json({
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        source: t.source,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Medal history error:", error);
    return NextResponse.json({ message: "Failed to fetch medal history" }, { status: 500 });
  }
}
