# Task 67 Baseline Test Protocol

## Run header

Record: date/time, commit, OS, device model/CPU/RAM, physical or simulated label, browser/version,
camera/resolution/FPS if known, power mode, display refresh rate, and whether DevTools throttling
is active. Do not combine physical-device and simulated results.

Start the frontend with `npm run dev -- --host 0.0.0.0`, sign in, and open:

`/capture?captureDiagnostics=1`

Confirm the “Development only” panel is visible. Before every scenario select **Reset scenario**.
After the stated duration select **Copy JSON** and save the JSON with the run header and manual
notes. Do not navigate or resize during a run unless the scenario asks for it.

## Scenarios

| ID | Setup and action | Duration | Evidence |
|---|---|---:|---|
| 1 Stationary | Camera ready; one person fully visible; neutral stance; remain still. Reset after settling. | 30 s | JSON: camera, inference, pose age, render, React, long tasks, jitter. Note visible shaking/lag. |
| 2 Slow movement | Same framing; slowly raise/lower both arms and shift left/right at a repeatable pace. | 30 s | Same runtime JSON; note perceived overlay delay or loss. Jitter is not interpreted. |
| 3 Fast movement | Repeat fast arm swings, squats, or lateral movement while staying in frame. | 30 s | JSON: age, inference consistency, skips/superseded frames, long tasks. Note lag/instability. |
| 4 Recording | Begin from camera-ready state; start current recorder, perform the slow sequence, then stop. | 30 s recording | JSON during recording; compare with scenario 2 from the same environment. Note recorder/control issues. |
| 5 Recorded Preview | Reset after preview appears; play 20 s, seek near middle, resume 10 s, seek backward, resume 10 s. | 40 s | JSON preview error/reuse/unavailable counts. Note visible video/overlay mismatch after play and seeks. |
| 6 Visibility | Camera running; reset, collect 10 s foreground, hide tab 10 s, return and collect 10 s. | 30 s | JSON plus exact visibility timings and observed recovery. This only records existing behavior. |
| 7 Lower performance | Prefer a named physical lower-performance device. Otherwise apply a documented browser CPU throttle and repeat 1, 3, and 4. | Same durations | Separate JSON files clearly labelled `physical` or `simulated-throttle` with throttle factor. |

Each JSON is automatically measured. Perceived lag, landmark loss, visual alignment, thermal
state, permission issues, and recovery are manually observed. A scenario is invalid if the panel
was not reset, the subject left frame unexpectedly, the camera permission failed, or less than 20
samples were collected for a claimed percentile.

## Expected report fields

Preserve the complete copied snapshot. At minimum report sample counts and summaries for inference
duration, pose-result age, render duration/cadence, jitter, and preview sync. Report null as
“unavailable”; never convert it to zero. Record whether Long Tasks API is supported. Attach raw JSON
or its path so later Tasks can reproduce comparisons.

