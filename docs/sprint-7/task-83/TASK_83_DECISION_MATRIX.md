# Task 83 決策矩陣

| 候選 | 用途 | causal/future | latency/jitter/fast lag | 合成誤差與 coverage | missing/outlier/interpolation | determinism/provenance | 複雜度/schema | MVP 建議 |
|---|---|---|---|---|---|---|---|---|
| Task 77 realtime | live display | yes/no | 有界；jitter range 降低；step 有 lag | 非 formal accuracy | hold→unavailable；velocity gate；none | per-session deterministic；runtime ID 清楚 | 已存在；無 schema change | 保留 |
| tuned realtime | live display | yes/no | 無裝置證據 | 未量測 | 待 Task 84 | 可版本化 | 中 | 暫不調參 |
| raw frame-local final | formal MVP | yes/no | structured exact step lag 0；保留 fast extreme | noiseless MAE 0；noise MAE 1.667°；3/3 | missing unavailable；none；none | 最清楚、可重算 | 最低；現有欄位 | 採契約基線 |
| causal replay final | offline candidate | yes/no | structured step lag 3 frames（±5°） | deterministic；coverage 依 raw | no hold/interpolation | 需新 profile lineage | 中 | 不用 runtime replay 作 formal |
| non-causal coordinate | offline candidate | no/yes | structured lag 1 frame（±10°）；transition 前 distortion | missing case 2/3 valid | missing 保留；none | transition result deterministic；需新 provenance | 中高、metrics gap | 待代表性證據 |
| angle-series smoothing | summary candidate | no/yes | 可能削弱 extremes | 與 landmark-first 不相等 | null 保留；none | 可重現但較難解釋 | 中、需新 profile | 不列 MVP 預設 |
