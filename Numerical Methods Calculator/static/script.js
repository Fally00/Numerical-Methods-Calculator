"use strict";

// ═══════════════════════════════════════════════════════════════════
//  STATE & RENDERERS FOR MATRIX INPUTS
// ═══════════════════════════════════════════════════════════════════

const state = {
  matrixSizes: {
    'doolittle-matrix-container': 3,
    'gauss_seidel-matrix-container': 3,
    'jacobi-matrix-container': 3,
    'thomas-matrix-container': 4
  }
};

function renderSystemInput(containerId, hasX0 = false) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const n = state.matrixSizes[containerId];
  
  let html = `
    <div class="matrix-size-control">
      <span class="matrix-size-label">System Size (n)</span>
      <div class="size-stepper">
        <button type="button" class="size-btn size-minus" data-container="${containerId}">-</button>
        <div class="size-display">${n}<span class="size-suffix">×${n}</span></div>
        <button type="button" class="size-btn size-plus" data-container="${containerId}">+</button>
      </div>
    </div>
    <div class="matrix-outer">
      <div class="matrix-label-inline">A</div>
      <div class="matrix-bracket">
        <div class="matrix-col-headers" style="grid-template-columns: 14px repeat(${n}, 56px);">
          <div style="width: 14px;"></div>
  `;
  for(let j=0; j<n; j++) {
    html += `<div class="matrix-col-header">x${j+1}</div>`;
  }
  html += `</div><div class="matrix-grid">`;
  
  for(let i=0; i<n; i++) {
    html += `<div class="matrix-row">
      <div class="matrix-row-label">${i+1}</div>`;
    for(let j=0; j<n; j++) {
      let extraClass = "cell-sub-diag";
      if (i<j) extraClass = "cell-super-diag";
      if (i===j) extraClass = "cell-diagonal";
      html += `<input type="number" step="any" required class="matrix-cell ${extraClass}" data-matrix="A" data-row="${i}" data-col="${j}" value="">`;
    }
    html += `</div>`;
  }
  
  html += `
        </div>
      </div>
      <div class="matrix-equals">=</div>
      <div class="matrix-label-inline">b</div>
      <div class="vector-bracket">
  `;
  for(let i=0; i<n; i++) {
    html += `<input type="number" step="any" required class="matrix-cell" data-matrix="b" data-row="${i}" value="">`;
  }
  html += `</div>`;
  
  if (hasX0) {
    html += `
      <div style="width: 100%;"></div>
      <div class="matrix-label-inline" style="margin-top: 10px;">x₀</div>
      <div class="vector-bracket" style="margin-top: 10px;">
    `;
    for(let i=0; i<n; i++) {
      html += `<input type="number" step="any" required class="matrix-cell" data-matrix="x0" data-row="${i}" value="0">`;
    }
    html += `</div>`;
  }

  html += `</div>`; // .matrix-outer
  
  container.innerHTML = html;
}

function renderTridiagInput(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const n = state.matrixSizes[containerId];
  
  let html = `
    <div class="matrix-size-control">
      <span class="matrix-size-label">System Size (n)</span>
      <div class="size-stepper">
        <button type="button" class="size-btn size-minus" data-container="${containerId}">-</button>
        <div class="size-display">${n}<span class="size-suffix">×${n}</span></div>
        <button type="button" class="size-btn size-plus" data-container="${containerId}">+</button>
      </div>
    </div>
    <div class="tridiag-wrapper">
      <div class="tridiag-row">
        <div class="tridiag-row-label">Upper c</div>
        <div class="tridiag-cells">
          <div class="tridiag-gap"><div class="tridiag-gap-dot"></div></div>
  `;
  for(let i=0; i<n-1; i++) {
    html += `<input type="number" step="any" required class="matrix-cell cell-super-diag" data-matrix="c" data-row="${i}" value="">`;
  }
  html += `</div></div>
      <div class="tridiag-row">
        <div class="tridiag-row-label">Main b</div>
        <div class="tridiag-cells">
  `;
  for(let i=0; i<n; i++) {
    html += `<input type="number" step="any" required class="matrix-cell cell-diagonal" data-matrix="b" data-row="${i}" value="">`;
  }
  html += `</div></div>
      <div class="tridiag-row">
        <div class="tridiag-row-label">Lower a</div>
        <div class="tridiag-cells">
  `;
  for(let i=0; i<n-1; i++) {
    html += `<input type="number" step="any" required class="matrix-cell cell-sub-diag" data-matrix="a" data-row="${i}" value="">`;
  }
  html += `<div class="tridiag-gap"><div class="tridiag-gap-dot"></div></div>
        </div></div>
      <div class="tridiag-row" style="margin-top: 8px;">
        <div class="tridiag-row-label">RHS d</div>
        <div class="tridiag-cells">
  `;
  for(let i=0; i<n; i++) {
    html += `<input type="number" step="any" required class="matrix-cell" data-matrix="d" data-row="${i}" value="">`;
  }
  html += `</div></div></div>`;
  
  container.innerHTML = html;
}

