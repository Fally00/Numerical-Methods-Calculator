# Thomas_Algorithm.py
# Jomana Elmotaz

from flask import Blueprint, request, jsonify

bp = Blueprint("thomas", __name__)


def thomas_method(params: dict) -> dict:
    try:
        a = params.get("a")
        b = params.get("b")
        c = params.get("c")
        d = params.get("d")

        if b is None or d is None:
            raise ValueError("Parameters 'b' (main diagonal) and 'd' (RHS) are required.")

        b = [float(v) for v in b]
        d = [float(v) for v in d]
        a = [float(v) for v in a] if a else []
        c = [float(v) for v in c] if c else []

        n = len(b)

        if len(d) != n:
            raise ValueError("Lengths of 'b' and 'd' must match.")
        if len(a) not in (0, n - 1):
            raise ValueError(f"Lower diagonal 'a' must have {n - 1} elements.")
        if len(c) not in (0, n - 1):
            raise ValueError(f"Upper diagonal 'c' must have {n - 1} elements.")

        # Pad a and c to length n with 0s for uniform indexing
        a_full = [0.0] + list(a)   # a_full[0] unused
        c_full = list(c) + [0.0]   # c_full[n-1] unused

        steps = []
        steps.append(f"System size: n = {n}")
        steps.append(f"a (sub-diag)   = {a}")
        steps.append(f"b (main diag)  = {b}")
        steps.append(f"c (super-diag) = {c}")
        steps.append(f"d (RHS)        = {d}")

        # Forward sweep — modify b and d in-place copies
        b_mod = b[:]
        d_mod = d[:]

        steps.append("--- Forward Sweep ---")
        for i in range(1, n):
            if b_mod[i - 1] == 0:
                raise ValueError(f"Zero pivot at position {i - 1}. Thomas Algorithm cannot continue.")
            w = a_full[i] / b_mod[i - 1]
            b_mod[i] = b_mod[i] - w * c_full[i - 1]
            d_mod[i] = d_mod[i] - w * d_mod[i - 1]
            steps.append(
                f"  i={i}: w = {a_full[i]:.4f}/{b_mod[i-1]:.4f} = {w:.4f}, "
                f"b[{i}] = {b_mod[i]:.4f}, d[{i}] = {d_mod[i]:.4f}"
            )

        # Back substitution
        steps.append("--- Back Substitution ---")
        X = [0.0] * n
        X[n - 1] = d_mod[n - 1] / b_mod[n - 1]
        steps.append(f"  x[{n-1}] = {d_mod[n-1]:.4f} / {b_mod[n-1]:.4f} = {X[n-1]:.4f}")

        for i in range(n - 2, -1, -1):
            X[i] = (d_mod[i] - c_full[i] * X[i + 1]) / b_mod[i]
            steps.append(
                f"  x[{i}] = ({d_mod[i]:.4f} - {c_full[i]:.4f} * {X[i+1]:.4f}) / {b_mod[i]:.4f} = {X[i]:.4f}"
            )

        result = {
            "X": [round(v, 6) for v in X],
        }

        return {
            "success": True,
            "result":  result,
            "steps":   steps,
        }

    except Exception as exc:
        return {"success": False, "error": str(exc)}


@bp.route("/api/thomas", methods=["POST"])
def handle_thomas():
    params = request.get_json(force=True, silent=True) or {}
    return jsonify(thomas_method(params))
