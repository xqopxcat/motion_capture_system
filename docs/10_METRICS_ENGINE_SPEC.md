# 10_METRICS_ENGINE_SPEC.md

# Motion Capture Platform - Metrics Engine Specification

---

| Item         | Value                                          |
| ------------ | ---------------------------------------------- |
| Document     | 10_METRICS_ENGINE_SPEC.md                      |
| Version      | 1.1                                            |
| Status       | Draft                                          |
| Owner        | MengJu Lee                                     |
| Last Updated | 2026-06-26                                     |
| Depends On   | 08_POSE_SCHEMA_SPEC.md、09_MOTION_MODEL_SPEC.md |

---

# 1. Purpose

本文件定義 Motion Capture Platform 的 **Metrics Engine Framework**。

Metrics Engine 並非只負責計算角度，而是平台所有運動分析能力的核心。

其主要責任包括：

* 定義 Metric
* 管理 Metric
* 計算 Metric
* 輸出 Metric
* 提供 Visualization 使用

所有運動分析皆建立於本 Framework。

---

# 2. Design Principles

Metrics Engine 必須符合：

* Motion Agnostic
* Sport Agnostic
* Engine Agnostic
* Stateless
* Reproducible
* Extensible
* Plugin-based

新增 Metric 不應修改 Engine。

---

# 3. Metrics Pipeline

```text
Pose Dataset
      ↓
Motion Model
      ↓
Metric Registry
      ↓
Metric Calculator
      ↓
Metric Series
      ↓
Metric Summary
      ↓
Visualization Engine
```

Metrics Engine 不直接依賴 Pose。

所有 Metrics 必須建立於 Motion Model。

---

# 4. Core Concepts

Metrics Framework 包含：

* Metric Definition
* Metric Definition Library
* Metric Registry
* Metric Calculator
* Metric Series
* Metric Summary
* Metric Category

---

# 5. Metric Definition

Metric Definition 定義：

> 一個 Metric 是什麼。

每個 Metric 包含：

* id
* name
* category
* unit
* calculator
* supportedPlanes
* description

Metric Definition 不保存數值。

---

# 6. Metric Definition Library

平台採用 **Metric Definition Library** 作為 Metrics 的核心設計。

所有 Metrics 不應寫死於程式邏輯中，而應以 Definition 的形式存在。

每個 Metric 都是一個獨立的 Definition Object，並可被：

* Viewer 使用
* Compare 使用
* Dashboard 使用
* AI Coach 使用

這使 Metrics 從單純的「函式」提升為：

> **平台的第一級 Domain Object（First-class Domain Object）**

---

## 6.1 Example Metric Definition

```typescript
export const KneeFlexionMetric = {

    id: "knee_flexion",

    name: "Knee Flexion",

    category: "Joint",

    unit: "degree",

    supportedPlanes: ["Sagittal"],

    calculator: calculateKneeFlexion,

}
```

---

## 6.2 Benefits

採用 Metric Definition Library 可帶來：

* Viewer 可自動決定顯示哪些 Metrics
* Compare 可自動列出可比較 Metrics
* Dashboard 可自動產生趨勢圖
* AI Coach 可直接引用同一套 Metric Definition
* 減少硬編碼（Hard-coded Logic）
* 提升系統一致性與可擴展性

---

# 7. Metric Category

平台預設將 Metrics 分類。

| Category  | Description |
| --------- | ----------- |
| Joint     | 關節角度        |
| Segment   | 人體節段        |
| Body      | 人體整體        |
| Symmetry  | 左右對稱        |
| Temporal  | 時間相關        |
| Stability | 穩定性         |
| Balance   | 平衡（Future）  |

Category 僅作分類用途。

---

# 8. Metric Registry

所有 Metrics 皆向 Registry 註冊。

```text
Metric Registry

├── Knee Flexion
├── Hip Flexion
├── Trunk Angle
├── Shoulder Rotation
└── ...
```

Engine 執行時：

不直接引用檔案。

而由 Registry 統一管理。

Registry 會載入 Metric Definition Library 中的所有 Metrics。

---

# 9. Metric Calculator

Calculator 為每個 Metric 的計算器。

輸入：

```text
Motion Model
```

輸出：

```text
Metric Series
```

Calculator 不修改 Motion Model。

每個 Calculator 僅負責一個 Metric。

---

# 10. Metric Series

Metric Series 為逐 Frame Metrics。

例如：

```text
Frame 0

↓

82°

Frame 1

↓

84°

Frame 2

↓

87°
```

Viewer 與 Compare 皆使用 Metric Series。

Storage：

metric-series.v1.json

---

# 11. Metric Summary

Metric Summary 為整段 Motion 的摘要。

例如：

* Max
* Min
* Average
* Range of Motion
* Standard Deviation

Dashboard 使用 Metric Summary。

Storage：

PostgreSQL。

---

# 12. Reference TypeScript Model

```typescript
interface MetricDefinition {

    id: string;

    name: string;

    category: MetricCategory;

    unit: MetricUnit;

    calculator: MetricCalculator;

    supportedPlanes: AnatomicalPlane[];

    description: string;

}
```

```typescript
interface MetricSeries {

    metricId: string;

    values: number[];

}
```

```typescript
interface MetricSummary {

    metricId: string;

    min: number;

    max: number;

    average: number;

    rangeOfMotion: number;

}
```

---

# 13. Runtime Flow

```text
Motion Model

↓

Metric Registry

↓

Metric Calculator

↓

Metric Series

↓

Metric Summary

↓

Visualization Engine
```

---

# 14. Metric Plugin Model

所有 Metrics 皆可視為 Plugin。

例如：

```text
metrics/

    kneeFlexion.ts

    hipFlexion.ts

    trunkAngle.ts

    shoulderRotation.ts
```

新增 Metric：

僅需：

* 新增 Metric Definition
* 新增 Calculator
* 註冊 Registry

不需修改 Engine。

---

# 15. Metric Lifecycle

```text
Metric Definition

↓

Registration

↓

Calculation

↓

Metric Series

↓

Metric Summary

↓

Visualization
```

---

# 16. Future Metric Types

未來可新增：

* Center of Mass
* Angular Velocity
* Angular Acceleration
* Jump Height
* Ground Contact Time
* Ski Edge Angle
* Golf Swing Plane

Metrics Engine 不需修改。

---

# 17. Design Decisions

* Metrics 不直接依賴 Pose。
* Metrics 永遠依賴 Motion Model。
* Engine 採 Plugin Architecture。
* Viewer 使用 Metric Series。
* Dashboard 使用 Metric Summary。
* Metric Definition 與 Calculator 分離。
* Registry 為唯一入口。
* Metrics 採用 Definition Library 管理。
* Metrics 為 First-class Domain Object。

---

# 18. Extension Points

未來可新增：

* AI Metrics
* Machine Learning Metrics
* IMU Metrics
* Force Plate Metrics
* EMG Metrics

皆透過 Metric Plugin 擴充。

---

# 19. Related Documents

Depends On

* 08_POSE_SCHEMA_SPEC.md
* 09_MOTION_MODEL_SPEC.md

Related

* 11_VISUALIZATION_ENGINE_SPEC.md
* 12_API_SPEC.md
* 15_UI_COMPONENT_SPEC.md

---

# 20. Revision History

| Version | Date       | Description                   |
| ------- | ---------- | ----------------------------- |
| 1.0     | 2026-06-26 | Initial Draft                 |
| 1.1     | 2026-06-26 | Add Metric Definition Library |
