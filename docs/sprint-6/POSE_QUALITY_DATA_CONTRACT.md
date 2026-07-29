# Sprint 6 — Pose Quality Data Contract

| Item | Value |
| --- | --- |
| Task | 66 — Capture Contract and Implementation Plan |
| Status | Approved |
| Scope | Data authority and consumer policy; no filtering implementation |
| Evidence date | 2026-07-30 |

## 1. Purpose

This document separates immutable pose evidence from runtime visualization
quality. It prevents a future smoothing implementation from silently replacing
the authoritative Pose Dataset or changing Metric meaning.

## 2. Contracted pipeline

```text
MediaPipe Result
    |
    v
Canonical Mapping
    |
    +--> Raw Canonical Pose ----------------> pose.v1.json
    |
    +--> Runtime Quality Pipeline
             |
             +--> Confidence Gate
             +--> Outlier Rejection
             +--> Temporal Filter
                       |
                       v
                Filtered Runtime Pose
```

The Runtime Quality Pipeline is an approved boundary, not an implementation in
Task 66.

## 3. Definitions

### 3.1 Raw MediaPipe Result

The direct engine-provider output for one inference. It may contain normalized
2D landmarks, world 3D landmarks, visibility, provider-specific collection
shape, and provider timing. It is not a persisted domain object and must not
leak into UI or API contracts.

### 3.2 Raw Canonical Pose

The immutable, engine-normalized platform representation created by canonical
mapping:

- platform landmark IDs and names;
- all 33 MediaPipe Pose landmarks for the current adapter;
- normalized 2D coordinates;
- world 3D coordinates when available;
- visibility;
- monotonic frame/timestamp identity.

For the current Capture pipeline, Raw Canonical Pose is collected during the
official recording interval and serialized to `pose.v1.json`.

### 3.3 Filtered Runtime Pose

A derived, replaceable runtime view of Raw Canonical Pose. It may apply
confidence gating, implausible-displacement rejection, missing-landmark policy,
and a versioned temporal filter.

Filtered Runtime Pose:

- never mutates its Raw Canonical Pose input;
- retains landmark identity and time association;
- is not `pose.v1.json`;
- is not authoritative evidence;
- must carry a runtime profile/filter identity in memory once implemented;
- may be discarded and reproduced.

### 3.4 Production Display Skeleton Profile

A render configuration selecting which canonical landmarks and connections are
shown. It does not delete landmarks from Raw Canonical Pose.

The initial production profile should emphasize body analysis joints:
shoulders, elbows, wrists, hips, knees, ankles, and approved foot/head anchors.
Coarse eye/mouth and thumb/index/pinky points are not presented as complete
face or finger tracking.

## 4. Authority decision

**Decision:** authoritative `pose.v1.json` is serialized only from Raw Canonical
Pose collected during the official recording interval.

Consequences:

- all 33 canonical landmarks remain stored;
- filtering never silently overwrites persisted coordinates;
- future filter versions can be evaluated or replayed against the same evidence;
- a display-quality change does not require `pose.v1` schema replacement;
- Raw Pose remains immutable as required by the data model and storage specs.

Countdown pose samples and live readiness samples are not part of
`pose.v1.json`.

## 5. Consumer/input policy

| Consumer | Contracted input | Authority/notes |
| --- | --- | --- |
| `pose.v1.json` serialization | Raw Canonical Pose | Authoritative immutable artifact |
| Live Capture skeleton | Filtered Runtime Pose | Until filtering exists, the quality pipeline is an identity transform |
| Live Capture angle overlay | Filtered Runtime Pose → Motion Model → approved Metric Definition | Display-only live value; no direct canvas calculation |
| Recorded Capture Preview overlay | Raw `pose.v1`-equivalent frames transformed by the approved visualization-quality profile | Must use the same display policy as Viewer |
| Viewer overlay | Persisted raw `pose.v1` transformed by the approved visualization-quality profile | Must not depend on a captured filtered artifact in Sprint 6 |
| Compare overlay | Same Viewer policy independently per Record | Compare synchronization remains feature-owned |
| Metric Series | Raw Canonical Pose → approved analysis preprocessing policy → Motion Model → versioned Metric Definition | Never consumes the incidental live display output |
| Metric Summary | Derived from the same Metric Series/definition version | Existing compatibility dimensions remain authoritative |
| Debug overlay | May show raw and filtered results explicitly | Must be labelled and excluded from normal product claims |

## 6. Metric meaning and preprocessing

Metrics must not call an unnamed smoothing helper or consume whatever landmarks
the live overlay happens to display.

The authoritative calculation path is:

```text
Raw Canonical Pose
    -> approved analysis preprocessing profile
    -> Motion Model
    -> versioned Metric Definition / Calculator
    -> Metric Series
    -> Metric Summary
```

