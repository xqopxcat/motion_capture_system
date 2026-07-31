# Task 72 — Landmark & Connection Matrix

## Visible landmarks (19)

| ID | Landmark | Side | Joint treatment |
|---:|---|---|---|
| 0 | Nose | Center | White ring + dark outline |
| 11, 12 | Left/right shoulder | Left/right | Teal circle / amber square |
| 13, 14 | Left/right elbow | Left/right | Teal circle / amber square |
| 15, 16 | Left/right wrist | Left/right | Teal circle / amber square |
| 19, 20 | Left/right index endpoint | Left/right | Teal circle / amber square |
| 23, 24 | Left/right hip | Left/right | Teal circle / amber square |
| 25, 26 | Left/right knee | Left/right | Teal circle / amber square |
| 27, 28 | Left/right ankle | Left/right | Teal circle / amber square |
| 29, 30 | Left/right heel | Left/right | Teal circle / amber square |
| 31, 32 | Left/right foot index | Left/right | Teal circle / amber square |

IDs 1–10 facial details and 17/18/21/22 pinky/thumb endpoints remain in Raw Pose but are not emphasized in the production display.

## Visible connections (20)

| Region | Connections |
|---|---|
| Shoulder line | 11–12 |
| Left arm | 11–13, 13–15, 15–19 |
| Right arm | 12–14, 14–16, 16–20 |
| Torso | 11–23, 12–24 |
| Hip line | 23–24 |
| Left leg/foot | 23–25, 25–27, 27–29, 29–31, 27–31 |
| Right leg/foot | 24–26, 26–28, 28–30, 30–32, 28–32 |

All pairs use MediaPipe Pose landmark semantics; no conflicting anatomical connection is introduced.

