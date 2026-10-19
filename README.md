# Dayli

Your life, already organized. Send Dayli a work schedule, a syllabus, or a message; it reads the dates, shows what changed, and puts your week in one calm list.

Planning docs live in [docs/](docs/README.md).

## What's here

```
apps/mobile      Expo (React Native) iPhone app
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

# 2. iPhone app (in another terminal)
npm run dev:mobile                              # then press i for the iOS simulator
```

On a real phone, open **You** in the app and set the server address to your computer's LAN address (for example `http://192.168.1.10:3000`).

## Check it

```bash
npm test            # core logic tests
npm run typecheck   # every workspace
```
