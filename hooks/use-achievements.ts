import { useQuery } from "@tanstack/react-query";
import { api, type AchievementsResponse } from "@/shared/routes";

export function useAchievements() {
  return useQuery({
    queryKey: [api.achievements.list.path],
    queryFn: async (): Promise<AchievementsResponse> => {
      const res = await fetch(api.achievements.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch achievements");
      return res.json();
    },
  });
}
