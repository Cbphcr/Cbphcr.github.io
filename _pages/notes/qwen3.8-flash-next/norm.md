---
permalink: /notes/qwen3.8-flash-next/norm/
title: "Norm：稳定残差流的尺度"
excerpt: "从 LayerNorm、Pre-Norm 到 Qwen3.8 的 Zero-Centered RMSNorm"
author_profile: false
wide: true
note_page: true
note_chapter: norm
note_number: "03 / NORMALIZATION"
note_heading: "稳定残差流的尺度"
note_description: "这里的重点不是一种全新的 normalization，而是 RMSNorm、zero-centered gain、门控与多分支残差如何共同组成稳定性方案。"
note_prev_url: /notes/qwen3.8-flash-next/attention/
note_prev_label: "Attention：压缩记忆与稀疏召回"
note_next_url: /notes/qwen3.8-flash-next/ffn/
note_next_label: "FFN：从 Dense SwiGLU 到 Ultra-Sparse MoE"
---

{% include qwen-note/header.html %}

<section class="qwen-chapter__lead" markdown="1">

Qwen3.8 延续 Qwen3-Next 的 zero-centered RMSNorm，并对 norm weight 使用 weight decay。官方博客把它列为“retained”的训练稳定性设计，而不是本次发布的新结构。理解这一章的关键，是把三个容易混在一起的概念分开：**归一化放在哪里、统计哪些量、缩放参数怎样参数化与优化。**<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-1">[1]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-35">[35]</a>

</section>

<nav class="qwen-learning-nav" aria-label="本章阅读层次"><a href="#history">发展主线</a><a href="#mechanism">原理与 Qwen 实现</a><a href="#self-check">自测与答案</a></nav>

<section class="qwen-chapter qwen-history" id="history" markdown="1">

## 发展主线：统计量、放置位置、参数化分别演进

### 2016—2019：先定义“按什么范围归一化”

LayerNorm（2016）对单个样本的一组隐藏特征计算均值和方差；在 Transformer 中，通常是每个 token 的 hidden 维。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-51">[51]</a> 这使其统计量不依赖同一 batch 的其他句子。它没有把整段文本所有 token 混在一起求一个均值，也不是把概率做 softmax。

RMSNorm（2019）提出保留缩放而省略减均值。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-8">[8]</a> 用 $x=(3,4)$ 做教学计算，忽略 epsilon、令 gain 为 1：LayerNorm 得到 $(-1,1)$，RMSNorm 得到约 $(0.85,1.13)$。后者均值显然不为零，但均方根为 1。于是“RMS”与“zero-centered”不能望文生义地混用。

### 2017—2024：网络变深，Norm 的位置也成为设计变量

原始 Transformer 的 Post-LN 把残差相加后的结果规范化。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-5">[5]</a> Pre-LN 将规范化放到子层入口，给主干留下直接相加路径。Xiong 等（2020）从初始化处的梯度行为解释两种布局及 warmup 需求的差异；这是一项分析工作，不应写成“2020 年才发明 Pre-LN”。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-7">[7]</a>

用链式法则看，Pre-Norm 子层 $y=x+F(N(x))$ 的 Jacobian 包含显式的 $I$ 项；Post-Norm 的恒等分支也经过 Norm 的导数。这解释了为何位置会影响优化，但不能证明 Pre-Norm 在任意深度下都不会不稳定。

DeepNorm（2022）把残差缩放与初始化共同设计，展示了另一种训练极深 Transformer 的办法；LLaMA（2023）采用 Pre-RMSNorm；Gemma 2（2024）则在子层输入和输出都使用 RMSNorm。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-52">[52]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-36">[36]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-38">[38]</a> 后两者的差异说明，归一化的历史并没有停在“Post 全面换成 Pre”。DeepNorm 的主要证据来自其论文的模型和任务，也不能直接当成 decoder LLM 的通用结论。

| 设计轴 | 可选方案 | 阅读实现时应检查 |
| --- | --- | --- |
| 统计范围 | hidden 向量、Q/K head、独立残差分支 | 实际归一化的张量维度 |
| 统计方式 | LayerNorm、RMSNorm、L2 norm | 是否减均值，分母是什么 |
| 放置位置 | Pre、Post、子层前后都有 | 恒等路径是否经过 Norm |
| gain 参数化 | 直接学 gain、学相对 1 的偏移 | 初始化与 weight decay 拉向哪里 |

