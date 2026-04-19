"use strict";

// ═══════════════════════════════════════════════════════════════════
//  HELPERS — Parsing
// ═══════════════════════════════════════════════════════════════════

/**
 * Parse a space/comma-separated string into an array of numbers.
 * e.g. "1 2 3" or "1,2,3" → [1, 2, 3]
 */
function parseVector(str) {
  return str.trim().split(/[\s,]+/).map(Number);
}

/**
 * Parse a matrix encoded as "/ " row-separator string.
 * e.g. "2 -6 8 / 5 4 -3 / 3 1 2" → [[2,-6,8],[5,4,-3],[3,1,2]]
 */
function parseMatrix(str) {
  return str
    .trim()
    .split("/")
    .map(rowStr => rowStr.trim().split(/\s+/).map(Number));
}

// ═══════════════════════════════════════════════════════════════════
//  HELPERS — UI
// ═══════════════════════════════════════════════════════════════════

function setLoading(btn, isLoading) {
  const textEl    = btn.querySelector(".btn-text");
  const spinnerEl = btn.querySelector(".btn-spinner");
  btn.disabled    = isLoading;
  textEl.classList.toggle("hidden", isLoading);
  spinnerEl.classList.toggle("hidden", !isLoading);
}

function clearErrors(form) {
  form.querySelectorAll(".form-error").forEach(el => (el.textContent = ""));
  form.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));
}

function showFieldError(inputEl, errorEl, msg) {
  inputEl.classList.add("input-error");
  errorEl.textContent = msg;
}

function validateRequired(inputEl, errorEl, label) {
  if (!inputEl.value.trim()) {
    showFieldError(inputEl, errorEl, `${label} is required.`);
    return false;
  }
  return true;
}

