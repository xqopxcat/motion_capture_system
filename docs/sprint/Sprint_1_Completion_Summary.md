# Sprint 1 Completion Summary

## 1. Completed Items

Sprint 1 Capture MVP now includes:

- Camera preview foundation.
- Capture pipeline composition through `useCapturePipeline`.
- Local MediaRecorder recording foundation.
- Capture runtime state alignment.
- Pose Engine boundary and adapter capability model.
- MediaPipe adapter foundation and runtime asset configuration.
- Real-time pose detection wiring through the PoseEngine boundary.
- Skeleton overlay rendering for live capture.
- Runtime pose frame collection during recording.
- In-memory Pose Dataset draft builder.
- Recorded preview skeleton overlay using the Pose Dataset draft.
- Capture UX alignment and stabilization review.

## 2. Current Capture Pipeline Data Flow

Current runtime flow:

```text
CameraPreview video element
  -> useCapturePipeline
  -> usePosePipeline
  -> PoseEngine.detect(video frame)
  -> normalized PoseDetectionResult
  -> live CaptureSkeletonOverlay
  -> usePoseFrameCollection during recording
  -> CapturePoseFrame[]
  -> buildPoseDatasetDraft()
  -> runtime-only Pose Dataset draft
  -> RecordedPosePreview overlay
```

Recorded preview overlay uses the runtime-only Pose Dataset draft frames and syncs them with `video.currentTime`. It does not re-run pose detection.

## 3. Main Files And Modules

Key frontend modules:

- `frontend/src/hooks/useCapturePipeline.ts`
- `frontend/src/hooks/useCameraStream.ts`
- `frontend/src/hooks/useMediaRecorder.ts`
- `frontend/src/features/capture/usePosePipeline.ts`
- `frontend/src/features/capture/usePoseFrameCollection.ts`
- `frontend/src/features/capture/buildPoseDatasetDraft.ts`
- `frontend/src/features/capture/CaptureSkeletonOverlay.tsx`
- `frontend/src/features/capture/renderCaptureSkeleton.ts`
- `frontend/src/features/capture/RecordedPosePreview.tsx`
- `frontend/src/engines/pose/PoseEngine.ts`
- `frontend/src/engines/pose/createPoseEngine.ts`
- `frontend/src/engines/pose/MediaPipePoseEngine.ts`
- `frontend/src/engines/pose/mediaPipeRuntimeConfig.ts`
- `frontend/src/engines/pose/types.ts`

## 4. Runtime-Only Data

The following data exists only in frontend runtime memory:

- Live `MediaStream`.
- Recorded `Blob` and local object URL.
- Current normalized `PoseDetectionResult`.
- Collected `CapturePoseFrame[]`.
- In-memory Pose Dataset draft.

The Pose Dataset draft is not uploaded, persisted, or stored in Redux.

## 5. Known Limitations

- MediaPipe asset strategy is still a development-stage configuration.
- Current runtime config uses external model and wasm asset paths.
- Pose Dataset draft is not a final persisted artifact.
- Recorded preview overlay depends on frames collected during the current browser session.
- Reloading the page clears runtime capture, recording, and pose data.
- Bundle size warning exists because MediaPipe is currently included in the frontend bundle path.

## 6. Not Implemented Yet

The following are intentionally not implemented in Sprint 1:

- Upload.
- Backend API calls.
- Record creation.
- Formal `pose.v1.json` file export or download.
- Metrics Engine.
- Motion Model.
- Angle calculation.
- Full analysis pipeline.
- Persisted Pose Dataset storage.
- Final Record completion flow.

## 7. Recommended Sprint 2 Direction

Recommended next steps:

- Decide and formalize MediaPipe asset strategy: local public assets, pinned CDN, or lazy-loaded assets.
- Add upload and Record creation only after the Capture runtime data contract is confirmed.
- Convert Pose Dataset draft into a validated persisted `pose.v1` artifact when storage/upload work begins.
- Introduce backend record lifecycle integration.
- Add metrics and Motion Model only after Pose Dataset persistence is stable.
- Consider code splitting or lazy loading MediaPipe to address bundle size.
- Add deeper runtime tests for capture hooks if a React hook testing setup is introduced.

## 8. Build And Test Status

Latest verification:

- `npm run test`: passing.
- `npm run build`: passing.

Build currently emits a Vite bundle size warning, but the build succeeds.