### 2025—2026：从“能训深”转向局部异常尺度

Qwen3-Next 的 zero-centered RMSNorm 被 Qwen3.8 沿用，用来约束 norm gain 增长。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-35">[35]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a> 理解这种参数化可以用一个通用例子：若有效 gain 写为 $1+\delta$，对 $\delta$ 做衰减会拉向单位缩放；若直接衰减 gain，则拉向零缩放。两种形式可表示相同的函数族，但优化轨迹和正则化中心不同。这里是参数化原理，具体实现仍应核对源码。

接下来读三个机制时，可以分别回答：Pre-Norm 改的是**路径**，RMSNorm 改的是**统计量**，zero-centered 改的是**参数基点**。它们可以同时存在。

</section>

<section class="qwen-chapter" id="mechanism" markdown="1">

## 1. 三个不同的问题

<div class="qwen-concept-grid">
  <div><span>位置</span><h3>Post-Norm 还是 Pre-Norm</h3><p>Norm 放在子层之后还是之前，改变的是深层网络中残差主干与梯度传播路径。</p></div>
  <div><span>统计量</span><h3>LayerNorm 还是 RMSNorm</h3><p>LayerNorm 做中心化与缩放；RMSNorm 只按均方根缩放，不减去激活均值。</p></div>
  <div><span>参数</span><h3>普通 gain 还是 zero-centered gain</h3><p>改变可学习缩放参数围绕什么基点训练，并配合 weight decay 控制其增长。</p></div>
</div>

把“zero-centered RMSNorm”理解成“RMSNorm 会把 activation 变成零均值”是错误的。**RMSNorm 本身没有减均值。**这里的 zero-centered 指向 gain 的参数化和优化中心，而不是 activation statistics。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-8">[8]</a>

</section>

<section class="qwen-chapter" markdown="1">

## 2. 从 Post-Norm 到 Pre-Norm

原始 Transformer 的典型结构是 `LayerNorm(x + F(x))`，也就是先做子层与残差相加，再归一化。后来 decoder-only LLM 更常见 `x + F(Norm(x))`：残差主干保留一条更直接的恒等路径，通常更容易训练很深的网络。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-5">[5]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-7">[7]</a>

<div class="qwen-compare qwen-compare--formula">
  <div><h3>Post-Norm</h3><code>y = Norm(x + F(x))</code><p>每层输出都被重新归一化，但恒等路径也经过 Norm。</p></div>
  <div><h3>Pre-Norm</h3><code>y = x + F(Norm(x))</code><p>残差主干更直接；子层读取归一化后的输入。</p></div>
</div>

Qwen3.8 的 GR 仍保留“子层读取规范化表示，输出写回残差流”的总体逻辑，但读写操作不再是单向量上的简单 Pre-Norm。它会先分别规范化 4 条 branch，再通过 gate 合并为 block input；因此 GR 的 read 已经包含了 norm，不需要额外叠一层 Pre-Norm。

</section>

<section class="qwen-chapter" markdown="1">

## 3. 从 LayerNorm 到 RMSNorm

对一个 `d` 维向量，LayerNorm 与 RMSNorm 的核心差别可以简化为：

<div class="qwen-equation qwen-equation--stacked">
  <code>LayerNorm(x) = γ ⊙ (x - mean(x)) / √(var(x) + ε) + β</code>
  <code>RMSNorm(x) = γ ⊙ x / √(mean(x²) + ε)</code>
  <span>写法省略了实现差异；RMSNorm 保留 rescaling，不显式执行 re-centering。</span>
</div>

RMSNorm 的计算更简单，也已成为 LLM 中常见选择。它不意味着均值永远无关，而是把“必须在每次 norm 中显式消除均值”这一约束拿掉，让周围线性层与残差路径共同适应。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-8">[8]</a>

</section>

<section class="qwen-chapter" markdown="1">

## 4. Zero-centered 改了什么

普通 RMSNorm 通常把可学习 gain 初始化在恒等缩放附近。Zero-centered 参数化把**可学习的偏移量**放在零附近，再由实现恢复恒等尺度；这样 weight decay 拉回的是“无额外缩放”的基点，而不是把有效尺度直接拉向零。

