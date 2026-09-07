---
permalink: /notes/qwen3.8-flash-next/ffn/
title: "FFN：从 Dense SwiGLU 到 Ultra-Sparse MoE"
excerpt: "从“所有输入走同一套计算”到“按输入选择一部分计算”，理解专家模型。"
author_profile: false
wide: true
note_page: true
note_chapter: ffn
note_number: "04 / FFN & MOE"
note_heading: "FFN / MoE：不必每次都动用全部专家"
note_description: "从“所有输入走同一套计算”到“按输入选择一部分计算”，理解专家模型。"
note_prev_url: /notes/qwen3.8-flash-next/norm/
note_prev_label: "Norm：稳定残差流的尺度"
note_next_url: /notes/qwen3.8-flash-next/output/
note_next_label: "Output：从 Next-Token Head 到 MTP"
---

{% include qwen-note/header.html %}

<p class="qwen-intro">模型想学得更多，通常需要更多参数；但参数越多，每次全部计算就越贵。MoE 的办法是准备很多组计算模块，每个 token 只选择其中一部分。</p>

<nav class="qwen-learning-nav" aria-label="本章阅读路径"><a href="#changes">相对 LLaMA 的变化</a><a href="#evolution">再看演进</a><a href="#advanced">论文与公式</a></nav>


<section class="qwen-chapter qwen-primer" id="changes" markdown="1">

## SwiGLU 内核保留，变化在参数如何被选择

以 dense LLaMA 的 SwiGLU FFN 为基线。这里不用重新学习激活函数，而要跟踪一次 token 的 router logits、top-k 专家选择、专家输出加权，以及共享专家路径。

| 对照项 | 熟悉的基线 | 本章关注的变化 |
| --- | --- | --- |
| 专家内部 | 一套 SwiGLU 参数 | 多个独立参数的专家 |
| 执行参数 | 每个 token 使用同一套 FFN | 512 个路由专家中选 10 个，另有 1 个共享专家 |
| 输出合成 | 一个 FFN 输出 | 组合选中专家输出与共享路径 |
| 系统代价 | 规则的 dense 矩阵乘 | 额外路由、负载均衡、分发与聚合通信 |

这里的比较基线是典型 dense LLaMA decoder（优化器章以 AdamW 为基线），不代表所有 LLaMA 版本；“变化”也不等于 Qwen 首创。报告、配置与实现分别见 <a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-4">[4]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-39">[39]</a>，历史来源见下文。

</section>

{% include qwen-note/visual.html kind="ffn" title="参数都在那里，这次只执行一部分" caption='为便于看清，图中只画 6 个路由专家并选 2 个；这不是 Qwen 的真实数量。勾选代表参与本次计算，未勾选代表本次未执行。实际配置见 <a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-4">[4]</a>。' %}

<section class="qwen-chapter qwen-primer" id="learn" markdown="1">

## 如果每次都用同一套加工设备

普通的 dense FFN 就是这样：无论输入是什么，每个 token 都使用同一组参数。实现整齐、容易并行；想通过加宽它增加容量时，逐 token 的计算也往往随之增加。

**MoE（混合专家）** 把这一组计算变成许多组，并加一个路由器。路由器看当前向量，算出专家得分，再选择少数专家执行。专家输出随后组合起来。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-18">[18]</a>

## “专家”不是一群已经分好工的人

这些专家本质上是参数不同的小型前馈网络，并没有预先贴好“数学老师”“代码老师”的标签。训练可能让它们形成某些分工，但不能看到编号 7 就断言它专门负责数学。

选择也按当前 token 的隐藏表示进行，不是整篇文章只挑一个专家从头用到尾。即便是同一个词，在不同上下文或不同层里也可能走不同的专家。

## Qwen 选择了什么方案？

Qwen3.8 每层有 512 个可路由专家，每个 token 选 10 个；另有一个共享专家始终参与。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-4">[4]</a> 共享专家可以理解成每次都走的公共加工步骤，路由专家提供可选择的额外加工。

这样总参数可以很多，而单个 token 不必执行全部专家。但 **只选少数专家，不等于速度按专家数量成倍增加**：还要算路由、移动数据、等待忙碌设备，以及其他非专家模块的成本。

## 那 SwiGLU 又是什么？

它描述的是一个专家内部怎样加工向量：一路产生特征，另一路调节这些特征，再把两路相乘。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-9">[9]</a> MoE 则决定使用哪些专家。一个问“机器里面怎么做”，另一个问“这次开哪些机器”，所以二者可以同时存在。

</section>


<details class="qwen-self-check" markdown="1">
<summary>需要时回顾：已有 Transformer / LLaMA 基础</summary>

## FFN 是什么？先不急着记缩写

