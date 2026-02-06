import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";
import { storage } from "@/lib/storage";
import { api } from "@/shared/routes";
import { getMedalBalance, spendMedals } from "@/lib/services/medalService";
import { db } from "@/lib/db";
import { userUnlocks } from "@/shared/schema";

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  try {
    const body = await req.json();
    const { itemId } = api.shop.purchase.input.parse(body);

    const item = await storage.getItem(itemId);
    if (!item) {
      return NextResponse.json({ message: "Item not found" }, { status: 400 });
    }

    if (!item.price || item.price <= 0) {
      return NextResponse.json({ message: "This item is not for sale" }, { status: 400 });
    }

    const balance = await getMedalBalance(userId);
    if (balance < item.price) {
      return NextResponse.json({ message: "Insufficient medals" }, { status: 400 });
    }

    await spendMedals(userId, item.price, itemId, `Purchased ${item.name}`);
    await storage.addItemToInventory(userId, itemId);

    // Track unlock for achievements
    try {
      await db.insert(userUnlocks).values({ userId, itemId });
    } catch {
      // Already unlocked
    }

    const newBalance = await getMedalBalance(userId);

    return NextResponse.json({
      success: true,
      item: {
        id: item.id,
        name: item.name,
        rarity: item.rarity,
        imageUrl: item.imageUrl,
      },
      newBalance,
    });
  } catch (error: any) {
    console.error("Purchase error:", error);
    if (error.message === "Insufficient medal balance") {
      return NextResponse.json({ message: "Insufficient medals" }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to complete purchase" }, { status: 500 });
  }
}
