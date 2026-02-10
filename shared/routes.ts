import { z } from 'zod';
import { insertCharacterSchema, characters, items, inventory, runs, stravaAccounts, runItems, dailyCheckIns, medalTransactions, type FriendProfile, type DiscoverableUser } from './schema';

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
  // === STRAVA ===
  strava: {
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
        input: z.object({
          timezone: z.string().optional(), // User's current timezone (e.g., "America/Chicago")
        }),
        responses: {
            200: z.object({
              synced: z.number(),
              message: z.string(),
              awardedItems: z.array(z.object({
                id: z.number(),
                name: z.string(),
                description: z.string(),
                rarity: z.string(),
                imageUrl: z.string(),
                quote: z.string().nullable(),
                isSpecialReward: z.boolean(),
                specialRewardCondition: z.string().nullable(),
              })).optional(),
              medalsAwarded: z.number().optional(),
              progressionReward: z.object({
                stage: z.string(),
                medalsAwarded: z.number(),
              }).optional(),
            }),
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
            price: z.number().nullable(),
            unlocked: z.boolean(),
            unlockedAt: z.string().nullable(),
          })),
        }),
      },
    },
  },

  // === MEDALS ===
  medals: {
    status: {
      method: 'GET' as const,
      path: '/api/medals/status',
      responses: {
        200: z.object({
          balance: z.number(),
          canCheckIn: z.boolean(),
          currentStreak: z.number(),
          daysUntilBonus: z.number(),
          lastCheckIn: z.string().nullable(),
        }),
      },
    },
    checkIn: {
      method: 'POST' as const,
      path: '/api/medals/check-in',
      input: z.object({
        timezone: z.string().optional(),
      }),
      responses: {
        200: z.object({
          medalsAwarded: z.number(),
          currentStreak: z.number(),
          isStreakBonus: z.boolean(),
          newBalance: z.number(),
        }),
        400: errorSchemas.validation,
      },
    },
    history: {
      method: 'GET' as const,
      path: '/api/medals/history',
      query: z.object({
        limit: z.coerce.number().min(1).max(100).default(50),
      }),
      responses: {
        200: z.object({
          transactions: z.array(z.object({
            id: z.number(),
            amount: z.number(),
            source: z.string(),
            description: z.string(),
            createdAt: z.string(),
          })),
        }),
      },
    },
  },

  // === FRIENDS ===
  friends: {
    list: {
      method: 'GET' as const,
      path: '/api/friends',
      responses: {
        200: z.object({
          friends: z.array(z.object({
            displayName: z.string(),
            profilePicture: z.string().nullable(),
            isKonsekUser: z.boolean(),
            stravaAthleteId: z.string(),
            totalRuns: z.number().nullable(),
            totalDistance: z.number().nullable(),
            eskoStage: z.string().nullable(),
            eskoHealthState: z.number().nullable(),
            totalMedals: z.number().nullable(),
            totalItemsUnlocked: z.number().nullable(),
            lastItemReceived: z.object({
              name: z.string(),
              imageUrl: z.string(),
              rarity: z.string(),
              receivedAt: z.string(),
            }).nullable(),
            source: z.enum(["club", "code", "discover"]),
            friendSince: z.string(),
          })),
        }),
      },
    },
    discover: {
      method: 'GET' as const,
      path: '/api/friends/discover',
      query: z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(50),
        search: z.string().optional(),
        sort: z.enum(["name", "distance", "medals", "runs", "esko_age"]).default("name"),
      }),
      responses: {
        200: z.object({
          users: z.array(z.custom<DiscoverableUser>()),
          pagination: z.object({
            page: z.number(),
            limit: z.number(),
            total: z.number(),
            totalPages: z.number(),
          }),
        }),
      },
    },
    add: {
      method: 'POST' as const,
      path: '/api/friends/add',
      input: z.object({
        targetUserId: z.string().optional(),
        friendCode: z.string().optional(),
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
        400: errorSchemas.validation,
      },
    },
    remove: {
      method: 'DELETE' as const,
      path: '/api/friends/:stravaAthleteId',
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
    code: {
      method: 'GET' as const,
      path: '/api/friends/code',
      responses: {
        200: z.object({ friendCode: z.string() }),
      },
    },
  },

  // === REFERRALS ===
  referrals: {
    claim: {
      method: 'POST' as const,
      path: '/api/referrals/claim',
      input: z.object({
        referralCode: z.string(),
      }),
      responses: {
        200: z.object({
          success: z.boolean(),
          referrerName: z.string(),
          welcomeBonus: z.number(),
        }),
        400: errorSchemas.validation,
      },
    },
    stats: {
      method: 'GET' as const,
      path: '/api/referrals/stats',
      responses: {
        200: z.object({
          totalReferrals: z.number(),
          totalMedalsEarned: z.number(),
          referredBy: z.object({
            name: z.string(),
            date: z.string(),
          }).nullable(),
        }),
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/referrals/list',
      responses: {
        200: z.object({
          referrals: z.array(z.object({
            referredUserName: z.string(),
            referredUserProfilePicture: z.string().nullable(),
            medalsEarned: z.number(),
            maxMedals: z.number(),
            createdAt: z.string(),
          })),
        }),
      },
    },
  },

  // === SHOP ===
  shop: {
    purchase: {
      method: 'POST' as const,
      path: '/api/shop/purchase',
      input: z.object({
        itemId: z.number(),
      }),
      responses: {
        200: z.object({
          success: z.boolean(),
          item: z.object({
            id: z.number(),
            name: z.string(),
            rarity: z.string(),
            imageUrl: z.string(),
          }),
          newBalance: z.number(),
        }),
        400: errorSchemas.validation,
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
export type FriendsResponse = z.infer<typeof api.friends.list.responses[200]>;
export type DiscoverResponse = z.infer<typeof api.friends.discover.responses[200]>;
