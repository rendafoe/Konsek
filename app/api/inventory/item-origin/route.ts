import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";
import { storage } from "@/lib/storage";
import { api } from "@/shared/routes";

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const parsed = api.inventory.itemOrigin.query.safeParse({
    itemId: searchParams.get("itemId"),
  });
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid itemId" }, { status: 400 });
  }

  const { itemId } = parsed.data;

  const originRun = await storage.getItemOriginRun(userId, itemId);
  if (!originRun) {
    return NextResponse.json({ message: "No origin run found" }, { status: 404 });
  }

  // Fetch the item to get specialRewardCondition
  const item = await storage.getItem(itemId);

  return NextResponse.json({
    ...originRun,
    date: originRun.date.toISOString(),
    awardedAt: originRun.awardedAt.toISOString(),
    specialRewardCondition: item?.specialRewardCondition ?? null,
  });
}
