---
permalink: /notes/qwen3.8-flash-next/embedding/
title: "Embedding：从 Token Lookup 到条件记忆"
excerpt: "从普通 token embedding 出发，理解 N-Grammer、Over-Encoding、SCONE、Engram 与 Qwen3.8 的 N-gram memory"
author_profile: false
wide: true
note_page: true
note_chapter: embedding
note_number: "01 / EMBEDDING"
note_heading: "从 Token Lookup 到条件记忆"
note_description: "从一次普通查表开始，逐步理解局部上下文如何成为地址，以及 Qwen3.8 怎样把 51B 参数放进可预取的 N-gram memory。"
note_prev_url: /notes/qwen3.8-flash-next/
note_prev_label: "总览：从 Transformer 到 Qwen3.8"
note_next_url: /notes/qwen3.8-flash-next/attention/
note_next_label: "Attention：压缩记忆与稀疏召回"
---

{% include qwen-note/header.html %}

<section class="qwen-chapter__lead" markdown="1">

我最初把 N-gram embedding 理解成“给普通 embedding 多加几张表”，但这个说法没有解释最关键的变化：**普通 embedding 用当前 token ID 寻址，N-gram memory 用以当前位置结尾的短 token 序列寻址。** 它不检索外部文档，也不把多个 token 合并成新的输出类别；取回的仍是随模型一起训练的参数，只是查表地址包含了局部上下文。

这一页从普通 token lookup 开始，依次拆解 N-Grammer、Over-Encoding、SCONE、Engram，再对照 Qwen3.8 的报告、配置和公开实现。重点不是记住方法名，而是回答三个问题：**地址怎样构造、冲突怎样处理、取回的向量怎样写回模型。**

</section>

<nav class="qwen-learning-nav" aria-label="本章阅读层次"><a href="#history">发展主线</a><a href="#mechanism">原理与 Qwen 实现</a><a href="#self-check">自测与答案</a></nav>

<section class="qwen-chapter qwen-history" id="history" markdown="1">

## 发展主线：先解决表示，再把局部知识交给查表

### 2013—2018：一个词的向量，和一句话里的表示

Word2Vec（2013）让词获得可学习的稠密向量，向量之间可以反映训练语料里的共现关系。但静态词表通常给一个词一个向量，“苹果”出现在水果或公司语境时，查出的起点相同。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-40">[40]</a> 神经语言模型并不是到 Word2Vec 才有 embedding；这里选它作为熟悉的历史坐标。

另一个问题是词表覆盖。为每个完整词建一行，会遇到罕见词、拼写变体和新词。BPE 在神经机器翻译中的应用（2015/2016）把罕见词拆成可复用的子词单元。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-41">[41]</a> **Tokenizer 决定切成什么 ID，embedding 决定每个 ID 对应什么向量**；二者不是同一个模块。

Transformer 与 BERT（2017—2018）进一步把上下文写进每一层隐藏状态。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-5">[5]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-42">[42]</a> 因而现代 LLM 的输入 lookup 仍可与上下文无关，经过主干的表示却是上下文化的。BERT 的双向上下文只用于说明这个区别；生成式 decoder 必须遵守因果 mask，不能读取未来答案。

### 2022—2026：上下文已经能算出来，为什么又需要 N-gram？

假设分词结果是 `[New, York, City]`，当前位置是 `York`。普通 lookup 只读 `York` 那一行；bigram lookup 可以读 `(New, York)`。这不会把后面的 `City` 偷看进来，也不会把 `New York` 自动合并成一个输出 token。它让常见的局部组合有了直接可访问的参数容量，减少“每次都靠多层网络重新组合”的需求。这是理解条件记忆的教学例子，不是对某个模型 tokenizer 的实测。

| 时间 | 代表方法 | 相比普通 lookup，多解决了什么 | 仍然要付出的代价 |
| --- | --- | --- | --- |
| 2022 | N-Grammer <a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-14">[14]</a> | 用潜在 bigram 增强表示 | 量化与哈希引入共享和碰撞 |
| 2025 | Over-Encoding <a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-15">[15]</a> | 扩展输入多元组容量，同时保留输出词表 | 表容量、访问带宽与长尾训练 |
| 2025 | SCONE <a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-16">[16]</a> | 用小模型学习高频 N-gram 表示，推理前预计算并卸载 | 预计算、存储与匹配策略 |
| 2026 | Engram <a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-17">[17]</a> | 把条件记忆作为 MoE 条件计算之外的扩容维度 | 记忆与计算如何分配仍要实验 |
| 2026 | Qwen3.8-Flash-Next <a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a> | 在混合主干中整合可从主存预取的 N-gram memory | 读表必须与主干调度配合 |

