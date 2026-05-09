# jacobi.py
# Haneen Elsayed

from flask import Blueprint, request, jsonify

bp = Blueprint("jacobi", __name__)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _make_diagonally_dominant(A: list[list[float]], b: list[float]):

    n = len(A)
    A = [row[:] for row in A]   # shallow-copy rows
    b = b[:]

    for i in range(n):
        max_row = i
        for k in range(i + 1, n):
            if abs(A[k][i]) > abs(A[max_row][i]):
                max_row = k

        if max_row != i:
            A[i], A[max_row] = A[max_row], A[i]
            b[i], b[max_row] = b[max_row], b[i]

    return A, b


def _check_diagonal_dominance(A: list[list[float]]) -> list[dict]:
    """Return a per-row dominance check result."""
    n = len(A)
    checks = []
    for i in range(n):
        diag = abs(A[i][i])
        off_sum = sum(abs(A[i][j]) for j in range(n) if j != i)
        checks.append({
            "row": i + 1,
            "diagonal": round(diag, 6),
            "off_diagonal_sum": round(off_sum, 6),
            "dominant": bool(diag >= off_sum),
        })
    return checks


def _build_jacobi_equations(A: list[list[float]], b: list[float]) -> list[str]:
    """Return human-readable Jacobi rearrangement of equations."""
    n = len(A)
    var_names = [f"x{i+1}" for i in range(n)]
    eqs = []
    for i in range(n):
        coef = A[i][i]
        parts = []
        for j in range(n):
            if j != i:
                sign = "-" if A[i][j] > 0 else "+"
                parts.append(f"{sign} {abs(A[i][j]):.6g}·{var_names[j]}")
        rhs = "  ".join(parts)
        eqs.append(f"{var_names[i]} = (1/{coef:.6g}) · ({b[i]:.6g}  {rhs})")
    return eqs


# ── Core function ───────────────────────────────────────────────────────────────

def jacobi_method(params: dict) -> dict:
    
    try:
        # ── Unpack & validate ──────────────────────────────────────────────────
        A        = params.get("A")
        b        = params.get("b")
        x0       = params.get("x0")
        tol      = float(params.get("tolerance", 1e-3))
        max_iter = int(params.get("max_iter", 100))
        prec     = int(params.get("precision", 6))

        if A is None or b is None or x0 is None:
            raise ValueError("Parameters 'A', 'b', and 'x0' are required.")

        n = len(A)

        if any(len(row) != n for row in A):
            raise ValueError("Matrix A must be square.")

        if len(b) != n:
            raise ValueError("Dimensions of A and b mismatch.")

        if len(x0) != n:
            raise ValueError("Initial guess x0 must have the same length as b.")

        # Convert to float lists
        A  = [[float(v) for v in row] for row in A]
        b  = [float(v) for v in b]
        x0 = [float(v) for v in x0]

        steps: list[str] = []

        # ── Diagonal dominance rearrangement ───────────────────────────────────
        A, b = _make_diagonally_dominant(A, b)
        steps.append("Rearranged rows to improve diagonal dominance.")

        dom_checks = _check_diagonal_dominance(A)
        all_dominant = all(c["dominant"] for c in dom_checks)
        if not all_dominant:
            raise ValueError("Matrix is not diagonally dominant even after rearrangement. Jacobi method is not guaranteed to converge and is inapplicable for this system.")

        steps.append("Diagonal dominance check: PASS — all rows satisfy |a_ii| ≥ Σ|a_ij|.")

        # ── Jacobi equation form ───────────────────────────────────────────────
        eq_strings = _build_jacobi_equations(A, b)
        steps.append("Jacobi rearrangement of equations:")
        steps.extend(f"  {eq}" for eq in eq_strings)

        # ── Iteration ─────────────────────────────────────────────────────
        x     = x0[:]
        x_new = x0[:]
        iterations: list[dict] = []
        stag = 0
        prev_error = float('inf')
        divergence_count = 0

        for it in range(1, max_iter + 1):
            for i in range(n):
                if A[i][i] == 0:
                    raise ValueError(f"Zero diagonal element found at row {i+1}. Jacobi method fails.")
                sigma = sum(A[i][j] * x[j] for j in range(n) if j != i)
                x_new[i] = (b[i] - sigma) / A[i][i]

            error = max(abs(x_new[i] - x[i]) for i in range(n))
            max_val = max((abs(v) for v in x_new), default=0.0)
            ea = (error / max_val * 100) if max_val != 0 else 0.0

            x_rounded   = [round(v, prec) for v in x]
            xnw_rounded = [round(v, prec) for v in x_new]

            iterations.append({
                "iter":  it,
                "x_old": x_rounded,
                "x_new": xnw_rounded,
                "error": round(error, prec),
                "ea":    round(ea, prec),
            })
            steps.append(
                f"Iteration {it}: x = {xnw_rounded}  |  error = {error:.{prec}f}, Ea = {ea:.4f}%"
            )

            if error > prev_error * 1.5 and it > 2:
                divergence_count += 1
                if divergence_count >= 3 or error > 1e6:
                    steps.append(f"Divergence detected at iteration {it}: Error is increasing rapidly.")
                    raise ValueError(f"Method diverges: Error reached {error:.4e}. Matrix properties may be unsuitable.")
            else:
                divergence_count = 0
            prev_error = error

            if error < tol:
                steps.append(f"Converged after {it} iterations (error < {tol}).")
                x = x_new[:]
                break

            # Stagnation guard
            if error < 1e-12:
                stag += 1
                if stag >= 2:
                    steps.append(f"Stopped at iteration {it}: solution stagnated (|error| < 1e-12).")
                    x = x_new[:]
                    break
            else:
                stag = 0

            x = x_new[:]
        else:
            steps.append(
                f"Reached maximum iterations ({max_iter}) without full convergence."
            )

        result = {
            "solution":   [round(v, prec) for v in x],
            "converged":  error < tol,
            "iterations_taken": len(iterations),
            "dominance_checks": dom_checks,
        }

        return {
            "success":    True,
            "result":     result,
            "steps":      steps,
            "iterations": iterations,
        }

    except Exception as exc:
        return {"success": False, "error": str(exc)}


# ── Flask Blueprint ─────────────────────────────────────────────────────────────

@bp.route("/api/jacobi", methods=["POST"])
def handle_jacobi():
    params = request.get_json(force=True, silent=True) or {}
    return jsonify(jacobi_method(params))
