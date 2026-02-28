import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Konsek",
    short_name: "Konsek",
    description:
      "Your running companion for consistency. Raise a digital companion powered by your real-world runs via Strava.",
    start_url: "/",
    display: "standalone",
    background_color: "#111f17",
    theme_color: "#111f17",
    icons: [
      {
        src: "/esko/esko-hatchling-v1.png",
        sizes: "578x578",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
