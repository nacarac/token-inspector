(function () {
  if (window.__dsTokenInspector) return;
  window.__dsTokenInspector = true;

  const MAX_BADGES = 300;
  const BLOCK_TAGS = new Set([
    'H1','H2','H3','H4','H5','H6','P','BLOCKQUOTE',
    'LI','DT','DD','FIGCAPTION','LABEL','TD','TH','CAPTION','A'
  ]);
  const PRIORITY_PROPS = [
    'font-size','font-family','color','background-color','background',
    'font-weight','line-height','letter-spacing','padding','margin','gap','border-radius'
  ];

  // ============================= Shadow DOM CSS =============================

  const SHADOW_CSS = `
    :host { all: initial !important; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    #container {
      position: fixed; inset: 0;
      pointer-events: none;
      z-index: 2147483647;
      overflow: visible;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Mono', Menlo, Consolas, monospace;
    }

    /* ---- Badges ---- */

    .badge {
      position: fixed;
      pointer-events: auto;
      cursor: pointer;
      font-size: 10px;
      font-family: 'SF Mono', Menlo, Consolas, monospace;
      line-height: 1;
      padding: 3px 8px;
      border-radius: 4px;
      white-space: nowrap;
      user-select: none;
      transition: transform .1s ease, opacity .15s ease;
      opacity: .92;
      box-shadow: 0 1px 4px rgba(0,0,0,.25);
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .badge:hover { transform: scale(1.08); opacity: 1; z-index: 10; }

    .badge.css-var    { background: rgba(59,130,246,.94); color: #fff; }
    .badge.imported   { background: rgba(168,85,247,.94); color: #fff; }
    .badge.remapped   { background: rgba(16,185,129,.94); color: #fff; }

    .badge .extra {
      font-size: 9px;
      opacity: .7;
      margin-left: 4px;
    }

    /* ---- Picker ---- */

    .picker {
      position: fixed;
      pointer-events: auto;
      background: #1e1e2e;
      border: 1px solid #313244;
      border-radius: 10px;
      box-shadow: 0 12px 48px rgba(0,0,0,.55);
      width: 370px;
      max-height: 560px;
      display: flex; flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      font-size: 12px;
      color: #cdd6f4;
      overflow: hidden;
      z-index: 100;
    }

    .picker-header { padding: 12px 14px; border-bottom: 1px solid #313244; }

    .picker-current-label {
      display: block; font-size: 9px; text-transform: uppercase;
      letter-spacing: .08em; color: #6c7086; margin-bottom: 3px;
    }
    .picker-current-name {
      display: block; font-size: 13px; font-weight: 600; color: #cdd6f4;
    }
    .picker-current-detail {
      display: block; font-size: 10px; font-family: 'SF Mono', Menlo, monospace;
      color: #6c7086; margin-top: 2px;
    }

    .picker-tabs {
      display: flex; border-bottom: 1px solid #313244;
    }
    .picker-tab {
      flex: 1; padding: 7px 0; text-align: center; font-size: 11px;
      cursor: pointer; color: #6c7086; border-bottom: 2px solid transparent;
      transition: color .15s, border-color .15s;
    }
    .picker-tab:hover { color: #bac2de; }
    .picker-tab.active { color: #cdd6f4; border-bottom-color: #3b82f6; }

    .picker-search {
      display: block; width: 100%; padding: 9px 14px;
      border: none; border-bottom: 1px solid #313244;
      background: #181825; color: #cdd6f4;
      font-size: 12px; outline: none; font-family: inherit;
    }
    .picker-search::placeholder { color: #585b70; }
    .picker-search:focus { background: #1e1e2e; }

    .picker-content {
      overflow-y: auto; flex: 1; padding: 4px 0;
    }
    .picker-content::-webkit-scrollbar { width: 5px; }
    .picker-content::-webkit-scrollbar-track { background: transparent; }
    .picker-content::-webkit-scrollbar-thumb { background: #45475a; border-radius: 3px; }

    .picker-section-title {
      padding: 10px 14px 4px; font-size: 9px; text-transform: uppercase;
      letter-spacing: .06em; color: #585b70; font-weight: 600;
    }

    .picker-option {
      padding: 6px 14px; cursor: pointer; transition: background .1s;
      display: flex; flex-direction: column; gap: 1px;
    }
    .picker-option:hover { background: #313244; }
    .picker-option.active { background: rgba(59,130,246,.18); border-left: 2px solid #3b82f6; }

    .picker-option-name  { font-size: 12px; font-weight: 500; color: #cdd6f4; }
    .picker-option-detail {
      font-size: 10px; color: #6c7086;
      font-family: 'SF Mono', Menlo, monospace;
    }
    .picker-empty {
      padding: 16px 14px; color: #585b70; font-size: 11px; text-align: center;
    }

    /* ---- Variant Switcher ---- */

    .picker-variants {
      padding: 12px 14px;
      border-bottom: 1px solid #313244;
    }
    .picker-variants-title {
      font-size: 9px; text-transform: uppercase; letter-spacing: .06em;
      color: #585b70; font-weight: 600; margin-bottom: 4px;
    }
    .picker-variants-prefix {
      font-size: 10px; color: #6c7086;
      font-family: 'SF Mono', Menlo, monospace;
      margin-bottom: 8px; word-break: break-all;
    }
    .picker-variants-btns {
      display: flex; flex-wrap: wrap; gap: 4px;
    }
    .picker-variant-btn {
      padding: 5px 12px;
      border: 1px solid #313244; border-radius: 6px;
      background: #181825; color: #cdd6f4;
      font-size: 12px; font-weight: 500;
      font-family: 'SF Mono', Menlo, monospace;
      cursor: pointer; transition: all .12s; user-select: none;
    }
    .picker-variant-btn:hover {
      border-color: #3b82f6; background: rgba(59,130,246,.08); color: #89b4fa;
    }
    .picker-variant-btn.active {
      background: rgba(59,130,246,.2); color: #89b4fa; border-color: #3b82f6;
    }
    .picker-variant-btn.applied {
      background: #10b981; color: #fff; border-color: #10b981;
    }
    .picker-variant-reset {
      padding: 5px 10px;
      border: 1px dashed #45475a; border-radius: 6px;
      background: transparent; color: #f38ba8;
      font-size: 11px; font-weight: 500;
      cursor: pointer; transition: all .12s; user-select: none;
    }
    .picker-variant-reset:hover {
      background: rgba(243,139,168,.08); border-color: #f38ba8;
    }
    .picker-variant-reset:disabled {
      opacity: .25; cursor: not-allowed; color: #585b70; border-color: #313244;
    }

    /* ---- Live Edit ---- */

    .picker-edit {
      padding: 10px 14px;
      border-bottom: 1px solid #313244;
      display: flex; flex-direction: column; gap: 6px;
    }

    .picker-edit-title {
      font-size: 9px; text-transform: uppercase; letter-spacing: .06em;
      color: #585b70; font-weight: 600; margin-bottom: 1px;
    }

    .picker-edit-row {
      display: flex; flex-direction: column; gap: 3px;
    }

    .picker-edit-row-top {
      display: flex; align-items: center; gap: 6px;
    }

    .picker-edit-label {
      font-size: 10px; color: #6c7086; min-width: 84px; flex-shrink: 0;
      font-family: 'SF Mono', Menlo, monospace;
    }

    .picker-edit-token-wrap {
      flex: 1; min-width: 0; position: relative;
    }

    .picker-edit-input {
      width: 100%;
      padding: 5px 8px;
      border: 1px solid #313244; border-radius: 4px;
      background: #181825; color: #cdd6f4;
      font-size: 11px; font-family: 'SF Mono', Menlo, monospace;
      outline: none; transition: border-color .15s;
    }
    .picker-edit-input:focus { border-color: #3b82f6; }
    .picker-edit-input.changed {
      border-color: #a6e3a1;
      background: rgba(166,227,161,.06);
    }

    .picker-edit-preview {
      font-size: 10px; color: #585b70;
      font-family: 'SF Mono', Menlo, monospace;
      padding: 0 2px; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis;
      flex-shrink: 0; max-width: 90px; text-align: right;
    }

    .picker-edit-dropdown {
      position: absolute; top: 100%; left: 0; right: 0;
      background: #181825; border: 1px solid #3b82f6;
      border-radius: 0 0 6px 6px;
      max-height: 160px; overflow-y: auto;
      z-index: 10; box-shadow: 0 8px 24px rgba(0,0,0,.4);
    }
    .picker-edit-dropdown::-webkit-scrollbar { width: 4px; }
    .picker-edit-dropdown::-webkit-scrollbar-thumb { background: #45475a; border-radius: 2px; }

    .picker-edit-sug {
      display: flex; justify-content: space-between; align-items: center;
      padding: 5px 8px; cursor: pointer; transition: background .08s;
      gap: 8px;
    }
    .picker-edit-sug:hover,
    .picker-edit-sug.hl { background: #313244; }
    .picker-edit-sug.current { background: rgba(59,130,246,.12); }

    .picker-edit-sug-name {
      font-size: 11px; color: #cdd6f4;
      font-family: 'SF Mono', Menlo, monospace;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      flex: 1; min-width: 0;
    }
    .picker-edit-sug .hl-match { color: #89b4fa; font-weight: 600; }

    .picker-edit-sug-val {
      font-size: 10px; color: #585b70;
      font-family: 'SF Mono', Menlo, monospace;
      white-space: nowrap; flex-shrink: 0;
    }
    .picker-edit-sug-src {
      font-size: 8px; color: #45475a; text-transform: uppercase;
      flex-shrink: 0;
    }

    .picker-edit-color {
      width: 22px; height: 22px; flex-shrink: 0;
      border: 1px solid #313244; border-radius: 4px;
      cursor: pointer; padding: 0; background: none;
      -webkit-appearance: none; appearance: none;
    }
    .picker-edit-color::-webkit-color-swatch-wrapper { padding: 1px; }
    .picker-edit-color::-webkit-color-swatch { border: none; border-radius: 2px; }

    .picker-edit-hint {
      font-size: 9px; color: #45475a; margin-top: 1px;
    }

    /* ---- Toast ---- */

    .toast {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: #1e1e2e; border: 1px solid #313244; border-radius: 8px;
      padding: 8px 18px; font-size: 12px; color: #a6e3a1;
      box-shadow: 0 6px 24px rgba(0,0,0,.4); pointer-events: none;
      animation: toast-fade 2.2s ease-in-out forwards; z-index: 200;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    }
    @keyframes toast-fade {
      0%   { opacity:0; transform: translateX(-50%) translateY(8px); }
      12%  { opacity:1; transform: translateX(-50%) translateY(0); }
      82%  { opacity:1; transform: translateX(-50%) translateY(0); }
      100% { opacity:0; transform: translateX(-50%) translateY(-6px); }
    }

    #container.badges-hidden .badge { display: none !important; }

    /* Category filter: hide non-matching badges */
    #container[data-filter="Typography"] .badge:not([data-category="Typography"]),
    #container[data-filter="Color"]      .badge:not([data-category="Color"]),
    #container[data-filter="Spacing"]    .badge:not([data-category="Spacing"]),
    #container[data-filter="Size"]       .badge:not([data-category="Size"]),
    #container[data-filter="Other"]      .badge:not([data-category="Other"]) {
      display: none !important;
    }

    /* ---- Floating Toolbar ---- */
    .toolbar {
      position: fixed; bottom: 20px; right: 20px; z-index: 100;
      display: flex; align-items: center; gap: 6px;
      padding: 6px 8px; border-radius: 10px;
      border: 1px solid #313244;
      background: #1e1e2e;
      box-shadow: 0 4px 24px rgba(0,0,0,.5);
      pointer-events: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    }
    .toolbar-select {
      appearance: none; -webkit-appearance: none;
      padding: 6px 28px 6px 10px; border-radius: 6px;
      border: 1px solid #313244; background: #181825; color: #cdd6f4;
      font: 500 11px/1.2 inherit; cursor: pointer;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236c7086'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 8px center;
      transition: border-color .15s;
    }
    .toolbar-select:hover, .toolbar-select:focus {
      border-color: #3b82f6; outline: none;
    }
    .toolbar-btn {
      display: flex; align-items: center; gap: 5px;
      padding: 6px 10px; border-radius: 6px;
      border: 1px solid #313244; background: #181825; color: #cdd6f4;
      font: 500 11px/1 inherit; cursor: pointer;
      transition: all .15s; user-select: none; white-space: nowrap;
    }
    .toolbar-btn:hover {
      border-color: #3b82f6; background: rgba(59,130,246,.06);
    }
    .toolbar-btn.hidden-state {
      border-color: #f38ba8; color: #f38ba8;
    }
    .toolbar-btn.hidden-state:hover {
      background: rgba(243,139,168,.06);
    }
    .toolbar-btn .tb-icon { font-size: 13px; line-height: 1; }
    .toolbar-changes {
      display: flex; align-items: center; gap: 5px;
      padding: 6px 10px; border-radius: 6px;
      border: 1px solid #313244; background: #181825; color: #a6e3a1;
      font: 600 11px/1 inherit; cursor: pointer;
      transition: all .15s; user-select: none;
    }
    .toolbar-changes:hover {
      border-color: #a6e3a1; background: rgba(166,227,161,.06);
    }
    .toolbar-changes[data-count="0"] { color: #585b70; }

    /* ---- Changes Panel ---- */
    .changes-panel {
      position: fixed; bottom: 64px; right: 20px; z-index: 99;
      width: 340px; max-height: 320px;
      border-radius: 10px; border: 1px solid #313244;
      background: #1e1e2e; color: #cdd6f4;
      box-shadow: 0 8px 32px rgba(0,0,0,.5);
      display: flex; flex-direction: column;
      pointer-events: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      animation: panel-slide .15s ease;
    }
    @keyframes panel-slide {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .changes-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 14px; border-bottom: 1px solid #313244;
      font-size: 10px; text-transform: uppercase; letter-spacing: .06em;
      color: #585b70; font-weight: 600;
    }
    .changes-clear {
      padding: 3px 8px; border-radius: 4px;
      border: 1px solid #45475a; background: transparent; color: #f38ba8;
      font: 500 10px inherit; cursor: pointer; transition: all .12s;
    }
    .changes-clear:hover {
      background: rgba(243,139,168,.08); border-color: #f38ba8;
    }
    .changes-list {
      overflow-y: auto; padding: 6px 0; flex: 1;
    }
    .changes-list::-webkit-scrollbar { width: 4px; }
    .changes-list::-webkit-scrollbar-thumb { background: #45475a; border-radius: 2px; }
    .change-item {
      padding: 8px 14px; font-size: 11px; line-height: 1.4;
      border-bottom: 1px solid rgba(49,50,68,.5);
    }
    .change-item:last-child { border-bottom: none; }
    .change-el { color: #89b4fa; font-weight: 500; }
    .change-prop { color: #6c7086; }
    .change-arrow { color: #585b70; margin: 0 4px; }
    .change-from { color: #f38ba8; }
    .change-to { color: #a6e3a1; }
    .changes-empty {
      padding: 20px 14px; text-align: center;
      color: #585b70; font-size: 12px;
    }
  `;

  // ============================= State =============================

  const state = {
    active: false,
    host: null,
    shadow: null,
    container: null,
    badges: [],
    remappings: [],
    picker: null,
    scrollHandler: null,
    resizeHandler: null,
    allVars: new Map(),
    elementVarUsage: new Map(),
    importedTokens: null,
    badgesVisible: true,
    toolbar: null,
    filterSelect: null,
    changesBtn: null,
    changesPanel: null
  };

  // ============================= Shadow DOM =============================

  function createUI() {
    state.host = document.createElement('token-inspector-ext');
    state.host.style.cssText =
      'position:fixed!important;inset:0!important;width:0!important;height:0!important;' +
      'z-index:2147483647!important;pointer-events:none!important;overflow:visible!important;';
    document.documentElement.appendChild(state.host);
    state.shadow = state.host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = SHADOW_CSS;
    state.shadow.appendChild(style);
    state.container = document.createElement('div');
    state.container.id = 'container';
    state.shadow.appendChild(state.container);

    // --- Toolbar ---
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';

    // Category filter dropdown
    const filterSelect = document.createElement('select');
    filterSelect.className = 'toolbar-select';
    const defaultOpt = document.createElement('option');
    defaultOpt.value = 'all';
    defaultOpt.textContent = 'All Types';
    filterSelect.appendChild(defaultOpt);
    filterSelect.addEventListener('change', () => {
      const val = filterSelect.value;
      if (val === 'all') state.container.removeAttribute('data-filter');
      else state.container.dataset.filter = val;
    });
    toolbar.appendChild(filterSelect);

    // Hide/Show toggle
    const hideBtn = document.createElement('button');
    hideBtn.type = 'button';
    hideBtn.className = 'toolbar-btn';
    hideBtn.innerHTML = '<span class="tb-icon">&#x1F3F7;</span> Hide';
    hideBtn.addEventListener('click', () => {
      state.badgesVisible = !state.badgesVisible;
      if (state.badgesVisible) {
        state.container.classList.remove('badges-hidden');
        hideBtn.innerHTML = '<span class="tb-icon">&#x1F3F7;</span> Hide';
        hideBtn.classList.remove('hidden-state');
      } else {
        closePicker();
        state.container.classList.add('badges-hidden');
        hideBtn.innerHTML = '<span class="tb-icon">&#x1F441;</span> Show';
        hideBtn.classList.add('hidden-state');
      }
    });
    toolbar.appendChild(hideBtn);

    // Changes counter
    const changesBtn = document.createElement('button');
    changesBtn.type = 'button';
    changesBtn.className = 'toolbar-changes';
    changesBtn.dataset.count = '0';
    changesBtn.textContent = '0 changes';
    changesBtn.addEventListener('click', () => toggleChangesPanel());
    toolbar.appendChild(changesBtn);

    state.shadow.appendChild(toolbar);
    state.toolbar = toolbar;
    state.filterSelect = filterSelect;
    state.changesBtn = changesBtn;
  }

  function destroyUI() {
    if (state.host) { state.host.remove(); state.host = null; state.shadow = null; state.container = null; }
    if (state.scrollHandler) { window.removeEventListener('scroll', state.scrollHandler, true); state.scrollHandler = null; }
    if (state.resizeHandler) { window.removeEventListener('resize', state.resizeHandler); state.resizeHandler = null; }
    state.badges = [];
    state.toolbar = null;
    state.filterSelect = null;
    state.changesBtn = null;
    state.changesPanel = null;
    state.badgesVisible = true;
    state.picker = null;
    state.allVars = new Map();
    state.elementVarUsage = new Map();
  }

  // ============================= CSS Variable Detection =============================

  function walkRules(ruleList, fn) {
    if (!ruleList) return;
    for (const rule of ruleList) {
      if (rule instanceof CSSStyleRule) fn(rule);
      else if (rule.cssRules) walkRules(rule.cssRules, fn);
    }
  }

  function extractAllCSSVariables() {
    const vars = new Map();

    for (const sheet of document.styleSheets) {
      try {
        walkRules(sheet.cssRules, rule => {
          for (let i = 0; i < rule.style.length; i++) {
            const prop = rule.style[i];
            if (!prop.startsWith('--')) continue;
            const value = rule.style.getPropertyValue(prop).trim();
            if (!vars.has(prop)) {
              vars.set(prop, { rawValue: value, selectors: [], resolvedValue: '' });
            }
            vars.get(prop).selectors.push(rule.selectorText);
          }
        });
      } catch (_) { /* cross-origin */ }
    }

    const rootStyle = getComputedStyle(document.documentElement);
    for (const [name, info] of vars) {
      info.resolvedValue = rootStyle.getPropertyValue(name).trim() || info.rawValue;
      info.category = categorizeVar(name, info.resolvedValue);
    }

    return vars;
  }

  function scanVariableUsage() {
    const usage = new Map();

    for (const sheet of document.styleSheets) {
      try {
        walkRules(sheet.cssRules, rule => {
          const varProps = [];
          for (let i = 0; i < rule.style.length; i++) {
            const prop = rule.style[i];
            const val = rule.style.getPropertyValue(prop);
            if (!val.includes('var(')) continue;
            for (const m of val.matchAll(/var\((--[\w-]+)/g)) {
              varProps.push({ property: prop, varName: m[1], rawCSSValue: val });
            }
          }
          if (!varProps.length) return;

          let elements;
          try { elements = document.querySelectorAll(rule.selectorText); } catch (_) { return; }

          for (const el of elements) {
            if (!usage.has(el)) usage.set(el, []);
            for (const vp of varProps) {
              usage.get(el).push({
                property: vp.property,
                varName: vp.varName,
                rawCSSValue: vp.rawCSSValue,
                resolvedValue: getComputedStyle(el).getPropertyValue(vp.property).trim()
              });
            }
          }
        });
      } catch (_) { /* cross-origin */ }
    }

    for (const [el, usages] of usage) {
      const seen = new Set();
      usage.set(el, usages.filter(u => {
        const key = `${u.property}|${u.varName}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }));
    }

    return usage;
  }

  function categorizeVar(name, value) {
    const n = name.toLowerCase();
    const v = (value || '').trim().toLowerCase();
    if (n.includes('font') || n.includes('text') || n.includes('heading') ||
        n.includes('title') || n.includes('body') || n.includes('type') ||
        n.includes('line-height') || n.includes('letter-spacing') || n.includes('leading')) return 'Typography';
    if (n.includes('color') || n.includes('bg') || n.includes('border-color') ||
        n.includes('fill') || n.includes('stroke') || n.includes('shadow') ||
        v.startsWith('#') || v.startsWith('rgb') || v.startsWith('hsl')) return 'Color';
    if (n.includes('space') || n.includes('gap') || n.includes('margin') ||
        n.includes('padding') || n.includes('inset') || n.includes('indent')) return 'Spacing';
    if (n.includes('size') || n.includes('width') || n.includes('height') ||
        n.includes('radius') || n.includes('breakpoint')) return 'Size';
    return 'Other';
  }

  // ============================= Imported Token Parsing =============================

  function parseImportedTokens(raw) {
    if (typeof raw === 'string') {
      if (raw.trim().startsWith('{')) raw = JSON.parse(raw);
      else return parseCSSVariablesText(raw);
    }
    const result = {};
    flattenTokenTree(raw, [], result, raw);
    return result;
  }

  function flattenTokenTree(obj, path, result, root) {
    if (!obj || typeof obj !== 'object') return;
    if ('value' in obj || '$value' in obj) {
      const rawValue = obj.value ?? obj.$value;
      const name = path.join('/');
      if (typeof rawValue === 'string') {
        result[name] = {
          value: resolveRefs(rawValue, root),
          type: obj.type || obj.$type || inferType(rawValue),
        };
      } else if (typeof rawValue === 'object' && rawValue !== null) {
        const resolved = {};
        for (const [k, v] of Object.entries(rawValue)) {
          resolved[k] = typeof v === 'string' ? resolveRefs(v, root) : v;
        }
        result[name] = { value: resolved, type: obj.type || obj.$type || 'composite' };
      }
      return;
    }
    for (const [key, val] of Object.entries(obj)) {
      if (key.startsWith('$') || key === '$themes' || key === 'version' || key === 'updatedAt') continue;
      if (typeof val === 'object') flattenTokenTree(val, [...path, key], result, root);
    }
  }

  function resolveRefs(value, root, depth = 0) {
    if (depth > 20 || typeof value !== 'string' || !value.includes('{')) return value;
    return value.replace(/\{([^}]+)\}/g, (match, pathStr) => {
      const parts = pathStr.split('.');
      let current = root;
      for (const p of parts) {
        if (!current || typeof current !== 'object') return match;
        current = current[p];
      }
      if (current && typeof current === 'object' && ('value' in current || '$value' in current)) {
        const v = current.value ?? current.$value;
        return typeof v === 'string' ? resolveRefs(v, root, depth + 1) : String(v);
      }
      return typeof current === 'string' ? resolveRefs(current, root, depth + 1) :
             current != null ? String(current) : match;
    });
  }

  function parseCSSVariablesText(cssText) {
    const result = {};
    for (const m of cssText.matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)) {
      result[m[1]] = { value: m[2].trim(), type: inferType(m[2].trim()) };
    }
    return result;
  }

  function inferType(value) {
    const v = (typeof value === 'string' ? value : '').trim();
    if (/^#|^rgba?\(|^hsla?\(/.test(v)) return 'color';
    if (/^\d.*(?:rem|em|px|pt|vh|vw|ch|%)$/.test(v)) return 'dimension';
    if (/^[1-9]00$/.test(v)) return 'fontWeight';
    return 'other';
  }

  // ============================= Scanning & Badging =============================

  function scan() {
    clearBadges();

    state.allVars = extractAllCSSVariables();
    state.elementVarUsage = scanVariableUsage();

    let count = 0;

    for (const [el, usages] of state.elementVarUsage) {
      if (count >= MAX_BADGES) break;
      if (!shouldBadge(el)) continue;
      const primary = pickPrimary(usages);
      if (!primary) continue;
      const varInfo = state.allVars.get(primary.varName);
      const category = varInfo ? varInfo.category : 'Other';
      createBadge(el, {
        type: 'css-var',
        category,
        label: primary.varName,
        sublabel: usages.length > 1 ? `+${usages.length - 1}` : '',
        title: usages.map(u => `${u.property}: var(${u.varName}) → ${u.resolvedValue}`).join('\n'),
        usages
      });
      count++;
    }

    reportStats(count);
    updateFilterOptions();
    startPositionUpdates();
  }

  function shouldBadge(el) {
    if (!el.offsetParent && el.tagName !== 'BODY' && el.tagName !== 'HTML') return false;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    if (el.closest('token-inspector-ext')) return false;
    if (BLOCK_TAGS.has(el.tagName)) return true;
    const parent = el.parentElement;
    if (!parent) return false;
    const pSize = parseFloat(getComputedStyle(parent).fontSize);
    return Math.abs(parseFloat(getComputedStyle(el).fontSize) - pSize) > 1;
  }

  function pickPrimary(usages) {
    for (const prop of PRIORITY_PROPS) {
      const found = usages.find(u => u.property === prop);
      if (found) return found;
    }
    return usages[0];
  }

  function createBadge(element, info) {
    const badge = document.createElement('div');
    badge.className = `badge ${info.type}`;
    badge.dataset.category = info.category || 'Other';

    const label = document.createElement('span');
    label.textContent = info.label;
    badge.appendChild(label);

    if (info.sublabel) {
      const extra = document.createElement('span');
      extra.className = 'extra';
      extra.textContent = info.sublabel;
      badge.appendChild(extra);
    }

    badge.title = info.title || info.label;

    badge.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      openPicker(badge, element, info);
    });
    badge.addEventListener('mouseenter', () => {
      element.style.outline = '2px solid rgba(59,130,246,.5)';
      element.style.outlineOffset = '2px';
    });
    badge.addEventListener('mouseleave', () => {
      element.style.outline = '';
      element.style.outlineOffset = '';
    });

    state.container.appendChild(badge);
    state.badges.push({ badge, element, info });
    positionBadge(badge, element);
  }

  function updateFilterOptions() {
    if (!state.filterSelect) return;
    const counts = {};
    let total = 0;
    for (const { badge } of state.badges) {
      const cat = badge.dataset.category;
      counts[cat] = (counts[cat] || 0) + 1;
      total++;
    }
    const current = state.filterSelect.value;
    state.filterSelect.innerHTML = '';
    const allOpt = document.createElement('option');
    allOpt.value = 'all';
    allOpt.textContent = `All Types (${total})`;
    state.filterSelect.appendChild(allOpt);

    const order = ['Typography', 'Color', 'Spacing', 'Size', 'Other'];
    for (const cat of order) {
      if (!counts[cat]) continue;
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = `${cat} (${counts[cat]})`;
      state.filterSelect.appendChild(opt);
    }
    state.filterSelect.value = counts[current] ? current : 'all';
    if (state.filterSelect.value === 'all') state.container.removeAttribute('data-filter');
  }

  function positionBadge(badge, element) {
    const r = element.getBoundingClientRect();
    badge.style.top = `${r.top - 20}px`;
    badge.style.left = `${r.left}px`;
    badge.style.display = (r.bottom < -60 || r.top > window.innerHeight + 60) ? 'none' : '';
  }

  function clearBadges() {
    for (const { badge } of state.badges) badge.remove();
    state.badges = [];
    closePicker();
  }

  // ============================= Position Updates =============================

  function startPositionUpdates() {
    let ticking = false;
    const update = () => {
      for (const { badge, element } of state.badges) positionBadge(badge, element);
      ticking = false;
    };
    const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    state.scrollHandler = request;
    state.resizeHandler = request;
    window.addEventListener('scroll', request, { passive: true, capture: true });
    window.addEventListener('resize', request, { passive: true });
    request();
  }

  // ============================= Changes Panel =============================

  function updateChangesCount() {
    if (!state.changesBtn) return;
    const n = state.remappings.length;
    state.changesBtn.dataset.count = String(n);
    state.changesBtn.textContent = `${n} change${n !== 1 ? 's' : ''}`;
    if (state.changesPanel) renderChangesPanel();
  }

  function toggleChangesPanel() {
    if (state.changesPanel) {
      state.changesPanel.remove();
      state.changesPanel = null;
      return;
    }
    const panel = document.createElement('div');
    panel.className = 'changes-panel';
    state.changesPanel = panel;
    renderChangesPanel();
    state.shadow.appendChild(panel);
  }

  function renderChangesPanel() {
    const panel = state.changesPanel;
    if (!panel) return;
    panel.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'changes-header';
    const title = document.createElement('span');
    title.textContent = `Changes (${state.remappings.length})`;
    header.appendChild(title);

    if (state.remappings.length > 0) {
      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'changes-clear';
      clearBtn.textContent = 'Clear All';
      clearBtn.addEventListener('click', () => clearAllRemappings());
      header.appendChild(clearBtn);
    }
    panel.appendChild(header);

    const list = document.createElement('div');
    list.className = 'changes-list';

    if (state.remappings.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'changes-empty';
      empty.textContent = 'No changes yet';
      list.appendChild(empty);
    } else {
      for (let i = state.remappings.length - 1; i >= 0; i--) {
        const r = state.remappings[i];
        const item = document.createElement('div');
        item.className = 'change-item';
        item.innerHTML =
          `<span class="change-el">${escHtml(r.element)}</span> ` +
          `<span class="change-prop">${escHtml(r.property)}</span><br>` +
          `<span class="change-from">${escHtml(r.from)}</span>` +
          `<span class="change-arrow">\u2192</span>` +
          `<span class="change-to">${escHtml(r.to)}</span>`;
        list.appendChild(item);
      }
    }
    panel.appendChild(list);
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function clearAllRemappings() {
    for (const { badge, element, info } of state.badges) {
      element.style.cssText = '';
      badge.firstChild.textContent = info.label;
      badge.className = `badge ${info.type}`;
      badge.dataset.category = info.category || 'Other';
    }
    state.remappings.length = 0;
    updateChangesCount();
    showToast('All changes cleared');
  }

  // ============================= Variant Switcher =============================

  const SIZE_VARIANTS = [
    '4xs','3xs','2xs','xs','sm','md','lg','xl',
    '2xl','3xl','4xl','5xl','6xl','7xl','8xl',
    '9xl','10xl','11xl','12xl','13xl','14xl','15xl'
  ];
  const SIZE_SET = new Set(SIZE_VARIANTS);

  function buildVariantSwitcher(element, info, badge) {
    const usages = info.usages || [];
    if (!usages.length) return null;

    const primaryVar = usages[0].varName;
    const parts = primaryVar.split('-');

    let variantIdx = -1;
    let currentVariant = null;
    for (let i = parts.length - 1; i >= 0; i--) {
      if (SIZE_SET.has(parts[i])) {
        variantIdx = i;
        currentVariant = parts[i];
        break;
      }
    }
    if (variantIdx === -1) return null;

    const prefix = parts.slice(0, variantIdx).join('-') + '-';

    // Collect ALL suffixes and variants from page variables with this prefix
    const allSuffixes = new Set();
    const foundVariants = new Set();
    for (const [name] of state.allVars) {
      if (!name.startsWith(prefix)) continue;
      const rest = name.slice(prefix.length);
      const restParts = rest.split('-');
      if (!SIZE_SET.has(restParts[0])) continue;
      foundVariants.add(restParts[0]);
      allSuffixes.add(restParts.slice(1).join('-'));
    }

    if (foundVariants.size <= 1) return null;

    const sorted = SIZE_VARIANTS.filter(v => foundVariants.has(v));
    if (!sorted.length) return null;

    const originalVariant = currentVariant;
    let activeVariant = currentVariant;
    const appliedOverrides = [];

    function clearOverrides() {
      for (const varName of appliedOverrides) {
        element.style.removeProperty(varName);
      }
      appliedOverrides.length = 0;
    }

    function resolveVarValue(varName) {
      const entry = state.allVars.get(varName);
      if (entry) {
        if (entry.resolvedValue) return entry.resolvedValue;
        if (entry.rawValue) return entry.rawValue;
      }
      return getComputedStyle(element).getPropertyValue(varName).trim();
    }

    function suffixToCSS(suffix) {
      return suffix.replace(/([A-Z])/g, '-$1').toLowerCase();
    }

    function applyVariant(targetVariant) {
      clearOverrides();
      if (targetVariant === originalVariant) return;

      const touched = new Set();
      let applied = 0;

      for (const suffix of allSuffixes) {
        const targetVarFull = suffix ? `${prefix}${targetVariant}-${suffix}` : `${prefix}${targetVariant}`;
        const originalVarFull = suffix ? `${prefix}${originalVariant}-${suffix}` : `${prefix}${originalVariant}`;
        const targetValue = resolveVarValue(targetVarFull);

        if (!targetValue) continue;

        // Strategy 1: override the original variant's CSS variable values
        element.style.setProperty(originalVarFull, targetValue, 'important');
        appliedOverrides.push(originalVarFull);
        applied++;

        // Strategy 2: directly set the mapped CSS property.
        // For non-empty suffixes like "fontSize" → "font-size".
        // For empty suffix, the value is likely a font shorthand
        // (e.g. "400 1.5rem/120% ModernMTPro") — apply it as the
        // `font` property so it overrides CSS-in-JS decomposed props.
        if (suffix) {
          const cssProp = suffixToCSS(suffix);
          element.style.setProperty(cssProp, targetValue, 'important');
          appliedOverrides.push(cssProp);
          touched.add(cssProp);
        } else {
          element.style.setProperty('font', targetValue, 'important');
          appliedOverrides.push('font');
          touched.add('font');
        }
      }

      // Strategy 3: for each detected var() usage, point the CSS property
      // at the new variant's variable.
      for (const u of usages) {
        if (touched.has(u.property)) continue;
        const uParts = u.varName.split('-');
        for (let i = uParts.length - 1; i >= 0; i--) {
          if (uParts[i] === originalVariant) {
            uParts[i] = targetVariant;
            break;
          }
        }
        const newVarName = uParts.join('-');
        if (state.allVars.has(newVarName)) {
          element.style.setProperty(u.property, `var(${newVarName})`, 'important');
          appliedOverrides.push(u.property);
          applied++;
        }
      }

    }

    const container = document.createElement('div');
    container.className = 'picker-variants';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;';

    const title = document.createElement('div');
    title.className = 'picker-variants-title';
    title.textContent = 'Size Variant';
    header.appendChild(title);

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'picker-variant-reset';
    resetBtn.textContent = '\u21BA Reset';
    resetBtn.disabled = true;
    header.appendChild(resetBtn);

    container.appendChild(header);

    const prefixEl = document.createElement('div');
    prefixEl.className = 'picker-variants-prefix';
    prefixEl.textContent = prefix;
    container.appendChild(prefixEl);

    const btns = document.createElement('div');
    btns.className = 'picker-variants-btns';

    function updateButtons() {
      for (const b of btns.children) {
        b.classList.remove('active', 'applied');
        if (b.textContent === originalVariant && activeVariant === originalVariant) {
          b.classList.add('active');
        } else if (b.textContent === activeVariant && activeVariant !== originalVariant) {
          b.classList.add('applied');
        }
      }
      resetBtn.disabled = (activeVariant === originalVariant);
    }

    resetBtn.addEventListener('click', () => {
      clearOverrides();
      activeVariant = originalVariant;

      badge.firstChild.textContent = info.label;
      badge.className = `badge ${info.type}`;

      updateButtons();
      showToast('Reset to original');
    });

    for (const variant of sorted) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `picker-variant-btn${variant === currentVariant ? ' active' : ''}`;
      btn.textContent = variant;

      btn.addEventListener('click', () => {
        if (variant === activeVariant) return;

        const fromVariant = activeVariant;
        activeVariant = variant;
        applyVariant(variant);

        updateButtons();

        badge.firstChild.textContent = info.label.replace(originalVariant, variant);
        badge.className = variant === originalVariant ? `badge ${info.type}` : 'badge remapped';

        state.remappings.push({
          timestamp: new Date().toISOString(),
          element: describeElement(element),
          property: 'variant-swap',
          from: fromVariant,
          to: variant,
          prefix,
          mode: 'variant-swap'
        });
        updateChangesCount();

        showToast(variant === originalVariant ? 'Reset to original' : `${fromVariant} \u2192 ${variant}`);
      });

      btns.appendChild(btn);
    }

    container.appendChild(btns);
    return container;
  }

  // ============================= Live Edit =============================

  const EDIT_PROPS = [
    { prop: 'font-size',       label: 'font-size',       isColor: false },
    { prop: 'font-weight',     label: 'font-weight',     isColor: false },
    { prop: 'font-family',     label: 'font-family',     isColor: false },
    { prop: 'color',           label: 'color',           isColor: true },
    { prop: 'line-height',     label: 'line-height',     isColor: false },
    { prop: 'letter-spacing',  label: 'letter-spacing',  isColor: false },
    { prop: 'background-color',label: 'background',      isColor: true },
  ];

  function buildEditSection(element, info) {
    const section = document.createElement('div');
    section.className = 'picker-edit';

    const title = document.createElement('div');
    title.className = 'picker-edit-title';
    title.textContent = 'Live Edit \u2014 type a token name or raw value';
    section.appendChild(title);

    const cs = getComputedStyle(element);

    const varMap = {};
    if (info.usages) {
      for (const u of info.usages) varMap[u.property] = u.varName;
    }

    for (const { prop, label, isColor } of EDIT_PROPS) {
      const resolved = cs.getPropertyValue(prop).trim();
      if (prop === 'background-color' &&
          (resolved === 'rgba(0, 0, 0, 0)' || resolved === 'transparent')) continue;

      const currentVar = varMap[prop] || null;
      const row = document.createElement('div');
      row.className = 'picker-edit-row';

      const top = document.createElement('div');
      top.className = 'picker-edit-row-top';

      const labelEl = document.createElement('span');
      labelEl.className = 'picker-edit-label';
      labelEl.textContent = label;
      top.appendChild(labelEl);

      const wrap = document.createElement('div');
      wrap.className = 'picker-edit-token-wrap';

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'picker-edit-input';
      input.value = currentVar || resolved;
      input.placeholder = 'token name or value\u2026';
      let origToken = currentVar;
      let origValue = resolved;

      const dropdown = document.createElement('div');
      dropdown.className = 'picker-edit-dropdown';
      dropdown.hidden = true;
      let hlIndex = -1;

      const preview = document.createElement('span');
      preview.className = 'picker-edit-preview';
      preview.textContent = resolved;

      function getSuggestions(q) {
        q = q.toLowerCase();
        const out = [];
        for (const [name, vi] of state.allVars) {
          if (name.toLowerCase().includes(q)) {
            out.push({ name, value: vi.resolvedValue || vi.rawValue, src: 'var' });
          }
        }
        if (state.importedTokens) {
          for (const [name, tk] of Object.entries(state.importedTokens)) {
            if (name.toLowerCase().includes(q)) {
              const v = typeof tk.value === 'object'
                ? Object.entries(tk.value).map(([k, val]) => `${k}:${val}`).join(', ')
                : String(tk.value);
              out.push({ name, value: v, src: 'imported' });
            }
          }
        }
        return out.slice(0, 20);
      }

      function renderDropdown() {
        const q = input.value;
        if (!q) { dropdown.hidden = true; return; }
        const suggestions = getSuggestions(q);
        dropdown.innerHTML = '';
        hlIndex = -1;

        if (!suggestions.length) { dropdown.hidden = true; return; }

        for (const s of suggestions) {
          const row = document.createElement('div');
          row.className = `picker-edit-sug${s.name === origToken ? ' current' : ''}`;

          const nameEl = document.createElement('span');
          nameEl.className = 'picker-edit-sug-name';
          nameEl.innerHTML = highlightMatch(s.name, q);
          row.appendChild(nameEl);

          const valEl = document.createElement('span');
          valEl.className = 'picker-edit-sug-val';
          valEl.textContent = s.value;
          row.appendChild(valEl);

          if (s.src === 'imported') {
            const src = document.createElement('span');
            src.className = 'picker-edit-sug-src';
            src.textContent = 'imported';
            row.appendChild(src);
          }

          row.addEventListener('pointerdown', e => {
            e.preventDefault();
            commitSuggestion(s);
          });
          dropdown.appendChild(row);
        }
        dropdown.hidden = false;
      }

      function highlightMatch(text, query) {
        const i = text.toLowerCase().indexOf(query.toLowerCase());
        if (i === -1) return esc(text);
        return esc(text.slice(0, i)) +
          `<span class="hl-match">${esc(text.slice(i, i + query.length))}</span>` +
          esc(text.slice(i + query.length));
      }

      function commitSuggestion(s) {
        input.value = s.name;
        dropdown.hidden = true;
        input.classList.add('changed');

        if (s.src === 'var') {
          element.style.setProperty(prop, `var(${s.name})`);
        } else if (s.src === 'imported') {
          applyImportedTokenByName(element, prop, s.name);
        }

        preview.textContent = getComputedStyle(element).getPropertyValue(prop).trim();

        state.remappings.push({
          timestamp: new Date().toISOString(),
          element: describeElement(element),
          property: prop,
          from: origToken || origValue,
          to: s.name,
          mode: 'token-edit'
        });
        updateChangesCount();
        showToast(`${origToken || label} \u2192 ${s.name}`);
        origToken = s.name;
        origValue = preview.textContent;
      }

      function applyRawValue(val) {
        element.style.setProperty(prop, val);
        preview.textContent = getComputedStyle(element).getPropertyValue(prop).trim();
        input.classList.add('changed');
      }

      input.addEventListener('input', () => {
        const v = input.value.trim();
        renderDropdown();
        if (!dropdown.hidden) return;
        applyRawValue(v);
      });

      input.addEventListener('focus', renderDropdown);
      input.addEventListener('blur', () => {
        setTimeout(() => { dropdown.hidden = true; }, 200);
      });

      input.addEventListener('keydown', e => {
        const items = dropdown.querySelectorAll('.picker-edit-sug');
        if (e.key === 'ArrowDown' && !dropdown.hidden) {
          e.preventDefault();
          hlIndex = Math.min(hlIndex + 1, items.length - 1);
          updateHL(items);
          previewHL(items);
        } else if (e.key === 'ArrowUp' && !dropdown.hidden) {
          e.preventDefault();
          hlIndex = Math.max(hlIndex - 1, 0);
          updateHL(items);
          previewHL(items);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (!dropdown.hidden && hlIndex >= 0 && items[hlIndex]) {
            const name = items[hlIndex].querySelector('.picker-edit-sug-name').textContent;
            const s = getSuggestions(input.value).find(sg => sg.name === name);
            if (s) commitSuggestion(s);
          } else {
            applyRawValue(input.value.trim());
            state.remappings.push({
              timestamp: new Date().toISOString(),
              element: describeElement(element),
              property: prop,
              from: origToken || origValue,
              to: input.value.trim(),
              mode: 'direct-edit'
            });
            updateChangesCount();
            showToast(`${label}: ${input.value.trim()}`);
            origValue = input.value.trim();
          }
          dropdown.hidden = true;
        } else if (e.key === 'Escape') {
          if (!dropdown.hidden) { dropdown.hidden = true; e.stopPropagation(); }
        }
      });

      function updateHL(items) {
        for (let i = 0; i < items.length; i++) items[i].classList.toggle('hl', i === hlIndex);
        if (items[hlIndex]) items[hlIndex].scrollIntoView({ block: 'nearest' });
      }

      function previewHL(items) {
        if (!items[hlIndex]) return;
        const name = items[hlIndex].querySelector('.picker-edit-sug-name').textContent;
        const s = getSuggestions(input.value).find(sg => sg.name === name);
        if (s && s.src === 'var') {
          element.style.setProperty(prop, `var(${s.name})`);
        } else if (s && s.src === 'imported') {
          applyImportedTokenByName(element, prop, s.name);
        }
        preview.textContent = getComputedStyle(element).getPropertyValue(prop).trim();
      }

      wrap.appendChild(input);
      wrap.appendChild(dropdown);
      top.appendChild(wrap);
      top.appendChild(preview);

      if (isColor) {
        const swatch = document.createElement('input');
        swatch.type = 'color';
        swatch.className = 'picker-edit-color';
        swatch.value = rgbToHex(resolved) || '#000000';
        swatch.addEventListener('input', () => {
          input.value = swatch.value;
          applyRawValue(swatch.value);
        });
        top.appendChild(swatch);
      }

      row.appendChild(top);
      section.appendChild(row);
    }

    const hint = document.createElement('div');
    hint.className = 'picker-edit-hint';
    hint.textContent = '\u2191\u2193 navigate suggestions \u00b7 Enter to apply \u00b7 or type any CSS value';
    section.appendChild(hint);

    return section;
  }

  function applyImportedTokenByName(element, prop, tokenName) {
    if (!state.importedTokens || !state.importedTokens[tokenName]) return;
    const tk = state.importedTokens[tokenName];
    const val = tk.value;
    if (typeof val === 'string') {
      element.style.setProperty(prop, val);
    } else if (typeof val === 'object') {
      if (val.fontSize && prop === 'font-size') element.style.fontSize = val.fontSize;
      else if (val.fontWeight && prop === 'font-weight') element.style.fontWeight = String(val.fontWeight);
      else if (val.fontFamily && prop === 'font-family') element.style.fontFamily = val.fontFamily;
      else if (val.lineHeight && prop === 'line-height') element.style.lineHeight = val.lineHeight;
      else if (val.letterSpacing && prop === 'letter-spacing') element.style.letterSpacing = val.letterSpacing;
      else if (val.color && prop === 'color') element.style.color = val.color;
      else {
        const first = Object.values(val).find(v => typeof v === 'string');
        if (first) element.style.setProperty(prop, first);
      }
    }
  }

  function rgbToHex(rgb) {
    if (typeof rgb === 'string' && rgb.startsWith('#')) return rgb;
    const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return null;
    return '#' + [m[1], m[2], m[3]].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
  }

  // ============================= Token Picker =============================

  function openPicker(badge, element, info) {
    closePicker();

    const picker = document.createElement('div');
    picker.className = 'picker';

    // Header
    const header = document.createElement('div');
    header.className = 'picker-header';
    header.innerHTML =
      `<span class="picker-current-label">Element Token</span>` +
      `<span class="picker-current-name">${esc(info.label)}</span>` +
      `<span class="picker-current-detail">${esc(info.usages ? info.usages[0].property + ': ' + info.usages[0].resolvedValue : '')}</span>`;
    picker.appendChild(header);

    // Variant switcher (shows size buttons like xs, sm, md, lg...)
    const variantSwitcher = buildVariantSwitcher(element, info, badge);
    if (variantSwitcher) picker.appendChild(variantSwitcher);

    // Live Edit section
    const editSection = buildEditSection(element, info);
    picker.appendChild(editSection);

    // Tabs: CSS Vars | Imported (if available)
    const hasImported = state.importedTokens && Object.keys(state.importedTokens).length > 0;
    let activeTab = 'vars';

    const tabBar = document.createElement('div');
    tabBar.className = 'picker-tabs';
    const varTab = makeTab('Page Variables', 'vars');
    tabBar.appendChild(varTab);
    if (hasImported) {
      tabBar.appendChild(makeTab('Imported Tokens', 'imported'));
    }
    picker.appendChild(tabBar);

    // Search
    const search = document.createElement('input');
    search.type = 'text';
    search.className = 'picker-search';
    search.placeholder = 'Search\u2026';
    picker.appendChild(search);

    // Content
    const content = document.createElement('div');
    content.className = 'picker-content';
    picker.appendChild(content);

    function makeTab(label, id) {
      const tab = document.createElement('div');
      tab.className = `picker-tab${id === activeTab ? ' active' : ''}`;
      tab.textContent = label;
      tab.dataset.tab = id;
      tab.addEventListener('click', () => {
        activeTab = id;
        for (const t of tabBar.children) t.classList.toggle('active', t.dataset.tab === id);
        renderContent();
      });
      return tab;
    }

    function renderContent() {
      content.innerHTML = '';
      search.value = '';

      if (activeTab === 'vars') {
        renderCSSVarOptions(content, info);
      } else {
        renderImportedOptions(content, info);
      }
    }

    function renderCSSVarOptions(container, info) {
      const currentProp = info.usages?.[0]?.property;
      const currentVarName = info.usages?.[0]?.varName;

      // Group by category
      const groups = {};
      for (const [name, varInfo] of state.allVars) {
        const cat = varInfo.category;
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push({ name, ...varInfo });
      }

      const order = ['Typography', 'Color', 'Spacing', 'Size', 'Other'];
      for (const cat of order) {
        const items = groups[cat];
        if (!items || !items.length) continue;
        items.sort((a, b) => a.name.localeCompare(b.name));

        addSectionTitle(container, `${cat} (${items.length})`);

        for (const item of items) {
          const opt = makeOption(
            item.name,
            item.resolvedValue || item.rawValue,
            item.name === currentVarName,
            () => {
              applyVarRemap(element, currentProp, item.name, currentVarName);
              updateBadgeAfterRemap(badge, item.name);
              closePicker();
            }
          );
          container.appendChild(opt);
        }
      }

      if (state.allVars.size === 0) {
        const empty = document.createElement('div');
        empty.className = 'picker-empty';
        empty.textContent = 'No CSS custom properties detected on this page.';
        container.appendChild(empty);
      }
    }

    function renderImportedOptions(container) {
      if (!state.importedTokens) return;

      const groups = {};
      for (const [name, token] of Object.entries(state.importedTokens)) {
        const t = token.type || 'other';
        if (!groups[t]) groups[t] = [];
        const displayValue = typeof token.value === 'object'
          ? Object.entries(token.value).map(([k, v]) => `${k}: ${v}`).join(', ')
          : String(token.value);
        groups[t].push({ name, displayValue, token });
      }

      for (const [type, items] of Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))) {
        items.sort((a, b) => a.name.localeCompare(b.name));
        addSectionTitle(container, `${type} (${items.length})`);

        for (const item of items) {
          const opt = makeOption(
            item.name,
            item.displayValue,
            false,
            () => {
              applyImportedToken(element, item.token);
              updateBadgeAfterRemap(badge, item.name, 'imported');
              closePicker();
              showToast(`Applied ${item.name}`);
            }
          );
          container.appendChild(opt);
        }
      }
    }

    // Search filtering
    search.addEventListener('input', () => {
      const q = search.value.toLowerCase();
      for (const opt of content.querySelectorAll('.picker-option')) {
        opt.style.display = opt.textContent.toLowerCase().includes(q) ? '' : 'none';
      }
      for (const title of content.querySelectorAll('.picker-section-title')) {
        const sibs = nextOptionsUntilTitle(title);
        title.style.display = sibs.some(o => o.style.display !== 'none') ? '' : 'none';
      }
    });

    // Position
    const r = badge.getBoundingClientRect();
    if (window.innerHeight - r.bottom > 200) picker.style.top = `${r.bottom + 4}px`;
    else picker.style.bottom = `${window.innerHeight - r.top + 4}px`;
    picker.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - 382))}px`;

    state.container.appendChild(picker);
    state.picker = { picker, badge, element, info };
    renderContent();

    setTimeout(() => search.focus(), 0);

    const closeOnClick = e => {
      // Inside a closed Shadow DOM, e.target is retargeted to the shadow
      // host for any click within the shadow tree. So we check whether the
      // click landed on the host (i.e. somewhere inside our shadow UI) and
      // only close if it didn't.
      if (e.target === state.host) return;
      closePicker();
      document.removeEventListener('pointerdown', closeOnClick, true);
    };
    setTimeout(() => document.addEventListener('pointerdown', closeOnClick, true), 10);

    document.addEventListener('keydown', function escHandler(e) {
      if (e.key !== 'Escape') return;
      const focused = state.shadow && state.shadow.activeElement;
      if (focused && focused.classList.contains('picker-edit-input')) {
        focused.blur();
        return;
      }
      closePicker();
      document.removeEventListener('keydown', escHandler, true);
    }, true);
  }

  function addSectionTitle(container, text) {
    const el = document.createElement('div');
    el.className = 'picker-section-title';
    el.textContent = text;
    container.appendChild(el);
  }

  function makeOption(name, detail, isActive, onClick) {
    const el = document.createElement('div');
    el.className = `picker-option${isActive ? ' active' : ''}`;
    el.innerHTML =
      `<div class="picker-option-name">${esc(name)}</div>` +
      `<div class="picker-option-detail">${esc(detail)}</div>`;
    el.addEventListener('click', e => { e.stopPropagation(); onClick(); });
    return el;
  }

  function nextOptionsUntilTitle(el) {
    const opts = [];
    let sib = el.nextElementSibling;
    while (sib && !sib.classList.contains('picker-section-title')) {
      if (sib.classList.contains('picker-option')) opts.push(sib);
      sib = sib.nextElementSibling;
    }
    return opts;
  }

  function closePicker() {
    if (state.picker) { state.picker.picker.remove(); state.picker = null; }
  }

  // ============================= Applying Changes =============================

  function applyVarRemap(element, property, newVarName, oldVarName) {
    if (property) element.style.setProperty(property, `var(${newVarName})`);

    state.remappings.push({
      timestamp: new Date().toISOString(),
      element: describeElement(element),
      property,
      from: oldVarName,
      to: newVarName,
      mode: 'css-var'
    });
    updateChangesCount();
  }

  function applyImportedToken(element, token) {
    const val = token.value;
    if (typeof val === 'string') {
      const type = token.type || '';
      if (type.includes('color')) element.style.color = val;
      else if (type.includes('font') && type.includes('eight')) element.style.fontWeight = val;
      else if (type.includes('font') && type.includes('amil')) element.style.fontFamily = val;
      else element.style.fontSize = val;
    } else if (typeof val === 'object') {
      if (val.fontSize) element.style.fontSize = val.fontSize;
      if (val.fontWeight) element.style.fontWeight = String(val.fontWeight);
      if (val.fontFamily) element.style.fontFamily = val.fontFamily;
      if (val.lineHeight) element.style.lineHeight = val.lineHeight;
      if (val.letterSpacing) element.style.letterSpacing = val.letterSpacing;
      if (val.color) element.style.color = val.color;
    }
  }

  function updateBadgeAfterRemap(badge, newLabel, type) {
    badge.firstChild.textContent = newLabel;
    badge.className = `badge ${type || 'remapped'}`;
  }

  // ============================= Utilities =============================

  function describeElement(el) {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const cls = el.className && typeof el.className === 'string'
      ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    const text = (el.textContent || '').substring(0, 50).trim();
    return `<${tag}${id}${cls}> "${text}"`;
  }

  function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    state.container.appendChild(t);
    t.addEventListener('animationend', () => t.remove());
  }

  function reportStats(badgeCount) {
    try {
      chrome.runtime.sendMessage({
        type: 'STATS',
        vars: state.allVars.size,
        badges: badgeCount,
        imported: state.importedTokens ? Object.keys(state.importedTokens).length : 0
      });
    } catch (_) {}
  }

  // ============================= Lifecycle =============================

  function activate(data) {
    deactivate();
    state.active = true;
    if (data.importedTokens) {
      try { state.importedTokens = parseImportedTokens(data.importedTokens); } catch (_) {}
    }
    createUI();
    scan();
  }

  function deactivate() {
    state.active = false;
    destroyUI();
    state.importedTokens = null;
    state.remappings = [];
  }

  // ============================= Messages =============================

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'ACTIVATE') {
      activate(msg);
      sendResponse({ ok: true });
    } else if (msg.type === 'DEACTIVATE') {
      deactivate();
      sendResponse({ ok: true });
    } else if (msg.type === 'IMPORT_TOKENS') {
      try {
        state.importedTokens = parseImportedTokens(msg.tokens);
        sendResponse({ ok: true, count: Object.keys(state.importedTokens).length });
      } catch (e) {
        sendResponse({ ok: false, error: e.message });
      }
    } else if (msg.type === 'GET_REMAPPINGS') {
      sendResponse({ remappings: state.remappings });
    }
    return true;
  });
})();
