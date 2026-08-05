# Task 79 — Geometry and Numerical Policy

For ordered A–B–C, the engine calculates BA and BC, divides their dot product by the magnitude product, clamps cosine to `[-1, 1]`, applies `acos`, and converts to degrees. It supports homogeneous 2D or 3D vectors and never mixes dimensions, rounds, converts to anatomical flexion, signs, or smooths an angle.

Minimum vector magnitudes are `1e-8` normalized-coordinate units and `1e-6` world meters. Magnitudes at or below epsilon yield `zero-length-vector`. Nonfinite coordinates/dimensions yield `nonfinite-coordinate`. Valid results remain unrounded in inclusive 0–180; valid 0 is preserved and invalid results never become `NaN` or zero.
