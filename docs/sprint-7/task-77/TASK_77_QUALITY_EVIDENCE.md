# Task 77 — Synthetic Quality Evidence

Evidence source: deterministic Vitest fixtures on the development workstation, not camera or physical-device validation.

| Fixture | Result |
| --- | ---: |
| Stationary oscillation Raw RMS jitter | 0.0176486 normalized |
| Stationary oscillation Filtered RMS jitter | 0.00328791 normalized |
| Jitter reduction | 81.37% |
| Slow linear movement maximum coordinate lag | 0.0261751 normalized |
| Single 0.5 -> 0.9 spike at 33 ms | held at 0.5, `outlier-rejected` |
| Sustained 0.9 movement | resumes filtered tracking; not permanently frozen |
| Low-confidence hold | timestamps 33/66/99 ms held from source 0 |
| Unavailable transition | 132 ms / fourth missing sample |
| Recovery | next valid sample initializes deterministically |
| Processing duration, 120-frame synthetic run | mean 0.0982 ms; max 0.3993 ms |

Processing numbers are test-environment observations and may vary. One Euro is causal and adds no frame queue; its tradeoff is coordinate lag, not delayed publication. The fixture is not asserted against the provisional 0.012 physical target because its synthetic scale is not a calibrated camera sequence. Task 84 remains the physical acceptance authority.
