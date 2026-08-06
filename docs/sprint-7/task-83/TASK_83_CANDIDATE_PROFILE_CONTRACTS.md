# Task 83 候選 Profile 契約

隔離型別以 `kind` discriminant 分開 `RealtimeDisplayProfile` 與 `FinalAnalysisProfile`，全部 immutable。共同欄位包含 id/version、input/output、authority、confidence、outlier、missing、3D/fallback、timestamp、determinism、provenance。

Realtime 明定 causal=true、usesFutureFrames=false、Task 77 One Euro、bounded hold、session/gap reset、runtime metric、不可持久化。Final 是互斥 union：raw-frame-local、causal coordinate EMA replay、non-causal centered coordinate average；各自固定 causal/future、warm-up、hold/interpolation、metric compatibility 與 persistence eligibility，validator 拒絕矛盾組合。

只有 raw-frame-local 候選目前具 persistence eligibility；另兩者只是實驗，未具批准的 outlier、missing、provenance artifact 契約。
