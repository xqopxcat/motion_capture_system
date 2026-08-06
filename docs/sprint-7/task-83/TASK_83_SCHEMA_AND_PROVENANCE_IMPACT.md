# Task 83 Schema 與 Provenance 影響

pose.v1 已正確保留 Raw authoritative frames，不需更改。Task 79 FormalJointAngleResult 已有 analysisProfileId/version，可表達 frame-local計算；runtimeProfileId 則只屬 live display。

目前 metrics.v1 series/summary 可排除 unavailable 並表示 min/max/mean/count，但無完整 final preprocessing profile、插值/outlier policy、coverage/unavailable count與重算 lineage。故不同 profile/version 的 summary 不應宣稱可比。未來若正式發布新的 derived artifact，需先做 schema/version migration；Task 83 不改 schema、API、storage 或 publisher。
