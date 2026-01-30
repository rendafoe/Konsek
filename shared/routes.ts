import { z } from 'zod';
import { insertCharacterSchema, characters, items, inventory, runs, stravaAccounts, runItems } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  // === STRAVA AUTH ===
  strava: {
    connect: {
      method: 'GET' as const,
      path: '/api/strava/connect', // Redirects to Strava OAuth
      responses: {
        302: z.void(), // Redirect
      },
    },
    status: {
        method: 'GET' as const,
        path: '/api/strava/status',
        responses: {
            200: z.object({
              isConnected: z.boolean(),
              lastSync: z.string().nullable(),
              athleteName: z.string().nullable(),
              athleteProfilePicture: z.string().nullable(),
            })
        }
    },
    sync: {
        method: 'POST' as const,
        path: '/api/strava/sync',
        responses: {
            200: z.object({ synced: z.number(), message: z.string() }),
            400: errorSchemas.validation
        }
    }
  },

  // === CHARACTER ===
  character: {
    get: {
      method: 'GET' as const,
      path: '/api/character', // Get current active character
      responses: {
        200: z.custom<typeof characters.$inferSelect>(),
        404: errorSchemas.notFound, // No active character
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/character',
      input: insertCharacterSchema,
      responses: {
        201: z.custom<typeof characters.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    archive: {
      method: 'GET' as const,
      path: '/api/character/archive',
      responses: {
        200: z.array(z.custom<typeof characters.$inferSelect>()),
      },
    },
  },

  // === INVENTORY ===
  inventory: {
    list: {
      method: 'GET' as const,
      path: '/api/inventory',
      responses: {
        200: z.array(z.custom<typeof inventory.$inferSelect & { item: typeof items.$inferSelect }>()),
      },
    },
    equip: {
      method: 'POST' as const,
      path: '/api/inventory/:id/equip',
      responses: {
        200: z.object({ success: z.boolean() }),
        404: errorSchemas.notFound,
      },
    },
    unequip: {
      method: 'POST' as const,
      path: '/api/inventory/:id/unequip',
      responses: {
        200: z.object({ success: z.boolean() }),
        404: errorSchemas.notFound,
      },
    },
  },

  // === RUNS ===
  runs: {
    list: {
      method: 'GET' as const,
      path: '/api/runs',
      responses: {
        200: z.array(z.custom<typeof runs.$inferSelect>()),
      }
    }
  },

  // === ACTIVITIES (Paginated) ===
  activities: {
    list: {
      method: 'GET' as const,
      path: '/api/activities',
      query: z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(25),
      }),
      responses: {
        200: z.object({
          activities: z.array(z.custom<typeof runs.$inferSelect & {
            awardedItems?: Array<typeof runItems.$inferSelect & { item?: typeof items.$inferSelect }>
          }>()),
          pagination: z.object({
            page: z.number(),
            limit: z.number(),
            total: z.number(),
            totalPages: z.number(),
          }),
        }),
      },
    },
  },

  // === ACHIEVEMENTS ===
  achievements: {
    list: {
      method: 'GET' as const,
      path: '/api/achievements',
      responses: {
        200: z.object({
          items: z.array(z.object({
            id: z.number(),
            name: z.string(),
            description: z.string(),
            rarity: z.string(),
            imageUrl: z.string(),
            quote: z.string().nullable(),
            isSpecialReward: z.boolean(),
            specialRewardCondition: z.string().nullable(),
            unlocked: z.boolean(),
            unlockedAt: z.string().nullable(),
          })),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type CharacterResponse = z.infer<typeof api.character.get.responses[200]>;
export type InventoryResponse = z.infer<typeof api.inventory.list.responses[200]>;
export type ActivitiesResponse = z.infer<typeof api.activities.list.responses[200]>;
export type AchievementsResponse = z.infer<typeof api.achievements.list.responses[200]>;
