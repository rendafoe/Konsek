import { db } from "../server/db";
import { items } from "../shared/schema";
import { eq } from "drizzle-orm";

interface SeedItem {
  name: string;
  description: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  type: "wearable" | "accessory";
  imageUrl: string;
}

const seedItems: SeedItem[] = [
  // Common (6 items)
  {
    name: "Trail Runners",
    description: "Basic trail running shoes. Reliable and comfortable for any terrain.",
    rarity: "common",
    type: "wearable",
    imageUrl: "/items/trail-runners.png",
  },
  {
    name: "Cotton Headband",
    description: "A simple cotton headband to keep sweat out of your eyes.",
    rarity: "common",
    type: "accessory",
    imageUrl: "/items/cotton-headband.png",
  },
  {
    name: "Basic Water Bottle",
    description: "A standard water bottle for hydration on the go.",
    rarity: "common",
    type: "accessory",
    imageUrl: "/items/water-bottle.png",
  },
  {
    name: "Running Socks",
    description: "Moisture-wicking socks that prevent blisters.",
    rarity: "common",
    type: "wearable",
    imageUrl: "/items/running-socks.png",
  },
  {
    name: "Reflective Band",
    description: "A simple reflective band for visibility during night runs.",
    rarity: "common",
    type: "accessory",
    imageUrl: "/items/reflective-band.png",
  },
  {
    name: "Sports Cap",
    description: "A lightweight cap to shield from the sun.",
    rarity: "common",
    type: "wearable",
    imageUrl: "/items/sports-cap.png",
  },

  // Uncommon (5 items)
  {
    name: "Compression Sleeves",
    description: "Calf compression sleeves for improved circulation and recovery.",
    rarity: "uncommon",
    type: "wearable",
    imageUrl: "/items/compression-sleeves.png",
  },
  {
    name: "GPS Watch",
    description: "A reliable GPS watch for tracking distance and pace.",
    rarity: "uncommon",
    type: "accessory",
    imageUrl: "/items/gps-watch.png",
  },
  {
    name: "Trail Vest",
    description: "A lightweight vest with pockets for carrying essentials.",
    rarity: "uncommon",
    type: "wearable",
    imageUrl: "/items/trail-vest.png",
  },
  {
    name: "Bone Conduction Headphones",
    description: "Headphones that let you hear your surroundings while running.",
    rarity: "uncommon",
    type: "accessory",
    imageUrl: "/items/bone-headphones.png",
  },
  {
    name: "Running Gloves",
    description: "Touchscreen-compatible gloves for cold weather runs.",
    rarity: "uncommon",
    type: "wearable",
    imageUrl: "/items/running-gloves.png",
  },

  // Rare (4 items)
  {
    name: "Carbon Plate Shoes",
    description: "Racing shoes with carbon fiber plates for maximum energy return.",
    rarity: "rare",
    type: "wearable",
    imageUrl: "/items/carbon-shoes.png",
  },
  {
    name: "Heart Rate Monitor",
    description: "Precision chest strap monitor for accurate heart rate tracking.",
    rarity: "rare",
    type: "accessory",
    imageUrl: "/items/hr-monitor.png",
  },
  {
    name: "Hydration Pack",
    description: "A sleek pack with a 2L bladder for long distance runs.",
    rarity: "rare",
    type: "wearable",
    imageUrl: "/items/hydration-pack.png",
  },
  {
    name: "LED Headlamp",
    description: "Ultra-bright rechargeable headlamp for night trail running.",
    rarity: "rare",
    type: "accessory",
    imageUrl: "/items/led-headlamp.png",
  },

  // Epic (3 items)
  {
    name: "Ultra Vest Pro",
    description: "Professional-grade running vest designed for ultramarathons.",
    rarity: "epic",
    type: "wearable",
    imageUrl: "/items/ultra-vest.png",
  },
  {
    name: "Smart Running Pod",
    description: "Advanced foot pod with biomechanical analysis and coaching.",
    rarity: "epic",
    type: "accessory",
    imageUrl: "/items/smart-pod.png",
  },
  {
    name: "Weather Shield Jacket",
    description: "Ultralight waterproof jacket that packs into its own pocket.",
    rarity: "epic",
    type: "wearable",
    imageUrl: "/items/weather-jacket.png",
  },

  // Legendary (2 items)
  {
    name: "Phoenix Wings",
    description: "Mythical shoes said to grant the speed of a rising phoenix. Glows with inner fire.",
    rarity: "legendary",
    type: "wearable",
    imageUrl: "/items/phoenix-wings.png",
  },
  {
    name: "Aurora Amulet",
    description: "An ancient amulet that pulses with the northern lights. Grants supernatural endurance.",
    rarity: "legendary",
    type: "accessory",
    imageUrl: "/items/aurora-amulet.png",
  },
];

async function seed() {
  console.log("Seeding items database...");

  // Check if items already exist
  const existingItems = await db.select().from(items);
  if (existingItems.length > 0) {
    console.log(`Found ${existingItems.length} existing items. Skipping seed.`);
    console.log("To reseed, manually delete existing items first.");
    process.exit(0);
  }

  // Insert all seed items
  for (const item of seedItems) {
    await db.insert(items).values(item);
    console.log(`  Added: ${item.name} (${item.rarity})`);
  }

  console.log(`\nSuccessfully seeded ${seedItems.length} items!`);
  console.log("  - Common: 6");
  console.log("  - Uncommon: 5");
  console.log("  - Rare: 4");
  console.log("  - Epic: 3");
  console.log("  - Legendary: 2");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
