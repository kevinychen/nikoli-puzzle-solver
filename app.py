from flask import Flask, request, Response
import solvers

app = Flask(__name__)


@app.route("/")
def root():
    with open('index.html', 'r') as file:
        return file.read()


@app.route("/app.js")
def js():
    with open('app.js', 'r') as file:
        return file.read()


@app.route("/<path:path>")
def pzprjs(path):
    if path.endswith('.js'):
        mimetype = 'application/javascript'
    elif path.endswith('.css'):
        mimetype = 'text/css'
    else:
        mimetype = 'text/html'
    with open('pzprjs/dist/' + path) as file:
        return Response(file.read(), mimetype=mimetype)


@app.route("/api/list", methods=['GET'])
def puzzle_list():
    return {'puzzles': solvers.puzzle_list()}


@app.route("/api/solve", methods=['POST'])
def solve():
    pzprv3 = request.json['pzprv3']
    result = solvers.solve(pzprv3)
    if result is None:
        return {'pzprv3': pzprv3}
    return {'pzprv3': result}
