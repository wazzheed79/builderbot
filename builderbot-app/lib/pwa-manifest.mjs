import { brand } from "./brand.mjs";

const icons = [
  {
    src: "/icon-512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "any maskable",
  },
  {
    src: "/icon-192.png",
    sizes: "192x192",
    type: "image/png",
    purpose: "any",
  },
];

/**
 * Home-screen app. `handle_links` is `not-preferred` so an https link,
 * including the sign-in email, stays in the browser tab. Edge on Android
 * otherwise offers to open that link in the Edge app. The home-screen icon
 * still opens the app.
 */
export function appManifest() {
  return {
    name: `${brand.name} — ${brand.tagline}`,
    short_name: brand.shortName,
    description: brand.description,
    start_url: "/dashboard",
    id: "/dashboard",
    display: "standalone",
    handle_links: "not-preferred",
    background_color: "#f6f0e6",
    theme_color: "#c4522a",
    orientation: "portrait",
    scope: "/",
    icons,
    shortcuts: [
      {
        name: "New Quote",
        short_name: "New Quote",
        description: "Start a new trade quote",
        url: "/quotes",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Customers",
        short_name: "Customers",
        description: "View customer directory and quotes",
        url: "/customers",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}

/**
 * Manifest for the email sign-in pages. `display: "browser"` keeps the link
 * in the tab that opened it. A standalone manifest on that page makes Edge
 * on Android ask to open the Edge app.
 */
export function authManifest() {
  return {
    name: brand.name,
    short_name: brand.shortName,
    description: "Sign in from the email link.",
    start_url: "/auth/confirm",
    id: "/auth/confirm",
    display: "browser",
    handle_links: "not-preferred",
    background_color: "#f6f0e6",
    theme_color: "#c4522a",
    scope: "/auth/",
    icons,
  };
}
