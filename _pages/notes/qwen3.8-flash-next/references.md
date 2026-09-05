---
permalink: /notes/qwen3.8-flash-next/references/
title: "Qwen3.8-Flash-Next 笔记参考文献"
excerpt: "Qwen3.8-Flash-Next 架构笔记的参考文献与资料边界"
author_profile: false
wide: true
note_page: true
note_chapter: references
note_number: "REFERENCES"
note_heading: "参考文献与资料边界"
note_description: "统一列出专题使用的官方资料、原始论文与实现证据；正文编号在所有章节中保持不变。"
note_prev_url: /notes/qwen3.8-flash-next/optimizer/
note_prev_label: "Optimizer：Muon、AdamW 与参数分工"
---

{% include qwen-note/header.html %}

<section class="qwen-chapter__lead" markdown="1">

参考文献采用专题内固定编号。架构数值与消融结论优先引用 Qwen 官方报告、模型卡和配置；历史演变尽量回到原始论文。笔记中的“我的理解”只用于解释不同部件之间的关系，不替代原文结论。2026-09-05 补入模块发展主线的文献 [40]—[59]，并核对已有引用中的 Engram 命名与 batch-size warmup 比较方向。教学例子的数值不来自模型实验。

</section>

<div class="qwen-source-legend">
  <span class="is-official"><i class="fas fa-check-circle" aria-hidden="true"></i>官方资料</span>
  <span class="is-paper"><i class="fas fa-file-alt" aria-hidden="true"></i>原始论文</span>
  <span class="is-implementation"><i class="fas fa-code" aria-hidden="true"></i>实现 / 配置</span>
</div>

<section class="qwen-bibliography" markdown="1">

## Qwen3.8 官方资料

