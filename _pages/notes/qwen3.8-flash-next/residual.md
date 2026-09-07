---
permalink: /notes/qwen3.8-flash-next/residual/
title: "Residual：从单流到 Gated Residual"
excerpt: "从“旧表示 + 新结果”开始，理解为什么要保留多条状态，以及为什么不需要计算四次。"
author_profile: false
wide: true
note_page: true
note_chapter: residual
note_number: "06 / RESIDUAL"
note_heading: "Residual：保留旧笔记，再写入新发现"
note_description: "从“旧表示 + 新结果”开始，理解为什么要保留多条状态，以及为什么不需要计算四次。"
note_prev_url: /notes/qwen3.8-flash-next/output/
note_prev_label: "Output：从 Next-Token Head 到 MTP"
note_next_url: /notes/qwen3.8-flash-next/optimizer/
note_next_label: "Optimizer：Muon、AdamW 与参数分工"
---

{% include qwen-note/header.html %}

<p class="qwen-intro">模型每层都产生新结果，但不必把上一层的表示全部抹掉。残差连接保留旧表示，再加上本层的更新。Qwen 将保存中间信息的空间扩为四条分支，并学习怎样读取和写入。</p>

<nav class="qwen-learning-nav" aria-label="本章阅读路径"><a href="#changes">相对 LLaMA 的变化</a><a href="#evolution">再看演进</a><a href="#advanced">论文与公式</a></nav>


<section class="qwen-chapter qwen-primer" id="changes" markdown="1">

## 子层宽度不变，把单条残差流扩成四条

以 x + F(norm(x)) 为基线。GR 改的是 F 周围的读写结构：保存四份状态，门控读成一个普通宽度输入，计算一次 F，再分别写回。它不是把 Attention 或 FFN 复制执行四次。

| 对照项 | 熟悉的基线 | 本章关注的变化 |
| --- | --- | --- |
| 保存状态 | 一条 d 维残差流 | 四条 d 维状态 |
| 子层输入 | 归一化后的单条状态 | 各分支归一化后，逐通道门控组合 |
| 子层输出 | 直接加回原状态 | 同一输出按分支写入强度加回 |
| 成本变化 | 单流读写 | 增加状态显存、门控计算和内存流量 |

这里的比较基线是典型 dense LLaMA decoder（优化器章以 AdamW 为基线），不代表所有 LLaMA 版本；“变化”也不等于 Qwen 首创。报告、配置与实现分别见 <a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-4">[4]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-39">[39]</a>，历史来源见下文。

</section>

{% include qwen-note/visual.html kind="residual" title="四条状态，一次子层计算" caption='展示 GR 的读—算—写顺序，四条分支来自 Qwen 报告 <a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a>。分支只是不同的向量空间，图中未给它们指定固定语义。' %}

<section class="qwen-chapter qwen-primer" id="learn" markdown="1">

## 为什么只保留一条状态还不够？

当模型一层层加工信息，所有结果都要写进同一个向量空间。一个自然想法是扩大这个空间；但如果连每个子层的输入和输出都一起加宽，矩阵计算通常也会更贵。

另一种办法是多保存几条状态，真正计算时再组合成一个普通宽度的输入。这样可以把“存多少信息”与“每层按多宽来计算”部分分开。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-22">[22]</a>

## Qwen 的四条分支怎样配合？

先看图里的三个动作。**读**：先调整各分支的尺度，再用门控组合信息；**算**：组合成一个输入，执行一次子层；**写**：把同一个新结果，以不同强度加回各分支。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a>

读取还可以细到向量的不同维度。例如某些维度更多取自分支 1，另一些更多取自分支 2。不需要给整个分支统一一个“全用或不用”的决定。

这就是 Gated Residual，简称 **GR**。“门控”表示读取和写入的强度由网络计算出来，而不是始终固定。

## 别把四条分支理解成四个模型

四条状态会共同参与形成一个子层输入，图中的子层仍计算一次。它们也没有被硬编码为“事实、逻辑、语言、代码”四类笔记。能不能形成可解释的分工，需要观察训练后的模型。

这和 MoE 也不同：GR 调整**信息从哪里读、写到哪里**；MoE 调整**哪些专家参数参与计算**。同一个模型可以同时使用它们。

## 多留几页纸，仍然有代价

多条状态要占内存，还要被读取和写回。即使昂贵子层没有多算四遍，数据搬运也可能变慢。所以 Qwen 的选择同时包括简化分支操作和优化存储、执行方式。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a>

</section>


