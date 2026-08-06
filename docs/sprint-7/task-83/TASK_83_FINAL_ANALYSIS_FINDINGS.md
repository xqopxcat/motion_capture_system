# Task 83 Final Analysis 結果

Raw frame-local 完全保留 noiseless truth、缺失與快速 extreme，structured exact step lag 0，最易重算，且就是目前 Task 79 行為。缺點是 noise 不被 temporal context 降低。

Causal replay deterministic 且不跨 session；structured evaluator 對核准 fixture 回報 lag 3 frames。重播 Task 77-style runtime state會帶入為顯示設計的 hold/degraded 語意，因此不適合作為正式 evidence 的捷徑。Non-causal centered coordinate average 回報 lag 1 frame，且 transition 前已受 future frame 影響；它能降低局部 noise，但造成 boundary distortion，參數尚無代表性動作依據。

Final 目前應維持 available/unavailable，不引入 runtime degraded enum。優先方向是版本化 raw frame-local Final contract；sequence smoothing 留待新證據與獨立正式 preprocessing 契約。