<aside class="qwen-callout qwen-callout--precision" markdown="1">
<strong>表述上的克制</strong>

Qwen3.8 技术报告说明其目的在于限制 RMSNorm weight 的增长，并说明 norm weight 使用 weight decay；公开配置只给出 `rms_norm_eps = 1e-6`，没有完整暴露 gain 的底层实现字段。因此这里解释设计意图，不把某个第三方实现的具体公式当作官方接口。
</aside>

Qwen3-Next 的官方说明给出的背景是：QK-Norm 等位置的部分 norm weight 曾异常增大，因此采用 zero-centered RMSNorm 并对 norm weight 衰减。Qwen3.8 继续沿用这一 recipe。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-35">[35]</a>

</section>

<section class="qwen-chapter" markdown="1">

## 5. Qwen3.8 中 Norm 出现在哪里

<div class="qwen-location-list">
  <div><span>Residual read</span><strong>4 条 branch 分别 RMSNorm</strong><p>每条分支有自己的 gain；规范化后再共同预测 elementwise read gate。</p></div>
  <div><span>GDN output</span><strong>recurrent output RMSNorm</strong><p>状态读出先规范化，再乘输入相关的 sigmoid output gate。</p></div>
  <div><span>GDN Q/K</span><strong>L2 normalization</strong><p>约束 rank-one delta update 中 Q/K 的向量长度；这不是 hidden-state RMSNorm。</p></div>
  <div><span>QSA indexer / core</span><strong>Q/K RMSNorm</strong><p>配合 partial RoPE 与 attention score 计算，控制 query/key 数值尺度。</p></div>
</div>

这些 norm 作用在不同张量、处理不同数值问题。只说“模型用了 RMSNorm”会漏掉它与 gate、recurrent state 以及 widened residual stream 的耦合。

</section>

<section class="qwen-chapter" markdown="1">

## 6. 它解决的是局部稳定性，不是单独的性能模块

Norm 的直接目标是控制尺度与优化条件，不是增加模型可表示的知识容量。Qwen3.8 报告中的稳定性来自组合方案：zero-centered RMSNorm、bounded sigmoid gates、GR 的 branch-wise normalization、Muon 参数分工、梯度裁剪策略等一起作用。

因此不应从整套架构的 loss 或 benchmark 改善反推“zero-centered RMSNorm 单独贡献了多少”。官方材料证明它被沿用，并解释了动机；但这份报告没有提供一张完整的 `普通 RMSNorm vs zero-centered RMSNorm` 独立消融表。

</section>

<section class="qwen-chapter" id="self-check" markdown="1">

## 读完后，试着解释

为什么 RMSNorm 后的均值可以不为零？Pre-Norm 和 zero-centered 是一回事吗？

<details class="qwen-self-check" markdown="1">
<summary>展开参考答案</summary>

RMSNorm 没有减均值，只按均方根缩放。Pre-Norm 描述归一化的位置；zero-centered 描述 gain 的参数化基点。两者解决不同问题，可以同时使用。

</details>

</section>

<aside class="qwen-callout qwen-callout--question" markdown="1">
<strong>我还想继续确认的问题</strong>

1. norm gain 的增长究竟是训练不稳定的原因、先兆，还是对其他 outlier 的补偿？
2. branch-wise RMSNorm 在 GR 中的收益来自独立尺度，还是主要来自后续 gate 更容易优化？
3. 当 residual state 使用 FP8 时，norm 与 gate 对动态范围的控制各贡献多少？
</aside>

{% include qwen-note/references.html refs='<a href="/notes/qwen3.8-flash-next/references/#ref-1">[1]</a> Qwen3.8 官方博客；<a href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a> 技术报告 §2.1 与 §2.2；<a href="/notes/qwen3.8-flash-next/references/#ref-5">[5]</a> Transformer；<a href="/notes/qwen3.8-flash-next/references/#ref-7">[7]</a> Pre-LN 分析；<a href="/notes/qwen3.8-flash-next/references/#ref-8">[8]</a> RMSNorm；<a href="/notes/qwen3.8-flash-next/references/#ref-35">[35]</a> Qwen3-Next 官方博客。' %}

{% include qwen-note/footer.html %}
