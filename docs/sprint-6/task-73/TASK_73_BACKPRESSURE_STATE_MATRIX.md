# Task 73 — Backpressure State Matrix

| State | In flight | Pending | Incoming event | Action | Dropped/coalesced | Next state | Instrumentation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Idle | none | none | candidate | start inference | none | Busy | candidate, inference started |
| Busy | frame A | none | candidate B | retain B | none | Busy+Pending | candidate |
| Busy+Pending | canvas A | canvas B | captured candidate C | release B backing store; retain C | B coalesced | Busy+Pending | candidate, coalesced, replacement |
| Busy | frame A | optional newest | A succeeds and valid | complete/publish; start newest if present | none | Busy or Idle | completed, published |
| Busy | frame A | optional newest | A succeeds but obsolete | reject; start valid newest if present | stale result | Busy or Idle | completed, stale rejected |
| Busy | frame A | optional newest | A fails recoverably | release slot; start newest | no fake result | Busy or Idle | failed |
| Any active | optional canvas | optional canvas | pause/session rotation | release pending; invalidate active generation | pending coalesced | Paused/Busy-obsolete | pause, coalesced; later stale rejected |
| Any | optional canvas | optional canvas | dispose | cancel producer, release pending, invalidate active | pending coalesced | Disposed | coalesced; later stale rejected |
| Paused | obsolete allowed to finish | none | candidate | producer emits none; reject direct accepts | none | Paused | none |
| Paused | obsolete allowed to finish | none | resume | restart the same producer object | none | Idle or Busy-obsolete | resume |

Structural maxima: active inference `1`; pending capacity `1`.
An active canvas releases only after its inference settles; a completed canvas releases before the next scheduler turn retains no reference to it.
