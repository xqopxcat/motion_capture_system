# 09_MOTION_MODEL_SPEC.md

# Motion Capture Platform - Motion Model Specification

---

| Item         | Value                                        |
| ------------ | -------------------------------------------- |
| Document     | 09_MOTION_MODEL_SPEC.md                      |
| Version      | 1.1                                          |
| Status       | Draft                                        |
| Owner        | MengJu Lee                                   |
| Last Updated | 2026-06-26                                   |
| Depends On   | 06_DATA_MODEL_SPEC.md、08_POSE_SCHEMA_SPEC.md |

---

# 1. Purpose

本文件定義 Motion Capture Platform 的 **Motion Model**。

Motion Model 是平台的 Domain Layer。

它負責將 Raw Pose 轉換為具有生物力學意義的人體模型，提供後續 Metrics Engine、Visualization Engine 與未來 AI Coach 使用。

Motion Model **不依賴任何特定 Pose Engine**，也不包含任何運動項目的邏輯。

---

# 2. Design Principles

Motion Model 必須符合：

* Engine Agnostic
* Sport Agnostic
* Anatomically Meaningful
* Immutable Input
* Reproducible
* Extensible

Motion Model 不修改 Pose Dataset，只建立 Runtime 人體模型。

---

# 3. Motion Pipeline

```text
Video
    ↓
Pose Dataset
    ↓
Motion Model
    ↓
Metrics Engine
    ↓
Visualization Engine
```

Motion Model 是 Pose 與 Metrics 間唯一橋樑。

---

# 4. Core Concepts

Motion Model 由下列核心元素組成：

* Joint
* Segment
* Kinematic Chain
* Body Coordinate System
* Body Center
* Anatomical Plane
* Symmetry Plane

---

# 5. Joint

Joint 為人體關節節點。

來源：

* Pose Dataset（33 個 Joints）

Motion Model 不新增或刪除 Joint。

每個 Joint 保留：

* Position
* Visibility

但會建立 Joint Relationship。

例如：

```text
Left Hip
      │
Left Knee
      │
Left Ankle
```

---

# 6. Segment

Segment 為兩個 Joint 所形成的人體節段。

平台預設建立：

| Segment   | Start      | End             |
| --------- | ---------- | --------------- |
| Upper Arm | Shoulder   | Elbow           |
| Forearm   | Elbow      | Wrist           |
| Thigh     | Hip        | Knee            |
| Lower Leg | Knee       | Ankle           |
| Foot      | Heel       | Foot Index      |
| Torso     | Hip Center | Shoulder Center |

Segment 可直接計算：

* Length
* Direction Vector
* Orientation

---

# 7. Kinematic Chain

人體視為多條 Kinematic Chain。

例如：

Left Leg：

```text
Hip
 ↓
Knee
 ↓
Ankle
 ↓
Foot
```

Right Arm：

```text
Shoulder
 ↓
Elbow
 ↓
Wrist
```

所有 Metrics 建立於 Kinematic Chain。

---

# 8. Body Coordinate System

Motion Model 建立平台自己的 Body Coordinate System。

目的：

* 消除不同 Pose Engine 差異
* 提供統一計算基準
* 支援不同運動分析

Body Coordinate System 不修改原始 Pose。

## 8.1 Definition Scope（MVP）

在 MVP 階段，Body Coordinate System **僅定義為概念性存在**，用於：

* 支援未來 Metrics 設計
* 預留 Coordinate Transform 能力
* 確保架構一致性

目前 **不強制定義完整數學座標系統**（例如精確軸向與方向）。

## 8.2 Future Formal Definition（Planned）

未來版本（v1.2+）將正式定義：

* X 軸代表方向（例如 Left → Right）
* Y 軸代表方向（例如 Bottom → Top）
* Z 軸代表方向（例如 Back → Front）
* 正方向判定方式
* 是否採用右手座標系（Right-handed Coordinate System）
* 軸建立依據（例如 Hip Center + Shoulder Center）

