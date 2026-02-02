import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useMedalStatus() {
  return useQuery({
    queryKey: [api.medals.status.path],
    queryFn: async () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch(`${api.medals.status.path}?timezone=${encodeURIComponent(timezone)}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch medal status");
      const json = await res.json();
      try {
        return api.medals.status.responses[200].parse(json);
      } catch (parseError) {
        console.error("Medal status parse error:", parseError, "Response:", json);
        throw parseError;
      }
    },
  });
}

export function useMedalBalance() {
  const { data } = useMedalStatus();
  return data?.balance ?? 0;
}

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch(api.medals.checkIn.path, {
        method: api.medals.checkIn.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to check in");
      }
      return api.medals.checkIn.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.medals.status.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/character"] });
    },
  });
}

export function useMedalHistory(limit: number = 50) {
  return useQuery({
    queryKey: [api.medals.history.path, limit],
    queryFn: async () => {
      const res = await fetch(`${api.medals.history.path}?limit=${limit}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch medal history");
      return api.medals.history.responses[200].parse(await res.json());
    },
  });
}

export function usePurchaseItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: number) => {
      const res = await fetch(api.shop.purchase.path, {
        method: api.shop.purchase.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to purchase item");
      }
      return api.shop.purchase.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.medals.status.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/character"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
    },
  });
}
