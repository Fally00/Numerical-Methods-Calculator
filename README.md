# Numerical Methods Calculator

A web-based calculator for numerical methods built with **Flask** (backend) and **HTML/CSS/JS** (frontend). Supports 7 methods covering root-finding, linear systems, and interpolation — each with step-by-step solution display and iteration tables.

---

## Features

- 7 numerical methods, each on its own dedicated panel
- Step-by-step solution breakdown for every method
- Iteration tables with per-step values and error tracking
- Input validation with inline error messages
- Warm, clean UI with a responsive sidebar layout

---

## Methods

| # | Method | Category | Route |
|---|--------|----------|-------|
| 1 | Bisection | Root-finding | `POST /api/bisection` |
| 2 | False Position (Regula Falsi) | Root-finding | `POST /api/false_position` |
| 3 | Newton-Raphson | Root-finding | `POST /api/newton` |
| 4 | Doolittle (LU Decomposition) | Linear systems | `POST /api/doolittle` |
| 5 | Gauss-Seidel | Linear systems | `POST /api/gauss_seidel` |
| 6 | Jacobi Iteration | Linear systems | `POST /api/jacobi` |
| 7 | Thomas Algorithm | Linear systems | `POST /api/thomas` |

---

## Project Structure

```
project/
├── main.py                   # Flask app entry point, blueprint registration
├── methods/
│   ├── __init__.py
│   ├── bisection.py          # Bisection method
│   ├── false_position.py     # False Position method
│   ├── Newton.py             # Newton-Raphson method
│   ├── doolittle.py          # Doolittle LU Decomposition
│   ├── gauss_sidal.py        # Gauss-Seidel iteration
│   ├── jacobi.py             # Jacobi iteration
│   └── Thomas_Algorithm.py  # Thomas Algorithm
├── templates/
│   └── index.html            # Single-page frontend
└── static/
    ├── style.css             # Styles
    └── script.js             # Form handlers, API calls, result rendering
```

---

## Setup & Running

### Prerequisites

- Python 3.10+
- pip

### Install dependencies

```bash
pip install flask sympy numpy
```

### Run the app

```bash
python main.py
```

Then open your browser at `http://127.0.0.1:5000`

---

## API Reference

All endpoints accept `POST` requests with a `Content-Type: application/json` body.

Every endpoint returns the same base structure:

```json
{
  "success": true,
  "result": { ... },
  "steps": ["step 1 ...", "step 2 ...", "..."],
  "iterations": [ { "iter": 1, ... } ]
}
```

On failure:
```json
{
  "success": false,
  "error": "description of what went wrong"
}
```

---

### POST `/api/bisection`

Find the root of f(x) on interval [a, b].

**Body:**
```json
{
  "function":  "x**3 - x - 2",
  "a":         1,
  "b":         2,
  "tolerance": 0.001,
  "max_iter":  100
}
```

**Result fields:** `root`, `f_root`, `converged`, `iterations_taken`

---

### POST `/api/false_position`

Find the root of f(x) using the Regula Falsi formula.

**Body:**
```json
{
  "function":  "x**3 - x - 2",
  "a":         1,
  "b":         2,
  "tolerance": 0.001,
  "max_iter":  100
}
```

**Result fields:** `root`, `f_root`, `converged`, `iterations_taken`

---

### POST `/api/newton`

Find the root of f(x) using Newton-Raphson (requires the derivative).

**Body:**
```json
{
  "func":     "x**4 - 11*x + 8",
  "dfunc":    "4*x**3 - 11",
  "x0":       2,
  "tol":      1e-5,
  "max_iter": 100
}
```

**Result fields:** `result` (the root as a number)

---

### POST `/api/doolittle`

Solve Ax = b using Doolittle LU Decomposition.

**Body:**
```json
{
  "A": [[2, 1, -1], [-3, -1, 2], [-2, 1, 2]],
  "b": [8, -11, -3]
}
```

**Result fields:** `L`, `U`, `V`, `X` (solution vector)

---

### POST `/api/gauss_seidel`

Solve Ax = b iteratively using Gauss-Seidel.

**Body:**
```json
{
  "A":         [[10, -1, 2], [-1, 11, -1], [2, -1, 10]],
  "b":         [6, 25, -11],
  "x0":        [0, 0, 0],
  "tolerance": 1e-6,
  "max_iter":  100
}
```

**Result fields:** `solution`, `converged`, `iterations_taken`

---

### POST `/api/jacobi`

Solve Ax = b iteratively using Jacobi. Rows are automatically rearranged for diagonal dominance.

**Body:**
```json
{
  "A":         [[10, -1, 2], [-1, 11, -1], [2, -1, 10]],
  "b":         [6, 25, -11],
  "x0":        [0, 0, 0],
  "tolerance": 0.001,
  "max_iter":  100
}
```

**Result fields:** `solution`, `converged`, `iterations_taken`, `dominance_checks`

---

### POST `/api/thomas`

Solve a tridiagonal system using the Thomas Algorithm.

**Body:**
```json
{
  "a": [1, 1],
  "b": [4, 4, 4],
  "c": [1, 1],
  "d": [5, 5, 5]
}
```

- `a` — lower diagonal (n-1 values)
- `b` — main diagonal (n values)
- `c` — upper diagonal (n-1 values)
- `d` — right-hand side (n values)

**Result fields:** `X` (solution vector)

---

## Frontend — Matrix Input Format

For methods that take a matrix (Doolittle, Gauss-Seidel, Jacobi), the UI accepts a human-readable string format using `/` as a row separator:

```
2 1 -1 / -3 -1 2 / -2 1 2
```

This is parsed in JavaScript into a 2D array before being sent to the API.

---

## Team

| Method | Developer |
|--------|-----------|
| Bisection | Rayan Hisham |
| False Position | Rayan Hisham |
| Newton-Raphson | Omar Tarek |
| Doolittle | Abdelrahman Hany |
| Gauss-Seidel | Tamim Khaled |
| Jacobi | Haneen Elsayed |
| Thomas Algorithm | Jomana Elmotaz |

---

## Course

Advanced Numerical Methods — Faculty of Artificial Intelligence, Horus University
