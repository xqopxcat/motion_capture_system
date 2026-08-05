# Task 80 — Label Layout Policy

Labels round only for display to the nearest whole degree (`0°`, `90°`, `180°`); null is never formatted. Labels do not say flexion or show machine IDs.

The primary anchor lies beyond the arc on the normalized BA/BC bisector. Near 180 degrees, where normalized vectors cancel, a deterministic perpendicular fallback is used. Bounds are clamped inside the Canvas and kept away from the vertex by radius plus profile offset.

Metrics are processed in caller order. A bounded four-direction candidate sequence checks label rectangles against accepted labels. If every allowed candidate collides, the later label is suppressed while its arc remains; diagnostics record suppression. No state persists between frames.
