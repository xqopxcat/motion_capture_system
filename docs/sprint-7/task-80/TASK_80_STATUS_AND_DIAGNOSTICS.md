# Task 80 — Status and Diagnostics

Available results draw normal arcs/labels. Degraded results preserve their Task 79 number and use reduced opacity/dash. Unavailable, including `stale-pose`, draws neither arc nor label. The renderer does not reinterpret confidence/reason codes.

Per-call bounded diagnostics report requested metrics, rendered arcs/labels, unavailable skips, missing display-landmark skips, frame/session/stale identity skips, degenerate geometry skips and collision-suppressed labels. There is no production per-frame logging or history.
