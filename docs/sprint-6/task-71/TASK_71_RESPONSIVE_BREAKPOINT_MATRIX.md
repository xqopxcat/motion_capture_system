# Task 71 — Responsive Breakpoint Matrix

| Range / validation width | Workspace | Details and actions | Media / dialog |
|---|---|---|---|
| Large desktop, ≥1280px / 1440px | Centered, max 1120px; 24px stage padding | Horizontal actions with bounded button width | 16:9 media; generous overlay spacing |
| Desktop/tablet, 768–1279px / 768, 1024px | Fluid width with 28px page gutters | Review metadata may use two columns; actions wrap | No horizontal scroll; dialog max 460px |
| Mobile, 360–767px / 375px | Single column, fluid gutters | Metadata becomes one column; actions stack full width | 16:9 media; two-row playback controls |
| Narrow mobile, ≤359px / 320px | 10px safe gutters; stage uses available edge width | No flex growth; compact type/spacing | Dialog actions stack; overlay text scales and wraps |

## Browser measurements

| Viewport | State | Horizontal overflow | Media ratio | Minimum button target | Notes |
|---:|---|---|---:|---:|---|
| 320×760 | Reviewing | None | 1.778 | 44px | Title input 263px; actions 281px |
| 375×812 | Reviewing | None | 1.778 | 44px | Single-column metadata/actions |
| 768×900 | Ready | None | 1.781 | 48px | Fluid tablet workspace |
| 1024×900 | Saving | None | 1.778 | 44px | Review context and truthful progress retained |
| 1440×1000 | Completed | None | 1.780 | 48px | Workspace capped at 1120px |
| 320×568 | Saving dialog | None | — | 44px | 277×267 dialog fully inside viewport |

Scrollbar width accounts for the small difference between `innerWidth` and document client/scroll width; no page exceeded the viewport.

