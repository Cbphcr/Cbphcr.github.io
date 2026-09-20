---
permalink: /research/
title: "Research Questions"
excerpt: "Toward recursive self-improvement: learning and credible evaluation under delayed real-world rewards and temporal leakage"
author_profile: true
---

<div class="research-vision">
  <span class="anchor" id="research-questions"></span>

  <h1><span class="lang-en">Research Questions</span><span class="lang-zh">研究问题</span></h1>

  <header class="research-vision__intro">
    <p class="research-vision__kicker"><i class="fas fa-compass" aria-hidden="true"></i><span class="lang-en">Notes toward a research agenda</span><span class="lang-zh">一份仍在形成的研究笔记</span></p>
    <p class="research-vision__lead lang-en">How can agents learn from experience to improve both their capabilities and <strong>their ability to learn and improve</strong>, moving toward <strong>recursive self-improvement (RSI)</strong>?</p>
    <p class="research-vision__lead lang-zh">如何让智能体从经验中持续提升能力，并进一步提升<strong>自身学习与改进的能力</strong>，逐步实现<strong>递归式自我改进（RSI）</strong>？</p>
  </header>

  <span class="anchor" id="recursive-self-improvement"></span>

  <h2><span class="lang-en">The Goal: Improving the Ability to Improve</span><span class="lang-zh">目标：让改进能力本身也能改进</span></h2>

  <p class="lang-en">My long-term research goal is RSI. I am interested in the full learning loop: how an agent produces useful experience, obtains reliable feedback, and uses it to update model weights, memory, tools, and harnesses. The recursive part is a question to investigate: can an improved agent also improve how it generates experience, evaluates changes, and learns, making subsequent rounds of self-improvement more effective?</p>
  <p class="lang-zh">我的长期研究目标是实现 RSI。我关注完整的学习闭环：智能体如何产生有价值的经验、获得可靠反馈，并据此更新模型参数、记忆、工具与 harness。其中需要研究的“递归”在于：改进后的智能体，能否进一步改善产生经验、评价改动与学习的方式，使后续轮次的自我改进更有效？</p>

  <span class="anchor" id="delayed-rewards"></span>

  <h2><span class="lang-en">A Key Question: Learning When Real Rewards Arrive Too Late</span><span class="lang-zh">一个关键问题：真实奖励来不及用于更新时，如何学习？</span></h2>

  <p class="lang-en">By <strong>extremely delayed rewards</strong>, I mean delays in real-world time. The outcome we care about may require months or years to become observable, while the model is already going through many training and update cycles. For recent examples whose labels depend on those future outcomes, ground truth is unavailable at training time. More computation alone cannot make the future outcome observable now.</p>
  <p class="lang-zh">这里的<strong>超级延迟奖励</strong>，指的是真实世界时间上的延迟。真正关心的结果可能需要数月或数年才能观察到，而模型在此期间已经经历了很多轮训练和更新。对于标签依赖这些未来结果的最新样本，训练当下无法获得 ground truth；仅仅增加计算，也无法让尚未发生的未来结果现在就变得可观测。</p>

  <p class="lang-en">Suppose a label can only be determined after a fixed delay <code>Δ</code>. At training time <code>t</code>, only examples from <code>t − Δ</code> or earlier have mature labels. This creates a tension: <strong>labeled data describe the past, while the freshest data remain unlabeled</strong>. When the delay greatly exceeds the update cycle, true rewards from recent actions cannot close a timely training loop. Mature historical labels may still help with learning and calibration, subject to changes in the environment and policy.</p>
  <p class="lang-zh">假设一个标签必须等待固定时长 <code>Δ</code> 才能确定，那么在训练时刻 <code>t</code>，只有 <code>t − Δ</code> 及更早的样本具备成熟标签。这带来一个矛盾：<strong>有标签的数据描述过去，最贴近当前环境的数据却没有标签</strong>。当延迟远大于更新周期时，最新行为的真实奖励无法及时返回，当前更新必须面对这部分监督的缺失。历史上已经成熟的标签仍可能用于学习与校准，但必须考虑环境和策略已经发生的变化。</p>

  <span class="anchor" id="temporal-leakage"></span>

  <h3><span class="lang-en">Mature Labels Still Need a Defensible Information Boundary</span><span class="lang-zh">历史标签成熟，不代表回测没有泄漏</span></h3>

  <p class="lang-en">For an LLM, a chronological split of downstream data does not establish what the model knew. A present-day model judging an old research idea may already have read papers reporting its eventual success. Future information can enter through pretraining, post-training, retrieval, or retrospective descriptions of the task. Hiding the label or rewriting the question cannot by itself establish a clean historical test.</p>
  <p class="lang-zh">对 LLM 而言，仅按时间划分下游数据，无法确定模型当时“知道什么”。让今天的模型评价几年前的研究想法，它可能已经读过报告该方向后来成功的论文。未来信息可以通过预训练、后训练、检索或事后整理的任务描述进入系统。只隐藏标签或改写题面，并不足以保证历史测试没有泄漏。</p>

  <p class="lang-en">Using historical labels for supervised training is legitimate. The concern is whether the model learns shortcuts based on known outcomes and whether evaluation rewards the same shortcuts. Selecting only ideas known to have succeeded creates a separate selection bias. This leaves two difficulties: recent examples lack mature labels, while historical examples require evidence that the apparent foresight did not come from future knowledge.</p>
  <p class="lang-zh">用历史标签做监督训练本身是合理的。需要警惕的是，模型是否学到了识别已知结局的捷径，以及评测是否仍在奖励同一条捷径。只选择后来成功的想法，还会引入另一类选择偏差。于是困难有两面：最新样本缺少成熟标签，历史样本又需要证明表面的“远见”没有来自未来知识。</p>

  <p class="lang-en"><strong>Within the goal of RSI, how can agents keep improving when true rewards are unavailable in time and historical supervision risks leaking future information, while providing credible evidence of that improvement?</strong> Learning effectively and establishing that learning occurred are related but distinct problems. Process reliability, predictions of future reward, and observed final outcomes need separate evaluation; a better proxy score alone does not establish a better eventual outcome.</p>
  <p class="lang-zh"><strong>面向 RSI，在真实奖励无法及时获得、历史监督又容易受到未来信息污染的条件下，智能体如何持续自我改进，并提供可信的改进证据？</strong>“怎样学习”与“怎样知道它真的学会了”是相互关联、又需要分别解决的问题。执行过程、未来奖励预测与最终结果应分别评价；代理分数变高，本身不足以说明最终结果会更好。</p>

  <ul>
    <li><span class="lang-en"><strong>What can support an update now?</strong> How can mature historical outcomes, intermediate observations, local experiments, and model predictions be used? What assumptions connect each signal to the long-term objective?</span><span class="lang-zh"><strong>当前更新可以依据什么？</strong>如何利用成熟的历史结果、中间观测、局部实验与模型预测？每种信号与长期目标之间，需要哪些关联假设？</span></li>
    <li><span class="lang-en"><strong>What makes evidence from historical data credible?</strong> How can we distinguish transferable judgment from recognition of known outcomes, and audit information available to the model as well as the task inputs?</span><span class="lang-zh"><strong>历史数据上的证据何时可信？</strong>如何区分可迁移的判断与对已知结局的识别，并同时检查模型已有知识和任务输入中的信息？</span></li>
    <li><span class="lang-en"><strong>How can learning stay relevant as the world changes?</strong> Can recent unlabeled experience help adapt what was learned from old labels, and how can the system detect when an old relationship no longer holds?</span><span class="lang-zh"><strong>世界变化后，学习怎样保持有效？</strong>最新的无标签经验能否帮助调整从旧标签中学到的规律？旧规律不再成立时，系统如何识别？</span></li>
    <li><span class="lang-en"><strong>How should unresolved outcomes affect exploration?</strong> An outcome that has not matured should remain unresolved. How can experience selection avoid favoring only quickly rewarded actions or treating pending outcomes as failures?</span><span class="lang-zh"><strong>未决结果应如何影响探索？</strong>尚未成熟的结果应保留为未决。经验筛选如何避免只偏向很快见效的行动，或把还没有结果的尝试当作失败？</span></li>
    <li><span class="lang-en"><strong>What can a reward correct when it finally arrives?</strong> Which records of information, model versions, actions, and alternatives are needed to revisit early judgments and credit assignments after many updates?</span><span class="lang-zh"><strong>奖励终于到来后，还能纠正什么？</strong>需要保留怎样的信息、模型版本、行动与备选记录，才能在多轮更新后重新评价早期判断和信用分配？</span></li>
  </ul>

  <span class="anchor" id="research-taste"></span>

  <p class="lang-en"><strong>Research taste is one example.</strong> An idea's lasting value may become clear only long after the agent must choose which questions and experiments deserve investment. This setting also involves noise and disagreement about value. I see it as one setting for studying learning without timely ground truth within the broader goal of RSI.</p>
  <p class="lang-zh"><strong>Research taste（研究判断力）是其中一个例子。</strong>一个想法的长期价值可能很久以后才明确，但智能体必须提前判断哪些问题和实验值得投入。这个场景还包含噪声与对价值的不同判断。我希望把它放在 RSI 的总体目标下，用来思考缺少及时真实标签时的学习问题。</p>

  <span class="anchor" id="experience-loop"></span>

  <h2><span class="lang-en">The Experience Loop</span><span class="lang-zh">经验闭环</span></h2>

  <p class="research-section-lead lang-en">I organize the path toward RSI around five related decisions: producing experience, building environments, evaluating behavior, assigning credit, and choosing updates. Extremely delayed rewards raise questions throughout this loop. These decisions can recur and interact as the agent learns.</p>
  <p class="research-section-lead lang-zh">围绕 RSI，我把这个闭环整理为五个相互关联的决策：产生经验、构造环境、评价行为、分配信用与选择更新。超级延迟奖励会贯穿这些环节；它们可以在学习过程中反复发生、相互影响。</p>

  <ol class="research-loop" aria-label="Agent learning and improvement loop">
    <li class="research-loop__step research-loop__step--define">
      <a href="#define-experience"><span class="research-loop__number">01</span><i class="fas fa-bullseye" aria-hidden="true"></i><strong><span class="lang-en">Define</span><span class="lang-zh">定义问题</span></strong><small><span class="lang-en">What experience?</span><span class="lang-zh">需要什么经验？</span></small></a>
    </li>
    <li class="research-loop__step research-loop__step--build">
      <a href="#build-environment"><span class="research-loop__number">02</span><i class="fas fa-cogs" aria-hidden="true"></i><strong><span class="lang-en">Build</span><span class="lang-zh">构造环境</span></strong><small><span class="lang-en">How much reality?</span><span class="lang-zh">需要多真实？</span></small></a>
    </li>
    <li class="research-loop__step research-loop__step--judge">
      <a href="#judge-behavior"><span class="research-loop__number">03</span><i class="fas fa-check-double" aria-hidden="true"></i><strong><span class="lang-en">Judge</span><span class="lang-zh">评价行为</span></strong><small><span class="lang-en">Result and process</span><span class="lang-zh">结果与过程</span></small></a>
    </li>
    <li class="research-loop__step research-loop__step--attribute">
      <a href="#attribute-value"><span class="research-loop__number">04</span><i class="fas fa-search-plus" aria-hidden="true"></i><strong><span class="lang-en">Attribute</span><span class="lang-zh">归因价值</span></strong><small><span class="lang-en">What deserves learning?</span><span class="lang-zh">什么值得学习？</span></small></a>
    </li>
    <li class="research-loop__step research-loop__step--update">
      <a href="#route-update"><span class="research-loop__number">05</span><i class="fas fa-code-branch" aria-hidden="true"></i><strong><span class="lang-en">Update</span><span class="lang-zh">实施更新</span></strong><small><span class="lang-en">Where should it change?</span><span class="lang-zh">应该改进哪里？</span></small></a>
    </li>
  </ol>

  <div class="research-question-list">
    <article class="research-question" id="define-experience">
      <header class="research-question__header">
        <span class="research-question__index">01</span>
        <span class="research-question__icon"><i class="fas fa-bullseye" aria-hidden="true"></i></span>
        <div><small><span class="lang-en">Problem definition</span><span class="lang-zh">问题定义</span></small><h3><span class="lang-en">What experience is worth producing?</span><span class="lang-zh">什么经验值得被产生？</span></h3></div>
      </header>
      <div class="research-question__body">
        <p class="lang-en">Before implementing an environment, a task designer has to choose what capability or failure mode the task is intended to expose. Difficulty alone does not make a task useful. A stronger criterion may be whether success provides evidence about a capability that matters beyond a particular benchmark.</p>
        <p class="lang-zh">在实现环境之前，需要先明确任务希望考察什么能力，又希望暴露什么失败模式。难度本身并不足以说明任务有价值；一个更值得考察的标准，或许是任务表现能否反映某种不局限于特定基准的能力。</p>
        <ul>
          <li><span class="lang-en">Which task distribution represents the capability we actually care about?</span><span class="lang-zh">什么样的任务分布能够代表我们真正关心的能力？</span></li>
          <li><span class="lang-en">How should tasks evolve as the agent improves, instead of becoming a static test set?</span><span class="lang-zh">任务应如何随着智能体进步而变化，而不是退化成静态测试集？</span></li>
          <li><span class="lang-en">Can the agent help discover coverage gaps without becoming the sole author of its own examination?</span><span class="lang-zh">智能体能否帮助发现能力覆盖的空白，同时又不成为自己考试的唯一出题人？</span></li>
        </ul>
      </div>
    </article>

    <article class="research-question" id="build-environment">
      <header class="research-question__header">
        <span class="research-question__index">02</span>
        <span class="research-question__icon"><i class="fas fa-cogs" aria-hidden="true"></i></span>
        <div><small><span class="lang-en">Resource-bounded environments</span><span class="lang-zh">资源受限的环境</span></small><h3><span class="lang-en">What must an environment preserve from the real task?</span><span class="lang-zh">环境需要保留真实任务中的哪些部分？</span></h3></div>
      </header>
      <div class="research-question__body">
        <p class="lang-en">Once a task is specified, building its environment is largely an engineering effort. What remains unclear is which parts of reality need to be modeled faithfully under a limited budget. An environment can be expensive without being useful, while a cheap abstraction may omit the constraints that determine success.</p>
        <p class="lang-zh">任务确定后，环境搭建很大程度上是工程实现。仍然值得研究的是：在资源有限时，真实世界的哪些部分必须被准确建模。一个环境可能成本很高却没有提供更多有效经验，廉价抽象也可能遗漏真正决定任务成败的约束。</p>
        <ul>
          <li><span class="lang-en">Which task-relevant structures and constraints must remain faithful for learning to transfer?</span><span class="lang-zh">为了使学习结果能够迁移，哪些与任务有关的结构和约束必须保持真实？</span></li>
          <li><span class="lang-en">How can we tell when a simplification has changed the capability being learned or evaluated?</span><span class="lang-zh">如何判断某种简化已经改变了原本希望学习或评价的能力？</span></li>
          <li><span class="lang-en">How should interaction, simulation, and verification budgets be allocated jointly?</span><span class="lang-zh">交互、模拟与验证预算应该如何联合分配？</span></li>
        </ul>
      </div>
    </article>

    <article class="research-question" id="judge-behavior">
      <header class="research-question__header">
        <span class="research-question__index">03</span>
        <span class="research-question__icon"><i class="fas fa-check-double" aria-hidden="true"></i></span>
        <div><small><span class="lang-en">Outcome and process evaluation</span><span class="lang-zh">结果与过程评价</span></small><h3><span class="lang-en">What does the final outcome leave unverified?</span><span class="lang-zh">只看最终结果会遗漏什么？</span></h3></div>
      </header>
      <div class="research-question__body">
        <p class="lang-en">A successful outcome can reflect robust behavior, luck, or evaluator exploitation; a delayed outcome may not yet be available for learning. I am interested in what observable process evidence can establish while the final reward is pending, and how later outcomes can test or correct the signals used for learning.</p>
        <p class="lang-zh">成功结果可能来自稳健行为、运气或对评价器的利用；延迟的结果则可能还无法用于学习。我关心在最终奖励未到时，可观察的过程证据究竟能说明什么，以及后来的真实结果如何检验或修正用于学习的信号。</p>
        <ul>
          <li><span class="lang-en">Actions, tool calls, state transitions, intermediate artifacts, and recovery behavior.</span><span class="lang-zh">动作、工具调用、状态变化、中间产物与异常恢复行为。</span></li>
          <li><span class="lang-en">Constraint satisfaction, robustness under perturbation, efficiency, and whether the agent asks for help at an appropriate time.</span><span class="lang-zh">约束满足、扰动下的稳健性、效率，以及智能体是否在合适的时机请求帮助。</span></li>
          <li><span class="lang-en">Evaluators that expose uncertainty instead of forcing every trajectory into a confident scalar reward.</span><span class="lang-zh">允许表达不确定性的评价器，而不是把每条轨迹强行压成一个自信的标量奖励。</span></li>
        </ul>
      </div>
    </article>

    <article class="research-question" id="attribute-value">
      <header class="research-question__header">
        <span class="research-question__index">04</span>
        <span class="research-question__icon"><i class="fas fa-search-plus" aria-hidden="true"></i></span>
        <div><small><span class="lang-en">Credit and experience selection</span><span class="lang-zh">信用分配与经验筛选</span></small><h3><span class="lang-en">What can be learned from a successful or failed trajectory?</span><span class="lang-zh">一条成功或失败的轨迹中，什么值得学习？</span></h3></div>
      </header>
      <div class="research-question__body">
        <p class="lang-en">A long trajectory mixes decisive choices, harmless variation, recovery steps, and errors whose effects appear much later. When reward arrives after several policy updates, what was known and which model acted at each decision need to be preserved. I want to study how this history can support learning while distinguishing decision quality, execution failures, and outcome noise.</p>
        <p class="lang-zh">一条长轨迹混合了关键决策、无害差异、恢复步骤，以及很久以后才显现影响的错误。当奖励晚于多次策略更新才到来时，需要保留每次决策所依据的信息与模型版本。我想研究如何从这些历史中学习，同时区分决策质量、执行失败与结果噪声。</p>
        <ul>
          <li><span class="lang-en">Prioritize novelty, uncertainty, regret, failure coverage, and verifier confidence rather than reward alone.</span><span class="lang-zh">除奖励外，还应考虑新颖性、不确定性、遗憾值、失败覆盖与评价器置信度。</span></li>
          <li><span class="lang-en">Where controlled interventions are possible, compare alternative decisions from the same state and distinguish observed results from hypothetical ones.</span><span class="lang-zh">在允许受控干预时，从同一状态比较不同决策，并区分实际观测与设想中的结果。</span></li>
          <li><span class="lang-en">Separate policy failure from missing knowledge, tool failure, and evaluator ambiguity.</span><span class="lang-zh">区分策略错误、知识缺失、工具故障与评价歧义。</span></li>
        </ul>
      </div>
    </article>

    <article class="research-question" id="route-update">
      <header class="research-question__header">
        <span class="research-question__index">05</span>
        <span class="research-question__icon"><i class="fas fa-code-branch" aria-hidden="true"></i></span>
        <div><small><span class="lang-en">Learning and update routing</span><span class="lang-zh">学习与更新路由</span></small><h3><span class="lang-en">What should change to improve the next learning cycle?</span><span class="lang-zh">获得反馈之后，怎样改善下一轮学习？</span></h3></div>
      </header>
      <div class="research-question__body">
        <p class="lang-en">Depending on what the evidence supports, an update may target model weights, memory, tools, the harness, or an evaluator. Beyond fixing a current failure, I want to investigate whether feedback can improve task generation, experience selection, and the update procedure itself, so that later rounds of learning become more effective.</p>
        <p class="lang-zh">根据证据支持的结论，适合更新的对象可能是模型参数、记忆、工具、harness 或评价器。除了修复当前失败，我更想研究反馈能否进一步改善任务生成、经验筛选与更新方法本身，使后续轮次的学习更有效。</p>
        <ul>
          <li><span class="lang-en"><strong>Weights:</strong> reusable policy or capability gaps.</span><span class="lang-zh"><strong>参数：</strong>可复用的策略或能力缺口。</span></li>
          <li><span class="lang-en"><strong>Memory:</strong> task-specific facts, precedents, and reusable experience.</span><span class="lang-zh"><strong>记忆：</strong>任务相关事实、先例与可复用经验。</span></li>
          <li><span class="lang-en"><strong>Tools and harness:</strong> repeated procedures, checks, and recovery paths.</span><span class="lang-zh"><strong>工具与 harness：</strong>重复流程、检查机制与恢复路径。</span></li>
          <li><span class="lang-en"><strong>Evaluator:</strong> missing constraints, ambiguity, and exploitable feedback.</span><span class="lang-zh"><strong>评价器：</strong>缺失约束、定义歧义与可被利用的反馈漏洞。</span></li>
        </ul>
      </div>
    </article>
  </div>

  <span class="anchor" id="research-bets"></span>

  <h2><span class="lang-en">Three Working Hypotheses</span><span class="lang-zh">三个暂时的研究假设</span></h2>

  <div class="research-bets">
    <article>
      <span>01</span>
      <h3><span class="lang-en">A more realistic environment is not always a more useful one.</span><span class="lang-zh">环境更真实，不一定就更有用。</span></h3>
      <p class="lang-en">Under a fixed budget, a simpler environment may be preferable if it preserves the constraints that affect task success. I do not yet know how to identify those constraints reliably.</p>
      <p class="lang-zh">在预算固定时，只要保留了影响任务成败的约束，更简单的环境可能反而更合适。怎样可靠地识别这些约束，我还没有答案。</p>
    </article>
    <article>
      <span>02</span>
      <h3><span class="lang-en">Recent unlabeled experience may help adapt learning from older outcomes.</span><span class="lang-zh">最新的无标签经验，可能帮助调整从旧结果中学到的规律。</span></h3>
      <p class="lang-en">Historical rewards and current observations may complement each other when their relationship remains informative. I want to test which assumptions make this possible, how proxy errors accumulate, and whether gains survive evaluation on outcomes that mature later.</p>
      <p class="lang-zh">当两者之间仍存在有效关联时，历史奖励与当前观测可能互相补充。我想检验这需要哪些假设、代理误差如何累积，以及改进能否经受后来成熟的真实结果的检验。</p>
    </article>
    <article>
      <span>03</span>
      <h3><span class="lang-en">Some failures may be better addressed by changing the harness than the model.</span><span class="lang-zh">有些失败可能更适合通过修改 harness 处理，而非直接修改模型。</span></h3>
      <p class="lang-en">A system may improve more efficiently if it can locate the source of a failure and update the appropriate component. Whether this diagnosis can be made reliably remains open.</p>
      <p class="lang-zh">如果系统能够定位失败来源并更新相应组件，改进或许会更高效。不过，这种诊断能否可靠完成，仍有待验证。</p>
    </article>
  </div>

  <span class="anchor" id="first-study"></span>

  <h2><span class="lang-en">Testing Without Future Information</span><span class="lang-zh">如何在不偷看未来的条件下检验？</span></h2>

  <p class="lang-en">A rolling evaluation should reconstruct the information available at each real-world cutoff: mature historical labels, recent observations, and unresolved outcomes. Save predictions and model versions at that time, then evaluate against outcomes once they mature. Separate an outcome's occurrence time from the time it became observable, and audit future knowledge already present in pretrained models when using historical data.</p>
  <p class="lang-zh">可以按真实时间滚动评估：在每个截止时刻，只提供当时已经成熟的历史标签、最新观测与仍未决的记录。保存当时的预测和模型版本，等结果成熟后再评价。同时区分结果发生时间与它真正可被观察到的时间；使用历史数据时，还需要检查预训练模型是否已经知道了未来信息。</p>

  <p class="lang-en">Historical backtests need evidence about the model's training history, later adaptations, and retrieved sources, not just a date filter on the test set. Models trained with documented temporal boundaries, such as <a href="https://arxiv.org/abs/2603.11838">DatedGPT</a>, offer one approach. Another is to freeze the system and record predictions before outcomes are known, as in <a href="https://forecastbench.org/about/">ForecastBench</a>. This reduces the risk of remembering resolved answers but retains the wait for real outcomes. These approaches address different parts of the tradeoff between evaluation speed, leakage control, and real-world relevance.</p>
  <p class="lang-zh">历史回测需要关于模型训练历史、后续适配与检索来源的证据，不能只给测试集加一个日期过滤器。像 <a href="https://arxiv.org/abs/2603.11838">DatedGPT</a> 这样记录并控制训练数据时间边界的模型，是一种路径。另一种是先固定系统，在结果尚未知晓时记录预测，例如 <a href="https://forecastbench.org/about/">ForecastBench</a> 的做法；这降低了记忆已知答案的风险，却仍需等待真实结果。这些路径分别处理评估速度、泄漏控制与真实世界相关性之间的不同取舍。</p>

  <p class="lang-en">With the same initial system, task distribution, and total budget, compare training on mature labels alone, learning from interim signals, and combining historical labels with recent unlabeled experience. Later ground truth can evaluate updates that had to be made without it; it need not have been available as a training reward. Vary delay, noise, and distribution change separately in controlled environments. Artificially delaying known labels can test mechanisms, while claims about real-world long-term gains require outcomes that have actually matured.</p>
  <p class="lang-zh">在相同初始系统、任务分布和总预算下，可以比较只使用成熟标签、依赖中间信号，以及结合历史标签和最新无标签经验的学习方式。后来的真实结果可以评价那些在缺少标签时已经完成的更新，并不要求它当时能够充当训练奖励。在可控环境中，再分别改变延迟、噪声和分布变化。人为延迟已知标签可以检验机制；对真实世界长期收益的判断，仍需要实际成熟的结果。</p>

  <p class="lang-en">For RSI, I would also examine whether an update helps the agent learn more effectively in later cycles and transfer across tasks, accounting for additional computation, interaction, and verification costs.</p>
  <p class="lang-zh">围绕 RSI，还需要考察一次更新能否帮助智能体在后续轮次中更有效地学习、跨任务迁移，并计入额外的计算、交互与验证成本。</p>

  <span class="anchor" id="open-uncertainties"></span>

  <h2><span class="lang-en">What I Have Not Figured Out</span><span class="lang-zh">我还没有想清楚的部分</span></h2>

  <div class="research-uncertainties">
    <ul>
      <li><span class="lang-en"><strong>Who defines the next problem?</strong> Humans can provide purpose and boundaries; agents can expose blind spots. I do not yet know the right division of labor.</span><span class="lang-zh"><strong>下一个问题由谁定义？</strong>人类可以提供目的与边界，智能体可以暴露盲区；两者之间合适的分工尚不明确。</span></li>
      <li><span class="lang-en"><strong>What information makes learning possible before rewards arrive?</strong> Which assumptions connect observable signals to eventual outcomes, and how can the agent detect when that relationship changes?</span><span class="lang-zh"><strong>奖励未到时，学习依靠哪些信息？</strong>可观察信号与最终结果之间需要哪些假设？这种关系变化时，智能体又能否识别？</span></li>
      <li><span class="lang-en"><strong>How can the loop avoid self-confirmation?</strong> When an agent proposes tasks, builds evaluators, and learns from their feedback, external grounding and adversarial checks may be needed.</span><span class="lang-zh"><strong>闭环如何避免自我确认？</strong>当智能体同时提出任务、构建评价器并从反馈中学习时，可能仍然需要外部锚点与对抗性检查。</span></li>
      <li><span class="lang-en"><strong>What would demonstrate progress toward RSI?</strong> I want to distinguish a local task improvement, gains from additional resources, and an improvement that helps the system learn more effectively in later cycles.</span><span class="lang-zh"><strong>怎样验证正在走向 RSI？</strong>我希望区分单个任务上的局部改进、额外资源带来的收益，以及能够帮助系统在后续轮次中更有效学习的改进。</span></li>
    </ul>
  </div>

  <span class="anchor" id="related-reading"></span>

  <h2><span class="lang-en">Further Reading on the Research Taste Example</span><span class="lang-zh">关于 research taste 例子的延伸阅读</span></h2>

  <ul>
    <li><a href="https://bear.warrington.ufl.edu/brenner/mar7588/Papers/kahneman-klein-2009.pdf"><span class="lang-en">Kahneman &amp; Klein (2009): Conditions for Intuitive Expertise</span><span class="lang-zh">Kahneman 与 Klein（2009）：专家直觉的形成条件</span></a></li>
    <li><a href="https://arxiv.org/html/2603.14473v3">AI Can Learn Scientific Taste (2026, v3)</a></li>
  </ul>

  <div class="research-discussion">
    <div>
      <small><span class="lang-en">Open for discussion</span><span class="lang-zh">欢迎讨论</span></small>
      <h2><span class="lang-en">These notes are still provisional.</span><span class="lang-zh">这些想法仍在形成。</span></h2>
      <p class="lang-en">I welcome discussions about sustained agent self-improvement, learning while true rewards remain unavailable, and cases where local gains fail to improve later learning. Concrete successes and failures can help identify useful mechanisms and assumptions that need revision.</p>
      <p class="lang-zh">欢迎讨论智能体如何持续自我改进、真实奖励不可得时如何学习，以及局部提升没能改善后续学习的案例。具体的成功与失败，有助于识别有用的机制与需要修正的假设。</p>
    </div>
    <a href="mailto:{{ site.author.email }}"><i class="fas fa-comment-dots" aria-hidden="true"></i><span class="lang-en">Discuss by email</span><span class="lang-zh">邮件讨论</span></a>
  </div>
</div>
