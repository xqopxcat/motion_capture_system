# Task 78 — Coordinate-space Policy

1. Use world 3D only when all three required world landmarks are usable.
2. Realtime display may fall back to normalized 2D when all three required 2D landmarks are usable.
3. Formal analysis requires world 3D in the initial registry.
4. Otherwise the result is unavailable.

A result uses one coordinate space for all A–B–C inputs. Mixing 2D and 3D is forbidden. Every available/degraded result records the actual `coordinateSpace`; an unavailable result records the attempted space or `null` when none applies. Fallback is explicit in each registry entry and is never inferred.

Normalized 2D is a camera-plane projection and is not biomechanically equivalent to world 3D. Its realtime result is non-authoritative display feedback. This contract defines selection only; Task 79 owns calculation and Task 83 evaluates implementation profiles.
