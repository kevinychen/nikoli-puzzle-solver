from flask import abort, Flask, request, send_from_directory, send_file

import solvers

app = Flask(__name__)


@app.route("/")
def root():
    return send_file('index.html')


@app.route("/app.js")
def js():
    return send_file('app.js')


@app.route("/favicon.ico")
def favicon():
    return send_file('favicon.ico')


@app.route("/<path:path>")
def pzprjs(path):
    return send_from_directory('pzprjs/dist', path)


@app.route("/api/list", methods=['GET'])
def puzzle_list():
    return {'puzzles': solvers.puzzle_list()}


@app.route("/api/solve", methods=['POST'])
def solve():
    try:
        return {'pzprv3': solvers.solve(request.json['pzprv3'], request.json['different_from'])}
    except TimeoutError as e:
        abort(e.args[0])
