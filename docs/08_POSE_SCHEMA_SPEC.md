# 08_POSE_SCHEMA_SPEC.md

# Motion Capture Platform - Pose Schema Specification

---

| Item         | Value                                                                 |
| ------------ | --------------------------------------------------------------------- |
| Document     | 08_POSE_SCHEMA_SPEC.md                                                |
| Version      | 1.0                                                                   |
| Status       | Draft                                                                 |
| Owner        | MengJu Lee                                                            |
| Last Updated | 2026-06-26                                                            |
| Depends On   | 04_ANALYSIS_PIPELINE_SPEC.md、06_DATA_MODEL_SPEC.md、07_STORAGE_SPEC.md |

---

# 1. Purpose

本文件定義 Motion Capture Platform 的 **Pose Data Schema**。

Pose Schema 是整個 Motion Analysis Platform 的核心資料格式。

任何 Pose Engine 產生的結果，都必須先轉換為本 Schema。

所有後續：

* Motion Model
* Metrics Engine
* Viewer
* Compare

皆建立於此 Schema。

---

# 2. Design Principles

Pose Schema 應符合：

* Engine Agnostic
* Immutable
* Versionable
* Frame-based
* Extensible

Raw Pose 永遠不可修改。

任何計算結果不得直接寫回 Pose。

---

# 3. File Format

Pose Dataset 採用：

```text
pose.v1.json
```

未來版本：

```text
pose.v2.json
```

不得覆蓋：

```text
pose.v1.json
```

---

# 4. Pose Dataset Structure

```text
Pose Dataset

├── version
├── source
├── fps
├── frameCount
├── duration
└── frames[]
```

每份 Pose Dataset 對應：

一筆 Motion Record。

---

# 5. Dataset Metadata

Metadata 建議包含：

* version
* poseEngine
* poseEngineVersion
* fps
* frameCount
* duration
* generatedAt

方便未來重新分析。

---

# 6. Frame Structure

每一 Frame 包含：

```text
Frame

├── frameIndex
├── timestamp
├── landmarks2D
└── landmarks3D
```

Frame 不保存：

* Joint Angle
* Metrics
* Annotation

---

# 7. Landmarks

每一 Frame 固定保存：

MediaPipe Pose

33 個 Joint。

Storage Layer 不允許刪除任何 Joint。

Rendering Layer 可自行決定是否顯示。

---

# 8. Landmark Structure

每個 Landmark 包含：

```text
Landmark

├── id
├── name
├── x
├── y
├── z
└── visibility
```

其中：

* x
* y
* z

皆為浮點數。

visibility

範圍：

0 ~ 1。

---

# 9. landmarks2D

用途：

Viewer Rendering。

Compare Rendering。

Overlay。

座標系統：

Normalized Coordinate。

範圍：

```text
x : 0 ~ 1

y : 0 ~ 1
```

---

# 10. landmarks3D

用途：

Motion Model。

Metrics。

Biomechanics。

座標系統：

MediaPipe World Coordinate。

保留：

* x
* y
* z

不進行轉換。

Motion Model 再建立平台座標系。

---

# 11. Joint Index

Storage Layer 固定保存：

MediaPipe 官方 Index。

例如：

```text
0 Nose

11 Left Shoulder

12 Right Shoulder

23 Left Hip

24 Right Hip

25 Left Knee

26 Right Knee

27 Left Ankle

28 Right Ankle
```

完整 33 個 Joint 均保存。

---

# 12. Visibility

Visibility 為 Pose Engine 提供。

用途：

表示 Joint 是否可靠。

Viewer 可依 Visibility：

* 降低透明度
* 隱藏 Joint

Metrics Engine 可：

忽略低 Visibility Joint。

Storage 永遠保留 Visibility。

---

# 13. Pose Versioning

Schema 更新：

新增：

```text
pose.v2.json
```

不得：

直接修改：

```text
pose.v1.json
```

Backend Metadata 應保存：

目前 Record 使用之 Pose Version。

---

# 14. Engine Compatibility

目前支援：

* MediaPipe Pose Landmarker

未來：

可新增：

* MoveNet
* OpenPose
* Apple Vision
* Azure Kinect

所有 Engine 均需：

Mapping 至本 Schema。

平台其他 Layer 不應依賴特定 Engine。

---

# 15. Design Decisions

* Storage 永遠保存完整 33 個 Joint。
* 不刪除 Face Joint。
* 不刪除 Foot Joint。
* 不保存 Metrics。
* 不保存 Motion Model。
* Pose 為唯一 Raw Data。
* Motion Model 與 Metrics 可重新計算。

---

# 16. Related Documents

Depends On

* 04_ANALYSIS_PIPELINE_SPEC.md
* 06_DATA_MODEL_SPEC.md
* 07_STORAGE_SPEC.md

Related