在一个常见 Transformer 层里，Attention 先把不同位置的信息联系起来；然后 **FFN（前馈网络）** 对每个位置的向量再做一轮非线性加工。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-5">[5]</a>

可以想成：先收集与当前问题有关的材料，再把材料加工成更有用的特征。FFN 这一步不直接去读别的位置，但它收到的向量已经可以包含前文信息。


</details>

<section class="qwen-chapter qwen-primer" id="evolution" markdown="1">

## 怎么一步步走到这里？

<div class="qwen-plain-history" markdown="1">

1. **先改进一套 FFN 的内部计算。** 从 ReLU、GELU 到门控形式，研究者寻找更合适的非线性变换。SwiGLU 属于这条路线。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-5">[5]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-42">[42]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-9">[9]</a>
2. **想增加容量，但不全部计算。** 稀疏 MoE 通过路由选择部分专家，GShard 推动多设备执行，Switch 用 top-1 简化路由。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-18">[18]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-53">[53]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-19">[19]</a>
3. **专家多了，还要让容量用得起来。** 细分专家、设置共享专家、改进负载均衡，分别处理组合灵活性、重复计算与拥塞。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-20">[20]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-28">[28]</a>
4. **Qwen 使用大专家池、小激活子集。** 关键不仅是 512 和 10 这两个数，还在于真实执行时能否让专家分布合理、减少等待。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-35">[35]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-4">[4]</a>

</div>

<p class="qwen-everyday"><strong>读到这里，先记住：</strong>MoE 把“模型一共准备了多少参数”和“一个 token 实际调用多少参数”分开。多出来的容量需要路由和系统配合，才能变成真实收益。</p>

</section>

<details class="qwen-advanced" id="advanced" markdown="1">
<summary>继续深入：论文脉络、公式与实现细节<small>点此展开原有详细笔记；用于核对精确公式、配置和论文证据。</small></summary>
<div class="qwen-advanced__body" markdown="1">


<section class="qwen-chapter__lead" markdown="1">

Transformer block 中，attention 负责跨位置交换信息，FFN 则在每个位置独立地扩张、变换再压回 hidden size。随着模型扩大，FFN 往往占据很大一部分参数与计算。Qwen3.8 没有取消这一子层，而是让每层 FFN 变成 512 个 routed experts 的 SwiGLU MoE；每个 token 只激活 10 个 routed expert，再加 1 个 shared expert。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-4">[4]</a>

</section>



<section class="qwen-chapter qwen-history" id="history" markdown="1">

## 发展主线：先改专家内部，再决定执行哪些专家

### 2017—2023：ReLU / GELU 到门控 FFN

Attention 在 token 之间交换信息，标准 FFN 则对每个位置单独做相同的非线性变换。原始 Transformer 使用两层线性映射夹 ReLU；BERT 使用 GELU，保留更平滑的激活变化。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-5">[5]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-42">[42]</a> FFN 虽然不在当前子层直接读取其他位置，它的输入已经可以带有之前 attention 写入的上下文，因而不能说 FFN “不懂上下文”。

GLU 系列把单条变换拆成内容与门两路。SwiGLU（2020）可写为 $W_d[\operatorname{SiLU}(W_gx)\odot W_ux]$，LLaMA（2023）采用这一形式。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-9">[9]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-36">[36]</a> 用一个标量比喻：一路提出特征值 5，另一路给出因子 0.2，乘积是 1。这只解释相乘操作；SiLU 不是概率，实际 gate 不被限制在 0 到 1。

门控多出了一张投影矩阵，所以公平比较时要调整中间宽度，不能在相同宽度下把额外参数带来的收益全算成激活函数的贡献。**SwiGLU 解决专家内部怎样计算，MoE 解决这次执行哪些专家**，它们是两条可组合的轴。

### 2017—2021：参数可以很多，每个 token 不必全部执行

Sparsely-Gated MoE（2017）展示了稀疏选择大型专家池的条件计算方式，早期语言实验使用的是循环网络体系；不能把它直接画成今天的 decoder block。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-18">[18]</a> GShard（2020）将条件计算与自动分片结合，推动 Transformer MoE 在多设备上的扩展。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-53">[53]</a> 到 Switch（2021），top-1 routing 用每个 token 一个专家来简化分发。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-19">[19]</a>

但 top-1 不是永远优于 top-2 或 top-k：选得少能省算力，也可能限制组合能力；更多专家还意味着更多通信和负载波动。若所有 token 选同一个专家，其余参数再多也不能发挥作用。因此演进的下一问是：如何让专家容量真的被使用？

### 2024 以后：细粒度专家、共享专家与负载控制

