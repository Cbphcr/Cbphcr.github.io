# GRPO group-std simulations

Supports `_pages/notes/grpo-std-noisy-labels.md`. These are toy models with no
language model, and they do not measure real training behaviour.

```bash
uv run --no-project --with numpy python sim.py
uv run --no-project --with numpy python theory.py
```

- `sim.py` writes `results.json`: binary scoring rules, sigma and group sweeps,
  continuous labels, and pinball loss.
- `theory.py` reads `results.json`, solves the closed-form fixed point, runs the
  finite-group and independent-label checks, and writes `theory.json`.
