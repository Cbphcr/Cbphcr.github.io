"""Closed-form fixed points for group-std GRPO with a squared-error reward.

For x = mu + sigma*z and R = -(x-y)^2, as n -> infinity the normalized advantage
has drift (y-mu) / sqrt((y-mu)^2 + sigma^2/2), the negative gradient in mu of
E[sqrt((mu-y)^2 + sigma^2/2)]. This script solves for the root and compares it
with the n=8 simulation in results.json.

Run: uv run --no-project --with numpy python theory.py
"""
import json
from pathlib import Path

import numpy as np

from sim import run_regression, squared, summarize


def weighted(values, weights):
    return np.asarray(values, float), np.asarray(weights, float) / np.sum(weights)


def quantile_grid(inverse_cdf, m=400000):
    u = (np.arange(m) + 0.5) / m
    return weighted(inverse_cdf(u), np.ones(m))


def lognormal_quantiles(u):
    # Inverse normal CDF by bisection is unnecessary: sample a dense grid instead.
    z = np.linspace(-9, 9, 400001)
    pdf = np.exp(-z * z / 2)
    cdf = np.cumsum(pdf) / pdf.sum()
    return np.exp(np.interp(u, cdf, z))


def gamma2_quantiles(u):
    y = np.linspace(0, 40, 400001)
    cdf = 1 - np.exp(-y) * (1 + y)
    return np.interp(u, cdf, y)


LABELS = {
    "exponential(1)": quantile_grid(lambda u: -np.log(1 - u)),
    "lognormal(0,1)": quantile_grid(lognormal_quantiles),
    "gamma(2,1)": quantile_grid(gamma2_quantiles),
    "two-point {0,10}, P(10)=0.4": weighted([0.0, 10.0], [0.6, 0.4]),
}


def fixed_point(ys, ws, sigma):
    lo, hi = float(ys.min()) - 1, float(ys.max()) + 1
    for _ in range(80):
        mu = (lo + hi) / 2
        drift = np.sum(ws * (ys - mu) / np.sqrt((ys - mu) ** 2 + sigma**2 / 2))
        lo, hi = (mu, hi) if drift > 0 else (lo, mu)
    return (lo + hi) / 2


def main():
    here = Path(__file__).parent
    results = json.loads((here / "results.json").read_text())
    rows = []
    for row in results["regression"]:
        if row["label"] not in LABELS:
            continue
        ys, ws = LABELS[row["label"]]
        rows.append(
            {
                "label": row["label"],
                "sigma": row["sigma"],
                "theory": round(fixed_point(ys, ws, row["sigma"]), 3),
                "simulated_n8": row["group_std"]["mean"],
            }
        )
    ys, ws = LABELS["exponential(1)"]
    limit = round(fixed_point(ys, ws, 0.2), 3)
    # Two direct checks of the assumptions behind the closed form.
    exp = lambda g, shape: g.exponential(1.0, shape)
    finite_group = [
        {"n": n, **summarize(run_regression(exp, squared, "group_std", 1.0, 2.0, n=n))} for n in (8, 64, 256)
    ]
    independent = [
        {
            "n": n,
            "sigma": sigma,
            **summarize(run_regression(exp, squared, "group_std", 1.0, sigma, n=n, shared_label=False)),
        }
        for n in (8, 64)
        for sigma in (0.2, 2.0)
    ]
    print("finite group, exponential, sigma=2, theory", round(fixed_point(ys, ws, 2.0), 3), finite_group)
    print("independent labels per rollout", independent)
    (here / "theory.json").write_text(
        json.dumps(
            {
                "regression": rows,
                "exponential_sigma_0.2_theory": limit,
                "finite_group_exponential_sigma_2": finite_group,
                "independent_labels_exponential": independent,
            },
            indent=1,
            ensure_ascii=False,
        )
        + "\n"
    )
    for r in rows:
        print(r["label"], r["sigma"], "theory", r["theory"], "sim", r["simulated_n8"], "gap", round(r["simulated_n8"] - r["theory"], 3))
    print("exp sigma=.2 theory", limit, "sim by n", results["regression_group"])


if __name__ == "__main__":
    main()
