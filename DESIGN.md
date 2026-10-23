# DinnerSplit — Design System

## Direction

A candlelit restaurant ledger: the working surface is near-black leather, ink-cream type, and brass; the result is a letterpress paper check laid on the table. The paper is the product artifact — the thing you screenshot, hand over, or pin in the group chat.

The interface refuses the generic "split the bill" card stack: no pastel rounded cards, no gradient hero, no dashboard metrics. The receipt is physical, the builder is drawn like a maître d's ledger, and the numbers do the talking.

## Color

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0b0a08` | Table surface |
| `--panel` | `#12100d` | Ledger panels |
| `--ink` | `#f2eadb` | Primary type |
| `--ink-dim` | `#bcb2a1` | Secondary type |
| `--ink-faint` | `#a19787` | Labels, placeholders |
| `--brass` | `#d9ae68` | Primary action, emphasis, totals |
| `--brass-bright` | `#eccb90` | Hover / highlight |
| `--oxblood` | `#8a3830` | Paid marks, transfer arrows |
| `--sage` | `#a8b89d` | Live / confirmed state |
| `--paper` | `#f3ead8` | Check paper |
| `--paper-ink` | `#17130e` | Check type |
| `--paper-dim` | `#6a604f` | Check secondary type |

The dark page is a committed field, not a theme toggle. The paper check is the only light surface and carries the hierarchy of the result.

## Type

- **Display:** Instrument Serif, 400; italic for the emotional half of a headline ("divided fairly.", "squared."). Never used for body.
- **UI:** Archivo Variable, 400/500/600; sentence case, compact sizes, generous line-height.
- **Data:** DM Mono, 400/500; all money, percentages, seat numbers, timestamps, and micro-labels. Tabular figures by default.

Rules: display headings line-height 0.86–1.0 and tracking −0.035em; body 12–16px; UI labels never below 9px; money always in the mono face.

## Layout

- Shell: 1180px max, 48px gutters (28px on phones).
- Builder: bill amount first, then the table, then the split. Ledger column + 356px sticky tally on desktop; one column and a fixed thumb bar below 1050px.
- The default path is a single big amount, a live equal-share strip, and a next-step button; item-by-item is a quiet text action inside The check.
- Method grid shows three choices by default (Equal, Custom, Percent); By item joins only in item mode.
- Result: intro + 566px paper check side by side; stacked on mobile, intro compressed.
- Section panels are separated by a single hairline and air, not nested cards.
- Touch targets: 44–48px for primary actions, 38px for compact chips on phones.

## Components

- **Step headers:** brass index (`01`), display-serif title, one-line instruction. Numbers follow the fast path: check, table, split.
- **Person rows:** seat number, tonal monogram, borderless name field, quiet remove.
- **Money field:** oversized mono figure over a rule; focus turns the rule brass.
- **Tip chips / method tiles / payer chips:** `aria-pressed` toggles with brass fill or brass border; shared 8px radius language.
- **Tally panel:** oxblood-black leather gradient, brass binder clip, live dot, mono total, per-person lines, single CTA that switches between a brass “Review” and an outlined next-step label (“Add the bill total”, “Add the table”, “Assign every item”, “Finish the split”) which scrolls to the missing input.
- **Quick share strip:** after the amount, an inset brass row shows the equal share (or the exact cent range) so the first useful number appears before names are typed.
- **Paper check:** scalloped top/bottom edges, double rule under the total, dotted guest lines, oxblood `PAID` stamp, mono amounts, tiny uppercase provenance footer.
- **Share dialog:** paper QR card on a dimmed, blurred backdrop; 232px QR; one action.
- **Toast:** paper chip with a check mark, 2.8s.

## Motion

One authored moment: the result check settles onto the table (`translateY(16px) scale(.992)` → rest, 820ms, exponential ease-out). The live tally dot breathes. Panels and headings arrive already visible so the first meaningful paint is not delayed. All motion is disabled under `prefers-reduced-motion`.

## Accessibility

- WCAG AA contrast verified with axe (0 violations across builder, result, and QR dialog at 390px and 1440px).
- Keyboard focus visible on every control; inputs inside framed fields show a brass focus-within border.
- Native `<dialog>` for the QR, with focus return and Escape.
- Landmarks: header, main, aside (tally / mobile bar), footer.
- Inputs labelled; errors announced with `role="alert"` where blocking; result shares are a readable list.
- Minimum 16px input type on phones to avoid iOS zoom.

## Responsive behavior

- ≤1050px: one column; tally becomes the fixed bottom bar with total + review.
- ≤820px: hero stacks; result actions collapse to primary + summary + QR/link.
- ≤640px: panels lose side padding; methods become a single column; inputs are 16px; result intro tightens so the check total is inside the first phone viewport. The thumb bar repeats the total, the equal share, and the next step.
- ≤380px: type scales down; chips compress; no horizontal overflow at 320px.
