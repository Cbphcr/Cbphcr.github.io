---
permalink: /notes/qwen3.8-flash-next/optimizer/
title: "Optimizer：Muon、AdamW 与参数分工"
excerpt: "Qwen3.8-Flash-Next 的 Muon、AdamW、Adam 分工与分布式实现"
author_profile: false
wide: true
note_page: true
note_chapter: optimizer
note_number: "07 / OPTIMIZER"
note_heading: "Muon、AdamW 与参数分工"
note_description: "Qwen3.8 不把 Muon 当成 AdamW 的全量替代，而是先判断一个参数是否真的是值得正交化的二维线性映射。"
note_prev_url: /notes/qwen3.8-flash-next/residual/
note_prev_label: "Residual：从单流到 Gated Residual"
note_next_url: /notes/qwen3.8-flash-next/references/
note_next_label: "参考文献与资料边界"
---

{% include qwen-note/header.html %}

<section class="qwen-chapter__lead" markdown="1">

Adam/AdamW 为每个参数维护一阶与二阶矩估计，再逐元素缩放更新；这种统一接口非常稳健，却不会显式利用“这个参数其实是一张线性映射矩阵”的几何结构。Muon 对矩阵动量做近似正交化，希望让更新的奇异方向更均衡。Qwen3.8 的关键不只是“用了 Muon”，而是建立了一套**按参数语义、形状和训练行为分配优化器**的规则。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-31">[31]</a>

</section>

<nav class="qwen-learning-nav" aria-label="本章阅读层次"><a href="#history">发展主线</a><a href="#mechanism">原理与 Qwen 实现</a><a href="#self-check">自测与答案</a></nav>

<section class="qwen-chapter qwen-history" id="history" markdown="1">

## 发展主线：从标量步长到矩阵更新几何

### 动量到 Adam：先处理梯度的噪声与尺度差异

最基本的 SGD 沿负梯度走一步；动量累积近期梯度，减少更新方向随 batch 抖动。Adam（2014 预印本 / 2015 ICLR）同时维护一阶矩和平方梯度的二阶矩估计，并进行偏差修正。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-29">[29]</a> 后者用于逐坐标调节步长，**不是计算 Hessian**；“二阶矩”不等于“二阶优化器”。

在不同坐标梯度尺度差异很大时，这种自动调节很方便。但它也要存储额外状态，且每个标量如何更新的接口，没有显式表达一整张线性映射的方向结构。

### AdamW 与 Adafactor：先纠正正则化，再考虑状态内存

AdamW（2017 预印本 / 2019 ICLR）把权重衰减从自适应梯度更新中分离。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-30">[30]</a> 若直接把 $\lambda W$ 加进梯度，它会与梯度一起被每个坐标不同的分母缩放；解耦衰减则直接执行与当前权重成比例的收缩。这不是给 Adam 换个名字，而是改变了正则化的实际效果。

Adafactor（2018）针对大矩阵的二阶矩存储，使用行列统计来近似完整逐元素统计。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-58">[58]</a> 对 $m\times n$ 的矩阵，相关二阶矩状态从 $mn$ 项降到约 $m+n$ 项。它代表“减少优化器内存”的路线；不是说 Qwen 在使用 Adafactor，也不是 Muon 的必经前身。

### Shampoo 到 Muon：把矩阵当成矩阵处理

Shampoo（2018）为张量的不同维度维护预条件矩阵，利用比逐坐标缩放更丰富的结构。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-59">[59]</a> Muon（2024）采用另一种思路：对矩阵动量做近似正交化。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-31">[31]</a> 两者都利用矩阵结构，但 Muon 不是直接求完整 Hessian 的逆，也不能简单等同于 Shampoo。

用理想化满秩矩阵 $M=U\Sigma V^\top$ 解释，polar factor 是 $UV^\top$。若 $M=\operatorname{diag}(100,1)$，理想 polar factor 是 $\operatorname{diag}(1,1)$：强弱方向的尺度差异被压平。实际 Muon 用有限次多项式迭代得到近似结果，还要考虑动量、更新缩放和数值稳定性；不会真的对每张大矩阵执行完整 SVD。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-31">[31]</a>

尤其要注意，被处理的是**更新方向**。更新后的权重 $W-\eta U$ 不因此变成正交矩阵；“Muon 让模型权重全部正交”是错误解释。

### 2025—2026：单卡公式走向大规模训练 recipe

Muon Is Scalable for LLM Training（2025）研究大规模 LLM 中的更新尺度与实现问题。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-32">[32]</a> 到 Qwen3.8，问题进一步细化为哪些矩阵适用、拼接参数怎样拆分、完整矩阵由哪个设备重建与更新，以及学习率和 batch 如何重新标定。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a> 这解释了为什么“替换 optimizer 类名”并不足以复现论文收益。