* 09_MOTION_MODEL_SPEC.md
* 10_METRICS_ENGINE_SPEC.md
* 11_VISUALIZATION_ENGINE_SPEC.md

---

# 17. Revision History

| Version | Date       | Description   |
| ------- | ---------- | ------------- |
| 1.0     | 2026-06-26 | Initial Draft |

---

# 18. Reference JSON Schema Dataset Example

```json
{
  "version": "1.0",
  "poseEngine": "MediaPipe Pose Landmarker",
  "poseEngineVersion": "0.10.x",
  "fps": 30,
  "frameCount": 120,
  "duration": 4.0,
  "generatedAt": "2026-06-26T10:15:30Z",
  "frames": [
    {
      "frameIndex": 0,
      "timestamp": 0,
      "landmarks2D": [
        {
          "id": 0,
          "name": "nose",
          "x": 0.512,
          "y": 0.183,
          "z": -0.041,
          "visibility": 0.998
        },
        {
          "id": 11,
          "name": "left_shoulder",
          "x": 0.421,
          "y": 0.314,
          "z": -0.182,
          "visibility": 0.996
        }
      ],
      "landmarks3D": [
        {
          "id": 0,
          "name": "nose",
          "x": 0.012,
          "y": -0.241,
          "z": -0.387,
          "visibility": 0.998
        },
        {
          "id": 11,
          "name": "left_shoulder",
          "x": -0.168,
          "y": -0.091,
          "z": -0.102,
          "visibility": 0.996
        }
      ]
    }
  ]
}
```

Landmark Object

```typescript
interface Landmark {
  id: number;
  name: string;
  x: number;
  y: number;
  z: number;
  visibility: number;
}
```

Frame Object

```typescript
interface PoseFrame {
  frameIndex: number;
  timestamp: number;
  landmarks2D: Landmark[];
  landmarks3D: Landmark[];
}
```

Pose Dataset

```typescript
interface PoseDataset {
  version: string;
  poseEngine: string;
  poseEngineVersion: string;
  fps: number;
  frameCount: number;
  duration: number;
  generatedAt: string;
  frames: PoseFrame[];
}
```

---

# 19. MediaPipe Joint Mapping

| Index | Joint Name       | Description        |
| ----- | ---------------- | ------------------ |
| 0     | nose             | Nose               |
| 1     | left_eye_inner   | Left Eye Inner     |
| 2     | left_eye         | Left Eye           |
| 3     | left_eye_outer   | Left Eye Outer     |
| 4     | right_eye_inner  | Right Eye Inner    |
| 5     | right_eye        | Right Eye          |
| 6     | right_eye_outer  | Right Eye Outer    |
| 7     | left_ear         | Left Ear           |
| 8     | right_ear        | Right Ear          |
| 9     | mouth_left       | Left Mouth Corner  |
| 10    | mouth_right      | Right Mouth Corner |
| 11    | left_shoulder    | Left Shoulder      |
| 12    | right_shoulder   | Right Shoulder     |
| 13    | left_elbow       | Left Elbow         |
| 14    | right_elbow      | Right Elbow        |
| 15    | left_wrist       | Left Wrist         |
| 16    | right_wrist      | Right Wrist        |
| 17    | left_pinky       | Left Pinky         |
| 18    | right_pinky      | Right Pinky        |
| 19    | left_index       | Left Index         |
| 20    | right_index      | Right Index        |
| 21    | left_thumb       | Left Thumb         |
| 22    | right_thumb      | Right Thumb        |
| 23    | left_hip         | Left Hip           |
| 24    | right_hip        | Right Hip          |
| 25    | left_knee        | Left Knee          |
| 26    | right_knee       | Right Knee         |
| 27    | left_ankle       | Left Ankle         |
| 28    | right_ankle      | Right Ankle        |
| 29    | left_heel        | Left Heel          |
| 30    | right_heel       | Right Heel         |
| 31    | left_foot_index  | Left Foot Index    |
| 32    | right_foot_index | Right Foot Index   |

---

# 20. Validation Rules

Pose Dataset 必須符合以下規則：

## Dataset

* version 不可為空
* fps > 0
* frameCount ≥ 1
* duration ≥ 0
* frames.length == frameCount

## Frame

* frameIndex 必須唯一
* timestamp 遞增
* landmarks2D 固定 33 筆
* landmarks3D 固定 33 筆

## Landmark

* id 為 0~32
* name 必須符合 Joint Mapping
* visibility 範圍 0~1
* x、y、z 必須為 Number
* Landmark 順序固定依照 Joint Index

---

# Pose Dataset Naming Rule

本文件中 canonical artifact 名稱為：

```text
Pose Dataset
```

Canonical file name：

```text
pose.v1.json
```

不得以 landmark-centric 或 model-centric 名稱指稱 persisted pose artifact。

`landmarks2D` / `landmarks3D` 可作為 Pose Dataset 內部欄位名稱保留，但不作為 domain artifact 名稱。

