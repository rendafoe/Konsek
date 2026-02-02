import { db } from "../server/db";
import { runItems, userUnlocks, inventory, runs, characters, stravaAccounts, dailyCheckIns, medalTransactions } from "../shared/schema";

async function resetUserData() {
  console.log("Resetting all user data...\n");

  // Clear tables in order (respecting foreign key constraints)
  console.log("1. Clearing run_items...");
  await db.delete(runItems);

  console.log("2. Clearing user_unlocks...");
  await db.delete(userUnlocks);

  console.log("3. Clearing inventory...");
  await db.delete(inventory);

  console.log("4. Clearing runs...");
  await db.delete(runs);

  console.log("5. Clearing daily_check_ins...");
  await db.delete(dailyCheckIns);

  console.log("6. Clearing medal_transactions...");
  await db.delete(medalTransactions);

  console.log("7. Clearing characters...");
  await db.delete(characters);

  console.log("8. Clearing strava_accounts...");
  await db.delete(stravaAccounts);

  console.log("\n✓ All user data cleared! Items remain intact.");
  console.log("  Refresh the browser to start fresh as a new user.");

  process.exit(0);
}

resetUserData().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
