---
permalink: /notes/qwen3.8-flash-next/
title: "Qwen3.8-Flash-Next 架构笔记"
excerpt: "以 Qwen3.8-Flash-Next 为切面，梳理当代大模型各个架构部件的演变过程"
author_profile: false
wide: true
note_page: true
note_chapter: overview
note_number: "00 / OVERVIEW"
note_heading: "从 Qwen3.8 回看 LLM 架构的演进"
note_description: "从每个模块最初解决的问题出发，串起关键转折、并行路线与设计代价，再读懂 Qwen3.8-Flash-Next 的具体选择。"
note_next_url: /notes/qwen3.8-flash-next/embedding/
note_next_label: "Embedding：从 Token Lookup 到条件记忆"
---

{% include qwen-note/header.html %}

<section class="qwen-chapter__lead" markdown="1">

近期 Qwen3.8-Flash-Next 发布，大致看了一眼模型架构，感觉和自己刚入门 AI 时学习的 LLM 架构有很大的差异，所以希望借着学习 Qwen3.8-Flash-Next 的机会，重新梳理一遍现代 LLM 的架构。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-1">[1]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a>

本笔记以笔者较为熟悉的 LLaMA-style decoder-only Transformer 作为参照，把 Qwen3.8 拆回 Embedding、Attention、Norm、FFN、Output、Residual 和 Optimizer 七个部分。每章沿着同一个问题推进：**最初怎样做，规模扩大后哪里不够用，后来有哪些解决路线，为什么 Qwen 选择了其中这一组？**

只看最终架构图，很容易把熟悉的 Transformer 当成过时的整体，再把陌生缩写当成一套全新系统。按模块回溯后会发现，有些接口一直保留，有些计算被替换，还有些效率改进其实发生在缓存、训练目标或优化器中。理解这些层次，比背下所有组件名称更有用。

</section>

<aside class="qwen-callout qwen-callout--scope" markdown="1">
<strong>写在开头</strong>

我会尽量区分三类内容：报告明确写出的结构与实验结果、组件原始论文提供的背景，以及我为了串起各部分所做的理解。把这些组件整合进同一个模型，不表示它们都由 Qwen 首次提出，也不表示每个选择已经在所有规模和负载下得到验证。
</aside>

<section class="qwen-chapter" markdown="1">

## 怎样读这组学习笔记

每章先读 **发展主线**：用年代、动机与小例子建立直觉；再读 **原理与 Qwen 实现**：对照公式、参数和数据流；最后用 **自测与答案** 检查能否用自己的话解释。公式中的 $n$ 通常表示序列长度，$d$ 表示隐藏维度，$t$ 表示 token 位置；各章出现新符号时会就地说明。

这是一份围绕七个模块主要路线的学习综述，时间延伸至 2026 年 9 月。必要时回溯 LLM 之前的基础工作，但不把所有模型、论文逐年列全。历史表中的年份原则上用首次公开年份，因此可能与参考文献中的会议年份不同。表格排列说明问题怎样演进，不自动代表后文方法直接继承前文，也不代表所有旁支都被 Qwen 采用。

| 模块 | 从什么问题开始 | 本章连接的历史路线 | 回到 Qwen 时看什么 |
| --- | --- | --- | --- |
| [Embedding](/notes/qwen3.8-flash-next/embedding/) | 文字如何变成可计算的表示 | 静态词向量、子词、上下文化、N-gram 条件记忆 | 地址、表项、融合与主存预取 |
| [Attention](/notes/qwen3.8-flash-next/attention/) | 怎样访问此前的信息 | MHA / MQA / GQA、FlashAttention、线性状态、SSM、稀疏选择、位置编码 | GDN 与 QSA 怎样互补 |
| [Norm](/notes/qwen3.8-flash-next/norm/) | 表示与梯度的尺度怎样控制 | LayerNorm / RMSNorm、Pre / Post、DeepNorm、gain 参数化 | 归一化作用在哪个张量 |
| [FFN / MoE](/notes/qwen3.8-flash-next/ffn/) | 怎样增加非线性计算与容量 | ReLU / GELU、SwiGLU、稀疏路由、细粒度与共享专家 | 激活比例、负载与通信 |
| [Output / MTP](/notes/qwen3.8-flash-next/output/) | 为什么生成必须等待上一步 | 自回归、独立 draft、Medusa / EAGLE、多未来训练目标 | 提案、验证与索引复用 |
| [Residual](/notes/qwen3.8-flash-next/residual/) | 层与层之间保存、更新什么 | 恒等路径、缩放、AltUp、HC / mHC、多流门控 | 存储宽度与计算宽度的分离 |
| [Optimizer](/notes/qwen3.8-flash-next/optimizer/) | 梯度怎样变成有效参数更新 | 动量、AdamW、Adafactor、Shampoo、Muon | 按参数语义分工与分布式执行 |

