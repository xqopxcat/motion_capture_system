# Sprint Roadmap Clarification

| Item | Value |
| --- | --- |
| Document | SPRINT_ROADMAP_CLARIFICATION.md |
| Status | Draft |
| Purpose | Clarify MVP implementation sequencing without changing the original high-level roadmap |
| Owner | MengJu Lee |
| Related Docs | 01_PROJECT_OVERVIEW.md, 02_PRODUCT_SPEC.md, 04_ANALYSIS_PIPELINE_SPEC.md, 12_API_SPEC.md, 19_BACKLOG.md, 20_AGENTS.md |

---

## 1. Purpose

This document clarifies the implementation sequence for the Motion Capture Platform MVP.

The existing high-level roadmap remains valid:

```text
Sprint 0 — Foundation
Sprint 1 — Capture
Sprint 2 — Viewer
Sprint 3 — Compare
Sprint 4 — Dashboard
```

However, the MVP also requires several supporting modules that are not explicitly positioned in the high-level roadmap:

- Authentication
- Record / Upload Persistence
- Record Management
- Annotation

This document does not replace the approved Design Docs. It only adds implementation sequencing clarity so that AI agents and developers do not accidentally merge unrelated work into the wrong sprint.

---

## 2. Clarification Principle

The high-level roadmap describes product capability milestones.

The clarified implementation sequence describes engineering dependencies.

These two layers should be understood separately:

```text
High-level Product Roadmap
    = what major product capability each sprint is about

Implementation Sequencing
    = what supporting work must be inserted so the MVP can actually function end-to-end
```

The purpose of this clarification is to prevent scope drift such as:

- Putting Upload / Record persistence into Sprint 2 Viewer mainline
- Putting Compare into Viewer
- Putting Annotation CRUD into early Viewer foundation
- Delaying Authentication until after ownership-sensitive APIs are implemented
- Building Record List before persisted Records exist

---

## 3. High-Level Roadmap Remains Unchanged

The original roadmap remains:

```text
Sprint 0 — Foundation
Sprint 1 — Capture
Sprint 2 — Viewer
Sprint 3 — Compare
Sprint 4 — Dashboard
```

This clarification does not rename Sprint 2.

Sprint 2 is still Viewer.

Sprint 3 is still Compare.

Sprint 4 is still Dashboard.

---

## 4. Clarified MVP Implementation Sequence

### Sprint 0 — Foundation

Status: Completed

Purpose:

Build the repository and application foundation.

Includes:

- Monorepo structure
- Frontend app shell
- Backend app shell
- Docker baseline
- Route shell
- RTK Query base setup
- Redux store baseline
- Backend health check
- README / startup instructions

Out of scope:

- Capture feature logic
- Viewer feature logic
- Compare feature logic
- Dashboard feature logic
- Production Google OAuth
- Real GCS integration

---

### Sprint 1 — Capture Foundation

Status: Completed

Purpose:

Build the browser capture foundation.

Includes:

- Camera preview
- Recording
- MediaRecorder integration
- Pose detection
- Skeleton overlay
- Capture UI foundation
- Runtime pose draft generation

Out of scope:

- Persisted Record creation
- Signed URL upload
- Record finalization
- Full Viewer replay
- Compare
- Dashboard

---

### Sprint 2 — Viewer Foundation

Purpose:

Build the Viewer foundation using local / exported artifacts.

Canonical Sprint 2 goal:

```text
Viewer foundation can replay video + pose.v1 skeleton from a local/exported artifact boundary.
```

Sprint 2 should prove that the Viewer can consume a stable local artifact boundary before introducing full persistence.

Tasks:

```text
Task 19 — Sprint 2 Viewer Scope Lock
Task 20 — Pose Dataset Export / Validation Boundary
Task 21 — Viewer Page Foundation
Task 22 — Playback Controller + Timeline
Task 23 — Skeleton Replay
```

In scope:

- `/records/:recordId` Viewer foundation
- Local / exported video replay boundary
- Local / exported `pose.v1.json` loading boundary
- Pose Dataset export / validation
- Controlled VideoPlayer foundation
- Controlled Timeline foundation
- Playback state boundary
- Frame navigation foundation
- Skeleton replay through SkeletonCanvas / Visualization Engine
- Minimal MetricPanel display only if metric values already exist

