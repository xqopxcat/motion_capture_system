# Task 79 — Left-knee Migration

The previous Capture publisher privately calculated normalized-2D 23–25–27 unsigned internal geometry, ignored visibility, removed null samples, and emitted it as `knee_flexion` / `knee-flexion.v1`.

Full formal migration was selected because validated `pose.v1` frames require exactly 33 `landmarks3D` entries with finite coordinates and visibility. The publisher now calls the shared formal engine with `joint-angle.left-knee.internal.v1`, emits `joint-angle-contract.v1`, and uses world 3D plus the approved confidence rule. The private formula was removed.

This is an explicit semantic/identity correction, not a claim that old `knee_flexion` values are equivalent. Successful records with usable world landmarks remain supported; unavailable samples are excluded under current metrics.v1 constraints, and an all-unavailable capture retains deterministic failure behavior.
