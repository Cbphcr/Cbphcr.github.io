---
permalink: /notes/qwen3.8-flash-next/attention/
title: "Attention：压缩记忆与稀疏召回"
excerpt: "从一段很长的文章出发，理解 GDN 的压缩记忆和 QSA 的选择性回看。"
author_profile: false
wide: true
note_page: true
note_chapter: attention
note_number: "02 / ATTENTION"
note_heading: "Attention：边读边记，还是回头翻？"
note_description: "从一段很长的文章出发，理解 GDN 的压缩记忆和 QSA 的选择性回看。"
note_prev_url: /notes/qwen3.8-flash-next/embedding/
note_prev_label: "Embedding：从 Token Lookup 到条件记忆"
note_next_url: /notes/qwen3.8-flash-next/norm/
note_next_label: "Norm：稳定残差流的尺度"
---

{% include qwen-note/header.html %}

<p class="qwen-intro">文章越长，逐字回看越费时间；只记摘要，又可能忘掉关键细节。Qwen 把这两种处理历史的方式搭配起来：多数层维护一份紧凑状态，间隔一些层再选择性地访问历史位置。</p>

<nav class="qwen-learning-nav" aria-label="本章阅读路径"><a href="#changes">相对 LLaMA 的变化</a><a href="#evolution">再看演进</a><a href="#advanced">论文与公式</a></nav>


<section class="qwen-chapter qwen-primer" id="changes" markdown="1">

## 从全局 softmax attention，到 GDN + QSA 混合层

以你熟悉的带 KV cache 的 causal attention 为起点。这里主要改变两件事：一部分层用矩阵状态代替逐位置历史访问；另一部分层保留历史表示，但先选择位置再计算稀疏 attention。

| 对照项 | 熟悉的基线 | 本章关注的变化 |
| --- | --- | --- |
| 历史表示 | 逐位置保存 K/V | GDN 保存固定大小状态；QSA 保留可访问的历史表示 |
| 本步计算 | 与可见历史计算 attention | GDN 更新 / 读取状态；QSA 先选块再访问 |
| 层间安排 | 各层采用同类 attention | 3 个 GDN + 1 个 QSA，重复 12 次 |
| 新增代价 | 随长度增长的访问 | 状态压缩会损失细节；选择器有开销和漏选风险 |

这里的比较基线是典型 dense LLaMA decoder（优化器章以 AdamW 为基线），不代表所有 LLaMA 版本；“变化”也不等于 Qwen 首创。报告、配置与实现分别见 <a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-4">[4]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-39">[39]</a>，历史来源见下文。

</section>

{% include qwen-note/visual.html kind="attention" title="两种处理长上下文的办法" caption='“笔记”和“原文”是教学比喻：GDN 存矩阵状态，QSA 访问历史 token 的向量，不是人类可读的文档。下方四层周期来自 Qwen 报告 <a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a>。' %}

<section class="qwen-chapter qwen-primer" id="learn" markdown="1">

## 第一种办法：不反复翻全文，边读边更新笔记

GDN（Gated DeltaNet）把已读信息压进一份固定大小的状态。新内容到来时，它决定保留多少旧信息，再修改相关关联。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-11">[11]</a>

比如教学上可以想象：原来记着“钥匙 → 蓝盒子”，后来读到“钥匙被移到了抽屉”。有用的更新应该调整原关联，而不只是把两句话毫无区别地叠在一起。GDN 的误差写入提供了这种修改关联的机制。

但真实状态不是一张清晰的键值清单。很多信息共同挤在有限的数字空间里，可能干扰或丢失。**固定大小，是它省资源的原因，也是它不能无限保留细节的原因。**

## 第二种办法：原来的记录还在，只挑有关的地方看

QSA（Qwen Sparse Attention）先用一个轻量的“挑选器”估计哪些历史块值得读，再对选中的位置做 attention。它更像先找目录，再翻相关页。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a>

