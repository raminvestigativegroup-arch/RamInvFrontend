#!/usr/bin/env node
/**
 * Post-build prerender step.
 *
 * Takes the SSR bundle produced by `vite build --ssr src/prerender/entry.tsx`,
 * renders each registered route to static markup, and injects that markup into
 * the *already built* `dist/index.html` shell.
 *
 * Reusing the built shell (rather than templating a new one) means the hashed
 * JS/CSS references, the favicon and the design-system stylesheets are
 * inherited verbatim and can never drift out of sync with the build.
 *
 * The React page components remain the single source of truth for the content;
 * nothing is duplicated or hand-maintained here.
 *
 * Exits non-zero on any failure so a broken prerender fails the build.
 */
import { readdir, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, "dist");
const shellPath = path.join(distDir, "index.html");
const ssrDir = path.join(projectRoot, ".prerender");

/** The mount point Vite emits in index.html; the only thing we replace. */
const ROOT_PLACEHOLDER = /<div id="root">\s*<\/div>/;

/** Guards against a shell whose assets are relative and would break at /foo/. */
const RELATIVE_ASSET = /(?:src|href)="(?!https?:|\/\/|\/|data:|mailto:|tel:|#)/;

/** A rendered page this small means the component produced nothing useful. */
const MIN_MARKUP_BYTES = 500;

const log = (message) => console.log(`[prerender] ${message}`);

/** Locate the SSR bundle without assuming Vite's output extension. */
async function resolveSsrEntry() {
  if (!existsSync(ssrDir)) {
    throw new Error(
      `SSR bundle directory ${path.relative(projectRoot, ssrDir)} not found. ` +
        `Run "vite build --ssr src/prerender/entry.tsx --outDir .prerender" first.`
    );
  }

  const candidates = (await readdir(ssrDir)).filter((file) =>
    /^entry\.(m?js|cjs)$/.test(file)
  );

  if (candidates.length === 0) {
    throw new Error(
      `No entry.{js,mjs,cjs} found in ${path.relative(projectRoot, ssrDir)}.`
    );
  }

  return path.join(ssrDir, candidates[0]);
}

async function readShell() {
  if (!existsSync(shellPath)) {
    throw new Error(
      `${path.relative(projectRoot, shellPath)} not found. Run "vite build" first.`
    );
  }

  const shell = await readFile(shellPath, "utf8");

  if (!ROOT_PLACEHOLDER.test(shell)) {
    throw new Error(
      `Could not find <div id="root"></div> in ${path.relative(projectRoot, shellPath)}. ` +
        `The shell changed shape; update ROOT_PLACEHOLDER.`
    );
  }

  if (RELATIVE_ASSET.test(shell)) {
    throw new Error(
      `${path.relative(projectRoot, shellPath)} references assets with relative URLs. ` +
        `Nested pages such as /privacy-policy/index.html require absolute "/assets/..." paths ` +
        `(do not set a relative "base" in vite.config.ts).`
    );
  }

  return shell;
}

async function writePage(shell, routePath, markup) {
  if (typeof markup !== "string" || markup.length < MIN_MARKUP_BYTES) {
    throw new Error(
      `Route ${routePath} rendered ${markup?.length ?? 0} bytes, which is below the ` +
        `${MIN_MARKUP_BYTES}-byte sanity threshold. Refusing to publish an empty page.`
    );
  }

  // Function form: the markup is inserted literally, so "$&" and friends in the
  // page copy can never be interpreted as replacement patterns.
  const document = shell.replace(
    ROOT_PLACEHOLDER,
    () => `<div id="root">${markup}</div>`
  );

  const outDir = path.join(distDir, routePath.replace(/^\/+/, ""));
  const outFile = path.join(outDir, "index.html");

  await mkdir(outDir, { recursive: true });
  await writeFile(outFile, document, "utf8");

  log(
    `${path.relative(projectRoot, outFile)} (${markup.length} bytes of markup, ` +
      `${document.length} bytes total)`
  );
}

async function main() {
  const shell = await readShell();
  const ssrEntry = await resolveSsrEntry();

  const { renderAll } = await import(pathToFileURL(ssrEntry).href);

  if (typeof renderAll !== "function") {
    throw new Error(
      `${path.relative(projectRoot, ssrEntry)} does not export renderAll().`
    );
  }

  const rendered = renderAll();

  if (!Array.isArray(rendered) || rendered.length === 0) {
    throw new Error("renderAll() returned no routes.");
  }

  for (const { path: routePath, html } of rendered) {
    await writePage(shell, routePath, html);
  }

  log(`prerendered ${rendered.length} route(s)`);
}

try {
  await main();
} catch (error) {
  console.error("\n[prerender] FAILED — build aborted.");
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
} finally {
  // The SSR bundle is a build artifact; it must never reach dist/ or the repo.
  await rm(ssrDir, { recursive: true, force: true });
}
