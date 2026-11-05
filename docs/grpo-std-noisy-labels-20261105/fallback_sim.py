"""Judge-API fallback as a rollout-level outlier in a two-action bandit.

A failed judge call returns reward 0 regardless of the response. True quality is
0.60 for action A and 0.65 for action B, with judge noise of sd tau. Two questions:

1. Gradient signal-to-noise at pi(B)=0.5 when failures do not depend on the action.
2. Which action training selects when failures hit B more often.

Run: uv run --no-project --with numpy python fallback_sim.py
Writes fallback_results.json next to this file. Deterministic for fixed seeds.
"""
import json
from pathlib import Path

import numpy as np

METHODS = ("mean_only", "mean_std", "median_mad", "drop_failed", "drop_failed_std")


def advantage(reward, failed, method):
    if method == "mean_only":
        return reward - reward.mean(-1, keepdims=True)
    if method == "mean_std":
        return (reward - reward.mean(-1, keepdims=True)) / (reward.std(-1, ddof=1, keepdims=True) + 1e-6)
    if method == "median_mad":
        med = np.median(reward, -1, keepdims=True)
        mad = np.median(np.abs(reward - med), -1, keepdims=True)
        return (reward - med) / (mad + 1e-6)
    # Failed rollouts are treated as missing data: excluded from statistics and loss.
    ok = ~failed
    count = ok.sum(-1, keepdims=True)
    mean = (reward * ok).sum(-1, keepdims=True) / np.maximum(count, 1)
    adv = (reward - mean) * ok
    if method == "drop_failed_std":
        var = (((reward - mean) * ok) ** 2).sum(-1, keepdims=True) / np.maximum(count - 1, 1)
        adv = adv / (np.sqrt(var) + 1e-6)
    return adv


def sample(g, chose_b, rho_a, rho_b, tau):
    failed = g.random(chose_b.shape) < np.where(chose_b, rho_b, rho_a)
    quality = np.where(chose_b, 0.65, 0.60) + g.normal(0, tau, chose_b.shape)
    return np.where(failed, 0.0, quality), failed


def snr(method, rho, tau, n, reps=4000, batch=32, seed=0):
    """Mean over sd of the batch gradient for theta at pi(B)=0.5. Scale-free."""
    g = np.random.default_rng(seed)
    chose_b = g.random((reps, batch, n)) < 0.5
    reward, failed = sample(g, chose_b, rho, rho, tau)
    grad = (advantage(reward, failed, method) * np.where(chose_b, 0.5, -0.5)).mean((1, 2))
    return round(float(grad.mean() / grad.std()), 3)


def train(method, rho_b, tau, n, seeds=8, batch=32, steps=30000):
    g = np.random.default_rng(0)
    lr = 0.5 if method in ("mean_only", "drop_failed") else 0.1
    theta = np.zeros(seeds)
    tail = np.zeros(seeds)
    count = 0
    for t in range(steps):
        pi = 1 / (1 + np.exp(-theta))
        chose_b = g.random((seeds, batch, n)) < pi[:, None, None]
        reward, failed = sample(g, chose_b, 0.0, rho_b, tau)
        score = np.where(chose_b, 1 - pi[:, None, None], -pi[:, None, None])
        theta = np.clip(theta + lr * (advantage(reward, failed, method) * score).mean((1, 2)), -6, 6)
        if t >= steps * 3 // 4:
            tail += 1 / (1 + np.exp(-theta))
            count += 1
    final = tail / count
    return {"mean": round(float(final.mean()), 3), "min": round(float(final.min()), 3), "max": round(float(final.max()), 3)}


def main():
    out = {"snr": [], "action_dependent": []}
    for tau in (0.02, 0.2):
        for n in (4, 8):
            for rho in (0.0, 0.02, 0.05, 0.1, 0.2):
                row = {"tau": tau, "n": n, "rho": rho, **{m: snr(m, rho, tau, n) for m in METHODS}}
                out["snr"].append(row)
                print(row, flush=True)
    for n in (4, 8, 64):
        row = {"n": n, "rho_b": 0.1, "tau": 0.02, **{m: train(m, 0.1, 0.02, n) for m in METHODS}}
        out["action_dependent"].append(row)
        print(row, flush=True)
    Path(__file__).with_name("fallback_results.json").write_text(json.dumps(out, indent=1) + "\n")


if __name__ == "__main__":
    main()
