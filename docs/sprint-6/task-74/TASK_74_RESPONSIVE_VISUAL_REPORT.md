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

Static/automated validation confirms a camera-first mobile Live stage, a three-control bottom dock, shared video/canvas bounds, safe-area padding, bounded controls, dialog mobile layout, `:focus-visible`, and `prefers-reduced-motion: reduce`. Renderer tests cover DPR, resize, mirror, `contain` letterboxing and `cover` cropping.

Authenticated Capture screenshots and geometry at the five widths are **Not Available**. Therefore corrected media alignment, mobile camera-stage height, bottom-dock ergonomics, title/playback usability and dialog fit remain physical/manual checklist items.
