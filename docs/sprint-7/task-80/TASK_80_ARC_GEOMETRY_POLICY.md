# Task 80 — Arc Geometry Policy

Projected A–B–C points use `projectProductionSkeletonPoint()`, including mirror, contain/cover and source-viewport offsets. Directions use `atan2`; the positive angular difference is normalized to one turn and the smaller span (at most π) is selected deterministically. Mirroring changes projected directions but preserves unsigned meaning.

Radius is `clamp(min(|BA|, |BC|) * 0.28, 14, 42 CSS px)` converted through DPR. Degenerate/nonfinite projected vectors suppress the metric safely. A span near zero suppresses the arc to prevent Canvas full-circle behavior while retaining a valid numeric label; 180 degrees remains a half circle. No metric value is inferred from projected geometry.
