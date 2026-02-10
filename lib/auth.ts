import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
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
    // Google OAuth for production
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
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
