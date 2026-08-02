---
name: Dev server routing gotcha
description: Why a newly-added Express API route can return HTML (index.html) instead of JSON in this Vite+tsx dev setup
---

# Unmatched /api routes fall through to Vite

In this app the dev server runs Express + Vite together (`server/vite.ts` mounts `app.use("*")` serving `index.html`). There is NO JSON 404 handler for `/api/*`. Any request that does not match a registered Express route falls through to the Vite catch-all and returns `index.html` with `200 text/html`.

**Symptom:** a freshly-added route (e.g. `GET /api/charges`) returns `200 text/html` (HTML page) while neighboring routes return JSON.

**Cause:** the running `tsx` process is stale — it did not pick up the route added in a prior/compressed session, so the route is genuinely not registered in the live process.

**Fix:** restart the `Start application` workflow, then re-test. The route then matches and returns JSON.

**How to apply:** when debugging "my API returns HTML", first compare a known-good neighbor route's content-type; if the new one is `text/html` but the code clearly registers it before the Vite catch-all, restart the workflow rather than hunting for a route-shadowing bug.