这和只保留最近几页不同：被选中的位置可以很远。但如果第一步没选中“蓝盒子”所在的位置，后面再仔细读选中的内容也补不回来。挑选器本身也要计算，所以“稀疏”不等于所有成本都消失。

## 为什么把两种办法搭配起来？

Qwen 的主干每四层安排三个 GDN 层和一个 QSA 层。**两种处理发生在不同层，前一层的结果会交给后一层**，不是两个互不交流的独立助手。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a>

可以这样理解它的取舍：压缩状态负责以较低的长度相关成本处理历史，周期性的 attention 提供直接访问历史位置的机会。搭配使用仍然可能犯错，并不能保证所有长文细节都被记住。

## 其他几个常见名字，先各记一句话

**GQA** 让多个注意力头共享一部分历史缓存；**FlashAttention** 改善计算时的数据搬运；**RoPE** 给位置关系提供线索。它们分别改“怎么存”“怎么算”“怎么表达位置”，可以与其他设计组合。不要把这些名字排成一条谁淘汰谁的名单。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-44">[44]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-45">[45]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-12">[12]</a>

</section>


<details class="qwen-self-check" markdown="1">
<summary>需要时回顾：已有 Transformer / LLaMA 基础</summary>

## 读到后面，为什么还需要前面的信息？

假设一篇长文开头写：“小林把钥匙放进蓝盒子。”许多段之后问：“钥匙在哪里？”模型需要让后面的回答利用前面的句子。

**Attention** 就是一种按当前需要，从其他位置取信息的机制。可以粗略理解为：当前的位置提出需求，历史位置提供线索，模型算出哪些线索更相关，再把它们的内容组合起来。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-5">[5]</a>

普通的全局 attention 能直接访问前面的所有位置。但文章很长时，比较和搬运历史数据也会越来越贵。


</details>

<section class="qwen-chapter qwen-primer" id="evolution" markdown="1">

## 怎么一步步走到这里？

<div class="qwen-plain-history" markdown="1">

1. **先让每个位置按需访问历史。** Transformer 的 attention 提供了直接的内容关联，但长序列会放大计算与缓存成本。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-5">[5]</a>
2. **保留这种能力，先把存储和搬运做省。** MQA、GQA 减少 KV 缓存的重复，FlashAttention 改善执行方式。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-43">[43]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-44">[44]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-45">[45]</a>
3. **另一条路是压缩历史。** 线性 attention、状态空间模型探索递推状态；GDN 结合遗忘和误差写入，让状态更灵活地更新。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-46">[46]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-47">[47]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-48">[48]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-11">[11]</a>
4. **还有一条路是少看一些位置。** 从局部窗口到内容相关的稀疏选择，重点变成“省下访问的同时，别漏掉重要信息”。QSA 属于这条路线，并与 GDN 组合。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-57">[57]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-13">[13]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a>

</div>

<p class="qwen-everyday"><strong>读到这里，先记住：</strong>GDN 的难点是“压缩后还记得多少”，QSA 的难点是“重要位置有没有选中”。这两种误差不同，所以有组合使用的价值。</p>

</section>

<details class="qwen-advanced" id="advanced" markdown="1">
<summary>继续深入：论文脉络、公式与实现细节<small>点此展开原有详细笔记；用于核对精确公式、配置和论文证据。</small></summary>
<div class="qwen-advanced__body" markdown="1">


<section class="qwen-chapter__lead" markdown="1">

Full attention 的优势是：每个 query 都能直接按内容访问此前所有 token。代价也很明确：训练时注意力矩阵随序列长度二次增长，自回归生成时 KV Cache 随上下文线性增长。Qwen3.8 的处理方式不是只保留局部窗口，而是把 48 层按 `3 × GDN + 1 × QSA` 排列：多数层把历史压缩进固定状态，周期性层再对原始 token 做稀疏召回。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a>

