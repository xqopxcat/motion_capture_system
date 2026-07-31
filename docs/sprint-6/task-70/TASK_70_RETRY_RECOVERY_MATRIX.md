# Task 70 — Retry & Recovery Matrix

| Failure timing | Persisted Record? | Known recordId? | Completed artifacts | Safe retry start | Allowed | Forbidden | Expected message | Duplicate prevention |
|---|---:|---:|---|---|---|---|---|---|
| Analysis/preparation | No | No | None | Analyze same frozen snapshot | Explicit Retry | Assume Record exists | Local recording remains available | State token prevents concurrent save; no Record exists |
| Create rejected with confirmed response | No | No | None | Analyze then create from same snapshot | Explicit Retry | Upload/finalize | Record could not be created; retry is safe | Create occurs only while no identity is known |
| Create transport outcome ambiguous | Unknown | No | None | Manual reconciliation in future | Leave/Records guidance | Automatic Retry or create again | Identity could not be confirmed; retry disabled | `creationOutcomeAmbiguous` blocks create before publisher work |
| Partial artifact upload | Yes | Yes | Any confirmed subset | Prepare local artifacts, then first missing artifact | Explicit Resume saving | Create another Record or re-upload confirmed artifacts | Existing Record and uploads are preserved | Recovery plan reuses `recordId` and filters `completedArtifacts` |
| Finalization transport interruption | Yes | Yes | All normally complete | Reconcile status; then finalize same Record | Explicit Retry if not Ready | Recreate Record | Final confirmation can be retried | Same `recordId`; missing artifact list is empty |
| Backend retryable Failed lifecycle | Yes | Yes | Preserved set | Existing `/records/{id}/retry`, then complete | Explicit Retry finalization | New Record | Record exists and can be finalized again | `lifecycleFailed` selects lifecycle retry on same ID |
| Backend/reconciled Ready | Yes | Yes | Complete | None | View Record | Retry or upload | Recording is ready | Completed only from Ready confirmation |
| Terminal non-retryable failure | Maybe | Maybe | Preserved if known | None | Safe navigation | Retry loop | Saving needs attention | `retryable=false` hides Retry |
| Session/auth failure under current generic client contract | Maybe | Maybe | Preserved in memory | User returns through current auth flow | Leave safely | Automatic retry loop | Generic safe interruption message | No automatic retry; no new auth/error contract invented |

## Artifact order

The Sprint 5 order remains Video → Pose data → Motion metrics → Thumbnail → Finalizing. Only completion callbacks add an artifact to the resume set. Retry recomputes local checksums but uploads only entries absent from that set.

