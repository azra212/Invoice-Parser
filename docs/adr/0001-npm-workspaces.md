# 0001 npm workspaces

The original app was one package named `react-example`. The UI imported types from the API folder, and the API served Vite in development.

We split it into `apps/web`, `apps/api`, and `packages/shared`, still on npm. The repo already had `package-lock.json`. pnpm would have been a second toolchain for no gain.

`npm run dev` starts the API and Vite. Vite proxies `/api`. `npm start` still serves `apps/web/dist` from the API so a single Render service can keep working. Compose runs the web image and the API as separate processes.

The API stays on `tsx`. Compiling it to `dist` would mean a second module-resolution setup for a small service. The web build is the artifact that matters.
