# Photo sources

The five editorial photos are Unsplash photos under the [Unsplash License](https://unsplash.com/license). Downloaded Oct 20, 2026. The source pages identify each photo as free under that license; no Unsplash+ assets are used. The Plus fireworks image is reused unchanged from the existing app asset.

| File | Used on | Photographer | Source |
|---|---|---|---|
| hero-autumn.jpg | Unused since Oct 21 (the hero is lavender paper now; 2,721 × 2,133, downloaded Oct 20, 2026) | Austin | https://unsplash.com/photos/8wL0dsEsf_g |
| hero-golden.jpg | Home "See the week at a glance" row, under the week card (since Oct 21) | Vadim Fomenok | https://unsplash.com/photos/JhLASVqq1Jg |
| library.jpg | Home "Your syllabus, laid out" row, under the term card (since Oct 21) | Johan Mouchet | https://unsplash.com/photos/PjpRF0LhBB8 |
| cafe-shift.jpg | Home "Your work schedule, updated" row, under the changes card (since Oct 21) | Long Chung | https://unsplash.com/photos/barista-working-behind-a-coffee-counter-H7PLuaYW6UQ |
| campus.jpg | Unused since Oct 21 (the beta card is a grey panel now) | Brelyn Bashrum | https://unsplash.com/photos/MUiv880yORo |
| table.jpg | Unused since Oct 21 (pricing is Free and Plus cards now) | Alexis Brown | https://unsplash.com/photos/omeaHbEFlN4 |
| plus-fireworks.jpg | Plus pricing panel, matching the app paywall | Existing app asset | `apps/mobile/assets/showcase/plus.jpg` |

## Quality review, Oct 20

The café replacement is a 3,200 × 2,133 JPEG, fetched from `https://images.unsplash.com/photo-1774160719797-f1ce9886cca0?auto=format&fit=max&w=3200&q=90&fm=jpg`. The previous work-section photo was a 1,600 × 2,400 portrait of a person studying. The replacement shows an actual café worker, has twice the source width for the full-width background, and retains substantially more detail in desktop 2× crop comparisons. It uses `quality={85}` through Next Image and a 72% horizontal focal point to keep the worker in narrow crops. The new filename avoids reusing the old image-optimization cache key.

Retained hero.jpg (2,000 × 1,333), campus.jpg (2,000 × 1,335), table.jpg (2,000 × 1,333), and library.jpg (1,600 × 2,400). A 3,200-pixel overhead library candidate by Jaykumar Bherwani was visibly grainy at full size, so a larger pixel count was not enough to justify replacing the current photo. Also rejected a soft café video still by Vitaly Gariev and a darker library scene by Zoshua Colah. The hero and pricing images already have enough source pixels for their smaller display slots; no clearly sharper, better-fitting alternative was found.

For future replacements, inspect the native detail and the desktop/mobile cover crops. Do not enlarge a small download and call it a resolution upgrade.

The shared fireworks photo is 900 × 1,200. Its web panel is capped at 440 CSS pixels so the original supports the intended 2× presentation; it is not stretched across a full-width desktop banner.