上表是各章的索引，具体历史论点与出处放在对应段落。初读不必一次学完七章，可以沿下面的模型数据流选一个模块开始。

## 先分清模型里三种不同的“状态”

- **模型参数**：训练得到的 embedding、投影、专家和 LM Head 权重。普通推理时固定，多个请求共享。
- **请求状态**：本次输入产生的 KV cache、GDN 递推状态和中间隐藏表示，随请求而变化。
- **优化器状态**：训练时保存的动量、梯度统计等，用来更新模型参数；普通推理不需要携带。

N-gram 表变大是增加第一类容量，GDN 固定状态是在压缩第二类历史，Muon 处理的是第三类更新过程。这三件事不能只用一个“更省内存”概括。类似地，总参数、激活参数、FLOPs、显存占用和端到端延迟也是不同指标，后文会分别讨论。

</section>

<section class="qwen-chapter" markdown="1">

## 先介绍一下参照：LLaMA-style Decoder

“现代 decoder-only Transformer”并不是一张唯一的结构图。为了让后面的比较有一个具体坐标，我先采用早期 LLaMA 的 block 作为本组笔记的参照：decoder-only Transformer，顺序执行 Attention 与 FFN，在每个子层输入前做 RMSNorm，Attention 使用 RoPE，FFN 使用 SwiGLU。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-36">[36]</a>

<div class="qwen-baseline-reference">
  <span>本组笔记的参照架构</span>
  <strong>LLaMA (2023) style decoder-only Transformer</strong>
  <small>Sequential block · Pre-RMSNorm · RoPE MHA · SwiGLU FFN</small>
</div>

<div class="qwen-baseline-flow" aria-label="LLaMA-style decoder-only Transformer 整体数据流">
  <span>Token IDs</span><i class="fas fa-arrow-right" aria-hidden="true"></i>
  <span>Embedding</span><i class="fas fa-arrow-right" aria-hidden="true"></i>
  <span>Decoder Block × L</span><i class="fas fa-arrow-right" aria-hidden="true"></i>
  <span>Final RMSNorm</span><i class="fas fa-arrow-right" aria-hidden="true"></i>
  <span>LM Head</span>
</div>

<div class="qwen-decoder-block" aria-label="LLaMA-style decoder block 内部结构">
  <div class="qwen-decoder-block__title"><strong>一个 LLaMA-style Decoder Block</strong><span>重复 L 层</span></div>
  <div class="qwen-decoder-block__flow">
    <span>RMSNorm<small>Pre-Norm</small></span><i class="fas fa-arrow-right" aria-hidden="true"></i>
    <span>RoPE MHA<small>Token mixing</small></span><i class="fas fa-arrow-right" aria-hidden="true"></i>
    <span>Residual Add<small>h + Attention</small></span><i class="fas fa-arrow-right" aria-hidden="true"></i>
    <span>RMSNorm<small>Pre-Norm</small></span><i class="fas fa-arrow-right" aria-hidden="true"></i>
    <span>SwiGLU FFN<small>Channel mixing</small></span><i class="fas fa-arrow-right" aria-hidden="true"></i>
    <span>Residual Add<small>h + FFN</small></span>
  </div>
