# Kill the spinner that never stops in the admin area

The spinning circle you see everywhere in the admin site does not come from the admin pages themselves. A browser check of the admin dashboard (loaded fresh) found no spinner in the page at all — everything renders and finishes loading. The spinner only appears when you reach the admin area after first visiting a public page, which points at the GoHighLevel chat widget: it injects an Ionic loading overlay (`ion-loading`, brand red) plus its own custom elements into the page, and the current cleanup runs only once when the route changes.

Because the widget's JavaScript is already running by then, it can re-create that overlay after the cleanup pass, so a stray red spinner stays on screen on top of the admin UI even though all data has loaded.

## What will change

- On excluded routes (admin, worker, account, booking, contact, etc.) the widget teardown becomes continuous instead of one-shot: any widget element or loading overlay the already-loaded widget script re-creates is removed immediately.
- A safety CSS rule keeps the widget and its loading overlays hidden while you are on those routes, so nothing can flash on top of the admin UI even for a moment.
- The widget is still fully available on public pages; nothing about the customer-facing chat experience changes.
- First step of the work is a confirmation run in the browser (public page, then navigate into the admin area) to verify the leftover overlay is exactly what you are seeing, then the fix, then the same run again to confirm the screen is clean.

If that run shows the leftover overlay is not the cause, I will report what the actual element is before changing anything else.

## Technical notes

- `src/components/GhlChatWidget.tsx`: replace the single `removeWidget()` call on excluded paths with a `MutationObserver` on `document.body` that re-runs the removal (debounced via `requestAnimationFrame`), disconnected on cleanup / when leaving the excluded route.
- Extend the removal selector set to cover the widget's Ionic shell (`ion-loading`, `ion-backdrop`, `ion-app`, `[id^='lc_']`) and any injected `iframe[src*='leadconnectorhq']`.
- Add a scoped style tag (injected only while on an excluded path, removed on exit) that hides those selectors, using existing token-based styling conventions — no new colors.
- No backend, schema, or admin component changes.