1. <span id="ref-1"></span>**Qwen Team.** “Qwen3.8-Flash-Next.” Official Blog, 2026. [原文](https://qwen.ai/blog?id=qwen3.8-flash-next) <span class="qwen-source-tag is-official">官方资料</span>
2. <span id="ref-2"></span>**Qwen Team.** *On the Design of Qwen3.8-Next Architecture: Evaluation, Efficiency, and Training Stability*. 2026. [arXiv v1 全文](https://arxiv.org/html/2608.30320v1) · [项目 PDF](https://github.com/QwenLM/Qwen3.8-Flash-Next/blob/main/tech_report.pdf) <span class="qwen-source-tag is-official">官方资料</span>
3. <span id="ref-3"></span>**Qwen Team.** “Qwen3.8-Flash-Next Model Card.” Hugging Face, 2026. [模型卡](https://huggingface.co/Qwen/Qwen3.8-Flash-Next/blob/main/README.md) <span class="qwen-source-tag is-official">官方资料</span>
4. <span id="ref-4"></span>**Qwen Team.** “Qwen3.8-Flash-Next `config.json`.” Hugging Face, 2026. [配置](https://huggingface.co/Qwen/Qwen3.8-Flash-Next/blob/main/config.json) <span class="qwen-source-tag is-implementation">实现 / 配置</span>

## Transformer 基线、归一化与前馈网络

5. <span id="ref-5"></span>**Vaswani et al.** “Attention Is All You Need.” NeurIPS, 2017. [arXiv:1706.03762](https://arxiv.org/abs/1706.03762)
6. <span id="ref-6"></span>**He et al.** “Deep Residual Learning for Image Recognition.” CVPR, 2016. [arXiv:1512.03385](https://arxiv.org/abs/1512.03385)
7. <span id="ref-7"></span>**Xiong et al.** “On Layer Normalization in the Transformer Architecture.” ICML, 2020. [arXiv:2002.04745](https://arxiv.org/abs/2002.04745)
8. <span id="ref-8"></span>**Zhang and Sennrich.** “Root Mean Square Layer Normalization.” NeurIPS, 2019. [arXiv:1910.07467](https://arxiv.org/abs/1910.07467)
9. <span id="ref-9"></span>**Shazeer.** “GLU Variants Improve Transformer.” 2020. [arXiv:2002.05202](https://arxiv.org/abs/2002.05202)

## Attention 与序列混合

10. <span id="ref-10"></span>**Schlag, Irie, and Schmidhuber.** “Linear Transformers Are Secretly Fast Weight Programmers.” ICML, 2021. [arXiv:2102.11174](https://arxiv.org/abs/2102.11174)
11. <span id="ref-11"></span>**Yang, Kautz, and Hatamizadeh.** “Gated Delta Networks: Improving Mamba2 with Delta Rule.” ICLR, 2025. [arXiv:2412.06464](https://arxiv.org/abs/2412.06464)
12. <span id="ref-12"></span>**Su et al.** “RoFormer: Enhanced Transformer with Rotary Position Embedding.” Neurocomputing, 2024. [arXiv:2104.09864](https://arxiv.org/abs/2104.09864)
13. <span id="ref-13"></span>**DeepSeek-AI et al.** “DeepSeek-V3.2: Pushing the Frontier of Open Large Language Models.” 2025. [arXiv:2512.02556](https://arxiv.org/abs/2512.02556)

## Embedding 与条件记忆

14. <span id="ref-14"></span>**Roy et al.** “N-Grammer: Augmenting Transformers with Latent N-grams.” 2022. [arXiv:2207.06366](https://arxiv.org/abs/2207.06366)
15. <span id="ref-15"></span>**Huang et al.** “Over-Tokenized Transformer: Vocabulary is Generally Worth Scaling.” ICML, 2025. [arXiv:2501.16975](https://arxiv.org/abs/2501.16975)
16. <span id="ref-16"></span>**Yu et al.** “Scaling Embedding Layers in Language Models.” NeurIPS, 2025. [arXiv:2502.01637](https://arxiv.org/abs/2502.01637)
17. <span id="ref-17"></span>**Cheng et al.** “Conditional Memory via Scalable Lookup: A New Axis of Sparsity for Large Language Models.” 2026. [arXiv:2601.07372](https://arxiv.org/abs/2601.07372)（论文中的模块名为 Engram。）

## MoE

18. <span id="ref-18"></span>**Shazeer et al.** “Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer.” ICLR, 2017. [arXiv:1701.06538](https://arxiv.org/abs/1701.06538)
19. <span id="ref-19"></span>**Fedus, Zoph, and Shazeer.** “Switch Transformers: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity.” JMLR, 2022. [arXiv:2101.03961](https://arxiv.org/abs/2101.03961)
20. <span id="ref-20"></span>**Dai et al.** “DeepSeekMoE: Towards Ultimate Expert Specialization in Mixture-of-Experts Language Models.” ACL, 2024. [arXiv:2401.06066](https://arxiv.org/abs/2401.06066)
21. <span id="ref-21"></span>**Qiu et al.** “Demons in the Detail: On Implementing Load Balancing Loss for Training Specialized Mixture-of-Expert Models.” 2025. [arXiv:2501.11873](https://arxiv.org/abs/2501.11873)

## Residual 路径

22. <span id="ref-22"></span>**Baykal et al.** “Alternating Updates for Efficient Transformers.” 2023. [arXiv:2301.13310](https://arxiv.org/abs/2301.13310)
23. <span id="ref-23"></span>**Zhu et al.** “Hyper-Connections.” 2024. [arXiv:2409.19606](https://arxiv.org/abs/2409.19606)
24. <span id="ref-24"></span>**Xie et al.** “mHC: Manifold-Constrained Hyper-Connections.” 2025. [arXiv:2512.24880](https://arxiv.org/abs/2512.24880)
25. <span id="ref-25"></span>**Qiu et al.** “A Unified View of Attention and Residual Sinks: Outlier-Driven Rescaling Is Essential for Transformer Training.” 2026. [arXiv:2601.22966](https://arxiv.org/abs/2601.22966)

## MTP 与投机解码

26. <span id="ref-26"></span>**Gloeckle et al.** “Better & Faster Large Language Models via Multi-Token Prediction.” ICML, 2024. [arXiv:2404.19737](https://arxiv.org/abs/2404.19737)
27. <span id="ref-27"></span>**Leviathan, Kalman, and Matias.** “Fast Inference from Transformers via Speculative Decoding.” ICML, 2023. [arXiv:2211.17192](https://arxiv.org/abs/2211.17192)
28. <span id="ref-28"></span>**DeepSeek-AI et al.** “DeepSeek-V3 Technical Report.” 2024. [arXiv:2412.19437](https://arxiv.org/abs/2412.19437)

## Optimizer 与分布式实现

29. <span id="ref-29"></span>**Kingma and Ba.** “Adam: A Method for Stochastic Optimization.” ICLR, 2015. [arXiv:1412.6980](https://arxiv.org/abs/1412.6980)
30. <span id="ref-30"></span>**Loshchilov and Hutter.** “Decoupled Weight Decay Regularization.” ICLR, 2019. [arXiv:1711.05101](https://arxiv.org/abs/1711.05101)
31. <span id="ref-31"></span>**Jordan et al.** “Muon: An Optimizer for Hidden Layers in Neural Networks.” 2024. [原文](https://kellerjordan.github.io/posts/muon/)
32. <span id="ref-32"></span>**Liu et al.** “Muon Is Scalable for LLM Training.” 2025. [arXiv:2502.16982](https://arxiv.org/abs/2502.16982)
33. <span id="ref-33"></span>**Amsel et al.** “The Polar Express: Optimal Matrix Sign Methods and Their Application to the Muon Algorithm.” 2025. [arXiv:2505.16932](https://arxiv.org/abs/2505.16932)
34. <span id="ref-34"></span>**Wang et al.** “Canzona: A Unified, Asynchronous, and Load-Balanced Framework for Distributed Matrix-Based Optimizers.” 2026. [arXiv:2602.06079](https://arxiv.org/abs/2602.06079)

## Qwen 前代资料

35. <span id="ref-35"></span>**Qwen Team.** “Qwen3-Next: Towards Ultimate Training & Inference Efficiency.” Official Blog, 2025. [原文](https://qwen.ai/blog?id=qwen3-next) <span class="qwen-source-tag is-official">官方资料</span>

## 架构参照模型

36. <span id="ref-36"></span>**Touvron et al.** “LLaMA: Open and Efficient Foundation Language Models.” 2023. [arXiv:2302.13971](https://arxiv.org/abs/2302.13971)
37. <span id="ref-37"></span>**Chowdhery et al.** “PaLM: Scaling Language Modeling with Pathways.” 2022. [arXiv:2204.02311](https://arxiv.org/abs/2204.02311)
38. <span id="ref-38"></span>**Gemma Team.** “Gemma 2: Improving Open Language Models at a Practical Size.” 2024. [arXiv:2408.00118](https://arxiv.org/abs/2408.00118)

## 实现补充

39. <span id="ref-39"></span>**Hugging Face Transformers.** “Qwen4-Exp Model Implementation.” 2026. [源码](https://github.com/huggingface/transformers/blob/main/src/transformers/models/qwen4_exp/modeling_qwen4_exp.py) <span class="qwen-source-tag is-implementation">实现 / 配置</span>

## 发展主线补充：表示、注意力与位置

40. <span id="ref-40"></span>**Mikolov et al.** “Efficient Estimation of Word Representations in Vector Space.” 2013. [arXiv:1301.3781](https://arxiv.org/abs/1301.3781)
41. <span id="ref-41"></span>**Sennrich, Haddow, and Birch.** “Neural Machine Translation of Rare Words with Subword Units.” 2015 预印本 / ACL 2016. [arXiv:1508.07909](https://arxiv.org/abs/1508.07909)
42. <span id="ref-42"></span>**Devlin et al.** “BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding.” 2018 预印本 / NAACL 2019. [arXiv:1810.04805](https://arxiv.org/abs/1810.04805)
43. <span id="ref-43"></span>**Shazeer.** “Fast Transformer Decoding: One Write-Head is All You Need.” 2019. [arXiv:1911.02150](https://arxiv.org/abs/1911.02150)
44. <span id="ref-44"></span>**Ainslie et al.** “GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints.” 2023. [arXiv:2305.13245](https://arxiv.org/abs/2305.13245)
45. <span id="ref-45"></span>**Dao et al.** “FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness.” 2022. [arXiv:2205.14135](https://arxiv.org/abs/2205.14135)
46. <span id="ref-46"></span>**Katharopoulos et al.** “Transformers are RNNs: Fast Autoregressive Transformers with Linear Attention.” 2020. [arXiv:2006.16236](https://arxiv.org/abs/2006.16236)
47. <span id="ref-47"></span>**Gu and Dao.** “Mamba: Linear-Time Sequence Modeling with Selective State Spaces.” 2023. [arXiv:2312.00752](https://arxiv.org/abs/2312.00752)
48. <span id="ref-48"></span>**Dao and Gu.** “Transformers are SSMs: Generalized Models and Efficient Algorithms Through Structured State Space Duality.” 2024. [arXiv:2405.21060](https://arxiv.org/abs/2405.21060)
49. <span id="ref-49"></span>**Press, Smith, and Lewis.** “Train Short, Test Long: Attention with Linear Biases Enables Input Length Extrapolation.” 2021. [arXiv:2108.12409](https://arxiv.org/abs/2108.12409)
50. <span id="ref-50"></span>**Peng et al.** “YaRN: Efficient Context Window Extension of Large Language Models.” 2023. [arXiv:2309.00071](https://arxiv.org/abs/2309.00071)

## 发展主线补充：稳定性、条件计算与优化

51. <span id="ref-51"></span>**Ba, Kiros, and Hinton.** “Layer Normalization.” 2016. [arXiv:1607.06450](https://arxiv.org/abs/1607.06450)
52. <span id="ref-52"></span>**Wang et al.** “DeepNet: Scaling Transformers to 1,000 Layers.” 2022. [arXiv:2203.00555](https://arxiv.org/abs/2203.00555)
53. <span id="ref-53"></span>**Lepikhin et al.** “GShard: Scaling Giant Models with Conditional Computation and Automatic Sharding.” 2020. [arXiv:2006.16668](https://arxiv.org/abs/2006.16668)
54. <span id="ref-54"></span>**Cai et al.** “Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads.” 2024. [arXiv:2401.10774](https://arxiv.org/abs/2401.10774)
55. <span id="ref-55"></span>**Li et al.** “EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty.” 2024. [arXiv:2401.15077](https://arxiv.org/abs/2401.15077)
56. <span id="ref-56"></span>**DeepSeek-AI.** “DeepSeek-V2: A Strong, Economical, and Efficient Mixture-of-Experts Language Model.” 2024. [arXiv:2405.04434](https://arxiv.org/abs/2405.04434)
57. <span id="ref-57"></span>**Yuan et al.** “Native Sparse Attention: Hardware-Aligned and Natively Trainable Sparse Attention.” 2025. [arXiv:2502.11089](https://arxiv.org/abs/2502.11089)
58. <span id="ref-58"></span>**Shazeer and Stern.** “Adafactor: Adaptive Learning Rates with Sublinear Memory Cost.” 2018. [arXiv:1804.04235](https://arxiv.org/abs/1804.04235)
59. <span id="ref-59"></span>**Gupta, Koren, and Singer.** “Shampoo: Preconditioned Stochastic Tensor Optimization.” 2018. [arXiv:1802.09568](https://arxiv.org/abs/1802.09568)

</section>

<aside class="qwen-callout qwen-callout--boundary" markdown="1">
<strong>如何使用这些来源</strong>

- **结构和数值**：以 [2] 技术报告、[3] 模型卡与 [4] 配置为准。
- **方法演变**：引用原始论文只说明概念来源，不把后续 Qwen 的实现细节反推给原论文。
- **效果判断**：除非报告给出控制变量消融，否则不把整套 recipe 的收益归因于单个组件。
- **推理性能**：吞吐依赖硬件、batch、上下文长度和 runtime；笔记不把报告中的特定设置外推成通用速度结论。
</aside>

{% include qwen-note/footer.html %}