这几种方法是围绕同一瓶颈的不同设计，不是一代严格取代一代。下面逐一拆开地址与融合方式时，可以反复问：**它改变的是分词、表的地址、表项的生成方式，还是取回后的过滤方式？**

### 三种“记忆”要分清

N-gram 表保存的是训练得到、按短 token 序列寻址的参数；KV cache 保存本次输入的历史表示；外部检索读取的是文档等数据。三者分别回答“这个局部组合学过什么”“这次对话前面说过什么”“外部资料写了什么”。增加 N-gram 表不能自动记住这次对话里新出现的任意事实，也不能替代检索系统的资料更新。

</section>

<section class="qwen-chapter" id="mechanism" markdown="1">

## 1. 普通 embedding 到底做了什么

设 tokenizer 的词表大小为 $V$，隐藏维度为 $d$，输入 token ID 为 $x_t\in\{0,\ldots,V-1\}$。标准输入 embedding 就是从矩阵中取出第 $x_t$ 行：

<div class="qwen-equation qwen-equation--math" markdown="1">

$$
\mathbf e_t = \mathbf E_{\mathrm{in}}[x_t],
\qquad
\mathbf E_{\mathrm{in}}\in\mathbb R^{V\times d}.
$$

<span>一次 lookup 只激活一行。表中共有 $Vd$ 个参数，但当前位置真正读出的只有 $d$ 个数。</span>
</div>

经过若干 Transformer block 后，LM Head 再把隐藏状态映射回对整个基础词表的 logits：

<div class="qwen-equation qwen-equation--math" markdown="1">

$$
\boldsymbol\ell_t=\mathbf W_{\mathrm{out}}\mathbf h_t,
\qquad
p(x_{t+1}=v\mid x_{\le t})
=\frac{\exp(\ell_{t,v})}{\sum_{u=1}^{V}\exp(\ell_{t,u})}.
$$

<span>输入端是稀疏查一行；输出端通常要计算 $V$ 个类别的分数。两端可以共享权重，也可以分开。</span>
</div>

这解释了为什么“扩大 tokenizer 词表”和“增加一张输入侧 N-gram 表”并不等价：

<div class="qwen-embedding-contrast">
  <div><span>基础词表变大</span><strong>同时改变分词与预测空间</strong><p>常见片段可能变成更少的 token，但输入矩阵和输出分类器都会随 $V$ 增大；长尾 token 得到的训练更新也更稀疏。</p></div>
  <div><span>额外 N-gram memory</span><strong>只扩展输入侧寻址容量</strong><p>基础 token 序列和输出词表保持不变，模型只在输入或中间层额外读取少量局部上下文向量。</p></div>
</div>

Qwen3.8 的基础词表为 248,320，隐藏维度为 2,560，输入 embedding 与输出 head 不共享。仅一张 $248{,}320\times2{,}560$ 的矩阵就约有 636M 参数；而它的 N-gram memory 另外包含约 51B 参数，但每个位置只读取其中极少数行。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-4">[4]</a>

</section>

<section class="qwen-chapter" markdown="1">

## 2. 为什么要把短上下文也变成地址

普通 lookup 中，只要当前位置都是 token $x_t$，初始向量 $\mathbf E_{\mathrm{in}}[x_t]$ 就完全相同。上下文差异要等 attention、FFN 等后续计算再写入表示。N-gram lookup 则直接构造以 $t$ 结尾的局部键：

<div class="qwen-equation qwen-equation--math" markdown="1">

$$
g_{t,n}=(x_{t-n+1},\ldots,x_{t-1},x_t),
\qquad n\ge 2.
$$

<span>例如当前位置可同时拥有 unigram $(x_t)$、bigram $(x_{t-1},x_t)$ 和 trigram $(x_{t-2},x_{t-1},x_t)$ 三种粒度的表示。</span>
</div>