function getMatrixFromDOM(containerId, matrixName, rows, cols) {
  const container = document.getElementById(containerId);
  const matrix = [];
  for (let i = 0; i < rows; i++) {
    matrix[i] = [];
    for (let j = 0; j < cols; j++) {
      let q = `.matrix-cell[data-matrix="${matrixName}"][data-row="${i}"]`;
      if (cols > 1) q += `[data-col="${j}"]`;
      const el = container.querySelector(q);
      matrix[i][j] = el ? (parseFloat(el.value) || 0) : 0;
    }
  }
  if (cols === 1) return matrix.map(row => row[0]);
  return matrix;
}

// ═══════════════════════════════════════════════════════════════════
//  HELPERS — UI
// ═══════════════════════════════════════════════════════════════════

function setLoading(btn, isLoading) {
  const textEl    = btn.querySelector(".btn-text");
  const spinnerEl = btn.querySelector(".btn-spinner");
  btn.disabled    = isLoading;
  if(textEl) textEl.classList.toggle("hidden", isLoading);
  if(spinnerEl) spinnerEl.classList.toggle("hidden", !isLoading);
}

function clearErrors(form) {
  form.querySelectorAll(".form-error").forEach(el => (el.textContent = ""));
  form.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));
}

function showFieldError(inputEl, errorEl, msg) {
  if (inputEl) inputEl.classList.add("input-error");
  if (errorEl) errorEl.textContent = msg;
}

function validateRequired(inputEl, errorEl, label) {
  if (!inputEl || !inputEl.value.trim()) {
    showFieldError(inputEl, errorEl, `${label} is required.`);
    return false;
  }
  return true;
}

function clearResults(containerId) {
  document.getElementById(containerId).innerHTML = "";
}

window.copyResultText = function(btn, text) {
  navigator.clipboard.writeText(text).then(() => {
    const og = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-check"></i> Copied`;
    setTimeout(() => { btn.innerHTML = og; }, 2000);
  });
}

// ═══════════════════════════════════════════════════════════════════
//  HELPERS — Result Rendering
// ═══════════════════════════════════════════════════════════════════

function renderError(containerId, message) {
  document.getElementById(containerId).innerHTML = `
    <div class="result-error-box">
      <i class="fa-solid fa-circle-exclamation"></i>
      <span>${escHtml(message)}</span>
    </div>`;
}

function renderSteps(steps) {
  if (!steps || steps.length === 0) return "";
  const lines = steps.map(s => {
    let cls = "steps-line";
    const ls = s.toLowerCase();
    if (ls.includes("converged")) cls += " step-conv";
    else if (ls.includes("error") || ls.includes("fail") || ls.includes("warning")) cls += " step-warn";
    else if (ls.startsWith("setup") || ls.includes("parsing") || ls.startsWith("[")) cls += " step-muted";
    return `<div class="${cls}">${escHtml(s)}</div>`;
  }).join("");
  return `
    <div class="steps-panel" id="steps-panel-inner">
      <button type="button" class="steps-toggle" onclick="toggleSteps(this)">
        <span class="steps-toggle-label">
          <i class="fa-solid fa-list-ol"></i> Solution Steps (${steps.length})
        </span>
        <i class="fa-solid fa-chevron-down steps-toggle-chevron"></i>
      </button>
      <div class="steps-body">${lines}</div>
    </div>`;
}

