# Semli

The daily planner for college students. Drop in a syllabus, a work schedule, or a message; Semli reads the dates, shows what changed, and tells you what matters today.

Planning docs live in [docs/](docs/README.md).

## What's here

```
apps/mobile      Expo (React Native) app: iOS and web from one codebase
apps/web         Next.js site: landing page, "try it" box, and the /api/extract route the app calls
packages/tokens  Design tokens (colors, type scale, spacing)
packages/schema  Zod schemas shared by app, web, and API
packages/core    Pure logic: dates, schedule diffing, conflicts, overload, draft/commit planning (unit tested)
packages/extract Claude call that turns text, screenshots, and PDFs into structured items
design/          Logo SVGs and generated icon PNGs
```

Everything the phone stores is on the phone for now. The only server piece is the API route, which needs a Claude API key.

## Run it

Requires Node 20+ and, for the iPhone app, Xcode with an iOS simulator.

```bash
npm install

# 1. API + website
cp apps/web/.env.example apps/web/.env.local   # add your ANTHROPIC_API_KEY
npm run dev:web                                 # http://localhost:3000

# 2. The app (in another terminal)
npm run dev:mobile                              # press i for the iOS simulator, w for the browser
```

On a real phone, open **You** in the app and set the server address to your computer's LAN address (for example `http://192.168.1.10:3000`).

## Check it

```bash
npm test            # core logic and import error tests
npm run typecheck   # every workspace
```