</div>

选择 LLaMA 主要是因为笔者最初学习 LLM 时，就是从 LLaMA 开始的。这并不意味着所有同期或后续模型都照搬 LLaMA 的架构。在 Norm 的位置、Attention 的 KV 组织、位置编码，以及 Attention 与 FFN 是顺序还是并行执行等方面已经有不同选择。

| 架构 | Norm 的位置与类型 | Attention / 位置表示 | FFN 与 Block 组织 |
| --- | --- | --- | --- |
| Original Transformer (2017) | Post-LayerNorm | MHA + 绝对位置编码 | ReLU FFN；顺序执行 |
| PaLM (2022) | Pre-LayerNorm | MQA + RoPE | SwiGLU；Attention 与 FFN 并行读取同一输入 |
| **LLaMA (2023，本笔记参照)** | **Pre-RMSNorm** | **MHA + RoPE** | **SwiGLU；Attention 与 FFN 顺序执行** |
| Gemma 2 (2024) | Pre- 与 Post-RMSNorm 同时使用 | GQA；局部与全局 Attention 交替 | GeGLU |

因此，上图中的 `RMSNorm → Sublayer → Residual Add` 只表示 LLaMA-style Pre-Norm。原始 Transformer 把 LayerNorm 放在残差相加之后，而 Gemma 2 会同时归一化每个子层的输入和输出。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-5">[5]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-7">[7]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-37">[37]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-38">[38]</a>

接下来仍然沿用 Embedding、Token Mixer、FFN、Residual 与 LM Head 这些接口来读 Qwen3.8。例如 MoE 仍然占据 FFN 的位置，GDN 与 QSA 仍然负责 token mixing，MTP 也没有取代正常的 LM Head。

</section>

<section class="qwen-chapter" markdown="1">

## Qwen3.8 的整体数据流

官方配置给出的语言模型主干为 48 层、隐藏维度 2,560。层类型以 `3 × Gated DeltaNet + 1 × Qwen Sparse Attention` 为周期重复 12 次，每一个 token mixer 后都接一层 MoE。模型使用 4 条 Gated Residual 分支；第 2 层额外注入一次 N-gram embedding；主模型之外还有一层 MTP 模块。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-4">[4]</a>

<div class="qwen-architecture-map">
  <div class="qwen-architecture-map__rail"><span>输入</span><span>48 层主干</span><span>输出与解码</span></div>
  <div class="qwen-architecture-map__body">
    <a class="is-embedding" href="/notes/qwen3.8-flash-next/embedding/"><small>01 · Embedding</small><strong>Token lookup + N-gram memory</strong><span>第 2 层注入；大表可放在 Host Memory</span></a>
    <div class="qwen-architecture-map__cycle">
      <a class="is-attention" href="/notes/qwen3.8-flash-next/attention/"><small>02 · Token Mixer</small><strong>3 × GDN + 1 × QSA</strong><span>固定状态压缩与周期性稀疏召回</span></a>
      <a class="is-ffn" href="/notes/qwen3.8-flash-next/ffn/"><small>04 · FFN</small><strong>512 experts, top-10 + shared</strong><span>每个 token mixer 后执行</span></a>
      <a class="is-residual" href="/notes/qwen3.8-flash-next/residual/"><small>03 + 06 · Stream</small><strong>Zero-centered RMSNorm + GR</strong><span>4 条分支；门控读取、标量写入</span></a>
    </div>
    <a class="is-output" href="/notes/qwen3.8-flash-next/output/"><small>05 · Output</small><strong>LM Head + auxiliary MTP</strong><span>正常 logits 与多步候选预测分开</span></a>
  </div>
</div>

<aside class="qwen-training-plane">
  <i class="fas fa-sync-alt" aria-hidden="true"></i>
  <div><small>07 · TRAINING RECIPE · 不属于前向数据流</small><strong>Loss → Backward → Muon / AdamW / Adam → 参数更新</strong><span>优化器作用于反向传播得到的梯度，并按参数的矩阵语义与形状分工。</span></div>
  <a href="/notes/qwen3.8-flash-next/optimizer/">阅读 Optimizer <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
