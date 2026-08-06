# Task 84 Evidence Schema

每筆 JSON/Markdown evidence 必含：runId、buildSha、tester、dateTime、device/model、OS/version、browser/version、camera、orientation、viewport、networkContext、accessMode、scenario、result、observations、performanceSummary、alignmentObservations、angleObservations、recordingReviewObservations、mediaReferenceNames、reproductionSteps、suspectedSubsystem、followUpStatus。

`result` 僅允許 `pass | concern | blocker | not-run`。未知數值用 `null`/unavailable，不填0。媒體只記描述性檔名；預設不 commit或上傳 personal video、照片、Raw landmark arrays。diagnostics JSON是bounded aggregate，仍應在分享前檢查 tester/device隱私。
