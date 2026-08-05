# Task 80 — Visual Profile

Profile `angle-overlay.v1` centralizes all drawing values. Arc width is 2–5 CSS px around a 3 px base. Radius is 14–42 CSS px at 28% of the shorter adjacent segment. Label font is 13 CSS px with profile-driven padding/offset. CSS values convert to Canvas pixels via DPR and a bounded viewport scale.

Left arcs reuse teal `#36c8b5`, right arcs orange `#ffad66`, and center is light neutral. Labels use light text over a restrained translucent dark rectangle. Available opacity is 0.96; degraded opacity is 0.58 with a DPR-scaled 4/3 dash. The renderer saves/restores Canvas state and never resizes the Canvas.