</aside>

<dl class="qwen-facts">
  <div><dt>Backbone</dt><dd>125B</dd><span>每 token 激活约 6B</span></div>
  <div><dt>N-gram tables</dt><dd>+51B</dd><span>主干之外的查表容量</span></div>
  <div><dt>Layers</dt><dd>48</dd><span>12 个混合注意力周期</span></div>
  <div><dt>Native context</dt><dd>262,144</dd><span>配置中的原生长度</span></div>
  <div><dt>Residual branches</dt><dd>4</dd><span>低秩门控读写</span></div>
  <div><dt>MTP</dt><dd>~4B</dd><span>一层辅助预测模块</span></div>
</dl>

</section>

<section class="qwen-chapter" markdown="1">

## 变化的共同形式：成本转移

这些部件很少真正“消灭”成本。它们通常把一个瓶颈换成另一个更容易扩展或更符合硬件条件的瓶颈。

| 部件 | 主要想缓解什么 | 采用的办法 | 成本转移到哪里 |
| --- | --- | --- | --- |
| Embedding | 仅靠主干计算扩大容量很贵 | N-gram 稀疏查表 | Host Memory、带宽与预取调度 |
| Attention | 长上下文的二次计算与 KV Cache | GDN 固定状态 + QSA 稀疏召回 | 状态压缩误差、索引器与稀疏 kernel |
| Norm | 深层训练的尺度与数值稳定性 | Zero-centered RMSNorm | 参数化、初始化与优化规则的耦合 |
| FFN | Dense FFN 的逐 token 计算 | Ultra-sparse MoE | 路由、负载均衡、通信与容量管理 |
| Output | 自回归解码一次只产生一个 token | MTP 提案 + 主模型验证 | 额外参数、接受率与 runtime 实现 |
| Residual | 单残差流的表示带宽 | 4 分支 GR | 残差内存流量与门控计算 |
| Optimizer | AdamW 对矩阵更新结构利用有限 | Muon 正交化矩阵动量 | Newton-Schulz 计算与分布式重排 |

这张表是阅读框架，不是报告中的原表。具体收益仍要回到每章的实验设置和证据边界。

</section>

<section class="qwen-chapter" markdown="1">

## 推荐阅读顺序

<div class="qwen-reading-path">
{% for chapter in site.data.qwen38.chapters %}{% unless chapter.id == 'overview' or chapter.id == 'references' %}
  <a class="qwen-reading-path__item qwen-reading-path__item--{{ chapter.id }}" href="{{ chapter.url | relative_url }}">
    <span>{{ chapter.number }}</span>
    <i class="fas {{ chapter.icon }}" aria-hidden="true"></i>
    <strong>{{ chapter.label }}</strong>
  </a>
{% endunless %}{% endfor %}
</div>

如果只想理解推理路径，先读 **Embedding → Attention → FFN → Output**。如果更关心训练稳定性和系统实现，再读 **Norm → Residual → Optimizer**。

</section>

{% include qwen-note/references.html refs='<a href="/notes/qwen3.8-flash-next/references/#ref-1">[1]</a> Qwen 官方博客；<a href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a> 技术报告；<a href="/notes/qwen3.8-flash-next/references/#ref-4">[4]</a> 官方配置；<a href="/notes/qwen3.8-flash-next/references/#ref-5">[5]</a> Transformer；<a href="/notes/qwen3.8-flash-next/references/#ref-7">[7]</a> Pre-LN 分析；<a href="/notes/qwen3.8-flash-next/references/#ref-36">[36]</a> LLaMA；<a href="/notes/qwen3.8-flash-next/references/#ref-37">[37]</a> PaLM；<a href="/notes/qwen3.8-flash-next/references/#ref-38">[38]</a> Gemma 2。' %}

{% include qwen-note/footer.html %}
