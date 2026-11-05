---
permalink: /notes/
title: "Notes"
excerpt: "Technical reading notes by Bo-Wen Zhang"
author_profile: true
---

<span class="anchor" id="notes"></span>

# <span class="lang-en">Notes</span><span class="lang-zh">笔记</span>

<p class="page-lead lang-en">Standalone notes that reorganize papers, technical reports, and implementations around the questions I want to remember.</p>
<p class="page-lead lang-zh">把论文、技术报告和实现细节按我想记住的问题重新整理。每个主题单独成页。</p>

<div class="note-index">
  <article class="note-index__item">
    <a class="note-index__icon" href="{{ '/notes/grpo-std-noisy-labels/' | relative_url }}" aria-label="Open GRPO standard deviation note"><i class="fas fa-bullseye" aria-hidden="true"></i></a>
    <div class="note-index__body">
      <div class="note-index__meta"><time datetime="2026-11-05">2026.11.05</time><span><span class="lang-en">Chinese note · Derivation &amp; simulation</span><span class="lang-zh">推导与模拟 · 概率校准</span></span></div>
      <h2><a href="{{ '/notes/grpo-std-noisy-labels/' | relative_url }}"><span class="lang-en">Why GRPO's group std pushes forecasts to 0 and 1</span><span class="lang-zh">GRPO 的组内标准差，为什么把概率预测推向 0 和 1</span></a></h2>
      <p class="lang-en">Dividing by group std cancels the size of the reward slope. Under noisy labels the target drifts from the mean toward the median, with a closed-form pseudo-Huber view and reproducible simulations.</p>
      <p class="lang-zh">除以组内 std 会消去奖励斜率的大小。标签有噪声时，优化目标从均值滑向中位数；附 pseudo-Huber 闭式解和可复现模拟。</p>
      <div class="note-index__topics" aria-label="Topics"><span>GRPO</span><span>Calibration</span><span>Median</span><span>Pseudo-Huber</span></div>
    </div>
    <a class="note-index__open" href="{{ '/notes/grpo-std-noisy-labels/' | relative_url }}" aria-label="Read GRPO standard deviation note"><i class="fas fa-arrow-right" aria-hidden="true"></i></a>
  </article>
  <article class="note-index__item">
    <a class="note-index__icon" href="{{ '/notes/tabpfn/' | relative_url }}" aria-label="Open TabPFN research notes"><i class="fas fa-table" aria-hidden="true"></i></a>
    <div class="note-index__body">
      <div class="note-index__meta"><time datetime="2026-09-08">2026.09.08</time><span><span class="lang-en">Chinese note · Evolution &amp; research</span><span class="lang-zh">演化调研 · 机制与研究方向</span></span></div>
      <h2><a href="{{ '/notes/tabpfn/' | relative_url }}">TabPFN</a></h2>
      <p class="lang-en">From prior-data fitting to TabICL and TabPFN-3: worked examples of context-based prediction, row representations, and label retrieval, followed by three testable research proposals.</p>
      <p class="lang-zh">从 PFN 到 TabICL 与 TabPFN-3：手算上下文预测，图解行列注意力与标签检索，再讨论校准、压缩和关系数据上的三个研究问题。</p>
      <div class="note-index__topics" aria-label="Topics"><span>PFN</span><span>TabICL</span><span>TabPFN-3</span><span>Research</span></div>
    </div>
    <a class="note-index__open" href="{{ '/notes/tabpfn/' | relative_url }}" aria-label="Read TabPFN note"><i class="fas fa-arrow-right" aria-hidden="true"></i></a>
  </article>
  <article class="note-index__item">
    <a class="note-index__icon" href="{{ '/notes/loop-llm/' | relative_url }}" aria-label="Open Loop LLM research notes"><i class="fas fa-sync-alt" aria-hidden="true"></i></a>
    <div class="note-index__body">
      <div class="note-index__meta"><time datetime="2026-09-08">2026.09.08</time><span><span class="lang-en">Chinese note · Evolution &amp; research</span><span class="lang-zh">演化调研 · 机制与研究方向</span></span></div>
      <h2><a href="{{ '/notes/loop-llm/' | relative_url }}">Loop LLM</a></h2>
      <p class="lang-en">From adaptive computation and Universal Transformers to Huginn, Ouro, and LoopFormer: shared depth, latent-state updates, training, halting, and the real cost of recurrent caches.</p>
      <p class="lang-zh">从 ACT、Universal Transformer 到 Huginn、Ouro 与 LoopFormer：解释共享深度、隐藏状态迭代、训练与退出，并拆解循环缓存的真实代价。</p>
      <div class="note-index__topics" aria-label="Topics"><span>Huginn</span><span>Ouro</span><span>Latent Reasoning</span><span>KV Cache</span></div>
    </div>
    <a class="note-index__open" href="{{ '/notes/loop-llm/' | relative_url }}" aria-label="Read Loop LLM note"><i class="fas fa-arrow-right" aria-hidden="true"></i></a>
  </article>
  <article class="note-index__item">
    <a class="note-index__icon" href="/notes/qwen3.8-flash-next/" aria-label="Open Qwen3.8-Flash-Next architecture notes"><i class="fas fa-microchip" aria-hidden="true"></i></a>
    <div class="note-index__body">
      <div class="note-index__meta"><time datetime="2026-09-07">2026.09.07</time><span><span class="lang-en">Illustrated guide · 7 modules</span><span class="lang-zh">图解入门 · 7 个模块</span></span></div>
      <h2><a href="/notes/qwen3.8-flash-next/">Qwen3.8-Flash-Next</a></h2>
      <p class="lang-en">For readers familiar with Transformer and LLaMA: compare architectural changes across seven modules, with worked examples, diagrams, and supporting implementation details.</p>
      <p class="lang-zh">面向熟悉 Transformer 与 LLaMA 的读者，对照七个模块的具体改动，用逐步算例与图解解释新增机制、发展脉络和实现代价。</p>
      <div class="note-index__topics" aria-label="Topics"><span>QSA</span><span>Gated Residual</span><span>N-gram Embedding</span><span>Muon</span></div>
    </div>
    <a class="note-index__open" href="/notes/qwen3.8-flash-next/" aria-label="Read note"><i class="fas fa-arrow-right" aria-hidden="true"></i></a>
  </article>
</div>
