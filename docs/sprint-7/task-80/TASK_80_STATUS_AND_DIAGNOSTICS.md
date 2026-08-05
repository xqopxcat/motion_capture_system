# Task 80 — Status and Diagnostics

Available results draw arcs with profile opacity 0.96 and labels with profile opacity 1. Degraded results preserve their Task 79 number while both arc and label background/text use profile opacity 0.58; the arc is additionally dashed. Opacity is reapplied per metric so a degraded result cannot affect the next available result. Unavailable, including `stale-pose`, draws neither arc nor label. The renderer does not reinterpret confidence/reason codes.

Per-call bounded diagnostics report requested metrics, rendered arcs/labels, unavailable skips, missing display-landmark skips, frame/session/stale identity skips, degenerate geometry skips and collision-suppressed labels. There is no production per-frame logging or history.
