# bisection.py
# Rayan Hisham

from flask import Blueprint, request, jsonify
from sympy import symbols, sympify, lambdify
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application
import re
import math

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


def _parse_and_lambdify(func_str: str):
    """Parses mathematical expression robustly and handles implicit multiplication."""
    s = _preprocess_func(func_str)
    transformations = standard_transformations + (implicit_multiplication_application,)
    expr = parse_expr(s, transformations=transformations)
    return expr, lambdify(_x, expr, "math")


def safe_eval(f, val):
    try:
        return f(val)
    except ValueError as e:
        if "math domain error" in str(e).lower() or "complex" in str(e).lower() or "out of domain" in str(e).lower():
            raise ValueError(f"Domain error at x = {val}: Function is undefined (e.g., log of negative number).")
        raise
    except ZeroDivisionError:
        raise ValueError(f"Domain error at x = {val}: Division by zero encountered.")


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
        expr, f = _parse_and_lambdify(func_str)


        steps: list[str] = []
        steps.append(f"Parsed function: f(x) = {expr}")
        steps.append(f"Initial interval: a = {a}, b = {b}")

        # ── Bracket check ──────────────────────────────────────────────────────
        fa = safe_eval(f, a)
        fb = safe_eval(f, b)

        steps.append(f"f(a) = f({a}) = {round(fa, 6)}")
        steps.append(f"f(b) = f({b}) = {round(fb, 6)}")

        if fa * fb >= 0:
            suggestion = ""
            step_size = max(0.1, abs(b - a) / 5)
            for i in range(1, 100):
                new_a = a - i * step_size
                new_b = b + i * step_size
                try:
                    if safe_eval(f, new_a) * fa < 0:
                        suggestion = f" Hint: A sign change was detected near [{new_a:.2f}, {a:.2f}]."
                        break
                    if safe_eval(f, new_b) * fb < 0:
                        suggestion = f" Hint: A sign change was detected near [{b:.2f}, {new_b:.2f}]."
                        break
                except ValueError:
                    continue
            raise ValueError(
                f"f(a) and f(b) must have opposite signs to guarantee a root in [a, b].{suggestion}"
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
            fc  = safe_eval(f, c)
            fa  = safe_eval(f, a)

            error = abs(c - c_prev)
            ea = abs((c - c_prev) / c) * 100 if c != 0 else 0.0

            iterations.append({
                "iter":  it,
                "a":     round(a,  6),
                "b":     round(b,  6),
                "x":     round(c,  6),
                "f_x":   round(fc, 6),
                "error": round(error, 6),
                "ea":    round(ea, 6),
            })

            steps.append(
                f"Iteration {it}: a = {a:.6f}, b = {b:.6f}, "
                f"c = (a+b)/2 = {c:.6f}, f(c) = {fc:.6f}, |error| = {error:.6f}, Ea = {ea:.4f}%"
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
