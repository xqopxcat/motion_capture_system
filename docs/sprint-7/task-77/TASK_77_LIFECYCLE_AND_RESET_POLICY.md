# Task 77 — Lifecycle and Reset Policy

Reset clears all scalar/landmark state. Counters retain the reason for diagnostics.

| Reason | Trigger |
| --- | --- |
| `session-change` | accepted Raw camera session differs |
| `camera-flip` | controller requests camera flip |
| `restart` | a new detection producer/session starts |
| `stop` | detection stops/leaves live surface |
| `dispose` | pipeline/engine disposal |
| `inference-error` | fatal inference failure |
| `timestamp-regression` | accepted source timestamp moves backward; current sample starts fresh |
| `excessive-gap` | accepted timestamp gap exceeds 250 ms; current sample starts fresh |
| `retake` | controller begins Retake preparation |
| `explicit` | caller-requested reset |

Short visibility pauses resume only when the next source gap remains within 250 ms; longer pauses reset automatically. Scheduler pause/stale rules stay authoritative. Skeleton toggle performs no reset and does not stop inference or stabilization. Recording start/stop requests do not reset while the same live session continues; leaving live detection after Review does. Existing 300 ms renderer stale clear remains unchanged and is based on Raw source association.
