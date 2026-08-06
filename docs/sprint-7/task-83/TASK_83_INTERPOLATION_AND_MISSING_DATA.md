# Task 83 插值與 Missing Data

實驗採 no interpolation：當前 frame 無 world-3D 時，即使左右鄰 frame 有資料仍 unavailable；不產生 0°，也不把 normalized-2D 冒充 formal world-3D。long gap 與 session boundary 永不插值。

單幀或 bounded short-gap interpolation 技術上可 deterministic，但它是推估而非觀測。若未來採用，必須逐 sample 記錄 interpolated provenance、gap 長度、來源 frame，且 formal summaries 預設排除，除非 metric policy 明確批准。插值不得是 smoothing 的隱藏副作用。
