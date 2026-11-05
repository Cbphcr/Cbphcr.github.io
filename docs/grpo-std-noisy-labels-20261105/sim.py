"""Where does a Gaussian policy converge under GRPO advantage variants?

The policy samples one scalar per rollout. Each group of n rollouts shares a
single random label. No language model or research behaviour is involved: the
script isolates what the reward plus the advantage transform pull towards.

Run: uv run --no-project --with numpy python sim.py
Writes results.json next to this file. Deterministic for fixed seeds.
"""
import json
from pathlib import Path

import numpy as np

SEEDS = 8
BATCH = 32
STEPS = 40000


def brier(p, y):
    return 1 - (p - y) ** 2


def log_score(p, y):
    p = np.clip(p, 1e-4, 1 - 1e-4)
    return y * np.log(p) + (1 - y) * np.log(1 - p)


def spherical(p, y):
    return (y * p + (1 - y) * (1 - p)) / np.sqrt(p**2 + (1 - p) ** 2)


def transform(reward, mode):
    """Apply a GRPO advantage variant over the group axis (last)."""
    adv = reward - reward.mean(-1, keepdims=True)
    if mode == "group_std":
        adv = adv / (reward.std(-1, ddof=1, keepdims=True) + 1e-6)
    elif mode == "batch_std":
        std = adv.std(axis=(-1, -2), keepdims=True)
        adv = adv / (std + 1e-6)
    return adv


def run_binary(score, mode, q, sigma=0.2, n=8, expected=False, seed=0, lr=0.02):
    """Bernoulli(q) label, policy logit(p) ~ N(mu, sigma). Returns p per seed."""
    rng = np.random.default_rng(seed)
    mu = np.zeros(SEEDS)
    tail = np.zeros(SEEDS)
    count = 0
    for t in range(STEPS):
        z = rng.normal(size=(SEEDS, BATCH, n))
        p = 1 / (1 + np.exp(-(mu[:, None, None] + sigma * z)))
        if expected:
            reward = q * score(p, 1.0) + (1 - q) * score(p, 0.0)
        else:
            y = (rng.random((SEEDS, BATCH, 1)) < q).astype(float)
            reward = score(p, y)
        grad = (transform(reward, mode) * z / sigma).mean(axis=(1, 2))
        mu = np.clip(mu + lr * grad, -8, 8)
        if t >= STEPS * 3 // 4:
            tail += mu
            count += 1
    return 1 / (1 + np.exp(-tail / count))


def run_regression(sampler, reward_fn, mode, start, sigma, n=8, seed=0, shared_label=True):
    """Scalar prediction x ~ N(mu, sigma), label from sampler. Returns mu per seed."""
    rng = np.random.default_rng(seed)
    mu = np.full(SEEDS, float(start))
    tail = np.zeros(SEEDS)
    count = 0
    # Per-step movement scales as 1/sigma after group std and as a constant
    # without it, so both step sizes are matched to sigma.
    lr = 0.02 * sigma if mode == "group_std" else 0.01
    for t in range(STEPS):
        z = rng.normal(size=(SEEDS, BATCH, n))
        x = mu[:, None, None] + sigma * z
        y = sampler(rng, (SEEDS, BATCH, 1 if shared_label else n))
        grad = (transform(reward_fn(x, y), mode) * z / sigma).mean(axis=(1, 2))
        mu = mu + lr * grad
        if t >= STEPS * 3 // 4:
            tail += mu
            count += 1
    return tail / count


def squared(x, y):
    return -((x - y) ** 2)


def pinball(tau):
    def fn(x, y):
        err = y - x
        return -np.maximum(tau * err, (tau - 1) * err)

    return fn


def summarize(values):
    return {
        "mean": round(float(np.mean(values)), 3),
        "min": round(float(np.min(values)), 3),
        "max": round(float(np.max(values)), 3),
    }


def two_point(a, b, prob_b):
    def sampler(rng, shape):
        return np.where(rng.random(shape) < prob_b, b, a).astype(float)

    return sampler


DISTRIBUTIONS = {
    "exponential(1)": (lambda g, s: g.exponential(1.0, s), 1.0, float(np.log(2))),
    "lognormal(0,1)": (lambda g, s: g.lognormal(0.0, 1.0, s), float(np.exp(0.5)), 1.0),
    "gamma(2,1)": (lambda g, s: g.gamma(2.0, 1.0, s), 2.0, 1.678),
    "two-point {0,10}, P(10)=0.4": (two_point(0, 10, 0.4), 4.0, 0.0),
    "normal(1,1)": (lambda g, s: g.normal(1.0, 1.0, s), 1.0, 1.0),
    "uniform(0,2)": (lambda g, s: g.uniform(0.0, 2.0, s), 1.0, 1.0),
    "constant 0.3": (lambda g, s: np.full(s, 0.3), 0.3, 0.3),
}


def main():
    results = {"config": {"seeds": SEEDS, "batch": BATCH, "steps": STEPS}}

    binary = []
    for name, score in [("brier", brier), ("log", log_score), ("spherical", spherical)]:
        for q in (0.2, 0.4, 0.6, 0.8):
            for mode, expected in [
                ("none", False),
                ("batch_std", False),
                ("group_std", False),
                ("none", True),
                ("group_std", True),
            ]:
                binary.append(
                    {
                        "score": name,
                        "q": q,
                        "mode": mode,
                        "target": "expected" if expected else "sampled",
                        **summarize(run_binary(score, mode, q, expected=expected)),
                    }
                )
    results["binary"] = binary
    print("binary done", flush=True)

    results["binary_sigma"] = [
        {"sigma": s, "q": 0.4, **summarize(run_binary(brier, "group_std", 0.4, sigma=s))}
        for s in (0.05, 0.2, 0.5, 1.0, 2.0)
    ]
    results["binary_group"] = [
        {"n": n, "q": 0.4, **summarize(run_binary(brier, "group_std", 0.4, n=n))}
        for n in (2, 4, 8, 16, 64)
    ]
    print("binary sweeps done", flush=True)

    regression = []
    for name, (sampler, mean, median) in DISTRIBUTIONS.items():
        scale = max(abs(mean), 1.0)
        for sigma_ratio in (0.05, 0.2, 0.5, 1.0, 2.0, 5.0):
            sigma = sigma_ratio * scale
            row = {"label": name, "true_mean": round(mean, 3), "true_median": round(median, 3), "sigma": round(sigma, 3)}
            for mode in ("none", "group_std"):
                row[mode] = summarize(run_regression(sampler, squared, mode, mean, sigma))
            regression.append(row)
        print(name, "done", flush=True)
    results["regression"] = regression

    exp = lambda g, s: g.exponential(1.0, s)
    results["regression_group"] = [
        {"n": n, **summarize(run_regression(exp, squared, "group_std", 1.0, 0.2, n=n))}
        for n in (2, 4, 8, 16, 64)
    ]

    # exponential(1): tau-quantile is -ln(1-tau).
    pinball_rows = []
    for tau in (0.1, 0.5, 0.9):
        row = {"tau": tau, "true_quantile": round(float(-np.log(1 - tau)), 3)}
        for mode in ("none", "group_std"):
            row[mode] = summarize(run_regression(exp, pinball(tau), mode, 1.0, 0.2))
        pinball_rows.append(row)
    results["pinball"] = pinball_rows

    out = Path(__file__).with_name("results.json")
    out.write_text(json.dumps(results, indent=1, ensure_ascii=False) + "\n")
    print("written", out, flush=True)


if __name__ == "__main__":
    main()
