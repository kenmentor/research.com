import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Researcher — Connect through research",
    short_name: "Researcher",
    description:
      "A professional network for researchers: profiles, publications, connections, and messaging.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f9fc",
    theme_color: "#4338ca",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
