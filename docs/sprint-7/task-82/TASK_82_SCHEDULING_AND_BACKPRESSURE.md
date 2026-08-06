# Task 82 排程與背壓

production 已採用 requestVideoFrameCallback 優先、requestAnimationFrame fallback、最小推論間隔、單一 in-flight 與一個 latest pending frame。舊 pending 會被釋放，generation/session 不符或序號落後的結果不發布。

實驗佇列重現相同上限，不建立無界 queue。Worker 候選若後續實作，必須保留 identity、transferable 的釋放責任，以及 stop/pause/camera flip/dispose 的 stale-result 規則；Worker 不能被當成排程策略本身。
