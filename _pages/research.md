---
permalink: /research/
title: "Research Questions"
excerpt: "Learning research judgment from experience under noisy, delayed feedback"
author_profile: true
---

<div class="research-vision">
  <span class="anchor" id="research-questions"></span>

  <h1><span class="lang-en">Research Questions</span><span class="lang-zh">研究问题</span></h1>

  <header class="research-vision__intro">
    <p class="research-vision__kicker"><i class="fas fa-compass" aria-hidden="true"></i><span class="lang-en">Notes toward a research agenda</span><span class="lang-zh">一份仍在形成的研究笔记</span></p>
    <p class="research-vision__lead lang-en">How can agents <strong>learn better research judgment from experience</strong>, choosing worthwhile problems, acquiring useful evidence, and revising decisions under limited resources and noisy, delayed feedback?</p>
    <p class="research-vision__lead lang-zh">在资源有限、反馈噪声大且验证周期长的情况下，智能体如何<strong>从经验中积累更好的研究判断</strong>，学会选择值得做的问题、获取有用证据，并修正自己的决策？</p>
  </header>

  <span class="anchor" id="research-taste"></span>

  <h2><span class="lang-en">Current Focus: Learning Research Taste</span><span class="lang-zh">当前切入点：从经验中学习 research taste</span></h2>

  <p class="lang-en">My broader interest is how useful interaction experience leads to improvement across tasks. Scientific research makes this question concrete: an agent must decide what is worth pursuing before the final value is known. Here, I use <strong>research taste</strong> to mean judgment about a problem's potential value, the evidence worth obtaining, and when to continue, redirect, or stop. Idea selection, experimental execution, and evaluation reliability need to be examined separately.</p>
  <p class="lang-zh">我更广泛的兴趣，是有价值的交互经验如何带来跨任务的改进。科学研究让这个问题变得具体：智能体必须在最终价值尚不明确时，决定什么值得投入。在这里，我用 <strong>research taste（研究判断力）</strong>指对问题潜在价值、值得获取的证据，以及何时继续、转向或停止的判断。选题能力、实验执行能力与评价可靠性需要分别考察。</p>

  <p class="lang-en">Obvious flaws may be easy to reject; ranking plausible, promising ideas is harder, and lasting value may take years to establish. A hypothesis I want to test is that research judgment improves through repeated prediction, experimentation, and revision. The useful unit of experience would then include what was known at the time, what alternatives were considered, and which evidence changed the decision. More experience alone does not guarantee better judgment.</p>
  <p class="lang-zh">明显的漏洞可能较快排除；在几个看起来都有希望的想法之间排序则更难，长期价值也可能需要多年才能确认。我想检验的一个假设是：研究判断可以通过反复的预测、实验与修正逐渐改善。这样，有用的经验就应包含当时知道什么、考虑过哪些备选，以及哪条证据改变了决策。经历更多，本身并不保证判断更准。</p>

  <span class="anchor" id="experience-loop"></span>

  <h2><span class="lang-en">An Experience Loop for Research Judgment</span><span class="lang-zh">围绕研究判断的经验闭环</span></h2>

  <p class="research-section-lead lang-en">This focus connects my questions about task design, environments, evaluation, credit assignment, and learning. The five decisions below may recur within one project; they are a way to organize the questions, not a fixed pipeline.</p>
  <p class="research-section-lead lang-zh">这个切入点串起了我对任务设计、环境、评价、信用分配与学习的关注。下面五类决策可能在一个项目中反复发生；它们是整理问题的方式，不是固定流水线。</p>

  <ol class="research-loop" aria-label="Research experience loop">
    <li class="research-loop__step research-loop__step--define">
      <a href="#define-experience"><span class="research-loop__number">01</span><i class="fas fa-bullseye" aria-hidden="true"></i><strong><span class="lang-en">Choose</span><span class="lang-zh">选择问题</span></strong><small><span class="lang-en">Worth pursuing?</span><span class="lang-zh">值得投入吗？</span></small></a>
    </li>
    <li class="research-loop__step research-loop__step--build">
      <a href="#build-environment"><span class="research-loop__number">02</span><i class="fas fa-cogs" aria-hidden="true"></i><strong><span class="lang-en">Experiment</span><span class="lang-zh">获取证据</span></strong><small><span class="lang-en">What to test next?</span><span class="lang-zh">先验证什么？</span></small></a>
    </li>
    <li class="research-loop__step research-loop__step--judge">
      <a href="#judge-behavior"><span class="research-loop__number">03</span><i class="fas fa-check-double" aria-hidden="true"></i><strong><span class="lang-en">Evaluate</span><span class="lang-zh">评价反馈</span></strong><small><span class="lang-en">What is supported?</span><span class="lang-zh">证据支持什么？</span></small></a>
    </li>
    <li class="research-loop__step research-loop__step--attribute">
      <a href="#attribute-value"><span class="research-loop__number">04</span><i class="fas fa-search-plus" aria-hidden="true"></i><strong><span class="lang-en">Learn</span><span class="lang-zh">积累经验</span></strong><small><span class="lang-en">Which lesson transfers?</span><span class="lang-zh">哪些经验可复用？</span></small></a>
    </li>
    <li class="research-loop__step research-loop__step--update">
      <a href="#route-update"><span class="research-loop__number">05</span><i class="fas fa-code-branch" aria-hidden="true"></i><strong><span class="lang-en">Revise</span><span class="lang-zh">修正策略</span></strong><small><span class="lang-en">What changes next?</span><span class="lang-zh">下一步如何改变？</span></small></a>
    </li>
  </ol>

  <div class="research-question-list">
    <article class="research-question" id="define-experience">
      <header class="research-question__header">
        <span class="research-question__index">01</span>
        <span class="research-question__icon"><i class="fas fa-bullseye" aria-hidden="true"></i></span>
        <div><small><span class="lang-en">Problem selection</span><span class="lang-zh">问题选择</span></small><h3><span class="lang-en">Which plausible idea deserves the next investment?</span><span class="lang-zh">几个都有希望的想法中，哪个值得下一笔投入？</span></h3></div>
      </header>
      <div class="research-question__body">
        <p class="lang-en">Difficulty, novelty, and a high chance of producing a positive result each capture only part of a research choice. I want to study how an agent weighs potential value, feasibility, uncertainty, and cost. A useful evaluation should include choices among credible candidates and test whether the judgment transfers beyond one benchmark.</p>
        <p class="lang-zh">难度、新颖性和做出正结果的概率，都只反映研究选择的一部分。我想研究智能体如何权衡潜在价值、可行性、不确定性与成本。评价应包含可信候选之间的选择，并检验这种判断能否迁移到单个基准之外。</p>
        <ul>
          <li><span class="lang-en">If an idea succeeds, what important limitation would it remove, and for whom?</span><span class="lang-zh">即使一个想法完全做成了，它会为谁解除什么重要限制？</span></li>
          <li><span class="lang-en">How should a fixed budget balance likely improvements with uncertain but potentially valuable directions?</span><span class="lang-zh">固定预算应如何分配给较有把握的改进和不确定但可能有价值的方向？</span></li>
          <li><span class="lang-en">Can tasks evolve with the agent while keeping the evaluation grounded in independently specified goals?</span><span class="lang-zh">任务能否随智能体进步而变化，同时仍由独立定义的目标约束评价？</span></li>
        </ul>
      </div>
    </article>

    <article class="research-question" id="build-environment">
      <header class="research-question__header">
        <span class="research-question__index">02</span>
        <span class="research-question__icon"><i class="fas fa-cogs" aria-hidden="true"></i></span>
        <div><small><span class="lang-en">Experiment and environment design</span><span class="lang-zh">实验与环境设计</span></small><h3><span class="lang-en">Which experiment would change the next decision?</span><span class="lang-zh">哪个实验最可能改变下一步决策？</span></h3></div>
      </header>
      <div class="research-question__body">
        <p class="lang-en">An agent can actively seek faster, clearer feedback on the assumptions behind a direction. Suppose a new module improves a small-scale result: a matched-budget control may be more useful than immediately scaling up. Even without a higher score, that experiment may reveal whether further investment is justified. Its value depends on the decision it informs.</p>
        <p class="lang-zh">智能体可以主动为一个方向背后的假设寻找更快、更清楚的反馈。例如，新模块在小规模实验中带来提升后，一次等预算对照可能比立刻扩大训练更有用。即使没有带来更高分数，这个实验也可能帮助判断是否值得继续投入；它的价值取决于改善了什么决策。</p>
        <ul>
          <li><span class="lang-en">Which low-cost test can distinguish a useful mechanism from an alternative explanation?</span><span class="lang-zh">哪个低成本实验能够区分有用机制与其他可能的解释？</span></li>
          <li><span class="lang-en">Which costs, uncertainties, and constraints must a simplified environment preserve for learning to transfer?</span><span class="lang-zh">简化环境必须保留哪些成本、不确定性和约束，才能使学习结果迁移？</span></li>
          <li><span class="lang-en">How can we reward information that improves important decisions without encouraging easy but irrelevant investigations?</span><span class="lang-zh">怎样奖励有助于重要决策的信息，同时避免鼓励容易回答却无关紧要的调查？</span></li>
        </ul>
      </div>
    </article>

    <article class="research-question" id="judge-behavior">
      <header class="research-question__header">
        <span class="research-question__index">03</span>
        <span class="research-question__icon"><i class="fas fa-check-double" aria-hidden="true"></i></span>
        <div><small><span class="lang-en">Noisy and delayed feedback</span><span class="lang-zh">高噪声与长延迟反馈</span></small><h3><span class="lang-en">What can feedback establish before long-term value is known?</span><span class="lang-zh">长期价值尚未明确时，反馈能说明什么？</span></h3></div>
      </header>
      <div class="research-question__body">
        <p class="lang-en">Experimental randomness, disagreement about scientific goals, and delayed validation pose different problems. A result can also reflect execution quality, resources, or luck. I want evaluators to separate verifiable process evidence, estimates of future value, and later outcomes, and to express uncertainty when the available evidence cannot settle a judgment.</p>
        <p class="lang-zh">实验随机性、对科学目标的分歧和验证延迟，是不同的问题。结果还可能受执行质量、资源与运气影响。我希望评价能够区分可验证的过程证据、对未来价值的估计和后来实际发生的结果，并在证据不足时保留不确定性。</p>
        <ul>
          <li><span class="lang-en">Use artifacts, controls, and repeated measurements to check what an experiment actually supports; a well-executed experiment does not by itself establish importance.</span><span class="lang-zh">通过产物、对照和重复测量检查实验实际支持什么；执行严谨本身还不能证明问题重要。</span></li>
          <li><span class="lang-en">Record whose goals a judgment reflects. Novelty, explanation, practical use, and community attention need not yield the same ranking.</span><span class="lang-zh">记录评价对应谁的目标；新颖性、解释力、实际用途和社区关注度不必给出相同排序。</span></li>
          <li><span class="lang-en">Treat immature outcomes as unresolved, and audit methodological drift and evaluator exploitation separately from idea quality.</span><span class="lang-zh">将尚未成熟的结果保留为未决，并把实验偏离方案、利用评价漏洞与想法质量分开检查。</span></li>
        </ul>
      </div>
    </article>

    <article class="research-question" id="attribute-value">
      <header class="research-question__header">
        <span class="research-question__index">04</span>
        <span class="research-question__icon"><i class="fas fa-search-plus" aria-hidden="true"></i></span>
        <div><small><span class="lang-en">Experience and credit assignment</span><span class="lang-zh">经验积累与信用分配</span></small><h3><span class="lang-en">What made a decision reasonable at the time?</span><span class="lang-zh">在当时的信息条件下，什么使一个决策合理？</span></h3></div>
      </header>
      <div class="research-question__body">
        <p class="lang-en">A successful project can contain poor decisions, and a reasonable decision can lead to an unlucky failure. I want to preserve records made before outcomes were known: available evidence, alternatives, predictions, confidence, costs, and subsequent revisions. These records may support learning from successes, failures, and changes of direction without turning every outcome into hindsight justification.</p>
        <p class="lang-zh">成功项目可能包含糟糕的决策，合理决策也可能遇到不走运的失败。我希望保留在结果揭晓前记录的证据、备选方案、预测、置信度、成本与后续修正。这些记录可能帮助模型从成功、失败和转向中学习，减少把每个结果都事后解释为必然的倾向。</p>
        <ul>
          <li><span class="lang-en">Which evidence justified an update, and which apparent lesson disappears under repeated trials or controlled comparisons?</span><span class="lang-zh">哪条证据足以支持更新判断？哪些表面的教训会在重复实验或受控比较下消失？</span></li>
          <li><span class="lang-en">Unchosen ideas usually lack observed outcomes. How can selective feedback be handled without labeling every abandoned idea a failure?</span><span class="lang-zh">未被选择的想法通常没有可观察结果。如何处理这种选择性反馈，而不把所有放弃的想法标成失败？</span></li>
          <li><span class="lang-en">Where controlled interventions are possible, can we compare alternative decisions from the same state without presenting imagined outcomes as observed facts?</span><span class="lang-zh">在允许受控干预的环境中，能否从同一状态比较不同决策，同时区分设想中的结果与实际观测？</span></li>
        </ul>
      </div>
    </article>

    <article class="research-question" id="route-update">
      <header class="research-question__header">
        <span class="research-question__index">05</span>
        <span class="research-question__icon"><i class="fas fa-code-branch" aria-hidden="true"></i></span>
        <div><small><span class="lang-en">Learning and transfer</span><span class="lang-zh">学习与迁移</span></small><h3><span class="lang-en">How should experience improve the next research decision?</span><span class="lang-zh">研究经验怎样改善下一次决策？</span></h3></div>
      </header>
      <div class="research-question__body">
        <p class="lang-en">Useful experience should change later choices: what to investigate, which experiment to run, or when to stop. The appropriate update may target model weights, memory, tools, the task harness, or the evaluator. I want to test whether these changes accumulate across tasks, and whether the agent can recognize when an old lesson no longer applies.</p>
        <p class="lang-zh">有用的经验应改变后续选择：研究什么、做哪个实验，或何时停止。适合更新的对象可能是模型参数、记忆、工具、任务 harness，也可能是评价器。我想检验这些改进能否跨任务积累，以及智能体能否识别旧经验不再适用的情形。</p>
        <ul>
          <li><span class="lang-en"><strong>Weights:</strong> reusable policies for choosing problems, experiments, and stopping decisions.</span><span class="lang-zh"><strong>参数：</strong>可复用的选题、实验选择与停止策略。</span></li>
          <li><span class="lang-en"><strong>Memory:</strong> evidence, precedents, and the conditions under which a lesson applies.</span><span class="lang-zh"><strong>记忆：</strong>证据、先例，以及经验成立的条件。</span></li>
          <li><span class="lang-en"><strong>Tools and harness:</strong> reliable execution, reproducible controls, and records of decisions and observations.</span><span class="lang-zh"><strong>工具与 harness：</strong>可靠执行、可复现的对照，以及决策和观测记录。</span></li>
          <li><span class="lang-en"><strong>Evaluator:</strong> calibration, missing criteria, and feedback that can be exploited.</span><span class="lang-zh"><strong>评价器：</strong>置信度校准、缺失的标准与可被利用的反馈。</span></li>
        </ul>
      </div>
    </article>
  </div>

  <span class="anchor" id="research-bets"></span>

  <h2><span class="lang-en">Three Working Hypotheses</span><span class="lang-zh">三个暂时的研究假设</span></h2>

  <div class="research-bets">
    <article>
      <span>01</span>
      <h3><span class="lang-en">Decision histories may teach more than final outcomes alone.</span><span class="lang-zh">判断被证据修正的经历，可能提供额外的学习价值。</span></h3>
      <p class="lang-en">Under matched training budgets, I would compare outcome summaries with chronological decision records, controlling for access to experimental facts. The test is whether later choices improve on unseen problems, rather than whether the model reproduces the original researcher's wording.</p>
      <p class="lang-zh">在匹配训练预算、控制可用实验事实的条件下，比较结果摘要与按时间记录的决策经历。检验重点是能否改善新问题上的选择；复述原研究者的表达并不足以说明这一点。</p>
    </article>
    <article>
      <span>02</span>
      <h3><span class="lang-en">Seeking informative feedback may improve research efficiency.</span><span class="lang-zh">主动获取有用反馈，可能提高研究效率。</span></h3>
      <p class="lang-en">With the same research budget, choosing experiments that test consequential assumptions may improve continuation and stopping decisions. Any gain must survive independent evaluation; rewarding easy uncertainty reduction could instead divert effort from valuable questions.</p>
      <p class="lang-zh">在相同研究预算下，优先检验关键假设，可能改善继续或停止的决策。收益必须经独立评价确认；奖励容易消除的不确定性，也可能把精力引向不重要的问题。</p>
    </article>
    <article>
      <span>03</span>
      <h3><span class="lang-en">Experience may transfer better when its limits are retained.</span><span class="lang-zh">保留经验的适用条件，可能改善迁移。</span></h3>
      <p class="lang-en">Recording when a lesson holds may help an agent reuse it or seek fresh evidence as tasks change. I would test this across changes in data, resources, and goals, while tracking both better decisions and missed opportunities caused by excessive caution.</p>
      <p class="lang-zh">记录经验在什么条件下成立，可能帮助智能体在任务变化后合理复用它，或重新取证。可以通过改变数据、资源与目标来检验，同时考察决策改善，以及过度保守导致的机会损失。</p>
    </article>
  </div>

  <span class="anchor" id="first-study"></span>

  <h2><span class="lang-en">A First Test I Would Like to Run</span><span class="lang-zh">我想先做的一组检验</span></h2>

  <p class="lang-en">Start with a bounded computational research setting. Fix the candidate ideas, execution system, initial information, observation rules, and total budget, then compare policies for selecting ideas, choosing experiments, and continuing or stopping. Candidate baselines include random allocation, a static idea scorer, and a policy that updates its choices as evidence arrives. This would test research decisions under a stated objective.</p>
  <p class="lang-zh">先从范围可控的计算研究环境出发。固定候选想法、执行系统、初始信息、观测规则和总预算，比较不同的选题、实验选择以及继续或停止策略。候选基线可以包括随机分配、静态想法评分，以及随证据更新选择的策略。这样的实验检验的是给定目标下的研究决策。</p>

  <p class="lang-en">Evaluate budget use, reproducibility, and performance on held-out tasks with repeated trials and independent checks. Compare initial judgments with later outcomes without exposing those outcomes at decision time. Historical studies must also account for knowledge already present in model pretraining. Better performance here would be limited evidence: establishing lasting scientific value would still require longer follow-up.</p>
  <p class="lang-zh">通过重复试验和独立检查，评价预算使用、可复现性与留出任务上的表现。把最初判断与后续结果对照，同时避免在决策时暴露未来结果；历史回测还必须考虑模型预训练中已经包含的未来知识。这些指标改善只能提供有限证据，长期科学价值仍需要更长时间的跟踪。</p>

  <span class="anchor" id="open-uncertainties"></span>

  <h2><span class="lang-en">What I Have Not Figured Out</span><span class="lang-zh">我还没有想清楚的部分</span></h2>

  <div class="research-uncertainties">
    <ul>
      <li><span class="lang-en"><strong>Whose scientific value?</strong> Goals can differ legitimately. Expert preferences and citation counts can inform learning, but neither defines a universal objective.</span><span class="lang-zh"><strong>谁来定义科学价值？</strong>目标可以存在合理分歧。专家偏好与引用量可以提供学习信号，但都不能定义普遍适用的目标。</span></li>
      <li><span class="lang-en"><strong>Where do useful histories come from?</strong> We need records made during research, including failures and revisions. Accounts written after success may omit alternatives or rationalize earlier choices.</span><span class="lang-zh"><strong>有用的研究经历从哪里来？</strong>需要研究当时留下的记录，包括失败与修正。成功后的回忆可能遗漏备选方案，或为早期选择补上事后理由。</span></li>
      <li><span class="lang-en"><strong>How can the loop avoid self-confirmation?</strong> An agent that proposes ideas and evaluates them can reinforce its own preferences. Independent outcomes and checks must test whether its judgment actually improves.</span><span class="lang-zh"><strong>闭环如何避免自我确认？</strong>同时提出想法和评价想法的智能体，可能不断强化自身偏好。需要独立结果与检查来检验判断是否实际改善。</span></li>
      <li><span class="lang-en"><strong>Will fast feedback suppress long-term exploration?</strong> Easily verified gains may crowd out uncertain directions. I want to preserve multiple valid approaches and test whether accumulated experience supports broader agent self-improvement.</span><span class="lang-zh"><strong>快速反馈会不会压制长期探索？</strong>容易验证的收益可能挤掉不确定的方向。我希望保留多种合理路径，并检验积累的经验能否支持更广泛的智能体自我改进。</span></li>
    </ul>
  </div>

  <span class="anchor" id="related-reading"></span>

  <h2><span class="lang-en">Two Starting Points</span><span class="lang-zh">两个相关起点</span></h2>

  <ul>
    <li><span class="lang-en"><a href="https://bear.warrington.ufl.edu/brenner/mar7588/Papers/kahneman-klein-2009.pdf">Kahneman &amp; Klein (2009), Conditions for Intuitive Expertise</a>: discusses how reliable intuition depends on learnable regularities and opportunities for effective feedback. It motivates the question about experience; it does not establish how to train scientific taste in LLMs.</span><span class="lang-zh"><a href="https://bear.warrington.ufl.edu/brenner/mar7588/Papers/kahneman-klein-2009.pdf">Kahneman 与 Klein（2009）：专家直觉的形成条件</a>：讨论可靠直觉与可学习的规律、有效反馈机会之间的关系。它启发了这里关于经验的问题，并未验证 LLM 科研判断的训练方法。</span></li>
    <li><span class="lang-en"><a href="https://arxiv.org/html/2603.14473v3">AI Can Learn Scientific Taste (2026, v3)</a>: uses citation-based community feedback to train a scientific judge and then guide idea generation. Building on this line of inquiry, I want to test whether learning from decisions and revisions improves research resource allocation before outcomes are known.</span><span class="lang-zh"><a href="https://arxiv.org/html/2603.14473v3">AI Can Learn Scientific Taste（2026，v3）</a>：利用基于引用的社区反馈训练科学评价模型，再指导想法生成。沿着这一问题，我更想检验从决策与修正经历中学习，能否改善结果未知时的研究资源分配。</span></li>
  </ul>

  <div class="research-discussion">
    <div>
      <small><span class="lang-en">Open for discussion</span><span class="lang-zh">欢迎讨论</span></small>
      <h2><span class="lang-en">These notes are still provisional.</span><span class="lang-zh">这些想法仍在形成。</span></h2>
      <p class="lang-en">I would especially welcome research histories that changed someone's judgment, failures that overturned a plausible idea, and cases where optimizing short-term feedback harmed later choices. They could help clarify which experiences improve research taste and where this framing breaks down.</p>
      <p class="lang-zh">我尤其希望讨论那些改变了研究者判断的经历、推翻合理想法的失败，以及优化短期反馈反而损害后续选择的案例。它们可能帮助澄清哪些经验能改善研究判断，以及这套表述在哪里不成立。</p>
    </div>
    <a href="mailto:{{ site.author.email }}"><i class="fas fa-comment-dots" aria-hidden="true"></i><span class="lang-en">Discuss by email</span><span class="lang-zh">邮件讨论</span></a>
  </div>
</div>
