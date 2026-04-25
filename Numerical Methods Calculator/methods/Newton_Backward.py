from flask import Blueprint, request, jsonify
import math
import re

bp = Blueprint("newton_backward", __name__)


def _parse_numeric_sequence(values, label: str) -> list[float]:
    if values is None:
        raise ValueError(f"Parameter '{label}' is required.")

    if isinstance(values, str):
        tokens = [token for token in re.split(r"[\s,]+", values.strip()) if token]
    else:
        tokens = values

    if not tokens:
        raise ValueError(f"Parameter '{label}' cannot be empty.")

    try:
        return [float(value) for value in tokens]
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Parameter '{label}' must contain only numeric values.") from exc


def _validate_dataset(x_values: list[float], y_values: list[float]) -> float:
    if len(x_values) != len(y_values):
        raise ValueError("'x_values' and 'y_values' must have the same length.")
    if len(x_values) < 2:
        raise ValueError("At least two data points are required.")

    h = x_values[1] - x_values[0]
    if abs(h) < 1e-12:
        raise ValueError("x values must be distinct.")

    for idx in range(1, len(x_values) - 1):
        step = x_values[idx + 1] - x_values[idx]
        if abs(step - h) > 1e-9 * max(1.0, abs(h)):
            raise ValueError("Newton Backward requires equally spaced x values.")

    return h


def build_backward_difference_table(y_values: list[float]) -> list[list[float]]:
    n = len(y_values)
    table = [[0.0 for _ in range(n)] for _ in range(n)]

    for row, value in enumerate(y_values):
        table[row][0] = value

    for col in range(1, n):
        for row in range(col, n):
            table[row][col] = table[row][col - 1] - table[row - 1][col - 1]

    return table


def newton_backward_method(params: dict) -> dict:
    try:
        x_values = _parse_numeric_sequence(params.get("x_values"), "x_values")
        y_values = _parse_numeric_sequence(params.get("y_values"), "y_values")
        x_query = params.get("x_query")

        if x_query is None:
            raise ValueError("Parameter 'x_query' is required.")

        x_query = float(x_query)
        h = _validate_dataset(x_values, y_values)
        table = build_backward_difference_table(y_values)

        p = (x_query - x_values[-1]) / h
        value = table[-1][0]

        steps = [
            "Using Newton Backward interpolation.",
            f"Points loaded: {len(x_values)}",
            f"h = x1 - x0 = {h:.6f}",
            f"p = (x - xn) / h = ({x_query:.6f} - {x_values[-1]:.6f}) / {h:.6f} = {p:.6f}",
            f"Term 0: yn = {table[-1][0]:.6f}",
        ]
        iterations = [
            {
                "term": 0,
                "factor": 1.0,
                "difference": round(table[-1][0], 6),
                "contribution": round(table[-1][0], 6),
                "partial": round(value, 6),
            }
        ]

        p_product = 1.0
        last_row = len(x_values) - 1
        for order in range(1, len(x_values)):
            p_product *= p + (order - 1)
            factor = p_product / math.factorial(order)
            difference = table[last_row][order]
            contribution = factor * difference
            value += contribution

            steps.append(
                f"Term {order}: coeff = {factor:.6f}, diff = {difference:.6f}, "
                f"contribution = {contribution:.6f}, partial = {value:.6f}"
            )
            iterations.append(
                {
                    "term": order,
                    "factor": round(factor, 6),
                    "difference": round(difference, 6),
                    "contribution": round(contribution, 6),
                    "partial": round(value, 6),
                }
            )

        rounded_table = [
            [round(cell, 6) for cell in row]
            for row in table
        ]

        return {
            "success": True,
            "result": {
                "value": round(value, 6),
                "p": round(p, 6),
                "h": round(h, 6),
                "x_query": round(x_query, 6),
            },
            "steps": steps,
            "iterations": iterations,
            "difference_table": rounded_table,
            "x_values": [round(value, 6) for value in x_values],
            "table_mode": "backward",
        }

    except Exception as exc:
        return {"success": False, "error": str(exc)}


@bp.route("/api/newton_backward", methods=["POST"])
def handle_newton_backward():
    params = request.get_json(force=True, silent=True) or {}
    return jsonify(newton_backward_method(params))
