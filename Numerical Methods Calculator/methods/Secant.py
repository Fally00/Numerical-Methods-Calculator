from flask import Blueprint, request, jsonify
from sympy import symbols, sympify, lambdify
import re

bp = Blueprint("secant", __name__)

_x = symbols("x")


def _preprocess_func(expr: str) -> str:
    expr = re.sub(r"\bln\s*\(", "log(", expr)
    expr = re.sub(r"\barcsin\s*\(", "asin(", expr)
    expr = re.sub(r"\barccos\s*\(", "acos(", expr)
    expr = re.sub(r"\barctan\s*\(", "atan(", expr)
    expr = re.sub(r"\btg\s*\(", "tan(", expr)
    expr = re.sub(r"\blg\s*\(", "log(", expr)
    expr = re.sub(r"\be\b", "E", expr)
    return expr.replace("^", "**")


def secant_method(params: dict) -> dict:
    try:
        func_str = params.get("function")
        x0 = params.get("x0")
        x1 = params.get("x1")
        tol = float(params.get("tolerance", 1e-5))
        max_iter = int(params.get("max_iter", 100))

        if func_str is None:
            raise ValueError("Parameter 'function' is required.")
        if x0 is None or x1 is None:
            raise ValueError("Parameters 'x0' and 'x1' are required.")
        if max_iter <= 0:
            raise ValueError("'max_iter' must be a positive integer.")

        x_prev = float(x0)
        x_curr = float(x1)

        expr = sympify(_preprocess_func(func_str))
        f = lambdify(_x, expr, "math")

        steps = [
            f"Parsed function: f(x) = {expr}",
            f"Initial guesses: x0 = {x_prev}, x1 = {x_curr}",
        ]
        iterations = []
        converged = False
        last_x = x_curr

        for it in range(1, max_iter + 1):
            f_prev = f(x_prev)
            f_curr = f(x_curr)
            denominator = f_curr - f_prev

            if abs(denominator) < 1e-15:
                raise ValueError(
                    f"Zero denominator encountered at iteration {it}. "
                    "Choose different starting guesses."
                )

            x_next = x_curr - (f_curr * (x_curr - x_prev)) / denominator
            f_next = f(x_next)
            error = abs(x_next - x_curr)

            iterations.append(
                {
                    "iter": it,
                    "x_prev": round(x_prev, 6),
                    "x_curr": round(x_curr, 6),
                    "x_next": round(x_next, 6),
                    "f_x": round(f_next, 6),
                    "error": round(error, 6),
                }
            )

            steps.append(
                f"Iteration {it}: x_prev = {x_prev:.6f}, x_curr = {x_curr:.6f}, "
                f"x_next = {x_next:.6f}, f(x_next) = {f_next:.6f}, |error| = {error:.6f}"
            )

            last_x = x_next
            if error < tol or abs(f_next) < tol:
                converged = True
                steps.append(
                    f"Converged after {it} iterations. Root ~= {x_next:.6f}"
                )
                break

            x_prev, x_curr = x_curr, x_next
        else:
            steps.append(
                f"Reached maximum iterations ({max_iter}). Best estimate: {last_x:.6f}"
            )

        result = {
            "root": round(last_x, 6),
            "f_root": round(f(last_x), 6),
            "converged": converged,
            "iterations_taken": len(iterations),
        }

        return {
            "success": True,
            "result": result,
            "steps": steps,
            "iterations": iterations,
        }

    except Exception as exc:
        return {"success": False, "error": str(exc)}


@bp.route("/api/secant", methods=["POST"])
def handle_secant():
    params = request.get_json(force=True, silent=True) or {}
    return jsonify(secant_method(params))