Out of scope:

- Upload pipeline
- Create Record API implementation
- Signed URL upload
- Artifact complete endpoints
- Record finalization
- Record List
- Compare
- Dashboard
- Full Annotation CRUD
- Backend API contract changes
- Official frontend storage path generation

Notes:

- Pose Dataset and Metric Series must remain runtime / loader memory only.
- They must not be stored in Redux.
- Visualization Engine remains render-only.
- VideoPlayer, Timeline, PlaybackControls, and SkeletonCanvas must remain within their documented responsibility boundaries.

---

### Sprint 2.5 — Record Persistence & Management Bridge

Purpose:

Bridge local Viewer artifacts into persisted Records and basic Record Management.

This sprint connects Capture output to persisted backend resources and allows users to open saved Records from a Record List.

Tasks:

```text
Task 24 — Record Creation Contract
Task 25 — Signed URL Upload Contract
Task 26 — Artifact Complete Endpoints
Task 27 — Metric Summary Persistence Contract
Task 28 — Record Finalization
Task 29 — Viewer Loads Ready Record
Task 30 — Record List Basic
Task 31 — Record Card / Thumbnail / Status
Task 32 — Open Viewer from Record List
```

In scope:

- Create Uploading Record
- Request signed upload URLs
- Upload required artifacts
- Complete artifact upload endpoints
- Persist Metric Summary
- Finalize Record as Ready or Failed
- Load Viewer from a Ready Record
- Basic `/records` Record List
- Record Card
- Thumbnail display
- Status display
- Open Viewer from Record List

Required persisted artifacts / data:

- Video
- Pose Dataset
- Metric Series
- Metric Summary
- Thumbnail
- Record metadata

Out of scope:

- Compare
- Dashboard trends
- Full Annotation CRUD unless explicitly moved earlier
- Advanced search / filter / sort beyond basic Record List needs
- Organization / sharing / multi-user collaboration

Notes:

- Frontend must not invent official storage paths.
- Official storage paths are generated and validated by Backend Storage Layer.
- Upload completion must go through API complete endpoints.
- Record can become Ready only after required artifacts and Metric Summary are complete.

---

### Sprint 2.6 — Authentication MVP

Purpose:

Implement the minimum authentication and session ownership boundary needed before ownership-sensitive APIs become fully meaningful.

Tasks:

```text
Task 33 — Auth Scope Lock
Task 34 — Login Page Foundation
Task 35 — Google OAuth Contract / Mock Flow
Task 36 — Session / Current User Boundary
Task 37 — Protected Route Guard
Task 38 — Logout Boundary
```

In scope:

- Login page foundation
- Google OAuth contract or mock flow depending on environment readiness
- Current user API boundary
- Session state boundary
- Protected route guard
- Logout boundary

Out of scope:

- Multi-provider login
- Email / password login
- Organization / role-based access control beyond current user ownership
- Production-hardening beyond MVP contract unless explicitly scoped

Notes:

- Authentication may be implemented earlier if persistence APIs require current user ownership enforcement sooner.
- Backend ownership rules depend on authenticated user context.
- User can only read, modify, upload to, or delete their own Records.

---

### Sprint 2.7 — Annotation MVP

Purpose:

Implement Viewer-only Annotation after playback, timeline, and skeleton replay are stable.

Tasks:

```text
Task 39 — Annotation Scope Lock
Task 40 — Timeline Marker Foundation
Task 41 — Annotation Drawer Foundation
Task 42 — Create Annotation
Task 43 — Edit / Delete Annotation
Task 44 — Jump to Annotation Frame
Task 45 — Joint Highlight Boundary
```

In scope:

- Viewer-only Annotation
- Timeline markers
- Annotation Drawer
- Create annotation at current frame and optional joint
- Edit title / description
- Delete annotation
- Jump to annotation frame
- Joint highlight boundary

Out of scope:

- Compare Annotation
- Cross-record Annotation
- AI-generated Annotation
- Changing annotation frame after creation
- Changing annotation joint after creation

Notes:

