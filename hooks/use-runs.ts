import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/routes";

export function useRuns() {
  return useQuery({
    queryKey: [api.runs.list.path],
    queryFn: async () => {
      const res = await fetch(api.runs.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch runs");
      return api.runs.list.responses[200].parse(await res.json());
    },
  });
}