<div class="qwen-ngram-example" aria-label="Unigram, bigram and trigram lookup example">
  <div class="qwen-ngram-example__tokens"><small>token history</small><span>$x_{t-2}$</span><span>$x_{t-1}$</span><span class="is-current">$x_t$</span></div>
  <div><small>unigram</small><strong>$(x_t)$</strong><i class="fas fa-long-arrow-alt-right" aria-hidden="true"></i><span>基础 token 表</span></div>
  <div><small>bigram</small><strong>$(x_{t-1},x_t)$</strong><i class="fas fa-long-arrow-alt-right" aria-hidden="true"></i><span>N-gram 表地址</span></div>
  <div><small>trigram</small><strong>$(x_{t-2},x_{t-1},x_t)$</strong><i class="fas fa-long-arrow-alt-right" aria-hidden="true"></i><span>N-gram 表地址</span></div>
</div>

直接为所有组合分配独立行不可行。若 $V\approx250{,}000$，完整 bigram 空间有 $V^2=6.25\times10^{10}$ 个地址，trigram 空间更达到 $V^3\approx1.56\times10^{16}$。因此不同方法真正的分歧集中在两处：

1. **查表之前怎样压缩地址空间**：先把 token 聚成潜在类别，只保留高频短语，还是直接对原始 ID 做哈希？
2. **查表之后怎样处理歧义**：接受碰撞、用多头哈希降低碰撞，还是让当前 hidden state 再判断这段记忆是否适用？

</section>

<section class="qwen-chapter" markdown="1">

## 3. 四种做法分别怎样工作

### 3.1 N-Grammer：先把 token 映射到潜在代码

N-Grammer 并不是直接哈希原始 token bigram。它先用 Product Quantization（PQ）把每个 head 的 unigram embedding 映射到一个离散代码，再组合相邻代码。论文只实验了 bigram。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-14">[14]</a>

<ol class="qwen-method-steps">
  <li><span>01</span><strong>量化 unigram</strong><p>每个 embedding head 都在自己的 codebook 中寻找最近中心，语义相近的 token 可以得到同一个潜在代码。</p></li>
  <li><span>02</span><strong>组成 latent bigram</strong><p>把当前位置与前一位置的潜在代码拼成一个整数地址。</p></li>
  <li><span>03</span><strong>按 head 哈希查表</strong><p>完整 $k^2$ 空间仍然很大，因此每个 head 使用独立哈希映射到更小的表。</p></li>
  <li><span>04</span><strong>归一化后拼接</strong><p>unigram 与 bigram 各自 LayerNorm，再沿特征维拼接，交给后续 Transformer。</p></li>
</ol>

第一步把第 $i$ 个位置、第 $j$ 个 head 的向量 $\mathbf x_{i,j}$ 映射为最近的 codeword：

<div class="qwen-equation qwen-equation--math" markdown="1">

$$
z_{i,j}=\underset{q\in\{0,\ldots,k-1\}}{\arg\min}
\left\lVert \mathbf x_{i,j}-\mathbf c_{q,j}\right\rVert_2.
$$

<span>这里的 $k$ 是每个 head 的 codebook 大小。地址不再直接依赖原始 token ID，而依赖 embedding 落入哪个潜在簇。</span>
</div>

随后把两个潜在代码组成 bigram ID，并用每个 head 独立的 universal hash 查表：

<div class="qwen-equation qwen-equation--math" markdown="1">

$$
b_{i,j}=z_{i,j}+kz_{i-1,j},
\qquad
\mathbf y_{i,j}
=\mathbf B\!\left[
\big((r_jb_{i,j}+s_j)\bmod p_j\big)\bmod v,\ j
\right].
$$

<span>潜在空间共享减少了地址数量；不同 head 的哈希参数又降低了所有 head 同时发生相同碰撞的概率。</span>
</div>

最后得到：

<div class="qwen-equation qwen-equation--math" markdown="1">

$$
\mathbf w_i=\left[\operatorname{LN}(\mathbf x_i),\operatorname{LN}(\mathbf y_i)\right].
$$

