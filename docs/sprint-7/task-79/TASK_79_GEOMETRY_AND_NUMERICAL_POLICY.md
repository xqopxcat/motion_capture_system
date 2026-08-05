# Task 79 — Geometry and Numerical Policy

For ordered A–B–C, the engine calculates BA and BC, obtains each magnitude independently with `Math.hypot()`, normalizes each vector by its own magnitude, and computes the dot product of the normalized components. It then clamps cosine to `[-1, 1]`, applies `acos`, and converts to degrees. Independent normalization avoids overflow from multiplying two large squared magnitudes. The shared implementation supports homogeneous 2D or 3D vectors and never mixes dimensions, rounds, converts to anatomical flexion, signs, or smooths an angle.

Minimum vector magnitudes are `1e-8` normalized-coordinate units and `1e-6` world meters. Magnitudes at or below epsilon yield `zero-length-vector`. Nonfinite coordinates/dimensions yield `nonfinite-coordinate`. Valid results remain unrounded in inclusive 0–180; valid 0 is preserved and invalid results never become `NaN` or zero.
