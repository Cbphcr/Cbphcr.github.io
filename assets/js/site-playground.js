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
          title: currentLanguage() === "zh" ? "打开工作流实验室" : "Open Workflow Lab",
          href: "#",
          type: "command",
          action: "workflow",
          keywords: "/automate automate workflow lab self-automating harness 自动化 工作流 实验室"
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
    var automatedMetric = lab.querySelector("[data-workflow-automated]");
    var modelMetric = lab.querySelector("[data-workflow-model]");
    var savingMetric = lab.querySelector("[data-workflow-saving]");
    var selectedTask = "constraints";
    var previousFocus = null;
    var timers = [];
    var completed = false;
    var exceptionInjected = false;

    var tasks = {
      constraints: {
        theme: "constraints",
        prompt: { en: "Find work on constraint verification", zh: "查找与约束验证相关的工作" },
        strategy: {
          icon: "fa-check-double",
          title: { en: "Constraint compiler", zh: "约束编译器" },
          path: { en: "Language → rules → plan → repair loop", zh: "语言 → 规则 → 规划 → 修复环" }
        },
        result: "ChinaTravel: An Open-Ended Travel Planning Benchmark with Compositional Constraint Validation for Language Agents",
        target: "ChinaTravel:",
        interest: "nesy",
        metrics: { automated: "8", model: "4", saving: "66%" },
        rounds: [
          {
            number: "01",
            title: { en: "Formalize", zh: "形式化" },
            note: { en: "Language to checks", zh: "自然语言转检查器" },
            steps: [
              { en: "Interpret request", zh: "理解请求", kind: "model" },
              { en: "Extract constraints", zh: "抽取约束", kind: "model" },
              { en: "Normalize slots", zh: "规范化槽位", kind: "auto" },
              { en: "Build verifier", zh: "构建验证器", kind: "auto" }
            ]
          },
          {
            number: "02",
            title: { en: "Plan", zh: "规划" },
            note: { en: "Candidate generation", zh: "生成候选方案" },
            steps: [
              { en: "Retrieve options", zh: "检索候选", kind: "source" },
              { en: "Compose plan", zh: "组合方案", kind: "model" },
              { en: "Simulate route", zh: "模拟行程", kind: "auto" },
              { en: "Score constraints", zh: "约束打分", kind: "verify" }
            ]
          },
          {
            number: "03",
            title: { en: "Repair loop", zh: "修复循环" },
            note: { en: "Validation-guided", zh: "验证反馈驱动" },
            steps: [
              { en: "Inspect violations", zh: "检查冲突", kind: "decision" },
              { en: "Repair plan", zh: "修复方案", kind: "model" },
              { en: "Re-check", zh: "重新验证", kind: "verify" },
              { en: "Present", zh: "返回结果", kind: "auto" }
            ]
          }
        ],
        exception: {
          title: { en: "Runtime repair", zh: "运行时修复" },
          note: { en: "Hidden preference", zh: "发现隐含偏好" },
          status: { en: "Validator patched", zh: "验证器已更新" },
          metrics: { automated: "10", model: "5", saving: "52%" },
          steps: [
            { en: "Implicit preference", zh: "隐含偏好", kind: "error" },
            { en: "Ask one question", zh: "追问一次", kind: "model" },
            { en: "Add rule", zh: "添加规则", kind: "auto" },
            { en: "Re-run", zh: "重新运行", kind: "verify" }
          ]
        }
      },
      award: {
        theme: "award",
        prompt: { en: "Find the award-winning paper", zh: "找到获得最佳学生论文奖的工作" },
        strategy: {
          icon: "fa-award",
          title: { en: "Evidence triangulation", zh: "多源证据三角验证" },
          path: { en: "Claim → sources → provenance gate", zh: "声明 → 多个来源 → 来源门控" }
        },
        result: "Mind the Gap to Trustworthy LLM Agents: A Systematic Evaluation on Constraint Satisfaction for Real-World Travel Planning",
        target: "Mind the Gap to Trustworthy",
        interest: "agents",
        metrics: { automated: "9", model: "2", saving: "78%" },
        rounds: [
          {
            number: "01",
            title: { en: "Scout", zh: "初步检索" },
            note: { en: "Ground the claim", zh: "定位获奖声明" },
            steps: [
              { en: "Parse award claim", zh: "解析获奖声明", kind: "model" },
              { en: "Search sources", zh: "检索来源", kind: "source" },
              { en: "Lock paper ID", zh: "锁定论文标识", kind: "verify" }
            ]
          },
          {
            number: "02",
            title: { en: "Triangulate", zh: "交叉验证" },
            note: { en: "Independent evidence", zh: "独立证据源" },
            steps: [
              { en: "OpenReview", zh: "OpenReview", kind: "source" },
              { en: "Workshop program", zh: "研讨会议程", kind: "source" },
              { en: "Award notice", zh: "获奖公告", kind: "source" },
              { en: "Compare metadata", zh: "比对元数据", kind: "auto" }
            ]
          },
          {
            number: "03",
            title: { en: "Verdict", zh: "形成结论" },
            note: { en: "Provenance first", zh: "来源优先" },
            steps: [
              { en: "Resolve wording", zh: "核定奖项表述", kind: "model" },
              { en: "Two-source gate", zh: "双来源门控", kind: "decision" },
              { en: "Build citation", zh: "生成引用", kind: "verify" },
              { en: "Present", zh: "返回结果", kind: "auto" }
            ]
          }
        ],
        exception: {
          title: { en: "Archive fallback", zh: "存档回退" },
          note: { en: "Source moved", zh: "证据来源已迁移" },
          status: { en: "Evidence path restored", zh: "证据链已恢复" },
          metrics: { automated: "11", model: "3", saving: "61%" },
          steps: [
            { en: "Notice moved", zh: "公告已迁移", kind: "error" },
            { en: "Fetch archive", zh: "读取网页存档", kind: "source" },
            { en: "Compare snapshot", zh: "比对历史快照", kind: "auto" },
            { en: "Confirm wording", zh: "确认奖项表述", kind: "model" }
          ]
        }
      },
      rl: {
        theme: "rl",
        prompt: { en: "Find the latest LLM RL work", zh: "查找最新的大模型强化学习工作" },
        strategy: {
          icon: "fa-sync-alt",
          title: { en: "Method & recency audit", zh: "方法与时效审计" },
          path: { en: "Retrieval → objective audit → version rank", zh: "检索 → 目标函数审计 → 版本排序" }
        },
        result: "CoRT: Counterfactual Replay for Token-Level Rubric-Guided Policy Optimization",
        target: "CoRT:",
        interest: "rl",
        metrics: { automated: "10", model: "3", saving: "74%" },
        rounds: [
          {
            number: "01",
            title: { en: "Recency pass", zh: "时效检索" },
            note: { en: "Define latest", zh: "定义“最新”" },
            steps: [
              { en: "Parse intent", zh: "解析意图", kind: "model" },
              { en: "Query indexes", zh: "查询论文索引", kind: "source" },
              { en: "Sort dates", zh: "按日期排序", kind: "auto" },
              { en: "Deduplicate", zh: "版本去重", kind: "auto" }
            ]
          },
          {
            number: "02",
            title: { en: "Method audit", zh: "方法审计" },
            note: { en: "RL, not prompting", zh: "区分 RL 与提示工程" },
            steps: [
              { en: "Read objective", zh: "读取目标函数", kind: "model" },
              { en: "Find policy update", zh: "确认策略更新", kind: "verify" },
              { en: "Locate rewards", zh: "定位奖励信号", kind: "auto" },
              { en: "Trace replay", zh: "追踪回放机制", kind: "auto" }
            ]
          },
          {
            number: "03",
            title: { en: "Rank & report", zh: "排序与汇报" },
            note: { en: "Method plus version", zh: "方法与版本并重" },
            steps: [
              { en: "Reject non-RL", zh: "排除非 RL 工作", kind: "decision" },
              { en: "Compare versions", zh: "比较版本", kind: "verify" },
              { en: "Summarize method", zh: "总结方法", kind: "model" },
              { en: "Cite source", zh: "引用来源", kind: "source" },
              { en: "Present", zh: "返回结果", kind: "auto" }
            ]
          }
        ],
        exception: {
          title: { en: "Version repair", zh: "版本修复" },
          note: { en: "Preprint chronology", zh: "预印本时间顺序" },
          status: { en: "Version order repaired", zh: "版本顺序已修正" },
          metrics: { automated: "12", model: "4", saving: "58%" },
          steps: [
            { en: "Version drift", zh: "版本时间漂移", kind: "error" },
            { en: "Refresh metadata", zh: "刷新元数据", kind: "source" },
            { en: "Diff revisions", zh: "比较修订记录", kind: "auto" },
            { en: "Resolve chronology", zh: "判断版本先后", kind: "model" }
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
    }

    function resetDemo() {
      var task = tasks[selectedTask];
      clearTimers();
      completed = false;
      exceptionInjected = false;
      runButton.disabled = false;
      exceptionButton.disabled = true;
      result.hidden = true;
      automatedMetric.textContent = "--";
      modelMetric.textContent = "--";
      savingMetric.textContent = "--";
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
      setLocalizedText(status, "Compiling", "编译中");
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
        automatedMetric.textContent = task.metrics.automated;
        modelMetric.textContent = task.metrics.model;
        savingMetric.textContent = task.metrics.saving;
        setLocalizedText(status, "Workflow ready", "工作流就绪");
        resultTitle.textContent = task.result;
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
        automatedMetric.textContent = task.exception.metrics.automated;
        modelMetric.textContent = task.exception.metrics.model;
        savingMetric.textContent = task.exception.metrics.saving;
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
    lab.querySelector("[data-workflow-open-result]").addEventListener("click", openResult);

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
        var focusable = Array.prototype.slice.call(dialog.querySelectorAll("button:not([disabled])"));
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
