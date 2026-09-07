---
permalink: /notes/qwen3.8-flash-next/output/
title: "Output：从 Next-Token Head 到 MTP"
excerpt: "用 A、B、C 的小例子，理解多 token 预测为何能加速，以及为什么猜错后必须回退。"
author_profile: false
wide: true
note_page: true
note_chapter: output
note_number: "05 / OUTPUT & MTP"
note_heading: "Output / MTP：先猜几步，再一起检查"
note_description: "用 A、B、C 的小例子，理解多 token 预测为何能加速，以及为什么猜错后必须回退。"
note_prev_url: /notes/qwen3.8-flash-next/ffn/
note_prev_label: "FFN：从 Dense SwiGLU 到 Ultra-Sparse MoE"
note_next_url: /notes/qwen3.8-flash-next/residual/
note_next_label: "Residual：从单流到 Gated Residual"
---

{% include qwen-note/header.html %}

<p class="qwen-intro">普通生成要等上一个 token 确定，才能继续下一个。投机解码让较便宜的模块先提出几步候选，再交给主模型检查；MTP 可以为它提供候选。</p>

<nav class="qwen-learning-nav" aria-label="本章阅读路径"><a href="#changes">相对 LLaMA 的变化</a><a href="#evolution">再看演进</a><a href="#advanced">论文与公式</a></nav>


<section class="qwen-chapter qwen-primer" id="changes" markdown="1">

## LM Head 保留，新增候选生成和批量验证

以标准 next-token loss 和自回归解码为起点。MTP 增加未来位置的辅助预测；投机解码利用候选已知这一条件，让主模型一次验证多个位置。训练目标和解码协议需要分开分析。

| 对照项 | 熟悉的基线 | 本章关注的变化 |
| --- | --- | --- |
| 主输出 | 隐藏状态映射到词表 logits | 主模型仍按条件前缀预测 |
| 训练辅助 | next-token 监督 | 增加 MTP 预测目标 |
| 推理过程 | 主模型逐轮推进 | 提案、并行验证、接受前缀、拒绝后修正 |
| Qwen 进一步改动 | 一般 MTP 提案机制 | MTP 使用 QSA，多个投机步复用选择位置 |

这里的比较基线是典型 dense LLaMA decoder（优化器章以 AdamW 为基线），不代表所有 LLaMA 版本；“变化”也不等于 Qwen 首创。报告、配置与实现分别见 <a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-4">[4]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-39">[39]</a>，历史来源见下文。

</section>

{% include qwen-note/visual.html kind="output" title="猜三步，不代表能直接输出三步" caption='贪心解码的教学例子，不是随机采样的完整接受协议，也不是 Qwen 的真实模型输出。A、B、C、D 代表 token。标准投机解码依据 <a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-27">[27]</a>。' %}

<section class="qwen-chapter qwen-primer" id="learn" markdown="1">

## 换一个做事方式：先打草稿，再审稿

假设主模型很强、运行也贵。让一个便宜的提案器先猜 A、B、C，主模型再一次处理这段已知候选，检查每个位置的预测。这叫 **投机解码**。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-27">[27]</a>

为什么检查可以一起做，生成却不能？因为检查时候选已经给出来了。主模型可以并行计算“在这些候选前缀成立时，各位置应该预测什么”，然后再判断哪些前缀真的成立。

图里第一步 A 正确，第二步主模型认为应该是 D，所以提交 A、D，丢弃后面的 C。C 原来是基于 A、B 猜的，前提已经错了，不能跳过 B 直接保留 C。

## MTP 在这里做什么？

**MTP（多 token 预测）** 让模型学习多个未来位置的预测，而不只监督紧邻的下一个位置。它可以帮助训练出用于打草稿的辅助模块。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-26">[26]</a>

要分开看两个问题：多未来目标能否帮助学习；它提出的候选能否让推理更快。前者是训练问题，后者还取决于验证方式和接受了多少 token。MTP 与投机解码有关，但不是同一个概念。

## Qwen 在这条路上进一步做了什么？

Qwen 有原生 MTP 辅助模块。到了 Qwen3.8，这个模块也使用 QSA，并在多个投机步之间复用挑选出来的历史位置，减少重复选择的开销。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-35">[35]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a>

可以把它理解为：审一段紧挨着的草稿时，可能反复用到相近的参考材料，于是尝试复用一次检索的结果。但候选仍然要经过验证。

## 多猜几步一定更快吗？

不一定。假设普通生成一个 token 花 10 毫秒；打草稿加验证一共花 25 毫秒。若这轮能提交 4 个，比原来 40 毫秒划算；若只提交 2 个，反而比原来 20 毫秒更慢。这只是教学算账，不是模型实测。