<details class="qwen-self-check" markdown="1">
<summary>需要时回顾：已有 Transformer / LLaMA 基础</summary>

## 先理解最普通的残差连接

你读文章做笔记，每读完一段，通常是在旧笔记上补充或修改，而不是把纸扔掉重新写。模型里的残差连接也保留一条旧信息路径：

<p class="qwen-everyday">下一层收到的表示 = 原来的表示 + 这一层算出的更新</p>

这里的“加”就是向量相加，不是把两个文件拼在一起。原来的信息仍可能被新结果抵消或改变，因此残差也不保证旧内容永远不会丢。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-6">[6]</a>


</details>

<section class="qwen-chapter qwen-primer" id="evolution" markdown="1">

## 怎么一步步走到这里？

<div class="qwen-plain-history" markdown="1">

1. **保留旧路径，让网络学增量。** ResNet 的残差思想进入 Transformer，成为深层模型的重要组成。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-6">[6]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-5">[5]</a>
2. **进一步研究怎样加得稳定。** 归一化位置、残差缩放与初始化共同影响深层训练。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-7">[7]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-52">[52]</a>
3. **把保存空间与计算宽度分开。** AltUp 用预测与校正维护更宽表示，HC 学习多流连接，mHC 给连接加约束。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-22">[22]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-23">[23]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-24">[24]</a>
4. **Qwen 选择细读、简写。** GR 保留细粒度读取，简化写入与分支混合；这是特定模型上的设计取舍，不代表更复杂的连接始终无用。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a>

</div>

<p class="qwen-everyday"><strong>读到这里，先记住：</strong>残差决定层间信息如何留下来。四条分支增加的是保存和选择信息的空间，不是四套互不相关的推理过程。</p>

</section>

<details class="qwen-advanced" id="advanced" markdown="1">
<summary>继续深入：论文脉络、公式与实现细节<small>点此展开原有详细笔记；用于核对精确公式、配置和论文证据。</small></summary>
<div class="qwen-advanced__body" markdown="1">


<section class="qwen-chapter__lead" markdown="1">

Residual connection 最常见的写法是 `x_{l+1} = x_l + F_l(x_l)`：每一层从同一条 `d` 维状态读取，再把输出加回去。它让深层网络保留近似恒等路径，但也规定了层间通信的带宽只有一条 hidden vector。Gated Residual（GR）把这条流扩成 4 个 branch，并让 block 根据当前状态决定怎样读、向每个 branch 写多少。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a>

</section>



<section class="qwen-chapter qwen-history" id="history" markdown="1">

## 发展主线：从保留恒等路径，到学习层间通信

### 2015—2022：为什么不让每层从头改写表示

ResNet（2015 预印本 / 2016 CVPR）把学习完整映射改为学习增量：$y=x+F(x)$。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-6">[6]</a> 若这一层暂时没有有用的新变换，$F(x)$ 接近零时还能保留输入。Transformer（2017）将残差路径用于 attention 和 FFN 子层，后来 Pre-Norm 把更直接的恒等路径保留下来。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-5">[5]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-7">[7]</a>

但“有恒等路径”不等于“所有新信息都能有效进入主干”。若残差向量不断变大，固定量级的更新相对影响会变小；若更新过大，训练又可能不稳定。因此 DeepNorm（2022）把残差缩放和初始化放在一起设计。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-52">[52]</a> 这一阶段的主问题是**怎样加得稳定**。

### 2023：存储宽度能否与计算宽度分开

把 hidden size 直接扩大，往往也会放大 attention 与 FFN 的矩阵乘法。AltUp（2023）探索更宽表示与较窄层计算之间的分离，通过预测、对部分表示执行昂贵更新、再校正来维持扩展状态。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-22">[22]</a> 它不是“只更新一条，其他分支完全不动”。主问题变成：**能否存更多层间信息，而不让每个子层都按同样比例变宽？**

### 2024—2026：把读、写、分支混合拆成三个算子

Hyper-Connections（2024）为多条残差流学习连接强度。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-23">[23]</a> 可以把一次子层调用分成三个接口：从多条流聚合成输入（read）；在旧流之间搬运信息（mix）；把新结果分配回各流（write）。其中 mix 不经过昂贵的子层，所以它在深层网络里反复相乘时，自己的稳定性就很重要。

mHC（2025 年底）为这类连接施加约束，缓解 HC 的稳定性与扩展问题。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-24">[24]</a> Qwen 的 GR 则对连接空间做消融，保留细粒度门控读取，并简化写入与分支混合。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a> **约束一个混合算子，与直接去掉这个算子，是不同的设计选择**；GR 也不应被说成所有任务上都优于 mHC。

