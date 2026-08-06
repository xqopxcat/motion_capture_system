# Task 84 Skeleton Alignment Protocol

在 frame center、left/right edge、top/bottom，並於 portrait、landscape、front、rear、Recorded Review 逐一檢查 nose、eyes、shoulders、elbows、wrists、hips、knees、ankles。特別重測曾出現 nose 落在 philtrum 的垂直誤差。

每個錯誤記錄 screenshot/video reference、source/display/Canvas dimensions、DPR、mirror、object-fit與位置。分類為 uniform translation、scale、object-fit、mirror、source-dimension、Canvas CSS/internal dimension、MediaPipe estimation或perspective/occlusion。

只有從 video-to-Canvas projection contract 推導出的錯誤才可修 geometry；不得用任意 global offset 遮掩模型估計誤差。
