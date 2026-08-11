import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Teacher's List",
    short_name: "Teacher's List",
    description:
      "Find gift ideas for your kid's teachers and school staff, claim one so nobody duplicates.",
    start_url: "/",
    display: "standalone",
    background_color: "#F2ECDA",
    theme_color: "#1F3D2B",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
