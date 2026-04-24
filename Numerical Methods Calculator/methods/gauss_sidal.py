# gauss_seidal.py
# Tamim khaled

from flask import Blueprint, request, jsonify
import numpy as np

bp = Blueprint("gauss_seidel", __name__)


def gauss_seidel_method(params: dict) -> dict:
    try:
        A        = params.get("A")
        b        = params.get("b")
        x0       = params.get("x0")
        tol      = float(params.get("tolerance", 1e-6))
        max_iter = int(params.get("max_iter", 100))

        if A is None or b is None:
            raise ValueError("Parameters 'A' and 'b' are required.")

        A  = np.array(A,  dtype=float)
        b  = np.array(b,  dtype=float)
        x  = np.array(x0, dtype=float) if x0 is not None else np.zeros(len(b))

        n = len(b)
        steps = []
        iterations = []

        steps.append(f"Starting Gauss-Seidel with tolerance={tol}, max_iter={max_iter}")
        steps.append(f"Initial guess x0 = {x.tolist()}")

        converged = False
        stag = 0
        for iteration in range(max_iter):
            x_old = x.copy()
            x_new = x.copy()

            for i in range(n):
                sum1 = sum(A[i][j] * x_new[j] for j in range(i))
                sum2 = sum(A[i][j] * x_old[j] for j in range(i + 1, n))
                x_new[i] = (b[i] - sum1 - sum2) / A[i][i]

            error = float(np.linalg.norm(x_new - x_old, ord=np.inf))

            iterations.append({
                "iter":  iteration + 1,
                "x_old": [round(float(v), 6) for v in x_old],
                "x_new": [round(float(v), 6) for v in x_new],
                "error": round(error, 8),
            })

            steps.append(
                f"Iter {iteration + 1}: x = {[round(float(v), 6) for v in x_new]}  |  max|error| = {error:.8f}"
            )

            x = x_new

            if error < tol:
                converged = True
                steps.append(f"Converged after {iteration + 1} iterations.")
                break

            # Stagnation guard
            if error < 1e-12:
                stag += 1
                if stag >= 2:
                    converged = True
                    steps.append(f"Stopped at iteration {iteration + 1}: solution stagnated (|error| < 1e-12).")
                    break
            else:
                stag = 0
        else:
            steps.append(f"Did not converge within {max_iter} iterations.")

        result = {
            "solution":        [round(float(v), 6) for v in x],
            "converged":       converged,
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


@bp.route("/api/gauss_seidel", methods=["POST"])
def handle_gauss_seidel():
    params = request.get_json(force=True, silent=True) or {}
    return jsonify(gauss_seidel_method(params))