# Task 76 — Integration Audit

| Consumer | Current Task 76 state | Remaining owner |
| --- | --- | --- |
| Live Capture | Accepted Raw is transformed into independent Filtered Pose; Task 77 now supplies stabilized output and the overlay still requires Filtered | Task 80 angle renderer; Task 81 Capture integration |
| Skeleton toggle | Display-only; inference, Raw publication, transform, and recording effect do not depend on toggle | Aligned |
| Recording | Collector accepts `RawCanonicalPose` only and runs only in `Recording`; Countdown excluded | Aligned |
| Capture Review | Continues persisted-equivalent Raw draft through current renderer; no stabilization or sync redesign | Task 81 |
| Viewer | Persisted `pose.v1` behavior unchanged | Future Sprint — Viewer & Compare integration |
| Compare | Independent persisted Record behavior unchanged | Future Sprint — Viewer & Compare integration |
| `pose.v1` | Dataset draft/serializer/schema unchanged; no profile metadata | Aligned |
| Metric Series/Summary | Continue consuming the existing Raw dataset artifact path | Task 78 contract; Task 79 computation |
| Left-knee publisher | Existing normalized-2D calculation unchanged | Task 79 |
| Redux/API/backend/storage | No Filtered type, field, reducer, payload, upload, or artifact introduced | Aligned |

Approved remaining sequence: Task 77 — Temporal Stabilization Engine; Task 78 — Joint Angle Metric Contract; Task 79 — Joint Angle Computation Engine; Task 80 — Real-time Angle Overlay Renderer; Task 81 — Capture & Review Integration; Task 82 — Pose Execution Architecture Evaluation / Spike; Task 83 — Realtime & Final Analysis Profile Evaluation / Spike; Task 84 — Physical-device Performance & Quality Validation. Viewer and Compare integration remains a future Sprint.