<span>N-Grammer 的核心不是“更大的 tokenizer”，而是“先把表示离散化，再给 latent bigram 单独分配可学习容量”。</span>
</div>

### 3.2 Over-Encoding：直接哈希原始 token n-gram

Over-Encoding（OE）保留原 tokenizer，不做 PQ，而是直接把原始 token ID 组合成 n-gram 整数。若基数 $p\ge V$，可写为：<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-15">[15]</a>

<div class="qwen-equation qwen-equation--math" markdown="1">

$$
x_i^{(-n)}=\sum_{r=1}^{n}x_{i-r+1}p^{r-1},
\qquad
\mathbf h_i^{(n)}=\mathbf E_n\!\left[x_i^{(-n)}\bmod m_n\right].
$$

<span>第一式在无限地址空间中唯一编码 n-gram；第二式用取模把它压回只有 $m_n$ 行的实际表，因此碰撞是有意接受的容量折中。</span>
</div>

OE 再把多个粒度的结果相加。论文还把一个宽 embedding 拆成 $k$ 个窄表，各自投影到模型维度：

<div class="qwen-equation qwen-equation--math" markdown="1">

$$
\mathcal E_n^{m\times d\mid k}(x_i^{(-n)})
=\sum_{j=1}^{k}
\mathbf E_{n,j}\!\left[x_i^{(-n)}\bmod m_{n,j}\right]\mathbf W_{n,j},
$$

$$
\operatorname{OE}(x_i)
=\mathbf E_{\mathrm{in}}[x_i]
+\sum_{n=2}^{N}\mathcal E_n^{m\times d\mid k}(x_i^{(-n)}).
$$

<span>不同切片使用略有差别的表大小，使同一个 n-gram 在多个表中形成不同碰撞模式。基础输出词表不需要随这些输入表一起扩大。</span>
</div>

与 N-Grammer 相比，OE 少了一步语义聚类，地址构造更直接；代价是相近短语不会因为“落到同一潜在代码”而自然共享，哈希碰撞也不带语义保证。

### 3.3 SCONE：训练时生成，推理时编译成表

SCONE 不给所有 n-gram 做哈希，而是先从语料中选出频繁出现的 f-grams。对每个位置，它寻找**以当前位置结尾、长度最长且在集合中的 f-gram**。没有命中时使用普通 token embedding；命中时，训练和推理采用不同路径。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-16">[16]</a>

<div class="qwen-equation qwen-equation--math" markdown="1">

$$
\mathbf e_i=
\begin{cases}
\mathbf T(x_i), & \text{没有匹配的 f-gram},\\[3pt]
A_{\mathrm{f}}\!\left(\mathbf T(x_j),\ldots,\mathbf T(x_i)\right),
& \text{训练时},\\[3pt]
F(x_j,\ldots,x_i), & \text{推理时}.
\end{cases}
$$

<span>$(x_j,\ldots,x_i)$ 是命中的最长 f-gram。训练时由一个小 Transformer $A_{\mathrm f}$ 产生最终位置的上下文化向量；训练完成后，把所有结果预计算进键值表 $F$。</span>
</div>

这相当于把“超大表中的每一行独立训练”改成“用一个共享的小网络生成许多行”。频繁短语之间可以通过生成器共享统计，推理时又无需运行这个生成器；预计算结果可以放在主存，甚至 NVMe。它与 OE 的区别不是有没有 n-gram，而是**怎样决定保留哪些地址，以及表项是独立参数还是由共享网络生成。**

### 3.4 Engram：让 hidden state 决定记忆是否适用

Engram 先对 token 做 NFKC、大小写等规范化映射，再对每个 n-gram order 使用多个独立哈希 head。它没有假设哈希取回的向量一定正确，而是让已有 hidden state 作为 query，对检索结果做一次门控。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-17">[17]</a>

<div class="qwen-equation qwen-equation--math" markdown="1">

$$
g_{t,n}=(x'_{t-n+1},\ldots,x'_t),
\quad
z_{t,n,k}=\phi_{n,k}(g_{t,n}),
\quad
\mathbf e_t=\mathop{\Vert}_{n=2}^{N}\mathop{\Vert}_{k=1}^{K}
\mathbf E_{n,k}[z_{t,n,k}].
$$

