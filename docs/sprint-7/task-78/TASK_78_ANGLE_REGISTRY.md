# Task 78 — Angle Registry

All definitions prefer world 3D, permit normalized 2D only for realtime display, require world 3D for formal analysis, use degrees/0–180, minimum input confidence, and `unsigned-internal-angle`.

| Metric ID | Label | Side / joint | A–B–C MediaPipe landmarks | IDs |
| --- | --- | --- | --- | --- |
| `joint-angle.left-knee.internal.v1` | Left knee internal angle | left / knee | left hip–left knee–left ankle | 23–25–27 |
| `joint-angle.right-knee.internal.v1` | Right knee internal angle | right / knee | right hip–right knee–right ankle | 24–26–28 |
| `joint-angle.left-hip.internal.v1` | Left hip internal angle | left / hip | left shoulder–left hip–left knee | 11–23–25 |
| `joint-angle.right-hip.internal.v1` | Right hip internal angle | right / hip | right shoulder–right hip–right knee | 12–24–26 |
| `joint-angle.left-ankle.internal.v1` | Left ankle internal angle | left / ankle | left knee–left ankle–left foot index | 25–27–31 |
| `joint-angle.right-ankle.internal.v1` | Right ankle internal angle | right / ankle | right knee–right ankle–right foot index | 26–28–32 |
| `joint-angle.left-elbow.internal.v1` | Left elbow internal angle | left / elbow | left shoulder–left elbow–left wrist | 11–13–15 |
| `joint-angle.right-elbow.internal.v1` | Right elbow internal angle | right / elbow | right shoulder–right elbow–right wrist | 12–14–16 |
| `joint-angle.left-shoulder.internal.v1` | Left shoulder internal angle | left / shoulder | left elbow–left shoulder–left hip | 13–11–23 |
| `joint-angle.right-shoulder.internal.v1` | Right shoulder internal angle | right / shoulder | right elbow–right shoulder–right hip | 14–12–24 |

The ankle distal reference is explicitly foot index, not heel. Optional trunk metrics are excluded because no reference axis/construction has yet been approved.

The source registry is immutable and validated once at module initialization. Lookup/list helpers return readonly definitions and deterministic `null` for unknown typed lookup results.
