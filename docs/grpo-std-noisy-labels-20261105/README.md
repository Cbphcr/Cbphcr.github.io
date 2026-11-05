# GRPO group-std simulations

Supports `_pages/notes/grpo-std-noisy-labels.md`. These are toy models with no
language model, and they do not measure real training behaviour.

```bash
uv run --no-project --with numpy python sim.py
uv run --no-project --with numpy python theory.py
uv run --no-project --with numpy python judge_sim.py
uv run --no-project --with numpy python loo_std.py
uv run --no-project --with numpy python fallback_sim.py
```

- `sim.py` writes `results.json`: binary scoring rules, sigma and group sweeps,
  continuous labels, and pinball loss.
- `theory.py` reads `results.json`, solves the closed-form fixed point, runs the
  finite-group and independent-label checks, and writes `theory.json`.
- `judge_sim.py` writes `judge_results.json`: a two-action bandit with judge-style
  reward noise.
- `loo_std.py` writes `loo_results.json`: group std against leave-one-out std under
  shared and independent labels.
- `fallback_sim.py` writes `fallback_results.json`: judge API failures, gradient
  signal-to-noise, and action selection.