An analysis preprocessing profile may later include a versioned filter, but
that is part of the metric calculation definition and reproducibility contract,
not the live visualization filter. Changing that policy requires a new
calculation/metric definition version where results may differ.

The current production publisher's direct 2D left-knee calculation is an
implementation gap against the formal Motion Model/Metrics Engine boundary. It
must be preserved for Sprint 5 compatibility until a separately approved task
replaces it; Task 66 does not refactor it.

## 7. Filter metadata and versioning policy

### 7.1 Approved Sprint 6 / Sprint 7 decision

- Filtered Runtime Pose is runtime-only for Sprint 6 and Sprint 7.
- No filtered landmark coordinates are persisted.
- No filter fields are added to `pose.v1`.
- No filtered-pose artifact is created.
- Filtered pose is not stored in Redux or PostgreSQL.
- Runtime filter identity/configuration is kept in the runtime render/quality
  profile once filtering is implemented.
- Metric preprocessing identity belongs to the versioned metric calculation
  contract and existing `metricDefinitionVersion` compatibility semantics.

### 7.2 Reproduction policy

Capture Preview, Viewer, and Compare must call the same shared pose-quality and
Visualization Engine boundaries for a given application release. Capture may
not retain a private renderer/filter with different semantics.

This approved policy guarantees consistency within the current application
release. Exact historical reproduction of the visualization profile used on
capture day is not required for Sprint 6 or Sprint 7. Future releases may render
old raw pose with an improved shared visualization profile.

Exact historical reproduction is deferred. Future options remain:

1. persist `visualizationProfileVersion` / `filterProfileVersion` as additive
   Record/artifact metadata without changing `pose.v1`; or
2. create a future versioned derived-pose artifact while keeping raw
   `pose.v1` authoritative.

Neither option is part of Sprint 6 or Sprint 7.

## 8. Preview, Viewer, and Metric consistency

- Preview and Viewer both align pose frames to video using the same timestamp
  interpretation.
- Preview and Viewer use the same Production Display Skeleton Profile.
- A live angle label uses the same Metric ID, unit, coordinate convention,
  side, and calculation definition as the corresponding Viewer/Metric Series
  value.
- A live value may be marked provisional because it uses a runtime display
  profile. It must not be persisted as the authoritative Metric Series unless
  it passed the approved analysis pipeline.
- Low-confidence or unavailable inputs yield an unavailable value; the UI must
  not substitute zero or hold a stale numeric angle without an explicit,
  bounded missing-data policy.
- Visualization Engine only renders supplied pose/metric values. It does not
  calculate angles or run filters.

## 9. Current implementation alignment

Current behavior:

- MediaPipe results are normalized to platform-owned 2D/3D arrays.
- official capture collection copies these arrays into a draft;
- `buildPoseDatasetV1` serializes all 33 landmarks;
- live and recorded Capture renderers consume unfiltered landmarks directly;
- Viewer uses the shared Visualization Engine, but Capture uses a separate
  Capture-specific renderer;
- publisher metrics calculate a raw 2D left-knee angle directly.

Therefore Task 66 documents the target boundary but does not claim that filtered
runtime pose, shared Capture visualization, or formal metric preprocessing
already exists.

## 10. Explicit non-goals

- No EMA, One Euro Filter, Kalman filter, interpolation, or outlier algorithm.
- No Worker or new Pose Engine.
- No angle calculation or label renderer.
- No Pose Dataset schema change.
- No landmark deletion.
- No filtered derived artifact.
- No automatic update to existing Design Docs.

## 11. Approved decisions

1. Authoritative `pose.v1.json` is serialized from immutable Raw Canonical Pose
   and retains all 33 landmarks. Readiness/countdown samples are excluded.
2. Filtered Runtime Pose is derived, non-authoritative, and runtime-only for
   Sprint 6 and Sprint 7.
3. Current-application-release consistency is sufficient: Capture Preview,
   Viewer, and Compare use the same shared visualization-quality and Production
   Display Skeleton policy within a release.
4. Formal metrics use Raw Canonical Pose → versioned analysis preprocessing →
   Motion Model → versioned Metric Definition/Calculator → Metric Series →
   Metric Summary.
5. Live display filtering and formal analysis preprocessing remain separate.
   Metric output changes require versioned analysis/metric semantics.
6. Preview and Viewer should migrate atomically to a new shared visualization
   profile; a private Capture-only filter is not accepted.

## 12. Deferred decisions

- Exact historical visualization reproduction is deferred beyond Sprint 7.
- Persisted visualization/filter profile metadata is deferred.
- A versioned derived-pose artifact is deferred and may be reconsidered only if
  later performance or reproducibility evidence requires it.

## 13. Task 66 declaration

This task defines contracts only. It does not implement smoothing, a runtime
quality pipeline, Worker inference, live angles, or a new artifact.
