# Task 83 實作摘要

新增 `frontend/src/experiments/analysisProfiles/`：candidate profile discriminated unions、validator、strict sequence identity、raw/causal/non-causal preprocessing、formal metric evaluator、angle-series comparison及合成 fixtures/tests。新增十四份 Task 83 文件。

關鍵發現是現行 runtime/formal 語意確實不同；raw frame-local 最適合作為 Final MVP基線，而新 temporal parameters 缺代表性與裝置證據。精確決策為 Adopt 分離且版本化的 contracts，並保留目前 production 行為。

未修改 production Task 77、Task 79、Capture、Review、publisher、pose.v1 或 metrics.v1；沒有 physical-device claim，Task 84 未開始。