| 方法 | 保留什么状态 | 子层怎样读写 | 关注的瓶颈 |
| --- | --- | --- | --- |
| 普通 residual | 一条 $d$ 维流 | 读当前状态，输出相加 | 深度优化 |
| 残差缩放 / DeepNorm | 通常仍是单流 | 调整尺度与初始化 | 累积更新的稳定性 |
| AltUp | 更宽表示 | 预测与校正，减少昂贵更新宽度 | 存储宽度与计算宽度绑定 |
| HC / mHC | 多流 | 学习 read / mix / write | 连接表达力与组合稳定性 |
| GR | 四流 | 通道级 read、分支级 write | 读取表达力与内存流量 |

### 一个两分支例子：读得细不等于算四次

设两条已规范化的分支是 $(1,0)$ 和 $(0,1)$。第一条读门偏向第一维，第二条读门偏向第二维时，子层可以接收到两条流的组合；它仍然只执行一次 $F(x)$，得到一个输出 $y$，再按不同强度写回各分支。这是简化例子，实际 GR 还有缩放、低秩门控与四条分支。

这解释了为什么多分支不等于多个独立模型，也不等于 MoE 选专家：GR 选择的是**层间保存的信息怎样进入同一个子层**，MoE 选择的是**哪些参数化计算参与执行**。下面再对照 Qwen 的具体 read/write 公式。

</section>

<section class="qwen-chapter" id="mechanism" markdown="1">

## 1. 为什么会想“加宽”残差流

残差主干可以理解为层与层之间长期保存信息的工作区。标准网络增加 hidden size 时，attention、FFN 和所有投影矩阵都会一起变大；而只增加残差 branch，理论上可以增加层间状态容量，再用较窄的 block input 控制每层计算。

<div class="qwen-evolution">
  <div><time>2016</time><strong>Residual connection</strong><p>固定读取一条状态，固定把 block 输出加回同一条状态。</p></div>
  <div><time>2023</time><strong>AltUp</strong><p>保存多条 residual streams，每层只更新其中一条，并用轻量预测维持其他分支。</p></div>
  <div><time>2024</time><strong>Hyper-Connections</strong><p>把 read、write 和 branch mixing 都变成可学习、数据相关的算子。</p></div>
  <div><time>2025</time><strong>mHC</strong><p>约束 branch mixing 为双随机矩阵，改善深层组合的稳定性。</p></div>
  <div><time>Qwen3.8</time><strong>Gated Residual</strong><p>保留数据相关 read/write，去掉完整 branch mixing，把表达力集中到 elementwise read gate。</p></div>
</div>

这条演变不是简单地“branch 越多越好”。每增加一条 branch，都增加 residual state 的内存读写；若 read/write 机制过重，推理会变成 memory-bound。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-22">[22]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-23">[23]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-24">[24]</a>

</section>

<section class="qwen-chapter" markdown="1">

## 2. GR 的读取：逐通道决定使用哪条 branch

设 4 条 residual branch 为 `R₁...R₄`。GR 先分别做 RMSNorm，再把所有 branch 拼起来，通过 rank 320 的低秩瓶颈预测 gate。读取不是“给每条 branch 一个权重”，而是**每条 branch、每个 hidden channel 都有一个 sigmoid gate**：

<div class="qwen-equation qwen-equation--stacked">
  <code>R̂<sub>i</sub> = RMSNorm(R<sub>i</sub>; γ<sub>i</sub>)</code>
  <code>G = sigmoid( W<sub>up</sub> SiLU(¼ W<sub>down</sub> vec(R̂)) )</code>
  <code>x = ¼ Σ<sub>i=1..4</sub> G<sub>i</sub> ⊙ R̂<sub>i</sub></code>
  <span>`W_down / W_up` 形成 320 维瓶颈；最终 block input 仍是 2,560 维。</span>
</div>

这允许同一个位置的不同 feature 从不同 branch 读取，而不必让整条 branch 共用一个 scalar。报告的消融显示，read 从逐 branch 标量细化到逐 channel gate 有收益；这也是 GR 相比 HC/mHC 更集中使用参数的地方。

</section>

<section class="qwen-chapter" markdown="1">

## 3. GR 的写入：每条 branch 一个标量

Block 输出 `y = F(x)` 后，GR 从当前 4 条规范化 branch 预测 4 个写入标量：

<div class="qwen-equation qwen-equation--stacked">
  <code>s = 2 · sigmoid(¼ W<sub>write</sub> vec(R̂))</code>
  <code>R′<sub>i</sub> = R<sub>i</sub> + s<sub>i</sub>y</code>
  <span>同一个 block output 写入所有 branch，但每条 branch 的强度不同。</span>
