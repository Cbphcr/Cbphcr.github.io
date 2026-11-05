"""Does a rollout's own reward in the denominator cause the small-group bias?

Exponential(1) labels, squared-error reward, x ~ N(mu, 0.2^2). Compares the usual
group std with a leave-one-out std that excludes the rollout being normalized.

Run: uv run --no-project --with numpy python loo_std.py
Writes loo_results.json next to this file. Deterministic for a fixed seed.
"""
import json
from pathlib import Path

import numpy as np

SEEDS, BATCH, STEPS = 8, 32, 40000


def run(denominator, shared_label, n, sigma=0.2, seed=0):
    g = np.random.default_rng(seed)
    mu = np.ones(SEEDS)
    tail = np.zeros(SEEDS)
    count = 0
    lr = 0.02 * sigma
    for t in range(STEPS):
        z = g.normal(size=(SEEDS, BATCH, n))
        x = mu[:, None, None] + sigma * z
        y = g.exponential(1.0, (SEEDS, BATCH, 1 if shared_label else n))
        r = -((x - y) ** 2)
        adv = r - r.mean(-1, keepdims=True)
        if denominator == "group":
            adv = adv / (r.std(-1, ddof=1, keepdims=True) + 1e-6)
        else:
            total = r.sum(-1, keepdims=True)
            squares = (r * r).sum(-1, keepdims=True)
            others_mean = (total - r) / (n - 1)
            others_var = np.maximum((squares - r * r) - (n - 1) * others_mean**2, 0) / (n - 2)
            adv = adv / (np.sqrt(others_var) + 1e-6)
        mu = mu + lr * (adv * z / sigma).mean((1, 2))
        if t >= STEPS * 3 // 4:
            tail += mu
            count += 1
    final = tail / count
    return {
        "mean": round(float(final.mean()), 3),
        "min": round(float(final.min()), 3),
        "max": round(float(final.max()), 3),
    }


def main():
    rows = []
    for n in (4, 8, 16, 64):
        row = {"n": n}
        for label, shared in (("independent", False), ("shared", True)):
            for denominator in ("group", "loo"):
                row[f"{label}_{denominator}"] = run(denominator, shared, n)
        rows.append(row)
        print(row, flush=True)
    out = Path(__file__).with_name("loo_results.json")
    out.write_text(json.dumps({"rows": rows}, indent=1) + "\n")


if __name__ == "__main__":
    main()
