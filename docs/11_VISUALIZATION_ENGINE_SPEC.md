# 11_VISUALIZATION_ENGINE_SPEC.md

# Motion Capture Platform - Visualization Engine Specification

---

| Item         | Value                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| Document     | 11_VISUALIZATION_ENGINE_SPEC.md                                          |
| Version      | 1.0                                                                      |
| Status       | Draft                                                                    |
| Owner        | MengJu Lee                                                               |
| Last Updated | 2026-06-26                                                               |
| Depends On   | 08_POSE_SCHEMA_SPEC.md、09_MOTION_MODEL_SPEC.md、10_METRICS_ENGINE_SPEC.md |

---

# 1. Purpose

本文件定義 Motion Capture Platform 的 **Visualization Engine Framework**。

Visualization Engine 負責將 Motion Analysis 結果轉換為可視化內容，供 Capture、Viewer、Compare 與 Dashboard 使用。

Visualization Engine 僅負責 Rendering，不負責任何 Motion Analysis 或 Metrics Calculation。

---

# 2. Design Principles

Visualization Engine 必須符合：

* Stateless
* Layer-based
* Plugin-based
* Reusable
* Render-only
* Configurable
* Extensible

Rendering 不應修改任何 Domain Data。

---

# 3. Rendering Pipeline

```text
Pose Dataset
        │
Motion Model
        │
Metric Series
        │
Annotation
        │
Viewer State
        ▼
Visualization Engine
        ▼
Canvas
```

Visualization Engine 為 Render Layer。

---

# 4. Core Concepts

Visualization Framework 包含：

* Render Context
* Render Layer
* Render Plugin
* Render Pipeline
* Render Configuration

---

# 5. Render Context

每次 Rendering 都建立一份 Render Context。

內容包含：

* Current Frame
* Pose Frame
* Motion Model
* Metric Series
* Viewer State
* Compare State
* Canvas Size

所有 Plugin 共用同一份 Context。

---

# 6. Layer Architecture

Visualization 採 Layer 架構。

```text
Canvas

├── Video Layer
├── Skeleton Layer
├── Joint Layer
├── Metric Layer
├── Annotation Layer
├── Selection Layer
└── Debug Layer
```

每一 Layer 僅負責自身 Rendering。

---

# 7. Render Plugin

每一種可視化元素皆為 Plugin。

例如：

```text
plugins/

    skeleton.ts

    joints.ts

    angles.ts

    annotations.ts

    metricLabels.ts

    selection.ts
```

新增 Plugin：

不需修改 Visualization Engine。

---

# 8. Skeleton Layer

負責：

* Joint Connection
* Bone Rendering
* Skeleton Highlight

資料來源：

Pose Dataset。

---

# 9. Joint Layer

負責：

* Joint Circle
* Joint Name（Debug）
* Joint Selection

Joint Layer 不負責 Metrics。

---

# 10. Metric Layer

負責：

顯示：

* Joint Angle
* Metric Label
* Metric Value
* Difference Label（Compare）

資料來源：

Metric Series。

---

# 11. Annotation Layer

負責：

* Annotation Marker
* Selected Joint Highlight
* Annotation Anchor
* Annotation Tooltip

Annotation Data 來源：

Record Annotation。

---

# 12. Selection Layer

負責：

* Hover
* Selected Joint
* Selected Segment
* Active Annotation

不保存任何資料。

---

# 13. Render Pipeline

```text
Render Context

↓

Layer Manager

↓

Video

↓

Skeleton

↓

Joint

↓

Metric

↓

Annotation

↓

Selection

↓

Canvas
```

所有 Layer 順序固定。

---

# 14. Compare Rendering

Compare 採：

Side-by-side。

Visualization Engine 同時建立：

兩份 Render Context。

```text
Record A

↓

Visualization A

Record B

↓

Visualization B
```

Overlay Mode 不屬於 MVP。

---

# 15. Runtime Flow

```text
Frame Changed

↓

Update Render Context

↓

Render Plugins

↓

Canvas Refresh
```

Viewer 與 Compare 共用同一套 Engine。

---

# 16. Reference TypeScript Model

```typescript
interface RenderContext {

    frameIndex: number;

    poseFrame: PoseFrame;

    motionModel: MotionModel;

    metrics: MetricSeries[];

    annotations: Annotation[];

    viewerState: ViewerState;

}
```

```typescript
interface RenderPlugin {

    id: string;

    render(context: RenderContext): void;

}
```

```typescript
interface VisualizationEngine {

    register(plugin: RenderPlugin): void;

    render(context: RenderContext): void;

}
```

---

# 17. Plugin Lifecycle

```text
Plugin

↓

Register

↓

Render

↓

Dispose
```

Plugin 間不得互相依賴。

---

# 18. Extension Points

未來可新增：

* Heatmap Layer
* AI Coach Layer
* Force Vector Layer
* Center of Mass Layer
* Balance Layer
* 3D View Layer
* IMU Overlay
* Debug Overlay

皆透過新增 Render Plugin 完成。

---

# 19. Design Decisions

* Rendering 採 Layer-based Architecture。
* 每種 Overlay 為獨立 Plugin。
* Viewer 與 Compare 共用 Visualization Engine。
* Visualization Engine 不計算 Metrics。
* Rendering 不修改 Domain Data。
* Compare MVP 採 Side-by-side。
* Overlay Compare 為 Future Feature。

---

# 20. Related Documents

Depends On

* 08_POSE_SCHEMA_SPEC.md
* 09_MOTION_MODEL_SPEC.md
* 10_METRICS_ENGINE_SPEC.md

Related

* 12_API_SPEC.md
* 13_FRONTEND_ARCHITECTURE.md
* 15_UI_COMPONENT_SPEC.md

---

# 21. Revision History

| Version | Date       | Description   |
| ------- | ---------- | ------------- |
| 1.0     | 2026-06-26 | Initial Draft |
