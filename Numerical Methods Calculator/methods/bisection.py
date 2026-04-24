# bisection.py
# Rayan Hisham

from flask import Blueprint, request, jsonify
from sympy import symbols, sympify, lambdify

import re

bp = Blueprint("bisection", __name__)

_x = symbols("x")


def _preprocess_func(s: str) -> str:
    """Normalize user-typed math notation to SymPy-compatible syntax."""
    # Aliases for common notations
    s = re.sub(r'\bln\s*\(', 'log(', s)          # ln( → log(
    s = re.sub(r'\barcsin\s*\(', 'asin(', s)      # arcsin → asin
    s = re.sub(r'\barccos\s*\(', 'acos(', s)      # arccos → acos
    s = re.sub(r'\barctan\s*\(', 'atan(', s)      # arctan → atan
    s = re.sub(r'\btg\s*\(', 'tan(', s)           # tg( → tan(
    s = re.sub(r'\blg\s*\(', 'log(', s)           # lg( → log( (natural log default)
    # Bare 'e' (Euler's number) — SymPy uses E; replace only when isolated
    s = re.sub(r'\be\b', 'E', s)                  # e → E (SymPy's Euler constant)
    # Power notation (SymPy also accepts ^, but be safe)
    s = s.replace('^', '**')
    return s


# ── Core function ───────────────────────────────────────────────────────────────

def bisection_method(params: dict) -> dict:
    
    try:
        # ── Unpack & validate ──────────────────────────────────────────────────
        func_str = params.get("function")
        a        = params.get("a")
        b        = params.get("b")
        tol      = float(params.get("tolerance", 1e-3))
        max_iter = int(params.get("max_iter", 100))

        if func_str is None:
            raise ValueError("Parameter 'function' is required.")
        if a is None or b is None:
            raise ValueError("Parameters 'a' and 'b' are required.")

        a = float(a)
        b = float(b)

        # ── Preprocess then parse function with SymPy ──────────────────────────
        expr = sympify(_preprocess_func(func_str))
        f    = lambdify(_x, expr, "math")


        steps: list[str] = []
        steps.append(f"Parsed function: f(x) = {expr}")
        steps.append(f"Initial interval: a = {a}, b = {b}")

        # ── Bracket check ──────────────────────────────────────────────────────
        fa = f(a)
        fb = f(b)

        steps.append(f"f(a) = f({a}) = {round(fa, 6)}")
        steps.append(f"f(b) = f({b}) = {round(fb, 6)}")

        if fa * fb >= 0:
            raise ValueError(
                "f(a) and f(b) must have opposite signs to guarantee a root in [a, b]."
            )

        steps.append("Bracket condition satisfied: f(a) · f(b) < 0.")

        # ── Iteration ─────────────────────────────────────────────────────────
        iterations: list[dict] = []
        c       = a          # will be overwritten on first iteration
        c_prev  = a
        stag    = 0          # consecutive stagnation counter

        for it in range(1, max_iter + 1):
            # Standard midpoint formula
            c   = (a + b) / 2.0
            fc  = f(c)
            fa  = f(a)

            error = abs(c - c_prev)

            iterations.append({
                "iter":  it,
                "a":     round(a,  6),
                "b":     round(b,  6),
                "x":     round(c,  6),
                "f_x":   round(fc, 6),
                "error": round(error, 6),
            })

            steps.append(
                f"Iteration {it}: a = {a:.6f}, b = {b:.6f}, "
                f"c = (a+b)/2 = {c:.6f}, f(c) = {fc:.6f}, |error| = {error:.6f}"
            )

            # Tolerance convergence (skip iteration 1)
            if it > 1 and error < tol:
                steps.append(
                    f"Converged after {it} iterations (|error| = {error:.6f} < {tol})."
                )
                break

            # Stagnation guard — answer no longer changes at machine precision
            if it > 1 and error < 1e-12:
                stag += 1
                if stag >= 2:
                    steps.append(
                        f"Stopped at iteration {it}: answer stagnated (|error| < 1e-12 for 2 consecutive iterations)."
                    )
                    break
            else:
                stag = 0

            # Update interval
            if fa * fc < 0:
                b = c           # root lies in [a, c]
                steps.append(f"  => f(a)*f(c) < 0 => new interval: [{a:.6f}, {c:.6f}]")
            else:
                a = c           # root lies in [c, b]
                steps.append(f"  => f(a)*f(c) >= 0 => new interval: [{c:.6f}, {b:.6f}]")

            c_prev = c
        else:
            steps.append(
                f"Reached maximum iterations ({max_iter}). "
                f"Best estimate: c ≈ {c:.6f}"
            )

        result = {
            "root":             round(c, 6),
            "f_root":           round(f(c), 6),
            "converged":        len(iterations) < max_iter or (len(iterations) == max_iter and error < tol),
            "iterations_taken": len(iterations),
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

@bp.route("/api/bisection", methods=["POST"])
def handle_bisection():
    params = request.get_json(force=True, silent=True) or {}
    return jsonify(bisection_method(params))
