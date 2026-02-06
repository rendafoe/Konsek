import { db } from "../lib/db";
import { items } from "../shared/schema";
import { eq } from "drizzle-orm";

interface SeedItem {
  name: string;
  description: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
  imageUrl: string;
  quote?: string;
  isSpecialReward?: boolean;
  specialRewardCondition?: string;
  price?: number; // Medal cost for purchasable items
}

const seedItems: SeedItem[] = [
  // === COMMON (18 items) ===
  {
    name: "2L Bottle of Coke",
    description: "A 2L bottle of soda",
    rarity: "common",
    imageUrl: "/items/2l-bottle-of-coke.png",
  },
  {
    name: "7 Salt Pills",
    description: "6 salt pills",
    rarity: "common",
    imageUrl: "/items/7-salt-pills.png",
  },
  {
    name: "Banana Peel",
    description: "A banana peel",
    rarity: "common",
    imageUrl: "/items/banana-peel.png",
    quote: "Watch your step!",
  },
  {
    name: "Bandana",
    description: "A Bandana",
    rarity: "common",
    imageUrl: "/items/bandana.png",
  },
  {
    name: "Classic Beanie",
    description: "A winter running beanie",
    rarity: "common",
    imageUrl: "/items/classic-beanie.png",
  },
  {
    name: "Foil Blanket",
    description: "A foil blanket they hand out at the end of marathons",
    rarity: "common",
    imageUrl: "/items/foil-blanket.png",
  },
  {
    name: "Full Tub of Vaseline",
    description: "A tub of vaseline",
    rarity: "common",
    imageUrl: "/items/full-tub-of-vaseline.png",
  },
  {
    name: "Gently Used Water Flask",
    description: "A soft running flask",
    rarity: "common",
    imageUrl: "/items/gently-used-water-flask.png",
  },
  {
    name: "Half Eaten Gel",
    description: "A wrapper for running gel",
    rarity: "common",
    imageUrl: "/items/half-eaten-gel.png",
  },
  {
    name: "Low-Battery Headlamp",
    description: "A running headlamp",
    rarity: "common",
    imageUrl: "/items/low-battery-headlamp.png",
  },
  {
    name: "Mismatched Socks",
    description: "Mismatched pair of socks",
    rarity: "common",
    imageUrl: "/items/mismatched-socks.png",
  },
  {
    name: "Rain Jacket",
    description: "A rain jacket",
    rarity: "common",
    imageUrl: "/items/rain-jacket.png",
  },
  {
    name: "Safety Whistle",
    description: "A whistle",
    rarity: "common",
    imageUrl: "/items/safety-whistle.png",
  },
  {
    name: "Sun Blasted Mile Marker",
    description: "A very faded mile marker sign",
    rarity: "common",
    imageUrl: "/items/sun-blasted-mile-marker.png",
  },
  {
    name: "Tie Dye Tee",
    description: "A tie dye tee shirt",
    rarity: "common",
    imageUrl: "/items/tie-dye-tee.png",
  },
  {
    name: "Tin Foil Hat",
    description: "A tin foil hat they wear in the movies",
    rarity: "common",
    imageUrl: "/items/tin-foil-hat.png",
  },
  {
    name: "Windbreaker",
    description: "A windbreaker",
    rarity: "common",
    imageUrl: "/items/windbreaker.png",
  },
  {
    name: "Wool Hood",
    description: "A comfy looking wool hood",
    rarity: "common",
    imageUrl: "/items/wool-hood.png",
  },

  // === UNCOMMON (13 items) ===
  {
    name: "10g of Creatine",
    description: "Mysterious white powder",
    rarity: "uncommon",
    imageUrl: "/items/10g-of-creatine.png",
  },
  {
    name: "Emergency Poncho",
    description: "A yellow poncho",
    rarity: "uncommon",
    imageUrl: "/items/emergency-poncho.png",
  },
  {
    name: "Foam Roller",
    description: "A foam roller",
    rarity: "uncommon",
    imageUrl: "/items/foam-roller.png",
  },
  {
    name: "High Tech Chest Strap HR Monitor",
    description: "A running chest strap HR monitor",
    rarity: "uncommon",
    imageUrl: "/items/high-tech-chest-strap-hr-monitor.png",
  },
  {
    name: "Nipple Tape",
    description: "A roll of tape the color of bandaids",
    rarity: "uncommon",
    imageUrl: "/items/nipple-tape.png",
  },
  {
    name: "Old Race Bib",
    description: "A tattered, old race bib you would have worn in a running race",
    rarity: "uncommon",
    imageUrl: "/items/old-race-bib.png",
  },
  {
    name: "Open-topped Mug of Coffee",
    description: "A mug of coffee",
    rarity: "uncommon",
    imageUrl: "/items/open-topped-mug-of-coffee.png",
  },
  {
    name: "Propeller Hat",
    description: "A Propeller Hat",
    rarity: "uncommon",
    imageUrl: "/items/propeller-hat.png",
  },
  {
    name: "Smashed Alarm Clock",
    description: "A smashed alarm clock",
    rarity: "uncommon",
    imageUrl: "/items/smashed-alarm-clock.png",
  },
  {
    name: "Torn City Map",
    description: "A torn city map",
    rarity: "uncommon",
    imageUrl: "/items/torn-city-map.png",
  },
  {
    name: "Vintage Race Shirt",
    description: "A vintage running race shirt",
    rarity: "uncommon",
    imageUrl: "/items/vintage-race-shirt.png",
  },
  {
    name: "Water Balloons",
    description: "A water balloon",
    rarity: "uncommon",
    imageUrl: "/items/water-balloons.png",
  },
  {
    name: "Wristwatch",
    description: "A running GPS watch",
    rarity: "uncommon",
    imageUrl: "/items/wristwatch.png",
    quote: "And I've got a houseboat docked at the Himbo Dome",
  },

  // === RARE (11 items) ===
  {
    name: "Astronaut Helmet",
    description: "An Astronaut Helmet",
    rarity: "rare",
    imageUrl: "/items/astronaut-helmet.png",
  },
  {
    name: "Box of Assorted Chocolate Protein Powder",
    description: "A box of assorted chocolates",
    rarity: "rare",
    imageUrl: "/items/box-of-assorted-chocolate-protein-powder.png",
    isSpecialReward: true,
    specialRewardCondition: "Rewarded on Feb 14th",
  },
  {
    name: "Caffeine Shotgun",
    description: "A shotgun but instead of the barrel it's an aluminum soft drink can",
    rarity: "rare",
    imageUrl: "/items/caffeine-shotgun.png",
    isSpecialReward: true,
    specialRewardCondition: "Rewarded for runs started after 10pm",
  },
  {
    name: "Carbon Plated Shoes",
    description: "Carbon plated shoes",
    rarity: "rare",
    imageUrl: "/items/carbon-plated-shoes.png",
  },
  {
    name: "Doggo",
    description: "A bernedoodle dog",
    rarity: "rare",
    imageUrl: "/items/doggo.png",
  },
  {
    name: "High Visibility Cloak",
    description: "A cloak made out of high visibility material and colors",
    rarity: "rare",
    imageUrl: "/items/high-visibility-cloak.png",
  },
  {
    name: "P.F. Flyers",
    description: "A pair of P.F. Flyers sneakers",
    rarity: "rare",
    imageUrl: "/items/pf-flyers.png",
    quote: "Guaranteed to make you run faster and jump higher",
  },
  {
    name: "Snowball Cannon",
    description: "A snowball cannon",
    rarity: "rare",
    imageUrl: "/items/snowball-cannon.png",
    isSpecialReward: true,
    specialRewardCondition: "Rewarded when snowing",
  },
  {
    name: "Stolen Soul",
    description: "A ghost",
    rarity: "rare",
    imageUrl: "/items/stolen-soul.png",
    quote: "IYKYK",
  },
  {
    name: "Tailwind Espresso",
    description: "A shot of espresso in a cup",
    rarity: "rare",
    imageUrl: "/items/tailwind-espresso.png",
    isSpecialReward: true,
    specialRewardCondition: "Rewarded for runs started before 6am",
  },
  {
    name: "Umbrella Hat",
    description: "An umbrella hat",
    rarity: "rare",
    imageUrl: "/items/umbrella-hat.png",
    isSpecialReward: true,
    specialRewardCondition: "Rewarded when raining",
  },

  // === EPIC (8 items) ===
  {
    name: "Badwater Hat",
    description: "A hat someone would wear in the deep desert",
    rarity: "epic",
    imageUrl: "/items/badwater-hat.png",
    isSpecialReward: true,
    specialRewardCondition: "Rewarded when temp > 100°F",
  },
  {
    name: "Barkleys Compass",
    description: "A compass",
    rarity: "epic",
    imageUrl: "/items/barkleys-compass.png",
  },
  {
    name: "Blue Party Hat",
    description: "A blue party hat from Old School Runescape",
    rarity: "epic",
    imageUrl: "/items/blue-party-hat.png",
  },
  {
    name: "Golden Belt Buckle",
    description: "A golden belt buckle",
    rarity: "epic",
    imageUrl: "/items/golden-belt-buckle.png",
    isSpecialReward: true,
    specialRewardCondition: "Rewarded for runs > 100km",
  },
  {
    name: "Ice Beard",
    description: "A beard with frost and icicles",
    rarity: "epic",
    imageUrl: "/items/ice-beard.png",
    isSpecialReward: true,
    specialRewardCondition: "Rewarded when temp < 10°F",
  },
  {
    name: "Katana",
    description: "A katana sword",
    rarity: "epic",
    imageUrl: "/items/katana.png",
  },
  {
    name: "Skill Cape",
    description: "A superhero cape",
    rarity: "epic",
    imageUrl: "/items/skill-cape.png",
  },
  {
    name: "Wild Mushrooms",
    description: "Psychedelic mushrooms",
    rarity: "epic",
    imageUrl: "/items/wild-mushrooms.png",
    quote: "There's only one way to find out",
  },

  // === LEGENDARY (5 items) ===
  {
    name: "Courtney's Shorts",
    description: "Men's basketball shorts",
    rarity: "legendary",
    imageUrl: "/items/courtneys-shorts.png",
  },
  {
    name: "Killian's Trekking Poles",
    description: "2 trekking poles for running",
    rarity: "legendary",
    imageUrl: "/items/killians-trekking-poles.png",
  },
  {
    name: "Laz's Flannel",
    description: "A men's flannel",
    rarity: "legendary",
    imageUrl: "/items/lazs-flannel.png",
  },
  {
    name: "Prefontaine's Race Singlet",
    description: "A shiny elite runners singlet",
    rarity: "legendary",
    imageUrl: "/items/prefontaines-race-singlet.png",
  },
  {
    name: "Walmsley's WS Race Shirt",
    description: "A white running tee shirt with a bunch of small holes in it",
    rarity: "legendary",
    imageUrl: "/items/walmslys-ws-race-shirt.png",
  },

  // === MYTHIC (5 items) - Purchased with Medals ===
  {
    name: "Mythic Crown",
    description: "A radiant crown that glows with otherworldly energy",
    rarity: "mythic",
    imageUrl: "/items/mythic-crown.png",
    quote: "Worn only by the most dedicated runners",
    isSpecialReward: true,
    specialRewardCondition: "Purchase with 50 Medals",
    price: 50,
  },
  {
    name: "Mythic Cape",
    description: "A flowing cape woven from stardust and determination",
    rarity: "mythic",
    imageUrl: "/items/mythic-cape.png",
    quote: "Each thread represents a mile conquered",
    isSpecialReward: true,
    specialRewardCondition: "Purchase with 50 Medals",
    price: 50,
  },
  {
    name: "Mythic Aura",
    description: "A shimmering aura of pure running essence",
    rarity: "mythic",
    imageUrl: "/items/mythic-aura.png",
    quote: "Visible only to those who have pushed their limits",
    isSpecialReward: true,
    specialRewardCondition: "Purchase with 50 Medals",
    price: 50,
  },
  {
    name: "Mythic Wings",
    description: "Ethereal wings that seem to carry you forward",
    rarity: "mythic",
    imageUrl: "/items/mythic-wings.png",
    quote: "For runners who have learned to fly",
    isSpecialReward: true,
    specialRewardCondition: "Purchase with 50 Medals",
    price: 50,
  },
  {
    name: "Mythic Trail",
    description: "A magical trail that follows your every step",
    rarity: "mythic",
    imageUrl: "/items/mythic-trail.png",
    quote: "Leaves a mark on every path you run",
    isSpecialReward: true,
    specialRewardCondition: "Purchase with 50 Medals",
    price: 50,
  },
];

