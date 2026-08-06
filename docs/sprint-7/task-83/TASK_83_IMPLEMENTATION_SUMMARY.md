# Task 83 實作摘要

新增 `frontend/src/experiments/analysisProfiles/`：candidate profile unions、validator、strict sequence identity、raw/causal/non-causal preprocessing、formal metric evaluator、angle-series comparison及合成 fixtures/tests。Transition input 明確指定 metric/session/frame/target/tolerance；result 區分未評估、未達標與 lagFrames，且不跨 session、不把 unavailable 當 0°。

structured evidence 為 raw lag 0、causal candidate lag 3、non-causal candidate lag 1；這些只適用指定合成 fixtures。精確決策維持 Adopt 分離且版本化的 contracts，並保留目前 production 行為。

未修改 production Task 77、Task 79、Capture、Review、publisher、pose.v1 或 metrics.v1；沒有 physical-device claim，Task 84 未開始。
