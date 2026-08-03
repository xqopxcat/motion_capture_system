# Task 75 — Benchmark Matrix

Use policy version `sprint-7-quality.v1`. Each run records scenario ID, platform/device/browser, duration, sample count, raw measurement summaries, target classification, evidence link, exclusions, and notes. Synthetic clocks/fixtures validate definitions; physical evidence is pending Task 84.

| Category | Scenarios | Setup and duration | Measurements | Evidence |
| --- | --- | --- | --- | --- |
| Static | full body; upper body; seated/occluded | Fixed camera/light; still after 5 s settling; 30 s | jitter, confidence, availability | automated extraction + physical |
| Controlled | slow squat; arm raise; knee flexion; repeated left/right | five repetitions or 30–40 s, metronome documented | latency, age, rate, confidence, sync | manual + physical |
| Fast | arm movement; squat transition; brief blur | five repetitions/20 s | latency, age, rate, confidence, availability | manual + physical |
| Degraded | temporary occlusion; partial body; low light | 20–30 s with condition documented | confidence and unavailable ratios | manual + physical |
| Lifecycle | camera flip; rotation; tab hidden/restored | three transitions/cycles | old-session rejection, age, availability, sync | automated guards + physical |
| Scheduling | inference delay; candidate replacement | deterministic 300-candidate fixture | attempts/skips/replacements/stale/failure/publication, latency | automated synthetic |
| Long session | active Capture | 30 min with periodic motion | rate, long tasks, memory/resources | manual + physical |
| Recorded sync | playback; pause; timeline seek; next; previous | timestamped fixture; 60 s or 20 operations each | absolute nearest-frame sync error | automated + manual |

Classification uses the canonical direction plus `passBoundary` and `failBoundary`: values on the pass side are `pass`, values on the fail side are `fail`, and values strictly between are `warning`. Equal boundaries collapse the warning interval and give the exact boundary to `pass`; values beyond it fail. Invalid boundary ordering invalidates the run. Nonfinite measurements are `unavailable`, never pass. Report intentional interval skips separately. Viewer and Compare repeat the recorded-sync matrix in a future Sprint; Task 75 implements neither.