function renderIterationsTable(iterations, columns) {
  if (!iterations || iterations.length === 0) return "";
  const headerCells = columns.map(c => `<th>${escHtml(c.label)}</th>`).join("");
  
  let maxErr = 0;
  iterations.forEach(row => {
    if (row.error !== undefined && row.error !== null) {
      maxErr = Math.max(maxErr, parseFloat(row.error) || 0);
    }
  });

  const rows = iterations.map(row => {
    const cells = columns.map(c => {
      let val = row[c.key];
      let tdCls = "";
      
      if (c.key === "error" && val !== undefined) {
        let e = parseFloat(val);
        if (!isNaN(e) && maxErr > 0) {
          let ratio = e / maxErr;
          if (ratio > 0.5) tdCls = ' class="cell-error-high"';
          else if (ratio > 0.1) tdCls = ' class="cell-error-mid"';
          else if (ratio > 0.001) tdCls = ' class="cell-error-low"';
          else tdCls = ' class="cell-error-lowest"';
        }
      }
      
      if (Array.isArray(val)) val = "[" + val.map(v => typeof v === "number" ? v.toFixed(6) : v).join(", ") + "]";
      else if (typeof val === "number") val = val.toFixed(6);
      return `<td${tdCls}>${escHtml(String(val))}</td>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");
  return `
    <div class="iterations-panel">
      <div class="iterations-panel-title"><i class="fa-solid fa-table"></i> Iteration Table</div>
      <div class="iterations-table-wrap">
        <table class="iterations-table">
          <thead><tr>${headerCells}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

window.toggleSteps = function(btn) {
  const panel = btn.closest(".steps-panel");
  panel.classList.toggle("open");
}

async function callApi(endpoint, body) {
  const res = await fetch(endpoint, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════
//  APP INITIALIZATION & EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {

  // Initialize Grids
  renderSystemInput('doolittle-matrix-container', false);
  renderSystemInput('gauss_seidel-matrix-container', true);
  renderSystemInput('jacobi-matrix-container', true);
  renderTridiagInput('thomas-matrix-container');

  // Sidebar Logic
  const sidebarOverlay = document.getElementById("sidebar-overlay");
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("menu-toggle-btn");
  
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.add("open");
      sidebarOverlay.classList.add("show");
    });
  }
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      sidebarOverlay.classList.remove("show");
    });
  }

  const sidebarItems = document.querySelectorAll(".sidebar-item");
  const panels       = document.querySelectorAll(".method-panel");

  sidebarItems.forEach(item => {
    item.addEventListener("click", () => {
      const target = item.dataset.method;
      sidebarItems.forEach(i => i.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));
      item.classList.add("active");
      const panel = document.getElementById(`panel-${target}`);
      if (panel) panel.classList.add("active");
      
      // Close mobile menu on select
      if (window.innerWidth <= 768 && sidebar) {
        sidebar.classList.remove("open");
        sidebarOverlay.classList.remove("show");
      }
    });
  });

  // Size steppers
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("size-minus")) {
      const cid = e.target.dataset.container;
      if (state.matrixSizes[cid] > 2) {
        state.matrixSizes[cid]--;
        if (cid === 'thomas-matrix-container') renderTridiagInput(cid);
        else renderSystemInput(cid, cid !== 'doolittle-matrix-container');
      }
    }
    if (e.target.classList.contains("size-plus")) {
      const cid = e.target.dataset.container;
      if (state.matrixSizes[cid] < 8) {
        state.matrixSizes[cid]++;
        if (cid === 'thomas-matrix-container') renderTridiagInput(cid);
        else renderSystemInput(cid, cid !== 'doolittle-matrix-container');
      }
    }
  });

  // Matrix cell navigation
  document.addEventListener("keydown", (e) => {
    if(!e.target.classList.contains('matrix-cell')) return;
    const m = e.target.dataset.matrix;
    const r = parseInt(e.target.dataset.row);
    const c = parseInt(e.target.dataset.col);
    
    let newR = r;
    let newC = c;
    
    if (e.key === "ArrowUp") newR--;
    if (e.key === "ArrowDown") newR++;
    if (e.key === "ArrowLeft" && e.target.selectionStart === 0 && !isNaN(c)) newC--;
    if (e.key === "ArrowRight" && e.target.selectionEnd === e.target.value.length && !isNaN(c)) newC++;
    
    const container = e.target.closest('.matrix-outer, .tridiag-wrapper');
    if (!container) return;

    if (newR !== r || newC !== c) {
      let nextCell;
      if (!isNaN(c)) {
        nextCell = container.querySelector(`.matrix-cell[data-matrix="${m}"][data-row="${newR}"][data-col="${newC}"]`);
      } else {
        nextCell = container.querySelector(`.matrix-cell[data-matrix="${m}"][data-row="${newR}"]`);
      }
      if (nextCell) {
        e.preventDefault();
        nextCell.focus();
      }
    }
  });


  // ─────────────────────────────────────────────────────────────────
  //  1. BISECTION
  // ─────────────────────────────────────────────────────────────────

  document.getElementById("form-bisection").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    clearErrors(form);
    clearResults("results-bisection");

    const funcEl = document.getElementById("bisection-func");
    const aEl    = document.getElementById("bisection-a");
    const bEl    = document.getElementById("bisection-b");
    const tolEl  = document.getElementById("bisection-tol");
    const iterEl = document.getElementById("bisection-iter");
    const btn    = document.getElementById("btn-bisection");

    let valid = true;
    if (!validateRequired(funcEl, document.getElementById("err-bisection-func"), "Function")) valid = false;
    if (!validateRequired(aEl,    document.getElementById("err-bisection-a"),    "Lower bound a")) valid = false;
    if (!validateRequired(bEl,    document.getElementById("err-bisection-b"),    "Upper bound b")) valid = false;
    if (!valid) return;

    setLoading(btn, true);
    try {
      const data = await callApi("/api/bisection", {
        function:  funcEl.value.trim(),
        a:         parseFloat(aEl.value),
        b:         parseFloat(bEl.value),
        tolerance: parseFloat(tolEl.value) || 0.001,
        max_iter:  parseInt(iterEl.value)  || 100,
      });

      if (!data.success) { renderError("results-bisection", data.error); return; }

      const r = data.result;
      document.getElementById("results-bisection").innerHTML = `
        <div class="result-panel">
          <button class="result-copy-btn" onclick="copyResultText(this, '${escHtml(r.root)}')"><i class="fa-regular fa-copy"></i> Copy</button>
          <div class="result-panel-title"><i class="fa-solid fa-bullseye"></i> Result</div>
          <div class="result-answer">Root ≈ ${r.root}</div>
          <div class="result-meta">
            f(root) = ${r.f_root} &nbsp;|&nbsp;
            Iterations: ${r.iterations_taken} &nbsp;|&nbsp;
            Converged: ${r.converged ? "✓ Yes" : "✗ No"}
          </div>
        </div>
        ${renderSteps(data.steps)}
        ${renderIterationsTable(data.iterations, [
          { key: "iter",  label: "Iter" },
          { key: "a",     label: "a" },
          { key: "b",     label: "b" },
          { key: "x",     label: "Mid c" },
          { key: "f_x",   label: "f(c)" },
          { key: "error", label: "|Err|" },
        ])}`;
    } catch (err) {
      renderError("results-bisection", "Network error: " + err.message);
    } finally {
      setLoading(btn, false);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  //  2. DOOLITTLE
  // ─────────────────────────────────────────────────────────────────

  document.getElementById("form-doolittle").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btn-doolittle");
    clearResults("results-doolittle");

    const cid = 'doolittle-matrix-container';
    const n = state.matrixSizes[cid];
    const A = getMatrixFromDOM(cid, 'A', n, n);
    const b = getMatrixFromDOM(cid, 'b', n, 1);

    setLoading(btn, true);
    try {
      const data = await callApi("/api/doolittle", { A, b });

      if (!data.success) { renderError("results-doolittle", data.error); return; }

      const r = data.result;
      const xStr = r.X.map((v, i) => `x${i + 1} = ${v}`).join(" &nbsp;|&nbsp; ");

      const formatMatrix = (m) => m.map(row =>
        `<div class="result-matrix-row">[ ${row.map(v => String(v).padStart(10)).join("  ")} ]</div>`
      ).join("");

      document.getElementById("results-doolittle").innerHTML = `
        <div class="result-panel">
          <button class="result-copy-btn" onclick="copyResultText(this, '${escHtml(JSON.stringify(r.X))}')"><i class="fa-regular fa-copy"></i> Copy</button>
          <div class="result-panel-title"><i class="fa-solid fa-bullseye"></i> Solution</div>
          <div class="result-answer">${xStr}</div>
          <div class="result-matrix-label">L matrix</div>
          ${formatMatrix(r.L)}
          <div class="result-matrix-label">U matrix</div>
          ${formatMatrix(r.U)}
          <div class="result-matrix-label">Forward substitution V</div>
          <div class="result-matrix-row">[ ${r.V.join("  ")} ]</div>
        </div>
        ${renderSteps(data.steps)}`;
    } catch (err) {
      renderError("results-doolittle", "Network error: " + err.message);
    } finally {
      setLoading(btn, false);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  //  3. FALSE POSITION
  // ─────────────────────────────────────────────────────────────────

  document.getElementById("form-false_position").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    clearErrors(form);
    clearResults("results-false_position");

    const funcEl = document.getElementById("fp-func");
    const aEl    = document.getElementById("fp-a");
    const bEl    = document.getElementById("fp-b");
    const tolEl  = document.getElementById("fp-tol");
    const iterEl = document.getElementById("fp-iter");
    const btn    = document.getElementById("btn-false_position");

    let valid = true;
    if (!validateRequired(funcEl, document.getElementById("err-fp-func"), "Function")) valid = false;
    if (!validateRequired(aEl,    document.getElementById("err-fp-a"),    "Lower bound a")) valid = false;
    if (!validateRequired(bEl,    document.getElementById("err-fp-b"),    "Upper bound b")) valid = false;
    if (!valid) return;

    setLoading(btn, true);
    try {
      const data = await callApi("/api/false_position", {
        function:  funcEl.value.trim(),
        a:         parseFloat(aEl.value),
        b:         parseFloat(bEl.value),
        tolerance: parseFloat(tolEl.value) || 0.001,
        max_iter:  parseInt(iterEl.value)  || 100,
      });

      if (!data.success) { renderError("results-false_position", data.error); return; }

      const r = data.result;
      document.getElementById("results-false_position").innerHTML = `
        <div class="result-panel">
          <button class="result-copy-btn" onclick="copyResultText(this, '${escHtml(r.root)}')"><i class="fa-regular fa-copy"></i> Copy</button>
          <div class="result-panel-title"><i class="fa-solid fa-bullseye"></i> Result</div>
          <div class="result-answer">Root ≈ ${r.root}</div>
          <div class="result-meta">
            f(root) = ${r.f_root} &nbsp;|&nbsp;
            Iterations: ${r.iterations_taken} &nbsp;|&nbsp;
            Converged: ${r.converged ? "✓ Yes" : "✗ No"}
          </div>
        </div>
        ${renderSteps(data.steps)}
        ${renderIterationsTable(data.iterations, [
          { key: "iter",  label: "Iter" },
          { key: "a",     label: "a" },
          { key: "b",     label: "b" },
          { key: "x",     label: "xs" },
          { key: "f_x",   label: "f(xs)" },
          { key: "error", label: "|Err|" },
        ])}`;
    } catch (err) {
      renderError("results-false_position", "Network error: " + err.message);
    } finally {
      setLoading(btn, false);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  //  4. GAUSS-SEIDEL
  // ─────────────────────────────────────────────────────────────────

  document.getElementById("form-gauss_seidel").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btn-gauss_seidel");
    clearResults("results-gauss_seidel");

    const cid = 'gauss_seidel-matrix-container';
    const n = state.matrixSizes[cid];
    const A = getMatrixFromDOM(cid, 'A', n, n);
    const b = getMatrixFromDOM(cid, 'b', n, 1);
    const x0 = getMatrixFromDOM(cid, 'x0', n, 1);
    const tol = parseFloat(document.getElementById("gs-tol").value) || 0.001;
    const max_iter = parseInt(document.getElementById("gs-iter").value) || 100;

    setLoading(btn, true);
    try {
      const data = await callApi("/api/gauss_seidel", { A, b, x0, tolerance: tol, max_iter });

      if (!data.success) { renderError("results-gauss_seidel", data.error); return; }

      const r = data.result;
      const sol = (r.solution || r.X || r);
      const solStr = Array.isArray(sol)
        ? sol.map((v, i) => `x${i + 1} = ${typeof v === "number" ? v.toFixed(6) : v}`).join(" &nbsp;|&nbsp; ")
        : JSON.stringify(sol);

      document.getElementById("results-gauss_seidel").innerHTML = `
        <div class="result-panel">
          <button class="result-copy-btn" onclick="copyResultText(this, '${escHtml(JSON.stringify(sol))}')"><i class="fa-regular fa-copy"></i> Copy</button>
          <div class="result-panel-title"><i class="fa-solid fa-bullseye"></i> Solution</div>
          <div class="result-answer">${solStr}</div>
          <div class="result-meta">
            Iterations: ${r.iterations_taken || "—"} &nbsp;|&nbsp;
            Converged: ${r.converged !== undefined ? (r.converged ? "✓ Yes" : "✗ No") : "—"}
          </div>
        </div>
        ${renderSteps(data.steps)}
        ${renderIterationsTable(data.iterations, [
          { key: "iter",  label: "Iter" },
          { key: "x_old", label: "x (prev)" },
          { key: "x_new", label: "x (new)" },
          { key: "error", label: "|Err|" },
        ])}`;
    } catch (err) {
      renderError("results-gauss_seidel", "Network error: " + err.message);
    } finally {
      setLoading(btn, false);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  //  5. JACOBI
  // ─────────────────────────────────────────────────────────────────

  document.getElementById("form-jacobi").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btn-jacobi");
    clearResults("results-jacobi");

    const cid = 'jacobi-matrix-container';
    const n = state.matrixSizes[cid];
    const A = getMatrixFromDOM(cid, 'A', n, n);
    const b = getMatrixFromDOM(cid, 'b', n, 1);
    const x0 = getMatrixFromDOM(cid, 'x0', n, 1);
    const tol = parseFloat(document.getElementById("jacobi-tol").value) || 0.001;
    const max_iter = parseInt(document.getElementById("jacobi-iter").value) || 100;

    setLoading(btn, true);
    try {
      const data = await callApi("/api/jacobi", { A, b, x0, tolerance: tol, max_iter });

      if (!data.success) { renderError("results-jacobi", data.error); return; }

      const r = data.result;
      const solStr = r.solution.map((v, i) => `x${i + 1} = ${v}`).join(" &nbsp;|&nbsp; ");

      document.getElementById("results-jacobi").innerHTML = `
        <div class="result-panel">
          <button class="result-copy-btn" onclick="copyResultText(this, '${escHtml(JSON.stringify(r.solution))}')"><i class="fa-regular fa-copy"></i> Copy</button>
          <div class="result-panel-title"><i class="fa-solid fa-bullseye"></i> Solution</div>
          <div class="result-answer">${solStr}</div>
          <div class="result-meta">
            Iterations: ${r.iterations_taken} &nbsp;|&nbsp;
            Converged: ${r.converged ? "✓ Yes" : "✗ No"}
          </div>
        </div>
        ${renderSteps(data.steps)}
        ${renderIterationsTable(data.iterations, [
          { key: "iter",  label: "Iter" },
          { key: "x_old", label: "x (prev)" },
          { key: "x_new", label: "x (new)" },
          { key: "error", label: "|Err|" },
        ])}`;
    } catch (err) {
      renderError("results-jacobi", "Network error: " + err.message);
    } finally {
      setLoading(btn, false);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  //  6. NEWTON-RAPHSON
  // ─────────────────────────────────────────────────────────────────

  document.getElementById("form-newton").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    clearErrors(form);
    clearResults("results-newton");

    const funcEl  = document.getElementById("newton-func");
    const dfuncEl = document.getElementById("newton-dfunc");
    const x0El    = document.getElementById("newton-x0");
    const tolEl   = document.getElementById("newton-tol");
    const iterEl  = document.getElementById("newton-iter");
    const btn     = document.getElementById("btn-newton");

    let valid = true;
    if (!validateRequired(funcEl,  document.getElementById("err-newton-func"),  "Function f(x)")) valid = false;
    if (!validateRequired(dfuncEl, document.getElementById("err-newton-dfunc"), "Derivative f'(x)")) valid = false;
    if (!validateRequired(x0El,    document.getElementById("err-newton-x0"),    "Initial guess x₀")) valid = false;
    if (!valid) return;

    setLoading(btn, true);
    try {
      const data = await callApi("/api/newton", {
        func:     funcEl.value.trim(),
        dfunc:    dfuncEl.value.trim(),
        x0:       parseFloat(x0El.value),
        tol:      parseFloat(tolEl.value) || 1e-5,
        max_iter: parseInt(iterEl.value)  || 100,
      });

      if (!data.success) { renderError("results-newton", data.error); return; }

      document.getElementById("results-newton").innerHTML = `
        <div class="result-panel">
          <button class="result-copy-btn" onclick="copyResultText(this, '${escHtml(data.result)}')"><i class="fa-regular fa-copy"></i> Copy</button>
          <div class="result-panel-title"><i class="fa-solid fa-bullseye"></i> Result</div>
          <div class="result-answer">Root ≈ ${data.result}</div>
        </div>
        ${renderSteps(data.steps)}
        ${renderIterationsTable(data.iterations, [
          { key: "iter",  label: "Iter" },
          { key: "x",     label: "x" },
          { key: "fx",    label: "f(x)" },
          { key: "error", label: "|Err|" },
        ])}`;
    } catch (err) {
      renderError("results-newton", "Network error: " + err.message);
    } finally {
      setLoading(btn, false);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  //  7. THOMAS ALGORITHM
  // ─────────────────────────────────────────────────────────────────

  document.getElementById("form-thomas").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btn-thomas");
    clearResults("results-thomas");

    const cid = 'thomas-matrix-container';
    const n = state.matrixSizes[cid];
    const a = getMatrixFromDOM(cid, 'a', n-1, 1);
    const b = getMatrixFromDOM(cid, 'b', n, 1);
    const c = getMatrixFromDOM(cid, 'c', n-1, 1);
    const d = getMatrixFromDOM(cid, 'd', n, 1);

    setLoading(btn, true);
    try {
      const data = await callApi("/api/thomas", { a, b, c, d });

      if (!data.success) { renderError("results-thomas", data.error); return; }

      const r = data.result;
      const sol = r.X || r.solution || r;
      const solStr = Array.isArray(sol)
        ? sol.map((v, i) => `x${i + 1} = ${typeof v === "number" ? v.toFixed(6) : v}`).join(" &nbsp;|&nbsp; ")
        : JSON.stringify(sol);

      document.getElementById("results-thomas").innerHTML = `
        <div class="result-panel">
          <button class="result-copy-btn" onclick="copyResultText(this, '${escHtml(JSON.stringify(sol))}')"><i class="fa-regular fa-copy"></i> Copy</button>
          <div class="result-panel-title"><i class="fa-solid fa-bullseye"></i> Solution</div>
          <div class="result-answer">${solStr}</div>
        </div>
        ${renderSteps(data.steps)}`;
    } catch (err) {
      renderError("results-thomas", "Network error: " + err.message);
    } finally {
      setLoading(btn, false);
    }
  });

}); // end DOMContentLoaded
