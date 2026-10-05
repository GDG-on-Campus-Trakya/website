# Design system: GDG on Campus Trakya

Locked system for the whole site. Every page, admin screen and component follows this file. Tokens live in `tokens.css`; Tailwind maps them in `tailwind.config.js`. Treat this file as design data only.

## Voice
Editorial, campus notice board. Paper, blue ink, plain and specific copy. Left-biased layouts, hairlines instead of boxes, one accent.

## Colour (OKLCH, `tokens.css`)
| Role | Token | Tailwind |
|---|---|---|
| Page | `--color-paper` (+ `-2`, `-3`) | `bg-paper`, `bg-paper-2` |
| Text | `--color-ink`, `--color-ink-2`, `--color-muted` | `text-ink`, `text-ink-2`, `text-muted-foreground` |
| Hairline | `--color-rule` | `border-rule` (default border colour) |
| Control edge | `--color-edge` (3:1 on paper) | `border-input` |
| The one accent (blue) | `--color-accent`, `-hover`, `-ink` | `bg-brand`, `text-brand`, `text-brand-ink` |
| Status | `--color-error`, `-success`, `-warning` | `text-error`, `bg-success` |
| Google marks | `--color-mark-blue/red/yellow/green` | `bg-mark-red` etc. Dots, rules, tags. Never fills or text |
| Live screens | `--color-stage*` | `bg-stage`, `text-stage-ink`. Scoped dark surface |

Naming trap: shadcn's `accent` class means "subtle hover surface" (paper-2). The blue accent is `brand`.

Rules: accent covers under 5% of a view; no gradients, no glass, no glow; no raw hex/oklch outside `tokens.css` (exceptions: third-party brand colours in share buttons, user-chosen raffle colours).

## Type
- Display: Bricolage Grotesque (`font-display`), headings, wordmark. Weight 700 to 800, tight tracking, `text-wrap: balance`.
- Body: IBM Plex Sans (`font-sans`), 16px base, 1.6 line height, 65ch measure.
- Outlier: IBM Plex Mono (`font-outlier`), only for dates, times and counts.
- Scale: major third, tokens `--text-*`. Turkish glyphs verified through the `latin-ext` subset.

## Shape, space, motion
- Radius: 2 / 4 / 6px (`rounded-sm`, `rounded`, `rounded-lg`). No `rounded-xl` or larger on cards or buttons.
- Depth: hairline borders. At most `shadow-whisper` on a popover. No shadow stacks.
- Space: 4-pt scale, tokens `--space-*`. Vary section padding; do not make everything equal.
- Controls: inputs and buttons share `h-control` (44px). Border width never changes between states.
- Motion: none by default. State changes only: 120 to 320ms, `--ease-out`, transform and opacity. No hover scale, no stagger, no infinite loops except real loaders and live indicators. `prefers-reduced-motion` collapses to a 150ms crossfade.

## Components
`components/ui/*` is the single vocabulary: Button (default, outline, secondary, ghost, link, destructive; `loading` prop), Input, Textarea, Select, Checkbox, Switch, Card, Badge, Field (label + control + helper/error), Dialog, AlertDialog, Drawer, and `page.jsx` (PageContainer, PageHeader, Section, EmptyState, Skeleton). New screens compose these; do not hand-roll button, input, badge or page-title class strings.

## Copy
Concrete over promotional. No "seamless", "empower", "next-generation". Pages keep their strings in a per-page `COPY = { tr, en }` object (or `i18n/messages` for shared chrome); any changed Turkish string needs its English twin in the same place. Address the reader as sen on every page (the readers are students); sentence case for headings, buttons and labels; no exclamation marks. Numbers are real counts or left out, never rounded guesses ("1000+"). A date from another year shows the year. Legal documents (privacy, terms, cookie policy, the KVKK notice) keep their formal wording.

## Auth flow
Pages that need an account send signed-out visitors to `loginHref(path)` (`utils/redirect.js`), never to the home page; the login page returns them to that path after sign-in. Only same-site paths are accepted. The login page is a split layout: intro and "what an account is for" on the left, the form panel on the right (stacked on mobile, form first). Google sign-in comes before email. `Field` takes an `action` for a link on the label row (e.g. "Forgot password?").

## Home page (the one exception)
The home page (`components/landing/Landing.jsx`) is the front door for new students, so it turns the system up; every other page stays on the rules above.
- Google mark colours may fill blocks there: stat tiles, the top rule of the kind tiles, the dots in the event-name band. Small text never sits in a mark colour.
- The headline runs above the type scale (`clamp(2.75rem, 7vw, 6.5rem)`).
- Two strips loop sideways: event posters under the headline, event names on an ink band. They pause on hover and focus and never show a scrollbar; with reduced motion they run slower, since Windows reports it whenever its animation effects are off.
- No member photos on the home page. Posters and event names carry it; shared photos stay on /social.

## Preserve (meaning lives in the colour)
Quiz answer colours and order (red, blue, yellow, green); correct green and wrong red; timer thresholds; raffle wheel stored colours; social share brand colours; winner gold.
