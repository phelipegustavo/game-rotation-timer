# No build step: the repo is the deployed site

The app is vanilla JavaScript using native ES modules, no frameworks, and the files in the repository are served as-is (GitHub Pages). There is no bundler, transpiler or `npm run build`, so anyone can open the code, change it and deploy without tooling. The domain logic (Time Bank, Timeout, Refill, Rotation, Wins, Standings) is kept free of the DOM and of wall-clock calls, so it can be tested with `node --test` and no other dependencies.

## Consequences

- The service worker's precache list and cache version are maintained by hand in `sw.js`; adding or renaming a file means updating that list and bumping the version.
- Fonts are self-hosted in the repo rather than loaded from Google Fonts, so the app works fully offline on first use.
- Adding a bundler (e.g. Vite) would reverse this decision and needs a superseding ADR.
