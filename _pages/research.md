---
permalink: /research/
title: "Research Questions"
excerpt: "Notes toward a research agenda on task design, evaluation, feedback, and agent self-improvement"
author_profile: true
---

<div class="research-vision">
  <span class="anchor" id="research-questions"></span>

  <h1><span class="lang-en">Research Questions</span><span class="lang-zh">研究问题</span></h1>

  <header class="research-vision__intro">
    <p class="research-vision__kicker"><i class="fas fa-compass" aria-hidden="true"></i><span class="lang-en">Notes toward a research agenda</span><span class="lang-zh">一份仍在形成的研究笔记</span></p>
    <p class="research-vision__lead lang-en">Under limited resources, how should <strong>useful interaction experience</strong> be defined, constructed, evaluated, and used, so that an agent can improve beyond a single task?</p>
    <p class="research-vision__lead lang-zh">在资源有限的情况下，应该如何<strong>定义、构造、评价并利用有价值的交互经验</strong>，使智能体获得不局限于单个任务的改进？</p>
  </header>

  <span class="anchor" id="experience-loop"></span>

  <h2><span class="lang-en">The Experience Loop</span><span class="lang-zh">经验闭环</span></h2>

  <p class="research-section-lead lang-en">I currently separate this loop into five related decisions. This is only one way to organize the questions; it does not assume that every agent must learn through a fixed five-stage pipeline.</p>
  <p class="research-section-lead lang-zh">我暂时把这个闭环拆成五个相互关联的决策。这只是整理问题的一种方式，并不意味着所有智能体都必须遵循固定的五阶段流程。</p>

  <ol class="research-loop" aria-label="Research experience loop">
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
        <p class="lang-en">For many well-specified tasks, terminal outcomes are easier to judge than the trajectory. Yet the same successful result may come from a robust procedure, a lucky shortcut, or evaluator exploitation. I am therefore interested in process signals that can be tied to observable evidence, without assuming that an evaluator can recover the agent's private reasoning.</p>
        <p class="lang-zh">对于许多定义清晰的任务，最终结果确实比执行轨迹更容易判断。但相同的成功结果，可能来自稳健流程、偶然捷径，也可能来自对评价器的利用。因此，我更关心能够落到可观察证据上的过程信号，而不假设评价器能够还原智能体不可见的内部推理。</p>
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
        <p class="lang-en">Knowing that an outcome is good or bad is not enough. A long trajectory mixes decisive choices, harmless variation, recovery steps, and errors whose effects appear much later. Learning requires both selecting useful episodes and assigning credit within them.</p>
        <p class="lang-zh">知道结果好坏还不够。一条长轨迹混合了关键决策、无害差异、恢复步骤，以及很久以后才显现影响的错误。学习既需要选择有价值的轨迹，也需要在轨迹内部进行信用分配。</p>
        <ul>
          <li><span class="lang-en">Prioritize novelty, uncertainty, regret, failure coverage, and verifier confidence rather than reward alone.</span><span class="lang-zh">除奖励外，还应考虑新颖性、不确定性、遗憾值、失败覆盖与评价器置信度。</span></li>
          <li><span class="lang-en">Use counterfactuals to ask which decision actually changed the outcome.</span><span class="lang-zh">利用反事实判断究竟是哪一步决策改变了结果。</span></li>
          <li><span class="lang-en">Separate policy failure from missing knowledge, tool failure, and evaluator ambiguity.</span><span class="lang-zh">区分策略错误、知识缺失、工具故障与评价歧义。</span></li>
        </ul>
      </div>
    </article>

    <article class="research-question" id="route-update">
      <header class="research-question__header">
        <span class="research-question__index">05</span>
        <span class="research-question__icon"><i class="fas fa-code-branch" aria-hidden="true"></i></span>
        <div><small><span class="lang-en">Learning and update routing</span><span class="lang-zh">学习与更新路由</span></small><h3><span class="lang-en">What should change after feedback?</span><span class="lang-zh">获得反馈之后，究竟应该改变什么？</span></h3></div>
      </header>
      <div class="research-question__body">
        <p class="lang-en">Feedback does not necessarily imply a model-weight update. Depending on the cause of a failure, the appropriate target may be the model policy, memory, a tool, the task harness, or even the evaluator. One open question is whether a system can distinguish these cases well enough to avoid repeatedly training around an infrastructure defect.</p>
        <p class="lang-zh">获得反馈并不意味着一定要更新模型参数。根据失败原因，真正需要改变的可能是模型策略、记忆、工具、任务 harness，甚至评价器本身。一个尚未解决的问题是，系统能否充分区分这些情况，避免反复训练模型去绕开基础设施缺陷。</p>
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
      <h3><span class="lang-en">Process feedback may help when it adds trustworthy evidence.</span><span class="lang-zh">当过程反馈提供了可信证据时，它才可能有所帮助。</span></h3>
      <p class="lang-en">Observable traces and counterfactual interventions may help distinguish robust competence from lucky success, but poorly chosen process targets can also suppress valid exploration.</p>
      <p class="lang-zh">可观察轨迹与反事实干预或许能够区分稳健能力与偶然成功，但选择不当的过程目标也可能压制合理探索。</p>
    </article>
    <article>
      <span>03</span>
      <h3><span class="lang-en">Some failures may be better addressed by changing the harness than the model.</span><span class="lang-zh">有些失败可能更适合通过修改 harness 处理，而非直接修改模型。</span></h3>
      <p class="lang-en">A system may improve more efficiently if it can locate the source of a failure and update the appropriate component. Whether this diagnosis can be made reliably remains open.</p>
      <p class="lang-zh">如果系统能够定位失败来源并更新相应组件，改进或许会更高效。不过，这种诊断能否可靠完成，仍有待验证。</p>
    </article>
  </div>

  <span class="anchor" id="open-uncertainties"></span>

  <h2><span class="lang-en">What I Have Not Figured Out</span><span class="lang-zh">我还没有想清楚的部分</span></h2>

  <div class="research-uncertainties">
    <ul>
      <li><span class="lang-en"><strong>Who defines the next problem?</strong> Humans can provide purpose and boundaries; agents can expose blind spots. I do not yet know the right division of labor.</span><span class="lang-zh"><strong>下一个问题由谁定义？</strong>人类可以提供目的与边界，智能体可以暴露盲区；两者之间合适的分工尚不明确。</span></li>
      <li><span class="lang-en"><strong>Is process quality unique?</strong> Many workflows may be equally valid. Process supervision could erase useful diversity if it enforces one preferred style.</span><span class="lang-zh"><strong>过程质量是否存在唯一标准？</strong>许多工作流可能同样合理；如果过程监督强制统一为某一种偏好，就可能抹去有价值的多样性。</span></li>
      <li><span class="lang-en"><strong>How can the loop avoid self-confirmation?</strong> When an agent proposes tasks, builds evaluators, and learns from their feedback, external grounding and adversarial checks may be needed.</span><span class="lang-zh"><strong>闭环如何避免自我确认？</strong>当智能体同时提出任务、构建评价器并从反馈中学习时，可能仍然需要外部锚点与对抗性检查。</span></li>
      <li><span class="lang-en"><strong>What should count as RSI?</strong> I care less about the exact boundary of the label than whether improvements to weights, memory, tools, and harnesses can accumulate across tasks.</span><span class="lang-zh"><strong>什么才算 RSI？</strong>相比为这个标签划定精确边界，我更关心参数、记忆、工具与 harness 上的改进能否跨任务积累。</span></li>
    </ul>
  </div>

  <div class="research-discussion">
    <div>
      <small><span class="lang-en">Open for discussion</span><span class="lang-zh">欢迎讨论</span></small>
      <h2><span class="lang-en">These notes are still provisional.</span><span class="lang-zh">这些想法仍在形成。</span></h2>
      <p class="lang-en">I am especially interested in evidence that challenges this framing: tasks whose outcomes are difficult to verify, settings where process feedback restricts exploration, or cases where a more realistic environment does not improve transfer. Such cases would help clarify which parts of this agenda are useful and which need revision.</p>
      <p class="lang-zh">我也希望了解与这套表述不一致的证据，例如结果难以验证的任务、过程反馈限制探索的情形，或更真实的环境并未改善迁移的案例。这些反例有助于判断哪些问题值得继续推进，哪些表述需要修改。</p>
    </div>
    <a href="mailto:{{ site.author.email }}"><i class="fas fa-comment-dots" aria-hidden="true"></i><span class="lang-en">Discuss by email</span><span class="lang-zh">邮件讨论</span></a>
  </div>
</div>
