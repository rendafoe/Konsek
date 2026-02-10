import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/shared/routes";

export function useFriends() {
  return useQuery({
    queryKey: [api.friends.list.path],
    queryFn: async () => {
      const res = await fetch(api.friends.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch friends");
      return api.friends.list.responses[200].parse(await res.json());
    },
  });
}

export function useDiscoverUsers(page: number, search: string, sort: string) {
  return useQuery({
    queryKey: [api.friends.discover.path, page, search, sort],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        sort,
      });
      if (search) params.set("search", search);
      const res = await fetch(`${api.friends.discover.path}?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch discoverable users");
      return api.friends.discover.responses[200].parse(await res.json());
    },
    placeholderData: keepPreviousData,
  });
}

export function useFriendCode() {
  return useQuery({
    queryKey: [api.friends.code.path],
    queryFn: async () => {
      const res = await fetch(api.friends.code.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch friend code");
      return api.friends.code.responses[200].parse(await res.json());
    },
  });
}

export function useAddFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { targetUserId?: string; friendCode?: string }) => {
      const res = await fetch(api.friends.add.path, {
        method: api.friends.add.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add friend");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.friends.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.friends.discover.path] });
    },
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (stravaAthleteId: string) => {
      const res = await fetch(`/api/friends/${stravaAthleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove friend");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.friends.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.friends.discover.path] });
    },
  });
}
