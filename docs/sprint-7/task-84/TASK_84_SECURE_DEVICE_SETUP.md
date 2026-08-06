# Task 84 安全裝置設定

相機必須在 eligible secure context。不得關閉 browser security，不得 commit certificate/private key；現有 `.gitignore` 排除 `.env*`、logs、dist，但任何本機憑證仍只能放在 repository 外。

Desktop：checkout 測試 SHA，設定核准的 backend/auth，執行 `npm run dev`，以 `http://localhost:5173` 測試；localhost 是瀏覽器特例。加入 `?captureDiagnostics=1` 只會在 development build 顯示 diagnostics。

Android/iOS：plain `http://<LAN-IP>:5173` 通常不具 camera secure context，不列為核准流程。本 repository 尚無 LAN HTTPS/certificate automation；優先使用既有核准 HTTPS preview/deployment，確認 frontend/API origins、OAuth redirect、Secure cookie、CSRF/CORS 都是該 HTTPS origin。Vite `--host` 只處理 binding，不能自行提供可信 HTTPS；firewall 只開測試所需 port，結束後關閉。

三平台均先確認 URL 與 build SHA、登入、camera permission、network context；iOS 使用 Safari，Android 使用 Chrome。若沒有核准 HTTPS preview，mobile runs 保持 not-run，不以降低安全性替代。
