# Task 83 評估準則

Realtime 必須 causal、無 future dependency、有界 latency/hold、低成本、穩定且能快速 recovery，並在 session/gap 重設。Final 必須從 Raw 可重算、與 wall-clock/render cadence 無關、ordered deterministic、明示 missing/outlier/interpolation、保留快速真實運動且具版本 provenance。

共同準則：ownership、testability、backward/schema impact、portability、migration 與 maintenance。合成 truth 只衡量誤差、jitter、lag、coverage 與重現性，不代表臨床、實驗室或物理裝置準確度。

- Adopt：分離契約解決已證明的 authority/provenance 語意問題，邊界穩定可測，且可先保留現行演算法避免品質風險。
- Defer：契約合理但仍無足夠證據選定必要邊界，或導入本身會破壞相容性。
- Reject：只有名稱差異、不可重現，或複雜度高於語意與品質效益。

新 smoothing/interpolation 參數須待代表性動作與 Task 84 裝置證據，不因合成 fixture 自動進 production。
