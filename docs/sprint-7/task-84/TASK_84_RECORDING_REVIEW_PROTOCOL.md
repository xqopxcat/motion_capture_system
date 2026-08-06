# Task 84 Recording / Review Protocol

錄製至少30秒，涵蓋 stationary、squat、occlusion；確認 Record/Stop prompt、完成與publication。進 Review 後 play、pause、seek forward/backward、ended，再反覆同一 frame；確認 Canvas aspect ratio/560px上限、Skeleton/Angles獨立toggle、clear→skeleton→angles單Canvas composition。

Review 必須 non-mirrored、使用 recorded Raw pose frame與 Task 79 formal world-3D calculation；不得啟動 live camera inference。檢查 seeking選正確 frame、一幀cache不顯示 stale result。保存的 pose.v1仍為33-landmark Raw，metrics.v1不含 runtime Filtered Pose、runtime angles或Review display cache。
