---
permalink: /oni-network/
title: "Network Diagnostics Lab"
excerpt: "An interactive capacity-network sandbox inspired by Oxygen Not Included"
author_profile: false
wide: true
tool_page: true
oni_network_lab: true
---

<div class="oni-network-lab" data-oni-lab>
  <header class="oni-lab__header">
    <div class="oni-lab__identity">
      <span class="oni-lab__mark" aria-hidden="true"><i class="fas fa-project-diagram"></i></span>
      <div>
        <p><span class="lang-en">Base systems console</span><span class="lang-zh">基地系统控制台</span></p>
        <h1><span class="lang-en">Network Diagnostics Lab</span><span class="lang-zh">管网诊断实验台</span></h1>
      </div>
    </div>

    <div class="oni-lab__header-actions">
      <label class="oni-lab__scenario">
        <span><span class="lang-en">Scenario</span><span class="lang-zh">场景</span></span>
        <select data-scenario-select aria-label="Scenario"></select>
      </label>
      <div class="oni-lab__icon-actions" aria-label="Project controls">
        <button type="button" data-action="undo" title="Undo" aria-label="Undo"><i class="fas fa-undo-alt" aria-hidden="true"></i></button>
        <button type="button" data-action="redo" title="Redo" aria-label="Redo"><i class="fas fa-redo-alt" aria-hidden="true"></i></button>
        <button type="button" data-action="import" title="Import JSON" aria-label="Import JSON"><i class="fas fa-file-import" aria-hidden="true"></i></button>
        <button type="button" data-action="export" title="Export JSON" aria-label="Export JSON"><i class="fas fa-file-export" aria-hidden="true"></i></button>
        <button type="button" data-action="reset" title="Reset scenario" aria-label="Reset scenario"><i class="fas fa-sync-alt" aria-hidden="true"></i></button>
      </div>
      <input type="file" accept="application/json,.json" data-import-input hidden>
    </div>
  </header>

  <nav class="oni-network-tabs" aria-label="Network type">
    <button type="button" data-network="gas" aria-pressed="true">
      <i class="fas fa-wind" aria-hidden="true"></i>
      <span><span class="lang-en">Gas</span><span class="lang-zh">气体</span></span>
      <small data-tab-health="gas">--</small>
    </button>
    <button type="button" data-network="liquid" aria-pressed="false">
      <i class="fas fa-tint" aria-hidden="true"></i>
      <span><span class="lang-en">Liquid</span><span class="lang-zh">液体</span></span>
      <small data-tab-health="liquid">--</small>
    </button>
    <button type="button" data-network="power" aria-pressed="false">
      <i class="fas fa-bolt" aria-hidden="true"></i>
      <span><span class="lang-en">Power</span><span class="lang-zh">电力</span></span>
      <small data-tab-health="power">--</small>
    </button>
  </nav>

  <div class="oni-lab__workspace">
    <aside class="oni-lab__palette" aria-label="Equipment palette">
      <div class="oni-panel-heading">
        <div>
          <small><span class="lang-en">Build</span><span class="lang-zh">建造</span></small>
          <h2><span class="lang-en">Equipment</span><span class="lang-zh">设备</span></h2>
        </div>
        <span data-active-unit>g/s</span>
      </div>
      <div class="oni-equipment-list" data-equipment-list></div>
      <div class="oni-palette-actions">
        <button type="button" data-action="connect" aria-pressed="false">
          <i class="fas fa-link" aria-hidden="true"></i>
          <span><span class="lang-en">Connect</span><span class="lang-zh">连接</span></span>
        </button>
        <button type="button" data-action="layout">
          <i class="fas fa-magic" aria-hidden="true"></i>
          <span><span class="lang-en">Arrange</span><span class="lang-zh">整理</span></span>
        </button>
      </div>
    </aside>

    <section class="oni-lab__canvas-panel" aria-label="Network canvas">
      <div class="oni-canvas-toolbar">
        <div class="oni-canvas-status">
          <span data-network-dot></span>
          <strong data-network-name>Gas network</strong>
          <small data-network-summary>--</small>
        </div>
        <div class="oni-lab__icon-actions">
          <button type="button" data-action="zoom-out" title="Zoom out" aria-label="Zoom out"><i class="fas fa-search-minus" aria-hidden="true"></i></button>
          <button type="button" data-action="fit" title="Fit network" aria-label="Fit network"><i class="fas fa-compress-arrows-alt" aria-hidden="true"></i></button>
          <button type="button" data-action="zoom-in" title="Zoom in" aria-label="Zoom in"><i class="fas fa-search-plus" aria-hidden="true"></i></button>
        </div>
      </div>
      <div class="oni-network-canvas" id="oni-network-canvas" role="application" aria-label="Editable capacity network"></div>
      <div class="oni-connect-prompt" data-connect-prompt hidden>
        <i class="fas fa-link" aria-hidden="true"></i>
        <span data-connect-message></span>
        <button type="button" data-action="cancel-connect" title="Cancel connection" aria-label="Cancel connection"><i class="fas fa-times" aria-hidden="true"></i></button>
      </div>
      <div class="oni-flow-legend" aria-hidden="true">
        <span><i class="oni-flow-legend__line oni-flow-legend__line--low"></i><span class="lang-en">available</span><span class="lang-zh">畅通</span></span>
        <span><i class="oni-flow-legend__line oni-flow-legend__line--high"></i><span class="lang-en">near limit</span><span class="lang-zh">接近上限</span></span>
        <span><i class="oni-flow-legend__line oni-flow-legend__line--blocked"></i><span class="lang-en">disabled</span><span class="lang-zh">已停用</span></span>
      </div>
    </section>

    <aside class="oni-lab__analysis" aria-label="Network analysis">
      <section class="oni-analysis-section oni-analysis-section--metrics">
        <div class="oni-panel-heading">
          <div>
            <small><span class="lang-en">Live flow</span><span class="lang-zh">实时流量</span></small>
            <h2><span class="lang-en">Balance</span><span class="lang-zh">供需</span></h2>
          </div>
          <span class="oni-health-badge" data-health-badge>--</span>
        </div>
        <div class="oni-metrics" data-metrics></div>
      </section>

      <section class="oni-analysis-section">
        <div class="oni-panel-heading">
          <div>
            <small><span class="lang-en">Selection</span><span class="lang-zh">选中项</span></small>
            <h2><span class="lang-en">Inspector</span><span class="lang-zh">检查器</span></h2>
          </div>
        </div>
        <div class="oni-inspector" data-inspector></div>
      </section>

      <section class="oni-analysis-section oni-analysis-section--diagnostics">
        <div class="oni-panel-heading">
          <div>
            <small><span class="lang-en">Checks</span><span class="lang-zh">检查</span></small>
            <h2><span class="lang-en">Diagnostics</span><span class="lang-zh">诊断</span></h2>
          </div>
          <span data-issue-count>0</span>
        </div>
        <div class="oni-diagnostics" data-diagnostics></div>
      </section>
    </aside>
  </div>

  <div class="oni-lab-toast" data-oni-toast role="status" aria-live="polite" hidden></div>
</div>