</section>



<section class="qwen-chapter qwen-history" id="history" markdown="1">

## 发展主线：Attention 的演进是一张分叉图

### 2017 起点：为什么直接比较历史很有用

读到“她把书还给小李，因为他……”，当前 token 需要从前缀挑出有关的人物和动作。Self-attention 把当前需求编码成 query，把历史位置编码成 key/value，通过相似度得到加权结果。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-5">[5]</a> “匹配”是连续的数值运算，不是数据库里精确相等的键查询。

先区分两种负载：**prefill** 一次处理已有的整段提示；**decode** 每步只新增一个 token，并使用缓存。固定 head 维度时，dense attention 的整段 token mixing 计算为 $O(n^2)$，单步 decode 为 $O(n)$；两者不能混用“线性/二次”的说法。

### 路线一：保留 dense attention，减少缓存与搬运

MHA 为每个 query head 配一组 K/V。MQA（2019）让多个 query head 共用一组 K/V，GQA（2023）则在二者之间使用若干 KV 组。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-43">[43]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-44">[44]</a> 例如 32 个 query head 从 32 组 KV 改成 8 组，在长度、head 维度和精度相同时，**该层 K/V 张量**大小变成四分之一；attention 输出仍有 32 个 query head，并没有只看四分之一的历史。

FlashAttention（2022）解决另一个瓶颈：通过分块和在线 softmax，减少 GPU 显存与片上存储之间的搬运，避免显式保存完整注意力分数矩阵。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-45">[45]</a> 它仍计算精确 dense attention；它降低中间存储需求，并没有把所有 query-key 对的运算变成线性。MLA（DeepSeek-V2，2024）则用低秩潜变量压缩 KV，是缓存表示的另一条路线。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-56">[56]</a> **GQA、FlashAttention、稀疏选择可以在不同层面组合，不能排成替代关系。**

### 路线二：不保留逐 token KV，改为递推状态

Linear Transformer（2020）用核特征映射重写 attention，再借矩阵乘法结合律累计状态。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-46">[46]</a> 忽略具体归一化项，一个直觉式写法是 $S_t=S_{t-1}+k_tv_t^\top$：新 token 的关联写进同一张矩阵，query 以后从矩阵读取。固定状态尺寸下，单步状态更新不随前缀长度增加；代价是不同关联可能相互干扰。

Fast-weight / Delta rule（2021）把“不断相加”改成“先读旧值，再写误差”。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-10">[10]</a> 用一维教学例子，令 key 为 1，旧记忆是 2，新值是 3：纯加法得到 5；若写入强度为 1，delta 更新得到 $2+(3-2)=3$。一般高维 key 并不正交，所以这不保证所有记忆都能无损覆盖，但解释了为什么误差写入有意义。

与此同时，Mamba（2023）让状态空间模型按输入选择保留或遗忘信息；Mamba-2（2024）用状态空间对偶关系连接 SSM 与部分 attention 形式，并改善计算实现。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-47">[47]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-48">[48]</a> Gated DeltaNet（2024 预印本 / 2025 ICLR）结合遗忘门与 delta 更新。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-11">[11]</a> 它从两条路线取长处，不能简化成“Mamba 换了一个名字”。下面的 GDN 公式会把全局衰减 $\alpha$ 和定向写入 $\beta$ 分开。

### 路线三：保留 token 级历史，但只读一部分

局部窗口让当前 token 只看附近位置，省掉长距离比较，却可能漏掉很远的定义。内容相关的稀疏方法允许 query 挑选远处位置，但选择器本身也有成本。NSA（2025）把压缩、选择与局部窗口结合，并把稀疏模式与硬件实现共同设计；DSA（2025）采用轻量索引器筛选位置。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-57">[57]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-13">[13]</a> QSA 延续内容选择方向，进一步对索引器的 key 序列做 micro-block 压缩。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a>

