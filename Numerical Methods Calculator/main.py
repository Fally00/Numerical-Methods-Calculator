from flask                    import Flask, jsonify, render_template

from methods.Secant           import bp as secant_bp
from methods.jacobi           import bp as jacobi_bp
from methods.false_position   import bp as fp_bp
from methods.bisection        import bp as bisect_bp
from methods.doolittle        import bp as doolittle_bp
from methods.gauss_sidal      import bp as gauss_seidel_bp
from methods.Newton           import bp as newton_bp
from methods.Newton_Backward  import bp as newton_backward_bp
from methods.Newton_Forward   import bp as newton_forward_bp
from methods.Thomas_Algorithm import bp as thomas_algorithm_bp


app = Flask(__name__)

# ── Register blueprints ─────────────────────────────────────────────────────────
app.register_blueprint(fp_bp)
app.register_blueprint(jacobi_bp)
app.register_blueprint(bisect_bp)
app.register_blueprint(newton_bp)
app.register_blueprint(secant_bp)
app.register_blueprint(doolittle_bp)
app.register_blueprint(gauss_seidel_bp)
app.register_blueprint(newton_forward_bp)
app.register_blueprint(newton_backward_bp)
app.register_blueprint(thomas_algorithm_bp)


# ── Health check / route index ──────────────────────────────────────────────────
@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True)