图中使用“主模型也选这个 token”解释贪心情况。随机采样还要使用正确的接受概率和拒绝后的补偿采样，才能保持目标分布；进阶部分再看具体公式。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-27">[27]</a>

</section>


<details class="qwen-self-check" markdown="1">
<summary>需要时回顾：已有 Transformer / LLaMA 基础</summary>

## 为什么模型不能直接把后面十个词一起写出来？

普通自回归生成中，下一个 token 的预测要基于已经确定的前缀。先写“我喜欢”，下一步可能是“南京”；确定了“南京”，后面才继续判断。后一步依赖前一步的结果。

**LM Head** 是把最终隐藏向量变成词表分数的模块。它能给许多候选打分，但普通解码这一轮只确定下一个 token。瓶颈来自条件依赖，而不是输出矩阵只能处理一个位置。


</details>

<section class="qwen-chapter qwen-primer" id="evolution" markdown="1">

## 怎么一步步走到这里？

<div class="qwen-plain-history" markdown="1">

1. **普通生成逐步推进。** 训练文本的答案已知，可以并行监督很多位置；生成时答案未知，存在串行依赖。
2. **先让便宜模型打草稿。** 投机解码把候选生成与主模型验证分开，已有主模型也可以配独立提案器。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-27">[27]</a>
3. **提案器开始借用主模型的内部信息。** Medusa 增加解码头，EAGLE 在特征层提出候选；它们的具体训练和验证方式不同。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-54">[54]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-55">[55]</a>
4. **多未来预测进入训练设计。** MTP 提供额外目标，DeepSeek-V3、Qwen 等各自整合辅助模块，再继续优化推理开销。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-26">[26]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-28">[28]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-35">[35]</a>

</div>

<p class="qwen-everyday"><strong>读到这里，先记住：</strong>先猜不等于先确认。能否加速，要看一轮额外工作最终换来了多少个已确认 token。</p>

</section>

<details class="qwen-advanced" id="advanced" markdown="1">
<summary>继续深入：论文脉络、公式与实现细节<small>点此展开原有详细笔记；用于核对精确公式、配置和论文证据。</small></summary>
<div class="qwen-advanced__body" markdown="1">


<section class="qwen-chapter__lead" markdown="1">

把 MTP 直接叫作“新 output head”容易混淆两个接口。Qwen3.8 的正常生成路径仍由 LM Head 把最后隐藏状态映射到 248,320 维 logits；这组输出权重不与输入 embedding 共享。MTP 是主模型之外的一层辅助模块，约 4B 参数，用于学习多个未来位置的预测。它可以参与训练，也可以在推理时作为 speculative proposal model。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-4">[4]</a>

</section>



<section class="qwen-chapter qwen-history" id="history" markdown="1">

## 发展主线：训练多个未来，与一次确认多个 token

### 从自回归目标说起：训练并行不等于生成并行

一句训练文本的所有正确 token 都已知，causal mask 可以让各位置并行预测下一个 token，同时不读未来标签。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-5">[5]</a> 推理时未来 token 尚未确定，位置 $t+2$ 的条件依赖 $t+1$。因此模型可以在训练时一次计算很多位置的 loss，生成时仍需逐步推进。这个区别先于所有 MTP 技巧。

### 2022—2023：把“便宜提案”和“昂贵确认”分开

Speculative decoding 用小 draft 模型提出一段候选，再让 target 模型并行算出这段候选各位置的条件概率。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-27">[27]</a> 目标是摊薄 target 的串行调用次数。它不要求从一开始就用 MTP 训练 target；已有模型也可以搭配独立 draft。

以贪心解码为例，draft 提出 `[A, B, C]`，target 在首位置也选 A，但在前缀 A 后选 D，那么这一轮提交 `[A, D]`，B 和 C 被丢弃。这不是“只要 C 对就能保留 C”，因为它的条件前缀已经不成立。

随机采样时则不能只检查 argmax。设 target 概率为 $p$、draft 为 $q$，对从 $q$ 采到的候选 $x$，标准接受概率为 $\min(1,p(x)/q(x))$；拒绝时从归一化的 $\max(p-q,0)$ 中重采样。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-27">[27]</a> 正是这套校正规则支持分布保持，而不是“用了多 token 验证”这件事本身。

### 2024：提案器开始利用主模型内部表示

Medusa（2024）在主模型上增加多个解码头，并用树形候选一起验证，减少维护独立 draft 模型的需要。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-54">[54]</a> EAGLE（2024）则预测特征并结合 token 信息来处理特征预测的不确定性。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-55">[55]</a> 它们与原生 MTP 都能用于更便宜地提案，但模型结构、训练方式与接受协议不必相同。