DeepSeekMoE（2024）细分专家，并分离始终参与的 shared experts，让 routed experts 有机会更专门化。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-20">[20]</a> 教学上，8 个宽度 $m$ 的专家选 2 个，与 32 个宽度 $m/4$ 的专家选 8 个，专家总宽度和激活宽度相同，但可选组合不同；这是忽略路由和通信的理想化比较，不是两个实际模型的等价证明。

DeepSeek-V3（2024）又用路由偏置调节负载，降低主要负载均衡机制对辅助梯度的依赖，同时保留序列级辅助约束。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-28">[28]</a> 它提供一种均衡方案；不能因为 Qwen 也用 MoE，就断言沿用了同一套 router。均衡应看 batch、序列、设备上的实际分布，强行让每句话平均访问全部专家，也可能损害专门化。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-21">[21]</a>

| 阶段 | 主要问题 | 设计变化 | 没有自动解决的问题 |
| --- | --- | --- | --- |
| Dense FFN | 每个 token 都支付全部计算 | 更合适的非线性与门控 | 容量仍随逐 token 计算增长 |
| 稀疏 MoE | 想扩大容量而少增加计算 | 只执行 top-k | 热门专家拥塞 |
| GShard / Switch | 多设备执行太复杂 | 分片与简化路由 | 跨设备带宽与均衡 |
| 细粒度 + shared | 知识冗余、组合不够灵活 | 小专家与公共计算并存 | 是否形成可解释分工 |
| Qwen3-Next / 3.8 | 提高专家池的稀疏程度 | 512 中选 10，另有 shared <a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-35">[35]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-4">[4]</a> | 小矩阵效率、通信与实际吞吐 |

所以 10/512 只描述 routed expert 的选择比例，不能直接读成整模型 FLOPs 降到 1.95%，更不能读成 51 倍加速。下面回到单层公式和配置，把专家、router 与公共主干分别计账。

</section>

<section class="qwen-chapter" id="mechanism" markdown="1">

## 1. Dense FFN 到底在做什么

原始 Transformer 使用两层位置独立 MLP。现代 LLM 常用 SwiGLU：一条线性分支经过 SiLU 形成 gate，与另一条线性分支逐元素相乘，再投影回 hidden size。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-9">[9]</a>

<div class="qwen-equation">
  <code>SwiGLU(x) = W<sub>down</sub>( SiLU(W<sub>gate</sub>x) ⊙ W<sub>up</sub>x )</code>
  <span>Dense FFN 对所有 token 使用同一组 gate / up / down 矩阵。</span>
</div>

它的优点是规则、易并行；代价是参数容量与逐 token 计算基本一起增长。把 intermediate size 扩大一倍，通常意味着每个 token 都要承担相应矩阵乘法。

</section>

<section class="qwen-chapter" markdown="1">

## 2. MoE 如何把容量与计算拆开

MoE 把一个 FFN 替换为多个同构 expert，并增加 router。router 根据当前 token 的隐藏状态产生 expert score，只执行 top-k expert：

<div class="qwen-equation qwen-equation--stacked">
  <code>p(x) = Router(x)</code>
  <code>MoE(x) = Σ<sub>i ∈ TopK(p)</sub> p<sub>i</sub>(x) · Expert<sub>i</sub>(x)</code>
  <span>总参数随 expert 数增加；逐 token 计算主要随激活的 expert 数增加。</span>
</div>

<div class="qwen-evolution">
  <div><time>2017</time><strong>Sparsely-Gated MoE</strong><p>用可学习 router 稀疏激活专家，展示了条件计算扩容的基本形式。</p></div>
  <div><time>2021</time><strong>Switch Transformer</strong><p>用 top-1 routing 简化通信和负载管理，把 MoE 推向更大规模。</p></div>
  <div><time>2024</time><strong>DeepSeekMoE</strong><p>细分专家并引入 shared expert，使共同知识与路由 specialization 分工更明确。</p></div>
  <div><time>Qwen3-Next / 3.8</time><strong>Ultra-sparse MoE</strong><p>扩大到 512 routed experts，同时固定每 token 激活 10 个和 1 个 shared expert。</p></div>
</div>

“Ultra-sparse”描述的是总 expert pool 与激活子集之间的比例，而不是每个 expert 内部做稀疏矩阵乘法。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-18">[18]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-19">[19]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-20">[20]</a>

</section>

<section class="qwen-chapter" markdown="1">

## 3. Qwen3.8 的配置

<dl class="qwen-facts qwen-facts--four">
  <div><dt>Routed experts</dt><dd>512</dd><span>每层的动态专家池</span></div>
  <div><dt>Top-k</dt><dd>10</dd><span>每 token 选择的 routed experts</span></div>
  <div><dt>Shared expert</dt><dd>1</dd><span>所有 token 都会经过</span></div>
  <div><dt>Intermediate</dt><dd>640</dd><span>routed 与 shared expert 相同</span></div>
