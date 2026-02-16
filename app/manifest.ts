import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Costwise",
    short_name: "Costwise",
    description: "Track spending, budgets, goals, and bill sessions.",
    start_url: "/app",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      { src: "/icon-64x64.png", sizes: "64x64", type: "image/png" },
      { src: "/icon-128x128.png", sizes: "128x128", type: "image/png" },
    ],
  };
}
