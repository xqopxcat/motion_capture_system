# Task 83 Metric Pipeline Order

實驗直接證明 centered landmark smoothing 後計角與 raw angle-series centered smoothing 結果不相等；角度是非線性函數，不能交換順序。

- Realtime：landmark quality/stabilization → runtime angle → display，不做第二層 angle smoothing，以避免額外 lag。
- Final MVP：raw world-3D angle → validity filtering → aggregation，unavailable 排除並同時報 valid/unavailable count。
- 未來 offline：若證據支持，應先以版本化 landmark preprocessing → formal angle → aggregation；angle-series smoothing 只能成為另一明示 profile，需處理 0–180° boundary/extreme distortion。