$$
\mathbf k_t=\mathbf W_K\mathbf e_t,
\quad
\mathbf v_t=\mathbf W_V\mathbf e_t,
\quad
\alpha_t=\sigma\!\left(
\frac{\operatorname{RMSNorm}(\mathbf h_t)^\top
\operatorname{RMSNorm}(\mathbf k_t)}{\sqrt d}
\right).
$$

$$
\mathbf u_t=\alpha_t\mathbf v_t,
\qquad
\mathbf y_t=\mathbf u_t+
\operatorname{SiLU}\!\left(
\operatorname{DWConv}(\operatorname{RMSNorm}(\mathbf u_t))
\right).
$$

<span>多头哈希降低单一碰撞的影响；context-aware gate 进一步过滤一词多义或碰撞带来的不合适记忆；短 depthwise convolution 再混合邻近位置。</span>
</div>

<div class="qwen-method-table" role="region" aria-label="Comparison of n-gram embedding methods" tabindex="0" markdown="1">

| 方法 | 查表地址来自哪里 | 怎样控制地址空间 | 取回后怎样融合 |
| --- | --- | --- | --- |
| N-Grammer | PQ 得到的 latent bigram | 潜在聚类 + 每 head 哈希 | unigram / bigram 各自 LN 后拼接 |
| Over-Encoding | 原始 token 2...N-gram | 取模哈希 + 多个低维切片 | 各粒度投影后相加 |
| SCONE | 高频 n-gram 集合 | 只保留频繁项 | 最长匹配项替代当前位置输入 embedding |
| Engram | 规范化 token 的 2...N-gram | 多 head 哈希 | hidden-state gate + 短卷积 + residual |

</div>

</section>

<section class="qwen-chapter" markdown="1">

## 4. Qwen3.8 的实际数据流

Qwen 技术报告对这一模块的描述比较概括：短 n-gram 作为表地址，取回的向量增强 token representation，并利用确定性地址做 Host Memory 预取。更具体的数据流可以从模型配置和 Transformers 中对应的 `Qwen4ExpTextNGramEmbedding` / `Qwen4ExpTextPLELayer` 实现还原。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-4">[4]</a><a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-39">[39]</a>

<dl class="qwen-facts qwen-facts--four">
  <div><dt>N-gram order</dt><dd>2 + 3</dd><span><code>ngram_size = 3</code></span></div>
  <div><dt>Hash heads</dt><dd>8 / order</dd><span>共 16 个 lookup head</span></div>
  <div><dt>Memory width</dt><dd>2,560</dd><span>每个 head 取回 160 维</span></div>
  <div><dt>Placement</dt><dd>Layer 2</dd><span>在 attention 之前写入</span></div>
</dl>

### 4.1 地址：multiplicative-XOR hash

公开实现先把当前位置及其历史 token ID 分别乘以由 seed 生成的奇数乘子，再按位异或。对 n-gram order $n$，可以写成：

<div class="qwen-equation qwen-equation--math" markdown="1">

$$
m_t^{(n)}=
(a_0x_t)\oplus(a_1x_{t-1})\oplus\cdots\oplus(a_{n-1}x_{t-n+1}),
$$

$$
z_{t,n,k}=m_t^{(n)}\bmod M_{n,k},
\qquad n\in\{2,3\},\quad k\in\{1,\ldots,8\}.
$$

<span>$M_{n,k}$ 是每个 head 独立、略大于 20M 的素数表长；不同 head 因此得到不同的碰撞模式。序列开头用 EOS 补齐，位移也不会跨过 EOS 边界。</span>
</div>

16 个 head 的检索结果直接拼接：

<div class="qwen-equation qwen-equation--math" markdown="1">

$$
\mathbf e_t=
\mathop{\Vert}_{n=2}^{3}\mathop{\Vert}_{k=1}^{8}
\mathbf E_{n,k}[z_{t,n,k}]
\in\mathbb R^{2560}.
$$

<span>配置中的 20M 是每个 head 的基础表长，不是整个模块只有 20M 行。每行 160 维，因此参数量近似为 $16\times20\mathrm M\times160=51.2\mathrm B$，与报告中的 51B 对应。</span>
</div>

### 4.2 融合：四条 residual stream 分别决定读多少

