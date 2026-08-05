# Task 78 — Joint Angle Contract

Contract version: `joint-angle-contract.v1`.

An angle is an ordered triplet A–B–C: A is proximal/reference, B is the vertex joint, and C is distal/reference. Its meaning is the unsigned internal angle between `BA = A - B` and `BC = C - B`, conceptually `acos(clamp(dot(BA, BC) / (|BA| * |BC|), -1, 1))`. Task 78 defines this geometry but adds no production calculator.

Results use degrees in the inclusive normal range 0–180. A valid geometric 0 degrees is numeric zero. Missing/unusable input and zero-length vectors are unavailable with `valueDegrees: null`; zero and `NaN` are never substitutes.

All initial metrics are internal geometric angles, not signed orientation, normalized score, or anatomical flexion. In particular, the knee value is not called flexion because anatomical flexion may require `180 - internalAngle` plus an explicit anatomical convention.

Machine identity is the stable metric ID plus `joint-angle-contract.v1`. A landmark triplet, coordinate meaning, sign/geometric convention, or anatomical interpretation change requires a new `.vN` metric ID. Display-label-only changes do not.
