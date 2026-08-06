# Task 83 實驗結果

環境：Windows、Vitest/Node、合成 33-landmark Pose；13 個 focused tests。沒有 camera、真實人體 ground truth 或物理裝置證據。

- noiseless raw：0° 與 90° 正確且 available；90° MAE=0。
- 88°/92°/89° 對 90° truth：raw valid 3/3、MAE 1.667°、max error 2°。
- world-3D 缺失：序列为 90°/missing/90°，valid 2、unavailable 1、false 0° availability 為 0。
- causal step 30°→150°：首個 transition frame 明顯未達 150°，證明至少一 frame（fixture cadence 33 ms）的 lag。
- centered candidate：transition 前一 frame 已受 future frame 影響；edge window 截短。
- session 2 首幀回到精確 30°，證明不跨 session smoothing。
- Task 77 的 88/92 alternating range 小於 raw 4°；短 confidence loss 為 degraded hold，長失聯成 unavailable，session reset 後無污染。

timing 欄位均由 monotonic clock 分離，但共享 CI 的絕對數字不作產品判斷。重複 non-causal runs samples deep-equal；這是重現性證據，不是實際生物力學準確度。