| 做法 | 历史以什么形式存在 | 主要减少什么 | 关键限制 |
| --- | --- | --- | --- |
| MQA / GQA | 每个位置的共享 KV | KV head 维度上的容量和带宽 | 仍访问整个前缀 |
| FlashAttention | dense attention 所需的 Q/K/V | 分数矩阵存储与 IO | pairwise 计算仍是二次 |
| 线性状态 / GDN | 固定大小递推状态 | 长度相关的状态增长 | 压缩与关联干扰 |
| 滑动窗口 | 近期位置的 KV | 访问范围与可保留缓存 | 远程信息只能间接传播 |
| DSA / QSA | 可供选择的历史 KV 与索引 | 主 attention 的实际访问量 | 漏召回与索引器成本 |

特别注意：QSA 的索引器 prefill 成本约为 $O(n^2/r)$，$r$ 是块大小；固定 $r$ 时，仍是二次复杂度。稀疏主 attention 访问更少位置，也不意味着可以预先删除所有未选 KV，因为下一次 query 可能需要它们。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a>

### 位置编码：与上面三条路线交叉的一条轴

没有位置机制，集合式内容比较本身不足以表达顺序。原始 Transformer 使用绝对位置编码；RoPE（2021）旋转 Q/K，使点积包含相对位置关系；ALiBi（2021）直接给 attention score 加距离偏置；YaRN（2023）研究如何调整 RoPE 以扩展上下文窗口。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-5">[5]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-12">[12]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-49">[49]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-50">[50]</a> 它们都在处理“位置怎么进入模型”，不会独自消除长序列的计算或缓存成本。

Qwen 的周期性 attention 层保留部分维度上的 RoPE，GDN 通过因果递推和短卷积携带顺序信息。读完这张图再看 `3 × GDN + 1 × QSA`，就能把它理解成对多种成本的组合取舍，而不是某一种 attention 获胜后的统一替换。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a>

</section>

<section class="qwen-chapter" id="mechanism" markdown="1">

## 1. Full attention 的能力与成本

标准 causal self-attention 可以简写为：

<div class="qwen-equation">
  <code>Attention(Q, K, V) = softmax(QKᵀ / √d + causal_mask) V</code>
  <span>当前位置可以直接比较此前所有 key，并按内容加权取回对应 value。</span>
</div>

它没有显式压缩历史，因此检索路径短、表达直接；但长度为 `n` 时，需要处理 `n × n` 的相关性。MQA/GQA 可以减少 KV Cache 的 head 数，却不改变“仍要在全部历史位置上检索”这一点。滑动窗口进一步把成本限制在固定窗口内，但窗口之外的信息只能通过层间传播间接进入当前表示。

因此长上下文模型需要在三件事之间取舍：**保留多少原始 token、用多大状态压缩历史、何时支付一次内容检索的成本。**<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-5">[5]</a>

</section>

<section class="qwen-chapter" markdown="1">

## 2. 两条效率路线

<div class="qwen-branch-map">
  <div class="is-state"><span>路线 A</span><h3>把历史压进固定状态</h3><p>线性 attention 可被理解为一个 fast-weight memory：key-value 关联被不断写入矩阵状态。每一步只读写固定大小的状态，代价不再随前缀长度增长。</p><strong>Qwen3.8：Gated DeltaNet</strong></div>
  <div class="is-retrieval"><span>路线 B</span><h3>保留历史，只选择少量位置</h3><p>轻量 indexer 先估计哪些 token 或 block 与当前 query 相关，主 softmax attention 只计算被选中的部分。</p><strong>Qwen3.8：Qwen Sparse Attention</strong></div>
</div>

固定状态的限制是压缩：有限维状态不可能无损保留任意长前缀的所有细节。稀疏选择的限制是召回：如果 indexer 没选中关键位置，后面的精确 attention 也无法补救。两者的误差形式不同，因此可以互补。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-10">[10]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-13">[13]</a>

