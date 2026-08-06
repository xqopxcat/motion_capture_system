# Task 83 最終建議

Overall decision: Adopt.

Production MVP 應採用分離、版本化的 Realtime Display 與 Final Analysis profile contracts。Realtime contract 明確擁有 causal stability、bounded hold、stale與degraded display semantics；Final contract 明確擁有 Raw authority、world-3D frame-local formal calculation、available/unavailable、重現性與 artifact provenance。

本決策不代表現在導入新 filtering：Task 77 參數與 Task 79 frame-local formal 行為保持不變。新的 realtime tuning、causal replay、non-causal smoothing與formal interpolation均延後至 Task 84 代表性動作／物理裝置證據；重播 runtime filter 作 formal evidence 不建議。正式 production type/schema rollout 應列後續 backlog，先解決 metrics provenance migration。