Qwen3.8 有 4 条 Gated Residual / Hyper-Connection stream。N-gram memory 只产生一个共享 value，但为每条 stream 产生独立 key；每条 stream 的 hidden state 是自己的 query。

<div class="qwen-equation qwen-equation--math" markdown="1">

$$
\mathbf k_t^{(r)}=\operatorname{RMSNorm}(\mathbf W_K^{(r)}\mathbf e_t),
\quad
\mathbf v_t=\mathbf W_V\mathbf e_t,
\quad
\mathbf q_t^{(r)}=\operatorname{RMSNorm}(\mathbf h_t^{(r)}),
$$

$$
s_t^{(r)}=
\frac{\langle\mathbf q_t^{(r)},\mathbf k_t^{(r)}\rangle}{\sqrt d},
\qquad
\alpha_t^{(r)}=
\sigma\!\left(\operatorname{sign}(s_t^{(r)})\sqrt{|s_t^{(r)}|}\right),
$$

$$
\mathbf u_t^{(r)}=\alpha_t^{(r)}\mathbf v_t.
$$

<span>中间的 signed square root 来自公开实现；它在 sigmoid 前压缩大幅值分数。四个 gate 可以对同一条检索记忆给出不同读取强度。</span>
</div>

门控结果展平后再经过 kernel size 4、dilation 3 的 causal depthwise convolution，并与卷积前的值相加：

<div class="qwen-equation qwen-equation--math" markdown="1">

$$
\mathbf y_t=\mathbf u_t+
\operatorname{SiLU}\!\left(
\operatorname{DWConv}_{k=4,\,\delta=3}
(\operatorname{RMSNorm}(\mathbf u))_t
\right),
\qquad
\mathbf h_t^{(2)}\leftarrow\mathbf h_t^{(2)}+\mathbf y_t.
$$

<span>写入发生在第 2 个 decoder block 的 attention 与 MoE 之前。卷积使用短局部窗口，和基于 token ID 的确定性检索承担不同作用。</span>
</div>

<div class="qwen-memory-flow" aria-label="Qwen3.8 n-gram memory data flow">
  <div><small>01 · address</small><strong>2 / 3-gram IDs</strong><span>乘法 + XOR + 素数取模</span></div>
  <i class="fas fa-long-arrow-alt-right" aria-hidden="true"></i>
  <div><small>02 · lookup</small><strong>16 sparse rows</strong><span>拼接为 2,560 维 memory</span></div>
  <i class="fas fa-long-arrow-alt-right" aria-hidden="true"></i>
  <div><small>03 · filter</small><strong>4 stream gates</strong><span>hidden state 判断读取强度</span></div>
  <i class="fas fa-long-arrow-alt-right" aria-hidden="true"></i>
  <div><small>04 · refine</small><strong>Dilated DWConv</strong><span>短距离局部混合</span></div>
  <i class="fas fa-long-arrow-alt-right" aria-hidden="true"></i>
  <div><small>05 · inject</small><strong>Layer 2 residual</strong><span>再进入 attention 与 MoE</span></div>
</div>

<aside class="qwen-callout qwen-callout--precision" markdown="1">
<strong>报告与实现的证据边界</strong>

报告明确给出了单层 placement、Host Memory 预取、约 51B 参数和 vocabulary scaling 消融；哈希公式、每 head 的素数表长、signed-square-root gate、EOS 边界处理与卷积参数来自当前公开实现。它们共同解释已发布 checkpoint，但不应把实现细节倒推为报告中所有消融模型都采用了完全相同的代码路径。
</aside>

</section>

<section class="qwen-chapter" markdown="1">

## 5. 为什么放在第 2 层

N-gram 地址只依赖 token ID，因此不用等待第 1 层算出 hidden state 才知道该取哪些行。系统可以先在 CPU 侧算出第 2 层需要的地址，在 GPU 计算第 1 层时异步搬运对应向量：

<div class="qwen-prefetch-timeline">
  <div><small>CPU / Host Memory</small><strong>计算 n-gram 地址 → 读取稀疏行 → 传输</strong><span>地址是确定性的，可以提前开始</span></div>
  <div><small>GPU / Layer 1</small><strong>GDN / Attention → MoE</strong><span>用第 1 层计算覆盖一部分传输延迟</span></div>
  <div><small>GPU / Layer 2</small><strong>Gate + Conv → Residual → 主干计算</strong><span>取回的 memory 在这里第一次被使用</span></div>
