"use client";

import { useSession, signOut } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user ?? null,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    logout: () => {
      localStorage.removeItem("konsek_night_mode");
      signOut({ callbackUrl: "/landing" });
    },
    isLoggingOut: false,
  };
}
