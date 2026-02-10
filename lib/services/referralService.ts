import { storage } from "@/lib/storage";
import { awardMedals } from "./medalService";

const MAX_MEDALS_PER_REFERRAL = 25;
const SIGNUP_BONUS = 5;
const FIRST_RUN_BONUS = 5;
const PER_RUN_BONUS = 1;
const WELCOME_BONUS = 5;

/**
 * Claim a referral: creates the referral record, awards welcome bonus to referred user,
 * and awards signup bonus to referrer.
 */
export async function claimReferral(
  referredUserId: string,
  referralCode: string
): Promise<{ referrerName: string; welcomeBonus: number }> {
  // Check if already referred
  const existing = await storage.getReferralByReferredUser(referredUserId);
  if (existing) {
    throw new Error("You have already been referred");
  }

  // Look up referrer by friend code
  const referrer = await storage.getReferrerByFriendCode(referralCode);
  if (!referrer) {
    throw new Error("Invalid referral code");
  }

  // Prevent self-referral
  if (referrer.userId === referredUserId) {
    throw new Error("You cannot refer yourself");
  }

  // Require active character
  const character = await storage.getActiveCharacter(referredUserId);
  if (!character) {
    throw new Error("You must create your Esko first");
  }

  // Create referral record
  const referral = await storage.createReferral(referrer.userId, referredUserId);

  // Award welcome bonus to referred user
  await awardMedals(
    referredUserId,
    WELCOME_BONUS,
    "referral",
    referral.id,
    "Welcome bonus from referral"
  );

  // Award signup bonus to referrer (try/catch in case their character is dead)
  try {
    await awardMedals(
      referrer.userId,
      SIGNUP_BONUS,
      "referral",
      referral.id,
      `Referral bonus: new user joined`
    );
    await storage.updateReferralMedals(referral.id, SIGNUP_BONUS);
  } catch {
    // Referrer's character may be dead — skip silently
  }

  return { referrerName: referrer.displayName, welcomeBonus: WELCOME_BONUS };
}

/**
 * Award progressive medals to the referrer when the referred user syncs runs.
 * Called from Strava sync after new runs are processed.
 */
export async function processReferralRunMedals(
  referredUserId: string,
  previousTotalRuns: number,
  newTotalRuns: number
): Promise<void> {
  const referral = await storage.getReferralByReferredUser(referredUserId);
  if (!referral) return;

  const currentMedals = referral.medalsEarnedFromReferral;
  if (currentMedals >= MAX_MEDALS_PER_REFERRAL) return;

  const remaining = MAX_MEDALS_PER_REFERRAL - currentMedals;
  const newRuns = newTotalRuns - previousTotalRuns;
  if (newRuns <= 0) return;

  let medalsToAward = 0;

  if (previousTotalRuns === 0) {
    // First run ever: award FIRST_RUN_BONUS for the first run
    medalsToAward += FIRST_RUN_BONUS;
    // Additional runs in this sync batch get PER_RUN_BONUS each
    medalsToAward += (newRuns - 1) * PER_RUN_BONUS;
  } else {
    // Subsequent runs: PER_RUN_BONUS each
    medalsToAward += newRuns * PER_RUN_BONUS;
  }

  // Cap at remaining
  medalsToAward = Math.min(medalsToAward, remaining);
  if (medalsToAward <= 0) return;

  try {
    await awardMedals(
      referral.referrerId,
      medalsToAward,
      "referral",
      referral.id,
      previousTotalRuns === 0
        ? `Referral: first run by referred user`
        : `Referral: ${newRuns} new run${newRuns > 1 ? "s" : ""} by referred user`
    );
    await storage.updateReferralMedals(referral.id, currentMedals + medalsToAward);
  } catch {
    // Referrer's character may be dead — skip silently
  }
}
