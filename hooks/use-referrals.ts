import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/routes";

export function useReferralStats() {
  return useQuery({
    queryKey: [api.referrals.stats.path],
    queryFn: async () => {
      const res = await fetch(api.referrals.stats.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch referral stats");
      return api.referrals.stats.responses[200].parse(await res.json());
    },
  });
}

export function useReferralList() {
  return useQuery({
    queryKey: [api.referrals.list.path],
    queryFn: async () => {
      const res = await fetch(api.referrals.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch referral list");
      return api.referrals.list.responses[200].parse(await res.json());
    },
  });
}

export function useClaimReferral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (referralCode: string) => {
      const res = await fetch(api.referrals.claim.path, {
        method: api.referrals.claim.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to claim referral");
      }
      return api.referrals.claim.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.referrals.stats.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/medals/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/character"] });
    },
  });
}
