import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import Strava from "next-auth/providers/strava";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { storage } from "./storage";
import { users, authAccounts, authVerificationTokens } from "@/shared/models/auth";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: authAccounts,
    verificationTokensTable: authVerificationTokens,
  }),
  session: {
    strategy: "jwt",
  },
  providers: [
    // Dev mock auth — only available in development
    ...(process.env.NODE_ENV === "development"
      ? [
          CredentialsProvider({
            name: "Dev Login",
            credentials: {
              userId: { label: "User ID", type: "text" },
            },
            async authorize(credentials) {
              const userId = credentials?.userId as string;
              if (!userId) return null;

              // Find or create the dev user
              const [existing] = await db
                .select()
                .from(users)
                .where(eq(users.id, userId));

              if (existing) {
                return {
                  id: existing.id,
                  email: existing.email,
                  name: [existing.firstName, existing.lastName]
                    .filter(Boolean)
                    .join(" ") || null,
                  image: existing.profileImageUrl,
                };
              }

              // Create new dev user
              const [newUser] = await db
                .insert(users)
                .values({
                  id: userId,
                  email: `${userId}@dev.local`,
                  firstName: "Dev",
                  lastName: "User",
                })
                .returning();

              return {
                id: newUser.id,
                email: newUser.email,
                name: "Dev User",
                image: null,
              };
            },
          }),
        ]
      : []),
    // Strava OAuth for production
    ...(process.env.STRAVA_CLIENT_ID
      ? [
          Strava({
            clientId: process.env.STRAVA_CLIENT_ID,
            clientSecret: process.env.STRAVA_CLIENT_SECRET!,
            authorization: { params: { scope: "activity:read_all" } },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "strava" && user.id && account.access_token && account.refresh_token) {
        try {
          const stravaProfile = profile as any;
          const athleteId = account.providerAccountId;
          const firstName = stravaProfile?.firstname || stravaProfile?.first_name || null;
          const lastName = stravaProfile?.lastname || stravaProfile?.last_name || null;
          const profilePicture = stravaProfile?.profile || stravaProfile?.profile_medium || null;

          // Populate strava_accounts table (mirrors old /api/strava/callback logic)
          await storage.upsertStravaAccount({
            userId: user.id,
            athleteId,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
            lastFetchAt: new Date(),
            athleteFirstName: firstName,
            athleteLastName: lastName,
            athleteProfilePicture: profilePicture,
            stravaScopes: "activity:read_all",
          });

          // Update user profile with Strava info
          await db
            .update(users)
            .set({
              firstName,
              lastName,
              profileImageUrl: profilePicture,
              name: [firstName, lastName].filter(Boolean).join(" ") || null,
              image: profilePicture,
            })
            .where(eq(users.id, user.id));
        } catch (error) {
          console.error("Error populating Strava account on sign-in:", error);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/landing",
  },
});
