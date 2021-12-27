from flask import Flask, request, send_from_directory

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
    return send_from_directory('pzprjs/dist', path)


@app.route("/api/list", methods=['GET'])
def puzzle_list():
    return {'puzzles': solvers.puzzle_list()}


@app.route("/api/solve", methods=['POST'])
def solve():
    pzprv3 = request.json['pzprv3']
    result = solvers.solve(pzprv3)
    return {'pzprv3': result}
