#False_position.py
#Omar al basouny

from flask import Blueprint, request, jsonify
from sympy import symbols, sympify, lambdify
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application
import re
import math

bp = Blueprint("false_position", __name__)

_x = symbols("x")


def _preprocess_func(s: str) -> str:
    """Normalize user-typed math notation to SymPy-compatible syntax."""
    s = re.sub(r'\bln\s*\(', 'log(', s)
    s = re.sub(r'\barcsin\s*\(', 'asin(', s)
    s = re.sub(r'\barccos\s*\(', 'acos(', s)
    s = re.sub(r'\barctan\s*\(', 'atan(', s)
    s = re.sub(r'\btg\s*\(', 'tan(', s)
    s = re.sub(r'\blg\s*\(', 'log(', s)
    s = re.sub(r'\be\b', 'E', s)   # bare e → SymPy E
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

def false_position_method(params: dict) -> dict:
    
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
        xs_prev    = a          # previous estimate (for error on iter > 1)
        xs         = a          # will be overwritten on first iteration
        stag       = 0          # consecutive stagnation counter

        for it in range(1, max_iter + 1):
            fa = safe_eval(f, a)
            fb = safe_eval(f, b)

            if abs(fb - fa) < 1e-15:
                raise ValueError(f"Iteration {it} failed: Division by zero (f(b) ≈ f(a)). Method diverges.")

            # False Position (Regula Falsi) formula
            xs   = (a * fb - b * fa) / (fb - fa)
            fxs  = safe_eval(f, xs)
            error = abs(xs - xs_prev)
            ea = abs((xs - xs_prev) / xs) * 100 if xs != 0 else 0.0

            iterations.append({
                "iter":  it,
                "a":     round(a,   6),
                "b":     round(b,   6),
                "x":     round(xs,  6),
                "f_x":   round(fxs, 6),
                "error": round(error, 6),
                "ea":    round(ea, 6),
            })

            steps.append(
                f"Iteration {it}: a = {a:.6f}, b = {b:.6f}, "
                f"xs = {xs:.6f}, f(xs) = {fxs:.6f}, |error| = {error:.6f}, Ea = {ea:.4f}%"
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
            if fa * fxs < 0:
                b = xs          # root lies in [a, xs]
                steps.append(f"  => f(a)*f(xs) < 0 => new interval: [{a:.6f}, {xs:.6f}]")
            else:
                a = xs          # root lies in [xs, b]
                steps.append(f"  => f(a)*f(xs) >= 0 => new interval: [{xs:.6f}, {b:.6f}]")

            xs_prev = xs
        else:
            steps.append(
                f"Reached maximum iterations ({max_iter}). "
                f"Best estimate: xs ≈ {xs:.6f}"
            )

        result = {
            "root":             round(xs, 6),
            "f_root":           round(f(xs), 6),
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

@bp.route("/api/false_position", methods=["POST"])
def handle_false_position():
    params = request.get_json(force=True, silent=True) or {}
    return jsonify(false_position_method(params))
