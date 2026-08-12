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
      { src: "/circular-logo.png", sizes: "1254x1254", type: "image/png" },
    ],
  };
}