</div>

报告在固定 N-gram 参数预算下比较了第 1、2、3、4、10、15、25 层以及两个多层组合。结果不是“越早越好”或“越深越好”：浅层表现较强，中深层仍有竞争力，多层分摊同一预算也没有稳定收益。最终选择第 2 层，兼顾了模型效果与第 1 层可提供的预取窗口。<a class="qwen-cite" href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a>

</section>

<section class="qwen-chapter" markdown="1">

## 6. 怎样读 vocabulary scaling 的结果

报告给了两组容易混淆的实验：

<div class="qwen-compare">
  <div><h3>固定总参数预算</h3><p>扩大 N-gram 表的同时减少 MoE experts。loss 在 $10V$（约占总参数 25%）时最低，但下游评测没有出现同样明确的最优点。这里比较的是“memory 与 experts 怎样分预算”。</p></div>
  <div><h3>额外增加 memory 参数</h3><p>保持 MoE 不变，把 N-gram vocabulary 从 $20V$ 扩到 $200V$。loss 单调下降，但下游平均效果会饱和或波动。这里比较的是“更多可寻址容量本身是否继续有效”。</p></div>
</div>

因此我目前不会把它概括成“51B 免费参数”。更准确的说法是：**每个 token 的 lookup 数量不随总表大小线性增长，但成本被转移到了存储容量、稀疏更新、跨设备带宽和预取调度。** 同时，训练 loss 对表规模的响应也不能直接当作下游能力的单调预测。

<div class="qwen-cost-shift">
  <div><small>计算侧</small><strong>少量确定性 lookup</strong><p>每个位置只访问 16 行，再执行投影、门控和短卷积；不会把 51B 参数全部激活。</p></div>
  <i class="fas fa-long-arrow-alt-right" aria-hidden="true"></i>
  <div><small>系统侧</small><strong>大表存储与数据搬运</strong><p>实际收益取决于访问分布、表的分片、Host-to-Device 带宽、cache 命中率和并发调度。</p></div>
</div>

</section>

<section class="qwen-chapter" id="self-check" markdown="1">

## 读完后，试着解释

同一个 token 出现在两句话里，输入 lookup 一定不同吗？增加 N-gram 表会扩大输出词表吗？

<details class="qwen-self-check" markdown="1">
<summary>展开参考答案</summary>

普通 token lookup 可以完全相同，主干随后才把上下文写入表示。额外 N-gram 表按局部序列寻址；若基础 tokenizer 与 LM Head 不变，输出词表不会因此扩大。

</details>

</section>

<aside class="qwen-callout qwen-callout--question" markdown="1">
<strong>读完后我还没有答案的问题</strong>

1. 51B 参数中有多少行在真实训练分布里得到过足够更新？有效容量与名义容量相差多大？
2. 多头哈希与 hidden-state gate 分别消除了多少碰撞噪声，二者是否存在可替代关系？
3. tokenizer、语言比例或领域变化后，确定性局部地址的失配是否会比主干参数更明显？
4. 在高 batch、高并发 serving 中，预取能覆盖多少延迟，热点 cache 与冷表访问应怎样分层？
</aside>

{% include qwen-note/references.html refs='<a href="/notes/qwen3.8-flash-next/references/#ref-2">[2]</a> Qwen 技术报告 §2.3；<a href="/notes/qwen3.8-flash-next/references/#ref-4">[4]</a> 官方配置；<a href="/notes/qwen3.8-flash-next/references/#ref-14">[14]</a> N-Grammer；<a href="/notes/qwen3.8-flash-next/references/#ref-15">[15]</a> Over-Tokenized Transformer；<a href="/notes/qwen3.8-flash-next/references/#ref-16">[16]</a> SCONE；<a href="/notes/qwen3.8-flash-next/references/#ref-17">[17]</a> Engram / Conditional Memory；<a href="/notes/qwen3.8-flash-next/references/#ref-39">[39]</a> Transformers 实现。' %}

{% include qwen-note/footer.html %}
