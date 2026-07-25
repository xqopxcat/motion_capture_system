# Task 64 Review Checklist

- [x] Capture creates a persistent owned Record.
- [x] Browser produces Video, pose.v1, Metric Series, Metric Summary, and Thumbnail.
- [x] Browser computes and sends SHA-256 and exact file sizes.
- [x] Four real signed upload URL and complete route families are orchestrated.
- [x] Signed PUT sends the signed Content-Type and checksum metadata header.
- [x] Finalization follows Task 63 and navigates only after Ready.
- [x] Upload/finalization progress and failures are visible.
- [x] Partial retry does not silently recreate completed artifacts.
- [x] No token or signed URL is stored in localStorage.
- [x] Record List, Viewer, Annotation, Compare, and Dashboard use persisted APIs.
- [x] Viewer runtime local-demo/mock URL/annotation fallbacks are removed.
- [x] Unit-test fixtures remain isolated and maintainable.
- [x] Development auth remains explicitly environment-guarded.
- [x] Records UI supports confirmed deletion and visible cleanup failure.
- [x] Retryable lifecycle failures use the Task 63 retry endpoint.
- [x] Frontend tests and production build pass.
- [x] Backend regression suite passes.

Reviewer decision: **Task 64 implementation approved. Task 65 physical-camera
E2E completed, including real GCS upload, Viewer navigation, persisted
duration/FPS, downstream consumers, and owned deletion cleanup.**
