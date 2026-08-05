# Task 81 — Runtime / Formal Display Boundary

Live accepts `RuntimeJointAngleResult` from `FilteredRuntimePose`; Review accepts `FormalJointAngleResult` from recorded Raw frames. Task 80 now has a narrow formal entry point that passes formal results into shared internal display fields while its runtime API remains runtime-only. No unsafe cast or provenance rewrite occurs.

Review recomputation is presentation-only: it does not rewrite pose.v1, metrics.v1, summaries or uploads. Runtime results are likewise never recorded or sent to APIs. Task 79 publisher behavior and numeric-series limitations remain authoritative.
