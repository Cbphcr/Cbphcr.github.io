(function () {
  "use strict";

  function currentLanguage() {
    return document.documentElement.getAttribute("data-lang") === "zh" ? "zh" : "en";
  }

  function setupAvatarEasterEgg() {
    var avatar = document.querySelector("[data-avatar-easter]");
    var toast = document.querySelector("[data-achievement-toast]");
    if (!avatar || !toast) { return; }

    var taps = 0;
    var tapTimer;
    var resetTimer;

    function unlock() {
      taps = 0;
      window.clearTimeout(tapTimer);
      window.clearTimeout(resetTimer);
      avatar.classList.remove("is-unlocked");
      toast.hidden = false;
      window.requestAnimationFrame(function () {
        avatar.classList.add("is-unlocked");
        toast.classList.add("is-visible");
      });
      resetTimer = window.setTimeout(function () {
        avatar.classList.remove("is-unlocked");
        toast.classList.remove("is-visible");
        window.setTimeout(function () { toast.hidden = true; }, 260);
      }, 4200);
    }

    avatar.addEventListener("click", function (event) {
      if (event.detail >= 3) {
        unlock();
        return;
      }
      taps += 1;
      window.clearTimeout(tapTimer);
      if (taps >= 3) {
        unlock();
        return;
      }
      tapTimer = window.setTimeout(function () { taps = 0; }, 650);
    });

    document.addEventListener("avatar:unlock", unlock);
  }

  function setupInterestFilters() {
    var filters = Array.prototype.slice.call(document.querySelectorAll("[data-interest-filter]"));
    var cards = Array.prototype.slice.call(document.querySelectorAll(".publication-item, .project-card"));
    if (!filters.length || !cards.length) { return; }

    var active = null;

    function applyFilter(next) {
      active = active === next ? null : next;
      filters.forEach(function (filter) {
        var selected = filter.dataset.interestFilter === active;
        filter.classList.toggle("is-active", selected);
        filter.setAttribute("aria-pressed", selected ? "true" : "false");
      });
      cards.forEach(function (card) {
        var matches = !active || card.querySelector(".paper-interests .interest-tag--" + active);
        card.classList.toggle("is-interest-muted", !matches);
      });
    }

    filters.forEach(function (filter) {
      filter.addEventListener("click", function () { applyFilter(filter.dataset.interestFilter); });
    });
  }

  function setupCommandPalette() {
    var palette = document.querySelector("[data-command-palette]");
    if (!palette) { return; }

    var input = palette.querySelector(".command-palette__input");
    var results = palette.querySelector(".command-palette__results");
    var toggles = document.querySelectorAll(".command-toggle");
    var previousFocus = null;
    var activeIndex = 0;
    var visibleItems = [];

    function cleanText(node) {
      if (!node) { return ""; }
      var localized = node.querySelector(".lang-" + currentLanguage());
      return (localized || node).textContent.replace(/\s+/g, " ").trim();
    }

    function collectItems() {
      var items = [];
      var seen = {};

      document.querySelectorAll(".page__content .anchor[id]").forEach(function (anchor) {
        var heading = anchor.nextElementSibling;
        if (!heading || !/^H[1-3]$/.test(heading.tagName)) { return; }
        var href = "#" + anchor.id;
        items.push({ title: cleanText(heading), href: href, type: "section" });
        seen[href] = true;
      });

      document.querySelectorAll(".publication-item h3 a, .project-card h3 a").forEach(function (link) {
        var href = link.getAttribute("href");
        if (!href || seen[href]) { return; }
        items.push({
          title: cleanText(link),
          href: href,
          type: link.closest(".publication-item") ? "paper" : "project"
        });
        seen[href] = true;
      });

      [
        {
          title: currentLanguage() === "zh" ? "研究问题与经验闭环" : "Research questions and the experience loop",
          href: "/research/",
          type: "section",
          keywords: "research vision experience environment evaluation attribution learning rsi 研究 问题 经验 环境 评价 归因 学习"
        },
        { title: "GitHub · Cbphcr", href: "https://github.com/Cbphcr", type: "profile" },
        { title: "Google Scholar", href: "https://scholar.google.com/citations?user=_NHh89YAAAAJ&hl=en", type: "profile" },
        {
          title: currentLanguage() === "zh" ? "解锁拜仁头像模式" : "Unlock Bayern avatar mode",
          href: "#",
          type: "command",
          action: "avatar",
          keywords: "bayern usagi mia san mia 拜仁 兔子"
        },
        {
          title: currentLanguage() === "zh" ? "打开行程约束挑战" : "Open the constraint challenge",
          href: "/404.html",
          type: "command",
          keywords: "travel constraint chinatravel trip 行程 约束"
        },
        {
          title: currentLanguage() === "zh" ? "打开 Agent Harness Lab" : "Open Agent Harness Lab",
          href: "#",
          type: "command",
          action: "workflow",
          keywords: "/automate automate workflow lab rsi recursive self-improvement harness 自动化 工作流 递归式自我改进 实验室"
        }
      ].forEach(function (item) {
        if (!seen[item.href]) { items.push(item); }
      });

      return items;
    }

    var allItems = collectItems();

    function typeLabel(type) {
      var labels = {
        en: { section: "Section", paper: "Paper", project: "Project", profile: "Profile", command: "Command" },
        zh: { section: "章节", paper: "论文", project: "项目", profile: "主页", command: "命令" }
      };
      return labels[currentLanguage()][type];
    }

    function score(item, query) {
      var title = (item.title + " " + (item.keywords || "")).toLowerCase();
      if (!query) { return item.type === "command" ? -1 : (item.type === "section" ? 2 : 1); }
      if (item.type === "command" && title.indexOf(query) !== -1) { return 80; }
      if (title === query) { return 100; }
      if (title.indexOf(query) === 0) { return 50; }
      if (title.indexOf(query) !== -1) { return 20; }
      var words = query.split(/\s+/);
      return words.every(function (word) { return title.indexOf(word) !== -1; }) ? 10 : -1;
    }

    function render() {
      var query = input.value.trim().toLowerCase();
      visibleItems = allItems
        .map(function (item, order) { return { item: item, rank: score(item, query), order: order }; })
        .filter(function (entry) { return entry.rank >= 0; })
        .sort(function (a, b) { return b.rank - a.rank || a.order - b.order; })
        .slice(0, 8)
        .map(function (entry) { return entry.item; });

      activeIndex = Math.min(activeIndex, Math.max(visibleItems.length - 1, 0));
      results.innerHTML = "";

      if (!visibleItems.length) {
        var empty = document.createElement("p");
        empty.className = "command-palette__empty";
        empty.textContent = currentLanguage() === "zh" ? "没有找到匹配内容" : "No matching results";
        results.appendChild(empty);
        return;
      }

      visibleItems.forEach(function (item, index) {
        var link = document.createElement("a");
        link.className = "command-result" + (index === activeIndex ? " is-active" : "");
        link.href = item.href;
        link.setAttribute("role", "option");
        link.setAttribute("aria-selected", index === activeIndex ? "true" : "false");
        link.dataset.index = index;

        var icon = document.createElement("i");
        icon.className = "fas " + ({ section: "fa-hashtag", paper: "fa-file-alt", project: "fa-code-branch", profile: "fa-user", command: "fa-terminal" }[item.type]);
        icon.setAttribute("aria-hidden", "true");

        var title = document.createElement("span");
        title.className = "command-result__title";
        title.textContent = item.title;

        var kind = document.createElement("span");
        kind.className = "command-result__type";
        kind.textContent = typeLabel(item.type);

        link.appendChild(icon);
        link.appendChild(title);
        link.appendChild(kind);
        results.appendChild(link);
      });
    }

    function updateActive(nextIndex) {
      if (!visibleItems.length) { return; }
      activeIndex = (nextIndex + visibleItems.length) % visibleItems.length;
      results.querySelectorAll(".command-result").forEach(function (item, index) {
        var active = index === activeIndex;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", active ? "true" : "false");
        if (active) { item.scrollIntoView({ block: "nearest" }); }
      });
    }

    function openPalette() {
      previousFocus = document.activeElement;
      allItems = collectItems();
      palette.hidden = false;
      document.body.classList.add("command-palette-open");
      input.placeholder = input.getAttribute("data-placeholder-" + currentLanguage());
      input.value = "";
      activeIndex = 0;
      render();
      window.requestAnimationFrame(function () {
        palette.classList.add("is-open");
        input.focus();
      });
    }

    function closePalette() {
      palette.classList.remove("is-open");
      document.body.classList.remove("command-palette-open");
      window.setTimeout(function () {
        palette.hidden = true;
        if (previousFocus && previousFocus.focus) { previousFocus.focus(); }
      }, 180);
    }

    function activateItem(item) {
      if (!item) { return; }
      if (item.action === "avatar") {
        closePalette();
        var avatar = document.querySelector("[data-avatar-easter]");
        if (avatar) {
          var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          avatar.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
          window.setTimeout(function () { document.dispatchEvent(new CustomEvent("avatar:unlock")); }, reduced ? 0 : 260);
        }
        return;
      }
      if (item.action === "workflow") {
        closePalette();
        window.setTimeout(function () {
          document.dispatchEvent(new CustomEvent("workflow:open"));
        }, 190);
        return;
      }
      closePalette();
      window.location.href = item.href;
    }

    toggles.forEach(function (toggle) {
      toggle.addEventListener("click", function (event) {
        event.preventDefault();
        openPalette();
      });
    });

    palette.addEventListener("click", function (event) {
      if (event.target.closest("[data-command-close]")) { closePalette(); }
      var result = event.target.closest(".command-result");
      if (result) {
        event.preventDefault();
        activateItem(visibleItems[Number(result.dataset.index)]);
      }
    });

    results.addEventListener("mousemove", function (event) {
      var result = event.target.closest(".command-result");
      if (result) { updateActive(Number(result.dataset.index)); }
    });

    input.addEventListener("input", function () {
      activeIndex = 0;
      render();
    });

    document.addEventListener("keydown", function (event) {
      var inputLike = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) || event.target.isContentEditable;
      if (event.key === "/" && !inputLike && palette.hidden) {
        event.preventDefault();
        openPalette();
        return;
      }
      if (palette.hidden) { return; }
      if (event.key === "Escape") { event.preventDefault(); closePalette(); }
      if (event.key === "ArrowDown") { event.preventDefault(); updateActive(activeIndex + 1); }
      if (event.key === "ArrowUp") { event.preventDefault(); updateActive(activeIndex - 1); }
      if (event.key === "Enter" && visibleItems[activeIndex]) {
        event.preventDefault();
        activateItem(visibleItems[activeIndex]);
      }
    });
  }

  function setupWorkflowLab() {
    var lab = document.querySelector("[data-workflow-lab]");
    if (!lab) { return; }

    var dialog = lab.querySelector(".workflow-lab__dialog");
    var openButtons = document.querySelectorAll("[data-workflow-open]");
    var taskButtons = Array.prototype.slice.call(lab.querySelectorAll("[data-workflow-task]"));
    var taskGroup = lab.querySelector(".workflow-lab__task-options");
    var closeButton = lab.querySelector(".workflow-lab__close");
    var taskPrompt = lab.querySelector("[data-workflow-task-prompt]");
    var strategyIcon = lab.querySelector("[data-workflow-strategy-icon]");
    var strategyTitle = lab.querySelector("[data-workflow-strategy-title]");
    var strategyPath = lab.querySelector("[data-workflow-strategy-path]");
    var rounds = lab.querySelector("[data-workflow-rounds]");
    var status = lab.querySelector("[data-workflow-status]");
    var runButton = lab.querySelector("[data-workflow-run]");
    var exceptionButton = lab.querySelector("[data-workflow-exception]");
    var result = lab.querySelector("[data-workflow-result]");
    var resultTitle = lab.querySelector("[data-workflow-result-title]");
    var resultIcon = lab.querySelector("[data-workflow-result-icon]");
    var harnessStatus = lab.querySelector("[data-workflow-harness]");
    var verifierStatus = lab.querySelector("[data-workflow-verifier]");
    var recoveryStatus = lab.querySelector("[data-workflow-recovery]");
    var resultLabel = lab.querySelector("[data-workflow-result-label]");
    var resultButton = lab.querySelector("[data-workflow-open-result]");
    var selectedTask = "planning";
    var previousFocus = null;
    var timers = [];
    var completed = false;
    var exceptionInjected = false;

    var tasks = {
      planning: {
        theme: "planning",
        prompt: { en: "Plan a multi-day trip under open-ended constraints", zh: "在开放式约束下规划多日行程" },
        strategy: {
          icon: "fa-map-marked-alt",
          title: { en: "Build a verifiable planner", zh: "构建可验证的规划器" },
          path: { en: "task → harness → plan → verify → repair", zh: "任务 → harness → 规划 → 验证 → 修复" }
        },
        resultLabel: { en: "Related work", zh: "相关工作" },
        resultKind: "work",
        resultIcon: "fa-check-circle",
        result: {
          en: "ChinaTravel: An Open-Ended Travel Planning Benchmark with Compositional Constraint Validation for Language Agents",
          zh: "ChinaTravel：面向语言智能体的开放式旅行规划基准"
        },
        target: "ChinaTravel:",
        interest: "nesy",
        signals: {
          harness: { en: "Built", zh: "已构建" },
          verifier: { en: "Attached", zh: "已接入" },
          recovery: { en: "Standby", zh: "待命" }
        },
        rounds: [
          {
            number: "01",
            title: { en: "Understand", zh: "理解任务" },
            note: { en: "Turn language into checks", zh: "将自然语言转为检查项" },
            steps: [
              { en: "Inspect resources", zh: "检查可用资源", kind: "source" },
              { en: "Extract constraints", zh: "抽取约束", kind: "model" },
              { en: "Formalize checks", zh: "形式化检查项", kind: "auto" },
              { en: "Choose tools", zh: "选择工具", kind: "decision" }
            ]
          },
          {
            number: "02",
            title: { en: "Execute", zh: "执行规划" },
            note: { en: "Use the constructed harness", zh: "运行已构建的 harness" },
            steps: [
              { en: "Retrieve POIs", zh: "检索地点", kind: "source" },
              { en: "Compose itinerary", zh: "生成行程", kind: "model" },
              { en: "Simulate route", zh: "模拟路线", kind: "auto" },
              { en: "Verify constraints", zh: "验证约束", kind: "verify" }
            ]
          },
          {
            number: "03",
            title: { en: "Control", zh: "控制流程" },
            note: { en: "Inspect only when needed", zh: "仅在必要时介入" },
            steps: [
              { en: "Inspect failures", zh: "检查失败项", kind: "decision" },
              { en: "Repair plan", zh: "修复方案", kind: "model" },
              { en: "Re-run tools", zh: "重运行工具", kind: "auto" },
              { en: "Final gate", zh: "最终门控", kind: "verify" }
            ]
          }
        ],
        exception: {
          title: { en: "Runtime repair", zh: "运行时修复" },
          note: { en: "A hidden preference appears", zh: "发现隐含偏好" },
          status: { en: "Harness repaired", zh: "Harness 已修复" },
          signals: {
            harness: { en: "Patched", zh: "已更新" },
            verifier: { en: "Re-checked", zh: "已复核" },
            recovery: { en: "Triggered", zh: "已触发" }
          },
          steps: [
            { en: "Hidden preference", zh: "隐含偏好", kind: "error" },
            { en: "Ask one question", zh: "追问一次", kind: "model" },
            { en: "Patch verifier", zh: "更新验证器", kind: "auto" },
            { en: "Replay affected stage", zh: "重放受影响阶段", kind: "verify" }
          ]
        }
      },
      credit: {
        theme: "credit",
        prompt: { en: "Learn which tokens deserve credit from one scalar reward", zh: "从单一标量奖励中学习 token 级信用" },
        strategy: {
          icon: "fa-coins",
          title: { en: "Counterfactual credit harness", zh: "反事实信用分配 harness" },
          path: { en: "rubric → replay → contrast → token credit", zh: "rubric → 回放 → 对比 → token 信用" }
        },
        resultLabel: { en: "Related work", zh: "相关工作" },
        resultKind: "work",
        resultIcon: "fa-check-circle",
        result: {
          en: "CoRT: Counterfactual Replay for Token-Level Rubric-Guided Policy Optimization",
          zh: "CoRT：面向 token 级 Rubric 引导策略优化的反事实回放"
        },
        target: "CoRT:",
        interest: "rl",
        signals: {
          harness: { en: "Replay built", zh: "回放已构建" },
          verifier: { en: "Rubric checked", zh: "Rubric 已检查" },
          recovery: { en: "Standby", zh: "待命" }
        },
        rounds: [
          {
            number: "01",
            title: { en: "Define feedback", zh: "定义反馈" },
            note: { en: "Make sparse reward inspectable", zh: "让稀疏奖励可检查" },
            steps: [
              { en: "Read rubric", zh: "读取 Rubric", kind: "model" },
              { en: "Compile criteria", zh: "编译评价标准", kind: "auto" },
              { en: "Check response", zh: "检查回答", kind: "verify" }
            ]
          },
          {
            number: "02",
            title: { en: "Replay", zh: "反事实回放" },
            note: { en: "Hold the response fixed", zh: "固定同一回答" },
            steps: [
              { en: "Remove one criterion", zh: "移除一个标准", kind: "decision" },
              { en: "Replay response", zh: "回放同一回答", kind: "auto" },
              { en: "Compare log-probs", zh: "比较对数概率", kind: "verify" },
              { en: "Map contrast", zh: "映射差异", kind: "auto" }
            ]
          },
          {
            number: "03",
            title: { en: "Optimize", zh: "策略优化" },
            note: { en: "Turn contrast into dense credit", zh: "将差异转为稠密信用" },
            steps: [
              { en: "Normalize weights", zh: "归一化权重", kind: "auto" },
              { en: "Redistribute advantage", zh: "重分配优势", kind: "auto" },
              { en: "Update policy", zh: "更新策略", kind: "model" },
              { en: "Check objective", zh: "检查目标函数", kind: "verify" }
            ]
          }
        ],
        exception: {
          title: { en: "Credit repair", zh: "信用修复" },
          note: { en: "Counterfactual contrast is unstable", zh: "反事实差异不稳定" },
          status: { en: "Credit path stabilized", zh: "信用链路已稳定" },
          signals: {
            harness: { en: "Replay kept", zh: "回放已保留" },
            verifier: { en: "Re-checked", zh: "已复核" },
            recovery: { en: "Triggered", zh: "已触发" }
          },
          steps: [
            { en: "Unstable contrast", zh: "差异不稳定", kind: "error" },
            { en: "Inspect outliers", zh: "检查异常值", kind: "model" },
            { en: "Bound weights", zh: "约束权重", kind: "auto" },
            { en: "Re-check objective", zh: "重新检查目标", kind: "verify" }
          ]
        }
      },
      adapt: {
        theme: "adapt",
        prompt: { en: "Solve a new task without a hand-written workflow", zh: "在没有人工工作流的情况下解决新任务" },
        strategy: {
          icon: "fa-code-branch",
          title: { en: "Self-constructed task harness", zh: "自主构建任务 harness" },
          path: { en: "inspect → build tools → monitor → revise", zh: "检查 → 构建工具 → 监控 → 修订" }
        },
        resultLabel: { en: "Research direction", zh: "研究方向" },
        resultKind: "vision",
        resultIcon: "fa-compass",
        result: {
          en: "Toward self-improving task harnesses",
          zh: "走向可自我改进的任务 Harness"
        },
        target: null,
        interest: null,
        signals: {
          harness: { en: "Assembled", zh: "已组装" },
          verifier: { en: "Monitoring", zh: "监控中" },
          recovery: { en: "Standby", zh: "待命" }
        },
        rounds: [
          {
            number: "01",
            title: { en: "Inspect", zh: "检查环境" },
            note: { en: "Understand task and resources", zh: "理解任务与可用资源" },
            steps: [
              { en: "Parse task", zh: "解析任务", kind: "model" },
              { en: "Inventory resources", zh: "盘点资源", kind: "source" },
              { en: "Identify gaps", zh: "识别能力缺口", kind: "decision" },
              { en: "Define checks", zh: "定义检查项", kind: "verify" }
            ]
          },
          {
            number: "02",
            title: { en: "Build", zh: "构建 Harness" },
            note: { en: "Create only what the task needs", zh: "只构建任务所需组件" },
            steps: [
              { en: "Write tools", zh: "编写工具", kind: "model" },
              { en: "Test sandbox", zh: "测试沙盒", kind: "verify" },
              { en: "Compose workflow", zh: "组合工作流", kind: "auto" },
              { en: "Set stop conditions", zh: "设置停止条件", kind: "decision" }
            ]
          },
          {
            number: "03",
            title: { en: "Operate", zh: "运行与改进" },
            note: { en: "Automate, inspect, and revise", zh: "自动化、检查并修订" },
            steps: [
              { en: "Run workflow", zh: "运行工作流", kind: "auto" },
              { en: "Inspect uncertainty", zh: "检查不确定性", kind: "model" },
              { en: "Verify outputs", zh: "验证输出", kind: "verify" },
              { en: "Revise harness", zh: "修订 Harness", kind: "decision" }
            ]
          }
        ],
        exception: {
          title: { en: "Harness recovery", zh: "Harness 恢复" },
          note: { en: "A generated tool fails", zh: "生成的工具发生故障" },
          status: { en: "Harness reconfigured", zh: "Harness 已重新配置" },
          signals: {
            harness: { en: "Reconfigured", zh: "已重构" },
            verifier: { en: "Re-checked", zh: "已复核" },
            recovery: { en: "Triggered", zh: "已触发" }
          },
          steps: [
            { en: "Tool failure", zh: "工具故障", kind: "error" },
            { en: "Localize cause", zh: "定位原因", kind: "model" },
            { en: "Patch or replace", zh: "修补或替换", kind: "auto" },
            { en: "Replay affected stage", zh: "重放受影响阶段", kind: "verify" }
          ]
        }
      }
    };

    function setLocalizedText(node, en, zh) {
      node.innerHTML = "";
      var enNode = document.createElement("span");
      var zhNode = document.createElement("span");
      enNode.className = "lang-en";
      zhNode.className = "lang-zh";
      enNode.textContent = en;
      zhNode.textContent = zh;
      node.appendChild(enNode);
      node.appendChild(zhNode);
    }

    function updateAriaLabels() {
      var zh = currentLanguage() === "zh";
      closeButton.setAttribute("aria-label", zh ? "关闭 Agent Harness Lab" : "Close Agent Harness Lab");
      taskGroup.setAttribute("aria-label", zh ? "Harness 场景" : "Harness scenario");
      resultButton.setAttribute("aria-label", zh ? "打开相关论文" : "Open related paper");
      resultButton.setAttribute("title", zh ? "打开相关论文" : "Open related paper");
      rounds.querySelectorAll(".workflow-round__nodes").forEach(function (node) {
        node.setAttribute("aria-label", zh ? node.dataset.ariaZh : node.dataset.ariaEn);
      });
    }

    function clearTimers() {
      timers.forEach(function (timer) { window.clearTimeout(timer); });
      timers = [];
    }

    function schedule(callback, delay) {
      var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var timer = window.setTimeout(callback, reduced ? 0 : delay);
      timers.push(timer);
    }

    function createNode(step, roundIndex) {
      var node = document.createElement("span");
      node.className = "workflow-node workflow-node--" + step.kind + " is-pending";
      node.dataset.workflowNode = "";
      node.dataset.workflowRound = String(roundIndex);

      var icon = document.createElement("i");
      var icons = {
        model: "fa-brain",
        auto: "fa-cog",
        source: "fa-database",
        verify: "fa-check-circle",
        decision: "fa-code-branch",
        error: "fa-exclamation-triangle"
      };
      icon.className = "fas " + icons[step.kind];
      icon.setAttribute("aria-hidden", "true");
      node.appendChild(icon);

      var label = document.createElement("span");
      setLocalizedText(label, step.en, step.zh);
      node.appendChild(label);
      return node;
    }

    function createRoundRow(definition, roundIndex, isException) {
      var row = document.createElement("div");
      row.className = "workflow-round" + (isException ? " workflow-round--exception" : "");
      row.dataset.workflowRoundRow = String(roundIndex);

      var label = document.createElement("div");
      label.className = "workflow-round__label";
      var number = document.createElement("span");
      number.textContent = definition.number;
      var copy = document.createElement("div");
      var title = document.createElement("strong");
      var note = document.createElement("small");
      setLocalizedText(title, definition.title.en, definition.title.zh);
      setLocalizedText(note, definition.note.en, definition.note.zh);
      copy.appendChild(title);
      copy.appendChild(note);
      label.appendChild(number);
      label.appendChild(copy);

      var nodes = document.createElement("div");
      nodes.className = "workflow-round__nodes";
      nodes.tabIndex = 0;
      nodes.dataset.ariaEn = definition.title.en + " workflow steps";
      nodes.dataset.ariaZh = definition.title.zh + "步骤";
      definition.steps.forEach(function (step, index) {
        if (index > 0) {
          var arrow = document.createElement("i");
          arrow.className = "fas fa-long-arrow-alt-right workflow-round__arrow" + (isException ? " workflow-exception-node" : "");
          arrow.setAttribute("aria-hidden", "true");
          nodes.appendChild(arrow);
        }
        var node = createNode(step, roundIndex);
        if (isException) { node.classList.add("workflow-exception-node"); }
        nodes.appendChild(node);
      });

      row.appendChild(label);
      row.appendChild(nodes);
      return row;
    }

    function renderRounds() {
      var task = tasks[selectedTask];
      rounds.innerHTML = "";
      task.rounds.forEach(function (definition, roundIndex) {
        rounds.appendChild(createRoundRow(definition, roundIndex, false));
      });
      updateAriaLabels();
    }

    function resetDemo() {
      var task = tasks[selectedTask];
      clearTimers();
      completed = false;
      exceptionInjected = false;
      runButton.disabled = false;
      exceptionButton.disabled = true;
      result.hidden = true;
      resultButton.hidden = !task.target;
      result.classList.toggle("is-vision", task.resultKind === "vision");
      resultIcon.className = "fas " + task.resultIcon;
      setLocalizedText(harnessStatus, "Pending", "待构建");
      setLocalizedText(verifierStatus, "Pending", "待接入");
      setLocalizedText(recoveryStatus, "Standby", "待命");
      setLocalizedText(status, "Ready", "就绪");
      setLocalizedText(taskPrompt, task.prompt.en, task.prompt.zh);
      setLocalizedText(strategyTitle, task.strategy.title.en, task.strategy.title.zh);
      setLocalizedText(strategyPath, task.strategy.path.en, task.strategy.path.zh);
      strategyIcon.className = "fas " + task.strategy.icon;
      lab.dataset.workflowTheme = task.theme;
      renderRounds();
    }

    function activateRound(roundIndex) {
      var task = tasks[selectedTask];
      rounds.querySelectorAll("[data-workflow-round-row]").forEach(function (row, index) {
        row.classList.toggle("is-current", index === roundIndex);
        row.classList.toggle("is-complete", index < roundIndex);
      });
      var phase = task.rounds[roundIndex].title;
      setLocalizedText(status, "Running: " + phase.en, "运行中：" + phase.zh);
    }

    function runDemo() {
      var task = tasks[selectedTask];
      resetDemo();
      runButton.disabled = true;
      setLocalizedText(status, "Playing scenario", "正在播放场景");
      var nodes = Array.prototype.slice.call(rounds.querySelectorAll("[data-workflow-node]"));
      var activeRound = -1;

      nodes.forEach(function (node, index) {
        schedule(function () {
          var previous = rounds.querySelector(".workflow-node.is-active");
          if (previous) {
            previous.classList.remove("is-active");
            previous.classList.add("is-complete");
          }
          var roundIndex = Number(node.dataset.workflowRound);
          if (roundIndex !== activeRound) {
            activeRound = roundIndex;
            activateRound(roundIndex);
          }
          node.classList.remove("is-pending");
          node.classList.add("is-active");
        }, 140 + index * 135);
      });

      schedule(function () {
        var active = rounds.querySelector(".workflow-node.is-active");
        if (active) {
          active.classList.remove("is-active");
          active.classList.add("is-complete");
        }
        completed = true;
        runButton.disabled = false;
        exceptionButton.disabled = false;
        rounds.querySelectorAll("[data-workflow-round-row]").forEach(function (row) {
          row.classList.remove("is-current");
          row.classList.add("is-complete");
        });
        setLocalizedText(harnessStatus, task.signals.harness.en, task.signals.harness.zh);
        setLocalizedText(verifierStatus, task.signals.verifier.en, task.signals.verifier.zh);
        setLocalizedText(recoveryStatus, task.signals.recovery.en, task.signals.recovery.zh);
        setLocalizedText(status, "Harness ready", "Harness 已就绪");
        setLocalizedText(resultLabel, task.resultLabel.en, task.resultLabel.zh);
        setLocalizedText(resultTitle, task.result.en, task.result.zh);
        result.hidden = false;
      }, 250 + nodes.length * 135);
    }

    function injectException() {
      if (!completed || exceptionInjected) { return; }
      var task = tasks[selectedTask];
      exceptionInjected = true;
      exceptionButton.disabled = true;
      setLocalizedText(status, "Exception detected", "检测到异常");

      var exceptionSteps = task.exception.steps;
      var lastRoundIndex = task.rounds.length - 1;
      rounds.querySelectorAll("[data-workflow-round-row]").forEach(function (row) {
        row.classList.remove("is-current");
        row.classList.add("is-complete");
      });
      var recovery = {
        number: "EX",
        title: task.exception.title,
        note: task.exception.note,
        steps: exceptionSteps
      };
      var lastRow = createRoundRow(recovery, lastRoundIndex, true);
      var lastRound = lastRow.querySelector(".workflow-round__nodes");
      lastRow.classList.add("is-current");
      rounds.appendChild(lastRow);
      updateAriaLabels();

      schedule(function () {
        var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        lastRound.scrollTo({ left: lastRound.scrollWidth, behavior: reduced ? "auto" : "smooth" });
      }, 40);

      var nodes = Array.prototype.slice.call(lastRound.querySelectorAll(".workflow-exception-node[data-workflow-node]"));
      nodes.forEach(function (node, index) {
        schedule(function () {
          var previous = lastRound.querySelector(".workflow-node.is-active");
          if (previous) {
            previous.classList.remove("is-active");
            previous.classList.add("is-complete");
          }
          node.classList.remove("is-pending");
          node.classList.add("is-active");
        }, 120 + index * 360);
      });

      schedule(function () {
        var active = lastRound.querySelector(".workflow-node.is-active");
        if (active) {
          active.classList.remove("is-active");
          active.classList.add("is-complete");
        }
        lastRow.classList.remove("is-current");
        lastRow.classList.add("is-complete");
        setLocalizedText(harnessStatus, task.exception.signals.harness.en, task.exception.signals.harness.zh);
        setLocalizedText(verifierStatus, task.exception.signals.verifier.en, task.exception.signals.verifier.zh);
        setLocalizedText(recoveryStatus, task.exception.signals.recovery.en, task.exception.signals.recovery.zh);
        setLocalizedText(status, task.exception.status.en, task.exception.status.zh);
      }, 220 + nodes.length * 320);
    }

    function openLab() {
      previousFocus = document.activeElement;
      lab.hidden = false;
      document.body.classList.add("workflow-lab-open");
      resetDemo();
      window.requestAnimationFrame(function () {
        lab.classList.add("is-open");
        runButton.focus();
      });
    }

    function closeLab() {
      clearTimers();
      lab.classList.remove("is-open");
      document.body.classList.remove("workflow-lab-open");
      window.setTimeout(function () {
        lab.hidden = true;
        if (previousFocus && previousFocus.focus) { previousFocus.focus(); }
      }, 190);
    }

    function openResult() {
      var task = tasks[selectedTask];
      if (!task.target) { return; }
      var targetLink = Array.prototype.slice.call(document.querySelectorAll(".publication-item h3 a")).find(function (link) {
        return link.textContent.indexOf(task.target) !== -1;
      });
      if (!targetLink) { return; }

      var filter = document.querySelector('[data-interest-filter="' + task.interest + '"]');
      if (filter && filter.getAttribute("aria-pressed") !== "true") { filter.click(); }
      var card = targetLink.closest(".publication-item");
      closeLab();
      window.setTimeout(function () {
        var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        card.classList.add("is-workflow-match");
        card.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
        targetLink.focus({ preventScroll: true });
        window.setTimeout(function () { card.classList.remove("is-workflow-match"); }, reduced ? 800 : 3200);
      }, 220);
    }

    taskButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        selectedTask = button.dataset.workflowTask;
        taskButtons.forEach(function (item) {
          var selected = item === button;
          item.classList.toggle("is-active", selected);
          item.setAttribute("aria-pressed", selected ? "true" : "false");
        });
        resetDemo();
      });
    });

    openButtons.forEach(function (button) { button.addEventListener("click", openLab); });
    document.addEventListener("workflow:open", openLab);
    runButton.addEventListener("click", runDemo);
    exceptionButton.addEventListener("click", injectException);
    resultButton.addEventListener("click", openResult);

    lab.addEventListener("click", function (event) {
      if (event.target.closest("[data-workflow-close]")) { closeLab(); }
    });

    document.addEventListener("keydown", function (event) {
      if (lab.hidden) { return; }
      if (event.key === "Escape") {
        event.preventDefault();
        closeLab();
        return;
      }
      if (event.key === "Tab") {
        var focusable = Array.prototype.slice.call(dialog.querySelectorAll("button:not([disabled]):not([hidden])"));
        if (!focusable.length) { return; }
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    document.addEventListener("click", function (event) {
      if (event.target.closest(".lang-toggle") && !lab.hidden) {
        window.setTimeout(function () {
          setLocalizedText(taskPrompt, tasks[selectedTask].prompt.en, tasks[selectedTask].prompt.zh);
          updateAriaLabels();
        }, 0);
      }
    });

    taskButtons[0].classList.add("is-active");
    resetDemo();
  }

  function setupTravelGame() {
    var game = document.querySelector("[data-travel-game]");
    if (!game) { return; }

    var stopButtons = Array.prototype.slice.call(game.querySelectorAll("[data-stop-id]"));
    var selected = [];
    var route = game.querySelector("[data-game-route]");
    var result = game.querySelector("[data-game-result]");
    var status = game.querySelector("[data-game-status]");

    function stopName(button) {
      var selector = currentLanguage() === "zh" ? ".lang-zh" : ".lang-en";
      var label = button.querySelector("strong " + selector);
      return label ? label.textContent.trim() : button.dataset.stopId;
    }

    function totals() {
      var hours = selected.reduce(function (sum, button) { return sum + Number(button.dataset.hours); }, 0);
      var cost = selected.reduce(function (sum, button) { return sum + Number(button.dataset.cost); }, 0);
      var transfers = Math.max(selected.length - 1, 0) * 0.5;
      return { hours: hours + transfers, cost: cost };
    }

    function checks() {
      var summary = totals();
      var tags = selected.reduce(function (all, button) { return all.concat(button.dataset.tags.split(/\s+/)); }, []);
      return {
        count: selected.length === 3,
        culture: tags.indexOf("culture") !== -1,
        food: tags.indexOf("food") !== -1,
        time: summary.hours <= 8,
        cost: summary.cost <= 120
      };
    }

    function renderRoute() {
      route.innerHTML = "";
      if (!selected.length) {
        var empty = document.createElement("span");
        empty.className = "travel-game__route-empty";
        empty.textContent = currentLanguage() === "zh" ? "从下方选择三个地点" : "Choose three stops below";
        route.appendChild(empty);
        return;
      }

      selected.forEach(function (button, index) {
        if (index > 0) {
          var arrow = document.createElement("i");
          arrow.className = "fas fa-long-arrow-alt-right";
          arrow.setAttribute("aria-hidden", "true");
          route.appendChild(arrow);
        }
        var stop = document.createElement("span");
        stop.className = "travel-game__route-stop";
        stop.textContent = stopName(button);
        route.appendChild(stop);
      });
    }

    function update() {
      var summary = totals();
      game.querySelector("[data-game-count]").textContent = selected.length + " / 3";
      game.querySelector("[data-game-time]").textContent = summary.hours.toFixed(1) + " h";
      game.querySelector("[data-game-cost]").textContent = "¥" + summary.cost;
      renderRoute();
      result.hidden = true;
      result.className = "travel-game__result";
      status.className = "travel-game__status";
      status.textContent = currentLanguage() === "zh" ? "规划中" : "Planning";
      game.querySelectorAll("[data-constraint]").forEach(function (item) {
        item.classList.remove("is-pass", "is-fail");
        item.querySelector("i").className = "fas fa-circle";
      });
    }

    stopButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        var index = selected.indexOf(button);
        if (index === -1) {
          selected.push(button);
          button.classList.add("is-selected");
          button.setAttribute("aria-pressed", "true");
        } else {
          selected.splice(index, 1);
          button.classList.remove("is-selected");
          button.setAttribute("aria-pressed", "false");
        }
        update();
      });
    });

    game.querySelector("[data-game-check]").addEventListener("click", function () {
      var verdicts = checks();
      var passed = Object.keys(verdicts).every(function (key) { return verdicts[key]; });

      Object.keys(verdicts).forEach(function (key) {
        var item = game.querySelector('[data-constraint="' + key + '"]');
        item.classList.add(verdicts[key] ? "is-pass" : "is-fail");
        item.querySelector("i").className = "fas " + (verdicts[key] ? "fa-check-circle" : "fa-times-circle");
      });

      result.hidden = false;
      result.classList.add(passed ? "is-success" : "is-error");
      status.classList.add(passed ? "is-success" : "is-error");
      if (passed) {
        status.textContent = currentLanguage() === "zh" ? "全部满足" : "All satisfied";
        result.innerHTML = currentLanguage() === "zh"
          ? '<strong>约束全部满足。</strong> Reviewer 2 暂无进一步问题。'
          : '<strong>All constraints satisfied.</strong> Reviewer 2 has no further questions.';
      } else {
        var failures = Object.keys(verdicts).filter(function (key) { return !verdicts[key]; }).length;
        status.textContent = currentLanguage() === "zh" ? "存在冲突" : "Conflicts found";
        result.innerHTML = currentLanguage() === "zh"
          ? '<strong>行程规划失败。</strong> Agent 违反了 ' + failures + ' 项约束，请继续调整。'
          : '<strong>Planning failed.</strong> The agent violated ' + failures + ' constraint' + (failures === 1 ? '' : 's') + '.';
      }
    });

    game.querySelector("[data-game-reset]").addEventListener("click", function () {
      selected = [];
      stopButtons.forEach(function (button) {
        button.classList.remove("is-selected");
        button.setAttribute("aria-pressed", "false");
      });
      update();
    });

    document.addEventListener("click", function (event) {
      if (event.target.closest(".lang-toggle")) { window.setTimeout(update, 0); }
    });

    update();
  }

  setupAvatarEasterEgg();
  setupInterestFilters();
  setupCommandPalette();
  setupWorkflowLab();
  setupTravelGame();
}());
