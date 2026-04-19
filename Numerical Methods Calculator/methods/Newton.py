# newton_raphson.py
# Omar Tarek

from flask import Blueprint, request, jsonify
import math

bp = Blueprint("newton", __name__)

def newton_raphson(params: dict) -> dict:
    try:
        func_str  = params["func"]
        dfunc_str = params["dfunc"]
        x         = float(params["x0"])
        tol       = float(params["tol"])
        max_iter  = int(params["max_iter"])

        def f(val):
            return eval(func_str,  {"x": val, "math": math, **vars(math)})

        def df(val):
            return eval(dfunc_str, {"x": val, "math": math, **vars(math)})

        steps = []
        iterations = []

        for i in range(max_iter):
            fx  = f(x)
            dfx = df(x)

            if dfx == 0:
                return {"success": False, "error": f"Derivative is zero at x = {x}. Cannot continue."}

            x_new = x - fx / dfx
            error = abs(x_new - x)

            steps.append(
                f"Iter {i+1}: x{i} = {x:.6f}, f(x{i}) = {fx:.6f}, "
                f"f'(x{i}) = {dfx:.6f}, x{i+1} = {x_new:.6f}, |error| = {error:.6f}"
            )
            iterations.append({"iter": i + 1, "x": x_new, "fx": f(x_new), "error": error})

            x = x_new

            if error < tol:
                steps.append(f"Converged after {i+1} iterations. Root ≈ {x:.6f}")
                break
        else:
            steps.append("Warning: did not converge within max iterations.")

        return {
            "success": True,
            "result": round(x, 6),
            "steps": steps,
            "iterations": iterations
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


# ── Flask Blueprint ─────────────────────────────────────────────────────────────

@bp.route("/api/newton", methods=["POST"])
def handle_newton():
    params = request.get_json(force=True, silent=True) or {}
    return jsonify(newton_raphson(params))


# ---------- quick local test ----------
if __name__ == "__main__":
    result = newton_raphson({
        "func":     "x**4 - 11*x + 8",
        "dfunc":    "4*x**3 - 11",
        "x0":       2,
        "tol":      1e-5,
        "max_iter": 100
    })
    print("Result:", result["result"])
    for s in result["steps"]:
        print(s)