</section>

<section class="qwen-chapter" markdown="1">

## 3. Gated DeltaNet：可覆盖的 fast-weight memory

早期线性 attention 常用外积把新的 key-value 关联累加到状态。纯加法更新容易让重复 key 的信息不断叠加，也难以精确覆盖旧关联。Delta rule 先读取当前 key 已经对应的值，再只写入预测误差；Gated DeltaNet 进一步增加 decay gate，控制整块旧状态的寿命。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-10">[10]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-11">[11]</a>

<div class="qwen-equation qwen-equation--stacked">
  <code>S̃<sub>t-1</sub> = α<sub>t</sub>S<sub>t-1</sub></code>
  <code>e<sub>t</sub> = v<sub>t</sub> - S̃<sub>t-1</sub><sup>T</sup>k<sub>t</sub></code>
  <code>S<sub>t</sub> = S̃<sub>t-1</sub> + β<sub>t</sub>k<sub>t</sub>e<sub>t</sub><sup>T</sup></code>
  <code>y<sub>t</sub> = S<sub>t</sub><sup>T</sup>q<sub>t</sub></code>
  <span>`α` 决定旧状态保留多少；`β` 决定本次误差写入多少。</span>
</div>

Qwen3.8 的 GDN 还包括几项具体参数化：

- Q/K/V 投影先经过 kernel size 4 的短因果卷积；Q、K 再经过 SiLU 与 L2 normalization。
- 16 个 QK head，维度 128；48 个 value head，维度 128。
- recurrence 输出先做 zero-centered RMSNorm，再乘输入相关的 sigmoid output gate；原始 GDN 的输出 gate 使用 SiLU，这里改为有界 sigmoid。
- GDN 层不需要随上下文增长的完整 KV Cache，但要维护每个 head 的矩阵状态。

“GDN 负责记忆”只是便于理解的简称。它同样会做内容相关读写，只是信息必须经过固定维状态，而不是直接回到某个原始 token。

</section>

<section class="qwen-chapter" markdown="1">

## 4. QSA：先按 block 找位置，再做 sparse softmax

Qwen Sparse Attention 仍然是 softmax attention；变化发生在候选位置的生成方式。轻量 indexer 使用 4 个 query head 和 1 个共享 key head，把 key 每 4 个 token 做一次 average pooling，得到 micro-block 表示；它为 block 排序后，主 attention 只访问被选中 block 对应的 token。

<ol class="qwen-process">
  <li><strong>压缩 key</strong><span>每 4 个 token 聚合成一个 micro-block，降低 indexer 自身处理的序列长度。</span></li>
  <li><strong>估计相关性</strong><span>轻量 MQA indexer 对 block 打分；Q/K 使用部分 RoPE 与 RMSNorm。</span></li>
  <li><strong>选择 top-k</strong><span>配置预算为 2,048 个 token，也就是 512 个 4-token block。</span></li>
  <li><strong>运行主 attention</strong><span>24 个 query head、2 个 KV head、head dim 256，只在稀疏 mask 内计算 softmax。</span></li>
</ol>

Indexer head dim 为 128，其中 64 维使用 RoPE；主 attention 的 256 维中也只有 64 维使用 RoPE。报告将这种 block-level indexer 与 token-level sparse indexer 对比，核心目标是降低 selector 本身在超长上下文上的开销。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-4">[4]</a>

</section>

<section class="qwen-chapter" markdown="1">

## 5. 为什么是 3 + 1，而不是一种 attention 到底

<div class="qwen-layer-cycle" aria-label="Qwen3.8 attention cycle">
  <div class="is-gdn"><span>Layer 1</span><strong>GDN</strong><small>压缩与更新</small></div>
  <div class="is-gdn"><span>Layer 2</span><strong>GDN</strong><small>压缩与更新</small></div>
  <div class="is-gdn"><span>Layer 3</span><strong>GDN</strong><small>压缩与更新</small></div>
  <div class="is-qsa"><span>Layer 4</span><strong>QSA</strong><small>稀疏召回</small></div>
  <i class="fas fa-redo" aria-hidden="true"></i><b>× 12</b>
