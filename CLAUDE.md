# Semli

Monorepo: `apps/mobile` (Expo), `apps/web` (Next.js), `packages/*`, `docs/` (plans; `docs/design-system.md` is the visual source of truth).

## Design rules for anyone touching UI or marketing

- **Never use all-caps eyebrows or overlines.** No `text-transform: uppercase` on section labels, table headers, chips, or "COMING UP"-style eyebrows, in the app, the site, or the docs. It reads as AI-generated template UI. Use sentence case at a smaller size or a muted color instead ("Coming up", "What Semli would add").
- One accent (lavender, allowed in five places only), no gradients, Geist everywhere (Light for the one big number per screen, Regular for titles and text, Medium for pills and primary labels). Pills act, rectangles hold: every action is fully round. Color only as meaning (red behind, green ahead, amber needs input); no tinted cards, no icon tiles, no logo on in-app screens. Decided Oct 19, 2026; full rules in `docs/design-system.md` and the design-system page linked there. See `docs/design-system.md`.
- **Motion comes from the tokens.** Use `springs`, `enter`, `exit`, `layout` from `apps/mobile/src/lib/motion.ts` and the `Press` component for buttons and cards. Never import `Animated` from react-native, never pick your own duration or spring, and give every list row `layout`/`entering`/`exiting`. Loading states are skeletons, not spinners. See `docs/motion.md`.
- **Navigation is native iOS.** Detail screens push with the system header and back chevron; Capture, Create, and Review are full-screen covers with an X; the tab bar is `NativeTabs`. No half-sheet modals for primary flows.
