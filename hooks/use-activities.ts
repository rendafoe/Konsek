import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api, type ActivitiesResponse } from "@/shared/routes";

interface UseActivitiesOptions {
  page?: number;
  limit?: number;
  staleTime?: number;
}

export function useActivities({ page = 1, limit = 25, staleTime }: UseActivitiesOptions = {}) {
  return useQuery({
    queryKey: [api.activities.list.path, page, limit],
    queryFn: async (): Promise<ActivitiesResponse> => {
      const url = `${api.activities.list.path}?page=${page}&limit=${limit}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },
    placeholderData: keepPreviousData,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    ...(staleTime !== undefined && { staleTime }),
  });
}