- Annotation belongs to Viewer.
- Compare does not support Annotation in MVP.
- Annotation frame and joint binding are immutable after creation.
- To change frame or joint, user must delete and recreate the annotation.

---

### Sprint 3 — Compare

Purpose:

Build side-by-side Compare after Viewer and persisted Records are available.

Suggested tasks:

```text
Task 46 — Compare Scope Lock
Task 47 — Compare Page Foundation
Task 48 — Select Two Records
Task 49 — Side-by-side Viewer Layout
Task 50 — Shared Playback
Task 51 — Sync Offset
Task 52 — Basic Metric Difference
```

In scope:

- Side-by-side Compare
- Select two Records
- Shared playback controls
- Sync offset
- Basic metric difference display

Out of scope:

- Overlay Compare
- Compare Annotation
- Multi-video Compare
- Fully automatic alignment
- AI-generated insight

---

### Sprint 4 — Dashboard

Purpose:

Build Dashboard using Record metadata and Metric Summary.

Suggested tasks:

```text
Task 53 — Dashboard Scope Lock
Task 54 — Recent Records
Task 55 — Summary Cards
Task 56 — Metric Summary Trend
Task 57 — Dashboard Empty / Loading / Error States
```

In scope:

- Recent Records
- Basic Summary Cards
- Metric Summary-based Trend
- Dashboard loading / empty / error states

Out of scope:

- Re-analysis
- Metric Series loading
- AI Coach recommendation
- Advanced insight
- Report generation

Notes:

- Dashboard must not re-analyze video.
- Dashboard depends on Metric Summary and Record Metadata.
- Dashboard should not load Video, Pose Dataset, or Metric Series.

---

## 5. Dependency Summary

The recommended dependency order is:

```text
Capture Foundation
↓
Pose Dataset Export / Validation
↓
Local Viewer Replay
↓
Record / Upload Persistence
↓
Viewer Loads Ready Record
↓
Record List
↓
Authentication MVP boundary
↓
Annotation MVP
↓
Compare
↓
Dashboard
```

Alternative ordering is allowed only when explicitly approved, but the following dependencies should not be violated:

- Viewer replay needs a stable Pose Dataset boundary.
- Upload persistence should use the same artifact shape proven by local Viewer replay.
- Record List is most useful after Records can actually be created and finalized.
- Annotation should come after Timeline / frame navigation are stable.
- Compare should come after Viewer and persisted Records are stable.
- Dashboard should come after Metric Summary persistence exists.

---

## 6. Scope Guardrails for AI Agents

AI Agents must follow these rules:

- Do not treat this clarification as permission to modify existing Design Docs.
- Do not change API contracts without explicit approval.
- Do not change architecture decisions without explicit approval.
- Do not merge Upload work into Sprint 2 Viewer Foundation.
- Do not merge Compare into Viewer.
- Do not merge Dashboard into Record List.
- Do not implement Annotation before Viewer playback / timeline / frame state are stable unless explicitly approved.
- Do not store Pose Dataset or Metric Series in Redux.
- Do not make Visualization Engine own playback state.
- Do not make Frontend invent official storage paths.
- Do not add new third-party packages without approval.

---

## 7. Design Doc Update Recommendation

This document is a clarification note.

It does not directly update:

- `01_PROJECT_OVERVIEW.md`
- `19_BACKLOG.md`
- `12_API_SPEC.md`
- `13_FRONTEND_ARCHITECTURE.md`

Recommended future cleanup:

1. Review this clarification after Sprint 2 Viewer Foundation is stable.
2. Decide whether to formally patch `01_PROJECT_OVERVIEW.md` with the clarified implementation sequencing.
3. Decide whether to patch `19_BACKLOG.md` with the task-level ordering.
4. Keep original high-level product roadmap intact unless intentionally revised.

---

## 8. Final Clarified Roadmap

```text
Sprint 0 — Foundation
Sprint 1 — Capture Foundation
Sprint 2 — Viewer Foundation
Sprint 2.5 — Record Persistence & Management Bridge
Sprint 2.6 — Authentication MVP
Sprint 2.7 — Annotation MVP
Sprint 3 — Compare
Sprint 4 — Dashboard
```

This is the recommended MVP implementation sequence as of this clarification.

