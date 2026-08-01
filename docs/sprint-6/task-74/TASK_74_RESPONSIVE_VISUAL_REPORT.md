# Task 74 — Responsive Visual Report

## Browser geometry evidence

The protected route was measured in the local in-app browser. Because authentication redirected Capture to `/login`, these measurements validate the route/login shell, not Capture-stage geometry.

| Viewport | Document width | Horizontal overflow | Visible result |
| --- | ---: | --- | --- |
| 320×900 | 320 | No | sign-in card, wrapped return path, action fits |
| 375×900 | 375 | No | action fits |
| 768×900 | 768 | No | centered bounded card |
| 1024×900 | 1024 | No | centered bounded card |
| 1440×900 | 1440 | No | centered bounded card |

A 320px screenshot was visually inspected: text wrapped, CTA remained inside the card, and no clipping was visible. No browser console warning/error was observed on the tested page.

## Capture-stage evidence

Static/automated validation confirms one responsive workspace, stable media/detail/action regions, no legacy control rows, page `overflow-x: clip`, safe-area padding, long-text wrapping, 320px adjustments, mobile/tablet/desktop breakpoints, bounded controls, dialog mobile layout, `:focus-visible`, and `prefers-reduced-motion: reduce`. Renderer tests cover DPR, resize, mirror and cover-crop projection.

Authenticated Capture screenshots and geometry at the five widths are **Not Available**. Therefore media alignment, title/playback usability, dialog fit while actively protected, and live 16:9 behavior remain physical/manual checklist items.
