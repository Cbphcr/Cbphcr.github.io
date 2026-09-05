# 七个模块的发展主线：证据与正文映射

核对日期：2026-09-05。编号对应专题 references 页面。这里记录本次新增历史叙述和纠错的依据，不宣称重新审计了原稿每个实现字段。正文的小数字例子、复杂度算账和 Jacobian 解释是教学推导，不是论文实验结果。未将论文中的 benchmark 数字移植为 Qwen 的独立组件收益。

| Source ID | 原始来源 | 读取层级 / 可用事实 | 正文支持的论点 | 引用位置 | 边界 |
| --- | --- | --- | --- | --- | --- |
| 40 | https://arxiv.org/abs/1301.3781 | 摘要与元数据；词向量方法 | Word2Vec 是静态稠密词表示的历史坐标 | embedding / 2013—2018 | 不称其发明了 embedding |
| 41 | https://arxiv.org/abs/1508.07909 | 摘要与元数据；罕见词与子词 | 子词切分处理完整词词表的覆盖问题 | embedding / 2013—2018 | 年份区分预印本与会议 |
| 42 | https://arxiv.org/abs/1810.04805 | 摘要与元数据；双向预训练 Transformer | 输入 lookup 与上下文化隐藏表示是不同层次 | embedding / 2013—2018；ffn / 起点 | 不把 BERT 双向机制写成因果生成 |
| 14–17 | https://arxiv.org/abs/2207.06366 ; https://arxiv.org/abs/2501.16975 ; https://arxiv.org/abs/2502.01637 ; https://arxiv.org/html/2601.07372v2 | N-Grammer 元数据；OE / SCONE 摘要；Engram 摘要和正文寻址段 | 多元组输入、生成式表项、条件记忆是不同扩容设计 | embedding / 历史表；Engram 名称修正 | 不称各方法有必然继承关系；不移植收益 |
| 43 | https://arxiv.org/abs/1911.02150 | 摘要：跨 query heads 共享 KV | MQA 减少 KV 表示及其带宽 | attention / 路线一 | 不减少历史 token 数 |
| 44 | https://arxiv.org/abs/2305.13245 | 摘要：介于 MQA 与 MHA 的 KV 组数 | GQA 在 head 共享程度上折中 | attention / 路线一 | 四分之一是指定维度下的教学计算 |
| 45 | https://arxiv.org/abs/2205.14135 | 摘要：exact attention、tiling、IO | FlashAttention 改善搬运而保留 dense attention 运算 | attention / 路线一 | 不将计算复杂度说成线性 |
| 46 | https://arxiv.org/abs/2006.16236 | 摘要：核特征映射与结合律、递推实现 | 固定状态可消除逐步更新对前缀长度的依赖 | attention / 路线二 | 概念公式省略归一化 |
| 10–11 | https://arxiv.org/abs/2102.11174 ; https://arxiv.org/abs/2412.06464 ; https://arxiv.org/html/2608.30320v1 | 原始论文元数据；Qwen §2.1.1 递推全文 | delta 误差写入与全局衰减承担不同功能 | attention / 路线二与 GDN | 一维例子不代表无损高维记忆 |
| 47 | https://arxiv.org/abs/2312.00752 | 摘要：input-dependent selection | Mamba 让状态传播依赖输入内容 | attention / 路线二 | 不等同于 GDN |
| 48 | https://arxiv.org/abs/2405.21060 | 摘要：SSD、Mamba-2 | SSM 与部分 attention 形式存在结构联系 | attention / 路线二 | 不称所有 attention 都等价 |
| 49–50 | https://arxiv.org/abs/2108.12409 ; https://arxiv.org/abs/2309.00071 | 摘要与元数据；位置偏置与窗口扩展 | 位置表示与计算效率是不同轴 | attention / 位置编码 | 不视为 Qwen 全部采用 |
| 51 | https://arxiv.org/abs/1607.06450 | 摘要与元数据；LayerNorm 定义 | 单 token hidden 特征上的归一化不同于跨 batch 统计 | norm / 2016—2019 | 二维向量结果是教学推导 |
| 7–8 | https://arxiv.org/abs/2002.04745 ; https://arxiv.org/abs/1910.07467 | 摘要与元数据；分析范围与方法定义 | Pre/Post 位置与 LN/RMS 统计方式分属不同设计轴 | norm / 历史与机制 | 不把分析论文日期当作发明日期 |
| 52 | https://arxiv.org/abs/2203.00555 ; https://doi.org/10.1109/TPAMI.2024.3386927 | 论文检索摘要、原文公式片段 | DeepNorm 把残差缩放与初始化共同考虑 | norm / 深度；residual / 早期 | 主要证据来自其模型任务，非通用 decoder 保证 |
| 18–20 | https://arxiv.org/abs/1701.06538 ; https://arxiv.org/abs/2101.03961 ; https://arxiv.org/abs/2401.06066 | 三篇论文摘要及元数据 | 稀疏路由、top-1、细粒度共享专家解决不同扩容问题 | ffn / 2017—2024 | 不承诺专家编号的固定语义 |
| 53 | https://arxiv.org/abs/2006.16668 | 摘要与元数据：条件计算及自动分片 | GShard 将 MoE 扩展与多设备执行结合 | ffn / 2017—2021 | 不当作 Qwen 的具体通信实现 |
| 28 | https://arxiv.org/html/2412.19437v2 | §2.1.2 路由偏置与 sequence-wise loss；§2.2 顺序 MTP | V3 均衡不是完全无辅助约束，MTP 保留预测间依赖 | ffn / 2024；output / 2024 | 不推断 Qwen 使用同一 router |
| 27 | https://arxiv.org/abs/2211.17192 ; https://raw.githubusercontent.com/mlresearch/v235/main/assets/li24bt/li24bt.pdf | 原始论文元数据；EAGLE 原文标准投机协议摘录 | draft 与 target 分开，拒绝时需校正采样 | output / 2022—2023 | 贪心例子与随机采样协议分开 |
| 26 | https://arxiv.org/abs/2404.19737 | 摘要：共享主干与独立未来头 | 多未来训练目标不等于顺序 MTP 的计算图 | output / 2024 | 不将训练收益当必然推理加速 |
| 54 | https://arxiv.org/abs/2401.10774 | 摘要：多个解码头、树形验证、训练方案 | Medusa 将提案器接在已有模型上 | output / 2024 | 不把所有接受方案称为严格同分布 |
| 55 | https://arxiv.org/abs/2401.15077 | 摘要：特征预测与 token 序列 | EAGLE 在特征层构造更便宜的提案 | output / 2024 | 不等同于原生 MTP |
| 56 | https://arxiv.org/abs/2405.04434 | 原始摘要检索结果：MLA、压缩 KV | MLA 是缓存表示的另一路线 | attention / 路线一 | 不写成 Qwen 采用 MLA |
| 57 | https://arxiv.org/abs/2502.11089 | 摘要：层次压缩、选择与硬件协同 | 稀疏设计需同时考虑召回与执行 | attention / 路线三 | 不转移原文速度数字 |
| 22–24 | https://arxiv.org/abs/2301.13310 ; https://arxiv.org/abs/2409.19606 ; https://arxiv.org/abs/2512.24880 | 摘要：预测校正、可学习连接、约束稳定性 | 残差演进将表示宽度和计算宽度分开，并控制连接组合 | residual / 2023—2026 | 两分支为示意；不称 GR 全面优于 mHC |
| 29–32 | https://arxiv.org/abs/1412.6980 ; https://arxiv.org/abs/1711.05101 ; https://kellerjordan.github.io/posts/muon/ ; https://arxiv.org/abs/2502.16982 | 原始论文元数据、Muon 作者原文、Qwen 优化全文 | 自适应标量更新、解耦衰减与矩阵更新是不同机制 | optimizer / 历史与机制 | 理想 polar 例子不是实际有限步迭代结果 |
| 58 | https://arxiv.org/abs/1804.04235 | 摘要：行列平方梯度统计 | Adafactor 降低矩阵二阶矩状态存储 | optimizer / 状态内存 | 非 Qwen 配置 |
| 59 | https://arxiv.org/abs/1802.09568 | 摘要：各张量维的预条件矩阵 | Shampoo 代表结构化预条件路线 | optimizer / 矩阵几何 | 不称其与 Muon 相同 |
| 2 | https://arxiv.org/html/2608.30320v1 | §2.1、§3.2：索引器复杂度、架构组合、batch warmup | QSA 索引仍有二次项；warmup 增加步骤却无最终收益 | attention / 复杂度；optimizer / 修正 | warmup 对比限于报告设置；实现参数保留原稿出处 |

编辑说明：Engram 的会议标注在本次读取的 arXiv 元数据中未得到确认，因此统一保留 2026 年预印本标注。原有 main 分支配置 / 源码链接会漂移，本文保留其来源类型，不将其包装成不可变版本证据。
