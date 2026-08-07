# Task 84 Blocker Remediation Summary

本次修改三個confirmed Desktop blockers：CameraPreview與overlay共用front/rear mirror policy；runtime world geometry退化時嘗試normalized-2D fallback並以單Canvas layer integration覆蓋四toggle組合；thumbnail preparation改成不漏接loadeddata/seeked，並對pose/metrics/thumbnail加入bounded dev failure code。

涉及frontend camera presentation、Capture overlay、Task79 realtime fallback、publisher thumbnail preparation、diagnostics及tests。沒有交換MediaPipe左右identity、沒有改formal world-3D policy、pose.v1、metrics.v1、backend/storage schema或safe end-user backend detail。

Physical status：三個原始Desktop findings仍是實際blockers；code remediation完成但rerun pending。其他Desktop未判定，Android/iOS not-run。Sprint 7 remains open；Task 84未完成。

Desktop diagnostics confirmed that inference succeeded while every selected knee result was unavailable because required landmarks were below the approved confidence boundary. Save had incorrectly treated an empty formal-angle result as fatal. Metrics completion now accepts an explicit empty summary, so video, pose.v1, thumbnail, and an empty metrics.v1 analysis can still be persisted without fabricating values. Capture and Review select the complete joint-angle registry; the registry now includes bilateral wrist internal angles using elbow–wrist–index triplets in addition to bilateral shoulder, elbow, hip, knee, and ankle metrics. Physical-device rerun remains required.

Recorded Review cadence remediation: playback now resolves the latest recorded Pose frame whose timestamp is at or before the video time and holds it until the next recorded Pose timestamp. This prevents a low inference cadence or a 100–366 ms recorded frame gap from alternating between a valid frame and `null`; seeking still resolves deterministically and no future Pose frame is shown early.

Live responsiveness remediation: the physical diagnostic reported only 7.4 camera/inference publications per second and visible tracking delay. Camera acquisition now requests an ideal 30 FPS without a hard minimum that could reject constrained devices. The production One Euro profile changes from `minCutoff=1.2/beta=0.08` to `minCutoff=2.0/beta=0.3`, retaining causal filtering while reducing slow-motion and high-velocity following delay. This is a Task 84 parameter correction based on physical observation; rerun evidence is still required and jitter/latency must both be recorded.