function clearResults(containerId) {
  document.getElementById(containerId).innerHTML = "";
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
  const lines = steps.map(s => `<div class="steps-line">${escHtml(s)}</div>`).join("");
  return `
    <div class="steps-panel" id="steps-panel-inner">
      <button class="steps-toggle" onclick="toggleSteps(this)">
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
  const rows = iterations.map(row => {
    const cells = columns.map(c => {
      let val = row[c.key];
      if (Array.isArray(val)) val = "[" + val.map(v => typeof v === "number" ? v.toFixed(6) : v).join(", ") + "]";
      else if (typeof val === "number") val = val.toFixed(6);
      return `<td>${escHtml(String(val))}</td>`;
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

function toggleSteps(btn) {
  const panel = btn.closest(".steps-panel");
  panel.classList.toggle("open");
}

// ═══════════════════════════════════════════════════════════════════
//  API CALL WRAPPER
// ═══════════════════════════════════════════════════════════════════

async function callApi(endpoint, body) {
  const res = await fetch(endpoint, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════
//  SIDEBAR NAVIGATION
// ═══════════════════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {

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
    });
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
          { key: "x",     label: "Midpoint c" },
          { key: "f_x",   label: "f(c)" },
          { key: "error", label: "|Error|" },
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
    const form = e.target;
    clearErrors(form);
    clearResults("results-doolittle");

    const AEl  = document.getElementById("doolittle-A");
    const bEl  = document.getElementById("doolittle-b");
    const btn  = document.getElementById("btn-doolittle");

    let valid = true;
    if (!validateRequired(AEl, document.getElementById("err-doolittle-A"), "Matrix A")) valid = false;
    if (!validateRequired(bEl, document.getElementById("err-doolittle-b"), "Vector b")) valid = false;
    if (!valid) return;

    setLoading(btn, true);
    try {
      const A = parseMatrix(AEl.value);
      const b = parseVector(bEl.value);

      const data = await callApi("/api/doolittle", { A, b });

      if (!data.success) { renderError("results-doolittle", data.error); return; }

      const r = data.result;
      const xStr = r.X.map((v, i) => `x${i + 1} = ${v}`).join(" &nbsp;|&nbsp; ");

      const formatMatrix = (m) => m.map(row =>
        `<div class="result-matrix-row">[ ${row.map(v => String(v).padStart(10)).join("  ")} ]</div>`
      ).join("");

      document.getElementById("results-doolittle").innerHTML = `
        <div class="result-panel">
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
          { key: "error", label: "|Error|" },
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
    const form = e.target;
    clearErrors(form);
    clearResults("results-gauss_seidel");

    const AEl    = document.getElementById("gs-A");
    const bEl    = document.getElementById("gs-b");
    const x0El   = document.getElementById("gs-x0");
    const tolEl  = document.getElementById("gs-tol");
    const iterEl = document.getElementById("gs-iter");
    const btn    = document.getElementById("btn-gauss_seidel");

    let valid = true;
    if (!validateRequired(AEl,  document.getElementById("err-gs-A"),  "Matrix A")) valid = false;
    if (!validateRequired(bEl,  document.getElementById("err-gs-b"),  "Vector b")) valid = false;
    if (!validateRequired(x0El, document.getElementById("err-gs-x0"), "Initial guess x₀")) valid = false;
    if (!valid) return;

    setLoading(btn, true);
    try {
      const data = await callApi("/api/gauss_seidel", {
        A:         parseMatrix(AEl.value),
        b:         parseVector(bEl.value),
        x0:        parseVector(x0El.value),
        tolerance: parseFloat(tolEl.value) || 0.001,
        max_iter:  parseInt(iterEl.value)  || 100,
      });

      if (!data.success) { renderError("results-gauss_seidel", data.error); return; }

      const r = data.result;
      const sol = (r.solution || r.X || r);
      const solStr = Array.isArray(sol)
        ? sol.map((v, i) => `x${i + 1} = ${typeof v === "number" ? v.toFixed(6) : v}`).join(" &nbsp;|&nbsp; ")
        : JSON.stringify(sol);

      document.getElementById("results-gauss_seidel").innerHTML = `
        <div class="result-panel">
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
          { key: "error", label: "|Error|" },
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
    const form = e.target;
    clearErrors(form);
    clearResults("results-jacobi");

    const AEl    = document.getElementById("jacobi-A");
    const bEl    = document.getElementById("jacobi-b");
    const x0El   = document.getElementById("jacobi-x0");
    const tolEl  = document.getElementById("jacobi-tol");
    const iterEl = document.getElementById("jacobi-iter");
    const btn    = document.getElementById("btn-jacobi");

    let valid = true;
    if (!validateRequired(AEl,  document.getElementById("err-jacobi-A"),  "Matrix A")) valid = false;
    if (!validateRequired(bEl,  document.getElementById("err-jacobi-b"),  "Vector b")) valid = false;
    if (!validateRequired(x0El, document.getElementById("err-jacobi-x0"), "Initial guess x₀")) valid = false;
    if (!valid) return;

    setLoading(btn, true);
    try {
      const data = await callApi("/api/jacobi", {
        A:         parseMatrix(AEl.value),
        b:         parseVector(bEl.value),
        x0:        parseVector(x0El.value),
        tolerance: parseFloat(tolEl.value) || 0.001,
        max_iter:  parseInt(iterEl.value)  || 100,
      });

      if (!data.success) { renderError("results-jacobi", data.error); return; }

      const r = data.result;
      const solStr = r.solution.map((v, i) => `x${i + 1} = ${v}`).join(" &nbsp;|&nbsp; ");

      document.getElementById("results-jacobi").innerHTML = `
        <div class="result-panel">
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
          { key: "error", label: "|Error|" },
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
          <div class="result-panel-title"><i class="fa-solid fa-bullseye"></i> Result</div>
          <div class="result-answer">Root ≈ ${data.result}</div>
        </div>
        ${renderSteps(data.steps)}
        ${renderIterationsTable(data.iterations, [
          { key: "iter",  label: "Iter" },
          { key: "x",     label: "x" },
          { key: "fx",    label: "f(x)" },
          { key: "error", label: "|Error|" },
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
    const form = e.target;
    clearErrors(form);
    clearResults("results-thomas");

    const aEl = document.getElementById("thomas-a");
    const bEl = document.getElementById("thomas-b");
    const cEl = document.getElementById("thomas-c");
    const dEl = document.getElementById("thomas-d");
    const btn = document.getElementById("btn-thomas");

    let valid = true;
    if (!validateRequired(aEl, document.getElementById("err-thomas-a"), "Lower diagonal a")) valid = false;
    if (!validateRequired(bEl, document.getElementById("err-thomas-b"), "Main diagonal b")) valid = false;
    if (!validateRequired(cEl, document.getElementById("err-thomas-c"), "Upper diagonal c")) valid = false;
    if (!validateRequired(dEl, document.getElementById("err-thomas-d"), "RHS vector d")) valid = false;
    if (!valid) return;

    setLoading(btn, true);
    try {
      const data = await callApi("/api/thomas", {
        a: parseVector(aEl.value),
        b: parseVector(bEl.value),
        c: parseVector(cEl.value),
        d: parseVector(dEl.value),
      });

      if (!data.success) { renderError("results-thomas", data.error); return; }

      const r = data.result;
      const sol = r.X || r.solution || r;
      const solStr = Array.isArray(sol)
        ? sol.map((v, i) => `x${i + 1} = ${typeof v === "number" ? v.toFixed(6) : v}`).join(" &nbsp;|&nbsp; ")
        : JSON.stringify(sol);

      document.getElementById("results-thomas").innerHTML = `
        <div class="result-panel">
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
