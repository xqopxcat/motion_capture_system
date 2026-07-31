# Task 73 — Implementation Summary

## Previous behavior

`usePosePipeline` polled on rAF, used a boolean to prevent concurrent detection, and discarded every busy tick. It had no retained newest candidate, explicit frame generation, or session-safe publication contract.

## New flow

1. One producer reports actual video frames through rVFC, or unique media timestamps through rAF fallback.
2. Idle cadence filtering avoids blindly inferring each display refresh.
3. An admitted callback synchronously copies its exact video image to a private canvas paired with its source timestamp.
4. The scheduler starts one inference and retains at most one newest pending canvas.
5. A newer candidate releases and replaces the prior pending canvas and records coalescing.
6. Completion is measured, identity is validated, only a valid latest result is published, then the completed canvas is released and the newest pending candidate starts.
7. Stop/hidden/session rotation/disposal releases pending images and invalidates old asynchronous inference results.

Follow-up adds `capturedVideoFrame.ts` and its deterministic test, and extends scheduler tests for image/timestamp identity and resource ownership. Rendering and persistence files remain unmodified.
