import { db } from "../lib/db";
import { runItems, userUnlocks, inventory, runs, characters, stravaAccounts, dailyCheckIns, medalTransactions, referrals, friends } from "../shared/schema";
import { authAccounts, authVerificationTokens, sessions, users } from "../shared/models/auth";

async function resetUserData() {
  console.log("Resetting all user data (including accounts)...\n");

  // Clear tables in order (respecting foreign key constraints)
  console.log(" 1. Clearing run_items...");
  await db.delete(runItems);

  console.log(" 2. Clearing user_unlocks...");
  await db.delete(userUnlocks);

  console.log(" 3. Clearing inventory...");
  await db.delete(inventory);

  console.log(" 4. Clearing runs...");
  await db.delete(runs);

  console.log(" 5. Clearing daily_check_ins...");
  await db.delete(dailyCheckIns);

  console.log(" 6. Clearing medal_transactions...");
  await db.delete(medalTransactions);

  console.log(" 7. Clearing referrals...");
  await db.delete(referrals);

  console.log(" 8. Clearing friends...");
  await db.delete(friends);

  console.log(" 9. Clearing characters...");
  await db.delete(characters);

  console.log("10. Clearing strava_accounts...");
  await db.delete(stravaAccounts);

  console.log("11. Clearing auth accounts...");
  await db.delete(authAccounts);

  console.log("12. Clearing sessions...");
  await db.delete(sessions);

  console.log("13. Clearing verification tokens...");
  await db.delete(authVerificationTokens);

  console.log("14. Clearing users...");
  await db.delete(users);

  console.log("\n✓ All user data and accounts cleared! Items remain intact.");

  process.exit(0);
}

resetUserData().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
