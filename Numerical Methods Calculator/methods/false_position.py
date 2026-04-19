from flask import Blueprint, request, jsonify
from sympy import symbols, sympify, lambdify

bp = Blueprint("false_position", __name__)

_x = symbols("x")


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

        # ── Parse function safely with SymPy ───────────────────────────────────
        expr = sympify(func_str)
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
        xs_prev    = a          # previous estimate (for error on iter > 1)
        xs         = a          # will be overwritten on first iteration

        for it in range(1, max_iter + 1):
            fa = f(a)
            fb = f(b)

            # False Position (Regula Falsi) formula
            xs   = (a * fb - b * fa) / (fb - fa)
            fxs  = f(xs)
            error = abs(xs - xs_prev)

            iterations.append({
                "iter":  it,
                "a":     round(a,   6),
                "b":     round(b,   6),
                "x":     round(xs,  6),
                "f_x":   round(fxs, 6),
                "error": round(error, 6),
            })

            steps.append(
                f"Iteration {it}: a = {a:.6f}, b = {b:.6f}, "
                f"xs = {xs:.6f}, f(xs) = {fxs:.6f}, |error| = {error:.6f}"
            )

            # Convergence check (skip iteration 1 — no meaningful prior estimate)
            if it > 1 and error < tol:
                steps.append(
                    f"Converged after {it} iterations (|error| = {error:.6f} < {tol})."
                )
                break

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