同年，Gloeckle 等研究多 token 训练目标：共享主干，同时监督若干未来位置的独立预测头。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-26">[26]</a> DeepSeek-V3 则使用顺序 MTP 模块，把前一预测深度的表示与相应 token embedding 结合，维持预测之间的依赖。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-28">[28]</a> **“同时监督多个未来”不代表“所有候选完全独立并行产生”**；不同论文里的 MTP 必须看计算图。

| 路线 | 改了哪里 | 主模型必须重训吗 | 主要关注 |
| --- | --- | --- | --- |
| 独立 draft + 验证 | 推理流程 | 不必 | 便宜提案与分布校正 |
| Medusa / EAGLE | 辅助头或特征提案器 | 依训练方案而定 | 利用主模型已有表示 |
| 多未来目标 MTP | 训练目标和辅助模块 | 要训练对应目标 / 模块 | 表示学习与候选质量 |
| Qwen 原生 MTP | 把辅助预测纳入模型设计 <a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-35">[35]</a> | 由预训练 recipe 决定 | 训练与 serving 的配合 |

Qwen3.8 在已有 MTP 路线上继续处理长上下文的选择器开销，使用 QSA 并跨投机步复用索引。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a> 这属于“候选怎样更便宜地产生”的改进，不改变最终还要经过验证的逻辑。

### 为什么接受率高，也可能没有加速

设常规生成一枚 token 用时 $T$，一轮 draft、验证和调度合计 $D+V+O$，平均实际提交 $A$ 枚 token，则粗略加速比为 $AT/(D+V+O)$。假设 $T=10$ ms，一轮共 25 ms，提交 4 枚时约为 1.6 倍；只提交 2 枚时约为 0.8 倍。这是算账示例，不是 Qwen 测速。真实系统还受 batch、缓存回滚和硬件利用率影响。

</section>

<section class="qwen-chapter" id="mechanism" markdown="1">

## 1. 标准 next-token 输出

自回归语言模型学习 `p(x_{t+1} | x_{<=t})`。完成一次 backbone forward 后，LM Head 只需要对当前位置隐藏状态做线性投影：

<div class="qwen-equation">
  <code>logits<sub>t+1</sub> = W<sub>lm</sub> · h<sub>t</sub></code>
  <span>采样或 argmax 得到下一个 token，再把它追加到输入中执行下一轮。</span>
</div>

瓶颈并不是 LM Head 只能输出一个位置的矩阵形状，而是**生成过程存在串行依赖**：第 `t+2` 个 token 的条件包含刚刚生成的 `t+1`，因此普通解码每轮只能确认一个新 token。即使 GPU 还有空闲，一次 forward 的 latency 也很难被多个未来位置自然摊薄。

</section>

<section class="qwen-chapter" markdown="1">

## 2. MTP：让一个状态承担多个未来预测目标

Multi-Token Prediction 在 next-token loss 之外增加未来若干位置的预测目标，使模型或辅助模块从当前上下文提出一串候选。相关工作显示，这既可能提供更丰富的训练信号，也可以训练出用于推理加速的 future-token predictor。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-26">[26]</a>

<div class="qwen-mtp-lanes">
  <div><span>主任务</span><strong>t + 1</strong><small>标准 next-token logits</small></div>
  <div><span>MTP step 1</span><strong>t + 2</strong><small>辅助未来预测</small></div>
  <div><span>MTP step 2</span><strong>t + 3</strong><small>辅助未来预测</small></div>
  <div><span>MTP step 3</span><strong>t + 4</strong><small>辅助未来预测</small></div>
</div>

这里要区分两种收益：

- **训练收益**：多个未来目标可能迫使表示保留更有预测力的信息。这个效果属于训练目标，不依赖 serving runtime。
- **解码收益**：辅助模块更便宜地提出多个 token，再由主模型一次验证。这个效果依赖接受率和 runtime 实现。

两者相关，但不相同。一个 MTP loss 有帮助，不保证投机接受率一定高；接受率高，也不代表所有 batch 设置都能获得相同吞吐增益。

</section>

<section class="qwen-chapter" markdown="1">

## 3. 投机解码如何使用这些候选

Speculative decoding 的基本思路是用便宜的 draft 过程连续提出多个 token，再让 target model 用一次并行 forward 验证这段候选。若前几个 token 与 target distribution 一致，就一次接受更长前缀；在首次拒绝处回退并修正。正确的接受与重采样协议可以保持 target model 的输出分布，而不只是近似贪心结果。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-27">[27]</a>

<ol class="qwen-process qwen-process--decode">
  <li><strong>Draft</strong><span>MTP 模块连续提出若干未来 token。</span></li>
  <li><strong>Verify</strong><span>主模型并行计算候选位置的 logits。</span></li>
  <li><strong>Accept</strong><span>接受通过验证的最长前缀。</span></li>
  <li><strong>Repair</strong><span>遇到拒绝时按 target distribution 修正，再开始下一轮。</span></li>
