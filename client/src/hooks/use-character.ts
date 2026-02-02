import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type InsertCharacter } from "@shared/schema";

export function useCharacter() {
  return useQuery({
    queryKey: [api.character.get.path],
    queryFn: async () => {
      const res = await fetch(api.character.get.path, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch character");
      return api.character.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertCharacter) => {
      // Automatically include the user's timezone from the browser
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch(api.character.create.path, {
        method: api.character.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, timezone }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create character");
      }
      return api.character.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.character.get.path] });
    },
  });
}

export function useCharacterArchive() {
  return useQuery({
    queryKey: [api.character.archive.path],
    queryFn: async () => {
      const res = await fetch(api.character.archive.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch archive");
      return api.character.archive.responses[200].parse(await res.json());
    },
  });
}
