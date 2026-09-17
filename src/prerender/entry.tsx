/**
 * Build-time prerender entry.
 *
 * Renders the public, content-bearing landing pages to static HTML so that
 * crawlers and automated policy reviewers that do not execute JavaScript see
 * the real page content instead of an empty `<div id="root">`.
 *
 * This module is only ever loaded by `scripts/prerender.mjs` during the build.
 * It is never part of the browser bundle.
 *
 * Deliberate constraints:
 * - Leaf page components are rendered directly. `App` / `AppRoutes` must never
 *   be rendered here: `AppRoutes` reads `window.location.hostname` during
 *   render (see `src/routes/index.tsx`), which throws in Node.
 * - `StaticRouter` is the server renderer of the same router the app already
 *   uses; the application itself keeps `BrowserRouter` untouched.
 * - `renderToStaticMarkup` (not `renderToString`) because the app mounts with
 *   `createRoot`, not `hydrateRoot` — React replaces this markup on mount, so
 *   hydration markers would be dead weight.
 */
import type { ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import DeleteAccount from "@/pages/DeleteAccount";

export interface PrerenderRoute {
  /** URL path the generated file will be served from. */
  path: string;
  /** Leaf page component, rendered without the app shell. */
  Component: ComponentType;
}

export interface RenderedRoute {
  path: string;
  html: string;
}

export const routes: PrerenderRoute[] = [
  { path: "/privacy-policy", Component: PrivacyPolicy },
  { path: "/delete-account", Component: DeleteAccount },
];

/** Render a single route to a static HTML fragment. */
export function renderRoute(path: string): string {
  const route = routes.find((candidate) => candidate.path === path);

  if (!route) {
    throw new Error(
      `No prerender route registered for "${path}". Known routes: ${routes
        .map((candidate) => candidate.path)
        .join(", ")}`
    );
  }

  const { Component } = route;

  return renderToStaticMarkup(
    <StaticRouter location={route.path}>
      <Component />
    </StaticRouter>
  );
}

/** Render every registered route. Consumed by `scripts/prerender.mjs`. */
export function renderAll(): RenderedRoute[] {
  return routes.map((route) => ({
    path: route.path,
    html: renderRoute(route.path),
  }));
}