| 方法 | 主要保存 / 使用的信息 | 解决的问题 | 不能据此断言 |
| --- | --- | --- | --- |
| SGD + momentum | 梯度与历史方向 | 噪声、方向抖动 | 自动适应所有坐标尺度 |
| Adam / AdamW | 逐坐标一阶、二阶矩 | 自适应步长、解耦衰减 | 利用了完整矩阵几何 |
| Adafactor | 行列统计 | 二阶矩状态内存 | 等价于矩阵正交化 |
| Shampoo | 各维度预条件矩阵 | 张量结构与相关性 | 与 Muon 算法相同 |
| Muon | 矩阵动量及其近似 polar 更新 | 更新方向尺度不均衡 | 所有二维 tensor 都适合 |

接下来的参数分工可以按语义理解：线性层的矩阵、离散地址的表、专家分类器的 router，虽然都可能存成二维数组，但一次更新希望保留的结构并不相同。

</section>

<section class="qwen-chapter" id="mechanism" markdown="1">

## 1. AdamW 的默认假设

Adam 根据梯度的一阶矩 `m` 和二阶矩 `v`，对每个标量参数独立调节步长。AdamW 再把 weight decay 从自适应梯度更新中解耦。它对 embedding、bias、norm、router 和各种形状都能使用，工程接口统一。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-29">[29]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-30">[30]</a>

“逐元素”也是它的限制：对于一个 `A × B` 线性变换，更新矩阵的不同方向可能尺度差异很大；AdamW 不会主动把这些奇异方向拉到相近尺度。Muon 正是在这里引入矩阵级操作。

</section>

<section class="qwen-chapter" markdown="1">

## 2. Muon 做了什么

Muon 先形成带 Nesterov momentum 的更新矩阵，再用 Newton-Schulz iteration 近似计算其 polar factor / matrix sign，使更新方向接近半正交矩阵。直观上，它保留矩阵更新的主要方向结构，同时压平奇异值的尺度差异。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-31">[31]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-32">[32]</a>

<div class="qwen-equation qwen-equation--stacked">
  <code>M<sub>t</sub> = μM<sub>t-1</sub> + ∇W<sub>t</sub></code>
  <code>U<sub>t</sub> ≈ Polar(M<sub>t</sub>)</code>
  <code>W<sub>t+1</sub> = W<sub>t</sub> - η · scale(A, B) · U<sub>t</sub></code>
  <span>这是概念化写法；Qwen 报告使用 Nesterov momentum 与具体的 shape scaling。</span>
</div>

Qwen3.8 的配置细节包括：momentum `μ = 0.95`，使用 8 步 Newton-Schulz，迭代系数采用 Polar Express 给出的逐步 schedule，并按矩阵形状缩放更新 RMS。报告的 stress test 中，更多 NS steps 降低了 gradient-norm spike 的幅度和频率。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-33">[33]</a>

</section>

<section class="qwen-chapter" markdown="1">

## 3. 哪些参数使用哪种优化器

<div class="qwen-optimizer-map">
  <section class="is-muon"><h3>Muon</h3><p>真正作为二维线性映射工作的矩阵</p><ul><li>Attention Q / K / V / O</li><li>GDN input / output projections</li><li>Routed 与 shared expert FC1 / FC2</li><li>N-gram key / value projections</li></ul></section>
  <section class="is-adamw"><h3>AdamW</h3><p>语义或形状不适合矩阵正交化</p><ul><li>Input embedding 与 LM Head</li><li>MoE router</li><li>GR 低秩 projections</li><li>Attention / GDN output gates</li><li>Norm weights</li></ul></section>
  <section class="is-adam"><h3>Adam, no decay</h3><p>稀疏访问的查表参数</p><ul><li>N-gram embedding tables</li></ul></section>
</div>

这里的判断不是“二维 tensor 就用 Muon”。报告给出几个反例：

- **MoE router** 虽是矩阵，但每个输出维对应相对独立的 expert score。Muon 在早期加剧波动，后期使用也没有显著收益。
- **GR 低秩矩阵** 形状非常狭长，AdamW 表现相当或更好。
- **GDN decay / beta projection** 每个 head 只产生一个 scalar，更接近向量，正交化没有明确意义。
- **Output gate projection** 的消融中，AdamW 至少不差于 Muon。

这比“Muon for weights, AdamW for embeddings”更准确：分配依据是参数在网络中承担的运算语义。

</section>

<section class="qwen-chapter" markdown="1">

## 4. 为什么 fused matrix 要先拆开

Megatron-LM 常把 Q/K/V、SwiGLU gate/up 或 GDN 多组投影存成一个大 fused tensor，以减少 kernel 和通信开销。但它们在数学上是若干独立线性算子的拼接。

