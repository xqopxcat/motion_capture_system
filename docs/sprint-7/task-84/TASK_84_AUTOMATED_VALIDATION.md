# Task 84 Automated Validation

新增／沿用測試覆蓋：300-sample bounded buffers；count/min/max/mean/p50/p95；export無Raw landmarks；500ms cadence；production mode禁用；disabled/failure-safe path；camera-session rotate reset；stale clear；front/rear/Review mirror；toggle independence；one Canvas；Raw recording/formal Review/persistence boundaries；Tasks 77–83。

命令：`npm test -- --run <focused files>`、`npm test`、`npx tsc -b`、`npm run build`（frontend）。Vite production build不包含啟用中的 diagnostics panel，因 `resolveCaptureDiagnosticsEnabled`要求 DEV且明示flag。

限制：Vitest不是實體camera/browser；不驗證permission、alignment、perceived lag、thermal、memory、MediaRecorder、真正publication network或mobile secure context。自動PASS不能勾選manual acceptance。

Phase A 執行結果：focused Task 77–84/Capture validation 11 files、121 tests通過；完整 frontend 59 files、383 tests通過；TypeScript build與Vite production build通過。Build僅出現既有的>500 kB chunk warning。