## 8.3 Design Decision

目前決策如下：

* ✅ 保留 Body Coordinate System 概念
* ✅ 不在 MVP 強制定義數學細節
* ✅ 避免過早鎖定座標系導致後續限制
* ✅ 等 Visualization / Advanced Metrics 需求明確後再定義

---

# 9. Body Center

平台定義數個 Body Center。

## Hip Center

```text
Left Hip

+

Right Hip

──────────

2
```

---

## Shoulder Center

```text
Left Shoulder

+

Right Shoulder

──────────────

2
```

Body Center 可用於：

* 身體位移
* 軀幹方向
* Balance（Future）

---

# 10. Anatomical Planes

平台採用標準人體解剖平面。

| Plane      | Description |
| ---------- | ----------- |
| Sagittal   | 前後方向        |
| Frontal    | 左右方向        |
| Transverse | 水平方向        |

未來所有 Metrics 應明確定義屬於哪個 Plane。

---

# 11. Symmetry Plane

人體建立 Left / Right Symmetry。

主要用途：

* 左右比較
* Balance
* Symmetry Metrics

例如：

* Knee Flexion Difference
* Shoulder Height Difference

---

# 12. Coordinate Transform

Motion Model 可建立 Runtime Coordinate。

例如：

```text
World Coordinate

↓

Body Coordinate

↓

Segment Coordinate
```

Storage 永遠保存：

Pose Dataset。

Coordinate Transform 僅存在 Runtime。

---

# 13. Runtime Object Model

```text
MotionModel

├── joints
├── segments
├── bodyCenter
├── bodyAxes
├── kinematicChains
└── metadata
```

Motion Model 不保存：

* Metrics
* Annotation
* Viewer State

---

# 14. Reference TypeScript Model

```typescript
interface MotionModel {

    joints: Joint[];

    segments: Segment[];

    bodyCenter: BodyCenter;

    bodyAxes: BodyAxes;

    kinematicChains: KinematicChain[];

}
```

```typescript
interface Segment {

    id: string;

    startJointId: number;

    endJointId: number;

    length: number;

    direction: Vector3;

}
```

```typescript
interface KinematicChain {

    id: string;

    jointIds: number[];

}
```

---

# 15. Runtime Flow

```text
Pose Dataset

↓

Joint Extraction

↓

Segment Generation

↓

Body Center

↓

Coordinate System

↓

Motion Model Ready
```

Motion Model 建立完成後交由 Metrics Engine 使用。

---

# 16. Extension Points

未來可新增：

* Estimated Center of Mass
* Joint Velocity
* Joint Acceleration
* IMU Fusion
* Force Plate Integration
* Skeletal Scaling
* Multi-person Support

上述皆建立於 Motion Model，不修改 Pose Schema。

---

# 17. Design Decisions

* Motion Model 為 Runtime Model。
* 不持久化保存（MVP）。
* Pose 永遠為唯一 Raw Data。
* Metrics 不直接依賴 Pose。
* Metrics 必須依賴 Motion Model。
* Body Coordinate System 為平台定義，不依賴 Pose Engine。
* 人體模型採 Kinematic Chain 表示。
* Body Coordinate System 在 MVP 階段不強制定義數學細節。

---

# 18. Related Documents

Depends On

* 06_DATA_MODEL_SPEC.md
* 08_POSE_SCHEMA_SPEC.md

Related

* 10_METRICS_ENGINE_SPEC.md
* 11_VISUALIZATION_ENGINE_SPEC.md
* 12_API_SPEC.md

---

# 19. Revision History

| Version | Date       | Description                          |
| ------- | ---------- | ------------------------------------ |
| 1.0     | 2026-06-26 | Initial Draft                        |
| 1.1     | 2026-06-26 | Clarify Body Coordinate System scope |
