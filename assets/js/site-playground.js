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
  setupTravelGame();
}());
