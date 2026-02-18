import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@/shared/routes";
import type { z } from "zod";

export type ItemOrigin = z.infer<typeof api.inventory.itemOrigin.responses[200]>;

export function useInventory() {
  return useQuery({
    queryKey: [api.inventory.list.path],
    queryFn: async () => {
      const res = await fetch(api.inventory.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch inventory");
      return api.inventory.list.responses[200].parse(await res.json());
    },
  });
}

export function useEquipItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.inventory.equip.path, { id });
      const res = await fetch(url, {
        method: api.inventory.equip.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to equip item");
      return api.inventory.equip.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.inventory.list.path] });
    },
  });
}

export function useUnequipItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.inventory.unequip.path, { id });
      const res = await fetch(url, {
        method: api.inventory.unequip.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to unequip item");
      return api.inventory.unequip.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.inventory.list.path] });
    },
  });
}

export function useItemOrigin(itemId: number | null) {
  return useQuery({
    queryKey: [api.inventory.itemOrigin.path, itemId],
    queryFn: async (): Promise<ItemOrigin> => {
      const res = await fetch(`${api.inventory.itemOrigin.path}?itemId=${itemId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch item origin");
      return api.inventory.itemOrigin.responses[200].parse(await res.json());
    },
    enabled: itemId !== null,
  });
}
