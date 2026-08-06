# Task 83 實驗結果

環境：Windows、Vitest/Node、合成 33-landmark Pose；19 個 focused tests。沒有 camera、真實人體 ground truth 或物理裝置證據。

- noiseless raw：0° 與 90° 正確且 available；90° MAE=0。
- 88°/92°/89° 對 90° truth：raw valid 3/3、MAE 1.667°、max error 2°。
- world-3D 缺失：90°/missing/90° 為 valid 2、unavailable 1、false 0° availability 為 0。
- structured transition evaluator 明確指定 metric、session、frame、target、tolerance。30°→150° step 的 raw frame-local lag 0 frames；alpha=0.5 causal replay 在 ±5° 下 lag 3 frames；radius=1 non-causal centered candidate 在其 ±10° fixture 下 lag 1 frame。
- evaluator 只使用同 session、transition frame 之後的 available samples，tolerance boundary inclusive。未提供 transition 為 `evaluated=false`；已評估但未達 target 為 `evaluated=true/reachedTarget=false/lagFrames=null`。
- session 2 首幀回到精確 30°；另一 session 的 target 不會滿足前一 session transition。
- Task 77 的 88/92 alternating range 小於 raw 4°；短 confidence loss 為 degraded hold，長失聯成 unavailable。

timing 由 monotonic clock 分離，但共享 CI 絕對數字不作產品判斷。重複 runs 的 samples 與 transition result deep-equal；這是合成重現性證據，不是物理裝置 responsiveness 或實際生物力學準確度。
