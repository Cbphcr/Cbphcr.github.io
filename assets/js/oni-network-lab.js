(function () {
  "use strict";

  var root = document.querySelector("[data-oni-lab]");
  if (!root || !window.cytoscape) { return; }

  var STORAGE_KEY = "oni-network-lab-v1";
  var EPSILON = 0.0001;
  var canvas = root.querySelector("#oni-network-canvas");
  var scenarioSelect = root.querySelector("[data-scenario-select]");
  var equipmentList = root.querySelector("[data-equipment-list]");
  var inspector = root.querySelector("[data-inspector]");
  var metrics = root.querySelector("[data-metrics]");
  var diagnostics = root.querySelector("[data-diagnostics]");
  var healthBadge = root.querySelector("[data-health-badge]");
  var issueCount = root.querySelector("[data-issue-count]");
  var connectPrompt = root.querySelector("[data-connect-prompt]");
  var connectMessage = root.querySelector("[data-connect-message]");
  var importInput = root.querySelector("[data-import-input]");
  var toast = root.querySelector("[data-oni-toast]");
  var toastTimer = null;
  var cy = null;
  var history = [];
  var future = [];
  var connectMode = false;
  var connectSource = null;
  var dragSnapshot = null;
  var lastAnalysis = {};

  function language() {
    return document.documentElement.getAttribute("data-lang") === "zh" ? "zh" : "en";
  }

  function text(en, zh) {
    return language() === "zh" ? zh : en;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function deepCopy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  var NETWORKS = {
    gas: {
      label: { en: "Gas network", zh: "气体管网" },
      unit: "g/s",
      decimals: 0,
      color: "#13a8c7",
      dark: "#087a94",
      defaultCapacity: 500,
      types: [
        { id: "oxygen-source", role: "source", icon: "fa-wind", label: { en: "Oxygen source", zh: "氧气源" }, supply: 500, demand: 0 },
        { id: "quarters-vent", role: "sink", icon: "fa-door-open", label: { en: "Quarters vent", zh: "宿舍排气口" }, supply: 0, demand: 100 },
        { id: "atmo-suit-dock", role: "sink", icon: "fa-user-astronaut", label: { en: "Atmo suit dock", zh: "气压服检查站" }, supply: 0, demand: 200 },
        { id: "gas-reservoir", role: "relay", icon: "fa-database", label: { en: "Gas reservoir", zh: "储气库" }, supply: 0, demand: 0 }
      ]
    },
    liquid: {
      label: { en: "Liquid network", zh: "液体管网" },
      unit: "kg/s",
      decimals: 1,
      color: "#3978bd",
      dark: "#285995",
      defaultCapacity: 10,
      types: [
        { id: "water-pump", role: "source", icon: "fa-water", label: { en: "Water pump", zh: "液泵" }, supply: 10, demand: 0 },
        { id: "electrolyzer", role: "sink", icon: "fa-flask", label: { en: "Electrolyzer", zh: "电解器" }, supply: 0, demand: 1 },
        { id: "hydroponic-farm", role: "sink", icon: "fa-seedling", label: { en: "Hydroponic farm", zh: "液培农场" }, supply: 0, demand: 5 },
        { id: "liquid-reservoir", role: "relay", icon: "fa-database", label: { en: "Liquid reservoir", zh: "储液库" }, supply: 0, demand: 0 }
      ]
    },
    power: {
      label: { en: "Power network", zh: "电力网络" },
      unit: "W",
      decimals: 0,
      color: "#d9940a",
      dark: "#9a6500",
      defaultCapacity: 1000,
      types: [
        { id: "coal-generator", role: "source", icon: "fa-fire", label: { en: "Coal generator", zh: "煤炭发电机" }, supply: 600, demand: 0 },
        { id: "manual-generator", role: "source", icon: "fa-running", label: { en: "Manual generator", zh: "人力发电机" }, supply: 400, demand: 0 },
        { id: "liquid-pump-load", role: "sink", icon: "fa-tint", label: { en: "Liquid pump", zh: "液泵负载" }, supply: 0, demand: 240 },
        { id: "research-station", role: "sink", icon: "fa-microscope", label: { en: "Research station", zh: "研究站" }, supply: 0, demand: 120 },
        { id: "smart-battery", role: "relay", icon: "fa-battery-half", label: { en: "Smart battery", zh: "智能电池" }, supply: 0, demand: 0 }
      ]
    }
  };

  function typeFor(networkId, typeId) {
    var types = NETWORKS[networkId].types;
    for (var i = 0; i < types.length; i += 1) {
      if (types[i].id === typeId) { return types[i]; }
    }
    return types[0];
  }

  function makeNode(networkId, id, typeId, x, y, overrides) {
    var type = typeFor(networkId, typeId);
    var extra = overrides || {};
    return {
      id: id,
      type: typeId,
      role: type.role,
      labelEn: extra.labelEn || type.label.en,
      labelZh: extra.labelZh || type.label.zh,
      customLabel: extra.customLabel || "",
      supply: Number(extra.supply !== undefined ? extra.supply : type.supply),
      demand: Number(extra.demand !== undefined ? extra.demand : type.demand),
      x: x,
      y: y
    };
  }

  function makeEdge(id, source, target, capacity, enabled) {
    return {
      id: id,
      source: source,
      target: target,
      capacity: Number(capacity),
      enabled: enabled !== false
    };
  }

  function balancedNetworks() {
    return {
      gas: {
        nodes: [
          makeNode("gas", "g-source", "oxygen-source", 100, 250, { supply: 600 }),
          makeNode("gas", "g-tank", "gas-reservoir", 330, 250),
          makeNode("gas", "g-quarters", "quarters-vent", 590, 145, { labelEn: "Living quarters", labelZh: "生活区", demand: 200 }),
          makeNode("gas", "g-docks", "atmo-suit-dock", 590, 355, { demand: 200 })
        ],
        edges: [
          makeEdge("ge-1", "g-source", "g-tank", 500),
          makeEdge("ge-2", "g-tank", "g-quarters", 250),
          makeEdge("ge-3", "g-tank", "g-docks", 250)
        ]
      },
      liquid: {
        nodes: [
          makeNode("liquid", "l-pump", "water-pump", 95, 250),
          makeNode("liquid", "l-tank", "liquid-reservoir", 330, 250),
          makeNode("liquid", "l-farm", "hydroponic-farm", 595, 150),
          makeNode("liquid", "l-electrolyzer", "electrolyzer", 595, 350)
        ],
        edges: [
          makeEdge("le-1", "l-pump", "l-tank", 10),
          makeEdge("le-2", "l-tank", "l-farm", 5.5),
          makeEdge("le-3", "l-tank", "l-electrolyzer", 1.5)
        ]
      },
      power: {
        nodes: [
          makeNode("power", "p-coal", "coal-generator", 90, 145),
          makeNode("power", "p-manual", "manual-generator", 90, 355),
          makeNode("power", "p-battery", "smart-battery", 330, 250),
          makeNode("power", "p-pump", "liquid-pump-load", 590, 125),
          makeNode("power", "p-lab", "research-station", 590, 250),
          makeNode("power", "p-rec", "research-station", 590, 375, { labelEn: "Recreation room", labelZh: "娱乐室", demand: 300 })
        ],
        edges: [
          makeEdge("pe-1", "p-coal", "p-battery", 600),
          makeEdge("pe-2", "p-manual", "p-battery", 400),
          makeEdge("pe-3", "p-battery", "p-pump", 300),
          makeEdge("pe-4", "p-battery", "p-lab", 200),
          makeEdge("pe-5", "p-battery", "p-rec", 400)
        ]
      }
    };
  }

  function makeScenario(id) {
    var networks = balancedNetworks();
    var activeNetwork = "gas";

    if (id === "oxygen-shortage") {
      networks.gas.nodes[0].supply = 300;
      networks.gas.nodes.push(makeNode("gas", "g-greenhouse", "quarters-vent", 590, 470, { labelEn: "Greenhouse vent", labelZh: "温室排气口", demand: 100 }));
      networks.gas.edges.push(makeEdge("ge-4", "g-tank", "g-greenhouse", 150));
    } else if (id === "power-overload") {
      activeNetwork = "power";
      networks.power.nodes.splice(2, 1,
        makeNode("power", "p-trunk", "smart-battery", 280, 250, { labelEn: "Main trunk", labelZh: "主干线" }),
        makeNode("power", "p-battery", "smart-battery", 445, 250)
      );
      networks.power.nodes.push(makeNode("power", "p-freezer", "liquid-pump-load", 690, 470, { labelEn: "Deep freezer", labelZh: "低温冷库", demand: 240 }));
      networks.power.edges = [
        makeEdge("pe-1", "p-coal", "p-trunk", 600),
        makeEdge("pe-2", "p-manual", "p-trunk", 400),
        makeEdge("pe-trunk", "p-trunk", "p-battery", 700),
        makeEdge("pe-3", "p-battery", "p-pump", 300),
        makeEdge("pe-4", "p-battery", "p-lab", 200),
        makeEdge("pe-5", "p-battery", "p-rec", 400),
        makeEdge("pe-6", "p-battery", "p-freezer", 300)
      ];
    } else if (id === "water-bottleneck") {
      activeNetwork = "liquid";
      networks.liquid.nodes.splice(1, 1,
        makeNode("liquid", "l-valve", "liquid-reservoir", 275, 250, { labelEn: "Narrow valve", labelZh: "狭窄阀门" }),
        makeNode("liquid", "l-tank", "liquid-reservoir", 445, 250)
      );
      networks.liquid.edges = [
        makeEdge("le-1", "l-pump", "l-valve", 10),
        makeEdge("le-valve", "l-valve", "l-tank", 2.5),
        makeEdge("le-2", "l-tank", "l-farm", 5.5),
        makeEdge("le-3", "l-tank", "l-electrolyzer", 1.5)
      ];
    }

    return {
      version: 1,
      scenario: id,
      activeNetwork: activeNetwork,
      networks: networks
    };
  }

  var SCENARIOS = [
    { id: "oxygen-shortage", label: { en: "Oxygen shortage", zh: "氧气供应不足" } },
    { id: "power-overload", label: { en: "Overloaded power spine", zh: "电力主干过载" } },
    { id: "water-bottleneck", label: { en: "Water bottleneck", zh: "供水瓶颈" } },
    { id: "balanced", label: { en: "Balanced starter base", zh: "平衡的初始基地" } }
  ];

  function scenarioExists(id) {
    return SCENARIOS.some(function (scenario) { return scenario.id === id; });
  }

  function validNumber(value) {
    return typeof value === "number" && isFinite(value) && value >= 0;
  }

  function validateState(candidate) {
    if (!candidate || candidate.version !== 1 || !NETWORKS[candidate.activeNetwork] || !candidate.networks) { return false; }
    return Object.keys(NETWORKS).every(function (networkId) {
      var network = candidate.networks[networkId];
      if (!network || !Array.isArray(network.nodes) || !Array.isArray(network.edges)) { return false; }
      var ids = {};
      var nodesValid = network.nodes.every(function (node) {
        if (!node || typeof node.id !== "string" || ids[node.id]) { return false; }
        var knownType = NETWORKS[networkId].types.some(function (type) { return type.id === node.type; });
        if (!knownType) { return false; }
        ids[node.id] = true;
        return validNumber(Number(node.supply)) && validNumber(Number(node.demand)) && isFinite(Number(node.x)) && isFinite(Number(node.y));
      });
      if (!nodesValid) { return false; }
      var edgeIds = {};
      return network.edges.every(function (edge) {
        if (!edge || typeof edge.id !== "string" || edgeIds[edge.id]) { return false; }
        edgeIds[edge.id] = true;
        return ids[edge.source] && ids[edge.target] && edge.source !== edge.target && validNumber(Number(edge.capacity));
      });
    });
  }

  function loadSavedState() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      return validateState(saved) ? saved : null;
    } catch (error) {
      return null;
    }
  }

  var state = loadSavedState() || makeScenario("oxygen-shortage");

  function saveState() {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) {}
  }

  function capture() {
    return JSON.stringify(state);
  }

  function restore(snapshot, fit) {
    state = JSON.parse(snapshot);
    saveState();
    cancelConnect();
    renderAll(fit !== false);
  }

  function commit(mutator, options) {
    history.push(capture());
    if (history.length > 40) { history.shift(); }
    future = [];
    mutator();
    saveState();
    renderAll(options && options.fit);
  }

  function undo() {
    if (!history.length) { return; }
    future.push(capture());
    restore(history.pop(), false);
  }

  function redo() {
    if (!future.length) { return; }
    history.push(capture());
    restore(future.pop(), false);
  }

  function currentNetwork() {
    return state.networks[state.activeNetwork];
  }

  function nodeLabel(node) {
    if (node.customLabel) { return node.customLabel; }
    return language() === "zh" ? node.labelZh : node.labelEn;
  }

  function formatValue(value, networkId) {
    var config = NETWORKS[networkId];
    return Number(value).toFixed(config.decimals).replace(/\.0$/, "") + " " + config.unit;
  }

  function shortValue(value, networkId) {
    var config = NETWORKS[networkId];
    return Number(value).toFixed(config.decimals).replace(/\.0$/, "");
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = window.setTimeout(function () { toast.hidden = true; }, 2600);
  }

  function solveNetwork(networkId) {
    var network = state.networks[networkId];
    var superSource = "__source__";
    var superSink = "__sink__";
    var capacities = {};
    var flows = {};
    var adjacency = {};

    function ensure(id) {
      if (!capacities[id]) { capacities[id] = {}; }
      if (!flows[id]) { flows[id] = {}; }
      if (!adjacency[id]) { adjacency[id] = []; }
    }

    function addArc(from, to, capacity) {
      ensure(from);
      ensure(to);
      capacities[from][to] = (capacities[from][to] || 0) + Math.max(0, Number(capacity));
      if (flows[from][to] === undefined) { flows[from][to] = 0; }
      if (flows[to][from] === undefined) { flows[to][from] = 0; }
      if (adjacency[from].indexOf(to) === -1) { adjacency[from].push(to); }
      if (adjacency[to].indexOf(from) === -1) { adjacency[to].push(from); }
    }

    network.nodes.forEach(function (node) {
      ensure(node.id);
      if (node.supply > 0) { addArc(superSource, node.id, node.supply); }
      if (node.demand > 0) { addArc(node.id, superSink, node.demand); }
    });

    network.edges.forEach(function (edge) {
      if (!edge.enabled || edge.capacity <= 0) { return; }
      var edgeNode = "__edge__" + edge.id;
      addArc(edge.source, edgeNode, edge.capacity);
      addArc(edgeNode, edge.target, edge.capacity);
    });

    ensure(superSource);
    ensure(superSink);
    var totalFlow = 0;
    var iterations = 0;

    while (iterations < 10000) {
      iterations += 1;
      var queue = [superSource];
      var parent = {};
      parent[superSource] = null;

      while (queue.length && parent[superSink] === undefined) {
        var from = queue.shift();
        adjacency[from].forEach(function (to) {
          var residual = (capacities[from][to] || 0) - (flows[from][to] || 0);
          if (parent[to] === undefined && residual > EPSILON) {
            parent[to] = from;
            queue.push(to);
          }
        });
      }

      if (parent[superSink] === undefined) { break; }
      var increment = Infinity;
      var cursor = superSink;
      while (cursor !== superSource) {
        var previous = parent[cursor];
        increment = Math.min(increment, (capacities[previous][cursor] || 0) - (flows[previous][cursor] || 0));
        cursor = previous;
      }
      cursor = superSink;
      while (cursor !== superSource) {
        var prior = parent[cursor];
        flows[prior][cursor] = (flows[prior][cursor] || 0) + increment;
        flows[cursor][prior] = (flows[cursor][prior] || 0) - increment;
        cursor = prior;
      }
      totalFlow += increment;
    }

    var nodeResults = {};
    var totalSupply = 0;
    var totalDemand = 0;
    network.nodes.forEach(function (node) {
      var supplied = Math.max(0, (flows[superSource] && flows[superSource][node.id]) || 0);
      var delivered = Math.max(0, (flows[node.id] && flows[node.id][superSink]) || 0);
      totalSupply += node.supply;
      totalDemand += node.demand;
      nodeResults[node.id] = { supplied: supplied, delivered: delivered };
    });

    var edgeResults = {};
    network.edges.forEach(function (edge) {
      var edgeNode = "__edge__" + edge.id;
      var value = edge.enabled ? Math.max(0, (flows[edge.source] && flows[edge.source][edgeNode]) || 0) : 0;
      edgeResults[edge.id] = {
        flow: value,
        utilization: edge.enabled && edge.capacity > 0 ? value / edge.capacity : 0
      };
    });

    var unserved = Math.max(0, totalDemand - totalFlow);
    var issues = [];

    if (totalDemand <= EPSILON) {
      issues.push({ severity: "info", title: text("No consumers", "没有用量设备"), detail: text("Add a consumer to test this network.", "添加用量设备后即可测试网络。") });
    }

    if (totalSupply + EPSILON < totalDemand) {
      issues.push({
        severity: "warning",
        title: text("Production shortfall", "总产能不足"),
        detail: text(
          "Demand exceeds production by " + formatValue(totalDemand - totalSupply, networkId) + ".",
          "总需求比产能高 " + formatValue(totalDemand - totalSupply, networkId) + "。"
        )
      });
    }

    network.nodes.forEach(function (node) {
      if (node.demand > EPSILON && nodeResults[node.id].delivered + EPSILON < node.demand) {
        var delivered = nodeResults[node.id].delivered;
        issues.push({
          severity: "error",
          title: delivered <= EPSILON ? text("Consumer is disconnected", "用量设备未接通") : text("Consumer is undersupplied", "用量设备供应不足"),
          detail: nodeLabel(node) + ": " + formatValue(delivered, networkId) + " / " + formatValue(node.demand, networkId),
          targetType: "node",
          targetId: node.id
        });
      }
      if (node.supply > EPSILON && nodeResults[node.id].supplied <= EPSILON && totalDemand > EPSILON) {
        issues.push({
          severity: "info",
          title: text("Source is unused", "生产设备未被利用"),
          detail: nodeLabel(node),
          targetType: "node",
          targetId: node.id
        });
      }
    });

    if (unserved > EPSILON) {
      network.edges.forEach(function (edge) {
        if (edge.enabled && edgeResults[edge.id].utilization >= 0.98) {
          issues.push({
            severity: "warning",
            title: text("Connection is at capacity", "管段已达到容量上限"),
            detail: formatValue(edgeResults[edge.id].flow, networkId) + " / " + formatValue(edge.capacity, networkId),
            targetType: "edge",
            targetId: edge.id
          });
        }
      });
      if (totalSupply + EPSILON >= totalDemand && totalFlow + EPSILON < totalDemand) {
        issues.unshift({
          severity: "error",
          title: text("Routing capacity is the limiting factor", "瓶颈来自管路容量"),
          detail: text("Production is sufficient, but the network cannot deliver it.", "总产能足够，但管网无法把资源送到用量设备。")
        });
      }
    }

    var hasError = issues.some(function (issue) { return issue.severity === "error"; });
    var hasWarning = issues.some(function (issue) { return issue.severity === "warning"; });
    if (!hasError && !hasWarning && totalDemand > EPSILON) {
      issues.unshift({
        severity: "success",
        title: text("All consumers are supplied", "所有用量设备均已满足"),
        detail: text("No capacity bottleneck detected.", "未发现容量瓶颈。")
      });
    }

    return {
      totalSupply: totalSupply,
      totalDemand: totalDemand,
      delivered: totalFlow,
      unserved: unserved,
      nodeResults: nodeResults,
      edgeResults: edgeResults,
      issues: issues,
      status: hasError ? "error" : (hasWarning ? "warning" : "healthy")
    };
  }

  function analyzeAll() {
    Object.keys(NETWORKS).forEach(function (networkId) {
      lastAnalysis[networkId] = solveNetwork(networkId);
    });
  }

  function nodeElements(networkId) {
    var network = state.networks[networkId];
    var analysis = lastAnalysis[networkId];
    return network.nodes.map(function (node) {
      var roleAmount = node.role === "source" ? "+" + shortValue(node.supply, networkId) : (node.role === "sink" ? "-" + shortValue(node.demand, networkId) : text("relay", "中继"));
      var classes = ["node-" + node.role];
      if (node.demand > EPSILON && analysis.nodeResults[node.id].delivered + EPSILON < node.demand) { classes.push("node-underfed"); }
      if (node.supply > EPSILON && analysis.nodeResults[node.id].supplied <= EPSILON) { classes.push("node-idle"); }
      return {
        group: "nodes",
        data: {
          id: node.id,
          displayLabel: nodeLabel(node) + "\n" + roleAmount + " " + NETWORKS[networkId].unit,
          role: node.role
        },
        position: { x: Number(node.x), y: Number(node.y) },
        classes: classes.join(" ")
      };
    });
  }

  function edgeElements(networkId) {
    var network = state.networks[networkId];
    var analysis = lastAnalysis[networkId];
    return network.edges.map(function (edge) {
      var result = analysis.edgeResults[edge.id];
      var classes = [];
      if (!edge.enabled) { classes.push("edge-disabled"); }
      else if (result.utilization >= 0.98 && analysis.unserved > EPSILON) { classes.push("edge-bottleneck"); }
      else if (result.flow <= EPSILON) { classes.push("edge-idle"); }
      return {
        group: "edges",
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          flow: result.flow,
          capacity: edge.capacity,
          utilization: Math.min(1, result.utilization),
          displayLabel: shortValue(result.flow, networkId) + " / " + shortValue(edge.capacity, networkId),
          lineColor: NETWORKS[networkId].color
        },
        classes: classes.join(" ")
      };
    });
  }

  function initGraph() {
    cy = window.cytoscape({
      container: canvas,
      elements: [],
      minZoom: 0.45,
      maxZoom: 2.2,
      wheelSensitivity: 0.18,
      selectionType: "single",
      boxSelectionEnabled: false,
      style: [
        {
          selector: "node",
          style: {
            width: 122,
            height: 62,
            shape: "round-rectangle",
            "background-color": "#ffffff",
            "border-width": 2,
            "border-color": "#91a2b5",
            label: "data(displayLabel)",
            color: "#182235",
            "font-family": "Nunito, sans-serif",
            "font-size": 11,
            "font-weight": 700,
            "line-height": 1.35,
            "text-wrap": "wrap",
            "text-max-width": 104,
            "text-valign": "center",
            "text-halign": "center",
            "overlay-opacity": 0,
            "shadow-blur": 8,
            "shadow-color": "#23364d",
            "shadow-opacity": 0.12,
            "shadow-offset-y": 3
          }
        },
        { selector: ".node-source", style: { "border-color": "#26865b", "background-color": "#f1faf5" } },
        { selector: ".node-sink", style: { "border-color": "#c27a08", "background-color": "#fff9ec" } },
        { selector: ".node-relay", style: { "border-color": "#3978bd", "background-color": "#f2f6fc" } },
        { selector: ".node-underfed", style: { "border-color": "#bd4343", "border-width": 4, "background-color": "#fff3f3" } },
        { selector: ".node-idle", style: { opacity: 0.58 } },
        { selector: "node:selected", style: { "border-color": "#0e93b0", "border-width": 5, "shadow-opacity": 0.24 } },
        { selector: ".connect-source", style: { "border-color": "#0e93b0", "border-width": 5, "background-color": "#e9f8fb" } },
        {
          selector: "edge",
          style: {
            width: "mapData(utilization, 0, 1, 2, 8)",
            "line-color": "data(lineColor)",
            "target-arrow-color": "data(lineColor)",
            "target-arrow-shape": "triangle",
            "arrow-scale": 0.8,
            "curve-style": "bezier",
            label: "data(displayLabel)",
            color: "#4b5a70",
            "font-family": "JetBrains Mono, monospace",
            "font-size": 8,
            "text-background-color": "#ffffff",
            "text-background-opacity": 0.88,
            "text-background-padding": 3,
            "text-background-shape": "round-rectangle",
            "text-rotation": "autorotate",
            "overlay-opacity": 0,
            opacity: 0.82
          }
        },
        { selector: ".edge-bottleneck", style: { "line-color": "#bd4343", "target-arrow-color": "#bd4343", "line-style": "dashed", opacity: 1 } },
        { selector: ".edge-disabled", style: { "line-color": "#8d99a8", "target-arrow-color": "#8d99a8", "line-style": "dashed", opacity: 0.32, width: 2 } },
        { selector: ".edge-idle", style: { opacity: 0.34, width: 2 } },
        { selector: "edge:selected", style: { "line-color": "#0a6e88", "target-arrow-color": "#0a6e88", opacity: 1, "z-index": 20 } }
      ],
      layout: { name: "preset" }
    });

    cy.on("select unselect", "node, edge", renderInspector);

    cy.on("tap", function (event) {
      if (event.target === cy) {
        cy.elements().unselect();
        if (connectMode) {
          connectSource = null;
          updateConnectPrompt();
        }
      }
    });

    cy.on("tap", "node", function (event) {
      if (!connectMode) { return; }
      var id = event.target.id();
      if (!connectSource) {
        connectSource = id;
        cy.nodes().removeClass("connect-source");
        event.target.addClass("connect-source");
        updateConnectPrompt();
        return;
      }
      if (connectSource === id) {
        showToast(text("Choose a different target.", "请选择另一个目标设备。"));
        return;
      }
      addConnection(connectSource, id);
      connectSource = null;
      cy.nodes().removeClass("connect-source");
      updateConnectPrompt();
    });

    cy.on("grab", "node", function () { dragSnapshot = capture(); });
    cy.on("free", "node", function (event) {
      var node = currentNetwork().nodes.find(function (item) { return item.id === event.target.id(); });
      if (!node) { return; }
      var position = event.target.position();
      if (Math.abs(node.x - position.x) < 0.5 && Math.abs(node.y - position.y) < 0.5) { return; }
      if (dragSnapshot) {
        history.push(dragSnapshot);
        if (history.length > 40) { history.shift(); }
        future = [];
      }
      node.x = position.x;
      node.y = position.y;
      dragSnapshot = null;
      saveState();
      updateHistoryButtons();
    });
  }

  function renderGraph(fit) {
    var selected = cy.$(":selected").length ? cy.$(":selected")[0].id() : null;
    cy.startBatch();
    cy.elements().remove();
    cy.add(nodeElements(state.activeNetwork).concat(edgeElements(state.activeNetwork)));
    cy.endBatch();
    if (selected && cy.getElementById(selected).length) { cy.getElementById(selected).select(); }
    if (fit) { window.setTimeout(function () { cy.fit(cy.elements(), 76); }, 0); }
  }

  function renderScenarioOptions() {
    scenarioSelect.innerHTML = "";
    SCENARIOS.forEach(function (scenario) {
      var option = document.createElement("option");
      option.value = scenario.id;
      option.textContent = language() === "zh" ? scenario.label.zh : scenario.label.en;
      option.selected = scenario.id === state.scenario;
      scenarioSelect.appendChild(option);
    });
  }

  function renderPalette() {
    var config = NETWORKS[state.activeNetwork];
    equipmentList.innerHTML = "";
    config.types.forEach(function (type) {
      var button = document.createElement("button");
      var amount = type.role === "source" ? "+" + type.supply : (type.role === "sink" ? "-" + type.demand : text("pass-through", "中继"));
      button.type = "button";
      button.className = "oni-equipment";
      button.dataset.addType = type.id;
      button.innerHTML = '<i class="fas ' + type.icon + '" aria-hidden="true"></i><span><strong>' + escapeHtml(language() === "zh" ? type.label.zh : type.label.en) + '</strong><small>' + escapeHtml(amount + (type.role === "relay" ? "" : " " + config.unit)) + "</small></span>";
      equipmentList.appendChild(button);
    });
    root.querySelector("[data-active-unit]").textContent = config.unit;
  }

  function statusText(status) {
    if (status === "error") { return text("Needs work", "需要处理"); }
    if (status === "warning") { return text("Check", "需检查"); }
    return text("Stable", "稳定");
  }

  function renderTabs() {
    root.querySelectorAll("[data-network]").forEach(function (button) {
      var id = button.dataset.network;
      var analysis = lastAnalysis[id];
      var rate = analysis.totalDemand > EPSILON ? Math.round(analysis.delivered / analysis.totalDemand * 100) : 100;
      button.setAttribute("aria-pressed", id === state.activeNetwork ? "true" : "false");
      button.classList.toggle("has-error", analysis.status === "error");
      button.classList.toggle("has-warning", analysis.status === "warning");
      button.classList.toggle("is-healthy", analysis.status === "healthy");
      root.querySelector('[data-tab-health="' + id + '"]').textContent = rate + "%";
    });
  }

  function renderCanvasStatus() {
    var config = NETWORKS[state.activeNetwork];
    var analysis = lastAnalysis[state.activeNetwork];
    root.querySelector("[data-network-name]").textContent = language() === "zh" ? config.label.zh : config.label.en;
    root.querySelector("[data-network-summary]").textContent = formatValue(analysis.delivered, state.activeNetwork) + " / " + formatValue(analysis.totalDemand, state.activeNetwork);
    root.querySelector("[data-network-dot]").style.backgroundColor = config.color;
  }

  function renderMetrics() {
    var analysis = lastAnalysis[state.activeNetwork];
    var values = [
      { label: text("Production", "产能"), value: formatValue(analysis.totalSupply, state.activeNetwork) },
      { label: text("Demand", "需求"), value: formatValue(analysis.totalDemand, state.activeNetwork) },
      { label: text("Delivered", "已交付"), value: formatValue(analysis.delivered, state.activeNetwork) },
      { label: text("Unserved", "未满足"), value: formatValue(analysis.unserved, state.activeNetwork) }
    ];
    metrics.innerHTML = values.map(function (item) {
      return '<div class="oni-metric"><small>' + escapeHtml(item.label) + '</small><strong>' + escapeHtml(item.value) + "</strong></div>";
    }).join("");
    healthBadge.textContent = statusText(analysis.status);
    healthBadge.className = "oni-health-badge " + (analysis.status === "error" ? "has-error" : (analysis.status === "warning" ? "has-warning" : "is-healthy"));
  }

  function selectedElement() {
    var selection = cy.$(":selected");
    return selection.length ? selection[0] : null;
  }

  function renderInspector() {
    var selected = selectedElement();
    if (!selected) {
      inspector.innerHTML = '<div class="oni-inspector__empty"><span><i class="fas fa-mouse-pointer" aria-hidden="true"></i>' + escapeHtml(text("Select equipment or a connection", "选择设备或管段")) + "</span></div>";
      return;
    }

    if (selected.isNode()) {
      var node = currentNetwork().nodes.find(function (item) { return item.id === selected.id(); });
      if (!node) { return; }
      inspector.innerHTML =
        '<div class="oni-inspector__title"><strong>' + escapeHtml(nodeLabel(node)) + '</strong><span>' + escapeHtml(text(node.role, node.role === "source" ? "生产" : (node.role === "sink" ? "用量" : "中继"))) + '</span></div>' +
        '<div class="oni-inspector__fields">' +
          '<label>' + escapeHtml(text("Label", "名称")) + '<input type="text" data-node-field="customLabel" value="' + escapeHtml(node.customLabel || "") + '" placeholder="' + escapeHtml(nodeLabel(node)) + '"></label>' +
          '<label>' + escapeHtml(text("Supply", "产能")) + '<input type="number" min="0" step="any" data-node-field="supply" value="' + escapeHtml(node.supply) + '"></label>' +
          '<label>' + escapeHtml(text("Demand", "需求")) + '<input type="number" min="0" step="any" data-node-field="demand" value="' + escapeHtml(node.demand) + '"></label>' +
        '</div>' +
        '<div class="oni-inspector__actions"><button type="button" class="is-danger" data-selection-action="delete"><i class="fas fa-trash-alt" aria-hidden="true"></i>' + escapeHtml(text("Delete", "删除")) + "</button></div>";
    } else {
      var edge = currentNetwork().edges.find(function (item) { return item.id === selected.id(); });
      if (!edge) { return; }
      var edgeResult = lastAnalysis[state.activeNetwork].edgeResults[edge.id];
      inspector.innerHTML =
        '<div class="oni-inspector__title"><strong>' + escapeHtml(text("Connection", "管段")) + '</strong><span>' + escapeHtml(Math.round(edgeResult.utilization * 100) + "%") + '</span></div>' +
        '<div class="oni-inspector__fields"><label>' + escapeHtml(text("Capacity", "容量")) + '<input type="number" min="0" step="any" data-edge-field="capacity" value="' + escapeHtml(edge.capacity) + '"></label></div>' +
        '<div class="oni-inspector__toggles"><label><input type="checkbox" data-edge-field="enabled"' + (edge.enabled ? " checked" : "") + '> ' + escapeHtml(text("Enabled", "启用")) + '</label></div>' +
        '<div class="oni-inspector__actions"><button type="button" data-selection-action="reverse"><i class="fas fa-exchange-alt" aria-hidden="true"></i>' + escapeHtml(text("Reverse", "反向")) + '</button><button type="button" class="is-danger" data-selection-action="delete"><i class="fas fa-trash-alt" aria-hidden="true"></i>' + escapeHtml(text("Delete", "删除")) + "</button></div>";
    }
  }

  function renderDiagnostics() {
    var analysis = lastAnalysis[state.activeNetwork];
    var iconMap = { error: "fa-times", warning: "fa-exclamation", success: "fa-check", info: "fa-info" };
    var actionable = analysis.issues.filter(function (item) { return item.severity === "error" || item.severity === "warning"; }).length;
    issueCount.textContent = String(actionable);
    diagnostics.innerHTML = analysis.issues.map(function (issue) {
      var target = issue.targetId ? ' data-target-id="' + escapeHtml(issue.targetId) + '"' : "";
      return '<button type="button" class="oni-diagnostic oni-diagnostic--' + issue.severity + '"' + target + '><i class="fas ' + iconMap[issue.severity] + '" aria-hidden="true"></i><span><strong>' + escapeHtml(issue.title) + '</strong><small>' + escapeHtml(issue.detail) + "</small></span></button>";
    }).join("");
  }

  function updateHistoryButtons() {
    root.querySelector('[data-action="undo"]').disabled = history.length === 0;
    root.querySelector('[data-action="redo"]').disabled = future.length === 0;
  }

  function renderAll(fit) {
    analyzeAll();
    renderScenarioOptions();
    renderPalette();
    renderTabs();
    renderCanvasStatus();
    renderGraph(Boolean(fit));
    renderMetrics();
    renderInspector();
    renderDiagnostics();
    updateHistoryButtons();
    updateConnectPrompt();
  }

  function addEquipment(typeId) {
    var networkId = state.activeNetwork;
    var type = typeFor(networkId, typeId);
    var extent = cy.extent();
    var count = currentNetwork().nodes.filter(function (node) { return node.type === typeId; }).length + 1;
    var id = networkId.charAt(0) + "-node-" + Date.now();
    var x = (extent.x1 + extent.x2) / 2 + (count % 3) * 18;
    var y = (extent.y1 + extent.y2) / 2 + (count % 2) * 24;
    commit(function () {
      currentNetwork().nodes.push(makeNode(networkId, id, typeId, x, y, {
        labelEn: type.label.en + " " + count,
        labelZh: type.label.zh + " " + count
      }));
    });
    cy.getElementById(id).select();
  }

  function duplicateConnectionExists(source, target) {
    return currentNetwork().edges.some(function (edge) {
      return edge.source === source && edge.target === target;
    });
  }

  function addConnection(source, target) {
    if (duplicateConnectionExists(source, target)) {
      showToast(text("That connection already exists.", "这条连接已经存在。"));
      return;
    }
    var id = state.activeNetwork.charAt(0) + "-edge-" + Date.now();
    commit(function () {
      currentNetwork().edges.push(makeEdge(id, source, target, NETWORKS[state.activeNetwork].defaultCapacity));
    });
    cy.getElementById(id).select();
  }

  function toggleConnect(force) {
    connectMode = force === undefined ? !connectMode : Boolean(force);
    connectSource = null;
    cy.nodes().removeClass("connect-source");
    root.querySelector('[data-action="connect"]').setAttribute("aria-pressed", connectMode ? "true" : "false");
    updateConnectPrompt();
  }

  function cancelConnect() {
    connectMode = false;
    connectSource = null;
    if (cy) { cy.nodes().removeClass("connect-source"); }
    var button = root.querySelector('[data-action="connect"]');
    if (button) { button.setAttribute("aria-pressed", "false"); }
    updateConnectPrompt();
  }

  function updateConnectPrompt() {
    if (!connectPrompt) { return; }
    connectPrompt.hidden = !connectMode;
    if (!connectMode) { return; }
    connectMessage.textContent = connectSource ? text("Choose the destination", "选择连接终点") : text("Choose the source equipment", "选择连接起点");
  }

  function deleteSelection() {
    var selected = selectedElement();
    if (!selected) { return; }
    var id = selected.id();
    var isNode = selected.isNode();
    commit(function () {
      var network = currentNetwork();
      if (isNode) {
        network.nodes = network.nodes.filter(function (node) { return node.id !== id; });
        network.edges = network.edges.filter(function (edge) { return edge.source !== id && edge.target !== id; });
      } else {
        network.edges = network.edges.filter(function (edge) { return edge.id !== id; });
      }
    });
  }

  function reverseSelection() {
    var selected = selectedElement();
    if (!selected || !selected.isEdge()) { return; }
    var edge = currentNetwork().edges.find(function (item) { return item.id === selected.id(); });
    if (!edge) { return; }
    if (duplicateConnectionExists(edge.target, edge.source)) {
      showToast(text("The reverse connection already exists.", "反向连接已经存在。"));
      return;
    }
    var edgeId = edge.id;
    commit(function () {
      var current = currentNetwork().edges.find(function (item) { return item.id === edgeId; });
      var source = current.source;
      current.source = current.target;
      current.target = source;
    });
    cy.getElementById(edgeId).select();
  }

  function arrangeGraph() {
    if (!cy.nodes().length) { return; }
    var before = capture();
    cy.one("layoutstop", function () {
      history.push(before);
      if (history.length > 40) { history.shift(); }
      future = [];
      cy.nodes().forEach(function (element) {
        var node = currentNetwork().nodes.find(function (item) { return item.id === element.id(); });
        if (node) {
          node.x = element.position("x");
          node.y = element.position("y");
        }
      });
      saveState();
      updateHistoryButtons();
      cy.fit(cy.elements(), 76);
    });
    cy.layout({ name: "breadthfirst", directed: true, spacingFactor: 1.15, animate: true, animationDuration: 320 }).run();
  }

  function exportState() {
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "oni-network-" + state.scenario + ".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(text("Network exported.", "网络配置已导出。"));
  }

  function importState(file) {
    if (!file) { return; }
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var candidate = JSON.parse(reader.result);
        if (!validateState(candidate)) { throw new Error("invalid"); }
        history.push(capture());
        future = [];
        state = candidate;
        if (!scenarioExists(state.scenario)) { state.scenario = "balanced"; }
        saveState();
        cancelConnect();
        renderAll(true);
        showToast(text("Network imported.", "网络配置已导入。"));
      } catch (error) {
        showToast(text("The JSON file is not a valid network.", "JSON 文件不是有效的网络配置。"));
      }
      importInput.value = "";
    };
    reader.readAsText(file);
  }

  function changeNodeField(field, value) {
    var selected = selectedElement();
    if (!selected || !selected.isNode()) { return; }
    var id = selected.id();
    commit(function () {
      var node = currentNetwork().nodes.find(function (item) { return item.id === id; });
      node[field] = field === "customLabel" ? String(value).trim().slice(0, 48) : Math.max(0, Number(value) || 0);
    });
    cy.getElementById(id).select();
  }

  function changeEdgeField(field, value) {
    var selected = selectedElement();
    if (!selected || !selected.isEdge()) { return; }
    var id = selected.id();
    commit(function () {
      var edge = currentNetwork().edges.find(function (item) { return item.id === id; });
      edge[field] = field === "enabled" ? Boolean(value) : Math.max(0, Number(value) || 0);
    });
    cy.getElementById(id).select();
  }

  root.addEventListener("click", function (event) {
    var addButton = event.target.closest("[data-add-type]");
    if (addButton) {
      addEquipment(addButton.dataset.addType);
      return;
    }
    var networkButton = event.target.closest("[data-network]");
    if (networkButton) {
      state.activeNetwork = networkButton.dataset.network;
      saveState();
      cancelConnect();
      renderAll(true);
      return;
    }
    var diagnostic = event.target.closest("[data-target-id]");
    if (diagnostic) {
      var target = cy.getElementById(diagnostic.dataset.targetId);
      if (target.length) {
        cy.elements().unselect();
        target.select();
        cy.animate({ center: { eles: target }, zoom: Math.max(cy.zoom(), 1.05) }, { duration: 220 });
      }
      return;
    }
    var selectionAction = event.target.closest("[data-selection-action]");
    if (selectionAction) {
      if (selectionAction.dataset.selectionAction === "delete") { deleteSelection(); }
      if (selectionAction.dataset.selectionAction === "reverse") { reverseSelection(); }
      return;
    }
    var actionButton = event.target.closest("[data-action]");
    if (!actionButton) { return; }
    var action = actionButton.dataset.action;
    if (action === "undo") { undo(); }
    else if (action === "redo") { redo(); }
    else if (action === "import") { importInput.click(); }
    else if (action === "export") { exportState(); }
    else if (action === "reset") {
      commit(function () { state = makeScenario(state.scenario); }, { fit: true });
      showToast(text("Scenario reset.", "场景已重置。"));
    }
    else if (action === "connect") { toggleConnect(); }
    else if (action === "cancel-connect") { cancelConnect(); }
    else if (action === "layout") { arrangeGraph(); }
    else if (action === "zoom-in") { cy.animate({ zoom: Math.min(cy.maxZoom(), cy.zoom() * 1.18), center: { eles: cy.elements() } }, { duration: 140 }); }
    else if (action === "zoom-out") { cy.animate({ zoom: Math.max(cy.minZoom(), cy.zoom() / 1.18), center: { eles: cy.elements() } }, { duration: 140 }); }
    else if (action === "fit") { cy.fit(cy.elements(), 76); }
  });

  inspector.addEventListener("change", function (event) {
    if (event.target.dataset.nodeField) {
      changeNodeField(event.target.dataset.nodeField, event.target.value);
    } else if (event.target.dataset.edgeField) {
      changeEdgeField(event.target.dataset.edgeField, event.target.type === "checkbox" ? event.target.checked : event.target.value);
    }
  });

  scenarioSelect.addEventListener("change", function () {
    var id = scenarioSelect.value;
    if (!scenarioExists(id)) { return; }
    commit(function () { state = makeScenario(id); }, { fit: true });
    cancelConnect();
  });

  importInput.addEventListener("change", function () { importState(importInput.files[0]); });

  document.addEventListener("keydown", function (event) {
    if (!root.contains(document.activeElement) && document.activeElement !== document.body) { return; }
    var editable = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if ((event.key === "Delete" || event.key === "Backspace") && !editable && selectedElement()) {
      event.preventDefault();
      deleteSelection();
    }
    if (event.key === "Escape" && connectMode) { cancelConnect(); }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z" && !editable) {
      event.preventDefault();
      if (event.shiftKey) { redo(); } else { undo(); }
    }
  });

  var languageObserver = new MutationObserver(function (mutations) {
    if (mutations.some(function (mutation) { return mutation.attributeName === "data-lang"; })) {
      renderAll(false);
    }
  });
  languageObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-lang"] });

  initGraph();
  renderAll(true);
}());