</dl>

每个 token mixer 后都接这一 MoE 子层，因此 48 层共有 48 组 expert pool。报告称主干总参数 125B，而每 token 激活约 6B；这里的 active parameter 还包含 attention、residual 等非 expert 参数，不应简单用 `10 / 512` 直接换算整模型激活比例。

Shared expert 始终参与，适合承接广泛复用的变换；routed experts 则有机会形成更专门的表示。这个解释符合 shared-expert 设计动机，但不能据此断言某个训练后 expert 一定对应可读的人类领域。

</section>

<section class="qwen-chapter" markdown="1">

## 4. Router 与负载均衡才是 MoE 的控制面

如果 router 总把 token 发给少数 experts，其余容量就会闲置，热门 expert 还可能超过设备 capacity。负载均衡因此不是附属 loss，而是决定“512 个 experts 是否真的可用”的关键训练机制。

Qwen3.8 延续 global-batch load balancing：统计范围跨越更大的 token batch，减少局部 batch 偏差；router 参数也采用归一化初始化，让训练早期的 expert 选择尽量不被随机范数主导。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-21">[21]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-35">[35]</a>

另一个值得注意的细节是优化器分工：expert 的 `fc1/fc2` 矩阵使用 Muon，router 保留 AdamW。报告观察到 Muon 会放大训练早期 router 波动，后期切换也没有显著收益。这个选择说明“同在一个 MoE 层”不代表参数应该接受同一种更新几何。

</section>

<section class="qwen-chapter" markdown="1">

## 5. 系统代价：稀疏计算不等于简单计算

<div class="qwen-cost-shift">
  <div><small>减少</small><strong>每个 token 执行的 FFN 参数</strong><p>总容量可以继续增加，而 active experts 保持为 10 + 1。</p></div>
  <i class="fas fa-long-arrow-alt-right" aria-hidden="true"></i>
  <div><small>增加</small><strong>路由、通信和负载管理</strong><p>token 需要按 expert 重排、跨设备发送、执行后再还原顺序。</p></div>
</div>

主要工程问题包括：

- **Dispatch / combine**：token 按 expert 聚合后才能形成足够大的 GEMM；小 batch 下容易碎片化。
- **Expert parallelism**：512 个 expert 不会都放在一张卡上，路由选择会触发 All-to-All 通信。
- **Capacity 与丢 token**：实现必须决定热门 expert 超载时如何排队、截断或重新路由。
- **推理并发**：请求分布变化会改变 expert 热度，静态部署不一定持续均衡。

MoE 把“所有 token 做一个大 FFN”变成“token 动态选择少量 FFN”。理论 FLOPs 降低只是第一步，能否形成大而规则的矩阵乘法才决定硬件利用率。

</section>

<section class="qwen-chapter" id="self-check" markdown="1">

## 读完后，试着解释

top-10 改成 top-1 一定更快、更好吗？专家编号是否对应固定人类领域？

<details class="qwen-self-check" markdown="1">
<summary>展开参考答案</summary>

减少激活专家可能减少计算，但质量、通信、batch 和矩阵效率共同决定收益。专家分工由训练形成，编号不自带数学、代码等固定标签。

</details>

</section>

<aside class="qwen-callout qwen-callout--question" markdown="1">
<strong>我还想继续确认的问题</strong>

1. 512 experts 的有效 specialization 是否随训练阶段稳定，还是 router 会持续重排其功能？
2. global balancing 改善总体利用率时，会不会压制某些天然长尾但有价值的路由？
3. N-gram memory 与 MoE 都在扩展条件容量；它们分别更适合记住什么，是否存在可测量的替代关系？
</aside>


</div>
</details>

{% include qwen-note/references.html refs='<a href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a> Qwen 技术报告；<a href="/notes/qwen3.8-flash-next/references/#ref-4">[4]</a> 官方配置；<a href="/notes/qwen3.8-flash-next/references/#ref-9">[9]</a> SwiGLU；<a href="/notes/qwen3.8-flash-next/references/#ref-18">[18]</a> Sparsely-Gated MoE；<a href="/notes/qwen3.8-flash-next/references/#ref-19">[19]</a> Switch Transformer；<a href="/notes/qwen3.8-flash-next/references/#ref-20">[20]</a> DeepSeekMoE；<a href="/notes/qwen3.8-flash-next/references/#ref-21">[21]</a> Global-batch load balancing；<a href="/notes/qwen3.8-flash-next/references/#ref-35">[35]</a> Qwen3-Next。' %}

{% include qwen-note/footer.html %}