async function seed() {
  console.log("Seeding items database (upsert mode - preserves user data)...");

  // Upsert all seed items - update if exists by name, insert if new
  let inserted = 0;
  let updated = 0;

  for (const item of seedItems) {
    // Check if item exists by name
    const existing = await db.select().from(items).where(eq(items.name, item.name)).limit(1);

    if (existing.length > 0) {
      // Update existing item
      await db.update(items).set({
        description: item.description,
        rarity: item.rarity,
        imageUrl: item.imageUrl,
        quote: item.quote || null,
        isSpecialReward: item.isSpecialReward || false,
        specialRewardCondition: item.specialRewardCondition || null,
        price: item.price || null,
      }).where(eq(items.name, item.name));
      console.log(`  Updated: ${item.name} (${item.rarity})${item.isSpecialReward ? ' [SPECIAL]' : ''}${item.price ? ` [${item.price} Medals]` : ''}`);
      updated++;
    } else {
      // Insert new item
      await db.insert(items).values({
        name: item.name,
        description: item.description,
        rarity: item.rarity,
        imageUrl: item.imageUrl,
        quote: item.quote || null,
        isSpecialReward: item.isSpecialReward || false,
        specialRewardCondition: item.specialRewardCondition || null,
        price: item.price || null,
      });
      console.log(`  Added: ${item.name} (${item.rarity})${item.isSpecialReward ? ' [SPECIAL]' : ''}${item.price ? ` [${item.price} Medals]` : ''}`);
      inserted++;
    }
  }

  // Count by rarity
  const counts = seedItems.reduce((acc, item) => {
    acc[item.rarity] = (acc[item.rarity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const specialCount = seedItems.filter(i => i.isSpecialReward).length;
  const purchasableCount = seedItems.filter(i => i.price).length;

  console.log(`\nSuccessfully processed ${seedItems.length} items!`);
  console.log(`  - Inserted: ${inserted}`);
  console.log(`  - Updated: ${updated}`);
  console.log(`  - Common: ${counts.common || 0}`);
  console.log(`  - Uncommon: ${counts.uncommon || 0}`);
  console.log(`  - Rare: ${counts.rare || 0}`);
  console.log(`  - Epic: ${counts.epic || 0}`);
  console.log(`  - Legendary: ${counts.legendary || 0}`);
  console.log(`  - Mythic: ${counts.mythic || 0}`);
  console.log(`  - Special Rewards: ${specialCount}`);
  console.log(`  - Purchasable with Medals: ${purchasableCount}`);

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