</ol>

因此实际加速取决于一个简单关系：**一次验证的额外成本，能否被平均接受的 token 数摊薄。**若平均只接受一个 token，额外 draft 与验证管理反而可能变成负担。

</section>

<section class="qwen-chapter" markdown="1">

## 4. Qwen3.8 的 MTP 改了什么

Qwen3-Next 已经引入原生 MTP 和 multi-step training。Qwen3.8 延续这一方向，并把 MTP 内部的 attention 同样替换为 QSA。官方配置显示 MTP 只有 1 层，复用主模型 embedding，而不是使用独立 embedding。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-35">[35]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-4">[4]</a>

最有系统意味的改动是 **跨 speculative steps 复用 QSA 的 top-k indices**。多个未来预测 step 所处上下文高度相近，如果每一步都重新运行完整 indexer，selector 开销会重复发生。复用候选位置相当于假设相邻 step 的重要上下文集合变化有限。

报告在四步 speculative decoding 下比较 full attention MTP 与 QSA MTP，并报告 mean accepted length；同时给出长上下文下的吞吐实验。它证明 QSA 可以放进 MTP 并维持可用接受长度，但速度数字仍绑定于特定硬件、上下文与 serving 配置。

</section>

<section class="qwen-chapter" markdown="1">

## 5. LM Head、MTP 与 N-gram memory 不要混为一类

<div class="qwen-interface-table">
  <div><strong>LM Head</strong><span>输入</span><p>主干最终隐藏状态</p><span>输出</span><p>下一个 token 的正式 logits</p></div>
  <div><strong>MTP</strong><span>输入</span><p>主干状态与 speculative step 上下文</p><span>输出</span><p>多个未来 token 的辅助提案</p></div>
  <div><strong>N-gram Embedding</strong><span>输入</span><p>已经存在的局部 token 序列</p><span>输出</span><p>注入主干的条件记忆向量</p></div>
</div>

三者都与 token vocabulary 有关，但位于完全不同的数据流阶段：N-gram 表在前向中间增加输入特征，LM Head 定义正常 next-token distribution，MTP 则服务于额外训练目标和候选生成。

</section>

<section class="qwen-chapter" markdown="1">

## 6. 成本转移

<div class="qwen-cost-shift">
  <div><small>减少</small><strong>每个已确认 token 的主模型 forward 次数</strong><p>接受前缀足够长时，一次验证可以提交多个 token。</p></div>
  <i class="fas fa-long-arrow-alt-right" aria-hidden="true"></i>
  <div><small>增加</small><strong>辅助参数、draft 计算与 runtime 状态管理</strong><p>还要处理接受协议、KV 状态回滚、动态 batch 和 index reuse。</p></div>
</div>

MTP 是典型的“用额外训练和少量推理计算，换取更少串行主模型步骤”。它优化的是 generation latency/throughput 路径，不会让单次主干 forward 本身自动更便宜。

</section>

<section class="qwen-chapter" id="self-check" markdown="1">

## 读完后，试着解释

为什么投机候选第二枚被拒绝后，第三枚也不能直接保留？MTP 是否必然加速？

<details class="qwen-self-check" markdown="1">
<summary>展开参考答案</summary>

第三枚的条件前缀已失效，必须丢弃相应候选及状态。MTP 还需支付 draft、验证与调度成本，只有平均提交长度足够大才可能加速；随机采样还需正确的接受与校正协议。

</details>

</section>

<aside class="qwen-callout qwen-callout--question" markdown="1">
<strong>我还想继续确认的问题</strong>

1. top-k index 复用在主题突然切换、代码跳转或长程引用时，是否会降低 MTP 接受率？
2. 当 batch 增大时，MTP 的低延迟优势与 continuous batching 的吞吐优势怎样权衡？
3. MTP 的训练收益和 speculative decoding 收益能否通过独立消融彻底拆开？
</aside>


</div>
</details>

{% include qwen-note/references.html refs='<a href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a> Qwen 技术报告 §2.1.2；<a href="/notes/qwen3.8-flash-next/references/#ref-4">[4]</a> 官方配置；<a href="/notes/qwen3.8-flash-next/references/#ref-26">[26]</a> Multi-Token Prediction；<a href="/notes/qwen3.8-flash-next/references/#ref-27">[27]</a> Speculative Decoding；<a href="/notes/qwen3.8-flash-next/references/#ref-28">[28]</a> DeepSeek-V3 MTP；<a href="/notes/qwen3.8-flash-next/references/#ref-35">[35]</a> Qwen3-Next。' %}

{% include qwen-note/footer.html %}