如果直接对 fused tensor 做 Muon，会发生两件事：Newton-Schulz 把无关子块的奇异方向混在一起；shape scaling 也使用了拼接后的假形状。Qwen3.8 因此在 optimizer step 中先按语义切开：

<ol class="qwen-process">
  <li><strong>Split</strong><span>QKV 与 GDN input 按 head 拆分，SwiGLU FC1 拆成 gate/up 两半。</span></li>
  <li><strong>Orthogonalize</strong><span>每个真实子矩阵独立运行 Newton-Schulz。</span></li>
  <li><strong>Exclude</strong><span>不适合 Muon 的 gate/vector 子块单独交给 AdamW。</span></li>
  <li><strong>Gather</strong><span>更新重新拼回原 fused layout，不改变前向存储结构。</span></li>
</ol>

这说明 optimizer 的“参数单位”不一定等于框架中的 `Parameter` tensor；应以实际线性算子的边界为准。

</section>

<section class="qwen-chapter" markdown="1">

## 5. 分布式 Muon 为什么难

Newton-Schulz 需要看到完整矩阵，但 tensor parallelism 会把矩阵切在多个 rank 上；同时其计算量对较短维度呈高阶增长，简单按元素数均分会让不同 data-parallel rank 的 optimizer workload 严重不均。

Qwen 团队为此使用 Canzona：把“参数在前向中怎样分片”和“optimizer 由谁负责”解耦。静态 partitioner 按估计的 NS FLOPs 分配完整矩阵；Micro-Group pipeline 通过 All-to-All 重建矩阵，owner 执行与单卡等价的 Muon step，再把结果放回原有 ZeRO-1 / Megatron layout。大量拆分后的小矩阵 kernel 则用 CUDA Graph 捕获，降低 launch overhead。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-34">[34]</a>

<div class="qwen-cost-shift">
  <div><small>获得</small><strong>矩阵级更新几何与更大的稳定区间</strong><p>报告中 Muon recipe 支持更高学习率，并降低特定 stress test 的 clipping 与 spike。</p></div>
  <i class="fas fa-long-arrow-alt-right" aria-hidden="true"></i>
  <div><small>支付</small><strong>NS FLOPs、重建通信与 optimizer 编排</strong><p>需要负载感知分配、All-to-All、语义拆分和 CUDA Graph。</p></div>
</div>

</section>

<section class="qwen-chapter" markdown="1">

## 6. 超参数也要重新标定

更换 optimizer 会改变合适的 learning rate、batch size 与训练稳定区间。Qwen3.8 没有沿用 AdamW recipe 的既有 scaling law，而是重新用小规模实验拟合，再外推到目标模型。

报告还给出一个负结果：使用 batch-size warmup 的方案比直接从目标 batch size 开始多花了 18.8% optimizer steps，却没有改善最终效果；因此最终方案移除了 batch-size warmup。这类结果很重要，因为它表明“更多参数更新”并不自动等于更好的 token efficiency；optimizer、batch 和数据量必须共同考虑。

同样，Muon + GR + 新主干的联合稳定性实验不能解释为 Muon 单独带来全部收益。报告专门比较了若干组合，但最终 125B recipe 仍是多个结构与优化选择共同作用。

</section>

<section class="qwen-chapter" id="self-check" markdown="1">

## 读完后，试着解释

Muon 正交化的是权重还是更新？为什么 embedding 也是矩阵，却不一定适合？

<details class="qwen-self-check" markdown="1">
<summary>展开参考答案</summary>

处理的是矩阵动量形成的更新方向，权重不会因此自动正交。查表的每一行是离散地址，访问稀疏、语义不同于普通线性映射；仅凭 tensor 是二维不能决定优化器。

</details>

</section>

<aside class="qwen-callout qwen-callout--question" markdown="1">
<strong>我还想继续确认的问题</strong>

1. “真正的线性映射”能否形成一套自动、可迁移的 optimizer assignment 规则？
2. Muon 的收益有多少来自 update geometry，有多少来自重新调过的 learning rate 与 batch？
3. 当模型进一步增加极小 experts 或更细分的 fused operators 时，矩阵重建成本会不会超过正交化收益？
</aside>

{% include qwen-note/references.html refs='<a href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a> Qwen 技术报告 §3；<a href="/notes/qwen3.8-flash-next/references/#ref-29">[29]</a> Adam；<a href="/notes/qwen3.8-flash-next/references/#ref-30">[30]</a> AdamW；<a href="/notes/qwen3.8-flash-next/references/#ref-31">[31]</a> Muon；<a href="/notes/qwen3.8-flash-next/references/#ref-32">[32]</a> Scalable Muon；<a href="/notes/qwen3.8-flash-next/references/#ref-33">[33]</a> Polar Express；<a href="/notes/qwen3.8-flash-next/references/#ref-34">[34]</a> Canzona。' %}

{% include qwen-note/footer.html %}
