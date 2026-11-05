"""Two-action bandit: does group-std GRPO still pick the higher-mean action?

Action B always has the higher true mean reward. Noise is drawn per rollout
unless the scenario says otherwise. No language model or real judge is involved.

Run: uv run --no-project --with numpy python judge_sim.py
Writes judge_results.json next to this file. Deterministic for a fixed seed.
"""
import json
from pathlib import Path

import numpy as np

SEEDS, BATCH, STEPS = 8, 32, 30000


def binary(g, b):
    return (g.random(b.shape) < np.where(b, 0.65, 0.60)).astype(float)


def same_noise(g, b):
    return np.where(b, 0.65, 0.60) + g.normal(0, 0.2, b.shape)


def b_noisier(g, b):
    return np.where(b, 0.65, 0.60) + g.normal(0, 1, b.shape) * np.where(b, 0.3, 0.02)


def b_bimodal(g, b):
    return np.where(b, np.where(g.random(b.shape) < 0.5, 1.0, 0.3), 0.60)


def rare_win(g, b):
    return np.where(b, (g.random(b.shape) < 0.15).astype(float), 0.10)


def shared_strictness(g, b):
    strictness = g.uniform(0.5, 1.5, (b.shape[0], b.shape[1], 1))
    return strictness * np.where(b, 0.65, 0.60) + g.normal(0, 0.05, b.shape)


SCENARIOS = {
    "binary pass/fail, 0.60 vs 0.65": binary,
    "same gaussian noise sd 0.2, 0.60 vs 0.65": same_noise,
    "B noisier, 0.60 sd 0.02 vs 0.65 sd 0.3": b_noisier,
    "B bimodal, 0.60 fixed vs {1, 0.3}, mean 0.65": b_bimodal,
    "B rare big win, 0.10 fixed vs 1 with prob 0.15": rare_win,
    "shared per-group strictness 0.5-1.5, 0.60 vs 0.65": shared_strictness,
}


def run(reward_fn, mode, n, lr):
    g = np.random.default_rng(0)
    theta = np.zeros(SEEDS)
    tail = np.zeros(SEEDS)
    count = 0
    for t in range(STEPS):
        pi = 1 / (1 + np.exp(-theta))
        chose_b = g.random((SEEDS, BATCH, n)) < pi[:, None, None]
        reward = reward_fn(g, chose_b)
        adv = reward - reward.mean(-1, keepdims=True)
        if mode == "group_std":
            adv = adv / (reward.std(-1, ddof=1, keepdims=True) + 1e-6)
        score = np.where(chose_b, 1 - pi[:, None, None], -pi[:, None, None])
        theta = np.clip(theta + lr * (adv * score).mean((1, 2)), -6, 6)
        if t >= STEPS * 3 // 4:
            tail += 1 / (1 + np.exp(-theta))
            count += 1
    return round(float((tail / count).mean()), 3)


def main():
    rows = []
    for name, fn in SCENARIOS.items():
        row = {"scenario": name}
        for n in (4, 8, 64):
            row[f"none_n{n}"] = run(fn, "none", n, 0.5)
            row[f"group_std_n{n}"] = run(fn, "group_std", n, 0.1)
        rows.append(row)
        print(row, flush=True)
    out = Path(__file__).with_name("judge_results.json")
    out.write_text(json.dumps({"p_choose_b": rows}, indent=1, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()