</div>

报告先在预训练结构消融中比较 full attention、SWA hybrid 和 GDN hybrid；三者不是仅替换一个 kernel 的完全控制实验，但结果支持保留周期性全局层。随后在 continued pretraining 阶段，把这些 full-attention 层替换成 QSA。

这意味着“3 + 1”承担两层折中：GDN 降低多数层的长度相关成本，attention 层保留直接 token retrieval；QSA 又进一步降低这些 retrieval 层的实际访问集合。报告还保留 RoPE，因为 NoPE 版本虽然预训练差异不大，post-training 后出现了更高的 endless generation 比例。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-12">[12]</a>

</section>

<section class="qwen-chapter" markdown="1">

## 6. 成本转移与证据边界

<div class="qwen-cost-shift">
  <div><small>减少</small><strong>全层 full attention 与完整 KV 访问</strong><p>36 层使用固定状态 GDN；12 层只访问 indexer 选中的 token。</p></div>
  <i class="fas fa-long-arrow-alt-right" aria-hidden="true"></i>
  <div><small>增加</small><strong>状态压缩、稀疏召回与 kernel 复杂度</strong><p>需要训练稳定的 recurrence、可靠的 indexer，以及能把理论稀疏转成真实吞吐的实现。</p></div>
</div>

需要克制的结论有三点：

1. GDN hybrid 的 benchmark 改善不能全部归因于“线性 attention 更强”；报告明确说该实验没有隔离每个架构组件的独立贡献。
2. QSA 的速度优势随 context length、batch 和 MTP 步数变化。稀疏 FLOPs 更少，不保证所有 workload 都更快。
3. `2,048` 是检索预算，不是模型只能利用 2,048 token。此前缀还通过 GDN 状态和层间传播进入表示，但哪些信息被保留是学习出来的。

</section>

<section class="qwen-chapter" id="self-check" markdown="1">

## 读完后，试着解释

GQA 的 KV 减为四分之一，是否表示 attention 只看四分之一的 token？QSA 是否整段线性？

<details class="qwen-self-check" markdown="1">
<summary>展开参考答案</summary>

都不是。GQA 压缩的是 KV head 维度。QSA 的主计算是稀疏访问，但固定压缩比下，索引器整段打分仍有 O(n²/r) 成本。还要单独区分 prefill 与逐步 decode。

</details>

</section>

<aside class="qwen-callout qwen-callout--question" markdown="1">
<strong>我还想继续确认的问题</strong>

1. GDN 遗忘的信息与 QSA 漏召回的信息是否会在同一类长程任务上叠加？
2. QSA 的 block 粒度和预算能否根据 query 或 layer 动态变化，而不是固定 4 与 2,048？
3. 在并发推理中，稀疏访问带来的不规则内存行为会抵消多少理论计算节省？
</aside>


</div>
</details>

{% include qwen-note/references.html refs='<a href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a> Qwen 技术报告 §2.1；<a href="/notes/qwen3.8-flash-next/references/#ref-4">[4]</a> 官方配置；<a href="/notes/qwen3.8-flash-next/references/#ref-5">[5]</a> Transformer；<a href="/notes/qwen3.8-flash-next/references/#ref-10">[10]</a> Fast-weight view；<a href="/notes/qwen3.8-flash-next/references/#ref-11">[11]</a> Gated DeltaNet；<a href="/notes/qwen3.8-flash-next/references/#ref-12">[12]</a> RoPE；<a href="/notes/qwen3.8-flash-next/references/#ref-13">[13]</a> DeepSeek Sparse Attention。' %}

{% include qwen-note/footer.html %}