</div>

报告尝试过逐 channel write，但收益很小，因此最终保留逐 branch scalar。它也去掉 HC 中让 branch 彼此直接混合的 `H_res`：一方面消融没有显示明显收益，另一方面 `H_res` 需要额外读取整块 residual state，是 widened stream 的主要 inference 成本之一。

每层有两套独立 GR：一套包围 token mixer，一套包围 MoE。换句话说，attention/GDN 与 FFN 各自决定如何读取和写回 4 条状态。

</section>

<section class="qwen-chapter" markdown="1">

## 4. 从结构消融看设计收缩

GR 不是从一开始就确定的公式，而是从更一般的 Hyper-Connections 空间逐步删减：

<div class="qwen-decision-table">
  <div><span>Gate activation</span><strong>sigmoid 优于 tanh</strong><p>有界正 gate 在 loss 和稳定性上更好。</p></div>
  <div><span>Data dependence</span><strong>动态 read/write 保留</strong><p>相对 static variant，loss 差异很小，但 benchmark 平均提升明显。</p></div>
  <div><span>Read granularity</span><strong>逐 channel</strong><p>细粒度读取有收益。</p></div>
  <div><span>Write granularity</span><strong>逐 branch scalar</strong><p>更细的写入没有明显回报。</p></div>
  <div><span>Branch mixing</span><strong>删除 H<sub>res</sub></strong><p>没有显著增益，却增加内存读取与约束。</p></div>
</div>

报告中一个值得保留的现象是：static 到 dynamic 的 loss 只改善 0.002，但平均 benchmark 差距更大。它提醒我们，训练 loss 不能完整代表 residual routing 是否学到了对任务有用的结构。

</section>

<section class="qwen-chapter" markdown="1">

## 5. 真正困难的是内存流量

4 条 branch 意味着 residual state 宽度变成 `4 × 2560`。即使 block 计算仍在 2,560 维，若每个子层反复读取和写回四倍状态，速度也可能被显存带宽限制。

Qwen3.8 的实现针对这一点做了三件事：

- 去掉 `H_res`，避免每个 block 多一次完整 residual-state read。
- 把 branch state 存为 FP8，相比 BF16 把残差流搬运字节减半；报告称质量损失很小。
- 分别融合 read 与 write kernel，把 group RMSNorm 折叠进 read，使每个方向只遍历一次 widened stream。

<div class="qwen-cost-shift">
  <div><small>增加</small><strong>层间状态容量与可选择的读路径</strong><p>4 条 branch 保存更多并行 feature，并允许逐通道组合。</p></div>
  <i class="fas fa-long-arrow-alt-right" aria-hidden="true"></i>
  <div><small>代价</small><strong>残差内存流量与门控 kernel</strong><p>需要 FP8 state、融合 kernel 和简化 branch mixing 才能控制。</p></div>
</div>

</section>

<section class="qwen-chapter" id="self-check" markdown="1">

## 读完后，试着解释

四条残差流是否意味着每层运行四次 Attention？与 MoE 有何区别？

<details class="qwen-self-check" markdown="1">
<summary>展开参考答案</summary>

GR 先把四条流读成一个子层输入，昂贵子层仍执行一次，再把结果写回多流。它调整信息读写；MoE 选择执行哪些专家参数。

</details>

</section>

<aside class="qwen-callout qwen-callout--question" markdown="1">
<strong>我还想继续确认的问题</strong>

1. 4 条 branch 是否会形成稳定、可区分的功能，还是只是提供更宽的连续表示？
2. FP8 residual state 的“几乎无损”能否在 post-training、长上下文与不同硬件上保持？
3. elementwise read gate 的收益究竟来自选择信息，还是来自额外的低秩非线性容量？
</aside>


</div>
</details>

{% include qwen-note/references.html refs='<a href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a> Qwen 技术报告 §2.2；<a href="/notes/qwen3.8-flash-next/references/#ref-6">[6]</a> ResNet；<a href="/notes/qwen3.8-flash-next/references/#ref-22">[22]</a> AltUp；<a href="/notes/qwen3.8-flash-next/references/#ref-23">[23]</a> Hyper-Connections；<a href="/notes/qwen3.8-flash-next/references/#ref-24">[24]</a> mHC；<a href="/notes/qwen3.8-flash-next/references/#ref-25">[25]</a> GatedNorm / residual sinks。' %}

{% include qwen-note/footer.html %}
