# Task 84 驗證策略

Phase A 由 repository 完成：bounded diagnostics、自動回歸、secure setup、motion/alignment/angle/Review protocol、證據模板。Phase B 由使用者在真實 Desktop Chrome、Android Chrome、iOS Safari 執行。Phase C 對實際證據分類並在 Task 84 修 confirmed blocker；Phase D 只有在重跑通過且使用者明確接受後才能關閉 Sprint 7。

自動測試只能證明 contract，不代表相機、對齊、主觀 lag、熱或 mobile browser。Pass 表示操作持續可用、queue 有界、錄製完成；Concern 是可恢復 lag/jitter/freeze/熱衰退；Blocker 是 required camera 無法啟動、UI unusable、錄製失敗、明顯錯位、stale/session contamination、crash/reload、錯 frame/joint 或 artifact corruption。未執行必須標 `not-run`。

confirmed blocker 必須重現、定位、同 Task 修正、補回歸、更新 evidence 並重跑；不建立 Task 84.1。Worker migration、模型/schema/backend 大改不在此階段。
