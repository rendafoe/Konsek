import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useStravaStatus() {
  return useQuery({
    queryKey: [api.strava.status.path],
    queryFn: async () => {
      const res = await fetch(api.strava.status.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch Strava status");
      return api.strava.status.responses[200].parse(await res.json());
    },
  });
}

export function useStravaSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // Send the user's current timezone with each sync request
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch(api.strava.sync.path, {
        method: api.strava.sync.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone }),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
           const error = api.strava.sync.responses[400].parse(await res.json());
           throw new Error(error.message);
        }
        throw new Error("Failed to sync runs");
      }
      return api.strava.sync.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/runs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/character"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      queryClient.invalidateQueries({ queryKey: [api.medals.status.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
    },
  });
}
