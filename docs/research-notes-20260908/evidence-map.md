# Evidence-to-claim map

Cutoff: 2026-09-08. Source titles/authors/first-submission years were fetched from arXiv citation metadata; T3 uses Nature metadata and T15 uses official model documentation. IDs and URLs are in `_data/reading_sources.json`. The skill helper scripts are not installed, so primary-source metadata and direct reading replace those helpers. “Read” means the scope actually used, not a claim to have exhaustively audited every experiment.

| ID | Read / usable evidence | Claim supported in prose | Citation slot | Risk / limit |
|---|---|---|---|---|
| T1 | Abstract; posterior approximation with sampled tasks | PFN amortizes a prior predictive learning procedure | TabPFN §1 objective | Bayesian interpretation depends on the synthetic prior and approximation |
| T2 | Abstract; 1k rows, 100 numerical features, 10 classes | Early TabPFN demonstrates small clean-data classification | §2 history | Limits describe the evaluated regime |
| T3 | Nature methods, architecture and inference | v2 supports heterogeneous data and regression, alternating feature/sample attention | §2–3 | 10k/500 is paper scope, not current API limit; ensemble is not one pass |
| T4 | Report v2 §3, §4 | v2.5 deepens networks, groups 3 features, adds 64 learned rows and distillation | §2–3 | Base synthetic vs Real variant; promotional win rates are not universal |
| T5 | Abstract | TabICL separates row embedding from ICL over rows | §2–3 | External lineage, not a TabPFN release |
| T6 | Abstract | TabICLv2 improves priors, scalable softmax and Muon training | §2–3 | Joint interventions; no single-factor attribution |
| T7 | Report v2 §2.1–2.6, §3.2 | v3 adopts row compression, many-class label retrieval and chunked inference | §3–4 | Row/feature trade-off; checkpoint 160-class limit; Thinking internals not disclosed |
| T8 | Abstract | Fine-tuned TabForestPFN can favor different priors from frozen ICL | §2 branch | Do not generalize its decision-boundary claim to all neural nets |
| T9 | Abstract | Real data continued pretraining is a separate adaptation axis | §2 branch | Cross-dataset adaptation vs target-task fine-tuning |
| T10 | Abstract | Label permutation equivariance matters | §3 decoder; direction 2 | Existing work, not a proposed new property |
| T11 | Abstract | Benchmark protocol, tuning and ensembling influence rankings | §4 evaluation | Freeze suite and software versions |
| T12 | Abstract | v2 robustness under open environments is not assured | §4; direction 1 | Does not establish that v3 has the same failure |
| T13 | Abstract | Learned-row-space kNN already studied | direction 1 | Retrieval alone is not new |
| T14 | Abstract | TabPFN-Rel and RelArena-alpha provide relational tools | §2; direction 3 | Alpha release, not a solved relational learning problem |
| T15 | Official model page | v2.6 is an intermediate version; v3 capabilities and availability | §2 version table; reproducibility | Version/date scoped; avoid licensing interpretation |
| T16 | Abstract | TACO compresses training context end-to-end | §3; direction 2 | Sample/context compression differs from column-to-row aggregation |
| T17 | Abstract | AWARE already studies task-aligned retrieval and imbalance | direction 1 | Study-specific result, no general clinical guidance |
| T18 | Abstract | TabSwift combines row-wise models and early exiting | §3; joint direction | Adaptive tabular computation is already an active area |
| L1 | Abstract | ACT learns inner computation steps | Loop §2 origin | Not a modern LLM result |
| L2 | Abstract | UT combines attention with depth recurrence and per-position halting | §2 origin | Theory under assumptions; empirical scale is historical |
| L3 | Abstract | ALBERT shares layers for parameter efficiency | §2 origin | Encoder parameter sharing does not establish test-time scaling |
| L4 | Abstract | DEQ models solve implicit fixed points | §2 branch; §4 | Fixed-point convergence is not answer correctness |
| L5 | Abstract | PonderNet learns stopping distributions with a compute trade-off | §2; direction 1 | Learned halting predates Ouro |
| L6 | Abstract v4 | Coconut feeds hidden states back as subsequent embeddings | §1 taxonomy | Sequence-position recurrence differs from depth recurrence |
| L7 | Abstract and paper overview | Looped depth helps several iterative reasoning tasks | §2 theory; §4 | No claim all tasks or all CoT are learned by any loop model |
| L8 | v1 §3.1–3.3, §6 | Huginn uses prelude/core/coda, input injection, random loops and truncated backprop | §3 mechanism | 3.5B/800B scales not compute-matched superiority; no literal R typo in coda formula |
| L9 | v1 §2 and throughput setup | MoR combines routers, recurrence and KV policies | §3 systems; direction 1 | Routing efficiency must include batching/cache overhead |
| L10 | v1 §3 and §5.4 | Ouro uses two-stage exit learning; cache sharing is stage-sensitive | §3 training/cache | Entropy is not an explicit cost penalty; decode results not prefill guarantees |
| L11 | v1 §3 and comparison to halting | LoopFormer trains budget-conditioned trajectories using time/step modulation | §2/3; direction 1 | Budget conditioning differs from token-level stopping |
| L12 | Abstract | Parcae constrains injection dynamics for stable recurrence | §4 stability; direction 3 | Linearized analysis is not a global nonlinear convergence proof |
| L13 | Abstract | Attractor Models use implicit differentiation and adaptive fixed-point refinement | §4 branch | Report-specific empirical results, not universal free infinite depth |
| L14 | Abstract v2 | LOTUS adds latent slots and explicit CoT-token supervision | §2; direction 2 | Supervision/latency phase must be matched |
| L15 | Abstract v2, 2026-09-02 | CHASE adds cache-hole adaptation for actual skipped SSM steps | §3 cache; direction 1 | Do not reuse old v1 conclusion that every step is still executed |
| L16 | Abstract | HRM uses multi-timescale recurrent modules on structured tasks | §2 adjacent | Not a general pretrained autoregressive LLM comparison |
| L17 | Abstract | TRM simplifies recursive reasoning with a tiny shared network | §2 adjacent | Task-specific benchmark evidence |
| L18 | Abstract | RLTT investigates rewarding latent trajectories | direction 2 | Existing work; its criticism of GRPO is not a general theorem |
| L19 | Abstract | Looped models can repeat recognizable stages of inference | §4; direction 2 | Readout/representation evidence is not causal mechanism proof |
| L20 | arXiv abstract and metadata | Explicitly programmed looped Transformers can execute iterative algorithms | §2 2023 history | Hand-constructed weights do not prove that pretraining learns the program |
| L21 | arXiv v3 abstract and metadata | Looped Transformers learn selected in-context data-fitting tasks with fewer parameters | §2 2023 history; joint direction | Data-fitting results do not establish general-language superiority |
| L22 | arXiv v5 abstract and metadata | Adaptive loop counts improve length generalization on studied iterative algorithmic tasks | §2 2024 history; direction 3 | Controlled tasks, not arbitrary natural language |
| L23 | arXiv v7 abstract and metadata | Timestep-conditioned scaling can address expressive limitations of looped models | §2 2024 history; direction 3 | Approximation analysis has assumptions; timestep conditioning already exists |

## Research hypotheses and nearest prior work

- T-R1: Retrieval should be evaluated for calibration under domain/class-prior shift at fixed context budget. T12 + T13 + T17 motivate the hypothesis; not a claim to invent retrieval or adaptation.
- T-R2: Test whether column-to-row compression loses rare predictive interactions and whether a controlled bypass repairs them. T5 + T7 + T16 motivate the compression trade-off; first identify failure before adding architecture.
- T-R3: Separate relational feature provenance/temporal leakage from the predictor under a fixed harness budget. T11 + T14 motivate the protocol; first reproduce existing baselines.
- L-R1: Calibrate expected benefit of another step and account for actual cache/batching costs under shift. L5 + L9 + L10 + L11 + L15 are prior art; novelty must be in generalizing measured utility/cost, not an exit gate.
- L-R2: Use paired latent-state/cache interventions to test whether helpful intermediate states are causally useful. L14 + L18 + L19 motivate this; do not confuse probes with reasoning proofs.
- L-R3: Measure stability vs long-horizon algorithmic progress under compute-matched training. L7 + L12 + L13 + L22 + L23 motivate the question; stability mechanisms and timestep conditioning already exist.

All suggested experiments are proposals. No model benchmarks or research-direction novelty proofs were performed.
