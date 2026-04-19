# doolittle.py
#Abdelrahman Hany

from flask import Blueprint, request, jsonify

bp = Blueprint("doolittle", __name__)

def doolittle_method(params: dict) -> dict:
    try:
        A = params.get("A")
        b = params.get("b")

        if A is None or b is None:
            raise ValueError("Parameters 'A' and 'b' are required.")

        n = len(A)
        if any(len(row) != n for row in A):
            raise ValueError("Matrix A must be square.")

        # Flatten b if it's a list of lists e.g., [[24], [2], [16]]
        if b and isinstance(b[0], list):
            b = [item[0] for item in b]

        if len(b) != n:
            raise ValueError("Vector b length must match the dimensions of Matrix A.")

        steps = []
        
        # Initialize L and U
        L = [[0.0] * n for _ in range(n)]
        U = [[0.0] * n for _ in range(n)]
        
        # Doolittle method requires L to have 1s on the diagonal
        for i in range(n):
            L[i][i] = 1.0

        steps.append("Initial state:")
        steps.append(f"A = {A}")
        steps.append(f"b = {b}")

        # LU Decomposition
        for i in range(n):
            steps.append(f"--- Processing Row/Column {i} ---")
            
            # Form the Upper Triangular matrix (U)
            for k in range(i, n):
                sum_u = sum(L[i][j] * U[j][k] for j in range(i))
                U[i][k] = A[i][k] - sum_u
                steps.append(f"U[{i}][{k}] = {A[i][k]} - {sum_u:.4f} = {U[i][k]:.4f}")

            # Form the Lower Triangular matrix (L)
            for k in range(i + 1, n):
                if U[i][i] == 0:
                    raise ValueError(f"Zero division error at U[{i}][{i}], factorization failed.")
                sum_l = sum(L[k][j] * U[j][i] for j in range(i))
                L[k][i] = (A[k][i] - sum_l) / U[i][i]
                steps.append(f"L[{k}][{i}] = ({A[k][i]} - {sum_l:.4f}) / {U[i][i]:.4f} = {L[k][i]:.4f}")

        steps.append("--- LU Decomposition Complete ---")
        steps.append(f"L = {[[round(val, 4) for val in row] for row in L]}")
        steps.append(f"U = {[[round(val, 4) for val in row] for row in U]}")

        # Forward Substitution (L * V = b)
        steps.append("--- Forward Substitution (L * V = b) ---")
        V = [0.0] * n
        for i in range(n):
            sum_v = sum(L[i][j] * V[j] for j in range(i))
            V[i] = b[i] - sum_v
            steps.append(f"V[{i}] = {b[i]} - {sum_v:.4f} = {V[i]:.4f}")

        # Backward Substitution (U * X = V)
        steps.append("--- Backward Substitution (U * X = V) ---")
        X = [0.0] * n
        for i in range(n - 1, -1, -1):
            sum_x = sum(U[i][j] * X[j] for j in range(i + 1, n))
            X[i] = (V[i] - sum_x) / U[i][i]
            steps.append(f"X[{i}] = ({V[i]:.4f} - {sum_x:.4f}) / {U[i][i]:.4f} = {X[i]:.4f}")

        result = {
            "L": [[round(val, 6) for val in row] for row in L],
            "U": [[round(val, 6) for val in row] for row in U],
            "V": [round(val, 6) for val in V],
            "X": [round(val, 6) for val in X]
        }

        return {
            "success": True,
            "result": result,
            "steps": steps
        }

    except Exception as exc:
        return {"success": False, "error": str(exc)}

@bp.route("/api/doolittle", methods=["POST"])
def handle_doolittle():
    params = request.get_json(force=True, silent=True) or {}
    return jsonify(doolittle_method(params))
