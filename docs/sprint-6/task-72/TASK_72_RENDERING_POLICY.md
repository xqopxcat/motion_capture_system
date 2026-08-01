# Task 72 — Rendering Policy

## Pipeline

1. Clear according to caller ownership.
2. Reject missing/stale pose.
3. Index landmarks without mutation.
4. Validate confidence/presence/coordinates.
5. Draw approved connections when both endpoints pass.
6. Draw approved joints.
7. Draw Viewer/Compare selection highlight when the selected approved joint passes.

Capture's compatibility wrapper delegates to the shared production renderer. Viewer and Compare continue through `VisualizationEngine → renderSkeletonLayer`, which delegates to the same renderer and then applies existing selection highlighting.

## Viewport and DPR

Manual acceptance correction: Capture Live and Recorded Review pass actual source dimensions and the `contain` fit policy into shared projection. Normalized points map into the rendered media content rectangle, including letterbox offsets. Canvas backing dimensions remain CSS size × DPR exactly once.

| CSS viewport width | Viewport scale | Joint radius CSS | Connection width CSS |
|---:|---:|---:|---:|
| 320/375px | Lower clamp 0.78 | 3.51px | 2.34px |
| 768px | ~1.07 | ~4.8px | ~3.2px |
| 1024px | ~1.42 | ~6.4px | ~4.3px |
| 1440px workspace (1120px) | Upper clamp 1.45 | 6.53px | 4.35px |

Configured hard bounds are 3–7 CSS px for radius and 2–5 CSS px for width. Backing values equal CSS values × DPR exactly once.

## Browser QA

At 320, 375, 768, 1024 and 1440px the temporary renderer harness reported 1.778 media ratio and no horizontal overflow. Canvas backing dimensions matched displayed size × measured DPR. A 320px visual inspection confirmed readable joint shapes/dashes; contrast inspection led to the center-only outline refinement.

## Performance policy

- No new requestAnimationFrame loop.
- Profile is a module-level singleton.
- No per-landmark React state.
- Live stale policy uses one replaceable timeout.
- Resize handling uses ResizeObserver and redraws only on resize.
- Recorded Review keeps its existing single playback synchronization loop.
